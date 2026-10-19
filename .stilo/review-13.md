# Review 13 — Stilo Code

Revisado: snapshot final staged, unstaged e arquivos novos sobre
ff4e2163cd69ae825bf9016975aca5a606a523e9; nenhum commit ou publicação.
Contra: spec.md §17 e plano aprovado 2026-10-19-confiabilidade-agente.
Revisão independente na rodada 12; nesta rodada o coordenador reviu as correções e
os caminhos afetados. Não houve segunda delegação nem alegação de revisão independente
das correções. Módulos de revisão/orquestração carregados.

## Resumo

0 achados novos confirmados. Os 2 médios do review-12 estão corrigidos e testados.
Nenhum crítico/alto confirmado. O projeto permanece em REVIEW pelas provas obrigatórias
pendentes; review limpo não equivale a evidência viva completa.

## Evidência e contraprova

1. Plano misto A(db:teste), L(legado), B(db:teste): a regressão falhou antes e passou
   depois da validação de recursos nas ondas efetivas (`scripts/validate-plan.js:295`).
   Colisões de arquivos nas candidatas continuam rejeitadas; recursos na mesma onda
   continuam rejeitados, inclusive portas curinga, aliases e diretórios pai/filho.
2. Executor sem close: regressão sintética falhou aguardando a promessa antes da correção
   e passou depois do watchdog (`scripts/setup-github-cli.js:17`). Retorna timedOut:true,
   stopped:false, fecha streams do controlador e não espera close. O preparador mantém
   lock quando não comprova parada; teste de timeout/persistência passou. O processo real
   descartável também passou no Windows. Não inferir comportamento de instalador Unix real.
3. Receita corrompida, lock alheio, concorrência, retry, privilégio, PATH Windows e
   executável indicado no receipt têm cobertura local. Nenhum gerenciador foi executado
   pelos testes, e nenhuma autenticação foi iniciada. Gh já existente foi reutilizado.
4. Fixture original permanece deliberadamente falha; teste distingue baseline de cópia
   corrigida. Adulteração de instruções/notas, mutação, exclusão e symlink são detectados.
   VM não é alegada como sandbox; ausência de isolamento de agente está declarada.

Confiança alta nas correções locais reproduzidas; nenhuma nova hipótese foi promovida a
bug sem evidência. As contraprovas da revisão independente permanecem em review-12.

## Validação final

- `npm.cmd test`: 114 testes, 113 aprovados, 0 falhas, 1 smoke OpenCode pulado.
- `node scripts/sync-adapters.js --check`: seis adaptadores em dia.
- Plano atual: dez tarefas, seis ondas, válido; planos legados de 2026-10-01 e 2026-09-18
  também válidos, com aviso e ondas conservadoras.
- `git diff --check`: sem erros de whitespace.
- Matriz: 48 critérios únicos, nenhum erro de formato; IDs extras/ausentes/duplicados
  continuam rejeitados. Evidências antigas/pendências não foram removidas.

## Critérios de aceite 35–48

| Critério | Situação e evidência |
|---|---|
| 35 | Local: baseline e correção distinguidos pelo avaliador em cópias separadas |
| 36 | Pendente: E01/E03 não observados em agente |
| 37 | Pendente: E02/E04 não observados em contexto independente |
| 38 | Contrato local; recuperação de escritor delegado pendente |
| 39 | Local: colisões de recursos rejeitadas |
| 40 | Local: legado e plano misto aceitos com aviso/barreiras |
| 41 | Local: reviews com alvo, evidência, confiança e contraprova; histórico preservado |
| 42 | Local: protocolo/template de comparação; nenhuma candidata adotada sem prova |
| 43 | Local: regras e orquestração protegidas ou fallback integral |
| 44 | Local: adaptadores e matriz 1–48 válidos |
| 45 | Detecção/reuso reais; instalação de gh ausente pendente |
| 46 | Local: concorrência, timeout, falhas e PATH; instalação viva multiplataforma pendente |
| 47 | Bootstrap local; encaminhamento vivo pelo agente pendente |
| 48 | Local: suíte/planos válidos; nenhuma dependência npm nova |

Também pendentes: 2, 4, 5, 12, 14, 15, 17, 28 e 30. Próxima ação: executar roteiros
vivos em ambiente configurado, preservando permissões e registrando observação independente.
Auditoria opcional será oferecida quando as provas obrigatórias permitirem DONE.

