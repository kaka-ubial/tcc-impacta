# Acessibilidade para daltonismo (RNF 5)

Requisito: *o frontend permite acessibilidade* — (a) público e estudo, (b) estratégias implementadas, (c) teste com o público e dados coletados.

| Item | Situação |
|---|---|
| (a) Público e estudo | Pronto (seção 1) |
| (b) Estratégias no frontend | Implementado (seções 2 e 3) |
| (c) Teste com o público | **Protocolo pronto, teste ainda não realizado** (seção 4). A seção 5 é preenchida depois da aplicação. |

---

## 1. Público escolhido e estudo (item a)

**Público:** pessoas com deficiência de visão de cores (daltonismo), tanto doadoras quanto de instituições sociais.

**Por que esse público.** O Impacta usa cor para comunicar estado (doação pendente, confirmada, recusada), prioridade das necessidades e séries dos gráficos. Esse tipo de interface é onde o daltonismo mais atrapalha, e o problema é frequente: as estimativas da literatura apontam cerca de 8% dos homens e 0,5% das mulheres com alguma forma de daltonismo. Em uma plataforma aberta ao público geral, isso é uma parcela relevante dos usuários.

**Tipos considerados**

| Tipo | O que acontece | Confunde principalmente |
|---|---|---|
| Protanopia / protanomalia | Sem (ou com pouca) percepção de vermelho | vermelho × verde, vermelho × marrom, laranja × verde |
| Deuteranopia / deuteranomalia | Sem (ou com pouca) percepção de verde (a forma mais comum) | verde × vermelho, verde × marrom, rosa × cinza |
| Tritanopia / tritanomalia | Sem (ou com pouca) percepção de azul (rara) | azul × verde, amarelo × rosa |

**Diretrizes usadas como base**
- WCAG 2.2, critério 1.4.1 *Uso de cor*: a cor não pode ser o único meio de transmitir informação.
- WCAG 2.2, critérios 1.4.3 e 1.4.11: contraste mínimo de 4,5:1 para texto e 3:1 para elementos gráficos.
- Okabe & Ito (2008), *Color Universal Design*: paleta pensada para ser distinguível em todos os tipos de daltonismo.
- Machado, Oliveira & Fernandes (2009), *A Physiologically-based Model for Simulation of Color Vision Deficiency* (IEEE TVCG): modelo usado para simular a visão daltônica na verificação objetiva (seção 3).

**Levantamento das telas** (onde a cor carregava informação)

| Ponto do sistema | Como era | Risco | Tratamento |
|---|---|---|---|
| Status das doações (visão do doador) | Selo com cor (verde/âmbar/vermelho) e texto | Médio: texto existia, mas a varredura visual dependia da cor | Ícone por status |
| Status das doações e transferências (instituição) | Selo com ícone e texto | Baixo | Mantido; cores passam a seguir a paleta daltônica |
| Prioridade das necessidades | Selo de cor com texto | Médio | Ícone por nível (setas duplas, seta, traço) |
| Gráfico de linhas (solicitadas/entregues/canceladas) | Cinza, verde-azulado e vermelho | Alto: verde-azulado × cinza e vermelho × verde-azulado | Canceladas com traço ponto-traço (além do pontilhado das solicitadas) e paleta daltônica |
| Gráfico de barras (enviadas × recebidas) | Teal × verde (tons próximos) | Alto: ΔE00 = 7,9 na tritanopia | Paleta daltônica: azul-escuro × ciano, separados também por luminosidade |
| Avisos em âmbar | Texto âmbar sobre fundo claro | Médio (contraste) | Cor de aviso muda para amarelo-escuro com contraste ≥ 4,5:1 no modo daltônico |
| Badges de conquista (imagens em `public/badges`) | Arte colorida | Não avaliado | Cada badge tem nome e descrição em texto; revisar a arte no teste |

---

## 2. Estratégias implementadas no frontend (item b)

