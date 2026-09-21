# Review 10 — stilo-code

Revisado: auditoria opcional de simplificação, contrato de evidências 22–27, módulo DONE, testes e adaptadores sincronizados.
Contra: `spec.md`, `docs/superpowers/plans/2026-09-21-auditoria-opcional-simplificacao-plan.md`

## Verificações

- `npm.cmd test`: 75 passados, 1 smoke OpenCode opt-in pulado.
- `node --test tests/instructions.test.js tests/audit.test.js`: 19/19 passados.
- `node scripts/validate-plan.js docs/superpowers/plans/2026-09-21-auditoria-opcional-simplificacao-plan.md`: plano válido, 4 tarefas e 4 ondas.
- `node scripts/sync-adapters.js --check`: 6 adaptadores em dia.
- `git diff --check`: sem erros.

## Resumo

2 achados: 0 crítico, 0 alto, 2 médio, 0 baixo.

## Achados

### 1. O módulo novo não aparece na tabela de gatilhos

- **Arquivo:** `AGENTS.md:116`
- **Gravidade:** médio
- **O que quebra:** um agente que segue somente a tabela de módulos não sabe que `modules/auditoria.md` existe nem que deve carregá-lo em `DONE`, podendo encerrar sem oferecer o contrato detalhado.
- **Como corrigir:** adicionar `modules/auditoria.md` à tabela com gatilho exclusivo em `DONE`.
- **Estado:** corrigido em `AGENTS.md:125`.

### 2. A matriz deixa os seis critérios locais como pendentes

- **Arquivo:** `docs/aceite.md:22-27`
- **Gravidade:** médio
- **O que quebra:** a documentação afirma que os critérios 22–27 ainda estão pendentes embora os testes locais correspondentes passem, deixando a evidência do ciclo inconsistente e dificultando o diagnóstico de conclusão.
- **Como corrigir:** registrar os critérios como atendidos, apontando `tests/audit.test.js`, `tests/instructions.test.js`, `npm.cmd test` e este review.
- **Estado:** corrigido em `docs/aceite.md:22-27`.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 22 | Auditoria opcional e não bloqueia `DONE` | atendido |
| 23 | Companion opcional com fallback | atendido |
| 24 | Relatório preserva histórico e tem evidência | atendido |
| 25 | Nenhuma remoção automática | atendido |
| 26 | Aceitação retorna a `FIX → REVIEW` | atendido |
| 27 | Áreas protegidas sinalizadas | atendido |
