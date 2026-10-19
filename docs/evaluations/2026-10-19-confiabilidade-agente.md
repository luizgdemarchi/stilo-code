# Avaliação — confiabilidade do agente e GitHub CLI

Revisão: checkout baseado em ff4e2163cd69ae825bf9016975aca5a606a523e9, com mudanças
prévias preservadas e implementação local sem commits. Ambiente: Windows, Node v24.22.0.
Modelo/esforço aplicado: não informado pela ferramenta; nenhum custo ou token medido.
Spec e plano aprovados pelo usuário em 2026-10-19. Não houve instalação do Stilo, login,
publicação, alteração de contas, instalação de gerenciador ou pacote nesta execução.

## Verificações determinísticas

- `npm.cmd test` após correções e cobertura final: 114 testes, 113 aprovados, 0 falhas, 1 smoke OpenCode pulado.
- Avaliador externo sobre cópias distintas: baseline falha exatamente tenant e identity;
  correção somente na cópia aprova os sete checks. Original, notas e instruções preservados.
- Testes de adulteração detectam mudança de notas/instruções e retorno que muta a fonte.
- Validador: dez tarefas, seis ondas; testes de recursos e legado aprovados.
- Seis adaptadores sincronizados; `git diff --check` sem erros de whitespace.
- Testes de instalação usam executor simulado e temporários exclusivos; nenhum chama gerenciador real.
- Timeout do executor foi observado com processo Node descartável e com spawn sintético
  que nunca emite close; regressões do review-12 passaram, sem instalação.

## Entradas e avaliador

Hashes SHA-256 registrados antes de qualquer avaliação viva. Nenhuma avaliação viva foi
despachada; esses hashes fixam somente a revisão dos testes determinísticos deste relatório.
Snapshot do diff para revisão inclui staged, unstaged e arquivos novos, separando baseline
prévio da sessão; registro local em `.superpowers/sdd/2026-10-19-confiabilidade-agente-plan/`.
O avaliador e a fixture fonte ficam fora da cópia testada. Não foi configurado isolamento
de permissões para um agente avaliado; não alegar sandbox efetivo. VM limita tempo e não
é fronteira de segurança. Os testes unitários modificam cópias com solução conhecida para
validar o avaliador; isso não conta como avaliação de agente.

## Observação viva

| Caso | Situação | Evidência e limite |
|---|---|---|
| E01 | não executado | Nenhuma sessão de avaliação de agente iniciada com spec sintética pendente |
| E02 | não executado | Avaliador local rejeita código quebrado, mas agente com relato falso não foi observado |
| E03 | não executado | Hashes são verificáveis; não houve revisão da fixture por agente sob permissão isolada |
| E04 | não executado | Contrato de retomada testado; nenhum cliente reiniciado com checkpoint sintético |
| E05 | não executado | Opcional; ambiente externo representativo não configurado |

Contexto independente de revisão de código não equivale a executar esses roteiros nem
comprova `/clear`. CLI de agente não foi localizada no PATH desta sessão; não instalar
cliente/provedor nem iniciar chamadas pagas para produzir evidência. Os roteiros permanecem
disponíveis em docs/avaliacao-agente.md para sessão configurada com permissões apropriadas.

`gh --version` retornou `gh version 2.102.0 (2026-09-30)`. Duas chamadas reais de
`node scripts/setup-github-cli.js` retornaram `status: available`, executável `gh.exe`,
mesma versão e autenticação não consultada. Isso comprova detecção/reuso neste Windows.
Não comprova instalação com gh ausente, WinGet/Homebrew/apt/dnf reais nem encaminhamento
da primeira ativação pelo agente. Nenhuma máquina descartável sem gh estava disponível.

## Pendências e próxima observação

Critérios 36, 37, recuperação delegada de 38 e partes vivas de 45–47 permanecem pendentes.
Também permanecem os aceites vivos dos ciclos anteriores, incluindo 28/30, e o smoke
OpenCode dispensado. Não declarar DONE. Executar os roteiros em cliente configurado e
registrar ações/hashes; instalar gh somente em ambiente descartável com acesso autorizado.

Hashes das entradas:

- scripts/evaluate-harness.js: `1693a8342dba048dc69a8f41fac01a2c5848f942f1d3b5081b5cf07a31035942`
- tests/fixtures/harness/project/src/records.js: `c76cbe486c513202d29eb2e9912be75fdae7caeb380faf36c7e32c5703bec484`
- tests/fixtures/harness/project/AGENTS.md: `623a57fa782ab7929c3a42b0e86602009530bf1e4dad854c85bcb57772b85fd3`
- tests/fixtures/harness/project/local-notes.md: `8d1dfa290bb16636b2ed6b274e496da449351b2520c31fb9ee9f62f4d3c4fdb1`
