# Review 01 — stilo-code

Revisado: todo o repositório (46 arquivos, 4.725 linhas), dos commits `2c1f45a` a `d6d39c5`.
Contra: `spec.md`, `plan.md`

## Resumo

7 achados: 1 crítico, 2 alto, 2 médio, 2 baixo.

Os três primeiros foram reproduzidos rodando o código, não inferidos por leitura.

## Achados

### 1. `/stilo enxuto` sobrescreve um `state.json` ilegível e apaga a fase

- **Arquivo:** `hooks/stilo-prompt.js:79`
- **Gravidade:** crítico
- **O que quebra:** `state.json` com um erro de digitação (JSON inválido) num projeto em
  `EXECUTE`. O usuário roda `/stilo enxuto pleno`. `readState` devolve `null`, o `|| {}`
  transforma isso num objeto vazio, e `writeState` grava por cima:

  ```
  antes:  { "project": "meu-app", "phase": "EXECUTE"  <<<corrompido
  depois: { "version": 1, "enxuto": "pleno", "updated": "2026-08-22T00:20:37Z" }
  ```

  `project` e `phase` somem. O projeto perde o único registro durável de onde estava — que
  é a razão de o pacote existir. E o texto de volta diz "gravado", sem sinal de perda.
- **Como corrigir:** não gravar quando `readState` devolve `null`. Reportar que o arquivo
  está ilegível, com o caminho, e deixar o usuário consertar.
- **Estado:** corrigido — `hooks/stilo-prompt.js:79-88`: `readState` nulo agora reporta o arquivo ilegível e não grava. Teste: `/stilo enxuto não sobrescreve um state.json ilegível`

### 2. Fase inválida no `state.json` vira `BRAINSTORM` em silêncio

- **Arquivo:** `hooks/stilo-instructions.js:47`
- **Gravidade:** alto
- **O que quebra:** `"phase": "EXECUTANDO"` (ou qualquer valor fora da lista) faz
  `fase()` cair no default `'BRAINSTORM'`:

  ```
  stilo: projeto=meu-app · fase=BRAINSTORM · enxuto=off ·
         próxima: fazer perguntas até o usuário confirmar problema e escopo
  ```

  Um projeto no meio da execução é reportado como se ainda estivesse na conversa inicial, e
  o agente é instruído a voltar a fazer perguntas. O erro de digitação nunca aparece.
  O agente é quem grava esse arquivo, então um valor fora da lista é plausível.
- **Como corrigir:** quando `state.phase` existe mas não normaliza, dizer isso no lugar de
  adivinhar: reportar o valor lido e pedir a fase correta ao usuário.
- **Estado:** corrigido — `hooks/stilo-instructions.js:52-58` (`faseInvalida`) e o bloco de estado: o valor lido é reportado e o agente é mandado perguntar. Teste: `fase inválida é reportada, não trocada por BRAINSTORM`

### 3. Com dois projetos, o contexto injetado se contradiz e manda criar um terceiro

- **Arquivo:** `hooks/stilo-instructions.js:78` (`blocoEstado` com `state` nulo)
- **Gravidade:** alto
- **O que quebra:** workspace com `a/.stilo/state.json` e `b/.stilo/state.json`.
  `resolveProjeto` devolve `state: null` mais dois caminhos, e o `SessionStart` injeta os
  dois blocos em sequência:

  ```
  Nenhum `.stilo/state.json` encontrado a partir do diretório atual.
  Se o usuário pedir um projeto novo: crie a subpasta dele, crie …
  ---
  stilo: mais de um projeto encontrado a partir do diretório atual:
  ```

  "Nenhum encontrado" e "mais de um encontrado" na mesma injeção. Pior que a contradição:
  o primeiro bloco instrui a criar projeto novo, que é exatamente a ação errada num
  workspace que já tem dois. O § 13 do `spec.md` exige que ambiguidade seja reportada,
  não resolvida por chute — aqui ela é reportada **depois** de uma instrução conflitante.
- **Como corrigir:** `blocoEstado` recebe os caminhos e, quando há mais de um, emite só o
  bloco de ambiguidade — sem o texto de "nenhum encontrado" e sem a instrução de criar.
- **Estado:** corrigido — `blocoEstado(state, caminhos)`: com mais de um projeto sai só a nota de ambiguidade. Os três hooks e o plugin do OpenCode passam `caminhos` adiante. Teste: `com dois projetos o contexto não manda criar um terceiro`

### 4. `writeState` não é atômico

