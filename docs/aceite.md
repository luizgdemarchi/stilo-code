# Critérios de aceite — matriz de evidências

Os 15 critérios de `spec.md` permanecem rastreados. `local` registra uma verificação reproduzível no checkout, `viva` registra execução observada no agente e `pendente` impede que o diagnóstico trate `DONE` como comprovado.

| Critério | Tarefa | Comando | Tipo | Resultado | Review |
|---|---|---|---|---|---|
| 1 | T8 | `claude plugin details stilo-code@stilo-code` | viva | Instalação local e via GitHub reconheceu 2 skills e 3 hooks | review-04 |
| 2 | T8 | conversa em pasta sem `.stilo` | pendente | Mecanismo local verificado; comportamento vivo ainda não executado | review-04 |
| 3 | T8 | nova sessão com `phase: PLAN` | viva | Sessão instalada reportou `PLAN` e a próxima ação | review-04 |
| 4 | T8 | `/clear` durante `PLAN` | pendente | Matcher e releitura do disco verificados; conversa viva ainda não executada | review-04 |
| 5 | T8 | concluir `SPEC` em conversa viva | pendente | Instrução publicada; gravação, avanço e aviso ainda não observados juntos | review-04 |
| 6 | T3 | `node --test tests/hooks.test.js` | local | Desligamento e religação, inclusive falhas simuladas, passam | review-04 |
| 7 | T7 | `node --test tests/manifestos.test.js` | local | Guard sem `node` no PATH permanece coberto | review-04 |
| 8 | T7 | `node scripts/sync-adapters.js --check` | local | Adaptadores sincronizados no checkout | review-04 |
| 9 | T7 | `node --test tests/manifestos.test.js` | local | AGENTS.md autossuficiente permanece coberto | review-04 |
| 10 | T7 | `npm.cmd test` | local | Pipeline sem companion obrigatório permanece coberto | review-04 |
| 11 | T7 | `node --test tests/instructions.test.js` | local | Módulos carregam conforme a fase | review-04 |
| 12 | T8 | conversa viva em `EXECUTE` | pendente | Resolução `pleno` verificada; forma da resposta ainda não observada | review-04 |
| 13 | T3 | `node --test tests/hooks.test.js` | local | Override `enxuto: pleno` persiste sem mudar a fase | review-04 |
| 14 | T8 | mensagem em inglês numa conversa viva | pendente | Regra publicada; resposta do agente ainda não observada | review-04 |
| 15 | T6 | `OpenCode CLI ausente; smoke test pendente` | pendente | `OpenCode CLI ausente; smoke test pendente` | review-04 |

## Limitações e validações vivas

Os critérios 2, 4, 5, 12, 14 e 15 continuam pendentes. Os cinco primeiros exigem uma conversa real porque testes de hook provam o contexto injetado, mas não provam que o agente seguirá a instrução. O critério 15 exige o smoke test do OpenCode.

O smoke test de OpenCode também permanece pendente. Em 2026-09-08, `node --test tests/opencode-runtime.test.js` registrou literalmente `OpenCode CLI ausente; smoke test pendente`; não há validação viva do hook experimental. O fallback suportado é fornecer o `AGENTS.md` na raiz do projeto.

GitHub Copilot CLI tem suporte manual por `AGENTS.md`; o pacote não publica manifesto de hooks para o Copilot.

## Evidência histórica preservada

- A instalação local e via GitHub retornou `Successfully installed (scope: user)` e reconheceu `Skills (2)` e `Hooks (3)`.
- O teste de manifestos cobre o matcher `startup|resume|clear|compact` e o guard de PowerShell quando `node` não está no PATH.
- A suíte cobre persistência de `enxuto`, seleção de módulos e sincronização dos seis adaptadores.
- Os documentos e reviews de ciclos anteriores permanecem no repositório; `.stilo/cycle.json` apenas seleciona o ciclo atual.

Use [evidencias-template.md](evidencias-template.md) para iniciar a matriz de um novo ciclo sem apagar esta história.
