# Ciclo A — núcleo enxuto, superpowers absorvido e design

Ciclo: `2026-11-02-dieta-superpowers-design`
Base: commit `4ced739` · `reviewRound` 21 (o primeiro review deste ciclo é `review-22`)
Trilha: completa
Escopo confirmado pelo usuário em 2026-11-02, no `BRAINSTORM`. Spec aprovado em 2026-11-02.
Emendas do `PLAN` (aprovadas com o plano em 2026-11-02): R2.8, R2.9, R3.6, a tabela de R7.1
e os critérios C18, C24 e C25. Motivo: com o núcleo limitado a 10.000 caracteres, o "como" de cada
fase passa para o módulo da fase, e o orçamento por fase só fecha se `orquestracao.md` for
dividido e o `REVIEW` deixar de recebê-lo.
Emenda do `FIX` (achado 1 do `review-22`, aprovada pelo usuário em 2026-11-02): R2.2 e C05.
Motivo: o limite de 19.500 era maior que o dos hosts, que trocam por uma prévia a saída de
hook acima de 10.000 caracteres (Claude Code) ou de cerca de 2.500 tokens (Codex).

## 1. Problema

As regras do Stilo não chegam inteiras ao agente, e o próprio Stilo gasta tokens que não
precisa gastar.

- **Cópia instalada defasada.** A `version` é `0.1.0` desde o início. A cópia instalada no
  Claude Code corresponde ao commit `ff4e216` (2026-09-21) e ainda injeta "sete fases",
  Qoder, OpenCode e Copilot. Nada do que entrou depois roda nas sessões reais.
- **Compactação descarta a seção errada.** Em `PLAN`, `EXECUTE` e `FIX` o contexto completo
  tem ~25,8 mil caracteres para um orçamento de 19.500. A compactação remove a seção 2
  ("O que fazer em cada fase"), a seção 4 (modelo por fase), a 8, a 9 e a 11. Em `REVIEW`
  e nas fases editoriais, os blocos protegidos sozinhos passam do orçamento e o hook injeta
  31,5 mil caracteres.
- **Critério de saída do review contraditório.** A tabela de fases manda repetir
  `REVIEW → FIX` "até zero achados". A linha de `DONE` e `modules/revisor.md` liberam com
  achados `médio` e `baixo`.
- **Subagente recebe o ruleset inteiro.** Cada subagente recebe de 15,6 mil a 31,6 mil
  caracteres, inclusive instruções que só valem para o coordenador: gravar o estado, criar
  subpasta, instalar `gh`, avisar sobre `/clear`.
- **Texto duplicado e seções raras no núcleo.** O Modo Enxuto, o contrato de ondas e a
  retomada aparecem no núcleo e no módulo. A preparação do `gh` entra em toda sessão, mas o
  hook já injeta uma nota quando o `gh` falta.
- **Documentos de ciclo acumulam emendas.** `spec.md` tem 41 KB com 20 seções e `plan.md`
  26 KB, com passos de recursos já removidos. Os documentos de ciclo dependem do caminho
  `docs/superpowers/`, de um companion.
- **Trilha curta indefinida.** A Regra 1 diz que um pedido pequeno passa "só que rápido",
  sem definir o que muda.
- **Revisão editorial integral a cada rodada.** O Markdown mantido neste repositório, sem
  as auditorias, soma ~373 KB, e a fase relê tudo em toda rodada e em todo ciclo.
- **Fluxo apoiado no superpowers.** Brainstorm, plano, execução e depuração dependem de um
  plugin externo listado como companion.
- **Sem direção visual.** Projetos com interface não têm etapa de design. O
  `modules/frontend.md` depende de o agente lembrar de carregá-lo.
- **Sem medição real.** Não há como comparar o consumo de tokens antes e depois de uma
  mudança.

## 2. Objetivo

Fazer as regras chegarem inteiras ao agente com menos contexto, tornar o Stilo
autossuficiente nas práticas que hoje vêm do superpowers e comprovar a economia por testes
automáticos e por medição registrada.

## 3. Não-objetivos

