Gatilho: fase `REVIEW`. Injetado pelo hook; não vale nas outras fases.

# Revisão técnica

Procure falhas verificáveis no diff do ciclo. Zero achados é resultado válido; achado
inventado custa uma rodada de `FIX`. Revisores não escrevem no código.

Alvo: os commits desde o commit-base do ciclo, ou um snapshot de staged, unstaged e arquivos
novos com hashes. Registre cobertura e exclusões, e diga se cada achado foi introduzido no
ciclo, é preexistente ou indeterminado.

## O que revisar, nesta ordem

Um bug de corretude em código que nem deveria existir é tempo perdido; por isso o escopo vem
primeiro.

1. **Spec** do ciclo ativo: cada critério de aceite atendido, parcial ou ausente.
2. **Plano:** todo passo feito e nada além do pedido. Código não pedido também é mantido
   depois.
3. **Design:** com `design.md` no ciclo, desvio não justificado de tokens ou de layout é
   achado.
4. **Corretude:** a lógica faz o que o nome promete. Leia como se não fosse seu.
5. **Bordas:** vazio, nulo, zero, negativo, enorme, um elemento, primeira e última
   iteração, concorrência e fuso, quando houver.
6. **Erros:** chamada que falha, arquivo ausente, rede fora, JSON corrompido. Erro engolido
   é achado; erro que perde dado do usuário é `crítico`.
7. **Segurança:** entrada externa validada antes de virar caminho, consulta, comando ou
   HTML; segredo em código ou log; permissão checada no servidor.
8. **Testes:** o teste falha se a lógica quebrar? Teste que só espelha o código não conta.

## Despacho

Com subagentes, distribua só as lentes aplicáveis (qualidade, segurança, tipagem,
framework). Cada revisor devolve achados no formato abaixo, sem editar arquivos. O
coordenador deduplica, descarta alegação sem cenário concreto, ordena por gravidade e
escreve o arquivo. Sem subagentes, faça uma revisão única.

## Formato de um achado

Achado é acionável ou não é achado. Todos os campos são obrigatórios.

```text
### N. Título curto
- **Arquivo:** `caminho:linha`
- **Gravidade:** crítico | alto | médio | baixo
- **O que quebra:** entrada ou situação concreta → resultado errado observável
- **Como corrigir:** a mudança mínima
- **Evidência:** comando e saída, ou leitura verificável; declare prova não executada
- **Confiança:** alta | média | baixa
- **Contraprova verificada:** chamadores e controles que poderiam refutar; o que se viu
- **Classificação:** confirmado | hipótese | sugestão
- **Origem:** introduzido | preexistente | indeterminado
- **Estado:** aberto
```

| Gravidade | Significa |
|---|---|
| `crítico` | Perde dados, expõe segredo, quebra em produção ou deixa critério do spec sem atender |
| `alto` | Bug real em caminho comum, ou erro tratado de forma que esconde a causa |
| `médio` | Bug em borda improvável, ou falta de teste em lógica não trivial |
| `baixo` | Clareza, nome, duplicação, comentário desatualizado |

Gravidade mede impacto; confiança mede sustentação. Hipótese não é bug confirmado. Antes de
concluir que falta validação, procure-a nos chamadores. Não invente reprodução nem teste
executado.

## Arquivo e saída

Grave `.stilo/review-NN.md`, com `NN` igual a `reviewRound` + 1 em dois dígitos, sem
sobrescrever os anteriores: a sequência é o histórico. Cabeçalho com alvo, cobertura,
exclusões e documentos usados; depois, resumo por gravidade, achados e a tabela dos
critérios do spec.

Critério de saída: repetir `REVIEW → FIX` até uma rodada sem achado `crítico` nem `alto`.

Os achados anteriores precisam estar `corrigido` ou `descartado` com motivo, e evidência
obrigatória pendente também impede avançar. Achados `médio` e `baixo` abertos ficam
listados no último review. Com achado `crítico` ou `alto`, grave `phase: "FIX"`; sem eles,
`phase: "EDITORIAL_REVIEW"`.
