# Review 22 — stilo-code

Revisado: `4ced739..0d32afd` (branch `ciclo/2026-11-02-dieta-superpowers-design`), ciclo
`2026-11-02-dieta-superpowers-design`, trilha completa.
Contra: `docs/ciclos/2026-11-02-dieta-superpowers-design/spec.md` e `plan.md`; sem `design.md`.
Revisor: coordenador, revisão única, sem subagentes. Ambiente informou Opus 5.5; esforço não
confirmado pela ferramenta.

**Cobertura:** `hooks/` (todos os arquivos alterados e `stilo-sessao.js`), `scripts/medir-tokens.js`,
`scripts/verificar-publicacao.js`, `publicacao.json`, os 19 módulos, `AGENTS.md`, manifestos,
`tests/estrutura.test.js`, `tests/hooks.test.js` (C24) e `tests/instructions.test.js` (C05, C06),
seção de versão dos READMEs, cabeçalho de `THIRD_PARTY_NOTICES.md`, migração dos 14 documentos.

**Exclusões:** conteúdo dos documentos migrados (histórico); texto integral das licenças
(conferido por hash em T07, não reconferido); prosa dos READMEs e de `docs/` fora da seção de
versão (fica para o `EDITORIAL_REVIEW`); comparação linha a linha com os originais
creditados em `THIRD_PARTY_NOTICES.md` (L2 só por amostragem).

**Verificações nesta árvore (`0d32afd`):**

- `npm test`: `ℹ tests 156` · `ℹ pass 156` · `ℹ fail 0` (log em `.stilo/logs/review-22-npm-test.log`).
- `npm run validate-plan`: 13 tarefas, 5 ondas.
- `npm run verificar-publicacao`: `publicação 0.2.0 confere (sha256 54c9d15ce70f)`.
- `git diff --check 4ced739 HEAD`: sem saída.
- `git diff -M --name-status 4ced739 HEAD`: 14 `R100`, nenhum `D`; blobs de `spec.md` e
  `plan.md` iguais antes e depois.
- `SessionStart` com stdin aberto e nunca fechado (Windows): saída de 15.299 caracteres,
  igual ao contexto completo, em 2,2 s; com stdin fechado, 1,3 s.

## Resumo

6 achados: 1 crítico, 1 alto, 2 médio, 2 baixo.

## Achados

### 1. `SessionStart` passa do limite de 10.000 caracteres do Claude Code em todas as fases
- **Arquivo:** `hooks/stilo-instructions.js:13`
- **Gravidade:** crítico
- **O que quebra:** qualquer sessão no Claude Code com projeto ativo. O contexto do
  `SessionStart` mede de 11.456 (`BRAINSTORM`) a 15.181 (`REVIEW`) caracteres; o host grava
  o texto em arquivo e entrega ao modelo só o caminho e os primeiros 2.000 caracteres. A
  prévia contém o início do `AGENTS.md` e nada mais: o bloco de estado começa no caractere
  8.683, e os módulos da fase vêm depois dele. Além disso, `hooks/stilo-activate.js:17`
  registra a fase como injetada, então o próximo `UserPromptSubmit` também não entrega os
  módulos, embora eles caibam no limite (2.372 a 6.088). O objetivo do spec, "fazer as
  regras chegarem inteiras ao agente", não é atingido no host principal. C05 passa porque
  mede contra 19.500, que não é o limite do host.
- **Como corrigir:** emendar R2.2 e C05: cada string injetada fica em até 10.000
  caracteres, porque o Claude Code mede cada hook separadamente e não tem configuração para
  subir o limite. Desenho sugerido: dois comandos no `SessionStart` de
  `hooks/claude-codex-hooks.json`, um com o bloco de estado e os módulos da fase e outro só
  com o `AGENTS.md` (8.676), cada um testado contra 10.000. Conferir se o Codex tem limite
  equivalente. Como muda spec e plano, a correção passa por aprovação do usuário.
- **Evidência:** documentação de hooks do Claude Code (`code.claude.com/docs/en/hooks`, seção
  "JSON output"): "A hook's `additionalContext` [...] and its plain stdout, are capped at
  10,000 characters"; "Claude Code saves the output to a file [...] and replaces it with the
  file path and a preview of up to the first 2,000 characters"; "Claude Code doesn't ask
  Claude to read the file". Nesta sessão, o `SessionStart` da cópia instalada chegou como
  `Output too large (15.5KB). Full output saved to: …` com `Preview (first 2KB)`. Medição em
  projeto temporário com `buildInjectedContext`, nas nove fases: todas acima de 10.000, e
  `prévia tem bloco de estado? false` em todas. Sem projeto: 9.172, dentro do limite.
