Gatilho: fases `EDITORIAL_REVIEW` e `EDITORIAL_FIX`. Injetado pelo hook.

# Revisão editorial

Objetivo: prosa mais clara e específica, com a voz de quem escreveu. É leitura contextual,
não detector de autoria por IA; um padrão é pista, nunca prova.

## Cobertura

- **Incremental, o padrão:** texto alterado desde o commit-base do ciclo
  (`git diff --name-only <base>` mais arquivos novos) e os arquivos que a mudança deixou
  inconsistentes. Reler o repositório inteiro em toda rodada custa mais do que encontra.
- **Depois de um `EDITORIAL_FIX`:** os trechos corrigidos e o entorno deles.
- **Integral:** no primeiro ciclo do projeto (nenhuma outra pasta em `docs/ciclos/` e
  nenhum `spec.md` na raiz) ou quando o usuário pedir. Inventário com
  `git ls-files --cached --others --exclude-standard`; sem Git, `rg --files --hidden`,
  registrando a limitação.

Fica fora o histórico (documentos de ciclos encerrados, reviews, auditorias e evidências),
além de binários, código de terceiros, gerados, dados, logs e formatos de máquina. Em
arquivo misto, revise só a prosa. Preserve código, asserções, exemplos, citações,
placeholders, contratos e mensagens de erro.

## O que procurar

Pistas, a confirmar no contexto: contraste binário ensaiado; abertura vazia, falsa
revelação ou pergunta retórica; dois pontos de suspense; comentário que diz o que um fato
"demonstra" sem dar a consequência; importância inflada ou atribuição vaga; verbo genérico
ou troca de sinônimo que confunde o referente; fragmento dramático e ritmo repetido; fecho
que só repete; formatação decorativa; travessão como pausa recorrente; voz passiva sem
motivo; abstração onde cabe um fato.

Não force um molde único. Preserve humor, opinião, incerteza e o jeito do autor.

## Formato do achado editorial

Registre só quando puder dizer o efeito concreto no leitor e propor uma correção mínima sem
inventar fato, fonte ou exemplo. Na dúvida sobre intenção ou veracidade, pergunte.

```text
### N. <padrão editorial>
- **Arquivo:** `caminho:linha`
- **Trecho:** <passagem curta e fiel ao original>
- **Contexto e efeito:** <por que atrapalha a leitura>
- **Gravidade:** crítico | alto | médio | baixo
- **Confiança:** alta | média | baixa
- **Correção mínima:** <mudança que preserva voz e sentido>
- **Estado:** aberto
```

Gravidade: `crítico` ou `alto` só para erro editorial concreto de impacto significativo;
`médio` para clareza ou credibilidade materialmente reduzida; `baixo` para melhoria
localizada. Confiança mede a evidência, não a gravidade.

## Relatório

Em `EDITORIAL_REVIEW`, não edite arquivos. Grave `.stilo/editorial-review-NN.md`, com `NN`
igual a `editorialReviewRound` + 1, sem sobrescrever os anteriores. Cabeçalho: modo
(incremental ou integral), commit-base, `HEAD` ou snapshot revisado, objetivo e público,
cobertura, exclusões e limitações. Depois, resumo por gravidade e achados. Sem achados,
registre `0 achados` e mantenha cobertura e exclusões.

## `EDITORIAL_FIX`

Corrija cada achado com a menor mudança que resolve o efeito, sem busca e troca em massa.
Preserve fatos, negações, números, nomes, termos técnicos, contratos e comportamento do
código. Marque `corrigido` com `caminho:linha` ou `descartado` com motivo; nenhum item fica
sem decisão. Depois, incremente `editorialReviewRound` e volte a `EDITORIAL_REVIEW`.

Saída: uma rodada sem achado `crítico` nem `alto`, com os anteriores resolvidos ou
descartados com motivo. Então grave `phase: "DONE"`.
