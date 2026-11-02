# Retomada confiável e governança de execução — Plano de Implementação

> Para agentes: use superpowers:subagent-driven-development ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam - [ ].

Objetivo: corrigir o review-04 e adicionar doctor, checkpoint, validador de planos, evidências e ciclos sem dependências de runtime.

Arquitetura: stilo-state.js continua sendo a biblioteca de arquivos e validação. Diagnóstico e parser de plano serão módulos puros. Hooks permanecem adaptadores best-effort. Checkpoint, ciclo e evidências são arquivos auxiliares opcionais; state.json e as sete fases continuam compatíveis.

Stack: Node.js 24, CommonJS, node:test, Markdown e JSON; zero dependências npm novas.

Spec: docs/superpowers/specs/2026-09-07-retomada-confiavel-governanca-design.md

## Restrições globais

- Implementadores editam e reportam; o coordenador valida e serializa commits na ordem.
- AGENTS.md é a fonte única dos seis adaptadores; após alterá-lo, executar npm run sync e node scripts/sync-adapters.js --check.
- Nenhum hook derruba a sessão; erros retornam código 0 e saída vazia, exceto diagnóstico explícito.
- review-04 é histórico: no FIX, atualizar estados sem apagar o texto.
- Não instalar, publicar, fazer push ou validar serviços externos.

## Mapa de arquivos

- hooks/stilo-state.js: schema, diagnóstico e persistência atômica.
- hooks/stilo-diagnostics.js: relatório somente leitura.
- hooks/stilo-instructions.js: estado, checkpoint e próxima ação.
- hooks/stilo-prompt.js: doctor, checkpoint, ciclo e off/on honesto.
- scripts/validate-plan.js: parser e validação de tarefas.
- tests/diagnostics.test.js e tests/validate-plan.test.js: novos critérios.
- AGENTS.md, adaptadores, READMEs, docs/aceite.md e docs/contrato-hooks.md: contrato publicado.
- .opencode/plugins/stilo.mjs e tests/opencode-runtime.test.js: fallback e smoke test.
- .github/workflows/verify.yml: verificação automática sem dependências de runtime.
- .stilo/review-04.md e .stilo/state.json: estados finais somente na integração.

## Ondas

Onda 1: T1.
Onda 2: T2 e T4, com arquivos disjuntos.
Onda 3: T3, dependente de T2.
Onda 4: T5, dependente de T2 e T3.
Onda 5: T6, dependente de T2.
Onda 6: T7, dependente de T3, T5 e T6.
Onda 7: T8, dependente de todas.
Se houver incerteza de arquivos ou dependências, a tarefa roda em série após todas as anteriores.

---

### T1 — Contrato do ciclo

ID: T1
Especialista: documentação e requisitos.

Files:
- Create: docs/superpowers/specs/2026-09-07-retomada-confiavel-governanca-design.md
- Create: docs/superpowers/plans/2026-09-07-retomada-confiavel-governanca-plan.md
- Read: spec.md, plan.md, .stilo/review-04.md
- Depends-on: nenhum

Interfaces: produz R1-R8, matriz dos seis achados e a ordem T2-T8.

- [ ] Passo 1: salvar a especificação com problema, objetivo, limites, requisitos, aceite e matriz.
- [ ] Passo 2: conferir cobertura com rg -n 'R[1-8]|Achado|Critérios de aceite' docs/superpowers/specs/2026-09-07-retomada-confiavel-governanca-design.md.
- [ ] Passo 3: conferir tarefas com rg -n 'T[1-8]|Files:|Depends-on:' docs/superpowers/plans/2026-09-07-retomada-confiavel-governanca-plan.md e eliminar lacunas de especificação.

### T2 — State seguro e diagnóstico

ID: T2
Especialista: Node.js e persistência local.

Files:
- Modify: hooks/stilo-state.js
- Modify: hooks/stilo-instructions.js
- Create: hooks/stilo-diagnostics.js
- Modify: tests/state.test.js
- Modify: tests/instructions.test.js
- Create: tests/diagnostics.test.js
- Depends-on: T1

Interfaces:
- validateState(state) retorna valid e errors.
- resolveProjeto(cwd) retorna status absent, unreadable, invalid, valid ou ambiguous, além dos campos atuais.
- diagnoseProject(cwd) retorna status, statePath, checks, checkpoint, cycle e evidence sem escrever.

