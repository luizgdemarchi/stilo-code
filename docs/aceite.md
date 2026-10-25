# Critérios de aceite — matriz de evidências

Critérios locais têm verificação reproduzível no checkout. Critérios vivos exigem
observação em agente instalado ou contexto independente suportado; sem essa evidência
permanecem pendentes e o projeto não é declarado `DONE`. Critérios `retirado` dependiam de
agente ou arquivo removido; o motivo fica no Resultado e eles não bloqueiam `DONE`.

| Critério | Tarefa | Comando | Tipo | Resultado | Review |
|---|---|---|---|---|---|
| 1 | T8 | `claude plugin details stilo-code@stilo-code` | viva | histórico preservado; hooks reconhecidos | review-04 |
| 2 | T8 | conversa em pasta sem `.stilo` | pendente | pendente | review-04 |
| 3 | T8 | nova sessão com `phase: PLAN` | viva | histórico preservado | review-04 |
| 4 | T8 | `/clear` durante `PLAN` | pendente | pendente | review-04 |
| 5 | T8 | concluir `SPEC` em conversa viva | pendente | pendente | review-04 |
| 6 | T3 | `node --test tests/hooks.test.js` | local | testes automáticos | review-04 |
| 7 | T7 | `node --test tests/manifestos.test.js` | local | atendido | review-04 |
| 8 | T7 | `node scripts/sync-adapters.js --check` | retirado | adaptadores e script removidos com o suporte a outros agentes (spec § 18) | review-04, review-18 |
| 9 | T7 | `node --test tests/manifestos.test.js` | retirado | caminho manual "colar o `AGENTS.md` num agente sem plugin" removido (spec § 18) | review-04, review-18 |
| 10 | T7 | `npm.cmd test` sem companions | local | atendido quando a suíte passar | review-04 |
| 11 | T7 | `node --test tests/instructions.test.js` | local | atendido | review-04 |
| 12 | T8 | conversa viva em `EXECUTE` | pendente | pendente | review-04 |
| 13 | T3 | estado legado com `enxuto` | local | override ignorado; testes | review-04 |
| 14 | T8 | mensagem em inglês numa conversa viva | pendente | pendente | review-04 |
| 15 | T6 | smoke test OpenCode | retirado | Suporte removido com o OpenCode (spec § 18); nunca executado | review-06, review-18 |
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
| 28 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato verificado localmente: classificação por tarefa com modelo e esforço separados; seleção efetiva observada: pendente | review-16, review-17 |
| 29 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato verificado localmente: risco prevalece sobre tamanho; preferência explícita prevalece; seleção efetiva observada: pendente | review-16, review-17 |
| 30 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato verificado localmente: `Aplicação confirmada: não informada pela ferramenta` é saída válida; seleção efetiva observada: pendente | review-16, review-17 |
| 31 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato verificado localmente: diagnóstico antes de escalar, uma escalada, falha de ambiente sem escalada; seleção efetiva observada: pendente | review-16, review-17 |
| 32 | T01 | `node --test tests/orchestration.test.js` | pendente | contrato verificado localmente: fallback sem subagentes, sem controle de modelo e sem controle de esforço; seleção efetiva observada: pendente | review-16, review-17 |
| 33 | T02 | `node --test tests/context.test.js tests/instructions.test.js` e `node scripts/sync-adapters.js --check` | local | política integral em PLAN/EXECUTE/REVIEW/FIX, compactada ou em fallback; 6 adaptadores em dia (adaptadores e sincronização retirados depois, no § 18) | review-16, review-17, review-18 |
| 34 | T01/T02/T03 | `npm.cmd test` | local | 130 testes: 129 passados, 0 falhas, 1 pulado (smoke OpenCode opt-in), após integrar o ciclo de 2026-10-19; snapshot anterior ao § 18, que removeu o smoke | review-16, review-17, review-18 |
| 35 | T04 | `node --test tests/harness-evaluation.test.js` | local | baseline falha exatamente tenant/identity; correção em cópia passa | ciclo 2026-10-19 |
| 36 | T09 | roteiros E01 e E03 | viva | quatro contextos Codex independentes; E01 parou sem aprovação/edição, E03 relatou achado fora da cópia; hashes da cópia intactos | relatório de avaliação do ciclo |
| 37 | T09 | roteiros E02 e E04 | viva | quatro contextos Codex independentes; ambos verificaram baseline, corrigiram só `src/records.js` em cópias e passaram os sete checks; E04 reconciliou checkpoint antes da aprovação | relatório de avaliação do ciclo |
| 38 | T01/T09 | contrato de retomada e escritor | pendente | contrato local passou; recuperação delegada não observada | relatório de avaliação do ciclo |
| 39 | T02 | `node --test tests/validate-plan.test.js` | local | colisões de recursos exclusivas rejeitadas | ciclo 2026-10-19 |
| 40 | T02 | `node --test tests/validate-plan.test.js` | local | legado válido com aviso e barreiras seriais | ciclo 2026-10-19 |
| 41 | T03/T10 | contrato e review do ciclo | local | campos de evidência, confiança, contraprova e alvo | review do ciclo |
| 42 | T05 | `node --test tests/instruction-improvement.test.js` | local | contrato e roteiro de uma candidata; nenhuma adoção sem prova | ciclo 2026-10-19 |
| 43 | T01/T07 | testes de contexto e retomada | local | regras protegidas, seleção ou fallback completo | ciclo 2026-10-19 |
| 44 | T08 | sincronização e matriz 1–48 | local | verificação local; pendências anteriores preservadas; sincronização retirada e matriz ampliada para 1–54 no § 18 | ciclo 2026-10-19, review-18 |
| 45 | T06/T09 | testes do preparador e gh --version | pendente | simulação local passou; instalação em ambiente ausente ainda não observada | relatório de avaliação do ciclo |
| 46 | T06/T09 | testes de falha/lock/PATH | pendente | fluxo local verificado; instalação real multiplataforma pendente | relatório de avaliação do ciclo |
| 47 | T07/T09 | bootstrap e primeira ativação viva | pendente | integração local passou; encaminhamento pelo agente não observado | relatório de avaliação do ciclo |
| 48 | T08 | npm.cmd test e validate-plan | local | regressão local sem dependências novas; smoke indisponível separado | ciclo 2026-10-19 |
| 49 | T01/T02 | `node --test tests/manifestos.test.js` | local | inventário: nenhum arquivo de agente removido; manifestos de Claude Code e Codex presentes | review-18 |
| 50 | T01/T02 | `node --test tests/hooks.test.js` | local | variáveis de agentes removidos não mudam a saída; Codex recebe envelope JSON | review-18 |
| 51 | T01/T03 | `node --test tests/manifestos.test.js` | local | documentação e código publicados sem agente removido, fora de arquivos históricos | review-18 |
| 52 | T03 | `claude plugin validate .` e `node --test tests/manifestos.test.js` | local | manifestos válidos e caminhos existentes | review-18 |
| 53 | T01/T03 | `node --test tests/diagnostics.test.js` | local | tipo `retirado` aceito e fora das pendências; histórico preservado | review-18 |
| 54 | T03 | `npm.cmd test` | local | suíte completa sem dependência nova | review-18 |

