Gatilho: `EXECUTE` ou `REVIEW` com `design.md` no ciclo (injetado pelo hook) ou com diff que toca interface (lido pelo agente).

# Frontend: piso de qualidade

Limites verificáveis olhando a tela.

- **Hierarquia:** uma ênfase por vez (tamanho, peso ou contraste) e uma ação primária por
  tela.
- **Espaçamento:** escala fixa (4, 8, 12, 16, 24, 32, 48), nada fora dela. Elementos
  relacionados ficam mais perto entre si do que dos vizinhos.
- **Contraste:** texto normal ≥ 4.5:1; texto grande (≥ 24 px, ou ≥ 19 px em negrito)
  ≥ 3:1; borda de campo, ícone com significado e foco ≥ 3:1. Temas claro e escuro passam
  nos mesmos limites.
- **Cor nunca é o único canal:** erro também tem ícone ou texto; seleção também muda forma
  ou peso.

## Quatro estados

Toda tela que busca ou envia dados tem os quatro; faltar um é achado de review.

- **Vazio:** diz que está vazio e qual é o próximo passo.
- **Carregando:** visível desde o início; o layout não pula quando o conteúdo chega.
- **Erro:** o que falhou, em linguagem de gente, e como tentar de novo. Nunca só um código;
  nunca descarta o que o usuário digitou.
- **Sucesso:** o conteúdo ou a confirmação explícita.

## Teclado

`Tab` alcança todo controle, na ordem visual. Foco sempre visível: nunca `outline: none` sem
substituto de contraste igual ou maior. `Enter` e `Espaço` acionam botões (`<button>`, não
`div` com `onClick`). `Esc` fecha modal e menu; o modal prende o foco e o devolve ao fechar.
Todo campo tem `<label>`; placeholder não é rótulo. Imagem informativa tem `alt`;
decorativa, `alt=""`.

## Responsividade e movimento

Funciona a partir de 320 px, sem rolagem horizontal da página; conteúdo largo rola no
próprio container. Alvo de toque com pelo menos 44 × 44 px. Animação entre 150 e 300 ms,
respeitando `prefers-reduced-motion: reduce`.

## Antes de dizer que terminou

1. Percorra a tela só com o teclado.
2. Estreite até 320 px.
3. Force os quatro estados.
4. Confira o contraste do menor texto mais claro.
