Gatilho: fase `FIX`. Injetado pelo hook.

# Correção do review

Para cada achado do review mais recente (`.stilo/review-NN.md` de maior número):

1. Confira a alegação no código antes de corrigir. Revisor também erra.
2. Achado errado: marque `descartado`, com a evidência (`arquivo:linha`, comando e saída).
3. Achado certo: faça a mudança mínima, com teste quando houver lógica, e marque
   `corrigido` com `arquivo:linha`.
4. Achado ambíguo: pergunte ao usuário antes de mexer.

Sem concordância performática: o estado no arquivo e a evidência bastam. Não mude o que não
foi apontado, porque essa mudança chegaria ao próximo review sem achado que a justifique.

Com todos os achados decididos, incremente `reviewRound` e grave `phase: "REVIEW"`.
