# Review 23 — stilo-code

Revisado: `0d32afd..a15d97a` (FIX do `review-22`, branch
`ciclo/2026-11-02-dieta-superpowers-design`), ciclo `2026-11-02-dieta-superpowers-design`,
trilha completa.
Contra: `docs/ciclos/2026-11-02-dieta-superpowers-design/spec.md` (com a emenda de R2.2 e
C05) e `plan.md` (decisões 8–10); sem `design.md`.
Revisor: coordenador, revisão única, sem subagentes. Ambiente informou Opus 5.5; esforço não
confirmado pela ferramenta.

**Cobertura:** as 28 entradas de `git show --stat a15d97a`: `hooks/stilo-activate.js`,
`hooks/stilo-instructions.js` (partes `nucleo`/`fase`, orçamento, compactação),
`hooks/claude-codex-hooks.json`, `hooks/stilo-state.js:23`, `scripts/medir-tokens.js`,
`scripts/validate-plan.js`, `package.json`, `modules/revisor.md`, `revisor-editorial.md`,
`correcao.md`, `encerramento.md`, `AGENTS.md` § 1, seção de versão dos READMEs,
`docs/contrato-hooks.md`, emendas do spec e do plano, testes alterados, remoção de
`publicacao.json`. Além do diff: `hooks/stilo-prompt.js` (troca de fase),
`hooks/stilo-diagnostics.js:186` (conferência do review pela nova regra do contador),
`hooks/stilo-runtime.js` (formato da saída) e `evidencias.md` (pendência deixada pelo `FIX`).

**Exclusões:** prosa dos READMEs e de `docs/` fora da seção de versão (fica para o
`EDITORIAL_REVIEW`); conteúdo do `review-22.md` além dos estados; documentos de ciclos
encerrados.

**Verificações nesta árvore (`a15d97a`, working tree limpo):**

- `npm test`: `ℹ tests 160` · `ℹ pass 160` · `ℹ fail 0` (log em `.stilo/logs/review-23-npm-test.log`).
- `npm run validate-plan` (sem caminho, plano do ciclo ativo): 13 tarefas, 5 ondas.
- `npm run verificar-publicacao`: `publicacao.json ausente: registre a publicação com
  --registrar`, esperado pela decisão 10 (registro só no `DONE`).
- `git diff --check 0d32afd HEAD`: sem saída.
- `claude plugin validate .` e `claude plugin validate .claude-plugin/plugin.json`
  (Claude Code 2.1.301): `✔ Validation passed` nos dois, com o `SessionStart` de dois
  comandos.
- Hooks reais no Windows (`node hooks/stilo-activate.js <parte>`, stdin JSON,
  `CLAUDE_PLUGIN_DATA` temporário): `nucleo` 8.906 caracteres em 0,9 s, sem bloco de estado;
  `fase` 6.845 caracteres em 0,6 s, sem `## Regra 0`; um registro de sessão só.
- Partes medidas nas nove fases (caracteres / bytes): `nucleo` 8.733 / 8.978 sem nota e
  9.190 / 9.449 com a nota do `gh`; `fase` 2.800 / 2.864 (`BRAINSTORM`) a 6.621 / 6.798
  (`REVIEW`) no nominal, e até 8.821 / 9.055 (`REVIEW` com `design.md` e nome de 200).
- Limite do Codex conferido na fonte: a documentação de hooks diz "limits each
  model-visible hook-output message to roughly 2,500 tokens" e, acima disso, salva em disco
  e entrega "a head-and-tail preview with the saved-file path"; em
  `openai/codex` `codex-rs/utils/string/src/truncate.rs`, `APPROX_BYTES_PER_TOKEN = 4` e
  `approx_token_count` = ⌈bytes/4⌉. Logo, 10.000 bytes equivalem a exatamente 2.500 tokens
  na conta do Codex, e o teste em bytes de C05 é o critério certo. Conferência ao vivo no
  Codex não executada.

## Resumo

2 achados: 0 crítico, 0 alto, 1 médio, 1 baixo.

Os 6 achados do `review-22` estão `corrigido`, e as correções conferem: o contador agora
tem um dono só, e `hooks/stilo-diagnostics.js:186` (que confere `review-<reviewRound>.md`
em `REVIEW`, `FIX` e `DONE`) passou a bater com a regra; `medir-tokens` não sinaliza os
fixtures (`claude` e `codex`: 2 chamadas, 0 arquivos sem chamada).

## Achados