- [ ] Passo 1: adicionar testes para ausência, JSON truncado, phase ausente/null/vazio, nível inválido, state válido e dois projetos.
- [ ] Passo 2: rodar npm.cmd test -- tests/state.test.js tests/instructions.test.js tests/diagnostics.test.js e confirmar falhas por APIs ausentes.
- [ ] Passo 3: implementar validateState para version 1, project, phase, reviewRound e enxuto, sem defaults destrutivos.
- [ ] Passo 4: diferenciar arquivo ausente, ilegível, inválido e válido em resolveProjeto, conservando caminho e erro.
- [ ] Passo 5: fazer buildStateLine e blocoEstado bloquearem criação ou reinício em unreadable e invalid.
- [ ] Passo 6: implementar diagnoseProject somente leitura, verificando artefatos esperados pela fase, reviewRound, checkpoint, ciclo e evidências existentes.
- [ ] Passo 7: rodar os três arquivos e npm.cmd test; todos devem passar.

### T3 — Persistência auxiliar e comandos honestos

ID: T3
Especialista: hooks e persistência atômica.

Files:
- Modify: hooks/stilo-state.js
- Modify: hooks/stilo-prompt.js
- Modify: hooks/stilo-instructions.js
- Modify: tests/hooks.test.js
- Modify: tests/state.test.js
- Depends-on: T2

Interfaces:
- writeCheckpoint/readCheckpoint e writeCycle/readCycle usam o mesmo contrato de erro e atomicidade.
- parseComando reconhece doctor, checkpoint e ciclo sem quebrar stilo, stilo-off e enxuto.

- [ ] Passo 1: testar .stilo/off como diretório e confirmar erro explícito sem texto de sucesso.
- [ ] Passo 2: testar falha na remoção do flag e confirmar que /stilo não anuncia religação.
- [ ] Passo 3: testar checkpoint válido, preservação de state.json e checkpoint corrompido sem sobrescrita.
- [ ] Passo 4: implementar leitura e gravação atômica com arquivo temporário, rename, updated UTC e limpeza best-effort.
- [ ] Passo 5: implementar /stilo checkpoint como orientação do schema e exibição de tarefa e pendências quando o arquivo é válido.
- [ ] Passo 6: implementar /stilo ciclo id com slug [a-z0-9][a-z0-9-]{1,48}, gravando apenas .stilo/cycle.json.
- [ ] Passo 7: verificar retorno de setOff e releitura de isOff antes de confirmar off/on; erro mantém código 0.
- [ ] Passo 8: rodar os testes de hooks, state e instructions e depois npm.cmd test.

### T4 — Validador de planos

ID: T4
Especialista: parser Markdown e grafos.

Files:
- Create: scripts/validate-plan.js
- Create: tests/validate-plan.test.js
- Modify: package.json
- Depends-on: T1

Interfaces:
- parsePlan(text) retorna tasks e errors.
- validatePlan(text) retorna valid, errors e waves.
- CLI node scripts/validate-plan.js arquivo retorna 0 válido, 1 erro de validação e 2 para uso/arquivo inválido.

- [ ] Passo 1: criar fixtures para plano válido, ID duplicado, dependência inexistente, ciclo A-B-A, arquivo compartilhado na mesma onda e Files ausente.
- [ ] Passo 2: rodar node --test tests/validate-plan.test.js e confirmar a falha inicial.
- [ ] Passo 3: extrair de cada bloco Tarefa o ID, especialista, Files e Depends-on e apontar linha aproximada em campo ausente.
- [ ] Passo 4: validar IDs, dependências, ciclo DFS e arquivos normalizados; formar ondas respeitando dependências e serializar tarefa incerta.
- [ ] Passo 5: implementar CLI somente leitura com saída em português e códigos 0/1/2.
- [ ] Passo 6: adicionar ao package.json o script validate-plan apontando para docs/superpowers/plans/2026-09-07-retomada-confiavel-governanca-plan.md; cada tarefa deste arquivo já contém ID, especialista, Files e Depends-on.
- [ ] Passo 7: rodar node --test tests/validate-plan.test.js e npm.cmd run validate-plan.

### T5 — Evidências e ciclos

ID: T5
Especialista: documentação de processo e integração do diagnóstico.

Files:
- Modify: hooks/stilo-diagnostics.js
- Modify: hooks/stilo-instructions.js
- Modify: docs/aceite.md
- Create: docs/evidencias-template.md
- Modify: tests/diagnostics.test.js
- Depends-on: T2, T3

Interfaces:
- readEvidence(path) retorna criteria e errors.
- readCycle(path) retorna id, started e baseReview.
- diagnoseProject marca DONE com requisito obrigatório pendente.

- [ ] Passo 1: criar docs/evidencias-template.md com a tabela critério, tarefa, comando, tipo, resultado e review.
- [ ] Passo 2: atualizar docs/aceite.md para os 14 critérios, mantendo limitações e distinguindo local, viva e pendente.
- [ ] Passo 3: testar DONE com evidência pendente sem alterar state.json.
- [ ] Passo 4: implementar leitura tolerante de ciclo e listagem dos documentos docs/superpowers/specs/<id>-design.md e docs/superpowers/plans/<id>-plan.md.
- [ ] Passo 5: rodar node --test tests/diagnostics.test.js e verificar que specs e planos anteriores continuam presentes.