- Integrar o Graphify ou instalar Python. Isso fica para o ciclo B.
- Integrar rtk, context-mode ou outra ferramenta externa de economia de tokens.
- Criar fase nova. As nove fases e a ordem entre elas continuam iguais.
- Reduzir o rigor do review técnico. O formato de achado mantém todos os campos.
- Fazer a medição de tokens bloquear o `DONE`.

## 4. Requisitos

### R1 — Publicação

- R1.1 `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` e `package.json` declaram
  a mesma `version`. Neste ciclo, `0.2.0`.
- R1.2 Existe uma verificação executável de publicação. Ela falha quando o conteúdo
  distribuído (`AGENTS.md`, `modules/`, `hooks/`, manifestos) difere do conteúdo registrado
  na versão atual sem que a versão tenha mudado. Motivo: os hosts guardam o plugin em cache
  pela versão, e uma versão repetida não chega aos usuários.

### R2 — Contexto injetado

- R2.1 O `AGENTS.md` tem no máximo 10.000 caracteres.
- R2.2 Em cada uma das nove fases, cada texto que o `SessionStart` injeta tem no máximo
  10.000 caracteres e 10.000 bytes em UTF-8 e é idêntico ao seu contexto completo, ou seja,
  a compactação não descarta nenhum bloco. Vale com e sem a nota de preparação do `gh`, e
  com e sem `design.md` no ciclo. Motivo: acima desse tamanho, o Claude Code entrega ao
  modelo só o caminho de um arquivo e uma prévia de 2.000 caracteres, e o Codex faz o mesmo
  acima de cerca de 2.500 tokens (emenda do `FIX`; antes, 19.500 num texto só).
- R2.3 O contexto do `SubagentStart` tem no máximo 6.000 caracteres em todas as fases.
  Ele contém:
  - projeto, fase e ciclo;
  - o papel do subagente e suas proibições: não gravar `.stilo/state.json`, não fazer
    commit, editar só os arquivos atribuídos na tarefa;
  - o formato do relato ao coordenador;
  - as travas do Modo Enxuto quando o nível não é `off`: negações, números, código e erros
    citados literalmente;
  - o essencial da fase: em `EXECUTE` e `FIX`, o ciclo de TDD; em `REVIEW`, o formato de
    achado e a escala de gravidade; em `EDITORIAL_REVIEW`, os critérios e o formato do
    achado editorial.
- R2.4 Regra que tem módulo próprio aparece no núcleo só como resumo de até 3 linhas, com o
  gatilho e o caminho do módulo. Vale para o Modo Enxuto, o contrato de ondas e recursos, a
  retomada e recuperação e as avaliações. A preparação do `gh` sai do núcleo. Fica a nota
  condicional do hook, e os detalhes ficam em `docs/preparacao-github-cli.md`.
- R2.5 As seções reescritas dizem o motivo de cada regra, não só a proibição.
- R2.6 O núcleo tem uma regra para saída de comandos. Testes, builds, instalações e logs
  longos rodam com saída resumida. O log completo vai para `.stilo/logs/`, que não é
  versionado, e o contexto recebe só as linhas decisivas. Mensagens de erro continuam
  literais.
- R2.7 O núcleo tem a regra de verificação antes de concluir. O agente não declara uma
  tarefa pronta sem rodar a verificação correspondente e citar a saída.
- R2.8 Quando a fase muda dentro de uma sessão, o próximo `UserPromptSubmit` injeta uma vez
  os módulos da fase nova. O hook guarda, por sessão e fora do projeto, a última fase
  injetada: no diretório de dados do plugin ou, na falta dele, no temporário do sistema. Sem
  identificador de sessão ou sem diretório gravável, a linha de estado cita os caminhos dos
  módulos da fase. Motivo: hoje os módulos só chegam no `SessionStart`, e uma transição no
  meio da sessão deixa o agente sem as regras da fase nova.
- R2.9 O bloco de estado do `SessionStart` informa o caminho absoluto da pasta `modules/` do
  plugin. Motivo: em projetos de usuário, o agente não tem como achar os módulos que ele
  mesmo deve ler (design, frontend, autoria de skill, avaliação).

### R3 — Correções de regra

- R3.1 Existe um único critério de saída do review: repetir `REVIEW → FIX` até uma rodada
  sem achado `crítico` nem `alto`. Ele aparece igual no `AGENTS.md` e em
  `modules/revisor.md`.