- **Confiança:** alta
- **Contraprova verificada:** procurei divisão da saída em mais de um hook ou campo:
  `claude-codex-hooks.json` tem um comando por evento, e `writeHookOutput` escreve uma vez
  (`hooks/stilo-runtime.js:27`). O limite do Codex não foi verificado.
- **Classificação:** confirmado
- **Origem:** preexistente (a cópia `0.1.0` já injeta 15,5 KB), mantido pelo orçamento de
  R2.2 deste ciclo
- **Estado:** corrigido: `hooks/stilo-instructions.js:16` (`CONTEXT_BUDGET` 10.000) e `:430-497` (partes `nucleo`/`fase`), `hooks/stilo-activate.js`, `hooks/claude-codex-hooks.json` (dois comandos); emenda em spec R2.2/C05 e plano (decisões 8–10). Medido: núcleo 8.733, fase 2.793–6.548; hook real no Windows com stdin aberto: 8.733 e 5.583 caracteres. Codex: limite de ~2.500 tokens confirmado na documentação; contagem exata não verificada ao vivo

### 2. Contador de rodada sem dono: `FIX` e `EDITORIAL_FIX` apontam o relatório errado
- **Arquivo:** `modules/revisor-editorial.md:68`
- **Gravidade:** alto
- **O que quebra:** as instruções injetadas mandam incrementar o contador só na correção
  (`modules/correcao.md:16`, `modules/revisor-editorial.md:68`), e as fases de revisão só
  gravam `NN` = contador + 1 (`modules/revisor.md:69`), sem atualizar o contador. O hook,
  porém, manda a fase de correção ler `review-<contador>` (`hooks/stilo-instructions.js:404`
  e `:412`). Seguindo o texto: `EDITORIAL_REVIEW` com `editorialReviewRound: 0` grava
  `editorial-review-01.md`, passa a `EDITORIAL_FIX`, e o bloco de estado diz "corrigir os
  achados de `.stilo/editorial-review-00.md`", que nunca existe. No técnico, `FIX` aponta o
  review anterior, já resolvido. E uma revisão limpa nunca avança o contador, então o
  `REVIEW` do ciclo seguinte é instruído a gravar um `review-NN.md` que já existe. Se o
  agente atualizar o contador ao gravar o review, como foi feito neste repositório, a
  instrução de incrementar na correção pula um número.
- **Como corrigir:** dar um dono só ao contador: a fase de revisão grava `NN` = contador + 1
  e, no mesmo passo, grava o contador = `NN` (`revisor.md` "Arquivo e saída",
  `revisor-editorial.md` "Relatório" e a tabela do § 1 do `AGENTS.md`). Tirar "incremente"
  de `correcao.md:16` e de `revisor-editorial.md:68`. Assim, as linhas do hook passam a
  apontar o relatório certo sem mudar código. Teste estrutural: nenhum módulo de correção
  manda incrementar.
- **Evidência:** `buildFullContext` com `reviewRound: 21`, `editorialReviewRound: 0`:
  `FIX` → "corrigir os achados de `.stilo/review-21.md`"; `EDITORIAL_FIX` → "corrigir os
  achados de `.stilo/editorial-review-00.md`". Histórico de `.stilo/state.json`: os agentes
  gravaram o contador igual ao último review (por exemplo, `REVIEW`, 21, com `review-21.md`),
  ao contrário do texto.
- **Confiança:** alta
- **Contraprova verificada:** procurei em `AGENTS.md`, `modules/` e READMEs outra regra que
  atualize o contador na fase de revisão: não há. `4ced739:AGENTS.md:78` já mandava
  incrementar no `FIX`, com a mesma linha de hook (`4ced739:hooks/stilo-instructions.js:289`).
- **Classificação:** confirmado
- **Origem:** preexistente, mantido em `correcao.md` (novo) e em `revisor-editorial.md`
  (reescrito)
- **Estado:** corrigido: `modules/revisor.md` (Arquivo e saída), `modules/revisor-editorial.md` (Relatório e EDITORIAL_FIX), `modules/correcao.md:16`, `AGENTS.md` § 1; teste `tests/estrutura.test.js` (falha com os textos antigos, passa com os novos)

### 3. `medir-tokens.js` não sinaliza formato de transcript desconhecido
- **Arquivo:** `scripts/medir-tokens.js:95`
- **Gravidade:** médio
- **O que quebra:** uma linha só conta como "tipo desconhecido" quando não tem `type`. Linha
  com `type` que o script não trata é ignorada em silêncio. Se o Claude Code renomear
  `assistant`, o relatório sai com `Chamadas ao modelo: 0` e `linhas de tipo desconhecido: 0`,
  sem sinal da mudança, que é o caso que R9.3 e o risco "o formato dos transcripts pode
  mudar" cobrem. A comparação E1 registraria zero como medida válida.
