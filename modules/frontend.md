# Módulo: Frontend

**Gatilho: carregue este módulo só quando o diff toca interface de usuário**, nas fases
`EXECUTE` ou `REVIEW`. Projeto de CLI, biblioteca, script ou serviço sem tela nunca lê
este arquivo.

Regras mínimas, verificáveis olhando a tela. Não é sistema de design nem opinião estética.

## Hierarquia visual

O que é mais importante tem que parecer mais importante: tamanho, peso ou contraste — de
preferência um só dos três por vez. Uma tela com três ênfases concorrentes não tem
nenhuma.

Uma ação primária por tela. Todo o resto é secundário ou discreto.

## Espaçamento

Use uma escala fixa (por exemplo 4, 8, 12, 16, 24, 32, 48) e nada fora dela. Espaço
arbitrário — `13px` aqui, `17px` ali — é o que faz uma interface parecer improvisada
mesmo quando cada tela isolada parece boa.

Elementos relacionados ficam mais perto entre si do que dos vizinhos. Proximidade comunica
agrupamento antes de qualquer borda ou linha.

## Contraste e cor

- Texto normal: contraste mínimo **4.5:1** contra o fundo (WCAG AA). Texto grande
  (≥ 24 px, ou ≥ 19 px em negrito): mínimo **3:1**.
- Borda de campo, ícone que carrega significado e indicador de foco: mínimo **3:1**.
- **Cor nunca é o único canal.** Erro em vermelho também traz ícone ou texto; item
  selecionado também muda forma, peso ou posição. Quem não distingue as duas cores
  continua usando a tela.
- Se o projeto tem tema claro e escuro, os dois passam nos mesmos limites. Verifique os
  dois antes de dizer que terminou.

## Os quatro estados obrigatórios

Toda tela que busca ou envia dados tem quatro estados. Faltar um é achado de review.

| Estado | O que precisa ter |
|---|---|
| **Vazio** | Diz que está vazio e qual é o próximo passo. Nunca uma área em branco sem explicação |
| **Carregando** | Indicação visível desde o primeiro instante; layout que não pula quando o conteúdo chega |
| **Erro** | O que falhou, em linguagem de gente, e o que fazer agora. Uma forma de tentar de novo. Nunca só um código de status |
| **Sucesso** | O conteúdo, ou confirmação explícita de que a ação foi concluída |

Estado de erro nunca descarta o que o usuário digitou.

## Foco e teclado

- Todo controle interativo é alcançável por `Tab`, na ordem em que aparece na tela.
- O foco é **visível** — nunca `outline: none` sem um substituto de contraste igual ou
  maior.
- `Enter` e `Espaço` acionam o que parece botão. Se precisa de `div` com `onClick`, use
  `<button>`.
- `Esc` fecha modal e menu. Modal aberto prende o foco dentro dele e o devolve ao elemento
  que o abriu quando fecha.
- Todo campo tem `<label>` associado. Placeholder não é rótulo: ele some quando o usuário
  digita.
- Imagem informativa tem `alt` descrevendo a informação; imagem decorativa tem `alt=""`.

## Responsividade

- Funciona a partir de **320 px** de largura, sem rolagem horizontal da página.
- Conteúdo largo (tabela, bloco de código, diagrama) rola dentro do próprio container, não
  arrasta a página inteira.
- Alvo de toque com pelo menos **44 × 44 px**.
- Layout se adapta ao conteúdo, não a uma lista de nomes de aparelho.

## Movimento

Animação serve para explicar o que mudou de lugar. Entre 150 ms e 300 ms; acima disso o
usuário espera a interface, não usa a interface. Respeite
`prefers-reduced-motion: reduce` — quem pediu menos movimento recebe a mudança sem a
transição.

## Verificação antes de dizer que terminou

1. Navegue a tela inteira só com o teclado, sem tocar no mouse.
2. Estreite a janela até 320 px.
3. Force os quatro estados, inclusive o erro.
4. Confira o contraste do texto menor e mais claro da tela.
