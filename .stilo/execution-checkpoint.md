# Caderno de bordo — Stilo Code

Atualizado: 2026-09-21T12:00:00Z

## Estado persistido

- Projeto: `stilo-code`
- Fase: `REVIEW`
- Rodada: `11`
- Modo enxuto efetivo: `pleno` (state: `auto`)
- Commits locais: `33ce81c feat: tornar pipeline do Stilo automático`, publicado em `origin/main`.
- Working tree: mudanças locais do ciclo de auditoria; `review-11` limpo.

## Concluído

- Pipeline, hooks, skills, manifestos, adaptadores e módulos implementados.
- Diagnóstico seguro, checkpoints/ciclos, validador de planos e matriz de evidências.
- Guard de `stdout` para `EPIPE` e teste de regressão.
- `review-05` preservado; `review-06` registrado com 0 achados.
- Orçamento de 22.000 caracteres para contextos nominais por fase, com teste de regressão.
- Documentação sobre a diferença entre checkout e plugin instalado em `README.md` e
  `README.en.md`.
- `review-07` registrado com 0 achados após re-review independente.
- T01–T05 do ciclo automático sem comandos implementadas; comandos e skills públicos removidos.
- Compactação automática local com fallback para contexto completo implementada e testada.
- `review-08` corrigido: módulos aplicáveis agora são prioritários na compactação.
- `claude plugin validate .`: passou.
- `npm.cmd test`: 72 testes, 71 passados, 1 smoke pendente.
- `node --test tests/instructions.test.js`: 15/15 passados.
- `node scripts/sync-adapters.js --check`: passou.
- `npm.cmd run validate-plan`: 8 tarefas, 6 ondas, passou.
- `git diff --check`: passou.
- Auditoria opcional de simplificação especificada em `spec.md` § 15 e implementada sem
  comando, dependência ou remoção automática.
- `modules/auditoria.md` carregado apenas em `DONE`; contrato textual coberto por
  `tests/audit.test.js` e `tests/instructions.test.js`.
- Critérios locais 22–27 registrados como atendidos em `docs/aceite.md`.
- `review-10` corrigido e `review-11` registrado com 0 achados.

## Validação viva tentada

Uma sessão Claude não interativa com o plugin do checkout chegou ao fluxo `/stilo
live-probe`, mas pediu confirmação para criar `live-probe/.stilo/state.json`; a
execução foi encerrada sem criar arquivos. Isso não comprova o critério vivo de
criação de projeto.

## Pendências obrigatórias

- Critérios vivos 2, 4, 5, 12 e 14 em `docs/aceite.md`.
- Critério 15 (OpenCode) permanece pendente por dispensa do usuário.
- O plugin instalado em `~/.claude/plugins/cache/stilo-code/stilo-code/0.1.0`
  está defasado em relação ao checkout atual; não atualizar sem publicação/instalação
  autorizada.
- Não marcar `DONE` enquanto a evidência obrigatória continuar pendente.

## Novo ciclo — automático sem comandos

- Escopo: remover comandos e skills públicos; hooks automáticos; compactação local de contexto.
- Base: `reviewRound: 7`; reviews anteriores permanecem históricos.
- Plano: `docs/superpowers/plans/2026-09-18-automatico-sem-comandos-plan.md`.
- Pendências vivas anteriores continuam pendentes até evidência em agente instalado.

## Emenda — auditoria opcional de simplificação

- Plano: `docs/superpowers/plans/2026-09-21-auditoria-opcional-simplificacao-plan.md`.
- Design: `docs/superpowers/specs/2026-09-21-auditoria-opcional-simplificacao-design.md`.
- Critérios 22–27 atendidos localmente; a auditoria não bloqueia `DONE`.

## Próxima ação

`review-11` está limpo. Permanecer em `REVIEW` enquanto os critérios vivos continuarem
pendentes; não reinstalar/publicar o plugin sem autorização.

## Ciclo 2026-10-01 — seleção de modelo e esforço

- Plano: `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md`.
- Base: `ff4e2163cd69ae825bf9016975aca5a606a523e9`; execução sem commits nem publicação.
- Estado em 2026-10-01 (histórico): `PLAN`, `reviewRound: 11`; T01 foi preservada e a
  fase retornou de `EXECUTE` após detectar premissa errada em T02. Estado atual: ver a
  seção de 2026-10-24 abaixo.
