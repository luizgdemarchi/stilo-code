# Stilo Code automático sem comandos — Plano de Implementação

> **Para agentes executores:** implementar tarefa por tarefa, mantendo os passos verificáveis e voltando a REVIEW após a execução.

**Objetivo:** remover a superfície pública de comandos e skills do Stilo Code e fazer o pipeline, o nível de saída e a compactação de contexto funcionarem automaticamente após a instalação.

**Arquitetura:** os hooks continuam sendo a integração automática. `buildFullContext` permanece como contexto completo interno; uma nova política local seleciona o contexto compacto para hooks automáticos e cai no completo em qualquer incerteza. O estado legado continua legível, mas nenhum override manual é honrado.

**Tecnologia:** Node.js embutido, `node:test`, CommonJS nos hooks, plugin OpenCode ESM, zero dependências de runtime e sem chamadas de rede.

**Especificação:** `spec.md`, seção 14, emenda do ciclo automático sem comandos.

## Restrições globais

- Não publicar comandos TOML, Markdown ou skills invocáveis do Stilo.
- Não interpretar prompt como comando e não criar opção de configuração para compactação.
- Não apagar `state.json`, reviews, checkpoints ou arquivos históricos existentes.
- O campo legado `enxuto` pode ser aceito no estado, mas o nível efetivo vem somente da fase.
- `AGENTS.md` continua sendo a fonte única dos adaptadores; após alterá-lo, executar `npm.cmd run sync` e `node scripts/sync-adapters.js --check`.
- Compactação local não usa rede, chave, modelo externo, transcript persistido ou tokenizer externo.
- Falha de leitura, seleção ou validação é fail-open: retornar o contexto completo e código de hook 0.
- Não publicar nem reinstalar o plugin neste ciclo sem autorização explícita.

## Revisões anteriores incorporadas

- `review-01` e `review-02`: todos os achados de integridade, sanitização e gravação atômica já estão corrigidos; não reabrir.
- `review-03`: orquestração e adaptadores já estão limpos; preservar o contrato.
- `review-04`: os seis achados estão corrigidos. As recomendações stale-docs entram na tarefa documental; CI não entra por não ser requisito do produto; `engines.node` entra como metadado de compatibilidade.
- `review-05` e `review-06`: nenhuma correção aberta; manter smoke OpenCode condicionado à CLI.
- `review-07`: zero achados. As pendências vivas antigas sobre comandos/override serão substituídas na matriz por critérios automáticos; criação natural, `/clear`, transição de fase, idioma e smoke OpenCode continuam pendentes até evidência externa.

---

### Tarefa 1 — Remover a superfície pública de comandos e skills

ID: T01
Especialista: integração de plugin e manifestos

Files:
- Delete: `commands/stilo.toml`
- Delete: `commands/stilo-off.toml`
- Delete: `skills/stilo/SKILL.md`
- Delete: `skills/stilo-off/SKILL.md`
- Delete: `.opencode/command/stilo.md`
- Delete: `.opencode/command/stilo-off.md`
- Modify: `.codex-plugin/plugin.json`
- Modify: `.opencode/plugins/stilo.mjs`
- Modify: `tests/manifestos.test.js`
Depends-on: nenhum

**Interfaces:**
- Consumes: manifestos atuais e o hook `experimental.chat.system.transform`.
- Produces: manifestos sem `skills`/comandos e plugin OpenCode que apenas injeta contexto automaticamente.

- [ ] Remover os arquivos listados e retirar o registro de comandos/skills dos manifestos.
- [ ] Remover do plugin OpenCode o parser de arquivos de comando, `config.command` e `config.skills`; manter apenas a transformação automática do system prompt.
- [ ] Atualizar os testes para afirmar que os diretórios públicos de comando/skill não existem e que os manifestos publicam apenas hooks/adaptadores.
- [ ] Rodar `node --test tests/manifestos.test.js` e confirmar que falha somente antes da implementação desta tarefa e passa depois.

