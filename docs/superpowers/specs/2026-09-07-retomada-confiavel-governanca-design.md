# Stilo Code — Retomada confiável e governança de execução

> Status: aprovado para planejamento · Ciclo: 2026-09-07

## Problema

O review-04 encontrou riscos na retomada: estado ilegível pode parecer projeto novo, campos ausentes podem ser preenchidos por defaults destrutivos e comandos globais podem confirmar uma gravação que falhou. O pacote também não registra a tarefa interrompida, não diagnostica inconsistências, não valida conflitos do plano e não separa evidência local de validação viva.

## Objetivo

Corrigir os seis achados do review-04 e adicionar diagnóstico, checkpoint, validação de plano, evidências e ciclos de evolução, mantendo portabilidade, zero dependências de runtime e compatibilidade com projetos existentes.

## Não-objetivos

- Não criar scheduler, fila, grafo automático de despacho ou worktree automática.
- Não adicionar dependências npm, MCP obrigatório, hook novo ou servidor.
- Não alterar o schema semântico nem as sete fases do state.json; auxiliares são opcionais.
- Não declarar validação viva sem executar o agente correspondente.
- Não publicar, fazer push, instalar plugin ou modificar contas externas.

## Requisitos

### R1 — Estado seguro

A leitura distingue arquivo ausente, arquivo ilegível e objeto inválido. Estado inválido informa caminho, campos e erro, e nunca instrui criação de projeto novo. Validar version 1, project não vazio, phase em BRAINSTORM/SPEC/PLAN/EXECUTE/REVIEW/FIX/DONE, reviewRound inteiro não negativo e enxuto em auto/off/leve/pleno.

### R2 — Diagnóstico somente leitura

/stilo doctor relata projeto, state, checkpoint, ciclo, artefatos esperados, review e evidências. Não cria, corrige, remove ou sobrescreve arquivo.

### R3 — Checkpoint

O arquivo opcional .stilo/checkpoint.json contém version, cycle, phase, task, decisions, verified, pending, nextAction, gitHead opcional e updated. A gravação é atômica. /stilo mostra tarefa, próxima ação e pendências; checkpoint inválido é apenas diagnosticado.

### R4 — Comandos honestos

/stilo-off só confirma quando gravação e releitura confirmam o flag. /stilo só confirma religação quando a remoção terminou ou o flag já não existia. Falha informa que o estado não mudou.

### R5 — Plano verificável

node scripts/validate-plan.js plan.md valida ID, especialista, Files e Depends-on; rejeita IDs repetidos, dependências inexistentes, ciclos, arquivo compartilhado na mesma onda e marcação incerta sem serialização. Não executa agentes nem altera o plano.

### R6 — Evidências e ciclos

docs/aceite.md relaciona critério, tarefa, comando, tipo (local, viva ou pendente), resultado e review. DONE com requisito obrigatório pendente é apontado. Cada evolução usa .stilo/cycle.json e documentos próprios, preservando ciclos anteriores.

### R7 — Suporte documentado

Copilot CLI fica documentado como suporte manual enquanto não houver manifesto publicado. OpenCode mantém o contrato experimental, fallback por AGENTS.md e smoke test executável quando o binário estiver disponível.

### R8 — Verificação

Projetos com state válido mantêm a mesma linha de fase. A suíte passa com npm test, node scripts/sync-adapters.js --check, node scripts/validate-plan.js plan.md e git diff --check.

## Critérios de aceite

1. Ausente, ilegível e inválido produzem diagnósticos distintos e nunca reiniciam silenciosamente.
2. /stilo doctor é somente leitura e aponta caminho e correção.
3. Checkpoint válido aparece na retomada; inválido não é sobrescrito.
4. Falha simulada em setOff não gera confirmação enganosa.
5. O validador detecta dependência inexistente, ciclo e colisão de arquivos e aceita plano válido.
6. A matriz de evidências separa local, viva e pendente.
7. Novo ciclo preserva documentos anteriores e é reportado.
8. Copilot é manual; OpenCode tem fallback e smoke test condicionado.
9. Adaptadores continuam sincronizados por AGENTS.md.
10. Os quatro comandos de R8 passam sem dependência nova.

## Matriz dos achados

| Achado | Correção | Tarefa |
|---|---|---|
| State ilegível confundido com ausência | status explícito e bloqueio | T2 |
| phase ausente reinicia em BRAINSTORM | validação de schema | T2 |
| setOff confirma falha | gravação e releitura verificadas | T3 |
| Copilot sem manifesto | suporte manual documentado | T6 |
| OpenCode só testado por objeto | fallback e smoke test | T6 |
| DONE excede evidência | matriz e doctor | T5/T8 |