- **Como corrigir:** contar como desconhecida a linha cujo `type` não é tratado (`assistant`,
  `user`, `event_msg`, `response_item`) nem está numa lista curta de tipos conhecidos sem uso
  (`summary`, `system`, `session_meta` e os que aparecerem nos fixtures), e cobrir com uma
  linha de tipo novo no teste.
- **Evidência:** arquivo com `{"type":"response","message":{"id":"m1","usage":{...}}}` e
  `{"type":"assistant_v2",...}`: saída `Chamadas ao modelo: 0` e `Linhas inválidas: 0 ·
  linhas de tipo desconhecido: 0`.
- **Confiança:** alta
- **Contraprova verificada:** `lerClaude` (`:42`) retorna sem contar para qualquer `type`
  fora de `assistant` e `user`; o teste só cobre linha sem `type` (`{"sem":"tipo"}`). Na
  sessão Codex mais recente do usuário, não houve `token_count` repetido (50 eventos, 0
  repetidos), então a contagem de chamadas do Codex está correta.
- **Classificação:** confirmado
- **Origem:** introduzido
- **Estado:** corrigido de outro jeito: `scripts/medir-tokens.js` conta `arquivosSemChamadas` e avisa; lista de tipos conhecidos descartada porque os transcripts reais têm 17 tipos (Claude) e 8 (Codex), que mudam com frequência; teste em `tests/medir-tokens.test.js`

### 4. Registro de publicação feito antes do review trava a correção
- **Arquivo:** `scripts/verificar-publicacao.js:93`
- **Gravidade:** médio
- **O que quebra:** T12 registrou `0.2.0` antes do `REVIEW`. Qualquer correção deste ciclo em
  arquivo distribuído (os achados 1 e 2 tocam `hooks/` e `modules/`) faz
  `npm run verificar-publicacao` falhar com "conteúdo distribuído mudou sem versão nova
  (0.2.0)", e `--registrar` recusa pelo mesmo motivo. A orientação do `progresso.md`,
  "registre de novo antes de publicar", não é executável pelo script. As saídas que
  sobram são subir para `0.2.1` uma versão nunca publicada, o que quebra C02 (que fixa
  `0.2.0`), ou apagar `publicacao.json` à mão.
- **Como corrigir:** registrar só no `DONE`, logo antes de publicar: dizer isso em
  `modules/encerramento.md` (passo 3) e nos READMEs. Neste ciclo, apagar `publicacao.json`
  depois do último `FIX` e registrar de novo, porque `0.2.0` não foi publicada.
- **Evidência:** leitura de `:93-95`: com versão igual e hash diferente, `registrar` devolve
  erro. O teste "editar `modules/a.md`: verificar dá 1 e `registrar` recusa" confirma o
  comportamento. Correção e registro posterior não executados nesta rodada.
- **Confiança:** alta
- **Contraprova verificada:** procurei opção de substituir registro de versão não publicada:
  a CLI aceita só `--registrar` e a raiz (`:103-109`).
- **Classificação:** confirmado
- **Origem:** introduzido
- **Estado:** corrigido: `modules/encerramento.md` passo 3, READMEs; `publicacao.json` removido (`git rm`), registrar no `DONE` antes de publicar

### 5. `validate-plan` do `package.json` amarra cada ciclo a uma versão nova
- **Arquivo:** `package.json:15`
- **Gravidade:** baixo
- **O que quebra:** o script aponta para o plano deste ciclo, e `package.json` entra no hash
  de publicação. Todo ciclo novo, mesmo só de documentação, precisa editar a linha, muda o
  hash e obriga a subir a versão do plugin sem mudança de comportamento.
- **Como corrigir:** `scripts/validate-plan.js` sem argumento resolve o plano do ciclo ativo
  com `documentosDoCiclo`, e o script do `package.json` deixa de citar caminho. O C17 de
  `tests/estrutura.test.js` passa a conferir a resolução, não o texto do `package.json`.
- **Evidência:** `package.json:15` e a lista `DISTRIBUIDOS` de
  `scripts/verificar-publicacao.js:10`. O próprio `progresso.md` registra o efeito.
- **Confiança:** alta
- **Contraprova verificada:** a lista de distribuídos é da decisão 5 do plano; não há
  exclusão para `scripts` do `package.json`.
- **Classificação:** sugestão
- **Origem:** introduzido
- **Estado:** corrigido: `package.json:15` sem caminho; `scripts/validate-plan.js` resolve o plano do ciclo ativo (`planoDoCicloAtivo`); testes em `tests/validate-plan.test.js` e C17

