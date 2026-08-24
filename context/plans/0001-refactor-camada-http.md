# Plano de execução: refatorar e desduplicar a camada `app/Http/`

**Status:** Proposto
**Data:** 2026-08-24
**Relacionado:** [ADR 0001 — Hybrid REST/JSON API](../adr/0001-hybrid-rest-api.md)

## Contexto

A API híbrida (ADR 0001) acertou o ponto central: a **regra de negócio** vive numa única
camada de Service (`App\Services\*`), consumida tanto pelos controllers Inertia quanto pelos
de API. O que ficou duplicado é tudo que envolve o Service: **validação, serialização,
tratamento de erro e checagem de papel** estão copiados dentro de cada controller (web e API).

Este plano encapsula essas quatro peças em lugares únicos, **sem fundir os controllers** — a
API continua sendo uma camada de apresentação separada. O princípio que guia cada passo:

> Manter a API separada = manter os *controllers* separados (portas de entrada distintas).
> Validação, formatação e erros não são "da API" nem "do web" — são peças neutras que as duas
> portas compartilham. Hoje estão copiadas; o objetivo é ter uma cópia só.

Precedentes que já existem no código e que este plano só generaliza:
- `NecessidadeRequest` (FormRequest) já é usado pelos **dois** lados
  (`NecessidadeController` web e `Api\NecessidadeController`) — prova de que FormRequest é
  guard-agnóstico.
- `Api\Instituicao\AgendaController` já reusa `HorarioResource`/`TransferenciaResource`
  (`->resolve()`), enquanto o `Instituicao\AgendaController` web reconstrói o mesmo shape inline.

## Ordem de execução (por risco/impacto)

| Fase | O quê | Impacto | Risco | Toca frontend? |
|------|-------|---------|-------|----------------|
| 1 | FormRequests para transferência/horário/sugestão/avaliação | Alto | Baixo | Não |
| 2 | Base `DomainException` + render central no handler | Médio | Baixo | Não |
| 3 | Um middleware `EnsureUserType` no lugar de 3 | Médio | Baixo | Não |
| 4 | Helpers no model `User` + constante de eager-load | Baixo | Baixo | Não |
| 5 | Web reusar os Resources em vez de `->map` inline | Alto | Médio | **Sim** (props Inertia) |

Fases 1–4 não tocam no frontend e são reversíveis com baixo risco — fazer primeiro.
Fase 5 encosta nas telas Inertia (formato das props) e exige verificação visual — fazer por último.

---

## Fase 1 — FormRequests para a validação inline duplicada

**Problema.** Blocos de `$request->validate([...])` idênticos aparecem nos dois lados:
- Transferência `store` (10 regras): `Instituicao/TransferenciaController.php:74-85` ≡ `Api/Instituicao/TransferenciaController.php:36-47`
- Horário `store` (4 regras): `Instituicao/HorarioController.php:44-49` ≡ `Api/HorarioController.php:34-39`
- Sugestão de data (`data_hora_sugerida`): repetida **4×** (agenda + transferência, web + API)
- Avaliação (`nota`/`descricao`): `Instituicao/AvaliacaoController.php:17-20` ≡ `Api/Instituicao/AvaliacaoController.php:21-24`

**Ação.** Criar FormRequests (espelhando o `StoreDoacaoRequest` já existente):
- `app/Http/Requests/Instituicao/StoreTransferenciaRequest.php`
- `app/Http/Requests/Instituicao/StoreHorarioRequest.php`
- `app/Http/Requests/Instituicao/SugerirDataRequest.php` (reusado por agenda **e** transferência — ambas validam só `data_hora_sugerida => ['required','date','after:now']`)
- `app/Http/Requests/Instituicao/StoreAvaliacaoRequest.php`

Cada FormRequest tem `authorize(): bool { return true; }` (autorização já é feita pelos
middlewares de papel na rota) e o `rules()` extraído. Trocar a assinatura dos 4 pares de
controllers para receber o FormRequest e chamar `$request->validated()`.

**Cuidado.** Os controllers web hoje devolvem os erros de validação via sessão (Inertia) e os
de API via JSON — isso **continua automático**: o handler em `bootstrap/app.php` já decide o
formato por `api/*`/`expectsJson()`. FormRequest não muda esse comportamento.

