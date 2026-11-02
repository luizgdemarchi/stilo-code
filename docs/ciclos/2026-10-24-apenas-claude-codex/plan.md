# Apenas Claude Code e Codex — Plano de implementação

> **Para agentes:** executar em série, tarefa por tarefa, com TDD; revisão independente ao final.

**Objetivo:** publicar só o necessário para Claude Code e Codex, sem mudar o pipeline nesses dois.

**Spec:** `spec.md` § 18, critérios 49–54. Escopo e seção aprovados pelo usuário em 2026-10-24.

**Tecnologia:** Markdown, CommonJS e `node:test`, sem dependências novas.

## Restrições e decisões

- Remover: `.opencode/`, `opencode.json`, `gemini-extension.json`, `hooks/qoder-hooks.json`,
  `.cursor/`, `.kiro/`, `.clinerules/`, `.windsurf/`, `.qoder/`, `.agents/`,
  `scripts/sync-adapters.js`, `tests/opencode-runtime.test.js` e o script `sync` do `package.json`.
- Manter: `.claude-plugin/`, `.codex-plugin/`, `hooks/claude-codex-hooks.json`, `AGENTS.md` na raiz
  (lido pelo Codex) e todos os hooks `stilo-*.js`.
- Histórico intocado: `.stilo/review-*.md`, `docs/superpowers/**` anteriores, `docs/evaluations/**`
  e seções 1–17 de `spec.md`. Checkpoint só recebe seção nova.
- Critério de aceite dependente de agente ou arquivo removido passa ao tipo `retirado`, com o
  motivo no Resultado; o diagnóstico aceita `retirado` e não o conta como pendente.
- `modules/autoria-skill.md` guia projetos de usuário que são plugins: a tabela de adaptadores
  fica só com Claude Code e Codex.
- Companions (`AGENTS.md` § 9): critério passa a "funciona em Claude Code e Codex".
- Execução serial pelo coordenador; sem commits até a revisão; próximo review: 18.

## Foco da revisão

1. Hook rodando com variável de ambiente de agente removido (`QODER_SESSION_ID`,
   `COPILOT_PLUGIN_DATA`) não pode quebrar nem emitir saída inválida.
2. Codex continua recebendo envelope JSON em todos os eventos.
3. Nenhum manifesto restante aponta para arquivo removido.
4. Critério `retirado` não pode esconder pendência viva de Claude Code ou Codex.
5. Orçamento de contexto: o encolhimento de `AGENTS.md` não pode quebrar os testes de compactação.

### Tarefa T01: Testes de inventário, runtime e diagnóstico

ID: T01
Especialista: testes de contrato
Files:
- Modify: `tests/manifestos.test.js`
- Modify: `tests/hooks.test.js`
- Modify: `tests/diagnostics.test.js`
- Modify: `tests/orchestration.test.js`
- Modify: `tests/all.test.js`
- Delete: `tests/opencode-runtime.test.js`
Depends-on: nenhum
Resources: nenhum

**Classificação:** lógica comum; esforço médio. Modelo: sessão atual, sem troca alegada.

- [ ] `tests/manifestos.test.js`: tirar `hooks/qoder-hooks.json` de `MANIFESTOS`; trocar os testes
  de adaptadores, OpenCode e Copilot por: (a) inventário — cada caminho removido da lista acima
  não existe e `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` e
  `hooks/claude-codex-hooks.json` existem; (b) texto — `AGENTS.md`, READMEs, `modules/*.md`,
  `docs/*.md` exceto `docs/aceite.md`, hooks, scripts e manifestos não citam OpenCode, Qoder,
  Copilot, Gemini, Antigravity, Cursor, Windsurf, Cline, Kiro nem `sync-adapters`.
- [ ] `tests/hooks.test.js`: trocar "Qoder recebe o mesmo contexto automático" por teste em que
  `QODER_SESSION_ID` e `COPILOT_PLUGIN_DATA` no ambiente produzem a mesma saída do Claude Code;
  manter/confirmar teste de envelope JSON do Codex (`PLUGIN_DATA`).
- [ ] `tests/diagnostics.test.js`: tipo `retirado` aceito e fora de `completion.criteria`;
  `docs/aceite` com 54 critérios e o 15 `retirado`.