1. **Modo para daltonismo** (painel de acessibilidade, botão flutuante em todas as telas). Escolha salva no navegador, com classe `a11y-cvd` no `<html>`.
   - Troca verde × vermelho por **azul / ciano / amarelo-escuro / vermelho-alaranjado**, que se diferenciam também por luminosidade e não só por matiz.
   - Funciona nos temas claro e escuro, e junto com o alto contraste.
   - Paleta dos gráficos (`--chart-1` a `--chart-5`, `--chart-danger`, `--chart-neutral`) trocada para a base Okabe-Ito.
2. **Informação redundante, sem depender de cor** (vale para todos os usuários, com o modo ligado ou não):
   - Ícone + texto em cada status de doação (agora também na visão do doador).
   - Ícone + texto na prioridade das necessidades.
   - Linhas do gráfico distinguidas por estilo de traço, além da cor.
3. **Já existia e continua valendo:** sublinhar links (links não dependem só de cor), foco reforçado, alto contraste, escala de texto de 100% a 200%, reduzir animações e link "pular para o conteúdo".

Onde está no código: `resources/css/app.css` (bloco `html.a11y-cvd`), `resources/js/hooks/use-accessibility.tsx`, `resources/js/components/accessibility/accessibility-panel.tsx`, `resources/js/pages/doador/doacoes.tsx`, `resources/js/components/necessidade-card.tsx`, `resources/js/pages/instituicao/estatisticas.tsx`.

---

## 3. Verificação objetiva por simulação (apoio ao item c)

O script `simular_daltonismo.py` (nesta pasta) simula protanopia, deuteranopia e tritanopia (matrizes de Machado et al., 2009) e calcula a diferença de cor CIEDE2000 (ΔE00) entre cada par de cores do sistema. Valores abaixo de 10 indicam pares fáceis de confundir (⚠️). Rodar: `python3 simular_daltonismo.py --md`.

**Isto é uma simulação e não substitui o teste com pessoas da seção 4.**


### Padrão (claro)

| Par | Visão normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Marca (teal) × Sucesso (verde) | 13.2 | 12.5 | 16.6 | 7.9 ⚠️ |
| Marca (teal) × Pendente (âmbar) | 45.3 | 30.9 | 41.7 | 54.0 |
| Marca (teal) × Erro (vermelho) | 56.2 | 16.2 | 33.3 | 61.5 |
| Marca (teal) × Neutro | 18.6 | 11.3 | 6.7 ⚠️ | 13.1 |
| Sucesso (verde) × Pendente (âmbar) | 36.4 | 20.2 | 26.6 | 46.7 |
| Sucesso (verde) × Erro (vermelho) | 53.2 | 8.8 ⚠️ | 17.3 | 53.7 |
| Sucesso (verde) × Neutro | 24.9 | 24.0 | 22.3 | 14.6 |
| Pendente (âmbar) × Erro (vermelho) | 32.2 | 23.1 | 12.0 | 19.0 |
| Pendente (âmbar) × Neutro | 47.9 | 44.3 | 49.8 | 50.5 |
| Erro (vermelho) × Neutro | 42.8 | 25.6 | 39.6 | 48.5 |

Menor ΔE00 da paleta: 6.7 (pares com ⚠️ são fáceis de confundir)

### Padrão (escuro)

| Par | Visão normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Marca (teal) × Sucesso (verde) | 19.2 | 16.2 | 18.4 | 18.7 |
| Marca (teal) × Pendente (âmbar) | 42.3 | 23.2 | 30.9 | 56.1 |
| Marca (teal) × Erro (vermelho) | 66.8 | 32.3 | 31.3 | 72.6 |
| Marca (teal) × Neutro | 22.2 | 10.1 | 6.7 ⚠️ | 21.7 |
| Sucesso (verde) × Pendente (âmbar) | 32.6 | 16.5 | 21.5 | 43.2 |
| Sucesso (verde) × Erro (vermelho) | 51.8 | 16.7 | 15.7 | 52.4 |
| Sucesso (verde) × Neutro | 16.4 | 12.5 | 11.7 | 12.2 |
| Pendente (âmbar) × Erro (vermelho) | 32.2 | 23.1 | 12.0 | 19.0 |
| Pendente (âmbar) × Neutro | 27.8 | 24.5 | 26.4 | 31.8 |
| Erro (vermelho) × Neutro | 35.6 | 26.9 | 24.9 | 39.6 |

