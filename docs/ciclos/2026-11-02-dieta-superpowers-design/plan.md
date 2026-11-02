# Ciclo A — Plano de implementação

Ciclo: `2026-11-02-dieta-superpowers-design` · Spec: `docs/ciclos/2026-11-02-dieta-superpowers-design/spec.md`
Base: commit `4ced739` · primeiro review do ciclo: `review-22`
Tecnologia: Markdown, CommonJS, `node:test`, Node.js >=20, sem dependências npm.

## Decisões fechadas

Estas decisões não se reabrem durante a execução. Se uma delas se mostrar errada, parar e
voltar ao `PLAN`.

1. O núcleo diz o quê e quando. O como de cada fase fica no módulo da fase, injetado pelo
   hook (spec R7.1 emendado).
2. `orquestracao.md` passa a valer só no `PLAN`, e o novo `execucao.md` só no `EXECUTE`.
   `REVIEW`, `FIX` e as fases editoriais não recebem orquestração.
3. Um subagente recebe `modules/subagente.md` e as seções extraídas pelo título:
   - "## O que nunca tocar" de `enxuto.md`, quando o nível não é `off`;
   - `tdd.md` inteiro em `EXECUTE` e `FIX`;
   - "## Formato de um achado" de `revisor.md` em `REVIEW`;
   - "## Formato do achado editorial" de `revisor-editorial.md` em `EDITORIAL_REVIEW`.

   Esses títulos são contrato: não mudar.
4. A última fase injetada em cada sessão é gravada em `<dados>/sessoes/<sha256(session_id) 16 hex>.json`.
   `<dados>` é `CLAUDE_PLUGIN_DATA`, `PLUGIN_DATA` ou `os.tmpdir()/stilo-code`, nessa ordem.
   Nada vai para dentro do projeto. Arquivos com mais de 7 dias são podados, em melhor
   esforço.