### 1. Parte `fase` passa de 10.000 bytes com entradas válidas no máximo
- **Arquivo:** `tests/context.test.js:145`
- **Gravidade:** médio
- **O que quebra:** projeto em `REVIEW` com `design.md`, id de ciclo de 64 caracteres
  (o máximo de `CICLO_ID`) e um `.stilo/checkpoint.json` legado com `task`, `nextAction` e
  `pending` acima dos tetos de `sanitiza`. A parte `fase` mede 9.868 caracteres e 10.112
  bytes só com ASCII; com `ã` nesses campos, 10.892 bytes; com caracteres de 3 bytes,
  11.672 (e `EXECUTE` chega a 10.583). No Codex, ⌈10.112/4⌉ = 2.528 > 2.500: a saída vai
  para arquivo, e o modelo recebe só o começo e o fim, perdendo o meio de `revisor.md` e
  `frontend.md`. Viola R2.2 ("cada texto [...] no máximo [...] 10.000 bytes"). O teste que
  se diz "pior caso" usa ciclo de 20 caracteres e campos ASCII, então não pega isso, e a
  folga real em caracteres para o Claude Code é de ~125 (9.875 com o caminho da cópia
  instalada): um módulo da fase que cresça 130 caracteres estoura o limite sem teste
  vermelho. A compactação mede só `.length` e, na parte `fase`, todos os blocos são
  protegidos, então ela não socorre.
- **Como corrigir:** no teste de `tests/context.test.js:142`, usar ciclo de 64 caracteres
  e campos do checkpoint com caracteres multibyte, mantendo o limite em caracteres e bytes.
  Para recuperar folga, a mudança menor é a `Próxima ação` de `REVIEW` deixar de repetir os
  caminhos que a linha `Documentos` já lista (`hooks/stilo-instructions.js:30-33`; o id do
  ciclo aparece 7 vezes no bloco de `REVIEW` com `design.md`), ou baixar os tetos de
  `sanitiza` do checkpoint em `hooks/stilo-instructions.js:154-156`.
- **Evidência:** script no scratchpad com `buildInjectedContext(state, caminhos, 'fase')`
  num projeto temporário: `x REVIEW 9868 car 10112 B`, `ã REVIEW 9868 car 10892 B`,
  `漢 REVIEW 9868 car 11672 B`, `漢 EXECUTE 8803 car 10583 B`; injetado igual ao completo
  em todos (sem compactação). Sem checkpoint, o mesmo `REVIEW` fica em ~9.140 caracteres.
- **Confiança:** alta
- **Contraprova verificada:** `readCheckpoint` exige `phase` válida (com 200 caracteres o
  checkpoint vira "inválido" e o texto encolhe), então o campo `phase` não entra no pior
  caso. Nenhum módulo nem o `AGENTS.md` manda gravar `checkpoint.json` hoje
  (`writeCheckpoint` só é exportado), por isso o cenário depende de checkpoint legado ou
  escrito à mão: borda improvável. `UserPromptSubmit` na troca de fase injeta a linha de
  estado e os módulos, sem o bloco de estado, e fica abaixo da parte `fase`.
- **Classificação:** confirmado
- **Origem:** introduzido (o limite em bytes é da emenda do `FIX`; o teste de pior caso foi
  adaptado sem subir as entradas ao máximo)
- **Estado:** corrigido: `tests/context.test.js:143-146` (ciclo de 64 caracteres, os três
  documentos, campos com 1, 2 e 3 bytes por caractere; 4 falhas antes da correção:
  `REVIEW fase: 9868 / 10112`, `/ 10892`, `/ 11672` e `EXECUTE fase: 8803 / 10583`);
  `hooks/stilo-instructions.js:126` (`sanitiza` limita bytes UTF-8, sem partir caractere) e
  `:166-168` (tetos do checkpoint legado 80/120/160). Pior caso agora 9.568 caracteres /
  9.812 bytes em qualquer escrita; `npm test` 178/178. A `Próxima ação` ficou como estava:
  a linha de estado de cada prompt depende dos caminhos nela

### 2. `evidencias.md` registra o `SessionStart` de texto único como resultado "depois"
- **Arquivo:** `docs/ciclos/2026-11-02-dieta-superpowers-design/evidencias.md:14`
- **Gravidade:** baixo
- **O que quebra:** a coluna "Injetado depois" (11.476 a 15.151) e o parágrafo "Pior caso
  depois" (`:30`, sessão de 12.085 a 17.860) descrevem o texto único que o `review-22`
  achado 1 mostrou chegar ao modelo como prévia de 2.000 caracteres, e contradizem R2.2
  emendado. Quem ler a evidência conclui que a injeção atual passa de 10.000. O roteiro de
  E2 (`:66`) manda conferir que "a injeção mostra as nove fases e o bloco de estado", mas
  não confere a falha real: uma das partes chegar como `Output too large` (Claude Code) ou
  como arquivo em `hook_outputs` (Codex).
