# Runbook

O que fazer quando cada alerta disparar. Escrito para ser lido às pressas, por
alguém que não lembra como o sistema funciona — inclusive você mesma daqui a três
semanas.

Ferramentas: Grafana em `localhost:3000`, Prometheus em `localhost:9090`, logs no
painel do Render de cada serviço.

---

## Site fora do ar

**Dispara quando** o Prometheus não consegue raspar `/metrics` por 10 minutos
seguidos, em qualquer ambiente.

**Diagnóstico, nesta ordem:**

1. **É deploy em andamento?** Aba Actions no GitHub. Durante a troca de instância o
   endpoint fica fora por 1–2 min. Se o workflow está rodando, aguarde.
2. **É hibernação?** O plano gratuito do Render desliga a instância após ~15 min sem
   tráfego. Abra a URL no navegador e espere 30–60s. Se voltar, foi isso.
3. **O endpoint responde manualmente?**
   ```powershell
   $t = [IO.File]::ReadAllText("C:\Users\kakau\projetos\impacta\observability\prometheus\token-dev.txt").Trim()
   curl.exe -s -o NUL -w "%{http_code}`n" -H "Authorization: Bearer $t" https://tcc-impacta-dev.onrender.com/metrics
   ```
   - `200` — a aplicação está viva; o problema é do Prometheus, não dela
   - `401` — token do arquivo diverge do `METRICS_TOKEN` cadastrado no Render
   - `404` — `METRICS_TOKEN` não está cadastrado naquele serviço
   - sem resposta — a aplicação está mesmo fora
4. **A aplicação está fora?** Painel do Render → aba Logs. Procure exception na
   subida, falha de migração ou erro de conexão com o banco Neon.

**Falso positivo conhecido:** se o alerta disparou para os três ambientes ao mesmo
tempo, o problema é a sua internet ou o Prometheus, não a aplicação.

---

## Taxa de erro acima de 5%

**Dispara quando** mais de 5% das respostas são 5xx por 5 minutos.

**Diagnóstico:**

1. Dashboard **Impacta — Aplicação**, painel *Requisições por status HTTP*. Confirme
   que são 5xx e não 4xx (4xx é usuário errando, não aplicação falhando).
2. Painel *Top 5 rotas por volume* para identificar a rota afetada.
3. Logs no Render, filtrando pelo minuto do pico. Como os logs são JSON, procure
   `"level_name":"ERROR"`.
4. Pegue o `request_id` da linha de erro e busque por ele: todas as linhas daquela
   mesma requisição aparecem juntas, mostrando o que aconteceu antes da falha.

**Mitigação:** se foi introduzido por um deploy recente, o caminho mais rápido é
promover a imagem anterior — o `ci-cd.yml` usa tags, então dá para reapontar `:dev`
ou `:prod` para o número de build anterior.

---

## Site lento (p95 acima de 2s)

**Dispara quando** o p95 fica acima de 2 segundos por 15 minutos.

**Diagnóstico:**

1. Dashboard **Impacta — Aplicação**, painel *Rotas mais lentas (p95)*. Uma rota
   específica ou todas?
2. **Todas as rotas lentas, após período ocioso** → quase sempre cold start da
   instância gratuita do Render. Compare o p50 com o p95: se o p50 também está alto,
   é a instância acordando, não a aplicação.
3. **Uma rota específica** → provável problema de consulta ao banco. Suspeitos
   habituais: N+1 query (falta de `with()`), consulta sem índice, listagem sem
   paginação.
4. Confirme testando o endpoint direto — se responder rápido no `curl` mas o p95
   estiver alto, o gargalo é a instância, não o código.

**Mitigação:** N+1 se resolve com eager loading. Cold start não tem solução no plano
gratuito — é limitação documentada, não defeito.

---

## Jobs falhando

**Dispara quando** mais de 5 jobs falham em 15 minutos.

**Diagnóstico:**

1. Tabela `failed_jobs` no banco tem a exception completa e o payload.
   ```sql
   SELECT queue, exception, failed_at FROM failed_jobs ORDER BY failed_at DESC LIMIT 10;
   ```
2. Causas mais prováveis: Resend fora do ar ou com credencial inválida (envio de
   e-mail), ou timeout de conexão com o banco.

**Mitigação:** corrigida a causa, `php artisan queue:retry all` reprocessa.

**Impacto que as métricas de HTTP não mostram:** cada job falhado é um usuário que
deveria ter recebido notificação e não recebeu. Não aparece como erro na tela de
ninguém.

---

## Build quebrado numa branch principal

**Dispara quando** a última execução de um workflow falhou em `develop`, `release`
ou `main`. Branches de feature ficam de fora de propósito.

**Diagnóstico:**

1. Aba Actions no GitHub, ou `gh run list --limit 5`.
2. `gh run view <id> --log-failed` mostra apenas o que falhou.

**Causas frequentes neste projeto:**
- teste do Pest quebrado por mudança de comportamento
- extensão do PHP faltando no runner (foi o caso do APCu)
- Pint reprovando formatação

**Por que importa:** branch principal vermelha bloqueia a promoção
`develop → release → main`.

---

## Coletor de métricas de pipeline parado

**Dispara quando** o `coleta-github-actions.ps1` não roda há mais de 30 minutos.

Este é o único alerta com `noDataState: Alerting` — aqui a ausência de dado é
exatamente o incidente que se quer detectar.

**Diagnóstico:**

1. A tarefa agendada existe e está ativa?
   ```powershell
   Get-ScheduledTask -TaskName "impacta-metricas-pipeline"
   ```
2. O `gh` continua autenticado? `gh auth status`. O token expira periodicamente.
3. Rode o script na mão e veja o erro:
   ```powershell
   cd C:\Users\kakau\projetos\impacta
   .\observability\pipeline\coleta-github-actions.ps1 -Saida "C:\prometheus\windows_exporter\textfile_inputs\github_actions.prom"
   ```
4. O `windows_exporter` está no ar? `curl.exe -s http://localhost:9182/metrics | Select-String impacta_pipeline`

**Armadilha conhecida:** o `windows_exporter` roda como processo comum, não como
serviço — ele **não volta sozinho depois de reiniciar o Windows**. Se o alerta
disparou logo após um reinício, é provavelmente isso.

---

## Quando nenhum alerta explica

1. `localhost:9090/targets` — todos os alvos estão UP?
2. `localhost:9090/graph` com `up` — quais ambientes respondem?
3. O Grafana está rodando? `Get-Service Grafana`
4. O Prometheus está gravando no diretório certo? Confira que a linha de comando
   inclui `--storage.tsdb.path=C:\prometheus\data`. Sem essa flag ele cria um banco
   novo e vazio na pasta de onde foi executado, e todos os painéis ficam sem dado
   histórico sem nenhum erro visível.