**Arquivos tocados.** 4 requests novos; edições em `Instituicao/TransferenciaController`,
`Api/Instituicao/TransferenciaController`, `Instituicao/HorarioController`, `Api/HorarioController`,
`Instituicao/AgendaController`, `Api/Instituicao/AgendaController`, `Instituicao/AvaliacaoController`,
`Api/Instituicao/AvaliacaoController`.

---

## Fase 2 — Base `DomainException` + render central

**Problema.** Os 4 controllers de API repetem o mesmo bloco:
```php
} catch (XException $e) {
    return response()->json(['message' => $e->getMessage()], 422);
}
```
em `Api/HorarioController`, `Api/DoacaoController`, `Api/NecessidadeController`,
`Api/Instituicao/TransferenciaController`.

**Ação.**
1. Criar `app/Exceptions/DomainException.php` (estende `RuntimeException`).
2. Fazer as 4 exceptions de domínio existentes estenderem-na, no lugar de `RuntimeException`
   direto: `DoacaoException`, `HorarioException`, `NecessidadeException`, `TransferenciaException`.
3. Em `bootstrap/app.php`, dentro de `withExceptions`, registrar **uma** regra:
   ```php
   $exceptions->render(function (DomainException $e, Request $request) {
       if ($request->is('api/*') || $request->expectsJson()) {
           return response()->json(['message' => $e->getMessage()], 422);
       }
       // web: deixa seguir para o comportamento atual (back()->with('error'))
   });
   ```
4. Remover os `try/catch` dos 4 controllers de API — a exception sobe e o handler formata.

**Cuidado.** O lado **web** não muda: continua fazendo `catch (...) { back()->with('error', ...) }`
localmente, porque a regra do handler só intercepta `api/*`/`expectsJson()`. Retornar `null` na
closure de render faz o Laravel cair no tratamento padrão, então os controllers web que ainda
têm `catch` seguem funcionando.

**Arquivos tocados.** 1 exception nova; 4 exceptions editadas; `bootstrap/app.php`; remoção de
`try/catch` em 4 controllers de API.

---

## Fase 3 — Um middleware `EnsureUserType` parametrizado

**Problema.** `CheckDoador`, `CheckInstituicao`, `CheckAdmin` têm **corpo idêntico** — só mudam
a string do papel e a mensagem. `CheckAdmin` ainda importa `Inertia\Middleware` sem usar (import
morto). As rotas referenciam os três por `::class` (sem alias) tanto em `routes/api.php` quanto
em `routes/web.php`.

**Ação.**
1. Criar `app/Http/Middleware/EnsureUserType.php`:
   ```php
   public function handle(Request $request, Closure $next, string $tipo): Response
   {
       if (auth()->check() && auth()->user()->tipo_usuario === $tipo) {
           return $next($request);
       }
       abort(403, "Acesso negado. Esta área é exclusiva para {$tipo}.");
   }
   ```
2. Registrar alias em `bootstrap/app.php` → `withMiddleware`:
   `$middleware->alias(['user_type' => EnsureUserType::class]);`
3. Trocar nas rotas: `CheckDoador::class` → `'user_type:doador'`, etc.
4. Apagar os 3 middlewares antigos.

**Cuidado.** `CheckNecessidadeOwnership` e `EnsureInstitutionIsApproved` **não** entram nesta
fase — não são checagem de papel simples (um valida posse de recurso, o outro status de
aprovação com ramo `api/*`). Ficam como estão.

**Arquivos tocados.** 1 middleware novo; `bootstrap/app.php`; `routes/api.php`; `routes/web.php`;
remoção de 3 middlewares.

---

## Fase 4 — Helpers no model `User` + constante de eager-load

**Problema menor, mas pervasivo.**
- `auth()->user()->instituicao->usuario_id` aparece em **~20 lugares** (web e API).
- Em `Api/Instituicao/TransferenciaController`, o array `['origem', 'destino', 'itens.categoria']`
  do `->fresh(...)` está repetido **8×**.

**Ação.**
1. No `app/Models/User.php`, adicionar acessor: `public function instituicaoId(): ?int`
   (retorna `$this->instituicao?->usuario_id`) e opcionalmente `doadorId()`. Substituir os usos.
2. Em `Api/Instituicao/TransferenciaController`, extrair a lista de relações para uma
   `private const RELATIONS = ['origem', 'destino', 'itens.categoria'];` e usar `->fresh(self::RELATIONS)`.

**Cuidado.** Puramente mecânico; nenhum comportamento muda. Fazer por último dentro do bloco de
fases "sem frontend" porque toca muitos arquivos (bom fazer depois que 1–3 já estabilizaram).

