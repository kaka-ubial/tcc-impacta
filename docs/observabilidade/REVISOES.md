# Revisões de observabilidade

Registro dos ciclos de melhoria contínua: o que foi observado nos dashboards, o que
se investigou, o que se fez e qual foi o resultado medido.

Este documento é o único que **não pode ser escrito de uma vez**. Cada entrada
depende de dado acumulado ao longo de dias.

**Formato de cada entrada:** observação → hipótese → investigação → ação →
resultado medido. Conclusão de "não vamos mudar nada" é resultado válido, desde que
fundamentada — vale tanto quanto uma correção.

Cadência: revisão a cada duas semanas, mais qualquer investigação disparada por
alerta.

---

## Ciclo 001 — Latência p95 acima do objetivo

**Status:** 🔄 em investigação · aberto em 29/08/2026

### Observação

O painel *Latência p95* do dashboard **Impacta — Aplicação** apresentou 975 ms,
acima do objetivo de 800 ms definido no [SLO](SLO.md). O painel de percentis
mostrou p50 em 501 ms e p99 em 995 ms.

Chama atenção a proximidade entre p50 e p99: quando a cauda está próxima da mediana,
o problema costuma ser de ambiente, não de uma rota específica.

### Hipótese

Cold start da instância gratuita do Render, não lentidão da aplicação. O plano
gratuito desliga a instância após ~15 minutos sem tráfego, e a primeira requisição
depois disso paga o tempo de subida do container.

### Evidência preliminar

Chamada direta aos endpoints, com a instância já acordada:

| Ambiente | Tempo de resposta |
|---|---|
| dev | 0,49 s |
| test | 0,90 s |
| prod | 0,70 s |

Bem abaixo dos 975 ms observados no p95, o que é compatível com a hipótese: o valor
alto viria das primeiras requisições após ociosidade, não do estado normal.

### O que falta para concluir

- [ ] Acompanhar o p95 por 5 a 7 dias, comparando janelas com e sem tráfego contínuo
- [ ] Verificar se os picos coincidem com períodos de PC desligado (sem scrape → sem
      tráfego → hibernação → cold start no retorno)
- [ ] Conferir o painel *Rotas mais lentas* para descartar rota específica
- [ ] Se confirmada a hipótese: registrar como limitação do plano gratuito e ajustar
      o objetivo do SLO para refletir o ambiente real
- [ ] Se refutada: investigar consultas ao banco, começando pelas rotas do topo

### Resultado

_A preencher._

---

## Ciclo 002 — Tendência de duração do CI/CD

**Status:** 🔄 em observação · aberto em 29/08/2026

### Observação

A duração do workflow CI/CD na branch `develop` passou de 187 s para 211 s entre
execuções consecutivas — aumento de 13%.

### Hipótese

Ainda indefinida. Duas amostras não formam tendência. Possibilidades: variação
normal do runner do GitHub, crescimento da suíte de testes, ou aumento do tempo de
build da imagem Docker conforme o projeto cresce.

### O que falta para concluir

- [ ] Acumular pelo menos duas semanas de dado no dashboard **Impacta — Pipeline**
- [ ] Verificar se a subida é sustentada ou ruído
- [ ] Se sustentada: identificar qual etapa cresceu, comparando `tests` (~47 s) e
      `linter` (~49 s) com o CI/CD completo
- [ ] Confrontar com o objetivo de 4 minutos definido no [SLO](SLO.md)

### Resultado

_A preencher._

---

## Ciclo 000 — Instrumentação inicial

**Status:** ✅ concluído em 29/08/2026

Não é um ciclo de melhoria propriamente dito, mas registra a linha de base a partir
da qual os próximos ciclos serão medidos.

### O que foi implantado

| Camada | Entrega |
|---|---|
| Métricas HTTP | contador e histograma por método, rota e status, nos grupos `web` e `api` |
| Métricas de negócio | doações e transferências por status, jobs falhados |
| Logs | JSON estruturado em stdout, com `request_id` correlacionável |
| Coleta | Prometheus raspando dev, test e prod, mais a própria máquina |
| Visualização | 3 dashboards provisionados por arquivo, 22 painéis |
| Alertas | 6 regras cobrindo disponibilidade, erro, latência, fila e pipeline |
| Pipeline | duração e resultado dos workflows do GitHub Actions |

### Linha de base medida em 29/08/2026

| Métrica | Valor |
|---|---|
| p50 de latência | 501 ms |
| p95 de latência | 975 ms |
| p99 de latência | 995 ms |
| Taxa de erro 5xx | 0% |
| CI/CD (develop) | 187–211 s |
| tests | ~47 s |
| linter | ~49 s |

### Defeitos encontrados e corrigidos durante a implantação

Registrados porque cada um deles teria produzido monitoramento silenciosamente
quebrado — o pior tipo, porque aparenta funcionar.

1. **Storage de métricas derrubava a aplicação inteira.** O `AppServiceProvider`
   instanciava o APCu sem verificar se a extensão existia; como o middleware de
   métricas roda em todas as rotas, a ausência do APCu fazia toda requisição
   retornar 500. Corrigido com escolha condicional de storage e fallback para
   `InMemory`. Descoberto pelos 57 testes que quebraram no CI.

2. **Canal de log JSON falhava em silêncio.** O tap recebia `Illuminate\Log\Logger`
   e estava tipado como `Monolog\Logger`. O Laravel captura a exceção e cai num
   logger de emergência, gravando em arquivo texto — sem erro, sem teste vermelho.
   Só apareceu ao inspecionar o handler efetivamente resolvido.

3. **Arquivo de métricas de pipeline com CRLF.** O formato de exposição do
   Prometheus só aceita LF; o `windows_exporter` rejeitaria o arquivo inteiro sem
   aviso visível.

4. **Cardinalidade sem limite no rótulo de branch.** Cada branch de feature criaria
   séries permanentes. Normalizado para `develop`, `release`, `main` e `feature`.

5. **Prometheus gravando em diretório vazio.** Iniciado de outra pasta de trabalho,
   criou um banco novo e ignorou 258 MB de histórico. Corrigido fixando
   `--storage.tsdb.path`.

### Lição

Cinco dos defeitos acima eram **silenciosos**: nenhum produzia erro visível, e
quatro deles davam a impressão de que tudo funcionava. Vale a regra: depois de
configurar qualquer peça de observabilidade, verificar o dado chegando de ponta a
ponta — não basta ausência de erro.
