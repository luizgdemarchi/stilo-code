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
- Estado atual: `PLAN`, `reviewRound: 11`; T01 foi preservada e a fase retornou de
  `EXECUTE` após detectar premissa errada em T02.
- T01: concluída. RED: `node --test tests/orchestration.test.js` falhou 3/5 pelas
  cláusulas ausentes. GREEN: 5/5 passaram após política, contrato e cenários.
- T02: não iniciada. O plano assumia que `orquestracao.md` já era injetado e protegido,
  mas `modulosDaFase()` não carrega esse módulo. A fase voltou a `PLAN` antes de alterar
  runtime. Ajuste proposto no plano: incluir `hooks/stilo-instructions.js` e
  `tests/instructions.test.js`, carregar `orquestracao.md` em `PLAN`, `EXECUTE` e `REVIEW`
  sem mudar assinaturas, orçamento ou algoritmo.
- T03: não iniciada; depende de T02.
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
