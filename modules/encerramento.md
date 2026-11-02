Gatilho: fase `DONE`, junto com `auditoria.md`. Injetado pelo hook.

# Encerramento

Integrar é decisão do usuário. Nada é integrado, publicado, enviado nem apagado sem escolha
explícita dele, porque desfazer custa mais do que perguntar.

1. Ofereça antes a auditoria de `auditoria.md`. Aceitar uma sugestão volta ao `FIX`.
2. Rode a suíte completa na árvore que será integrada e cite as linhas decisivas. Verde numa
   rodada anterior prova só aquela árvore. Suíte vermelha: relate as falhas e pare.
3. Projeto que é plugin ou skill: suba a versão nos manifestos e rode a verificação de
   publicação do projeto, se existir. O host guarda o plugin em cache pela versão, e conteúdo
   novo com versão repetida não chega a ninguém.
4. Confirme a branch-base, porque integrar na base errada é caro de desfazer. Commit também
   depende de autorização.
5. Ofereça e espere a resposta:
   1. integrar na branch principal e rodar a suíte no resultado;
   2. enviar a branch e abrir PR, com `gh` quando disponível;
   3. manter a branch como está;
   4. descartar o trabalho.
6. Descartar apaga de vez. Liste branch, commits e worktree afetados e só prossiga quando o
   usuário digitar `descartar`; "pode jogar fora" não basta.
7. Suíte vermelha depois da integração: pare e investigue, com branch e worktree intactos.
   Push rejeitado: investigue; force-push só a pedido.
8. Limpe só o worktree da opção escolhida, integração ou descarte confirmado, e só se este
   ciclo o criou. Remoção recusada por arquivo sem commit: mostre a lista e pergunte, nunca
   `--force`. PR e "manter" preservam o worktree, onde o ajuste do PR acontece.