### Tarefa 2 — Tornar hooks e estado exclusivamente automáticos

ID: T02
Especialista: runtime de hooks e persistência

Files:
- Modify: `hooks/stilo-prompt.js`
- Modify: `hooks/stilo-activate.js`
- Modify: `hooks/stilo-subagent.js`
- Modify: `hooks/stilo-state.js`
- Modify: `hooks/stilo-instructions.js`
- Modify: `tests/hooks.test.js`
- Modify: `tests/state.test.js`
- Modify: `tests/instructions.test.js`
Depends-on: T01

**Interfaces:**
- Consumes: `resolveProjeto(cwd)`, `buildStateLine(state, caminhos)` e o contrato de stdout existente.
- Produces: `UserPromptSubmit` sem parser de comando; `SessionStart`/`SubagentStart` sempre ativos; `resolveEnxuto(state)` derivado exclusivamente da fase.

- [ ] Remover `parseComando`, ramos de `/stilo`, `/stilo-off`, `doctor`, `checkpoint`, `ciclo` e `enxuto`, além de `isOff`/`setOff` como controle de execução.
- [ ] Fazer mensagens comuns e prompts que começam com `/` seguirem o mesmo caminho automático de estado; nenhuma mensagem deve alterar arquivos por causa do texto do prompt.
- [ ] Remover a exigência de `enxuto` no `validateState`, preservando estados antigos que ainda contenham o campo; ignorar o valor legado ao resolver o nível.
- [ ] Manter diagnóstico de estado ausente, ilegível, inválido e ambíguo no contexto automático, sem instrução contraditória de criar projeto.
- [ ] Substituir testes de comando por testes de não-mutação: prompt arbitrário não cria flag, não grava estado e ainda recebe a fase correta.
- [ ] Rodar `node --test tests/hooks.test.js tests/state.test.js tests/instructions.test.js`.

### Tarefa 3 — Compactação automática do contexto

ID: T03
Especialista: seleção determinística de contexto

Files:
- Create: `hooks/stilo-context.js`
- Modify: `hooks/stilo-instructions.js`
- Modify: `hooks/stilo-activate.js`
- Modify: `hooks/stilo-subagent.js`
- Modify: `hooks/stilo-prompt.js`
- Create: `tests/context.test.js`
- Modify: `tests/instructions.test.js`
Depends-on: T02

**Interfaces:**
- Produces: `buildInjectedContext(state, caminhos)` e `selectContextBlocks(text, options)`; ambos retornam string e nunca lançam para o hook.
- `buildFullContext(state, caminhos)` permanece completo para compatibilidade interna e fallback.

- [ ] Escrever testes para: redução por fase, preservação de blocos protegidos, estabilidade determinística, orçamento fixo, fonte ausente, estado inválido e seleção incapaz de preservar proteção.
- [ ] Implementar blocos priorizados sem resumir texto: regras essenciais, estado/ambiguidade, fase/próxima ação, segurança e módulos aplicáveis recebem prioridade; detalhes repetidos são candidatos a corte.
- [ ] Usar orçamento interno fixo, sem variável de ambiente, comando ou campo no `state.json`.
- [ ] Validar a presença dos blocos protegidos após a seleção; em qualquer falha, retornar exatamente `buildFullContext`.
- [ ] Fazer hooks automáticos chamarem `buildInjectedContext`; manter `/` e qualquer texto de prompt fora da decisão, pois não existe mais comando público.
- [ ] Rodar `node --test tests/context.test.js tests/instructions.test.js`.

### Tarefa 4 — Atualizar documentação, regras e compatibilidade

ID: T04
Especialista: documentação e adaptadores

Files:
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `modules/enxuto.md`
- Modify: `modules/autoria-skill.md`
- Modify: `spec.md`
- Modify: `docs/aceite.md`
- Modify: `docs/contrato-hooks.md` somente onde houver referência stale ao registro de comandos
- Modify: `package.json`
- Modify: `.cursor/rules/stilo.mdc`
- Modify: `.clinerules/stilo.md`
- Modify: `.windsurf/rules/stilo.md`
- Modify: `.kiro/steering/stilo.md`
- Modify: `.qoder/rules/stilo.md`
- Modify: `.agents/rules/stilo.md`
Depends-on: T03