**Arquivos tocados.** `app/Models/User.php`; ~15 controllers (troca de expressão); 1 controller
para a constante.

---

## Fase 5 — Web reusar os Resources (maior redução de código, maior risco)

**Problema.** O shape de resposta está escrito **duas vezes**: como `->map(fn ...)` inline nos
controllers web e como Resource na API. O mapping de horário aparece inline em **5** controllers
web (`Horario`, `Agenda`, `Instituicao`, `Transferencia`, `Doacao`); o `serialize()` privado em
`Instituicao/TransferenciaController.php:156` é essencialmente o `TransferenciaResource`; e o
mapping de doação/agendamento se repete entre web e Resource.

**Ação (incremental, um shape por vez).** Fazer os controllers web devolverem
`(new XResource($model))->resolve()` (ou `XResource::collection($c)->resolve()`) como prop de
Inertia, em vez do `->map`. Resource **não é exclusivo da API** — `resolve()` devolve array PHP
comum. Já há precedente: o `Api\Instituicao\AgendaController` reusa `HorarioResource`/
`TransferenciaResource` exatamente assim.

**Diferenças de shape que precisam de parâmetro (não ignorar).** Algumas telas web mostram
campos que a API não tem — resolver com argumento opcional no Resource (como o
`DoadorPerfilResource` já faz com `$instituicaoId`):
- `HorarioResource`: web adiciona `pode_excluir`/`tem_doacoes_ativas` (ver
  `Instituicao/HorarioController.php:34`). Parametrizar ou expor via `whenLoaded`/`withExists`.
- `TransferenciaResource`: já calcula `direcao` a partir do usuário autenticado — bate com o
  web; validar que o web `serialize()` não diverge (o web usa `parceiro` como objeto
  `{usuario_id, nome_fantasia}`, o Resource também — conferir 1:1 antes de trocar).
- `AgendaController` web usa uma versão **reduzida** de transferência (`parceiro` como string,
  sem itens). Decidir: aceitar o shape mais rico do Resource no front, ou manter um Resource
  específico. **Não trocar sem alinhar com o componente Vue/React correspondente.**

**Cuidado (o motivo do risco Médio).** Cada troca muda o JSON que chega na página Inertia. Fazer
**um shape por commit**, e para cada um: abrir a tela no navegador e conferir que nada quebrou
(campo faltando, data em formato diferente). O ADR 0001 deliberadamente deixou os controllers web
como estavam justamente para não assumir esse risco — então aqui a disciplina de verificação
visual é obrigatória.

**Arquivos tocados.** ~5 controllers web (remoção dos `->map`); possivelmente 2–3 Resources
ganham parâmetro opcional; componentes de frontend **só** se um shape for alterado de propósito.

---

## Verificação (vale para todas as fases)

Reaproveitar o que já foi montado nesta linha de trabalho:

1. **Pré-requisito.** Garantir que `app/Services/DoacaoService.php` está restaurado (o merge
   `07d76a6` o havia zerado). Sem ele os testes de doação dão 500.
2. **Testes automatizados.** `php artisan test --filter=Api` — a suíte Pest em `tests/Feature/Api/`
   (33 testes / 114 asserts) cobre os endpoints refatorados. Rodar antes e depois de cada fase e
   comparar (mesma disciplina de A/B do ADR: zero novas falhas).
3. **Coleção Postman ponta a ponta.** Subir a app com banco isolado e rodar a coleção completa
   com newman:
   ```
   psql -c 'CREATE DATABASE impacta_eq05_test;'
   DB_DATABASE=impacta_eq05_test php artisan migrate:fresh --seed
   DB_DATABASE=impacta_eq05_test php artisan serve --port=8123 &
   newman run postman/EQ05-fluxos-por-papel.postman_collection.json --env-var base_url=http://localhost:8123
   ```
   Baseline atual: **77 requisições, 93 asserts, 0 falhas**. Qualquer regressão em status code
   (ex.: um 422 virar 500, ou o 201 do login mudar) aparece aqui na hora.
4. **Fase 5 — verificação visual.** Para cada shape trocado, abrir a tela Inertia correspondente
   (`instituicao/horarios`, `instituicao/agenda`, `instituicao/transferencias`,
   `instituicao/doacoes`, `doador/doacoes`) e conferir que os dados renderizam idênticos.

## Fora de escopo

- Mexer em `CheckNecessidadeOwnership` / `EnsureInstitutionIsApproved`.