- R3.2 As tabelas e os gatilhos de fase em `modules/enxuto.md` e `modules/orquestracao.md`
  coincidem com o que os hooks aplicam.
- R3.3 Ao criar um projeto, a instrução manda gravar `editorialReviewRound: 0` e o campo
  `cycle`.
- R3.4 Os arquivos distribuídos citam modelos só pelos apelidos (`opus`, `sonnet`), sem
  número de versão de modelo.
- R3.5 `isOff`, `setOff` e o que só eles usam saem de `hooks/stilo-state.js`.
- R3.6 Em `FIX`, o hook injeta `modules/correcao.md`, com as regras de correção: o estado de
  cada achado, conferir o achado antes de corrigir e contestar com evidência quando o achado
  estiver errado. Hoje essas regras estão em `revisor.md`, que só é injetado em `REVIEW`.

### R4 — Ciclos

- R4.1 O `state.json` aceita o campo opcional `cycle`, uma string que casa
  `^[a-z0-9][a-z0-9-]{1,63}$`, no formato recomendado `AAAA-MM-DD-assunto`. Um valor
  inválido torna o estado inválido, com erro explícito. Um estado sem `cycle` continua
  válido.
- R4.2 Com `cycle`, os documentos ativos são `docs/ciclos/<cycle>/spec.md` e
  `docs/ciclos/<cycle>/plan.md` na trilha completa, ou `docs/ciclos/<cycle>/ciclo.md` na
  trilha curta. Sem `cycle`, valem `spec.md` e `plan.md` na raiz do projeto, como hoje.
- R4.3 O bloco de estado do `SessionStart` e a linha do `UserPromptSubmit` mostram o id do
  ciclo e os caminhos dos documentos ativos. A próxima ação cita esses caminhos.
- R4.4 O diagnóstico confere os documentos do ciclo ativo por fase, com o mesmo mapeamento
  fase → artefato de hoje, e não menciona `docs/superpowers/`. `.stilo/cycle.json` deixa de
  ser lido e escrito. O commit e a rodada de review em que o ciclo começou ficam no
  cabeçalho do documento do ciclo.
- R4.5 Um pedido novo em `DONE` abre um ciclo novo em `BRAINSTORM`: id novo, mesmo
  `reviewRound` e mesmo `editorialReviewRound` (a numeração é global). Os documentos dos
  ciclos anteriores não são alterados.
- R4.6 Migração deste repositório, feita com `git mv`:
  - `spec.md` e `plan.md` da raiz vão para `docs/ciclos/2026-08-21-v1/`;
  - cada documento em `docs/superpowers/specs/` e `docs/superpowers/plans/` vai para
    `docs/ciclos/<id>/spec.md` ou `docs/ciclos/<id>/plan.md`;
  - referências fora do histórico são atualizadas, inclusive o script `validate-plan` do
    `package.json`;
  - `.stilo/cycle.json` é removido.

### R5 — Trilha curta

- R5.1 A trilha curta vale quando a mudança atende a todas as condições: toca até 3
  arquivos, não adiciona dependência, não mexe em segurança, permissões, dados persistidos
  nem operação destrutiva, e não muda contrato público. O agente propõe a trilha ao fechar o
  `BRAINSTORM`, e o usuário a confirma junto com o escopo. Nenhuma fase é pulada.
- R5.2 Nos `SPEC` e `PLAN` da trilha curta há um único arquivo, `docs/ciclos/<id>/ciclo.md`,
  com a seção `## Spec` (até 10 linhas e pelo menos um critério de aceite executável) e a
  seção `## Plano` (1 a 3 passos). O usuário aprova o arquivo uma vez. A presença do
  `ciclo.md` identifica a trilha.
- R5.3 No `EXECUTE` da trilha curta não há ondas nem subagentes. O `REVIEW` tem uma rodada.
  Um achado `crítico` ou `alto` leva ao `FIX`, e a partir daí o loop segue as regras da
  trilha completa.
- R5.4 A revisão editorial da trilha curta cobre só os textos alterados no ciclo.

### R6 — Revisão editorial incremental

- R6.1 Por padrão, a revisão editorial cobre o texto alterado desde o commit-base do ciclo
  e os arquivos que a mudança deixou inconsistentes.