5. A verificação de publicação usa `publicacao.json` na raiz, com `{ version, sha256, registrado }`.
   - O hash cobre `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, `LICENSE`, `licenses/`, `modules/`,
     `hooks/`, `scripts/`, `.claude-plugin/`, `.codex-plugin/` e `package.json`.
   - Antes do hash, os caminhos são ordenados, CRLF vira LF e o valor de `"version"` nos
     três manifestos é zerado.
   - Essa verificação fica fora do `npm test`. Ela roda em `npm run verificar-publicacao`
     antes de publicar.
6. O `tests/all.test.js` passa a descobrir os `*.test.js` sozinho, então nenhuma tarefa
   seguinte precisa editá-lo.
7. A suíte completa só precisa ficar verde no fim de T13. Cada tarefa roda os testes que
   lista. Um teste antigo de prosa quebrado por tarefa anterior é reescrito na tarefa dona do
   arquivo de teste.

## Orçamentos, em caracteres (`String.length` do arquivo, sem espaços finais)

| Arquivo | Máximo | Injetado em |
|---|---|---|
| `AGENTS.md` | 9.000 (limite do spec: 10.000) | toda sessão |
| bloco de estado + nota do `gh` | 1.000 + 600 | toda sessão |
| `brainstorm.md` | 3.500 | `BRAINSTORM` |
| `especificacao.md` | 2.000 | `SPEC` |
| `plano.md` | 2.500 | `PLAN` |
| `orquestracao.md` | 2.800 | `PLAN` |
| `execucao.md` | 2.500 | `EXECUTE` |
| `tdd.md` | 1.800 | `EXECUTE`, `FIX`, subagente |
| `depuracao.md` | 1.800 | `FIX` |
| `correcao.md` | 1.200 | `FIX` |
| `revisor.md` | 4.000 (seção de achado ≤ 2.200) | `REVIEW` |
| `revisor-editorial.md` | 4.500 (seção de achado ≤ 1.800) | fases editoriais |
| `enxuto.md` | 2.400 (seção de travas ≤ 600) | fases com nível `leve`/`pleno` |
| `frontend.md` | 2.000 | `EXECUTE`/`REVIEW` com `design.md` |
| `encerramento.md` + `auditoria.md` | 1.800 + 1.500 | `DONE` |
| `subagente.md` | 1.500 | todo subagente |
| `design.md` | 3.500 | lido pelo agente no `SPEC` |

Pior caso de sessão: `EXECUTE` com `design.md` dá 9.000 + 1.600 + 2.400 + 2.500 + 1.800 +
2.000 = 19.300. Pior caso de subagente: 1.500 + 300 de cabeçalho + 600 + 2.200 = 4.600.

## Medida de antes (HEAD `4ced739`)

Contexto completo e injetado, em caracteres. O subagente recebe o mesmo da sessão.

| Fase | Completo | Injetado |
|---|---|---|
| `BRAINSTORM` | 15.596 | 15.596 |
| `SPEC` | 21.347 | 19.349 |
| `PLAN` | 25.835 | 19.371 |
| `EXECUTE` | 25.844 | 19.380 |
| `REVIEW` | 31.497 | 31.497 |
| `FIX` | 25.928 | 19.464 |
| `EDITORIAL_REVIEW` / `EDITORIAL_FIX` | 31.648 / 31.646 | igual |
| `DONE` | 17.023 | 17.023 |

## Restrições globais

- Zero dependências npm e Node.js >=20.
- Schema `version: 1`. Os estados antigos continuam válidos.
- Os textos novos são próprios, em português. Os originais do superpowers estão em
  `~/.claude/plugins/cache/claude-plugins-official/superpowers/7.0.0/skills/`. A
  `frontend-design` está em `anthropics/skills`, `skills/frontend-design/SKILL.md`. Não
  copiar trechos longos, e não copiar nenhum texto da `doc-coauthoring`.
- Cada regra reescrita diz o motivo (spec R2.5).
- Implementadores editam e relatam. Commits só com autorização do usuário: o coordenador
  captura o `HEAD`, commita na ordem do plano e não faz push.
- Execução recomendada: o coordenador em série. As ondas indicam o que poderia ir em
  paralelo, mas não exigem subagentes.

## Foco da revisão

1. Algum caminho ou combinação de fase estoura 19.500 ou cai na compactação — T09.
2. O rastreio de sessão grava dentro do projeto ou trava o hook no Windows (stdin) — T09.
3. A verificação de publicação passa com conteúdo alterado e versão repetida — T01, T12.
4. `medir-tokens.js` conta duas vezes as linhas com o mesmo `message.id` — T03.
5. Um módulo condensado perdeu uma regra de segurança: negações, erro literal, não commitar,
   não publicar sem escolha do usuário — T04 a T08.
6. A migração apaga histórico em vez de mover com `git mv` — T11.

### Tarefa T01 — Agregador automático e verificação de publicação

ID: T01
Especialista: scripts Node e testes
Files:
- Modify: `tests/all.test.js`
- Create: `scripts/verificar-publicacao.js`
- Create: `tests/publicacao.test.js`
- Modify: `package.json`
Depends-on: nenhum
Resources: nenhum

**Classificação:** lógica comum, esforço médio.

- [ ] `tests/all.test.js`: listar `tests/*.test.js` com `fs.readdirSync`, ordenar, excluir o
  próprio arquivo e dar `require` em cada um.
- [ ] `scripts/verificar-publicacao.js` exporta `calcularHash(raiz)`, `verificar(raiz)` e
  `registrar(raiz)`. A CLI é `node scripts/verificar-publicacao.js [--registrar] [raiz]`,
  com código 0 para ok, 1 para reprovado e 2 para uso inválido ou arquivo ilegível.
- [ ] Regras de `verificar`:
  - as três versões são iguais;
  - existe `publicacao.json`;
  - o hash e a versão atuais são iguais aos registrados.

  Mensagens: "conteúdo distribuído mudou sem versão nova" quando o hash mudou e a versão é a
  mesma, e "registre a publicação" quando a versão subiu sem registro.
- [ ] Regras de `registrar`: recusa se as versões divergirem, ou se o hash mudou e a versão
  continua igual à registrada. Fora isso, grava `{ version, sha256, registrado }`, com
  `registrado` em ISO UTC.
- [ ] Testes em `os.tmpdir()`, numa cópia mínima com `AGENTS.md`, `modules/a.md` e os três
  manifestos. Casos:
  - registrar e verificar, sem mudança: 0;
  - editar `modules/a.md`: verificar dá 1 e `registrar` recusa;
  - subir as três versões e registrar: 0;
  - manifestos com versões diferentes: 1;
  - CRLF e LF no mesmo conteúdo dão o mesmo hash.
- [ ] `package.json`: incluir `"verificar-publicacao": "node scripts/verificar-publicacao.js"`
  e apontar `validate-plan` para `docs/ciclos/2026-11-02-dieta-superpowers-design/plan.md`.
- [ ] Verificar: `node --test tests/publicacao.test.js` e `npm run validate-plan`.

### Tarefa T02 — Estado: ciclo, documentos ativos e remoções

ID: T02
Especialista: estado e validação
Files:
- Modify: `hooks/stilo-state.js`
- Modify: `tests/state.test.js`
Depends-on: nenhum
Resources: nenhum

**Classificação:** lógica comum, esforço médio. Validação de estado: revisar com atenção.

- [ ] Em `validateState`, aceitar `cycle` opcional. Quando presente, deve ser string que
  casa `^[a-z0-9][a-z0-9-]{1,63}$`. Senão, erro `cycle deve casar ^[a-z0-9][a-z0-9-]{1,63}$`.
- [ ] Exportar `documentosDoCiclo(projectRoot, state)`, que devolve `{ cycle, trilha, dir,
  spec, plan, ciclo, design }` com caminhos absolutos.
  - Sem `cycle`: `trilha: 'legado'`, `spec`/`plan` na raiz, `ciclo` e `design` `null`.
  - Com `cycle`: `dir = docs/ciclos/<cycle>`. `trilha` é `'curta'` se `ciclo.md` existir e
    `'completa'` se não. `design` aponta para `dir/design.md` quando o arquivo existe.
- [ ] Remover `isOff`, `setOff`, `offFlagPath`, `stiloHome`, `validateCycle`, `readCycle`,
  `writeCycle` e `CICLO_SLUG`, se não houver outro uso. Antes de remover, confirmar com
  `grep` em `hooks/`, `scripts/` e `tests/`. `validateCheckpoint` continua como está.
- [ ] Testes:
  - `cycle` válido é aceito; `cycle` inválido gera erro que cita `cycle`; estado sem `cycle`
    continua válido;
  - os três casos de `documentosDoCiclo`, usando pasta temporária;
  - remover os testes de `writeCycle`/`readCycle`;
  - os exports removidos não existem.
- [ ] Verificar: `node --test tests/state.test.js`.

### Tarefa T03 — Medição de tokens

ID: T03
Especialista: scripts Node e formatos de transcript
Files:
- Create: `scripts/medir-tokens.js`
- Create: `tests/medir-tokens.test.js`
- Create: `tests/fixtures/transcripts/claude.jsonl`
- Create: `tests/fixtures/transcripts/codex.jsonl`
Depends-on: nenhum
Resources: nenhum

**Classificação:** lógica comum, esforço médio.

- [ ] Entrada: um arquivo `.jsonl` ou um diretório, varrido recursivamente atrás de
  `.jsonl`. O formato é detectado por linha:
  - **Claude Code:** `type: 'assistant'` com `message.usage`. Deduplicar por `message.id`,
    porque o transcript repete o mesmo uso em várias linhas. Cada `tool_use` (`id`, `name`)
    mapeia o `tool_result` (`tool_use_id`) para medir o tamanho por ferramenta. `mcp__*`
    vira `mcp`.
  - **Codex:** `type: 'event_msg'` com `payload.type: 'token_count'`. Usar o último
    `payload.info.total_token_usage` não nulo de cada arquivo (é acumulado) e contar
    chamadas pelos eventos com `info`. `response_item` com `function_call` (`name`,
    `call_id`) e `function_call_output` (`call_id`, `output`) mede o tamanho por ferramenta.
- [ ] Saída humana: chamadas; tokens de entrada, escrita de cache, leitura de cache e
  saída, em total e por chamada; tabela por ferramenta em caracteres e percentual; contagem
  de linhas inválidas e de linhas de tipo desconhecido. Com `--json`, o mesmo conteúdo como
  objeto.
- [ ] Erros: caminho inexistente ou ilegível sai com código 2 e
  `medir-tokens: caminho não encontrado: <caminho>`. Uma linha malformada só incrementa
  `linhasInvalidas`.
- [ ] Fixtures sintéticos e pequenos, com valores calculáveis à mão. O do Claude tem duas
  linhas com o mesmo `message.id`. O do Codex tem dois `token_count` acumulados. Os testes
  conferem os totais, o `--json` e o código de saída.
- [ ] Verificar: `node --test tests/medir-tokens.test.js`, e rodar o script em um transcript
  real só para conferir que não quebra (sem registrar conteúdo).

### Tarefa T04 — Módulos de entendimento: brainstorm, especificação, plano e design

ID: T04
Especialista: instruções de agente
Files:
- Create: `modules/brainstorm.md`
- Create: `modules/especificacao.md`
- Create: `modules/plano.md`
- Create: `modules/design.md`
Depends-on: nenhum
Resources: nenhum

**Classificação:** arquitetura de instruções; capacidade maior, esforço alto.

A primeira linha de cada módulo declara o gatilho.

- [ ] `brainstorm.md` (`BRAINSTORM`, até 3.500):
  - explorar o contexto (arquivos, docs, commits recentes) antes de perguntar;
  - uma pergunta por vez, sempre com recomendação, de preferência de múltipla escolha;
  - propor 2 ou 3 abordagens com trade-offs e recomendar uma;
  - apresentar o desenho por partes e validar cada parte;
  - YAGNI;
  - decompor pedidos grandes em ciclos;
  - ao fechar, propor a trilha (curta ou completa, pelos critérios do núcleo), confirmar o
    escopo em palavras e gravar `phase` e `cycle`.
- [ ] `especificacao.md` (`SPEC`, até 2.000):
  - seções do spec;
  - cabeçalho do documento com ciclo, commit-base e `reviewRound` de início;
  - critério de aceite executável;
  - se houver interface no escopo, ler `<módulos>/design.md` e produzir `design.md`;
  - teste com leitor (spec R8.5) antes de pedir aprovação, com registro do resultado;
  - na trilha curta, `ciclo.md` com `## Spec` e `## Plano`.
- [ ] `plano.md` (`PLAN`, até 2.500):
  - tarefas de 2 a 5 minutos por passo, com arquivo exato, comando de verificação e saída
    esperada;
  - passos de TDD quando há lógica;
  - sem "TBD" ou "adicionar validação apropriada";
  - seção de decisões fechadas;
  - foco da revisão;
  - validar com `scripts/validate-plan.js` quando disponível.
- [ ] `design.md` (até 3.500): adaptar o processo da `frontend-design`, com texto próprio:
  - brief;
  - tokens: 4 a 6 cores hex com nome, tipografia com papéis e escala;
  - layout com wireframes ASCII e alinhamento;
  - princípios;
  - revisar o plano contra o brief e trocar os padrões genéricos: os cinco agrupamentos da
    skill, resumidos;
  - ousadia em um único ponto;
  - microcopy;
  - piso de qualidade remetendo a `frontend.md`.
- [ ] Verificar: um script ad hoc que confere tamanho e primeira linha de cada arquivo (o
  teste definitivo fica em T09).

### Tarefa T05 — Módulos de execução e correção

ID: T05
Especialista: instruções de agente e orquestração
Files:
- Modify: `modules/orquestracao.md`
- Create: `modules/execucao.md`
- Create: `modules/tdd.md`
- Create: `modules/depuracao.md`
- Create: `modules/correcao.md`
Depends-on: nenhum
Resources: nenhum

**Classificação:** arquitetura de instruções; capacidade maior, esforço alto.

- [ ] `orquestracao.md` (`PLAN`, até 2.800). O que fica:
  - campos da tarefa: `ID`, `Especialista`, `Files:`, `Depends-on:`, `Resources:`;
  - regra das ondas, com marcação incerta em série;
  - recursos exclusivos, resumidos;
  - classificação e escolha de modelo e esforço, com o bloco de registro reduzido;
  - escalada: capacidade versus ambiente.

  O que sai: a execução e a recuperação, que vão para `execucao.md`.
- [ ] `execucao.md` (`EXECUTE`, até 2.500):
  - seguir o plano na ordem; plano errado → parar e voltar ao `PLAN`;
  - delegar uma tarefa concreta com um brief autossuficiente;
  - conferir cada tarefa contra o passo antes de liberar a próxima; revisor em subagente só
    nas tarefas de risco alto (spec R7.2);
  - implementadores não commitam; o coordenador captura o `HEAD` e commita em ordem, só com
    autorização;
  - despacho paralelo só dentro da onda;
  - retomada de escritor interrompido;
  - worktree como último recurso, em diretório ignorado, conferido com `git check-ignore`;
  - esperar todos antes do `REVIEW`;
  - em falha de verificação, ler `<módulos>/depuracao.md`.
- [ ] `tdd.md` (`EXECUTE`/`FIX`, até 1.800):
  - teste primeiro;
  - ver o teste falhar pelo motivo certo;
  - código mínimo;
  - ver o teste passar;
  - refatorar;
  - o teste afirma o comportamento pedido, não a implementação;
  - exceções declaradas (só docs ou config, sem infraestrutura de teste).
- [ ] `depuracao.md` (`FIX`, até 1.800):
  - nenhuma correção sem causa raiz;
  - reproduzir;
  - ler o erro inteiro;
  - olhar mudanças recentes;
  - rastrear o dado até a origem;
  - uma hipótese por vez, com teste mínimo;
  - depois de 3 correções sem sucesso, questionar o desenho e relatar.
- [ ] `correcao.md` (`FIX`, até 1.200):
  - para cada achado do review mais recente, conferir a alegação antes de corrigir;
  - achado errado vira `descartado`, com a evidência;
  - corrigir com a mudança mínima e marcar `corrigido` com `arquivo:linha`;
  - sem concordância performática;
  - achado ambíguo → perguntar;
  - depois, voltar ao `REVIEW` incrementando `reviewRound`.
- [ ] Verificar: tamanho e primeira linha, com o mesmo script de T04.

### Tarefa T06 — Módulos de revisão e estilo

ID: T06
Especialista: instruções de review e estilo
Files:
- Modify: `modules/revisor.md`
- Modify: `modules/revisor-editorial.md`
- Modify: `modules/enxuto.md`
- Modify: `modules/frontend.md`
Depends-on: nenhum
Resources: nenhum

**Classificação:** arquitetura de instruções; capacidade maior, esforço alto.

- [ ] `revisor.md` (até 4.000):
  - critério único de saída (spec R3.1);
  - revisar contra os documentos do ciclo ativo;
  - conformidade com o `design.md` (spec R8.4);
  - essencial do despacho: lentes aplicáveis, revisores não escrevem no código, o
    coordenador deduplica e, sem subagentes, faz a revisão única;
  - a seção de `FIX` sai, porque foi para `correcao.md`;
  - manter o título `## Formato de um achado`, com os campos e a tabela de gravidade abaixo
    dele, em até 2.200.
- [ ] `revisor-editorial.md` (até 4.500):
  - modo incremental padrão, integral só no primeiro ciclo ou a pedido (spec R6);
  - histórico excluído;
  - o relatório declara modo e commit-base;
  - título `## Formato do achado editorial`, em até 1.800.
- [ ] `enxuto.md` (até 2.400):
  - remover a tabela de fases (o nível vem da linha de estado);
  - níveis, o que cortar, as duas regras, escape de clareza e um único par de exemplo;
  - título `## O que nunca tocar`, em até 600.
- [ ] `frontend.md` (até 2.000): manter limites numéricos, quatro estados, teclado,
  responsividade e o roteiro de verificação; cortar a prosa explicativa.
- [ ] Verificar: tamanhos, títulos-contrato presentes e
  `grep -n "até zero achados" modules AGENTS.md` sem ocorrência em `modules/`.

### Tarefa T07 — Encerramento, subagente, autoria de skill e avisos de terceiros

ID: T07
Especialista: instruções de agente e licenças
Files:
- Create: `modules/encerramento.md`
- Create: `modules/subagente.md`
- Modify: `modules/autoria-skill.md`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `licenses/Apache-2.0.txt`
Depends-on: nenhum
Resources: nenhum

**Classificação:** instruções, esforço alto; licenças, esforço médio.

- [ ] `encerramento.md` (`DONE`, até 1.800):
  - verificar a suíte antes de oferecer opções;
  - opções: integrar na branch principal, abrir PR (com `gh` quando disponível), manter a
    branch ou descartar;
  - descartar exige confirmação digitada;
  - nada integrado, publicado ou apagado sem escolha explícita;
  - plugin ou skill: subir a versão e rodar a verificação de publicação do projeto, se
    existir;
  - limpar worktree só da opção escolhida.
- [ ] `subagente.md` (até 1.500):
  - você trabalha para o coordenador;
  - não gravar `.stilo/state.json`, não fazer commit, editar só os arquivos da tarefa;
  - não perguntar ao usuário: devolver a dúvida ao coordenador;
  - saída longa em `.stilo/logs/`;
  - relato: status `concluído`/`parcial`/`bloqueado`, arquivos alterados, comandos de
    verificação com as linhas decisivas, pendências.
- [ ] `autoria-skill.md`: acrescentar o essencial da `writing-skills`. Testar a skill como
  código: cenário de pressão sem a skill (linha de base), com a skill, e fechar brechas. Sem
  passar de 5.500.
- [ ] `THIRD_PARTY_NOTICES.md`:
  - superpowers: MIT, Copyright (c) 2025 Jesse Vincent, com o texto integral da licença;
  - `frontend-design`: Apache-2.0, Anthropic, com aviso de adaptação e modificação e
    apontando para `licenses/Apache-2.0.txt`;
  - quais módulos derivam de cada um.
- [ ] `licenses/Apache-2.0.txt`: copiar o `LICENSE.txt` da `frontend-design` sem alteração.
- [ ] Verificar: tamanhos e
  `grep -c "Jesse Vincent\|Apache" THIRD_PARTY_NOTICES.md` > 0.

### Tarefa T08 — Núcleo `AGENTS.md`

ID: T08
Especialista: arquitetura de instruções
Files:
- Modify: `AGENTS.md`
Depends-on: T04, T05, T06, T07
Resources: nenhum

**Classificação:** arquitetura; capacidade maior, esforço alto.

- [ ] Reescrever com no máximo 9.000 caracteres. Seções e âncoras (os títulos são contrato
  dos testes e da proteção):
  - `# Stilo Code — pipeline de projeto`;
  - `## Regra 0 — uma pasta por projeto`;
  - `## Regra 1 — nunca pular para a implementação`, citando a trilha curta;
  - `## 1. Fases`: diagrama, e uma linha por fase com artefato e saída; critério único de
    saída do review;
  - `## 2. Ciclos e trilhas`: campo `cycle`, `docs/ciclos/<id>/`, ciclo novo a partir do
    `DONE`, critérios e artefato da trilha curta, revisão editorial incremental;
  - `## 3. Estado em disco`: JSON com `cycle` e `editorialReviewRound`, quem grava,
    procura e projeto novo;
  - `## 4. Retomada verificável`: até 3 linhas, com ponteiro para `execucao.md`;
  - `## 5. Modelo por fase`: só os apelidos;
  - `## 6. Módulos`: o hook injeta os da fase; lidos pelo agente a partir do caminho do
    bloco de estado: `design.md`, `frontend.md` sem `design.md`, `autoria-skill.md`,
    `avaliacao.md`, `melhoria-instrucoes.md`, e `depuracao.md` no `EXECUTE`;
  - `## 7. Execução segura`: verificação antes de concluir; saída longa de comandos em
    `.stilo/logs/`, com só as linhas decisivas no contexto e erro literal;
  - `## 8. Modo Enxuto`: até 3 linhas;
  - `## 9. Idioma`;
  - `## 10. Aviso de /clear seguro`;
  - `## 11. Companions`: `ponytail`, `context7`, `playwright`;
  - `## 12. Hosts e funcionamento automático`: nota do `gh` só condicional.
- [ ] Toda regra reescrita traz o motivo em meia frase. Remover "Preparação do ambiente",
  "Contrato de tarefas e ondas" e qualquer número de versão de modelo.
- [ ] Verificar:
  - `node -e "console.log(require('fs').readFileSync('AGENTS.md','utf8').trim().length)"` ≤ 9000;
  - `grep -n "até zero achados\|superpowers\|Opus [0-9]\|Sonnet [0-9]" AGENTS.md` sem
    ocorrência.

### Tarefa T09 — Hooks: contexto por fase, subagente e transição de fase

ID: T09
Especialista: hooks, contexto e compatibilidade de host
Files:
- Modify: `hooks/stilo-instructions.js`
- Modify: `hooks/stilo-activate.js`
- Modify: `hooks/stilo-prompt.js`
- Modify: `hooks/stilo-subagent.js`
- Create: `hooks/stilo-sessao.js`
- Modify: `tests/instructions.test.js`
- Modify: `tests/context.test.js`
- Modify: `tests/hooks.test.js`
- Modify: `tests/reliability-contract.test.js`
Depends-on: T02, T08
Resources: nenhum

**Classificação:** risco alto (contexto central, Windows, sessão); capacidade maior,
esforço alto. Revisor em subagente ao terminar, se houver delegação autorizada.

- [ ] `modulosDaFase(state, projectRoot)` com o mapa da decisão 2 e da tabela de R7.1:
  - `BRAINSTORM`: `brainstorm`;
  - `SPEC`: `especificacao`;
  - `PLAN`: `orquestracao` e `plano`;
  - `EXECUTE`: `execucao` e `tdd`;
  - `REVIEW`: `revisor`;
  - `FIX`: `tdd`, `depuracao` e `correcao`;
  - fases editoriais: `revisor-editorial`;
  - `DONE`: `auditoria` e `encerramento`;
  - `enxuto` à frente quando o nível não é `off`;
  - `frontend` em `EXECUTE`/`REVIEW` quando `documentosDoCiclo(...).design` existe.
- [ ] `blocoEstado`:
  - novas linhas: Ciclo, Trilha, Documentos (relativos à raiz do projeto) e
    `Módulos sob demanda: <pluginRoot absoluto>/modules/`;
  - a instrução de projeto novo traz o JSON com `cycle`, `reviewRound: 0` e
    `editorialReviewRound: 0`;
  - `PROXIMA_ACAO` usa os caminhos dos documentos ativos.
- [ ] `buildStateLine`: acrescentar `ciclo=<id>` e citar os documentos ativos na próxima
  ação, mantendo uma linha.
- [ ] `buildSubagentContext(state, caminhos)` conforme a decisão 3, com o cabeçalho
  `Projeto`, `Fase` e `Ciclo`. `stilo-subagent.js` passa a usá-la.
- [ ] `stilo-sessao.js` exporta `dadosDir()`, `registrarFase(sessionId, state)` e
  `faseMudou(sessionId, state)`, conforme a decisão 4. Nunca lança.
  - `stilo-activate.js` lê o stdin com `readStdinJson`, resolve o projeto por `data.cwd`
    (com fallback para o `cwd` do processo), injeta e registra a fase.
  - `stilo-prompt.js`: com `session_id` e fase mudada, sai a linha mais os módulos da nova
    fase, e a fase é registrada. Com a mesma fase, só a linha. Sem `session_id` ou com falha
    de gravação, sai a linha mais ` · módulos: <caminhos>`.
- [ ] Atualizar a lista protegida de `buildInjectedContext` para as âncoras de T08 e para os
  módulos da fase. A compactação continua como rede de segurança.
- [ ] Testes, cobrindo os critérios C05, C06, C10, C13, C15, C18, C20, C24 e C25:
  - laço sobre as 9 fases × com e sem nota do `gh` × com e sem `design.md` (projeto
    temporário): injetado ≤ 19.500 e igual ao completo;
  - subagente ≤ 6.000, com as três proibições;
  - `FIX` contém `correcao.md`;
  - transição `PLAN` → `EXECUTE` na mesma sessão;
  - nada gravado no projeto: comparar a listagem antes e depois.

  Remover as asserções de frases de prosa (spec R10.1) desses quatro arquivos de teste, sem
  perder os casos de estado ilegível, inválido, ambíguo, EPIPE, Codex e stdin vazio.
- [ ] Verificar:
  `node --test tests/instructions.test.js tests/context.test.js tests/hooks.test.js tests/reliability-contract.test.js tests/state.test.js`.

### Tarefa T10 — Diagnóstico e matriz de evidências

ID: T10
Especialista: diagnóstico e evidências
Files:
- Modify: `hooks/stilo-diagnostics.js`
- Modify: `tests/diagnostics.test.js`
- Modify: `docs/aceite.md`
Depends-on: T02
Resources: nenhum

**Classificação:** lógica comum, esforço médio.

- [ ] Trocar `readCycle`/`cycleDocuments` e o `.stilo/cycle.json` por `documentosDoCiclo`.
  - `expectedArtifacts`, na trilha completa ou legada: `spec` a partir de `PLAN`, `plan` a
    partir de `EXECUTE`.
  - Na trilha curta: `ciclo.md` a partir de `PLAN`.
  - `base.cycle` informa `{ status, id, trilha, documents }`.
  - Nenhuma menção a `docs/superpowers`.
- [ ] `docs/aceite.md`: o critério 21 passa a `retirado`, com o resultado
  "`cycle.json` removido; o ciclo fica no `state.json` (ciclo 2026-11-02)".
- [ ] Testes: substituir os casos de `cycle.json` por ciclo no estado, nas trilhas
  completa e curta e sem ciclo. Manter os testes de `readEvidence`.
- [ ] Verificar: `node --test tests/diagnostics.test.js`.

### Tarefa T11 — Migração dos documentos de ciclo

ID: T11
Especialista: migração de arquivos
Files:
- Rename: `spec.md`
- Rename: `plan.md`
- Rename: `docs/superpowers/specs/2026-09-04-orquestracao-review-multiagente-design.md`
- Rename: `docs/superpowers/plans/2026-09-04-orquestracao-review-multiagente-plan.md`
- Rename: `docs/superpowers/specs/2026-09-07-retomada-confiavel-governanca-design.md`
- Rename: `docs/superpowers/plans/2026-09-07-retomada-confiavel-governanca-plan.md`
- Rename: `docs/superpowers/plans/2026-09-18-automatico-sem-comandos-plan.md`
- Rename: `docs/superpowers/specs/2026-09-21-auditoria-opcional-simplificacao-design.md`
- Rename: `docs/superpowers/plans/2026-09-21-auditoria-opcional-simplificacao-plan.md`
- Rename: `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md`
- Rename: `docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md`
- Rename: `docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`
- Rename: `docs/superpowers/plans/2026-10-24-apenas-claude-codex-plan.md`
- Rename: `docs/superpowers/specs/2026-10-24-auditoria-seguranca-design.md`
- Modify: `docs/evidencias-template.md`
- Delete: `.stilo/cycle.json`
Depends-on: T01, T10
Resources: nenhum

**Classificação:** edição mecânica; menor modelo adequado, esforço baixo.

- [ ] `git mv`:
  - `spec.md` e `plan.md` → `docs/ciclos/2026-08-21-v1/`;
  - cada `docs/superpowers/specs/<id>-design.md` → `docs/ciclos/<id>/spec.md`;
  - cada `docs/superpowers/plans/<id>-plan.md` → `docs/ciclos/<id>/plan.md`;
  - `2026-10-24-auditoria-seguranca-design.md` → `docs/ciclos/2026-10-24-auditoria-seguranca/spec.md`.
- [ ] Não editar o conteúdo dos documentos movidos, porque são histórico.
- [ ] `docs/evidencias-template.md`: trocar as linhas 17 e 18 por
  `docs/ciclos/<id>/spec.md` e `docs/ciclos/<id>/plan.md`.
- [ ] Remover `.stilo/cycle.json`, que não é versionado.
- [ ] Verificar:
  - `git ls-files spec.md plan.md docs/superpowers .stilo/cycle.json` vazio;
  - `git status --short` mostra `R` (rename) nos 15 arquivos;
  - `npm run validate-plan` passa.

### Tarefa T12 — Documentação, versão e registro de publicação

ID: T12
Especialista: documentação e publicação
Files:
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/preparacao-github-cli.md`
- Modify: `docs/contrato-hooks.md`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `package.json`
- Create: `publicacao.json`
- Create: `docs/ciclos/2026-11-02-dieta-superpowers-design/evidencias.md`
Depends-on: T03, T09, T10, T11
Resources: nenhum

**Classificação:** documentação, esforço médio.

- [ ] READMEs: ciclos em `docs/ciclos/`, trilha curta, `design.md`, medição com
  `node scripts/medir-tokens.js <transcript|pasta> [--json]` e a política de versão para quem
  contribui (`npm run verificar-publicacao`). O inglês espelha o português.
- [ ] `docs/preparacao-github-cli.md`: receber as regras que saíram do `AGENTS.md`.
- [ ] `docs/contrato-hooks.md`: contrato do subagente, rastreio de sessão no diretório de
  dados e injeção na transição de fase.
- [ ] Versões `0.2.0` nos três manifestos. Depois de todas as demais edições distribuídas,
  rodar `node scripts/verificar-publicacao.js --registrar`.
- [ ] `evidencias.md`:
  - tabela de antes (deste plano) contra o depois, medido com o mesmo método;
  - resultado de C23 (`claude plugin validate .`), ou "CLI indisponível";
  - E1 e E2 como pendentes, com o roteiro.
- [ ] Verificar: `npm run verificar-publicacao` com código 0.

### Tarefa T13 — Testes estruturais, ausências e fechamento

ID: T13
Especialista: testes
Files:
- Modify: `tests/orchestration.test.js`
- Modify: `tests/reviewer-contract.test.js`
- Modify: `tests/audit.test.js`
- Modify: `tests/instruction-improvement.test.js`
- Modify: `tests/manifestos.test.js`
- Create: `tests/estrutura.test.js`
Depends-on: T12
Resources: nenhum

**Classificação:** lógica comum, esforço médio.

- [ ] Nos arquivos existentes: trocar asserções de frases de prosa por estrutura, ou seja,
  títulos-contrato, campos de achado, nomes de arquivo e gatilho na primeira linha.
- [ ] `tests/estrutura.test.js`:
  - C02: três versões `0.2.0`;
  - C04: `AGENTS.md` ≤ 10.000;
  - C07: âncoras e seções removidas;
  - C08: "até zero achados" ausente e critério único presente;
  - C09: o nível de `enxuto.md` e o gatilho de `orquestracao.md` coerentes com
    `ENXUTO_POR_FASE` e `modulosDaFase`;
  - C11: sem `/(Opus|Sonnet|Haiku) \d/` nos distribuídos;
  - C17: arquivos migrados presentes e originais ausentes;
  - C19: `superpowers` só em `THIRD_PARTY_NOTICES.md`;
  - C22: sem `dependencies`;
  - orçamento de cada módulo conforme a tabela deste plano.
- [ ] Verificar:
  - `npm test` com 0 falhas;
  - `npm run validate-plan`;
  - `npm run verificar-publicacao`;
  - `git diff --check`;
  - `claude plugin validate .` quando disponível.

## Ondas

| Onda | Tarefas | Observação |
|---|---|---|
| 1 | T01, T02, T03, T04, T05, T06, T07 | arquivos disjuntos |
| 2 | T08, T10 | T08 depende dos módulos; T10 do estado |
| 3 | T09, T11 | |
| 4 | T12 | registro de publicação depois de todo conteúdo distribuído |
| 5 | T13 | suíte completa verde |

## Riscos e respostas

- **Módulo não cabe no orçamento.** Cortar exemplo antes de cortar regra. Se uma regra de
  segurança não couber, parar e voltar ao `PLAN`.
- **`SessionStart` lendo stdin no Windows.** `readStdinJson` já tem timeout de 1 s e é o
  mesmo caminho do `UserPromptSubmit`. Testar com stdin vazio.
- **Host sem `session_id` ou sem diretório de dados.** Usar o fallback de caminhos na linha
  (spec R2.8), coberto por teste.
- **Teste antigo de prosa quebrando entre tarefas.** Esperado (decisão 7). A tarefa dona do
  arquivo de teste conserta.