- T01: concluída. RED: `node --test tests/orchestration.test.js` falhou 3/5 pelas
  cláusulas ausentes. GREEN: 5/5 passaram após política, contrato e cenários.
- T02 (2026-10-01): não iniciada. O plano assumia que `orquestracao.md` já era injetado e protegido,
  mas `modulosDaFase()` não carrega esse módulo. A fase voltou a `PLAN` antes de alterar
  runtime. Ajuste proposto no plano: incluir `hooks/stilo-instructions.js` e
  `tests/instructions.test.js`, carregar `orquestracao.md` em `PLAN`, `EXECUTE` e `REVIEW`
  sem mudar assinaturas, orçamento ou algoritmo.
- T03 (2026-10-01): não iniciada; depende de T02.
- Modelo solicitado: `gpt-5.6-sol`; esforço solicitado: `medium`.
- Aplicação confirmada: não informada pela ferramenta; o retorno de delegação confirmou
  somente `task_name=/root/implementacao`.
- Desvio do plano: `README.pt-BR.md` não existe; o segundo README real é `README.en.md`.
  O caminho de T03 foi corrigido antes da implementação.

## Proposta atual — 2026-10-19 — confiabilidade e GitHub CLI

Este registro é a orientação atual; os blocos anteriores são históricos.

- Pedido: planejar as cinco melhorias identificadas no Vibe Coding Toolkit e incluir
  preparação do GitHub CLI (`gh`) quando o Stilo for instalado/ativado.
- Escopo confirmado pelo pedido de plano. Spec escrita ainda não aprovada; plano entregue
  como preliminar, sem autorização para implementação.
- Fase: `SPEC`; `reviewRound: 11` preservado. Nenhum review novo produzido nesta etapa.
- Spec: `docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md`, vinculada em `spec.md` § 17.
- Plano: `docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`, dez tarefas/seis ondas.
- Os documentos registram escolhas, interfaces, arquivos, recursos e critérios 35–48.
- Pré-requisito: concluir a integração de orquestração no contexto já identificada no ciclo
  de 2026-10-01; prevista em T01. Não presumir T02/T03 anteriores concluídas.
- Preparação de gh: reutilizar instalação existente; tentar gerenciador suportado fora do
  timeout do hook; primeira ativação encaminha a tarefa pelo agente; sem login automático.
- Modelo e esforço desta etapa: aplicação não informada pela ferramenta; nenhuma troca alegada.
- Nenhum código de produto alterado; nenhum teste de implementação ou instalador executado.
- Validação do plano: `node scripts/validate-plan.js docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`
  informou `Plano válido: 10 tarefa(s), 6 onda(s).` Recursos ainda não são validados pelo
  parser atual; conferidos manualmente nesta proposta, com cobertura automatizada prevista em T02.
- `git diff --check`: sem erros. Ciclo antigo preservado em
  `.stilo/cycles/automatico-sem-comandos.json`; ciclo e checkpoint atuais apontam para a spec proposta.
- Próxima ação: usuário revisar a spec escrita e o plano preliminar. Após aprovação da spec,
  registrar PLAN; só executar após confirmar o plano. Método recomendado: coordenador em série.
- Pendências vivas anteriores continuam pendentes; não marcar DONE por esta entrega.

## Execução atual — 2026-10-19 — orientação para retomada

Este bloco substitui as próximas ações históricas acima.

- Usuário aprovou spec e plano escritos: “spec e plano aprovado”. Execução serial autorizada.
- T01–T08 implementadas e verificadas; T09 produziu
  `docs/evaluations/2026-10-19-confiabilidade-agente.md`, com provas locais e não executados.
- Revisão independente somente leitura identificou dois médios em review-12, ambos
  corrigidos com regressões RED/GREEN: recursos em plano misto legado e watchdog do executor.
- Review-13: conferência das correções pelo coordenador, sem achados novos confirmados.
- Estado atual: REVIEW, reviewRound 13. Não marcar DONE por pendências vivas obrigatórias.
- `npm.cmd test`: 114 testes, 113 aprovados, 0 falhas, 1 smoke OpenCode pulado.
- Plano atual válido: dez tarefas/seis ondas. Planos legados continuam válidos com aviso
  e barreiras seriais. Seis adaptadores sincronizados; diff sem erros de whitespace.