- R6.2 A rodada depois de um `EDITORIAL_FIX` cobre os trechos corrigidos e o entorno deles.
- R6.3 A revisão integral acontece no primeiro ciclo de um projeto ou quando o usuário
  pede. Primeiro ciclo é o projeto sem nenhum ciclo anterior: nenhuma outra pasta em
  `docs/ciclos/` e nenhum `spec.md` legado na raiz.
- R6.4 Os documentos de ciclos encerrados, os reviews e as auditorias são histórico e ficam
  fora da revisão.
- R6.5 O relatório declara o modo (incremental ou integral), o commit-base, a cobertura, as
  exclusões e as limitações.

### R7 — Superpowers absorvido

- R7.1 O Stilo tem módulos próprios, em português e condensados, que cobrem o recorte
  aprovado:

  | Módulo | Origem no superpowers | Injetado pelo hook em |
  |---|---|---|
  | `modules/brainstorm.md` | `brainstorming` | `BRAINSTORM` |
  | `modules/especificacao.md` | próprio: conteúdo do spec, cabeçalho do ciclo, gatilho de design, teste com leitor | `SPEC` |
  | `modules/plano.md` | `writing-plans` | `PLAN` |
  | `modules/orquestracao.md` (contrato de tarefas, ondas, recursos, modelo e esforço) | `dispatching-parallel-agents` | `PLAN` |
  | `modules/execucao.md` (coordenação, conferência por tarefa, delegação, commits, escalada, retomada, worktree) | `subagent-driven-development`, `executing-plans`, `using-git-worktrees` | `EXECUTE` |
  | `modules/tdd.md` | `test-driven-development` | `EXECUTE`, `FIX` |
  | `modules/depuracao.md` | `systematic-debugging` | `FIX`; em `EXECUTE`, o agente o lê quando uma verificação falha |
  | `modules/correcao.md` (R3.6) | `receiving-code-review` | `FIX` |
  | `modules/encerramento.md` | `finishing-a-development-branch` | `DONE` |
  | `modules/autoria-skill.md` (ampliado) | `writing-skills` | gatilho atual, lido pelo agente |
  | núcleo (R2.7) | `verification-before-completion` | sempre |

  O `REVIEW` recebe `revisor.md`, que passa a conter o essencial do despacho de revisores. As
  fases editoriais recebem `revisor-editorial.md`. Nenhuma das duas recebe a orquestração.

- R7.2 Na execução, o coordenador confere cada tarefa contra o passo do plano (arquivos,
  testes e saída esperada) antes de liberar a próxima. Uma revisão por subagente a cada
  tarefa só acontece nas tarefas classificadas como risco alto. Motivo: revisão completa por
  tarefa dobraria o número de subagentes, e o `REVIEW` do ciclo já cobre o diff inteiro.
- R7.3 O `DONE` oferece integrar na branch principal, abrir PR, manter a branch ou
  descartar. Nada é integrado, publicado nem apagado sem escolha explícita do usuário.
- R7.4 `THIRD_PARTY_NOTICES.md` credita o superpowers (MIT, Jesse Vincent) e a skill
  `frontend-design` (Apache-2.0, Anthropic), dizendo que os textos foram adaptados e
  modificados.
- R7.5 O superpowers sai da lista de companions. Nenhum arquivo distribuído o menciona,
  exceto `THIRD_PARTY_NOTICES.md`.

### R8 — Design

- R8.1 Quando o escopo inclui interface de usuário, o `SPEC` também produz
  `docs/ciclos/<id>/design.md`, aprovado junto com o spec. Ele contém:
  - brief: assunto, público e função principal;
  - tokens: 4 a 6 cores com nome e valor hex, e tipografia com papéis e escala;
  - layout das telas principais, com wireframes ASCII;
  - princípios da interface;
  - a lista dos padrões genéricos de design considerados e evitados;
  - regras de microcopy.
- R8.2 `modules/design.md`, em texto próprio adaptado da `frontend-design`, orienta essa
  etapa. O `AGENTS.md` indica o gatilho: `SPEC` com interface no escopo.
