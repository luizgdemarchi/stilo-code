# Orquestração em ondas e review multiagente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar ao Stilo Code regras portáteis para decompor tarefas em ondas seguras e sintetizar reviews multiagente sem alterar runtime, hooks ou estado.

**Architecture:** As regras R1–R3 ficam em um módulo interno carregado sob demanda e são referenciadas pelo `AGENTS.md`. O `modules/revisor.md` recebe as lentes paralelas e a síntese; os seis adaptadores continuam sendo cópias geradas do `AGENTS.md`. Um teste textual protege os contratos publicados.

**Tech Stack:** Markdown, Node.js `node:test`, script existente `scripts/sync-adapters.js`; zero dependências novas.

**Spec:** `docs/superpowers/specs/2026-09-04-orquestracao-review-multiagente-design.md`

## Global Constraints

- Nenhuma dependência npm, MCP, CI ou hook novo.
- Não alterar o schema de `.stilo/state.json` nem as fases existentes.
- Não criar scheduler, grafo de dependências, limite automático de concorrência ou worktree automática.
- Implementadores editam e reportam, mas não fazem commit; o coordenador serializa commits quando necessário.
- Revisores trabalham somente em leitura; sem subagentes, usar `modules/revisor.md` como revisão única.
- Regras e documentação publicadas permanecem em pt-BR; adaptadores são gerados a partir de `AGENTS.md`.

---

### Task 1: Teste textual do contrato de orquestração

**Files:**
- Create: `tests/orchestration.test.js`

**Interfaces:**
- Consumes: `modules/orquestracao.md`, `modules/revisor.md`, `AGENTS.md` e os seis adaptadores gerados.
- Produces: testes `node:test` que falham se `Files:`, `Depends-on:`, a regra de commits do coordenador ou o fallback sem subagentes desaparecerem.

- [ ] **Step 1: Escrever os testes que falham**

  Ler os arquivos com `fs.readFileSync` relativo a `tests/` e usar `assert.match` para exigir:

  ```js
  assert.match(orquestracao, /Files:/);
  assert.match(orquestracao, /Depends-on:/);
  assert.match(orquestracao, /coordenador.*comm/i);
  assert.match(revisor, /sem subagentes/i);
  assert.match(agents, /modules\/orquestracao\.md/);
  ```

  Também verificar que cada caminho retornado por `ADAPTADORES` contém `Files:` e `Depends-on:` após a sincronização.

- [ ] **Step 2: Rodar o teste para confirmar a falha**

  Run: `node --test tests/orchestration.test.js`

  Expected: FAIL porque `modules/orquestracao.md` ainda não existe e as referências novas ainda não foram adicionadas.

### Task 2: Adicionar o módulo de ondas e escrita coordenada

**Files:**
- Create: `modules/orquestracao.md`
- Test: `tests/orchestration.test.js`

**Interfaces:**
- Consumes: o contrato R1–R3 da especificação aprovada.
- Produces: módulo com primeira linha de gatilho para `PLAN`, `EXECUTE` e `REVIEW`, formato de tarefa (`ID`, `Files:`, `Depends-on:`), regra de ondas por dependência e arquivos disjuntos, degradação para série em caso ambíguo e commits serializados pelo coordenador.

- [ ] **Step 1: Escrever o módulo mínimo**

  Documentar literalmente as regras: cada tarefa declara especialista e caminhos exatos; tarefas só compartilham uma onda quando não há dependência direta ou transitiva e os conjuntos de arquivos são disjuntos; marcação incerta depende de todas as anteriores; implementadores não fazem commit; o coordenador captura `HEAD`, commita em ordem e só depois libera review; worktree isolada é último recurso.

- [ ] **Step 2: Rodar o teste para confirmar que passa**

  Run: `node --test tests/orchestration.test.js`

  Expected: ainda pode falhar somente pelas referências de `AGENTS.md` e `modules/revisor.md` que serão feitas na Task 3; o módulo e seus marcadores devem passar.

### Task 3: Integrar fallback e review multiagente ao ruleset

**Files:**
- Modify: `AGENTS.md` (seção de módulos e regras de `PLAN`/`EXECUTE`/`REVIEW`)
- Modify: `modules/revisor.md` (seção de review multiagente)
- Test: `tests/orchestration.test.js`

**Interfaces:**
- Consumes: `modules/orquestracao.md` da Task 2 e o formato de achados já existente em `modules/revisor.md`.
- Produces: carregamento condicional do módulo no ruleset; lentes qualidade geral, segurança, tipagem e framework somente quando houver subagentes; deduplicação, descarte de alegações sem cenário concreto ou já resolvidas e síntese em `.stilo/review-NN.md`; fallback silencioso para revisão única.

- [ ] **Step 1: Atualizar `AGENTS.md`**

  Incluir `modules/orquestracao.md` na tabela de módulos com o gatilho `PLAN`, `EXECUTE` ou `REVIEW`, e instruir que o coordenador aplica ondas, serializa commits e libera revisão apenas após todos os implementadores terminarem. Manter explícita a degradação graciosa sem companions.

- [ ] **Step 2: Atualizar `modules/revisor.md`**

  Acrescentar uma seção após o checklist atual: despachar em paralelo apenas as quatro lentes aplicáveis; exigir retorno `arquivo:linha`, gravidade, alegação curta e cenário concreto; o coordenador deduplica e ordena por gravidade, preservando o template existente; sem subagentes, executar a revisão única atual sem erro nem pedido de instalação.

- [ ] **Step 3: Rodar o teste textual completo**

  Run: `node --test tests/orchestration.test.js`

  Expected: o primeiro teste passa; o segundo pode falhar somente porque os seis adaptadores ainda aguardam a Task 4.

### Task 4: Regenerar adaptadores e validar a mudança

**Files:**
- Modify: `.cursor/rules/stilo.mdc`
- Modify: `.clinerules/stilo.md`
- Modify: `.windsurf/rules/stilo.md`
- Modify: `.kiro/steering/stilo.md`
- Modify: `.qoder/rules/stilo.md`
- Modify: `.agents/rules/stilo.md`

**Interfaces:**
- Consumes: `AGENTS.md`, `scripts/sync-adapters.js` e o teste textual da Task 3.
- Produces: seis adaptadores sincronizados, sem alterações em hooks, manifests ou estado.

- [ ] **Step 1: Regenerar as cópias**

  Run: `npm.cmd run sync`

  Expected: seis adaptadores gravados ou confirmados em dia com `AGENTS.md`.

- [ ] **Step 2: Verificar sincronização e suíte**

  Run: `node scripts/sync-adapters.js --check`

  Expected: exit code `0` e mensagem `6 adaptadores em dia com AGENTS.md.`

  Run: `npm.cmd test`

  Expected: todos os testes existentes e `tests/orchestration.test.js` passam, sem dependências novas.

- [ ] **Step 3: Conferir o diff contra a especificação**

  Run: `git diff --check; git status --short`

  Expected: somente o módulo, `AGENTS.md`, `modules/revisor.md`, teste, adaptadores e artefatos da mudança aparecem; nenhum scheduler, worktree automática, hook, migração ou alteração de `.stilo/state.json` foi criado.