## Limitações

Os critérios 2, 4, 5, 12, 14 e 17 exigem conversas independentes em cliente suportado;
esta sessão não comprova novos projetos, `/clear` ou transições vivas. O critério 15 foi
retirado com o suporte ao OpenCode (§ 18). A seleção efetiva dos critérios 28–32 depende de seleção/aplicação
de modelo confirmáveis pela ferramenta; isso ainda não foi observado. O critério 38 exige
recuperação de escritor delegado ainda ativo; não havia escritor ativo para recuperar.

Verificação do host em 2026-10-19: `gh.exe` está presente (2.102.0), e `winget`,
Windows Sandbox, Docker, Podman e clientes Claude/Codex/OpenCode/Qoder não estão
disponíveis. `wsl --list --quiet` informou que o Subsistema do Windows para Linux não
está instalado. Assim, não há alvo descartável suportado para instalar `gh` ausente,
nem cliente instalado para observar primeira ativação. Não foi instalado gerenciador,
distribuição ou pacote; critérios 45–47 permanecem pendentes.

## Seleção efetiva observada

Os critérios 28–32 acima têm só o contrato verificado localmente: testes textuais não
comprovam que um modelo ou esforço foi aplicado. Para registrar a seleção efetiva, delegue
uma tarefa real e delimitada num agente que exponha subagentes e anote:

1. capacidades expostas pela ferramenta (subagentes, controle de modelo, controle de esforço);
2. modelo e esforço solicitados, com a classificação e a justificativa do contrato;
3. confirmação retornada pela ferramenta, ou `não informada pela ferramenta`;
4. resultado da validação da tarefa.

Só marque a linha viva como atendida com essa evidência. Sem confirmação da ferramenta, ela
permanece pendente. Não crie subagente fictício para declarar aceite.

## Evidência histórica preservada

Reviews `.stilo/review-01.md` a `.stilo/review-07.md`, checkpoints e evidências de ciclos
anteriores não são apagados. O ciclo atual registra `baseReview: 11` em `.stilo/cycle.json`.