- Preparador real executado duas vezes: reutilizou gh 2.102.0 existente; nenhuma instalação,
  autenticação, publicação, commit ou push. Instalação com gh ausente continua pendente.
- Casos E01–E05 não foram despachados para agente avaliado; nenhum /clear observado.
  Revisão independente do diff não satisfaz esses cenários.
- Matriz de 48 critérios válida; pendentes 2, 4, 5, 12, 14, 15, 17, 28, 30, 36, 37, 38, 45–47.
- Modelo solicitado ao revisor: gpt-6-astra/high; retorno confirmou task_name apenas.
  Aplicação de modelo/esforço não alegada. Executor atual sem troca confirmada.
- Mantido checkout com alterações prévias; sem worktree novo, conforme execução serial e
  preservação do plano. Snapshot do conteúdo revisado registrado no review-13; baseline e
  logs locais em `.superpowers/sdd/2026-10-19-confiabilidade-agente-plan/` preservados.
- Próxima ação: executar provas vivas em cliente/ambiente descartável configurado e
  autorizado; atualizar matriz somente após observar. Auditoria opcional não foi iniciada.
## Sessão 2026-10-24 — T02 bloqueada por orçamento

- Atualizado: 2026-10-24T23:15:01Z. Fase devolvida a `PLAN` a partir de `EXECUTE`; `reviewRound: 11`.
- Execução nesta sessão: Claude Code, Opus 5.5 inline; `gpt-5.6-sol` indisponível, sem
  alegar troca.
- Regressão de T01: `AGENTS.md` § 4 levou o contexto completo de REVIEW a 22.286
  caracteres; falha `contexto nominal por fase respeita o orçamento de 22 mil caracteres`.
- T02 parcial no working tree: testes novos em `tests/context.test.js` e
  `tests/instructions.test.js`, `context.test.js` em `tests/all.test.js`, e
  `modulosDaFase()` carregando `orquestracao.md` em PLAN/EXECUTE/REVIEW. PLAN e EXECUTE
  compactam com a política inteira (15.890 / 15.899).
- Bloqueio: REVIEW completo 25.596 > 22.000; blocos protegidos 16.648 > 16.000, o que
  força fallback e quebra `contexto automático reduz módulos opcionais sem perder estado`.
- Decisão do usuário: elevar orçamentos (17.000 / 26.000). Plano emendado; EXECUTE retomado.

## Sessão 2026-10-24 — T02/T03 concluídas, review-16 em FIX (numeração final)

- T02 concluída: `orquestracao.md` em `modulosDaFase()`; testes de política integral e
  fallback; `context.test.js` em `tests/all.test.js`; 6 adaptadores sincronizados.
- T03 concluída: seção de modelo e esforço nos dois READMEs; critérios 28–34 em
  `docs/aceite.md`; `REQUIRED_EVIDENCE_CRITERIA` 27 → 34 em `hooks/stilo-diagnostics.js`.
- `review-16`: 11 achados (0 crítico, 1 alto, 3 médio, 7 baixo). Revisor: modelo
  solicitado `opus`, esforço `xhigh`; ambiente informou Opus 5.5, esforço não confirmado.
- Decisões do usuário no FIX: `CONTEXT_BUDGET` 19.500 com `## 3. Estado em disco` e
  `## 5. Módulos` protegidos; política carregada também em `FIX`.
- FIX concluído: 11 achados do `review-16` corrigidos; `npm.cmd test` 99 testes, 98 passados,
  1 pulado.
- `review-17` (re-review independente, modelo solicitado `opus`; ambiente informou Opus 5.5,
  esforço não informado): 11 correções verificadas; 3 achados baixos — 1 descartado com
  motivo, 2 corrigidos.
- Ciclo encerrado localmente com `review-17` sem achado crítico, alto ou médio.

## Integração 2026-10-24 — rebase sobre o ciclo remoto de 2026-10-19

- O push foi rejeitado: `origin/main` tinha 3 commits do ciclo de confiabilidade e GitHub
  CLI (`7b7b1bb`, `10d3aee`, `236b43a`), com review-12 a review-15. Por decisão do
  usuário, os commits locais foram rebaseados sobre o remoto, sem forçar push.
