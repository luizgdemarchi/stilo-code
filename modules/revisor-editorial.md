# Módulo: revisor editorial

**Gatilho: carregue em `EDITORIAL_REVIEW` e `EDITORIAL_FIX`.** Ignore nas outras fases.

O objetivo é deixar a prosa mais clara e específica, preservando a voz de quem escreveu.
É uma revisão contextual de texto, não um detector de autoria por IA. Um padrão é pista
para leitura, nunca prova automática de problema.

## `EDITORIAL_REVIEW`: cobertura e leitura

1. Leia o objetivo do projeto e os documentos relevantes antes de editar ou sugerir cortes.
2. Faça um inventário do texto mantido. Com Git, use `git ls-files --cached --others
   --exclude-standard`; sem Git, use `rg --files --hidden` e registre essa limitação.
3. Revise prosa em documentação, interface, comentários, docstrings e textos autorais em
   arquivos-fonte. Leia cada ocorrência no contexto do arquivo, não como busca e troca.
4. Registre o inventário por categoria: revisado, excluído, não aplicável ou não verificado.
   Declare contagens quando puder obtê-las e liste os motivos das exclusões. Não diga
   “repositório inteiro revisado” se houver caminhos mantidos sem inspeção.

Exclua binários, dependências de terceiros, arquivos gerados e saídas de build, dados,
logs, evidências, histórico e formatos machine-readable (por exemplo JSON de estado,
lockfiles e CSV). Preserve a estrutura de código, asserções de teste, exemplos, citações,
placeholders, contratos e mensagens de erro. Se um arquivo misturar prosa e conteúdo
executável, revise somente a prosa e registre a limitação.

## O que procurar

Leia o documento inteiro e use estes padrões como pistas. Verifique se a frase realmente
atrasa, obscurece ou enfraquece a ideia naquele contexto:

- contraste binário ensaiado, em vez de declarar diretamente a ideia principal;
- introdução vazia, falsa revelação ou pergunta retórica que apenas prepara a frase seguinte;
- dois pontos usados para criar suspense quando não vêm lista, rótulo ou citação;
- comentário superficial que diz o que um fato “demonstra” sem apresentar consequência;
- linguagem de importância inflada, atribuição vaga ou comentário sobre como interpretar o texto;
- verbos genéricos e troca de sinônimos que torna incerto se o referente mudou;
- enumeração negativa, fragmentos dramáticos e sequências de frases com ritmo repetido;
- metáfora final de efeito ou conclusão que apenas repete o que já foi dito;
- formatação decorativa que não ajuda o leitor, como emoji em título ou ênfase espalhada;
- travessões usados repetidamente como pausa, sem uma razão de leitura.

Também procure trechos difíceis de seguir, voz passiva sem motivo, abstrações substituíveis
por fatos concretos e frases de preenchimento. Não force abertura com a conclusão, frases
curtas, voz ativa ou o mesmo molde em todos os parágrafos. Preserve humor, opinião,
incerteza, digressões e imperfeições que expressem a voz do autor.

## Quando registrar um achado

Só registre um trecho quando puder explicar o efeito concreto sobre o leitor e propor uma
correção mínima sem inventar fatos, fontes, exemplos ou opiniões. Não elimine uma expressão
apenas porque aparece na lista acima. Um exemplo deliberado de um padrão, uma citação ou
um trecho de sátira não é defeito por si só.

Use gravidade conforme o efeito: `crítico` ou `alto` somente para erro editorial concreto
com impacto significativo; `médio` para clareza ou credibilidade materialmente reduzida;
`baixo` para melhoria localizada. Confiança mede a evidência do achado, não sua gravidade.
Se não for possível confirmar uma afirmação ou entender a intenção, registre a dúvida e
pergunte; não altere o conteúdo para fazê-lo parecer certo.

Não escreva nos arquivos nesta fase. Grave uma rodada nova em
`.stilo/editorial-review-NN.md`, com `NN` igual a `editorialReviewRound` + 1. Não sobrescreva
relatórios anteriores.

```markdown
# Revisão editorial NN — <projeto>

Revisado: <HEAD ou snapshot staged/unstaged/novos com hashes; se não houver Git, declare>
Objetivo e público: <fonte consultada ou desconhecido>
Cobertura: <categorias e quantidade/caminhos revisados>
Exclusões: <categorias, caminhos ou motivos>
Limitações: <caminhos sem leitura, ambiguidades e método de inventário>

## Resumo

<N> achados: <n> crítico, <n> alto, <n> médio, <n> baixo.

## Achados

### 1. <padrão editorial>

- **Arquivo:** `caminho/arquivo.ext:linha`
- **Trecho:** <passagem curta e fiel ao original>
- **Contexto e efeito:** <por que isso dificulta ou enfraquece a leitura>
- **Gravidade:** crítico | alto | médio | baixo
- **Confiança:** alta | média | baixa
- **Correção mínima:** <mudança que preserva voz e sentido>
- **Estado:** aberto
```

Sem achados, registre `0 achados` e mantenha a cobertura e as exclusões. Ausência de
observação não comprova que um caminho foi revisado.

## `EDITORIAL_FIX`: resolver o relatório

- Corrija cada achado com a menor mudança que resolva o efeito observado. Não faça busca e
  substituição em massa.
- Preserve fatos, negações, números, nomes, termos financeiros ou técnicos, contratos,
  placeholders, formatação necessária e comportamento do código.
- Não alise a voz para uniformizar o texto. Não introduza informação sem fonte.
- No relatório da rodada, marque cada item `corrigido` com caminho/linha da alteração ou
  `descartado` com o motivo contextual. Não deixe item sem decisão.
- Depois de corrigir, retorne a `EDITORIAL_REVIEW` e examine novamente todo o texto
  mantido; não confira só os arquivos tocados.

Só siga para `DONE` quando uma rodada editorial não encontrar achados `crítico` ou `alto`
e os relatórios anteriores tiverem os itens resolvidos ou descartados com motivo. Achados
`médio` e `baixo` podem permanecer listados quando não bloquearem o resultado; declare-os.