- R8.3 Quando `docs/ciclos/<cycle>/design.md` existe, o hook injeta `modules/frontend.md`
  em `EXECUTE` e `REVIEW`. Sem `design.md`, a regra atual continua: o agente lê
  `frontend.md` quando o diff toca interface.
- R8.4 O `REVIEW` confere o diff contra o `design.md`. Um desvio não justificado dos tokens
  ou do layout é achado.
- R8.5 Teste com leitor no `SPEC` da trilha completa. Antes de pedir aprovação, o
  coordenador entrega o spec (e o `design.md`, se existir) a um subagente sem o contexto da
  conversa. O subagente responde o que será construído, como verificar cada critério e o que
  está fora de escopo, e lista as dúvidas. Lacunas são corrigidas antes da aprovação, e o
  resultado vai para o spec. Sem suporte a subagentes, o spec registra que o teste não foi
  executado.

### R9 — Medição de tokens

- R9.1 `scripts/medir-tokens.js`, em Node 20 sem dependências, lê um transcript do Claude
  Code (`.jsonl` com `message.usage`), uma sessão do Codex (`.jsonl` com eventos
  `token_count`) ou um diretório com esses arquivos. Ele informa:
  - número de chamadas ao modelo;
  - tokens de entrada, de escrita e de leitura de cache e de saída, em total e por chamada;
  - tamanho da saída de ferramentas por ferramenta, em caracteres e em percentual.
- R9.2 Com `--json`, a saída é JSON válido. Uma entrada inexistente ou ilegível termina com
  código diferente de zero e uma mensagem que diz o caminho.
- R9.3 Linhas desconhecidas ou malformadas são contadas e informadas, sem interromper a
  leitura.

### R10 — Testes e dependências

- R10.1 Os testes verificam estrutura e orçamento: fases, gatilhos, módulos por fase,
  âncoras protegidas, limites de tamanho, caminhos e as ausências exigidas por R3.1, R3.4 e
  R7.5. Eles não fixam frases de prosa do `AGENTS.md` nem dos módulos.
- R10.2 O `package.json` continua sem `dependencies`.

## 5. Critérios de aceite

Todos executáveis. Salvo indicação, são cobertos pelo `npm test`.

