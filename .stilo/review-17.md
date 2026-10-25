# Review 17 — stilo-code

Numeração: gravado localmente como review-13; renumerado para 17 na integração com o remoto.
Revisado: working tree sobre `ff4e216` após o FIX do `review-16` (seleção de modelo e esforço).
Contra: `spec.md` § 16, `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md`
Revisor: subagente independente de rodada de correção (modelo solicitado `opus`; o ambiente
informou Opus 5.5; esforço não informado pela ferramenta).

Verificações do revisor: `npm.cmd test` 99 testes, 98 passados, 0 falhas, 1 pulado;
`sync-adapters --check` em dia; `validate-plan` 4 tarefas, 4 ondas; `git diff --check` limpo.
Contexto compactado (caracteres): PLAN 19.187, EXECUTE 19.196, REVIEW 19.441, FIX 19.280;
REVIEW completo 25.839 (monitorado 26.000). Com checkpoint no pior caso, REVIEW protege
19.303 de 19.500 e ainda compacta.

Achados do `review-16`: os 11 verificados como corrigidos.

## Resumo

3 achados: 0 crítico, 0 alto, 0 médio, 3 baixo.

## Achados

### 1. REVIEW compactado perde § 1 e § 4 de `AGENTS.md`, que a base mantinha

- **Arquivo:** `hooks/stilo-instructions.js:13`, `:323-334`; `tests/context.test.js:101-109`
- **Gravidade:** baixo
- **O que quebra:** REVIEW nominal injeta as seções 3, 5, 6, 7 e 8; a base tinha 1, 3, 4 e
  6. Saem a tabela de fases (§ 1) e o aviso de divergência de modelo (§ 4).
- **Como corrigir:** registrar como residual aceito ou fixar as seções esperadas num teste.
- **Estado:** descartado — consequência aceita da decisão do usuário (orçamento 19.500 com
  § 3/§ 5 protegidos). Em REVIEW, o critério de `DONE` vem de `modules/revisor.md`, e o
  bloco de estado traz fase, próxima ação e modelo alvo; o fallback completo continua
  disponível quando a seleção falha.

### 2. Teste de checkpoint não usava o pior caso

- **Arquivo:** `tests/context.test.js:112-131`
- **Gravidade:** baixo
- **O que quebra:** com `project` e `task` no limite de `sanitiza`, REVIEW protege 19.303
  de 19.500; o teste com `project: 'x'` só falharia após ~430 caracteres de crescimento.
- **Como corrigir:** `project` e `task` com 200 caracteres no teste.
- **Estado:** corrigido — `tests/context.test.js:117` e `:124`; `node --test tests/context.test.js` 18/18.

### 3. Status de retomada desatualizado após voltar a REVIEW

- **Arquivo:** `.stilo/execution-checkpoint.md:85-86`; `spec.md:3`; plano `:7` e `:68`
- **Gravidade:** baixo
- **O que quebra:** checkpoint e spec diziam `FIX`; retomada após `/clear` tentaria
  corrigir o que já estava corrigido. Plano citava só PLAN/EXECUTE/REVIEW em duas linhas.
- **Como corrigir:** atualizar checkpoint, status do spec e as duas linhas do plano.
- **Estado:** corrigido — `.stilo/execution-checkpoint.md:120-129`, `spec.md:3`, plano `:7` e `:68`.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 28 | Seleção considera a tarefa e usa modelo e esforço disponíveis | atendido no contrato local; seleção efetiva pendente (viva) |
| 29 | Risco prevalece sobre tamanho; instrução explícita prevalece | atendido no contrato local; seleção efetiva pendente (viva) |
| 30 | Rastreável sem alegar aplicação não confirmada | atendido no contrato local; seleção efetiva pendente (viva) |
| 31 | Escalada com diagnóstico e limite; ambiente não escala | atendido no contrato local; seleção efetiva pendente (viva) |
| 32 | Fallback honesto sem controle ou sem subagentes | atendido no contrato local; seleção efetiva pendente (viva) |
| 33 | Política preservada nos adaptadores e na compactação | atendido |
| 34 | Orquestração existente permanece válida | atendido — 99 testes, 98 passados, 1 pulado |

Nenhum achado `crítico` nem `alto`. `DONE` do projeto segue bloqueado só pelas evidências
vivas pendentes em `docs/aceite.md`.
