# Review 08 — stilo-code

Revisado: ciclo automático sem comandos, incluindo hooks, seleção de contexto,
manifestos, documentação e testes locais.
Contra: `spec.md` § 14, `plan.md` e
`docs/superpowers/plans/2026-09-18-automatico-sem-comandos-plan.md`.

## Verificações

- `npm.cmd test`: 72 testes, 71 passados e 1 smoke do OpenCode pendente por ser opt-in.
- `npm.cmd run validate-plan`: plano válido, 6 tarefas e 6 ondas.
- `node scripts/sync-adapters.js --check`: 6 adaptadores em dia.
- `git diff --check`: sem erros.
- `claude plugin validate .`: validação aprovada.

## Resumo

1 achado: 0 crítico, 1 alto, 0 médio, 0 baixo.

## Achados

### 1. A compactação corta o módulo obrigatório de revisão

- **Arquivo:** `hooks/stilo-instructions.js:309`
- **Gravidade:** alto
- **O que quebra:** em um projeto válido na fase `REVIEW`, `buildInjectedContext` seleciona os blocos iniciais até o orçamento e deixa de fora `# Módulo: Revisor` e seu checklist; o agente recebe o contexto automático sem as instruções obrigatórias para revisar o diff.
- **Como corrigir:** tornar todos os blocos do módulo retornado por `modulosDaFase(state)` prioritários na seleção e testar que `REVIEW` preserva o módulo completo.
- **Estado:** corrigido em `hooks/stilo-instructions.js:306-322` e coberto por `tests/context.test.js`.

## Critérios de aceite do ciclo

| # | Critério | Situação |
|---|---|---|
| 16 | Nenhum comando ou skill do Stilo é publicado | atendido |
| 17 | Instalação ativa o pipeline sem configuração posterior | pendente — evidência viva |
| 18 | Contexto automático é menor quando há blocos opcionais | atendido nos contextos compactáveis |
| 19 | Falha usa contexto completo | atendido |
| 20 | Estado legado continua legível sem override | atendido |
| 21 | Reviews e pendências anteriores permanecem rastreáveis | atendido após este arquivo |