Menor ΔE00 da paleta: 6.7 (pares com ⚠️ são fáceis de confundir)

### Modo daltônico (claro)

| Par | Visão normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Marca (azul) × Sucesso (ciano) | 27.0 | 21.2 | 18.4 | 17.5 |
| Marca (azul) × Pendente (amarelo-escuro) | 57.1 | 53.8 | 57.4 | 36.6 |
| Marca (azul) × Erro (vermelho-alaranjado) | 37.1 | 33.1 | 45.2 | 53.8 |
| Marca (azul) × Neutro | 26.0 | 24.2 | 26.6 | 20.0 |
| Sucesso (ciano) × Pendente (amarelo-escuro) | 38.5 | 36.7 | 40.8 | 37.8 |
| Sucesso (ciano) × Erro (vermelho-alaranjado) | 55.9 | 26.3 | 32.4 | 57.2 |
| Sucesso (ciano) × Neutro | 20.0 | 12.1 | 13.7 | 22.7 |
| Pendente (amarelo-escuro) × Erro (vermelho-alaranjado) | 41.9 | 22.7 | 13.2 | 20.1 |
| Pendente (amarelo-escuro) × Neutro | 25.2 | 24.7 | 24.9 | 15.7 |
| Erro (vermelho-alaranjado) × Neutro | 25.3 | 13.7 | 16.4 | 26.9 |

Menor ΔE00 da paleta: 12.1 (pares com ⚠️ são fáceis de confundir)

### Modo daltônico (escuro)

| Par | Visão normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Marca (azul) × Sucesso (ciano) | 23.6 | 21.6 | 21.9 | 21.7 |
| Marca (azul) × Pendente (amarelo-escuro) | 55.3 | 50.6 | 54.8 | 43.6 |
| Marca (azul) × Erro (vermelho-alaranjado) | 45.0 | 42.2 | 47.6 | 55.0 |
| Marca (azul) × Neutro | 21.8 | 20.3 | 23.1 | 19.8 |
| Sucesso (ciano) × Pendente (amarelo-escuro) | 44.4 | 42.7 | 46.7 | 40.6 |
| Sucesso (ciano) × Erro (vermelho-alaranjado) | 57.1 | 47.0 | 48.0 | 65.8 |
| Sucesso (ciano) × Neutro | 21.3 | 19.5 | 19.9 | 23.0 |
| Pendente (amarelo-escuro) × Erro (vermelho-alaranjado) | 37.3 | 26.7 | 19.7 | 27.4 |
| Pendente (amarelo-escuro) × Neutro | 27.4 | 26.4 | 27.8 | 26.4 |
| Erro (vermelho-alaranjado) × Neutro | 31.5 | 25.4 | 24.8 | 35.6 |

Menor ΔE00 da paleta: 19.5 (pares com ⚠️ são fáceis de confundir)


Leitura: no padrão, os pares marca × sucesso (tritanopia) e sucesso × erro (protanopia) caem abaixo de 10. No modo daltônico, a menor diferença sobe de 6,7 para 12,1 (claro) e 19,5 (escuro). Em daltonismo severo ainda pode haver confusão em alguns pares, e é por isso que os status também têm ícone e texto.

**Checagem manual no navegador:** Chrome → DevTools → ⋮ → More tools → Rendering → *Emulate vision deficiencies* (Protanopia, Deuteranopia, Tritanopia, Achromatopsia). Percorrer as telas da seção 4 com o modo ligado e desligado.

