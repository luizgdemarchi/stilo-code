# Review 18 — stilo-code

Revisado: `82f0567` + working tree do ciclo "apenas Claude Code e Codex" (34 arquivos: 12
removidos, 21 modificados, plano novo).
Contra: `spec.md` § 18, `docs/superpowers/plans/2026-10-24-apenas-claude-codex-plan.md`
Revisor: subagente independente somente leitura (modelo solicitado `opus`, esforço `xhigh`;
ambiente informou Opus 5.5; esforço não confirmado pela ferramenta).

Verificações do revisor: `npm.cmd test` 128/128, 0 pulados; `claude plugin validate .` ok;
`validate-plan` 4 ondas; `git diff --check` limpo; hooks rodados com `QODER_SESSION_ID`,
`COPILOT_PLUGIN_DATA` e `PLUGIN_DATA` em projeto temporário: saída igual à do Claude Code
para os removidos e envelope JSON nos três eventos do Codex. Nenhum manifesto ou `require`
aponta para arquivo removido. Compactação preservada (SPEC/PLAN/EXECUTE/FIX ~19.400).

## Resumo

6 achados: 0 crítico, 0 alto, 1 médio, 5 baixo.

## Achados

### 1. Texto publicado ainda promete "qualquer agente" e "demais agentes"

- **Arquivo:** `.codex-plugin/plugin.json:17`, `AGENTS.md:150`
- **Gravidade:** médio
- **O que quebra:** a `longDescription` do Codex diz "para que qualquer agente retome o
  projeto", e a tabela do § 4 mantém "Demais agentes", injetada em toda sessão; contradiz o
  requisito 3 e o § 10. O teste do critério 51 só procura nomes.
- **Como corrigir:** reescrever as duas linhas e incluir expressões genéricas no teste.
- **Estado:** corrigido — linha "Demais agentes" removida de `AGENTS.md` § 4; `.codex-plugin/plugin.json:17` cita Claude Code e Codex; regex de `tests/manifestos.test.js` cobre expressões genéricas (RED em `AGENTS.md` → GREEN)

### 2. Teste do critério 50 frágil com `PLUGIN_DATA` herdado e sem SubagentStart do Codex

- **Arquivo:** `tests/hooks.test.js:128`, `:136-150`
- **Gravidade:** baixo
- **O que quebra:** com `PLUGIN_DATA` no shell, a base vira JSON e o teste falha; Codex não
  tem asserção de `SubagentStart`; variáveis removidas só testadas no `stilo-prompt.js`.
- **Como corrigir:** base com `PLUGIN_DATA: ''`; laço nos três hooks; asserção de SubagentStart.
- **Estado:** corrigido — `tests/hooks.test.js`: base com `PLUGIN_DATA: ''`, laço nos três hooks e asserção de `SubagentStart` do Codex; 12/12 também com `PLUGIN_DATA` herdado

### 3. Linhas da matriz parcialmente dependentes do que saiu

- **Arquivo:** `docs/aceite.md:17`, `:41`, `:42`, `:52`
- **Gravidade:** baixo
- **O que quebra:** critério 9 (AGENTS.md colado sem plugin) segue "atendido" sem teste que o
  verifique; linhas 33 e 44 tiveram texto histórico reescrito; 34 cita 1 pulado que não existe mais.
- **Como corrigir:** 9 → `retirado`; restaurar 33/44 e anotar a retirada; anotar 34 como anterior ao § 18.
- **Estado:** corrigido — `docs/aceite.md`: 9 → `retirado`; 33 e 44 com texto histórico e anotação do § 18; 34 anotado como anterior ao § 18

### 4. Tipo `retirado` ausente do template de evidências

- **Arquivo:** `docs/evidencias-template.md:3`, `:13`; cabeçalho de `docs/aceite.md:3-5`
- **Gravidade:** baixo
- **O que quebra:** quem preenche matriz nova não sabe quando usar `retirado` nem que ele não bloqueia `DONE`.
- **Como corrigir:** documentar o tipo e a regra.
- **Estado:** corrigido — `docs/evidencias-template.md` e cabeçalho de `docs/aceite.md` documentam `retirado`

### 5. Remoções não staged; inventário só olha o disco

- **Arquivo:** `tests/manifestos.test.js:124` e índice do git
- **Gravidade:** baixo
- **O que quebra:** commit montado só com arquivos modificados publicaria os 12 removidos.
- **Como corrigir:** `git rm` dos 12 caminhos antes do commit.
- **Estado:** corrigido — `git add -A`: as 12 remoções estão no índice

### 6. Divergências do `Files:` do plano

- **Arquivo:** `hooks/stilo-state.js:299`; manifestos; `README.md:170`, `README.en.md:174`
- **Gravidade:** baixo
- **O que quebra:** comentário de `stilo-state.js` não foi alterado como o plano pedia;
  manifestos e parágrafo do orçamento mudaram sem constar em tarefa.
- **Como corrigir:** ajustar o comentário e registrar as mudanças fora do `Files:`.
- **Estado:** corrigido — `hooks/stilo-state.js:299`; manifestos e parágrafo de orçamento dos READMEs registrados como ajuste do requisito 3 e correção de documento desatualizado (19.500 após a integração)

## Verificação após FIX

`npm.cmd test`: 128 testes, 128 passados, 0 falhas, 0 pulados. `claude plugin validate .`:
passou. `git diff --cached --check`: limpo. Plano válido. Correções conferidas pelo
coordenador; sem nova rodada independente, pois o review não teve achado crítico nem alto.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 49 | Nenhum arquivo de integração de agente removido é publicado | atendido no disco; índice pendente (achado 5) |
| 50 | Runtime reconhece só Claude Code e Codex | atendido; lacunas de teste (achado 2) |
| 51 | Documentação publicada não anuncia agente removido | parcial (achado 1) |
| 52 | Manifestos de Claude Code e Codex válidos | atendido |
| 53 | Histórico preservado; dependentes viram `retirado` | atendido, com ressalvas (achado 3) |
| 54 | Suíte completa passa sem dependência nova | atendido — 128/128 |
