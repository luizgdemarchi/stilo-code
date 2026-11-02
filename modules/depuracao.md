Gatilho: fase `FIX`, injetado pelo hook; em `EXECUTE`, leia quando uma verificação falhar.

# Depuração

Nenhuma correção sem causa raiz. Corrigir o sintoma faz o bug voltar em outro lugar e gasta
a próxima rodada de review.

1. Reproduza: comando exato e saída. Sem reprodução, colete dados antes de mudar código.
2. Leia o erro inteiro, com o stack trace, e cite-o literalmente.
3. Veja o que mudou: `git diff`, commits recentes, dependências e ambiente.
4. Rastreie o valor errado até onde ele nasce e corrija lá, não onde ele explode.
5. Uma hipótese por vez: "acho que X porque Y". Faça a menor mudança que testa X e rode. Se
   não confirmou, desfaça antes da próxima hipótese; mudanças acumuladas escondem a causa.
6. Com a causa confirmada, escreva o teste que reproduz o bug e só então corrija.

Em sistemas com várias camadas, registre o que entra e o que sai em cada fronteira antes de
supor onde está a falha.

Depois de 3 correções sem sucesso, pare: o problema provavelmente é de desenho. Relate o
que tentou e o que observou, e discuta com o usuário antes da quarta tentativa.
