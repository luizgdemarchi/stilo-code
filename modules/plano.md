Gatilho: fase `PLAN`, junto com `orquestracao.md`. Injetado pelo hook.

# Plano

Escreva `docs/ciclos/<cycle>/plan.md` para um executor que não viu a conversa. O que ficar
só na sua cabeça não chega ao `EXECUTE`.

Cabeçalho: ciclo, spec, commit-base e tecnologia. Depois:

1. **Decisões fechadas:** o que não se reabre na execução. Se uma delas se mostrar errada, a
   execução para e volta ao `PLAN`.
2. **Tarefas** no contrato de `orquestracao.md`. Cada passo leva de 2 a 5 minutos e diz o
   arquivo exato, o que muda, o comando de verificação e a saída esperada.
3. **Ondas**, quando houver trabalho independente.
4. **Foco da revisão:** onde um erro é mais provável, com a tarefa responsável.

Lógica nova segue TDD em passos separados: escrever o teste, rodar e ver falhar, implementar
o mínimo, rodar e ver passar. Separar os passos impede pular a falha, que é o que prova que
o teste testa algo.

Não escreva "TBD", "adicionar validação apropriada", "tratar casos de borda" nem "igual à
tarefa N". Cada um desses passa ao executor uma decisão que o plano devia ter tomado.

Antes de pedir aprovação, releia contra o spec: todo requisito tem tarefa? O mesmo nome é
usado igual em todas as tarefas? Rode `scripts/validate-plan.js <plan.md>` do plugin (pasta
irmã de `modules/`) quando ele existir.

Trilha curta: confira que `## Plano` no `ciclo.md` tem passos verificáveis, sem ondas. Só
peça nova aprovação se o plano mudar.

Aprovado pelo usuário, grave `phase: "EXECUTE"`.
