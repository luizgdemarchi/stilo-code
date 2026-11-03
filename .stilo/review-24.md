# Review 24 — stilo-code

Revisado: working tree sobre `a15d97a` (FIX do `review-23`, ainda sem commit), branch
`ciclo/2026-11-02-dieta-superpowers-design`, ciclo `2026-11-02-dieta-superpowers-design`,
trilha completa.
Contra: `docs/ciclos/2026-11-02-dieta-superpowers-design/spec.md` (R2.2 e C05 emendados) e
`plan.md`; sem `design.md`.
Revisor: coordenador, revisão única, sem subagentes. Ambiente informou Opus 5.5; esforço não
confirmado pela ferramenta.

**Cobertura:** as 5 entradas de `git diff --stat`: `hooks/stilo-instructions.js`
(`sanitiza` em bytes, tetos do checkpoint legado), `tests/context.test.js` (pior caso),
`evidencias.md`, `progresso.md`, `.stilo/state.json`; mais os estados do `review-23`. Além
do diff: as 31 chamadas de `sanitiza` em `hooks/stilo-instructions.js`, porque a
mudança de unidade vale para todos.

**Exclusões:** prosa de `evidencias.md` e `progresso.md` além dos números (fica para o
`EDITORIAL_REVIEW`); documentos de ciclos encerrados.

**Verificações nesta árvore:**

- `npm test`: `ℹ tests 178` · `ℹ pass 178` · `ℹ fail 0` (log em
  `.stilo/logs/review-24-npm-test.log`).
- `git diff --check`: sem saída.
- Tabela "Depois da emenda do `FIX`" de `evidencias.md` reproduzida pelo método de T12
  (script no scratchpad, `buildInjectedContext` por parte): as 18 células batem, de
  `BRAINSTORM fase 2793 / 2861` a `REVIEW fase 6548 / 6729`, `nucleo 8733 / 8978`.
- Pior caso da parte `fase` com o cenário do teste, em `x`, `ã`, `漢` e `😀` (4 bytes):
  máximo `9568 / 9812`, em `REVIEW`; nenhum caso compactou. Bate com `evidencias.md`.
- Na abertura desta sessão, o `SessionStart` da cópia instalada chegou como `Output too
  large (15.5KB)` com `Preview (first 2KB)` e o texto de sete fases: a cópia instalada é
  anterior a `0.2.0`. É o cenário que E2 confere depois da publicação; não é achado do diff.

## Resumo

1 achado: 0 crítico, 0 alto, 1 médio, 0 baixo.

Os 2 achados do `review-23` estão `corrigido`, e as correções conferem: o teste de pior
caso cobre ciclo de 64 caracteres e campos de 1, 2 e 3 bytes, e `evidencias.md` separa o
texto único das duas partes, com o passo 3 de E2 conferindo prévia e `hook_outputs`.

## Achados

### 1. `sanitiza` em bytes trunca caminhos com caracteres multibyte
- **Arquivo:** `hooks/stilo-instructions.js:131`
- **Gravidade:** médio
- **O que quebra:** a troca de caracteres para bytes vale para as 31 chamadas, e não só
  para os campos que pesam na parte `fase`. Caminho de 102 caracteres e 242 bytes
  (`C:\Users\` + 70 `漢` + `\proj\.stilo\state.json`) numa nota de ambiguidade: em
  `a15d97a` sai inteiro; agora sai cortado em 200 bytes, depois do 63º `漢`, e perde
  `\proj\.stilo\state.json`, justamente a parte que distingue os projetos que o usuário
  precisa escolher. O mesmo vale para `state:` e `arquivo` no diagnóstico
  (`:175`, `:181`), para o bloco de estado ilegível (`:341`) e para a linha de estado inválido (`:305`, `:312`). Exige
  caminho acima de 200 bytes com caracteres multibyte: borda improvável.
- **Como corrigir:** manter bytes onde a parte `fase` precisa (nome do projeto, campos e
  caminho do checkpoint, `updated`) e voltar a limitar em caracteres os caminhos que não
  entram nela (`:175`, `:181`, `:305`, `:312`, `:520`), por exemplo com um terceiro
  parâmetro de `sanitiza`; teste com caminho multibyte na nota de ambiguidade.
- **Evidência:** script no scratchpad chamando `buildAmbiguityNote` com o caminho acima,
  com o arquivo atual e com `hooks/stilo-instructions.js` de `a15d97a` (`git stash`):
  atual `C:\Users\漢…漢…` (63 `漢`); antes, o caminho inteiro.
- **Confiança:** alta
- **Contraprova verificada:** nenhum chamador aplica limite próprio antes de `sanitiza`; o
  caminho do checkpoint inválido (`:154`) entra na parte `fase` e precisa continuar em
  bytes, porque em caracteres ele somaria até ~540 bytes e levaria o pior caso para perto
  de 10.000. A nota de ambiguidade não passa pela compactação nem pelo orçamento da parte
  `fase`.
- **Classificação:** confirmado
- **Origem:** introduzido (FIX do achado 1 do `review-23`)
- **Estado:** aberto

## Focos da revisão

| # | Foco | Resultado |
|---|---|---|
| 1 | Corte em bytes sem partir caractere | `for…of` percorre por código, inclusive par substituto (`😀` conferido); saída ≤ limite + 3 bytes do `…` |
| 2 | Pior caso da parte `fase` | 9.568 / 9.812 em qualquer escrita; folga de 188 bytes para o caminho de `modules/` da cópia instalada |
| 3 | Chamadores de `sanitiza` | Regressão nos caminhos (achado 1); textos do estado ganham o limite em bytes que o orçamento pede |
| 4 | `evidencias.md` | Números reproduzidos; E2 confere a prévia nos dois hosts |

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| C01 | `npm test` passa | atendido (178/178) |
| C02 | versões `0.2.0` | atendido, sem mudança |
| C03 | publicação falha com conteúdo alterado e versão igual | atendido; registro no `DONE` |
| C04 | `AGENTS.md` ≤ 10.000 | atendido (8.733) |
| C05 | cada parte ≤ 10.000 caracteres e bytes e igual à completa | atendido, inclusive no máximo das entradas válidas |
| C06–C25 | demais critérios | sem mudança desde o `review-23`, fora do diff |
| L1–L4 | critérios de leitura | sem mudança |
| E1 | medição antes e depois | registrada em `evidencias.md` |
| E2 | cópia instalada em `0.2.0` | pendente da publicação, sem bloquear |

Saída: rodada sem achado `crítico` nem `alto`, e os achados do `review-23` resolvidos. O
achado 1 fica aberto e listado aqui. Próximo: `EDITORIAL_REVIEW`.
