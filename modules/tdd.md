Gatilho: fases `EXECUTE` e `FIX`, inclusive em subagentes. Injetado pelo hook.

# Teste primeiro

Para lógica nova e para bug corrigido:

1. Escreva o teste que afirma o comportamento pedido, não a implementação atual. Num bug, o
   teste reproduz o bug.
2. Rode e veja falhar pelo motivo certo: a asserção, não erro de importação ou de sintaxe.
   Teste que nunca falhou não prova que testa algo.
3. Escreva o código mínimo para passar, nada além do que o teste pede.
4. Rode e veja passar, junto com os testes vizinhos.
5. Refatore com os testes verdes, sem mudar o comportamento.

Teste escrito depois do código tende a confirmar o que o código já faz. Se o código veio
antes, quebre-o de propósito e veja o teste falhar antes de confiar nele.

Exceções: mudança só de documentação ou configuração, ou projeto sem infraestrutura de
teste. Declare a exceção no relato e diga como verificou.