### 6. Comentário de `ENXUTO_POR_FASE` cita seção e campo antigos
- **Arquivo:** `hooks/stilo-state.js:23`
- **Gravidade:** baixo
- **O que quebra:** o comentário diz "quando state.enxuto é auto (AGENTS.md § 6)". O Modo
  Enxuto agora é o § 8, o § 6 é "Módulos", e o nível vem só da fase, como diz
  `resolveEnxuto` (`:254`).
- **Como corrigir:** "Nível de enxuto por fase (AGENTS.md § 8)."
- **Evidência:** `AGENTS.md`, títulos `## 6. Módulos` e `## 8. Modo Enxuto`.
- **Confiança:** alta
- **Contraprova verificada:** nenhuma outra referência de seção nos hooks está errada:
  `stilo-instructions.js:39` cita o § 6 corretamente.
- **Classificação:** confirmado
- **Origem:** introduzido pela renumeração do `AGENTS.md`
- **Estado:** corrigido: `hooks/stilo-state.js:23`

## Focos da revisão do plano

| # | Foco | Resultado |
|---|---|---|
| 1 | Fase acima de 19.500 ou compactada | Nenhuma: máximo 15.181 nominal e 17.860 no pior caso; injetado igual ao completo. Mas o limite do host é 10.000: achado 1 |
| 2 | Rastreio grava no projeto ou trava no Windows | Nada gravado no projeto (teste C24). Stdin aberto: saída íntegra em 2,2 s |
| 3 | Publicação passa com conteúdo alterado e versão repetida | Não passa. Registro antecipado: achado 4 |
| 4 | `medir-tokens.js` conta duas vezes o mesmo `message.id` | Não conta (`vistos`, `:51`). Formato desconhecido: achado 3 |
| 5 | Módulo condensado perdeu regra de segurança | Negações, números e erro literal em `enxuto.md`; erro literal em `depuracao.md`, `subagente.md` e § 7; sem commit em `execucao.md` e `subagente.md`; nada integrado, publicado ou apagado sem escolha em `encerramento.md`. Nenhuma perda |
| 6 | Migração apaga histórico | 14 renames `R100`, conteúdo idêntico |

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| C01 | `npm test` passa | atendido (156/156) |
| C02 | versões `0.2.0` | atendido |
| C03 | publicação falha com conteúdo alterado e versão igual | atendido (`tests/publicacao.test.js`) |
| C04 | `AGENTS.md` ≤ 10.000 | atendido (8.676) |
| C05 | `SessionStart` ≤ 19.500 e igual ao completo | atendido como escrito; o limite não é o do host (achado 1) |
| C06 | subagente ≤ 6.000 com proibições e essencial da fase | atendido (1.149 a 2.791) |
| C07 | seções removidas e âncoras presentes | atendido |
| C08 | sem "até zero achados"; critério único | atendido |
| C09 | `enxuto.md` e `orquestracao.md` coerentes com os hooks | atendido |
| C10 | projeto novo com `editorialReviewRound` e `cycle` | atendido |
| C11 | sem versão de modelo nos distribuídos | atendido |
| C12 | sem `isOff`/`setOff` | atendido |
| C13 | `FIX` com regras de correção | atendido; a regra do contador está errada (achado 2) |
| C14 | `cycle` válido, inválido e ausente | atendido |
| C15 | ciclo, trilha curta e legado no bloco e na linha | atendido |
| C16 | diagnóstico pelo ciclo do estado, sem `cycle.json` | atendido |
| C17 | migração e `validate-plan` | atendido (achado 5 sobre o acoplamento) |
| C18 | módulos por fase e gatilho na primeira linha | atendido |
| C19 | avisos de terceiros; `superpowers` só neles | atendido |
| C20 | `frontend.md` só com `design.md` | atendido |
| C21 | `medir-tokens.js` com fixtures, `--json`, erro e linha malformada | atendido; R9.3 parcial (achado 3) |
| C22 | sem `dependencies` | atendido |
| C23 | `claude plugin validate .` | atendido (registrado em `evidencias.md`) |
| C24 | troca de fase injeta módulos uma vez; nada no projeto | atendido no hook; anulado no Claude Code pelo registro no `SessionStart` (achado 1) |
| C25 | caminho absoluto de `modules/` no bloco | atendido no texto; fora da prévia de 2.000 do host (achado 1) |
| L1 | motivo das regras | atendido |
| L2 | recorte, português, sem cópia longa | atendido por amostragem |
| L3 | trilha curta e editorial incremental sem ambiguidade | atendido |
| L4 | testes sem frases de prosa | atendido (C08 fixa a frase porque o critério exige) |
| E1 | medição antes e depois | pendente, sem bloquear |
| E2 | cópia instalada em `0.2.0` | pendente, sem bloquear |