---

## 4. Protocolo do teste de acessibilidade (item c)

**Objetivo.** Verificar se pessoas daltônicas conseguem identificar status, prioridade e séries de gráfico nas telas do Impacta, e se o modo para daltonismo melhora isso.

**Participantes**
- Mínimo: 5 pessoas com daltonismo (autodeclarado e, se possível, confirmado por teste de Ishihara online), de preferência com mais de um tipo.
- Controle: 2 pessoas com visão de cores típica.
- Cada participante assina o termo de consentimento e é informado de que os dados são anônimos (código P1, P2…).

**Ambiente.** Computador do próprio participante ou do grupo, brilho normal, ambiente iluminado. Ambiente de teste da plataforma (`tcc-impacta-test`) com dados de demonstração. Uma pessoa conduz e outra anota.

**Desenho.** Cada participante faz as mesmas tarefas duas vezes: com o **modo padrão** e com o **modo para daltonismo**. A ordem é alternada entre participantes (P1 padrão → daltônico, P2 daltônico → padrão…) para não enviesar por aprendizado. Usar telas com dados diferentes (mesmo tipo) na segunda rodada.

**Tarefas** (perfil de doador: T1 e T2; perfil de instituição: T3 a T6)

| # | Tarefa | Tela | Sucesso quando |
|---|---|---|---|
| T1 | Dizer quais doações já foram entregues e quais foram recusadas | Minhas doações (doador) | Lista correta, sem troca |
| T2 | Achar a doação que aguarda sua resposta | Minhas doações (doador) | Aponta a correta |
| T3 | Ordenar as necessidades da mais para a menos prioritária | Necessidades | Ordem correta |
| T4 | Dizer quais doações precisam de ação (pendentes) e quais estão canceladas | Doações (instituição) | Sem troca |
| T5 | No gráfico de linhas, dizer qual linha são as doações entregues e qual são as canceladas | Estatísticas | Identifica as duas |
| T6 | No gráfico de barras, dizer qual barra é enviada e qual é recebida | Estatísticas | Identifica as duas |

**Dados coletados por tarefa:** acertou (sim/não), tempo em segundos, número de erros ou hesitações, e comentário livre.
**Dados coletados por participante:** nota de dificuldade (SEQ, 1 a 7, por tarefa e condição), preferência entre os dois modos, e o que ainda confundiu.

**Critérios de sucesso (propostos)**
- Taxa de acerto de 90% ou mais por tarefa com o modo daltônico ligado.
- Redução de erros e de tempo em relação ao modo padrão.
- Nota média SEQ de 5 ou mais.

**Planilha de coleta** (uma linha por participante × tarefa × condição)

| Participante | Tipo de daltonismo | Condição (padrão/daltônico) | Tarefa | Acertou (S/N) | Tempo (s) | Erros/hesitações | SEQ (1-7) | Observações |
|---|---|---|---|---|---|---|---|---|
| P1 | | | T1 | | | | | |

**Roteiro de condução (resumo).** (1) Apresentar o objetivo e coletar consentimento. (2) Perguntar tipo de daltonismo e se usa algum recurso de apoio. (3) Explicar que o teste avalia a tela e não a pessoa. (4) Aplicar T1 a T6 pedindo para pensar em voz alta. (5) Aplicar SEQ após cada tarefa. (6) Repetir na outra condição. (7) Perguntar preferência e sugestões.

---

## 5. Resultados do teste (preencher após a aplicação)

| Medida | Modo padrão | Modo daltônico |
|---|---|---|
| Participantes | | |
| Taxa de acerto geral | | |
| Tempo médio por tarefa (s) | | |
| Erros/hesitações por tarefa | | |
| Nota média SEQ | | |
| Preferência (nº de participantes) | | |

**Problemas encontrados e correções feitas:** *(a preencher)*