**Interfaces:**
- Consumes: emenda da seção 14 de `spec.md` e comportamento final dos hooks.
- Produces: documentação instalável e automática, sem instrução de comando do Stilo; `package.json.engines.node` declarando `>=20`.

- [ ] Remover tabelas e instruções de comandos/skills; explicar que a conversa natural aciona o comportamento automático.
- [ ] Separar explicitamente Modo Enxuto (saída por fase) da compactação automática (contexto dos hooks).
- [ ] Atualizar `docs/aceite.md`: retirar critérios de comando/override, adicionar critérios 16–21 e manter pendências vivas sem declarar `DONE`.
- [ ] Atualizar `modules/autoria-skill.md` para não prometer skills/comandos publicados pelo Stilo.
- [ ] Adicionar `engines: { "node": ">=20" }` sem dependência nova.
- [ ] Rodar `npm.cmd run sync` e depois `node scripts/sync-adapters.js --check`.

### Tarefa 5 — Registrar o ciclo e preservar evidências

ID: T05
Especialista: governança e rastreabilidade

Files:
- Create: `.stilo/cycle.json`
- Modify: `.stilo/execution-checkpoint.md`
- Modify: `docs/aceite.md`
Depends-on: T04

**Interfaces:**
- Consumes: `reviewRound: 7` e os reviews históricos existentes.
- Produces: ciclo automático com `baseReview: 7`, sem sobrescrever reviews nem marcar `DONE` com evidência viva pendente.

- [ ] Registrar o ciclo interno com slug `automatico-sem-comandos` e `baseReview: 7` usando a mesma gravação atômica já existente.
- [ ] Atualizar o checkpoint com o escopo, pendências antigas e próxima tarefa; não apagar o texto histórico.
- [ ] Confirmar que `.stilo/review-01.md` a `.stilo/review-07.md` permanecem inalterados.

### Tarefa 6 — Verificação final e nova revisão

ID: T06
Especialista: verificação e revisão independente

Files:
- Read: `tests/all.test.js`
- Read: `package.json`
- Read: `spec.md`
- Read: `plan.md`
- Read: `.claude-plugin/plugin.json`
- Read: `.codex-plugin/plugin.json`
- Create: `.stilo/review-08.md`
Depends-on: T05

**Interfaces:**
- Consumes: todas as tarefas anteriores.
- Produces: evidência local do novo comportamento e review 08 sem achados críticos/altos.

- [ ] Rodar `npm.cmd test`.
- [ ] Rodar `npm.cmd run validate-plan` apontando para este plano.
- [ ] Rodar `node scripts/sync-adapters.js --check`.
- [ ] Rodar `git diff --check`.
- [ ] Rodar `claude plugin validate .` sem instalar ou publicar.
- [ ] Revisar o diff contra `spec.md`, este plano e todos os critérios 16–21; gravar `.stilo/review-08.md` sem sobrescrever reviews anteriores.
- [ ] Manter critérios vivos sem evidência externa como pendentes e deixar `state.json` fora de `DONE` enquanto persistirem.

## Ordem e dependências

Tarefa 1 → Tarefa 2 → Tarefa 3 → Tarefa 4 → Tarefa 5 → Tarefa 6.

As tarefas compartilham `hooks/stilo-instructions.js`, `spec.md` e testes de hook; por isso ficam seriais. Não há paralelismo seguro nesta emenda.

## Itens de review deliberadamente fora do plano

- CI: recomendação não bloqueante do review-04; não será criada infraestrutura de publicação nesta mudança.
- Smoke vivo do OpenCode: continua condicionado à existência da CLI e permanece pendente, conforme decisão registrada.
- Publicação/reinstalação: não autorizada; a cópia instalada continua separada do checkout.