| # | Critério | Requisito |
|---|---|---|
| C01 | `npm test` passa | todos |
| C02 | As três versões são iguais a `0.2.0` | R1.1 |
| C03 | Numa cópia temporária, alterar um arquivo distribuído sem mudar a versão faz a verificação de publicação falhar; com versão nova, ela passa | R1.2 |
| C04 | `AGENTS.md` tem no máximo 10.000 caracteres | R2.1 |
| C05 | Para cada fase, com e sem nota do `gh` e com e sem `design.md`: cada texto do `SessionStart` tem no máximo 10.000 caracteres e 10.000 bytes e é igual ao seu contexto completo | R2.2, R8.3 |
| C06 | Para cada fase, o contexto do `SubagentStart` tem no máximo 6.000 caracteres e contém fase, ciclo, as três proibições e o essencial da fase de R2.3 | R2.3 |
| C07 | O `AGENTS.md` não contém as seções "Preparação do ambiente" nem "Contrato de tarefas e ondas", e contém as âncoras das regras de saída de comandos e de verificação antes de concluir | R2.4, R2.6, R2.7 |
| C08 | Nenhum arquivo distribuído contém "até zero achados"; `AGENTS.md` e `revisor.md` contêm o critério único | R3.1 |
| C09 | As tabelas de fase de `enxuto.md` e o gatilho de `orquestracao.md` coincidem com as constantes dos hooks | R3.2 |
| C10 | A instrução de projeto novo contém `editorialReviewRound` e `cycle` | R3.3 |
| C11 | Nenhum arquivo distribuído casa `/(Opus\|Sonnet\|Haiku) \d/` | R3.4 |
| C12 | `hooks/stilo-state.js` não exporta `isOff` nem `setOff` | R3.5 |
| C13 | Em `FIX`, o contexto injetado contém as regras de correção de R3.6 | R3.6 |
| C14 | Um estado com `cycle` válido é aceito; um `cycle` inválido gera erro que cita o campo; um estado sem `cycle` continua válido | R4.1 |
| C15 | Com `cycle`, o bloco de estado e a linha de estado mostram o id e os caminhos em `docs/ciclos/<cycle>/`; com `ciclo.md`, mostram a trilha curta; sem `cycle`, mostram `spec.md` e `plan.md` da raiz | R4.2, R4.3, R5.2 |
| C16 | O diagnóstico confere os documentos do ciclo ativo, não lê `.stilo/cycle.json` e não contém `docs/superpowers` | R4.4 |
| C17 | No repositório, `git ls-files spec.md plan.md docs/superpowers .stilo/cycle.json` é vazio, as pastas migradas existem em `docs/ciclos/`, e `npm run validate-plan` passa apontando para `docs/ciclos/` | R4.6 |
| C18 | `modulosDaFase` injeta exatamente os módulos da tabela de R7.1 em cada fase, mais `enxuto.md` quando o nível não é `off` e `frontend.md` conforme R8.3; cada módulo novo declara o gatilho na primeira linha | R7.1 |
| C19 | `THIRD_PARTY_NOTICES.md` cita MIT com Jesse Vincent e Apache-2.0 com `frontend-design`; nenhum outro arquivo distribuído contém `superpowers` | R7.4, R7.5 |
| C20 | Com `docs/ciclos/<cycle>/design.md`, `EXECUTE` e `REVIEW` injetam `frontend.md`; sem ele, não injetam | R8.3 |
| C21 | `medir-tokens.js` com os fixtures do Claude Code e do Codex produz os totais esperados; `--json` gera JSON válido; um caminho inexistente sai com código ≠ 0 citando o caminho; uma linha malformada é contada sem abortar | R9 |
| C22 | O `package.json` não tem `dependencies` | R10.2 |
| C23 | `claude plugin validate .` passa, executado manualmente quando o CLI estiver disponível | R1 |
| C24 | Com `SessionStart` em `PLAN` e depois `UserPromptSubmit` na mesma sessão com a fase `EXECUTE`, a saída traz os módulos de `EXECUTE`; um segundo `UserPromptSubmit` na mesma fase traz só a linha de estado; sem `session_id`, a linha cita os caminhos dos módulos; nada é gravado dentro do projeto | R2.8 |
| C25 | O bloco de estado do `SessionStart` contém o caminho absoluto de `modules/`, e esse caminho existe | R2.9 |

### Verificação por leitura (no `REVIEW`, não automatizada)

- L1 As seções reescritas explicam o motivo das regras (R2.5).
- L2 Os módulos novos seguem o recorte aprovado, estão em português e não copiam trechos
  longos dos originais (R7.1, R8.2).
- L3 A trilha curta e a revisão editorial incremental estão descritas sem ambiguidade
  (R5, R6).
- L4 Os testes não fixam frases de prosa (R10.1).

### Evidência registrada, sem bloquear o `DONE`

- E1 Comparação de tokens numa tarefa fixa, antes e depois, com `medir-tokens.js`,
  registrada em `docs/ciclos/2026-11-02-dieta-superpowers-design/evidencias.md`.
- E2 Depois da publicação autorizada, a cópia instalada está em `0.2.0` e a injeção da
  sessão mostra as nove fases.

## 6. Fora de escopo

- Graphify, instalação de Python e qualquer ferramenta externa de economia de tokens (ciclo
  B).
- rtk e context-mode.
- Skills da Anthropic além da `frontend-design` e da ideia do teste com leitor.
- Mudar o formato de `.stilo/review-NN.md` ou dos relatórios editoriais além do que R6.5
  pede.
- Reescrever os documentos de ciclos encerrados.

## 7. Riscos

- **Orçamentos apertados podem empobrecer os módulos.** Prioridade para regras e passos,
  não para exemplos. O teste de orçamento por fase mostra onde o texto não cabe.
- **O papel do subagente é inferido pela fase.** Um subagente de busca em `EXECUTE` também
  recebe o essencial de TDD. O custo fica limitado pelos 6.000 caracteres.
- **Links internos dos documentos migrados quebram.** São histórico e não são reescritos
  (seção 6).
- **O formato dos transcripts pode mudar.** `medir-tokens.js` informa linhas desconhecidas
  em vez de falhar (R9.3).
- **Teste com leitor custa um subagente por `SPEC`.** Vale só na trilha completa.