### T6 — Copilot e OpenCode

ID: T6
Especialista: integração de plugins.

Files:
- Modify: AGENTS.md
- Modify: spec.md
- Modify: README.md
- Modify: README.en.md
- Modify: docs/contrato-hooks.md
- Modify: .opencode/plugins/stilo.mjs
- Modify: tests/manifestos.test.js
- Create: tests/opencode-runtime.test.js
- Depends-on: T2

Interfaces: preservar experimental.chat.system.transform, documentar fallback por AGENTS.md e executar smoke test com OPENCODE_BIN quando disponível; ausência do binário fica pendente, não sucesso.

- [ ] Passo 1: retirar Copilot da camada de hooks e declarar suporte manual nos quatro documentos.
- [ ] Passo 2: separar em docs/contrato-hooks.md o contrato observado, alias CLAUDE_PLUGIN_ROOT no Codex e compatibilidade não verificada.
- [ ] Passo 3: documentar fallback manual do AGENTS.md quando o hook experimental não existir, preservando best-effort.
- [ ] Passo 4: criar smoke test: executar OPENCODE_BIN ou opencode --version; se ausente, marcar skip explícito; se presente, executar modo não interativo curto e procurar Estado do Stilo Code.
- [ ] Passo 5: fazer tests/manifestos.test.js detectar retorno indevido de Copilot à camada de hooks e ausência do fallback.
- [ ] Passo 6: rodar os testes e registrar ausência do CLI em docs/aceite.md como pendência viva.

### T7 — Fonte única, adaptadores e CI

ID: T7
Especialista: compatibilidade e verificação.

Files:
- Modify: AGENTS.md
- Modify: modules/orquestracao.md
- Modify: README.md
- Modify: README.en.md
- Modify: package.json
- Create: .github/workflows/verify.yml
- Modify: .cursor/rules/stilo.mdc
- Modify: .clinerules/stilo.md
- Modify: .windsurf/rules/stilo.md
- Modify: .kiro/steering/stilo.md
- Modify: .qoder/rules/stilo.md
- Modify: .agents/rules/stilo.md
- Depends-on: T3, T5, T6

Interfaces: npm run sync regenera seis destinos; CI executa testes, sync check, validador e diff check sem dependências novas.

- [ ] Passo 1: inserir no AGENTS.md as regras de state seguro, checkpoint, doctor, evidências, ciclos e suporte corrigido.
- [ ] Passo 2: atualizar modules/orquestracao.md com npm run validate-plan e bloqueio de plano inválido, sem scheduler.
- [ ] Passo 3: rodar npm run sync e node scripts/sync-adapters.js --check.
- [ ] Passo 4: atualizar READMEs com os comandos novos e limites de Copilot/OpenCode, sem promessas vivas.
- [ ] Passo 5: criar workflow com Node 18, 20 e 24 executando npm test, npm run sync -- --check, npm run validate-plan e git diff --check.
- [ ] Passo 6: rodar os mesmos comandos localmente e confirmar ausência de dependências novas.

### T8 — Integração, FIX e review

ID: T8
Especialista: coordenação e revisão.

Files:
- Modify: .stilo/review-04.md
- Modify: .stilo/state.json
- Modify: docs/aceite.md
- Create: .stilo/review-05.md
- Depends-on: T2, T3, T4, T5, T6, T7

- [ ] Passo 1: rodar npm.cmd test, node scripts/sync-adapters.js --check, npm.cmd run validate-plan e git diff --check; guardar linhas decisivas.
- [ ] Passo 2: simular state ilegível, phase ausente, falha de off, checkpoint inválido, ciclo de plano e DONE com evidência pendente.
- [ ] Passo 3: revisar diff contra a spec nova e este plano, com foco em defaults, erros engolidos, escopo extra e promessas sem evidência.
- [ ] Passo 4: marcar os seis achados no review-04 como corrigido com arquivo/linha ou descartado com motivo; preservar histórico e corrigir o resumo.
- [ ] Passo 5: manter state em REVIEW enquanto houver crítico/alto ou validação obrigatória pendente; só usar DONE com review limpo e evidência exigida.
- [ ] Passo 6: gravar review-05; achado crítico/alto volta para FIX e repete T8.
- [ ] Passo 7: coordenador captura HEAD antes de cada commit e serializa commits T2-T8; sem push.

## Verificação final

Executar:

    npm.cmd test
    node scripts/sync-adapters.js --check
    npm.cmd run validate-plan
    git diff --check

O relatório final deve declarar smoke test OpenCode não executado quando o CLI estiver ausente e manter critérios vivos como pendentes.
