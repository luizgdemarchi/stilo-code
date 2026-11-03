# Evidências — ciclo 2026-11-02-dieta-superpowers-design

Registrado em 2026-11-02, na tarefa T12. Base: commit `4ced739`.

## Contexto injetado, antes e depois

Método, o mesmo da tabela "Medida de antes" do plano: `buildFullContext` e
`buildInjectedContext` com o estado `{ version: 1, project: "x", phase, reviewRound: 1,
enxuto: "auto", updated: "2026-01-01T00:00:00Z" }`, sem a nota do `gh`, rodando na raiz do
repositório. O "antes" foi medido de novo numa cópia de `4ced739` e bateu caractere a
caractere com a tabela do plano. Antes, o subagente recebia o mesmo contexto da sessão;
depois, recebe `buildSubagentContext`. Valores em caracteres.

| Fase | Completo antes | Injetado antes | Injetado depois (texto único) | Subagente antes | Subagente depois |
|---|---|---|---|---|---|
| `BRAINSTORM` | 15.596 | 15.596 | 11.476 | 15.596 | 1.155 |
| `SPEC` | 21.347 | 19.349 | 12.826 | 19.349 | 1.423 |
| `PLAN` | 25.835 | 19.371 | 15.167 | 19.371 | 1.423 |
| `EXECUTE` | 25.844 | 19.380 | 14.332 | 19.380 | 2.325 |
| `REVIEW` | 31.497 | 31.497 | 15.151 | 31.497 | 2.660 |
| `FIX` | 25.928 | 19.464 | 14.165 | 19.464 | 2.321 |
| `EDITORIAL_REVIEW` | 31.648 | 31.648 | 14.908 | 31.648 | 2.221 |
| `EDITORIAL_FIX` | 31.646 | 31.646 | 14.901 | 31.646 | 1.432 |
| `DONE` | 17.023 | 17.023 | 12.295 | 17.023 | 1.149 |

Depois, o injetado é igual ao completo em todas as fases: a compactação não descarta nada.
Antes, `SPEC`, `PLAN`, `EXECUTE` e `FIX` perdiam seções inteiras do núcleo, e `REVIEW` e as
fases editoriais passavam de 31 mil caracteres.

Pior caso depois, ainda em texto único, com nome de projeto acima do limite de `sanitiza`,
`design.md` no ciclo e nota do `gh`: sessão de 12.085 (`BRAINSTORM`) a 17.860 (`REVIEW`),
subagente de 1.280 a 2.791.

### Depois da emenda do `FIX`: duas partes

A coluna "Injetado depois (texto único)" foi medida em T12. O achado 1 do `review-22`
mostrou que texto acima de 10.000 caracteres chega ao modelo só como prévia, e a emenda de
R2.2 dividiu o `SessionStart` em `nucleo` e `fase`. Mesmo método, valores em caracteres /
bytes UTF-8:

| Fase | `nucleo` | `fase` |
|---|---|---|
| `BRAINSTORM` | 8.733 / 8.978 | 2.793 / 2.861 |
| `SPEC` | 8.733 / 8.978 | 4.143 / 4.245 |
| `PLAN` | 8.733 / 8.978 | 6.484 / 6.658 |
| `EXECUTE` | 8.733 / 8.978 | 5.649 / 5.806 |
| `REVIEW` | 8.733 / 8.978 | 6.548 / 6.729 |
| `FIX` | 8.733 / 8.978 | 5.531 / 5.676 |
| `EDITORIAL_REVIEW` | 8.733 / 8.978 | 6.267 / 6.420 |
| `EDITORIAL_FIX` | 8.733 / 8.978 | 6.260 / 6.412 |
| `DONE` | 8.733 / 8.978 | 3.734 / 3.861 |

Pior caso, depois da correção do achado 1 do `review-23`: `nucleo` com a nota do `gh`,
9.190 / 9.449; `fase` em `REVIEW` com id de ciclo de 64 caracteres, os três documentos,
nome de projeto e `checkpoint.json` legado acima dos tetos de `sanitiza`, 9.568 / 9.812, com
1, 2 ou 3 bytes por caractere nos campos. Limites: 10.000 caracteres por hook no Claude
Code; no Codex, ⌈bytes/4⌉ ≤ 2.500 tokens (`APPROX_BYTES_PER_TOKEN = 4` em
`codex-rs/utils/string/src/truncate.rs`), ou seja, 10.000 bytes. O teste C05 de
`tests/instructions.test.js` cobre as nove fases com e sem `design.md` e com e sem a nota;
o pior caso está em `tests/context.test.js`.

## C23 — validação do plugin

`claude plugin validate .` (Claude Code 2.1.301), em 2026-11-02:

```text
Validating marketplace manifest: …\stilo-code\.claude-plugin\marketplace.json
✔ Validation passed
```

`claude plugin validate .claude-plugin/plugin.json`:

```text
Validating plugin manifest: …\stilo-code\.claude-plugin\plugin.json
✔ Validation passed
```

## Pendentes, sem bloquear o `DONE`

**E1 — tokens numa tarefa fixa.** Pendente. Roteiro:

1. Escolher um pedido fixo e pequeno num projeto de teste descartável, por exemplo "criar
   uma função `soma` com teste", partindo de `BRAINSTORM`.
2. Rodar o pedido com o plugin em `0.1.0` e guardar o transcript da sessão.
3. Rodar o mesmo pedido com o plugin em `0.2.0`, no mesmo host e modelo.
4. Medir os dois com `node scripts/medir-tokens.js <transcript> --json` e registrar aqui
   chamadas, tokens de entrada, cache e saída, e saída por ferramenta, lado a lado.

**E2 — cópia instalada.** Pendente até a publicação autorizada. Roteiro:

1. Depois de publicar `0.2.0`, atualizar o plugin no Claude Code.
2. Conferir em `claude plugin details stilo-code@stilo-code` que a versão é `0.2.0`.
3. Abrir uma sessão num projeto com `.stilo/state.json` e conferir que a injeção mostra as
   nove fases e o bloco de estado com `Ciclo`, `Trilha` e `Módulos sob demanda`, e que
   nenhuma das duas partes do `SessionStart` chega como prévia (`Output too large` com
   `Preview (first 2KB)` no Claude Code) nem como arquivo em `hook_outputs` no Codex.
