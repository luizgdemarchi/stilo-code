# Stilo Code — orquestração em ondas e review multiagente

Status: aprovado para planejamento

## Problema

O Stilo Code persiste a fase do projeto e já define um review único, mas não
oferece uma regra explícita para decompor tarefas independentes nem para usar
vários revisores sem colisão de arquivos, disputa de commit ou relatório cheio
de duplicatas.

## Objetivo

Adicionar ao pipeline um protocolo portátil e opcional para:

1. descrever tarefas com arquivos e dependências;
2. agrupar tarefas seguras em ondas paralelas;
3. manter commits serializados pelo coordenador;
4. revisar mudanças com lentes independentes e sintetizar um único review.

## Não-objetivos

- Criar um servidor ou motor automático de despacho de agentes.
- Criar worktrees automaticamente.
- Adicionar dependências npm, MCP, CI ou hooks novos.
- Tornar o uso de subagentes obrigatório.
- Alterar o schema de `.stilo/state.json` ou as fases existentes.
- Substituir o review atual quando só houver um agente disponível.

## Requisitos

### R1 — Regra de orquestração

O ruleset deve instruir que cada tarefa planejada declare `ID`, descrição,
especialista, `Files:` com caminhos exatos e `Depends-on:`.

### R2 — Formação de ondas

Duas tarefas só podem compartilhar uma onda quando:

- nenhuma depende da outra, direta ou transitivamente; e
- os conjuntos de arquivos são totalmente disjuntos.

Tarefa sem marcação exata ou com incerteza real deve depender de todas as tarefas
anteriores e ser executada em série.

### R3 — Escrita e commits

Implementadores de uma onda editam e reportam, mas não fazem commit. O coordenador
espera todos, captura o `HEAD` atual antes de cada commit, commita em ordem e só
então libera a revisão. Revisores não escrevem no código.

Worktree isolada fica documentada como último recurso quando a separação por
arquivo não for possível.

### R4 — Review multiagente

Quando houver subagentes disponíveis, o coordenador pode despachar em paralelo
apenas as lentes aplicáveis: qualidade geral, segurança, tipagem e framework.
Cada lente deve devolver `arquivo:linha`, gravidade, alegação curta e cenário de
falha concreto.

### R5 — Síntese única

O coordenador deve deduplicar achados, descartar alegações sem cenário concreto
ou já resolvidas no diff, ordenar por gravidade e gravar o resultado no formato
existente de `.stilo/review-NN.md`.

### R6 — Degradação graciosa

Sem subagentes, o pipeline usa o `modules/revisor.md` atual como revisão única.
Nenhum erro ou pedido de instalação pode ser produzido por essa ausência.

### R7 — Portabilidade

As regras entram em `AGENTS.md` e em um módulo interno carregado somente em
`PLAN`, `EXECUTE` e `REVIEW`. Os adaptadores gerados devem continuar sincronizados
por `scripts/sync-adapters.js`.

## Critérios de aceite testáveis

1. Existe um módulo documentando R1–R3 e seu gatilho de carregamento.
2. `modules/revisor.md` documenta R4–R6 sem remover o formato atual de achados.
3. `AGENTS.md` referencia os módulos e mantém a política de fallback sem
   companions.
4. `npm test` passa sem dependências novas.
5. `node scripts/sync-adapters.js --check` passa.
6. Os seis adaptadores gerados contêm as novas regras.
7. Um teste textual falha se `Files:`/`Depends-on:` ou a regra de commits do
   coordenador forem removidos dos artefatos.
8. O diff não cria scheduler, worktree automática, alteração no schema/lógica de
   estado ou hook.

## Fora de escopo

- Implementação de fila, grafo de dependências ou limite de concorrência.
- Seleção automática de modelo por tarefa.
- Integração com Graphify, Obsidian, Context7, agent-browser ou Chrome DevTools.
- Instalação/configuração de ESLint ou Biome.
- Migração da memória global do usuário para memória por projeto.

## Decisões

- A unidade de paralelismo é o conjunto de arquivos, não o domínio ou a fase.
- Segurança vence velocidade: marcação ambígua degrada para série.
- Paralelismo de revisão é somente leitura.
- O Stilo continua sendo um pacote de regras e hooks best-effort, não um
  orquestrador de agentes.
