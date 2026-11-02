# Evidências — <ciclo>

Preencha uma linha por critério. Use `local` para comando reproduzível no checkout, `viva` somente quando a execução no agente foi observada, `pendente` enquanto faltar uma prova obrigatória e `retirado` quando o critério dependia de agente ou arquivo removido, com o motivo no Resultado; `retirado` não bloqueia `DONE`. Não substitua resultados pendentes por inferências.

Matriz atual: critérios 1–54, únicos e sem lacunas. Preserve histórico e pendências.
Critério misto permanece pendente enquanto faltar a parte viva; descreva a prova local
separadamente. Não executado usa tipo pendente com motivo. Registre hashes/revisão de
entradas e avaliador, ambiente/cliente/modelo observáveis, tarefa, comandos/resultados,
diff, observação independente e limites de isolamento. Custo/tokens somente se medidos.

| Critério | Tarefa | Comando | Tipo | Resultado | Review |
|---|---|---|---|---|---|
| <número ou ID> | <tarefa do plano> | `<comando ou roteiro executado>` | <local, viva, pendente ou retirado> | <saída decisiva ou pendência explícita> | <review-NN> |

Ao abrir um ciclo, preserve os documentos anteriores e crie:

- `docs/ciclos/<id>/spec.md`
- `docs/ciclos/<id>/plan.md`
- o campo `cycle` no `.stilo/state.json`, com o commit-base e o `reviewRound` de início no
  cabeçalho do spec