- **Arquivo:** `hooks/stilo-state.js:129`
- **Gravidade:** médio
- **O que quebra:** `fs.writeFileSync` trunca antes de escrever. Uma queda de energia ou um
  `kill` no meio da gravação deixa `state.json` truncado; `readState` devolve `null` e a
  fase do projeto se perde. Probabilidade baixa, arquivo pequeno — mas o custo é justamente
  o dado que o pacote existe para não perder.
- **Como corrigir:** gravar num arquivo temporário ao lado e `renameSync` por cima, que é
  atômico no mesmo volume, inclusive no Windows.
- **Estado:** corrigido — `hooks/stilo-state.js:136-140`: grava em `.tmp` e `renameSync` por cima. Teste: `writeState não deixa o state.json truncado nem lixo temporário`

### 5. Os reviews não são versionados

- **Arquivo:** `.gitignore:2`
- **Gravidade:** médio
- **O que quebra:** `.stilo/` inteiro está ignorado, então `.stilo/review-NN.md` — que o
  `spec.md` § 4 chama de artefato durável e o `modules/revisor.md` manda nunca sobrescrever
  — fica fora do git. Um `git clean -xdf` apaga o histórico de review do projeto.
  `state.json` está certo em ficar de fora: é estado de runtime, por máquina.
- **Como corrigir:** manter `.stilo/` ignorado e abrir exceção para `.stilo/review-*.md`.
- **Estado:** corrigido — `.gitignore`: `.stilo/*` com exceção `!.stilo/review-*.md`. O padrão precisou virar `.stilo/*` porque o git não reabre arquivo dentro de diretório excluído

### 6. Nota de ambiguidade repetida em toda mensagem

- **Arquivo:** `hooks/stilo-prompt.js:104`
- **Gravidade:** baixo
- **O que quebra:** enquanto o usuário não desfizer a ambiguidade, cada mensagem injeta a
  lista inteira de projetos, não uma linha. É custo por turno numa situação que pode durar
  a conversa toda. Suspeita de incômodo, não de erro: o comportamento está correto.
- **Como corrigir:** deixar como está até incomodar. Se incomodar, encurtar para uma linha
  com a contagem depois da primeira vez.
- **Estado:** descartado — comportamento correto, e a nota agora cabe em uma linha (`2 projetos encontrados …`) no `UserPromptSubmit`. Revisitar se incomodar de verdade

### 7. `DONE` não aparece na tabela de nível do `AGENTS.md`

- **Arquivo:** `AGENTS.md:117`
- **Gravidade:** baixo
- **O que quebra:** o código mapeia `DONE → off` (`hooks/stilo-state.js:27`), mas a tabela
  do ruleset lista só as seis primeiras fases. Um agente sem o hook, lendo só o `AGENTS.md`,
  não sabe o nível em `DONE`. Consequência pequena — em `DONE` não há mais trabalho.
- **Como corrigir:** uma linha na tabela.
- **Estado:** corrigido — linha `DONE` na tabela do `AGENTS.md` e do `modules/enxuto.md`, com os adaptadores ressincronizados

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 1 | Instala no Claude Code sem erro | atendido (caminho local; GitHub no passo 15) |
| 2 | Pasta sem `.stilo/` entra em `BRAINSTORM` | atendido |
| 3 | Sessão nova reporta fase e próxima ação | atendido — **menos** com fase inválida (achado 2) |
| 4 | `/clear` retoma na fase certa | atendido (mecanismo) |
| 5 | Fim de `SPEC` grava, atualiza estado e avisa | atendido (instrução presente) |
| 6 | `/stilo-off` e `/stilo` | atendido |
| 7 | Sem `node` no PATH não quebra | atendido |
| 8 | `--check` dos adaptadores | atendido |
| 9 | `AGENTS.md` autossuficiente | atendido (parcial no achado 7) |
| 10 | Zero companions, nada preso a um agente | atendido |
| 11 | Módulos só na fase certa | atendido |
| 12 | Enxuto em `EXECUTE` | atendido (mecanismo) |
| 13 | `/stilo enxuto` persiste | atendido — **mas** destrói o estado se o arquivo estiver ilegível (achado 1) |
| 14 | Repo em pt-BR | atendido |

## Fechamento da rodada

Todos os 7 achados resolvidos: 6 corrigidos, 1 descartado com motivo. Quatro testes de
regressão novos em `tests/hooks.test.js`, um por achado corrigido de gravidade média ou
acima. Suíte em 51 testes, todos passando.

## Passos do plano

Passos 1 a 14 feitos e verificados. Passo 15 (publicar) parado à espera de confirmação do
usuário, como o próprio plano determina.