- Renumeração: review-12/13 locais → `review-16`/`review-17`; reviews remotos preservados.
- Fusões: `AGENTS.md`, `modules/orquestracao.md` (`## Recursos exclusivos` movido para antes
  de `## Cenários de decisão`, cujos itens tinham ficado sob a seção nova), hooks, testes,
  `spec.md`, `plan.md` e `docs/aceite.md` (48 critérios; 28–34 com a evidência deste ciclo).
- Orçamento após a fusão: `CONTEXT_BUDGET` 19.500 com § 3/§ 5 protegidos. PLAN/EXECUTE/FIX
  compactam (~19.300); REVIEW protege 22.770 e usa o contexto completo (30.342), como o
  remoto já fazia. Testes ajustados para esse comportamento; compactar REVIEW exigiria ~24.500.
- `npm.cmd test`: 130 testes, 129 passados, 0 falhas, 1 pulado. Integração conferida pelo
  coordenador, sem review independente da fusão.
- Estado: `REVIEW`, `reviewRound: 17`. Pendentes: 2, 4, 5, 12, 14, 15, 17, 28–32, 36, 37,
  38, 45–47. Próxima ação: ciclo 2 — manter só Claude Code e Codex (usuário autorizou excluir
  o resto); depois audit completo de segurança com `~/.agents/skills/security-audit`.

## Ciclo 2026-10-24 — apenas Claude Code e Codex (spec § 18)

- Escopo e spec aprovados pelo usuário; plano `docs/superpowers/plans/2026-10-24-apenas-claude-codex-plan.md`.
- Removidos: OpenCode, Qoder, Copilot, Gemini/Antigravity, Cursor, Windsurf, Cline, Kiro, os
  6 adaptadores, `scripts/sync-adapters.js` e o caminho manual de colar o `AGENTS.md`.
- Runtime só reconhece Codex (`PLUGIN_DATA`) e Claude Code; tipo `retirado` no diagnóstico;
  critérios 8, 9 e 15 retirados; matriz com 54 critérios.
- `review-18` (independente; modelo solicitado `opus`, esforço `xhigh`; ambiente informou
  Opus 5.5, esforço não confirmado): 0 crítico, 0 alto, 1 médio, 5 baixo — todos corrigidos.
- `npm.cmd test`: 128/128, 0 pulados. Estado: `REVIEW`, `reviewRound: 18`, 2026-10-25T00:51:41Z.
- Pendentes vivos: 2, 4, 5, 12, 14, 17, 28–32, 36, 37, 38, 45–47. Próxima ação: audit completo
  de segurança com `~/.agents/skills/security-audit` (perfil standard, só código-fonte; sem
  sandbox de SO no host).

## Sessão 2026-10-25 — README overview-first (SPEC)

- Escopo confirmado: explicar primeiro o que o Stilo Code faz; manter README.md em pt-BR e README.en.md como tradução equivalente.
- Abordagem escolhida: visão geral primeiro; instalação e referência depois.
- SPEC aprovada em `spec.md` § 19; plano serial em `plan.md` aprovado pelo usuário em 2026-10-25.
- T01–T03 executadas; validações estáticas dos dois READMEs concluídas, sem executar código ou testes do repositório.
- Review-19 encontrou um achado menor: indicar que os documentos/checkpoints podem não existir; correção aplicada nos dois READMEs.
- Achado 1 do review-19 corrigido em `README.md` e `README.en.md`; docs de continuidade agora são explicitamente condicionais, e a abertura distingue fase persistida de decisões registradas nos documentos.
- `review-20`: zero achados; critérios 55–60 atendidos. Links relativos válidos, seções equivalentes, nenhum host retirado anunciado e `git diff --check` sem erros.
- Fase: DONE; `reviewRound: 20`. Não foram executados código ou testes do repositório.

## Novo ciclo — revisão editorial integral no pipeline

- Escopo confirmado: revisão editorial separada, cobrindo todo o texto mantido no repositório.
- Abordagem confirmada: ciclo editorial próprio depois do review técnico, com fases, relatório e contador independentes.
- Spec em `spec.md` § 20 aprovada; plano serial aprovado e implementação em andamento.

