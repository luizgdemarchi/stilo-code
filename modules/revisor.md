# Módulo: Revisor

**Gatilho: carregue este módulo na fase `REVIEW`.** Em qualquer outra fase, ignore este
arquivo.

Revisar procura falhas verificáveis. Zero achados é resultado válido; não invente problemas.
Revisores não escrevem no código. Registre o alvo por commits ou snapshot explícito de
staged, unstaged e arquivos novos relevantes, com hashes, cobertura e exclusões. Distingua
introduzido, preexistente e indeterminado. Reviews antigos não exigem migração.

## O que revisar, nesta ordem

A ordem importa: um bug de corretude em código que nem deveria existir é tempo perdido.

1. **O diff cumpre o `spec.md`?** Cada critério de aceite do spec: atendido, parcialmente
   atendido ou ausente. Registre impacto e pendências obrigatórias separadamente;
   ausência de observação não comprova bug.
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

## Review multiagente

Quando houver subagentes, o coordenador pode distribuir em paralelo somente as lentes aplicáveis: qualidade
geral, segurança, tipagem e framework. Cada revisor retorna `arquivo:linha`, gravidade,
alegação curta e cenário concreto, sem escrever no código.

O coordenador deduplica os retornos, descarta alegações sem cenário concreto ou já
resolvidas, ordena os achados por gravidade e sintetiza tudo no template existente
`.stilo/review-NN.md` abaixo. Sem subagentes, faça a revisão única atual, sem erro e sem
pedir instalação.

## Formato de um achado

Um achado é acionável ou não é achado. Todo campo abaixo é obrigatório.

```
### N. Título curto do problema

- **Arquivo:** `caminho/do/arquivo.js:linha`
- **Gravidade:** crítico | alto | médio | baixo
- **O que quebra:** entrada ou situação concreta → resultado errado observável.
- **Como corrigir:** a mudança mínima que resolve.
- **Evidência:** reprodução, comando e resultado, ou leitura verificável; declarar prova não executada.
- **Confiança:** alta | média | baixa
- **Contraprova verificada:** chamadores e controles compartilhados que podem refutar a alegação; resultado observado.
- **Classificação:** confirmado | hipótese | sugestão
- **Origem:** introduzido | preexistente | indeterminado
- **Estado:** aberto
```

**Gravidade:**

| Nível | Significa |
|---|---|
| `crítico` | Perde dados, expõe segredo, quebra em produção, ou um critério de aceite do `spec.md` não foi atendido |
| `alto` | Bug real num caminho comum, ou erro tratado de forma que esconde a causa |
| `médio` | Bug em caso de borda improvável, ou falta de teste em lógica não trivial |
| `baixo` | Clareza, nome, duplicação, comentário desatualizado |

Gravidade mede impacto; confiança mede sustentação. Hipótese não conta como bug confirmado.
Procure autorização nos chamadores e controles compartilhados antes de concluir que falta
validação. Não invente reprodução ou teste executado; declare prova não executada.

Exemplos: acesso entre tenants reproduzido é confirmado, confiança alta; caminho sem
reprodução é hipótese pendente; autorização no chamador que nega acesso refuta a suspeita.
Registre a contraprova e descarte a alegação com motivo, sem inventar bug.

Não invente achado para encher a lista. Rodada sem achado `crítico` nem `alto` é resultado
válido e é o que fecha o projeto.

## Arquivo de review

Grave sempre em `.stilo/review-NN.md`, com `NN` igual a `reviewRound` + 1, com dois
dígitos: `review-01.md`, `review-02.md`. Nunca sobrescreva um review anterior — a
sequência é o histórico do que já foi encontrado.

```markdown
# Review NN — <projeto>

Revisado: <commits ou snapshot staged/unstaged/novos com hashes>
Cobertura e exclusões: <arquivos, cenários e limitações>
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
com motivo. Evidências obrigatórias pendentes também impedem DONE.

Achados `médio` e `baixo` em aberto não impedem `DONE`, mas ficam listados no último
review — é o que o projeto sabe sobre si mesmo.
