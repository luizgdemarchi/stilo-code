# Critérios de aceite — matriz de evidências

Critérios locais têm verificação reproduzível no checkout. Critérios vivos exigem
observação em um agente instalado; sem essa evidência permanecem pendentes e o projeto
não é declarado `DONE`.

| Critério | Tarefa | Comando | Tipo | Resultado | Review |
|---|---|---|---|---|---|
| 1 | T8 | `claude plugin details stilo-code@stilo-code` | viva | histórico preservado; hooks reconhecidos | review-04 |
| 2 | T8 | conversa em pasta sem `.stilo` | pendente | pendente | review-04 |
| 3 | T8 | nova sessão com `phase: PLAN` | viva | histórico preservado | review-04 |
| 4 | T8 | `/clear` durante `PLAN` | pendente | pendente | review-04 |
| 5 | T8 | concluir `SPEC` em conversa viva | pendente | pendente | review-04 |
| 6 | T3 | `node --test tests/hooks.test.js` | local | testes automáticos | review-04 |
| 7 | T7 | `node --test tests/manifestos.test.js` | local | atendido | review-04 |
| 8 | T7 | `node scripts/sync-adapters.js --check` | local | atendido após sincronização | review-04 |
| 9 | T7 | `node --test tests/manifestos.test.js` | local | atendido | review-04 |
| 10 | T7 | `npm.cmd test` sem companions | local | atendido quando a suíte passar | review-04 |
| 11 | T7 | `node --test tests/instructions.test.js` | local | atendido | review-04 |
| 12 | T8 | conversa viva em `EXECUTE` | pendente | pendente | review-04 |
| 13 | T3 | estado legado com `enxuto` | local | override ignorado; testes | review-04 |
| 14 | T8 | mensagem em inglês numa conversa viva | pendente | pendente | review-04 |
| 15 | T6 | smoke test OpenCode | pendente | Não executado por dispensa do usuário; sem alegação de compatibilidade viva | review-06 |
| 16 | T01 | inventário de manifestos, diretórios e testes | local | `tests/manifestos.test.js` | review-09 |
| 17 | T02 | hooks em sessão nova e mensagem comum | pendente | pendente | review-09 |
| 18 | T03 | teste de tamanho por fase | local | `tests/context.test.js` | review-09 |
| 19 | T03 | fallback byte a byte | local | `tests/context.test.js` | review-09 |
| 20 | T02 | validação de estado legado | local | `tests/state.test.js` | review-09 |
| 21 | T05 | `cycle.json`, checkpoint e review-09 | local | rastreabilidade registrada | review-09 |
| 22 | T1 | instruções e teste textual | local | auditoria explicitamente opcional e sem bloqueio de `DONE` | `tests/audit.test.js`, review-10 |
| 23 | T1/T2 | módulo com e sem `ponytail-audit` | local | companion opcional, fallback interno silencioso | `tests/audit.test.js`, review-10 |
| 24 | T1/T2 | contrato de `.stilo/cleanup-NN.md` | local | histórico preservado e evidência acionável | `tests/audit.test.js`, review-10 |
| 25 | T1/T2 | teste textual de segurança | local | nenhuma remoção ou edição automática | `tests/audit.test.js`, review-10 |
| 26 | T1/T2 | contrato de transição | local | sugestão aceita retorna a `FIX` → `REVIEW` | `tests/audit.test.js`, review-10 |
| 27 | T1/T2 | lista de áreas protegidas | local | referências dinâmicas e artefatos protegidos exigem confirmação | `tests/audit.test.js`, review-10 |
| 28 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato local passou; escolha real de modelo não observada | ciclo 2026-10-19 |
| 29 | T01 | `node --test tests/orchestration.test.js` | local | contrato de risco e preferência explícita verificado | ciclo 2026-10-19 |
| 30 | T01 | contrato e registro de execução | pendente | pedido separado de confirmação; aplicação real não informada | ciclo 2026-10-19 |
| 31 | T01 | `node --test tests/orchestration.test.js` | local | diagnóstico e limite de escalada no contrato | ciclo 2026-10-19 |
| 32 | T01 | `node --test tests/orchestration.test.js` | local | fallback honesto no contrato; execução atual serial | ciclo 2026-10-19 |
| 33 | T01/T08 | testes de contexto e sincronização | local | política integral preservada ou fallback completo | ciclo 2026-10-19 |
| 34 | T02/T08 | testes do validador e suíte | local | regressão local; nenhuma delegação presumida | ciclo 2026-10-19 |
| 35 | T04 | `node --test tests/harness-evaluation.test.js` | local | baseline falha exatamente tenant/identity; correção em cópia passa | ciclo 2026-10-19 |
| 36 | T09 | roteiros E01 e E03 | pendente | não executados em agente; teste de arquivos não comprova ações | relatório de avaliação do ciclo |
| 37 | T09 | roteiros E02 e E04 | pendente | não executados em contexto independente | relatório de avaliação do ciclo |
| 38 | T01/T09 | contrato de retomada e escritor | pendente | contrato local passou; recuperação delegada não observada | relatório de avaliação do ciclo |
| 39 | T02 | `node --test tests/validate-plan.test.js` | local | colisões de recursos exclusivas rejeitadas | ciclo 2026-10-19 |
| 40 | T02 | `node --test tests/validate-plan.test.js` | local | legado válido com aviso e barreiras seriais | ciclo 2026-10-19 |
| 41 | T03/T10 | contrato e review do ciclo | local | campos de evidência, confiança, contraprova e alvo | review do ciclo |
| 42 | T05 | `node --test tests/instruction-improvement.test.js` | local | contrato e roteiro de uma candidata; nenhuma adoção sem prova | ciclo 2026-10-19 |
| 43 | T01/T07 | testes de contexto e retomada | local | regras protegidas, seleção ou fallback completo | ciclo 2026-10-19 |
| 44 | T08 | sincronização e matriz 1–48 | local | verificação local; pendências anteriores preservadas | ciclo 2026-10-19 |
| 45 | T06/T09 | testes do preparador e gh --version | pendente | simulação local passou; instalação em ambiente ausente ainda não observada | relatório de avaliação do ciclo |
| 46 | T06/T09 | testes de falha/lock/PATH | pendente | fluxo local verificado; instalação real multiplataforma pendente | relatório de avaliação do ciclo |
| 47 | T07/T09 | bootstrap e primeira ativação viva | pendente | integração local passou; encaminhamento pelo agente não observado | relatório de avaliação do ciclo |
| 48 | T08 | npm.cmd test e validate-plan | local | regressão local sem dependências novas; smoke indisponível separado | ciclo 2026-10-19 |

## Limitações

Os critérios 2, 4, 5, 12, 14 e 17 exigem uma conversa real e continuam pendentes. O
critério 15 permanece dispensado; o fallback suportado é copiar `AGENTS.md` para o
projeto. Nenhuma instalação ou publicação foi feita neste ciclo.

## Evidência histórica preservada

Reviews `.stilo/review-01.md` a `.stilo/review-07.md`, checkpoints e evidências de ciclos
anteriores não são apagados. O ciclo atual registra `baseReview: 11` em `.stilo/cycle.json`.