## Alvo e exclusões do snapshot

Hashes abaixo identificam o conteúdo final revisado. Metadados de estado/checkpoint,
caderno de bordo e este próprio relatório são atualizados após a revisão; excluídos dos
hashes para não criar autorreferência. Arquivos ignorados locais de log não são produto.
O snapshot não inclui arquivos inalterados do repositório. Não há alterações staged.

Snapshot verificado em 2026-10-19T15:45:54.638477Z.

| Arquivo | SHA-256 |
|---|---|
| `.agents/rules/stilo.md` | `9fff4aa981841905fd15faf10c3cee524cc01df10d2c50b33fa33dbaabe96abb` |
| `.clinerules/stilo.md` | `9fff4aa981841905fd15faf10c3cee524cc01df10d2c50b33fa33dbaabe96abb` |
| `.cursor/rules/stilo.mdc` | `f6d712fa2a80bee29eb951e6a994cdaf58f71ebe6b179ed13050af1c2d17dd88` |
| `.kiro/steering/stilo.md` | `44d5c0eb85e87ef94ca9da885c0634c0bde7c2d7ef23b2728ece0ec22c895af0` |
| `.qoder/rules/stilo.md` | `9fff4aa981841905fd15faf10c3cee524cc01df10d2c50b33fa33dbaabe96abb` |
| `.stilo/review-12.md` | `5a7b21a70494681e5c4e47a334be4ab03d3d215cc12c97871ee66456a003472d` |
| `.windsurf/rules/stilo.md` | `9fff4aa981841905fd15faf10c3cee524cc01df10d2c50b33fa33dbaabe96abb` |
| `AGENTS.md` | `b7e92e3b7fac7cd3763bda24bff2d80cf1786cc901842cda87b43d7603667f69` |
| `README.en.md` | `1d73b45a8bd41842a566bf01db14c03c775edb0763fd5312887c5c05162d07b7` |
| `README.md` | `5c9caa9e2b5217dfde0b788df9973a4e1fc9981f354a36df47a5f88708f57551` |
| `docs/aceite.md` | `11e8de0adb4185666e3a3cd532afcdf7f8068c1e7a8c201824b772760dde4b42` |
| `docs/avaliacao-agente.md` | `85d6267ccdcab1a43c17838bfbf30cec5356a114b89b0f980e7961c777e685ce` |
| `docs/comparacao-instrucoes-template.md` | `9a845706ea450ac3108b4401865892c1a40e1cea36c0bda858ac715b25f818f6` |
| `docs/evaluations/2026-10-19-confiabilidade-agente.md` | `bc26a5494cc9db7c14d3fd02e85fac5edd1c0869e82753d5697db0bad735accc` |
| `docs/evidencias-template.md` | `39612304ab0f69253a4ef9afcdbd8851ab3fe3309dda77744273daae068e4901` |
| `docs/preparacao-github-cli.md` | `7e7eec0ee1895be0d4d8ccf581bc8582f3fc309e57121a1839b23c3a43935091` |
| `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md` | `6657da5cea58b31728481c5c4f2b5f76ebb7f164637350d7a34122976583956a` |
| `docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md` | `3f5ac8f18dbbe4bff39da8d44e5c479edcba3e3fd6996244c60dbaa7ac9334dd` |
| `docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md` | `ad47b2ec48bcfbaab889b5d7c21ade67d91910b92eab2e7ed85e53947affc4c1` |
| `hooks/stilo-activate.js` | `493ca5805be33659f7a043083f138a5e9470756f828d628f2a00bcc684af55d0` |
| `hooks/stilo-diagnostics.js` | `7d9b9e3159e7a0040a2853de8e1508c3b4e65bad98f4917d20e2010ede572994` |
| `hooks/stilo-instructions.js` | `fff5e8a9a03877943a531f547f21ae8bcb221e48fb846b66ccf087bb1030dc81` |
| `hooks/stilo-setup.js` | `98f534b41439c0f11e1834697ec0d45ab8fc9da990e8b599e695b60b79e40381` |
| `modules/avaliacao.md` | `b37c019e75f36dde2944195b00e5b45456fb7158c79a00b0fa0b5f6441b71fc2` |
| `modules/melhoria-instrucoes.md` | `855153374c2b2d6e0a688df2bd360e39162b4f0e5b33100cceddf9a474441b3e` |
| `modules/orquestracao.md` | `7093a278bb4b1bb720d34b62cb80e723507efb58b2686b4fe282569879e12f36` |
| `modules/revisor.md` | `438d479d14ca176a21ea0ce391a39d1560fe72e830ae1da127aee706d24fb95d` |
| `package.json` | `8254bb17cb7cd9f0b713a0ff659d2911fecdcd48aa5f73934bf4eb15e0b94698` |
| `plan.md` | `0529d502ca6f1176f99820532768f549d7a14cf17b90b22c67690050fa6c1dc6` |
| `scripts/evaluate-harness.js` | `1693a8342dba048dc69a8f41fac01a2c5848f942f1d3b5081b5cf07a31035942` |
| `scripts/setup-github-cli.js` | `5fb835153b1c27fd0847f60774f68e4c85c588aa085aa6ca1379a4bec95acc4a` |
| `scripts/validate-plan.js` | `37f1ae868a87367327417950eb88ebadbe220d2c05205f4c97262b95fa343217` |
| `spec.md` | `ba864c3084f320b1235a61757b7960cf1ccd571557e56b0bb5baeab8de192168` |
| `tests/all.test.js` | `7bd8acb5c8ac5fa02319cb55e577ae1133f424a0ba5da610990e1a2a4c506a15` |
| `tests/context.test.js` | `66841d34894a211c358f0a73b4a2cf65198ffe11344d6750632e050e619775d5` |
| `tests/diagnostics.test.js` | `7d9d40d4326bb962d58344ad062e9c54dd994db31e7f85785e97b673d870a495` |
| `tests/fixtures/harness/project/.stilo/checkpoint.json` | `154ab047f8229db2f4a30761b5a22868c98fc9a2320797c3aa1e2722bc57538a` |
| `tests/fixtures/harness/project/.stilo/state.json` | `5ae8ed55e7275075a2000944ecd77f593550cdb83b89bf7cf549a346855c9797` |
| `tests/fixtures/harness/project/AGENTS.md` | `623a57fa782ab7929c3a42b0e86602009530bf1e4dad854c85bcb57772b85fd3` |
| `tests/fixtures/harness/project/local-notes.md` | `8d1dfa290bb16636b2ed6b274e496da449351b2520c31fb9ee9f62f4d3c4fdb1` |
| `tests/fixtures/harness/project/plan.md` | `551112e21ce0960542d1652c40331bf9eb30892def70a1d4df82c28671660e14` |
| `tests/fixtures/harness/project/spec.md` | `8090f6da565394b7a3f85f0afc47bc17a638697686e392463fc1486e70958855` |
| `tests/fixtures/harness/project/src/records.js` | `c76cbe486c513202d29eb2e9912be75fdae7caeb380faf36c7e32c5703bec484` |
| `tests/fixtures/harness/stale-handoff.md` | `1dcf5b594707feb326d27d8b31898afa6f873f194257be26233555e9b33d10f9` |
| `tests/github-cli-bootstrap.test.js` | `068fd7ef6fae95969ddf176a01aac3ab57bd17d185f61dbcb88613acd1d9d9b2` |
| `tests/github-cli-setup.test.js` | `e5ed1eaee042db13a75ceb845a37ad8d9db0ed1a2c84e033aed33a15e1ea9775` |
| `tests/harness-evaluation.test.js` | `6be358d5411c89aab86c4979f1a86a24047f5e1abdde3a00b277c52d67d60048` |
| `tests/instruction-improvement.test.js` | `88926994d808d6f06764fe1fe711162249996ef0fb6dcd1d7c5f5a348a9c6543` |
| `tests/instructions.test.js` | `6e18d6dc32f32867ce5f608c7208522b7dfa04c45a1986c7cc16df70e01b3b60` |
| `tests/manifestos.test.js` | `7a672126aef13872d41ad218a17dc35cd4d86de0b26472cbe73ae7ccbb4db742` |
| `tests/orchestration.test.js` | `d74d5c69c6c78b83020004630218e3bd0efc9ce6884f9982b04f5f91141a0087` |
| `tests/reliability-contract.test.js` | `90ce187e961981512c78b2e4792b7a1991c556dcc863eaf2a687bde589961b96` |
| `tests/reviewer-contract.test.js` | `591b9f51406fa91df8a96149c053d5656131eb56e299615dbb4abb13956d7273` |
| `tests/validate-plan.test.js` | `679dcd218bc2aec216927801e5b6d9910ba536ec36b1cbf83de8c28968d55138` |
