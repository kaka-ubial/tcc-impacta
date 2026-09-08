# Limitações conhecidas

Restrições reais do ambiente de monitoramento, com a causa e o que seria preciso
para removê-las. Estão documentadas de propósito: limitação registrada é decisão
consciente, limitação descoberta por terceiros é falha.

---

## 1. O monitoramento não é 24 horas

**O que acontece:** Prometheus e Grafana rodam na máquina de desenvolvimento. Com o
computador desligado, nada é coletado e nenhum alerta é avaliado. Uma queda de
madrugada não gera aviso e nem aparece no gráfico depois.

**Por quê:** a placa-mãe desta máquina (kit AMD 4700S) não expõe a opção de
virtualização na BIOS. Sem ela não há Docker Desktop nem WSL2, e portanto não há
como subir a stack em container nem manter um agente sempre ligado.

**Mitigação parcial:** o workflow `.github/workflows/metrics-scrape.yml` sobe um
Prometheus descartável, raspa os três ambientes, envia por `remote_write` pro
Grafana Cloud e derruba tudo. O `schedule` está declarado como `*/10 * * * *`.

**O cron declarado não é o cron executado.** Medição sobre as 55 execuções entre
01/09 e 08/09/2026:

| | Declarado | Medido |
|---|---|---|
| Intervalo entre execuções | 10 min | mediana **215 min** (mín. 107, máx. 345) |
| Execuções por dia | 144 | **~7** |

O GitHub não garante o horário de workflows agendados e desprioriza a fila em
repositórios do plano gratuito; sob carga, execuções são simplesmente descartadas.
O que se obtém é ~5% da frequência pedida. Aumentar a frequência declarada não
resolve — a fila é que limita.

Outras duas pegadinhas: o GitHub desativa workflows agendados sozinho após 60
dias sem nenhum commit no repositório, e o `docker run` puxa a imagem
`prom/prometheus` do Docker Hub anônimo, sujeito ao rate limit (100 pulls/6h por
IP) compartilhado com outros runners do GitHub — falhas esporádicas por isso são
esperadas, não bug.

**Mitigação efetiva para disponibilidade:** checks de Synthetic Monitoring no
Grafana Cloud (`impacta-dev`, `impacta-test`, `impacta-prod`), que rodam de probes
hospedadas a cada 3 minutos, 24/7, sem depender desta máquina nem da fila do
GitHub. Cobrem disponibilidade, latência de resposta e validade do certificado
TLS. **Não cobrem métricas de negócio** — essas continuam dependendo do scrape de
`/metrics`, e portanto da cadência irregular acima.

**Consequência prática:** disponibilidade e latência têm cobertura contínua e
confiável via probes. Já as métricas de aplicação e de negócio coletadas por
`/metrics` têm resolução real de ~3,5 horas quando o PC está desligado — qualquer
leitura de contador de negócio fora do horário de trabalho é amostragem esparsa,
não série contínua.

**Como seria removida por completo:** um agente (Prometheus ou Grafana Alloy)
rodando de verdade 24/7 em algo tipo Oracle Cloud Always Free Tier — exige criar
conta com cartão de crédito para verificação, por isso foi adiado.

---

## 2. O windows_exporter não sobe sozinho

**O que acontece:** após reiniciar o Windows, as métricas da máquina e as do
GitHub Actions param de ser coletadas até alguém iniciar o processo à mão.

**Por quê:** foi instalado a partir do executável avulso, porque registrar serviço
exige privilégio de administrador. Grafana e Prometheus não têm esse problema.

**Detecção:** o alerta *Coletor de métricas de pipeline parado* cobre esse caso.

**Como seria removida:** reinstalar pelo pacote `.msi` num prompt elevado, que
registra o serviço com início automático.

---

## 3. O scrape mantém as instâncias do Render acordadas

**O que acontece:** o Prometheus consulta `/metrics` a cada 30 segundos, e qualquer
acesso desperta uma instância hibernada. Enquanto o PC está ligado, os três
ambientes ficam permanentemente ativos.

**Consequência:** consumo contínuo da cota mensal de horas do plano gratuito,
compartilhada entre dev, test e prod.

**Efeito colateral positivo:** menos cold start, e portanto latência mais estável
durante o horário de trabalho — o que por sua vez distorce a medição de latência
para melhor. Vale considerar ao interpretar o p95.

**Como seria mitigada:** aumentar o `scrape_interval` para 5 minutos, ao custo de
resolução dos gráficos.

---

## 4. Logs de produção não são agregados

**O que acontece:** a aplicação escreve logs em JSON estruturado com `request_id`,
mas eles ficam apenas no painel do Render. Não há busca por rótulo, retenção
prolongada nem correlação automática com os gráficos.

**Por quê:** métrica funciona por busca (o Prometheus vai até a aplicação); log
funciona por envio (alguém precisa empurrar). O agente coletor rodaria nesta
máquina, que não enxerga o disco do container no Render.

**O que já funciona:** o percurso métrica → log é possível manualmente. O gráfico
indica o minuto, o painel do Render mostra as linhas daquele minuto, e o
`request_id` agrupa tudo que pertence à mesma requisição.

**Como seria removida:** Log Stream do Render apontando para um coletor público, ou
Loki hospedado.

---

## 5. Contadores zeram a cada reinício da instância

**O que acontece:** as métricas ficam em memória compartilhada (APCu) dentro do
container. Todo deploy ou despertar de hibernação zera os contadores.

**Por que não é problema:** `rate()` e `increase()` detectam o reset e não perdem a
contagem. Por isso nenhum painel usa o valor absoluto do contador.

**O que exige atenção:** ao consultar manualmente no Prometheus, um número baixo
pode significar reinício recente, não ausência de tráfego.

---

## 6. Apenas um observador

**O que acontece:** existe uma única instância de Prometheus. Se ela cair, não há
registro de nada nesse período, e o único indício é o buraco no gráfico.

**Aceito conscientemente:** monitorar o monitoramento é problema recursivo, e
resolvê-lo exigiria infraestrutura desproporcional ao projeto. O job `prometheus`,
que faz o Prometheus raspar a si mesmo, mitiga parcialmente ao registrar sua própria
saúde enquanto está no ar.
