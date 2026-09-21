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

## Limitações

Os critérios 2, 4, 5, 12, 14 e 17 exigem uma conversa real e continuam pendentes. O
critério 15 permanece dispensado; o fallback suportado é copiar `AGENTS.md` para o
projeto. Nenhuma instalação ou publicação foi feita neste ciclo.

## Evidência histórica preservada

Reviews `.stilo/review-01.md` a `.stilo/review-07.md`, checkpoints e evidências de ciclos
anteriores não são apagados. O ciclo atual registra `baseReview: 7` em `.stilo/cycle.json`.
