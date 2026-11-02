Gatilho: fase `SPEC`. Injetado pelo hook; não vale nas outras fases.

# Especificação

O spec diz o quê, não como. Decisão de implementação no spec engessa o plano antes de
alguém olhar o código.

Trilha completa: `docs/ciclos/<cycle>/spec.md`. Cabeçalho com ciclo, trilha, commit-base
(`git rev-parse --short HEAD`) e `reviewRound` de início. Seções: problema, objetivo,
não-objetivos, requisitos numerados, critérios de aceite, fora de escopo e riscos.

Critério de aceite se verifica rodando um comando ou teste, com resultado esperado. "Fica
mais rápido" é desejo; "responde em menos de 200 ms no teste X" é critério. O que só se
confere lendo vai em lista separada, declarada como tal.

Interface no escopo: leia `design.md` na pasta de módulos (caminho no bloco de estado) e
produza `docs/ciclos/<cycle>/design.md`, aprovado junto com o spec.

Teste com leitor, na trilha completa: antes de pedir aprovação, entregue o spec (e o
`design.md`) a um subagente sem o contexto da conversa. Ele diz o que será construído, como
verificar cada critério e o que fica fora, e lista dúvidas. Corrija as lacunas e registre o
resultado no spec. Sem subagentes, registre que o teste não foi executado. Motivo: o autor
lê o que quis dizer, não o que escreveu.

Trilha curta: um arquivo só, `docs/ciclos/<cycle>/ciclo.md`, com `## Spec` (até 10 linhas,
pelo menos um critério executável) e `## Plano` (1 a 3 passos). O usuário aprova o arquivo
uma vez.

Aprovado em palavras pelo usuário, grave `phase: "PLAN"`.
