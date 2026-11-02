Gatilho: `SPEC` com interface de usuário no escopo. Lido pelo agente; produz `docs/ciclos/<cycle>/design.md`.

# Direção de design

Sem direção explícita, o agente repete os mesmos padrões em qualquer projeto. O `design.md`
fixa escolhas feitas para este assunto antes do código, e o `REVIEW` confere o diff contra
ele.

## 1. Brief

Assunto, público e função principal, uma linha cada. Se o pedido não diz, proponha e
confirme. As escolhas visuais saem do mundo do assunto: materiais, ofício, vocabulário de
quem usa.

## 2. Tokens

- Cores: 4 a 6, cada uma com nome, hex e papel (fundo, texto, ação, alerta).
- Tipografia: uma ou duas famílias escolhidas para o assunto; se duas, bem distintas.
  Papéis (título, corpo, dado) e escala com tamanhos e pesos. Linhas de texto com menos de
  80 caracteres.

## 3. Layout

Uma frase e um wireframe ASCII por tela principal. Diga o alinhamento (esquerda, centro,
justificado) e o que se vê primeiro.

## 4. Princípios

Três a cinco regras do que torna esta interface própria. Borda, numeração, rótulo e
divisória só quando carregam informação: numere apenas o que é sequência.

## 5. Revisão contra o brief

Compare o plano com o que você faria para qualquer pedido parecido e troque o que for
padrão, dizendo o que mudou e por quê. Padrões que aparecem sem relação com o assunto:

- fundo creme, serifa de alto contraste e acento terracota;
- fundo quase preto com um único acento neon;
- layout de jornal: filetes finos, cantos retos, colunas densas;
- kit de cartões: tudo em cartões arredondados iguais, mesma sombra, gradiente de enfeite;
- enfeites de template: rótulo em caixa alta sobre cada título, metadados separados por
  ponto médio, monoespaçada em rótulos pequenos, seta no fim do botão, uma palavra do
  título destacada.

Valem quando o brief pede; o que o brief disser sempre vence. Registre no `design.md` os
padrões considerados e evitados.

## 6. Ousadia em um ponto

Um elemento memorável; o resto, quieto. Movimento automático, no máximo um momento
orquestrado. Movimento que responde a uma ação do usuário é bem-vindo quando mostra o que
mudou.

## 7. Microcopy

- Nomeie pelo que o usuário entende, não pelo que o sistema faz.
- Botão diz o que acontece ("Salvar alterações", não "Enviar"), e a ação mantém o nome no
  fluxo inteiro.
- Erro diz o que houve e como resolver, sem pedir desculpa. Tela vazia convida à próxima
  ação.
- Caixa normal, verbos simples, sem enchimento.

## 8. Piso de qualidade

Os limites de `frontend.md` (contraste, quatro estados, teclado, 320 px) valem sempre e não
precisam ser repetidos no `design.md`.