- [ ] `tests/orchestration.test.js`: remover o teste de adaptadores e o `require` de `sync-adapters`.
- [ ] `tests/all.test.js`: remover `opencode-runtime.test.js`; apagar o arquivo.
- [ ] Rodar `npm.cmd test`; esperado: falhas só nos testes novos (RED), pelos arquivos ainda presentes.

### Tarefa T02: Remoção e runtime

ID: T02
Especialista: runtime dos hooks
Files:
- Delete: `.opencode/plugins/stilo.mjs`
- Delete: `opencode.json`
- Delete: `gemini-extension.json`
- Delete: `hooks/qoder-hooks.json`
- Delete: `.cursor/rules/stilo.mdc`
- Delete: `.kiro/steering/stilo.md`
- Delete: `.clinerules/stilo.md`
- Delete: `.windsurf/rules/stilo.md`
- Delete: `.qoder/rules/stilo.md`
- Delete: `.agents/rules/stilo.md`
- Delete: `scripts/sync-adapters.js`
- Modify: `package.json`
- Modify: `hooks/stilo-runtime.js`
- Modify: `hooks/stilo-prompt.js`
- Modify: `hooks/stilo-instructions.js`
- Modify: `hooks/stilo-state.js`
- Modify: `hooks/stilo-diagnostics.js`
Depends-on: T01
Resources: nenhum

**Classificação:** remoção com risco em hook de sessão; esforço médio.

- [ ] `git rm` dos arquivos listados; tirar `sync` do `package.json`.
- [ ] `stilo-runtime.js`: remover `isCopilot`/`isQoder`; Codex (`PLUGIN_DATA`) mantém envelope.
  `stilo-prompt.js`: `UserPromptSubmit` volta a emitir só a linha de estado.
- [ ] Comentários de `stilo-instructions.js:38` e `stilo-state.js:299` sem agentes removidos.
- [ ] `stilo-diagnostics.js`: aceitar tipo `retirado`; não contar como pendente.
- [ ] Rodar `node --test tests/hooks.test.js tests/diagnostics.test.js tests/manifestos.test.js`.

### Tarefa T03: Documentação e matriz

ID: T03
Especialista: documentação e critérios de aceite
Files:
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/contrato-hooks.md`
- Modify: `modules/autoria-skill.md`
- Modify: `docs/aceite.md`
- Modify: `hooks/stilo-diagnostics.js`
- Modify: `plan.md`
Depends-on: T02
Resources: nenhum

**Classificação:** documentação verificável; esforço baixo.

- [ ] `AGENTS.md`: abertura e § 10 citam só Claude Code e Codex; § 9 com critério de companion
  para os dois; sem caminho manual para outros agentes.
- [ ] READMEs: só seções de instalação de Claude Code e Codex; "Desenvolvimento" sem adaptadores.
- [ ] `docs/contrato-hooks.md` e `modules/autoria-skill.md`: só Claude Code e Codex.
- [ ] `docs/aceite.md`: critérios dependentes de arquivo/agente removido → `retirado`; linhas
  49–54; `REQUIRED_EVIDENCE_CRITERIA` 48 → 54.
- [ ] `plan.md`: apontar este plano como proposta atual.
- [ ] Rodar `npm.cmd test`, `claude plugin validate .` e `git diff --check`.

### Tarefa T04: Revisão independente e encerramento

ID: T04
Especialista: revisor independente e coordenador
Files:
- Create: `.stilo/review-18.md`
- Modify: `.stilo/state.json`
- Modify: `.stilo/execution-checkpoint.md`
Depends-on: T03
Resources: nenhum

**Classificação:** revisão crítica; capacidade maior e esforço alto suportado.

- [ ] Revisor independente somente leitura contra `spec.md` § 18 e este plano, com o foco acima.
- [ ] Gravar `review-18`; corrigir achados em FIX e re-revisar até nenhum crítico/alto.
- [ ] Commit e push para `origin/main` (autorizados pelo usuário), após suíte verde.

## Validação do plano

```powershell
node scripts/validate-plan.js docs/superpowers/plans/2026-10-24-apenas-claude-codex-plan.md
```
