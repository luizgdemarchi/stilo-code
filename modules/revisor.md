# Módulo: Revisor

**Gatilho: carregue este módulo na fase `REVIEW`.** Em qualquer outra fase, ignore este
arquivo.

Revisar é procurar o que está errado, não confirmar o que está certo. Um review que não
produz achado nenhum na primeira rodada de um projeto real quase sempre significa que a
revisão foi rasa — não que o código está perfeito.

## O que revisar, nesta ordem

A ordem importa: um bug de corretude em código que nem deveria existir é tempo perdido.

1. **O diff cumpre o `spec.md`?** Cada critério de aceite do spec: atendido, parcialmente
   atendido ou ausente. Um critério ausente é achado `crítico`, mesmo que todo o código
   escrito esteja correto.
2. **O diff cumpre o `plan.md`?** Todo passo do plano foi feito? Foi feito algo que o
   plano não pedia? Escopo a mais é achado — código não pedido também é mantido depois.
3. **Corretude.** A lógica faz o que o nome dela promete. Leia o código como se você não
   o tivesse escrito.
4. **Casos de borda.** Entrada vazia, nula, zero, negativa, gigante. Coleção com um
   elemento. Primeira e última iteração. Concorrência, se houver. Fuso e horário de verão,
   se houver data.
5. **Tratamento de erro.** O que acontece quando a chamada falha, o arquivo não existe, a
   rede cai, o JSON está corrompido? Erro engolido em silêncio é achado. Erro que perde
   dados do usuário é `crítico`.
6. **Segurança.** Entrada de fora do sistema é validada antes de virar caminho de arquivo,
   consulta, comando de shell ou HTML. Segredo em código-fonte ou em log. Permissão
   verificada no servidor, não só na interface.
7. **Testes.** Existe teste para a lógica nova? O teste falha se a lógica quebrar — ou
   passa de qualquer jeito? Teste que só confirma o que o código faz, sem afirmar o que
   ele deveria fazer, não é teste.

## Formato de um achado

Um achado é acionável ou não é achado. Todo campo abaixo é obrigatório.

```
### N. Título curto do problema

- **Arquivo:** `caminho/do/arquivo.js:linha`
- **Gravidade:** crítico | alto | médio | baixo
- **O que quebra:** entrada ou situação concreta → resultado errado observável.
- **Como corrigir:** a mudança mínima que resolve.
- **Estado:** aberto
```

**Gravidade:**

| Nível | Significa |
|---|---|
| `crítico` | Perde dados, expõe segredo, quebra em produção, ou um critério de aceite do `spec.md` não foi atendido |
| `alto` | Bug real num caminho comum, ou erro tratado de forma que esconde a causa |
| `médio` | Bug em caso de borda improvável, ou falta de teste em lógica não trivial |
| `baixo` | Clareza, nome, duplicação, comentário desatualizado |

**"O que quebra" é o campo que separa review de opinião.** Se você não consegue escrever a
entrada concreta que produz o resultado errado, o achado é uma suspeita — rebaixe para
`baixo` e diga que é suspeita, ou corte.

Não invente achado para encher a lista. Rodada sem achado `crítico` nem `alto` é resultado
válido e é o que fecha o projeto.

## Arquivo de review

Grave sempre em `.stilo/review-NN.md`, com `NN` igual a `reviewRound` + 1, com dois
dígitos: `review-01.md`, `review-02.md`. Nunca sobrescreva um review anterior — a
sequência é o histórico do que já foi encontrado.

```markdown
# Review NN — <projeto>

Revisado: <o que entrou no diff, em uma linha>
Contra: `spec.md`, `plan.md`

## Resumo

<N> achados: <n> crítico, <n> alto, <n> médio, <n> baixo.

## Achados

### 1. ...
(formato acima)

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 1 | ... | atendido / parcial / ausente |
```

Em `FIX`, mude o **Estado** de cada achado para `corrigido` (com o arquivo e a linha da
correção) ou `descartado` (com o motivo). Um achado descartado sem motivo escrito volta a
aparecer na rodada seguinte.

## Quando declarar `DONE`

Só quando a rodada de `REVIEW` mais recente **não** produzir nenhum achado `crítico` nem
`alto`, e todos os achados das rodadas anteriores estiverem `corrigido` ou `descartado`
com motivo.

Achados `médio` e `baixo` em aberto não impedem `DONE`, mas ficam listados no último
review — é o que o projeto sabe sobre si mesmo.
