# Review 16 — stilo-code

Revisado: working tree sobre `ff4e216` — ciclo de seleção de modelo e esforço (T01–T03), sem commits.
Numeração: gravado localmente como review-12; renumerado para 16 ao integrar o ciclo remoto
de 2026-10-19, que já usava review-12 a review-15.
Contra: `spec.md` § 16, `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md`
Revisor: subagente independente (modelo solicitado `opus`, esforço solicitado `xhigh`; o
ambiente informou Opus 5.5; esforço não confirmado pela ferramenta). Coordenador conferiu
os achados 1 e 4 por medição antes de gravar.

Verificações: `npm.cmd test` 91 testes, 90 passados, 0 falhas, 1 pulado (smoke OpenCode
opt-in); `node scripts/sync-adapters.js --check` em dia; `validate-plan` 4 tarefas, 4 ondas;
`git diff --check` limpo; `claude plugin validate .` passou.

## Resumo

11 achados: 0 crítico, 1 alto, 3 médio, 7 baixo.

## Achados

### 1. Compactação passou a descartar seções de `AGENTS.md` que a base mantinha

- **Arquivo:** `hooks/stilo-instructions.js:13` (`CONTEXT_BUDGET`), `:162`, protegidos em `:318-331`
- **Gravidade:** alto
- **O que quebra:** proteger o módulo inteiro (~3,4 mil caracteres) com só +1.000 de
  orçamento tira blocos opcionais. Seções de `AGENTS.md` no contexto compactado, base →
  agora: PLAN/EXECUTE `1–8,10` → `1,2,3,6,7`; REVIEW `1,3,4,6` → `1,6`. Projeto em
  EXECUTE que mexe em UI deixa de receber § 5 (gatilho de `modules/frontend.md`); REVIEW
  perde § 3 (como gravar `state.json`). Contraria o requisito 9 ("preservando as regras
  existentes"). Nenhum teste cobre.
- **Como corrigir:** decisão de orçamento volta ao usuário com os números reais; depois,
  teste de que PLAN/EXECUTE compactados contêm `modules/frontend.md` e REVIEW contém
  `ISO 8601`.
- **Estado:** corrigido — `hooks/stilo-instructions.js:13` (`CONTEXT_BUDGET` 19.500) e `:330-331` (§ 3 e § 5 protegidos), por decisão do usuário; teste `compactação de <fase> preserva estado em disco e gatilhos de módulos` em `tests/context.test.js:101` (RED em PLAN/EXECUTE/REVIEW → GREEN)

### 2. Testes de T01 passam com a política invertida

- **Arquivo:** `tests/orchestration.test.js:59-76`
- **Gravidade:** médio
- **O que quebra:** módulo com "Edição mecânica… maior modelo e esforço alto",
  "Permissões: uma alteração curta é classificada como simples" ou "Sem subagentes,
  bloqueie" ainda passa: as regex só procuram palavras-chave e `.*` com flag `s` atravessa
  parágrafos (`/sem subagentes.*série/is` casa l.40 com l.48).
- **Como corrigir:** casar a cláusula exata de cada regra, sem flag `s`.
- **Estado:** corrigido — `tests/orchestration.test.js:60-102`: cláusulas exatas sem flag `s` e teste `cláusulas exatas rejeitam a política invertida` (4 inversões detectadas)

### 3. "Revisão crítica" fora do nível de esforço alto

- **Arquivo:** `modules/orquestracao.md:15`
- **Gravidade:** médio
- **O que quebra:** em REVIEW o coordenador delega revisão independente; o módulo não cita
  revisão em nenhum nível, e o requisito 2 manda esforço alto para "revisão crítica".
- **Como corrigir:** "- Arquitetura, segurança, revisão crítica ou incerteza alta: …" e teste.
- **Estado:** corrigido — `modules/orquestracao.md:16`; coberto por `tests/orchestration.test.js:66`

### 4. Margem de REVIEW de 352 caracteres: checkpoint real desliga a compactação

- **Arquivo:** `hooks/stilo-instructions.js:13`; `tests/context.test.js:34`, `tests/instructions.test.js:209`
- **Gravidade:** médio
- **O que quebra:** REVIEW com `.stilo/checkpoint.json` nos limites de `sanitiza`
  (`nextAction` 240, `pending` 300): protegidos 17.182 > 17.000 → injetado vira o completo,
  26.130 caracteres, acima do monitorado de 26.000. Testes usam estado sem checkpoint.
- **Como corrigir:** resolver junto com o achado 1, com teste de REVIEW com checkpoint
  máximo.
- **Estado:** corrigido — orçamento 19.500 (achado 1); teste `REVIEW com checkpoint no limite ainda compacta` em `tests/context.test.js:112` (RED → GREEN)

### 5. Sem critério para distinguir falha de ambiente de falha de capacidade

- **Arquivo:** `modules/orquestracao.md:42-44`
- **Gravidade:** baixo
- **O que quebra:** `EPERM` de sandbox ao gravar `.agents/rules/stilo.md` pode ser lido
  como falha de capacidade e gastar a única escalada.
- **Como corrigir:** uma linha de exemplos de ambiente e de capacidade.
- **Estado:** corrigido — `modules/orquestracao.md:47-49`; coberto por `tests/orchestration.test.js:80-81`

### 6. Delegações em FIX não recebem a política

- **Arquivo:** `modules/orquestracao.md:1`, `AGENTS.md:110`, `hooks/stilo-instructions.js:162`
- **Gravidade:** baixo
- **O que quebra:** correção delegada em FIX fica sem a regra de não alegar troca e sem
  limite de escalada; requisito 1 vale para toda delegação.
- **Como corrigir:** incluir FIX no gatilho e em `modulosDaFase`, ou registrar a exclusão
  como decisão do usuário.
- **Estado:** corrigido — por decisão do usuário, FIX incluído: `hooks/stilo-instructions.js:162`, `modules/orquestracao.md:1`, `AGENTS.md:110` e `:129`; testes `política integral no contexto de FIX` e `modulosDaFase: PLAN e FIX levam orquestração; SPEC não leva`

### 7. Requisito 5 ("não perguntar a cada tarefa") ausente do módulo

- **Arquivo:** `modules/orquestracao.md:9`
- **Gravidade:** baixo
- **O que quebra:** sem preferência explícita, nada impede o coordenador de perguntar o
  modelo de cada tarefa.
- **Como corrigir:** "Sem preferência explícita, não pergunte o modelo a cada tarefa."
- **Estado:** corrigido — `modules/orquestracao.md:10`; coberto por `tests/orchestration.test.js:63`

### 8. Status desatualizado no spec e no checkpoint

- **Arquivo:** `spec.md:3`; `.stilo/execution-checkpoint.md:78`, `:82`, `:107`
- **Gravidade:** baixo
- **O que quebra:** retomada após `/clear` lê "T02: não iniciada" e "usuário decide entre
  elevar orçamentos" e repete pergunta já respondida.
- **Como corrigir:** atualizar status e registrar T02/T03 concluídas e REVIEW/FIX.
- **Estado:** corrigido — `spec.md:3`; `.stilo/execution-checkpoint.md:78-80` marcado como histórico e seção nova em `:110`

### 9. `Files:` de T03 não lista arquivos alterados na execução

- **Arquivo:** `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md:117-121`
- **Gravidade:** baixo
- **O que quebra:** `hooks/stilo-diagnostics.js` e `tests/diagnostics.test.js` mudaram em
  T03 sem emenda; `validate-plan` monta ondas por esses caminhos.
- **Como corrigir:** acrescentar os dois caminhos e revalidar.
- **Estado:** corrigido — `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md:123-124`; `validate-plan` 4 tarefas, 4 ondas

### 10. Aceite vivo de 28–32 invisível ao diagnóstico; seção cita 28–34

- **Arquivo:** `docs/aceite.md:36-40`, `:53`; `hooks/stilo-diagnostics.js:217`
- **Gravidade:** baixo
- **O que quebra:** com tipo `local`, `diagnoseProject` deixa de apontar pendência quando os
  demais critérios vivos forem resolvidos, sem a seleção efetiva observada. A l.53 cita
  28–34, mas 33 e 34 não têm parte viva.
- **Como corrigir:** l.53 → 28–32; tipar 28–32 como `pendente`, mantendo o contrato
  verificado no Resultado.
- **Estado:** corrigido — `docs/aceite.md:36-40` com tipo `pendente` e `:52` citando 28–32

### 11. Seção nova dos READMEs ficou sob "Instalação"

- **Arquivo:** `README.md:123`, `README.en.md:126`
- **Gravidade:** baixo
- **O que quebra:** "### Modelo e esforço por tarefa" vira H3 de "## Instalação"/"## Install",
  longe da tabela de "## O pipeline" que explica.
- **Como corrigir:** mover para "## O pipeline" nos dois READMEs.
- **Estado:** corrigido — seção movida para "## O pipeline": `README.md:53`, `README.en.md:56`, com FIX incluído

## Verificação após FIX

`npm.cmd test`: 99 testes, 98 passados, 0 falhas, 1 pulado (smoke OpenCode opt-in).
`node scripts/sync-adapters.js --check`: em dia. `validate-plan`: 4 tarefas, 4 ondas.
`git diff --check`: limpo. Contexto compactado (caracteres): PLAN 19.187, EXECUTE 19.196,
REVIEW 19.441, FIX 19.280; SPEC, BRAINSTORM e DONE cabem inteiros.

## Critérios de aceite do spec

| # | Critério | Situação |
|---|---|---|
| 28 | Seleção considera a tarefa e usa modelo e esforço disponíveis | parcial — contrato local com testes fracos (achados 2, 3); seleção efetiva pendente |
| 29 | Risco prevalece sobre tamanho; instrução explícita prevalece | parcial — teste não protege a regra (achado 2) |
| 30 | Rastreável sem alegar aplicação não confirmada | atendido |
| 31 | Escalada com diagnóstico e limite; ambiente não escala | atendido no contrato (achado 5) |
| 32 | Fallback honesto sem controle ou sem subagentes | atendido no contrato |
| 33 | Política preservada nos adaptadores e na compactação | parcial — política preservada; regras existentes perdidas na compactação (achado 1) |
| 34 | Orquestração existente permanece válida | atendido — 91 testes, 90 passados, 1 pulado |
