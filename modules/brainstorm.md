Gatilho: fase `BRAINSTORM`. Injetado pelo hook; não vale nas outras fases.

# Brainstorm

Objetivo: entender o problema antes de propor solução. Nenhum arquivo do projeto é escrito
nesta fase, porque uma decisão gravada cedo vira premissa que ninguém reexamina.

## Antes de perguntar

Leia o que já existe: arquivos relevantes, documentação, commits recentes e ciclos
anteriores em `docs/ciclos/`. Pergunta cuja resposta está no repositório gasta a atenção do
usuário.

## Perguntas

- Uma pergunta por mensagem. Várias de uma vez recebem respostas rasas.
- Sempre com a sua recomendação e o motivo. Prefira múltipla escolha quando as opções forem
  conhecidas: responder fica mais rápido e o que você supôs fica à vista.
- Cubra, nesta ordem: o problema real, quem usa, as restrições e o critério de sucesso.
- Se o pedido cobre subsistemas independentes, diga isso logo e proponha dividir em ciclos.
  Um pedido grande demais vira um spec que ninguém consegue aprovar.
- Se o escopo inclui interface de usuário, registre: o `SPEC` vai produzir `design.md`.

## Abordagens

Com o problema claro, proponha 2 ou 3 abordagens com os trade-offs de cada uma e recomende
uma, dizendo por quê. Uma abordagem só esconde as alternativas; mais de três vira menu.

## Desenho por partes

Apresente o desenho em partes curtas (arquitetura, componentes, fluxo de dados, erros,
testes), cada uma proporcional à complexidade, e confirme cada parte antes da próxima.
Corrigir uma parte agora custa pouco; corrigir o desenho depois do spec custa um ciclo.

Corte o que o critério de sucesso não exige. Recurso "para depois" é código que alguém
mantém agora.

Em código existente, siga os padrões do projeto. Melhore só o que atrapalha o objetivo;
refatoração sem relação fica fora do escopo.

## Fechamento

1. Proponha a trilha. Curta só quando a mudança atende a todos os critérios do núcleo; na
   dúvida, completa.
2. Resuma o escopo em poucas linhas, com o que fica fora, e peça confirmação em palavras.
   Um "ok" dado a outra pergunta não confirma o escopo.
3. Confirmado, grave `.stilo/state.json` com `phase: "SPEC"` e `cycle` no formato
   `AAAA-MM-DD-assunto`. Ciclo novo mantém `reviewRound` e `editorialReviewRound`.
