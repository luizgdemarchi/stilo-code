# Evidências — ciclo 2026-11-02-dieta-superpowers-design

Registrado em 2026-11-02, na tarefa T12. Base: commit `4ced739`.

## Contexto injetado, antes e depois

Método, o mesmo da tabela "Medida de antes" do plano: `buildFullContext` e
`buildInjectedContext` com o estado `{ version: 1, project: "x", phase, reviewRound: 1,
enxuto: "auto", updated: "2026-01-01T00:00:00Z" }`, sem a nota do `gh`, rodando na raiz do
repositório. O "antes" foi medido de novo numa cópia de `4ced739` e bateu caractere a
caractere com a tabela do plano. Antes, o subagente recebia o mesmo contexto da sessão;
depois, recebe `buildSubagentContext`. Valores em caracteres.

| Fase | Completo antes | Injetado antes | Injetado depois | Subagente antes | Subagente depois |
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

Pior caso depois, com nome de projeto acima do limite de `sanitiza`, `design.md` no ciclo
e nota do `gh`: sessão de 12.085 (`BRAINSTORM`) a 17.860 (`REVIEW`), subagente de 1.280 a
2.791. O teste C05 de `tests/instructions.test.js` cobre as nove fases com e sem
`design.md` e com e sem a nota.

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
   nove fases e o bloco de estado com `Ciclo`, `Trilha` e `Módulos sob demanda`.
