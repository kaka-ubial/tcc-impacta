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

**Consequência prática:** o número de disponibilidade apurado é um limite superior
otimista — mede apenas as horas em que houve observador.

**Como seria removida:** Grafana Cloud recebendo os dados por `remote_write`, ou um
verificador externo sempre ligado para o alerta de indisponibilidade.

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