- Plano serial em `plan.md`, seção da emenda editorial, aprovado pelo usuário; execução em worktree.
- Verificações previstas: sintaxe JavaScript, whitespace e inspeção textual; testes não serão adicionados nem executados neste ciclo.
- E01–E04 não executados: exigem sessão de agente avaliado; o avaliador disponível cobre outra fixture e não comprova a nova política editorial.
- Worktree: `C:\Users\luizg\.codex\worktrees\c789\stilo-code`, branch `feat/revisao-editorial-integral`; base igual a `origin/main` em `2b3788fe7f8fb2a251a13826dcd612f2a26b5975`.
- O usuário autorizou fast-forward em `main` e push a `origin/main` depois de review limpo; instalação e deploy continuam fora do escopo.

## Execução T01–T04

- Fases `EDITORIAL_REVIEW`/`EDITORIAL_FIX` adicionadas ao ruleset e ao estado; `editorialReviewRound` opcional em estados antigos e zero em estados novos.
- Módulo editorial separado define inventário integral, exclusões, leitura contextual, relatório e ciclo de correção.
- READMEs pt-BR/en-US mostram o mesmo fluxo de nove fases e contadores separados.
- `node --check hooks/stilo-state.js`: passou. `node --check hooks/stilo-instructions.js`: passou.
- `git diff --check`: passou; Git só avisou que normalizará CRLF de `plan.md` em uma próxima gravação.
- Critérios 61–68 conferidos estaticamente nos arquivos de estado, instruções, módulo e READMEs. Sem teste de cliente ou `/clear`.
- Testes não foram adicionados nem executados; E01–E04 não executados, conforme registrado no plano.
- Estado inicial desta retomada em `REVIEW`, `reviewRound: 20`; próxima revisão técnica: `.stilo/review-21.md`.

## Retorno a PLAN — artefato editorial ignorado

- Antes de criar o review, conferi que `.gitignore` ignora `.stilo/*` e só permite `review-*.md`; `.stilo/editorial-review-NN.md` ficaria fora do histórico versionado.
- Review independente foi interrompido antes de produzir relatório. T01/T03 e verificações locais permanecem; T02/T04 precisam da exceção e conferência de ignore.
- Estado retornou a `PLAN`, `reviewRound: 20`. Plano atualizado para incluir `.gitignore`; aguardando aprovação antes de continuar.

- Usuário aprovou o plano atualizado. `.gitignore` agora permite `editorial-review-*.md`; execução retomada em `EXECUTE`.
### Execução retomada — verificação do allowlist

- `git check-ignore --quiet .stilo/editorial-review-01.md`: não ignorado.
- `git check-ignore --quiet .stilo/checkpoint.json`: continua ignorado.
- `node --check hooks/stilo-state.js` e `node --check hooks/stilo-instructions.js`: passaram.
- `git diff --check`: passou; aviso informativo de normalização CRLF em `plan.md`.
- Sem testes executados; E01–E04 continuam sem avaliação independente.
- T02 e T04 concluídas; estado avança para REVIEW round 21.

### Review técnico e fechamento do ciclo de implementação

- `.stilo/review-21.md`: revisão técnica do snapshot contra os critérios 61–68; zero achados.
- A revisão delegada não concluiu; o coordenador fez e registrou a leitura técnica. Portanto, não há confirmação de revisão independente.
- A limpeza editorial deste próprio repositório permanece fora do escopo aprovado na spec § 20; não foi executada neste ciclo.
- Estado do projeto: `DONE`, `reviewRound: 21`, `editorialReviewRound: 0`. Esse fechamento segue o escopo aprovado para a implementação e não afirma que a fase editorial do produto tenha sido executada no repositório.
- Verificações estáticas passaram; testes e E01–E04 não foram executados.

### Integração e publicação autorizadas

- `main` foi fast-forwarded da base `2b3788fe7f8fb2a251a13826dcd612f2a26b5975` para o commit revisado `27691866c385d0024b000bdfcbde718b0785b579`.
- Push realizado somente para `origin main`; `git ls-remote origin refs/heads/main` confirmou o mesmo SHA `27691866c385d0024b000bdfcbde718b0785b579`.
- Nenhuma instalação ou deploy foi realizado.
