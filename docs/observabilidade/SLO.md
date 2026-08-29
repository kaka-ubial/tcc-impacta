# Objetivos de nível de serviço (SLO)

Metas numéricas que a plataforma se compromete a cumprir. Existem por um motivo
prático: **sem elas, todo limiar de alerta é chute.** Cada alerta configurado no
Grafana deriva de um dos objetivos abaixo.

Período de apuração: mês corrente.

---

## 1. Disponibilidade

| | |
|---|---|
| **Objetivo** | 99,5% de disponibilidade em produção |
| **Como se mede** | `avg_over_time(up{app="impacta", env="prod"}[30d])` |
| **Orçamento de erro** | 3h36 de indisponibilidade por mês |
| **Alerta relacionado** | *Site fora do ar* (dispara após 10 min sem resposta) |

Ressalva importante: a medição depende do Prometheus estar rodando, e ele roda na
máquina de desenvolvimento. Queda ocorrida com o PC desligado **não é detectada nem
contabilizada**. O número apurado é portanto um limite superior otimista. Ver
[LIMITACOES.md](LIMITACOES.md).

---

## 2. Latência

| | |
|---|---|
| **Objetivo** | 95% das requisições respondidas em menos de 800 ms |
| **Como se mede** | `histogram_quantile(0.95, sum by (le) (rate(impacta_http_request_duration_seconds_bucket{env="prod"}[5m])))` |
| **Alerta relacionado** | *Site lento* (dispara acima de 2s por 15 min) |

O limiar do alerta (2s) é deliberadamente mais frouxo que o objetivo (800 ms). O
objetivo é a meta que se persegue; o alerta é o ponto em que alguém precisa ser
acordado. Igualar os dois faria o alerta tocar o tempo todo, e alerta que sempre
toca vira alerta ignorado.

Percentil, não média: com 95 requisições de 100 ms e 5 de 10 s, a média dá 600 ms e
parece saudável, enquanto o p95 revela que 1 usuário em 20 tem experiência ruim.

---

## 3. Taxa de erro

| | |
|---|---|
| **Objetivo** | menos de 1% de respostas 5xx no mês |
| **Como se mede** | `sum(rate(impacta_http_requests_total{env="prod", status=~"5.."}[30d])) / sum(rate(impacta_http_requests_total{env="prod"}[30d]))` |
| **Alerta relacionado** | *Taxa de erro acima de 5%* (dispara em 5 min) |

Erros 4xx ficam de fora de propósito: em geral são o usuário fazendo algo inválido,
não a aplicação falhando. Um pico de 422 pode indicar problema de usabilidade, mas
não é incidente de disponibilidade.

---

## 4. Confiabilidade da fila

| | |
|---|---|
| **Objetivo** | menos de 5 jobs falhados por dia |
| **Como se mede** | `sum(increase(impacta_jobs_falhados_total{env="prod"}[24h]))` |
| **Alerta relacionado** | *Jobs falhando* (dispara acima de 5 em 15 min) |

A fila processa e-mail e notificação. Job falhado significa usuário que deveria ter
sido avisado e não foi — impacto invisível nas métricas de HTTP.

---

## 5. Pipeline

| | |
|---|---|
| **Objetivo** | CI/CD abaixo de 4 minutos; taxa de sucesso acima de 90% nas branches principais |
| **Como se mede** | `impacta_pipeline_duracao_segundos{workflow="CI/CD"}` e `sum(impacta_pipeline_execucoes{resultado="success"}) / sum(impacta_pipeline_execucoes)` |
| **Alerta relacionado** | *Build quebrado numa branch principal* |

Por que 4 minutos: acima disso o ciclo de feedback deixa de ser imediato e o
desenvolvedor troca de contexto enquanto espera, o que custa mais que os minutos do
build. Referência de partida em 29/08/2026: CI/CD em 187–211s, tests em ~47s,
linter em ~49s.

---

## Revisão dos objetivos

Estes números são a primeira versão e foram definidos a partir das primeiras
medições, não de exigência de negócio. Devem ser revistos após acumular histórico:
objetivo folgado demais não protege ninguém, e apertado demais gera ruído.

Toda revisão de objetivo deve ser registrada em [REVISOES.md](REVISOES.md) com a
justificativa.