- **Como corrigir:** marcar a tabela como medida antes da emenda do `FIX` e acrescentar as
  partes depois da divisão (os números da seção "Verificações" acima); no passo 3 de E2,
  conferir que nenhuma das duas partes chega como prévia ou arquivo.
- **Evidência:** leitura de `evidencias.md:14-33` e `:62-67`; o próprio `progresso.md`
  registrou a pendência para esta rodada.
- **Confiança:** alta
- **Contraprova verificada:** procurei registro da medida depois da divisão em outro
  documento do ciclo: só no estado do achado 1 do `review-22` e no `progresso.md`, não em
  `evidencias.md`, que é onde C23, E1 e E2 apontam.
- **Classificação:** confirmado
- **Origem:** introduzido (a emenda mudou o critério, a evidência não acompanhou)
- **Estado:** corrigido: `evidencias.md:14` (coluna marcada como texto único), `:34-60`
  (seção "Depois da emenda do `FIX`: duas partes", medida pelo mesmo método, com pior caso e
  limites dos dois hosts) e `:94-96` (passo 3 de E2 confere prévia e `hook_outputs`)

## Focos da revisão

| # | Foco | Resultado |
|---|---|---|
| 1 | Cada parte do `SessionStart` dentro de 10.000 | Sim no nominal e nos cenários de C05; fora no máximo das entradas válidas (achado 1) |
| 2 | Limite do Codex | Conferido na documentação e no código: ⌈bytes/4⌉ ≤ 2.500, igual a 10.000 bytes |
| 3 | Duas partes em hosts que rodam hooks em paralelo | Sem dependência de ordem; só `fase` registra a sessão; `nucleo` não lê stdin e sai em 0,9 s |
| 4 | Contador de rodada | Um dono; hook, diagnóstico e módulos coerentes; teste falha com o texto antigo |
| 5 | `validate-plan` sem caminho | Resolve ciclo ativo, legado e trilha curta (erro 2 com motivo) |
| 6 | Publicação | `publicacao.json` fora; registro só no `DONE`, em `encerramento.md` e nos READMEs |

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| C01 | `npm test` passa | atendido (160/160) |
| C02 | versões `0.2.0` | atendido |
| C03 | publicação falha com conteúdo alterado e versão igual | atendido (`tests/publicacao.test.js`); registro adiado para o `DONE` |
| C04 | `AGENTS.md` ≤ 10.000 | atendido (8.733) |
| C05 | cada parte ≤ 10.000 caracteres e bytes e igual à completa | atendido como escrito; R2.2 parcial no máximo das entradas (achado 1) |
| C06 | subagente ≤ 6.000 com proibições e essencial da fase | atendido |
| C07 | seções removidas e âncoras presentes | atendido |
| C08 | sem "até zero achados"; critério único | atendido |
| C09 | `enxuto.md` e `orquestracao.md` coerentes com os hooks | atendido |
| C10 | projeto novo com `editorialReviewRound` e `cycle` | atendido |
| C11 | sem versão de modelo nos distribuídos | atendido |
| C12 | sem `isOff`/`setOff` | atendido |
| C13 | `FIX` com regras de correção | atendido; regra do contador corrigida |
| C14 | `cycle` válido, inválido e ausente | atendido |
| C15 | ciclo, trilha curta e legado no bloco e na linha | atendido |
| C16 | diagnóstico pelo ciclo do estado, sem `cycle.json` | atendido |
| C17 | migração e `validate-plan` | atendido (script sem caminho) |
| C18 | módulos por fase e gatilho na primeira linha | atendido |
| C19 | avisos de terceiros; `superpowers` só neles | atendido (sem exceção para o id do ciclo) |
| C20 | `frontend.md` só com `design.md` | atendido |
| C21 | `medir-tokens.js` com fixtures, `--json`, erro e linha malformada | atendido; formato novo sinalizado por arquivo sem chamada |
| C22 | sem `dependencies` | atendido |
| C23 | `claude plugin validate .` | atendido, reexecutado nesta árvore |
| C24 | troca de fase injeta módulos uma vez; nada no projeto | atendido (só a parte `fase` registra; hook real conferido) |
| C25 | caminho absoluto de `modules/` no bloco | atendido; o bloco agora cabe no limite do host |
| L1–L4 | critérios de leitura | sem mudança desde o `review-22` |
| E1 | medição antes e depois | pendente, sem bloquear |
| E2 | cópia instalada em `0.2.0` | pendente, sem bloquear; roteiro a ajustar (achado 2) |

Saída: rodada sem achado `crítico` nem `alto`, e os achados do `review-22` resolvidos. Os
achados 1 e 2 ficam abertos e listados aqui.
