<!-- Aprovação: usuário confirmou spec e plano em 2026-10-19. Status históricos abaixo não revogam esta aprovação. Execução serial sem commits/publicação. -->

# Stilo Code — Especificação

> Ciclo atual (2026-10-19): confiabilidade do agente e preparação do GitHub CLI,
> detalhada no § 17. Spec e plano aprovados; implementação local verificada, aceites vivos pendentes.
> Ciclo de seleção de modelo e esforço (§ 16): T01–T03 implementadas; review-16 corrigido;
> review-17 sem achado crítico, alto ou médio.
> Histórico: rodada 11 limpa; critérios vivos anteriores continuam pendentes.

## 1. Problema

O workflow de projeto do usuário (subpasta por projeto → brainstorm → spec → plano →
execução → review → loop de correção, com modelo diferente por etapa) vivia apenas como
memória do Claude Code. Isso tem três falhas:

1. **Some.** A config de plugins foi resetada e o workflow parou de valer.
2. **Não é portátil.** Só existia dentro de um agente, numa máquina.
3. **Não sobrevive ao `/clear`.** Depois de limpar o contexto, o agente esquece em que
   fase o projeto está e volta a improvisar.

## 2. Objetivo

Um pacote instalável, público e multi-agente que impõe o pipeline como uma **máquina de
estados persistida em disco** — de modo que qualquer agente, em qualquer máquina, a
qualquer momento (inclusive logo após um `/clear`) saiba em que fase o projeto está e o
que fazer a seguir.

### Não-objetivos (v1)

- Não depende de nenhum outro pacote para funcionar. O pipeline é **autocontido por
  padrão**: cada fase traz suas próprias instruções completas. Companions são usados
  quando presentes e nunca exigidos (§ 4.1).
- Não escreve código pelo usuário nem opina sobre estilo de código.
- Não gerencia git, CI, deploy ou versionamento.
- Não tem níveis de intensidade (lite/full/ultra). O pipeline é fixo.

## 3. Identidade

| Item | Valor |
|---|---|
| Nome | Stilo Code |
| Repositório | `stilo-code` |
| Plugin / marketplace | `stilo-code` |
| Skill principal | `stilo` → comando `/stilo` |
| Skill de desligar | `stilo-off` → comando `/stilo-off` |
| Licença | MIT |
| Idioma do repo | **Português (pt-BR)**, com `README.en.md` como tradução secundária |

Idioma: todo o conteúdo — `README.md`, `AGENTS.md`, `SKILL.md`, módulos e comentários de
hook — é escrito em português. O ruleset instrui o agente a **responder no idioma em que
o usuário escrever**, então um usuário anglófono continua sendo atendido em inglês; só a
fonte é pt-BR. Um `README.en.md` traduzido cobre a descoberta no GitHub.

## 4. O pipeline

```
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE
```

**Regra 0 — uma pasta por projeto.** Todo projeto novo ganha sua própria subpasta no
workspace. Nunca misturar projetos na raiz.

**Regra 1 — nunca pular para a implementação.** Um pedido pequeno ainda passa pelo
pipeline, só que rápido. Só se pula com autorização explícita do usuário para aquela
tarefa.

| # | Fase | Modelo | Artefato durável | Critério de saída |
|---|---|---|---|---|
| 1 | `BRAINSTORM` | profundo | *(nenhum — só conversa)* | Usuário confirma que o problema e o escopo estão claros |
| 2 | `SPEC` | profundo | `spec.md` | `spec.md` escrito e aprovado pelo usuário |
| 3 | `PLAN` | profundo | `plan.md` | `plan.md` escrito, com passos verificáveis |
| 4 | `EXECUTE` | **rápido** | o código | Todos os passos do plano feitos e verificados |
| 5 | `REVIEW` | profundo | `.stilo/review-NN.md` | Review escrito em arquivo |
| 6 | `FIX` | profundo | código corrigido | Todos os achados do review resolvidos |
| — | *(loop)* | | | `REVIEW` → `FIX` → `REVIEW` até zero achados |
| 7 | `DONE` | — | — | Review limpo |

### Conteúdo de cada fase

O pacote traz instruções concretas para cada fase (autocontido):

- **BRAINSTORM** — entender antes de propor. Fazer perguntas sobre problema real,
  usuários, restrições e critério de sucesso. Uma decisão por vez, com recomendação.
  Não produzir arquivo; termina quando o usuário confirma o escopo.
- **SPEC** — `spec.md` com: problema, objetivo, não-objetivos, requisitos, critérios de
  aceite testáveis, fora de escopo. O que, não como.
- **PLAN** — `plan.md` com passos numerados, cada um pequeno o bastante para ser
  verificado sozinho, com arquivos afetados e como confirmar que funcionou. O como.
- **EXECUTE** — seguir o plano na ordem. Não redesenhar durante a execução: se o plano
  estiver errado, parar e voltar para `PLAN`.
- **REVIEW** — revisar o diff contra o `spec.md` e o `plan.md`. Achados numerados, cada
  um com arquivo, linha, gravidade e o porquê. Sempre gravado em `.stilo/review-NN.md`.
- **FIX** — resolver cada achado do review mais recente e marcar seu estado. Depois
  voltar para `REVIEW`.

### 4.1 Companions portáteis

O Stilo Code cita companions, mas **só os que instalam em quase todos os agentes**. Um
companion exclusivo de um único agente cria um pipeline que quebra ao trocar de
ferramenta — exatamente o problema que este pacote existe para resolver.

**Critério de inclusão** — para ser citado, o pacote precisa de uma destas duas coisas:

1. ser um **servidor MCP** (protocolo aberto, suportado por Claude Code, Codex, OpenCode,
   Cursor, Windsurf, Gemini CLI, Copilot, Cline…); ou
2. **enviar adaptadores multi-agente** no próprio repo (`AGENTS.md`, `.opencode/`,
   `.codex-plugin/`, `.cursor/`, `gemini-extension.json` etc.).

Pacotes que só trazem `.claude-plugin/` **não são citados em lugar nenhum do repo**.

| Companion | Como qualifica | Onde o pipeline aproveita |
|---|---|---|
| `superpowers` | adaptadores para Codex, Cursor, OpenCode, Devin, Hermes, Kimi, Pi, Gemini | `BRAINSTORM`, `PLAN`, `EXECUTE` |
| `ponytail` | adaptadores para ~20 agentes | `EXECUTE`, `FIX` — mantém o diff mínimo; auditoria opcional no fim |
| `context7` | MCP (HTTP) | `SPEC`, `PLAN` — docs atualizadas de biblioteca |
| `playwright` | MCP (stdio) | `EXECUTE`, `REVIEW` — verificar em navegador de verdade |

**Degradação graciosa é obrigatória.** Toda fase detecta o companion e cai nas próprias
instruções quando ele não existe — sem erro, sem aviso, sem pedir instalação. O critério
de aceite nº 10 exige que o pipeline complete inteiro com zero companions instalados.

### 4.2 Módulos internos

O que não passa no critério de § 4.1 vira **módulo interno** do Stilo Code — versão
própria, mais simples, sem dependência externa. Módulos não são comandos: o ruleset
carrega o módulo relevante quando a fase pede, mantendo o conjunto de comandos mínimo.

| Módulo | Substitui | Carregado em | O que faz |
|---|---|---|---|
| `modules/revisor.md` | `code-review` | `REVIEW` | Checklist de revisão: diff contra `spec.md` e `plan.md`, achados numerados com arquivo, linha, gravidade e justificativa |
| `modules/frontend.md` | `frontend-design` | `EXECUTE`, `REVIEW` — só quando o diff toca UI | Regras de layout, hierarquia, contraste, estados (vazio/carregando/erro), acessibilidade e responsividade |
| `modules/autoria-skill.md` | `skill-creator` | `PLAN`, `EXECUTE` — só quando o projeto **é** uma skill/plugin | Estrutura de `SKILL.md`, como escrever `description` que dispara na hora certa, adaptadores multi-agente |
| `modules/enxuto.md` | *(inspirado no caveman)* | todas as fases | Compressão de tokens de saída (§ 4.3) |

Regra: um módulo só existe quando a alternativa portátil não existe. Se algum desses
ganhar uma versão multi-agente de verdade no futuro, o módulo interno é aposentado em
favor dela.

### 4.3 Modo Enxuto — compressão de tokens

Compressão da **saída** do agente: mesmo conteúdo técnico, menos token. Sem proxy, sem
runtime, sem interceptar o que o agente lê — só regra de estilo, o que mantém o pacote
portátil para qualquer agente.

**O que corta:** enchimento (`basicamente`, `na verdade`, `simplesmente`), cortesia
(`claro!`, `fico feliz em ajudar`), hedging, narração de tool call (`agora vou ler o
arquivo…`), tabelas e emoji decorativos, despejo de log longo — citar só a linha
decisiva.

**O que nunca toca — travas de segurança:**

- Negações (`não`, `nunca`, `só`, `exceto`). Inverter sentido é pior que qualquer token
  economizado.
- Números, unidades, versões.
- Blocos de código, nomes de símbolo, API, comando.
- Mensagens de erro — sempre citadas literalmente.

**Duas regras que a maioria das tentativas de compressão erra:**

1. **Nunca adicionar palavra para parecer comprimido.** Compressão só encurta; estilo
   nunca aumenta a saída.
2. **Se a forma "comprimida" não for realmente menor, use a normal.** Abreviações
   (`cfg`, `impl`, `req`) e setas (`→`) são divididas pelo tokenizer no mesmo número de
   tokens da palavra inteira: economia zero, leitura pior.

**Idioma:** responder sempre no idioma em que o usuário escreveu. Comprime-se o estilo,
nunca o idioma.

**Nível por fase** — reaproveita a máquina de estados, sem mecanismo novo:

| Fase | Nível | Porquê |
|---|---|---|
| `BRAINSTORM` | `off` | Explorar problema precisa de nuance e pergunta bem formulada |
| `SPEC`, `PLAN` | `leve` | Documento tem que ser legível depois; corta enchimento, mantém frase inteira |
| `EXECUTE`, `REVIEW`, `FIX` | `pleno` | Fases mecânicas, onde narração e cortesia são puro custo |

**Escape de clareza:** se comprimir gerar ambiguidade, explicação de conceito novo,
aviso de segurança ou ação irreversível — escrever normal. Clareza ganha de token.

`REVIEW` é deliberadamente 100% autocontido: as ferramentas de review disponíveis hoje
são todas presas a um único agente, então o Stilo Code traz o seu próprio.

## 5. Estado

Arquivo por projeto: `<projeto>/.stilo/state.json`

```json
{
  "version": 1,
  "project": "meu-app",
  "phase": "PLAN",
  "reviewRound": 0,
  "enxuto": "auto",
  "updated": "2026-08-21T20:40:00Z"
}
```

`enxuto` aceita `auto` (padrão — nível derivado da fase), `off`, `leve` ou `pleno`.

- **Quem escreve:** o agente, ao concluir uma fase. Só o agente sabe que uma fase acabou.
- **Quem lê:** os hooks, para injetar o estado no contexto.
- **Localização:** os hooks procuram `.stilo/state.json` subindo a partir do `cwd`
  (como o git faz com `.git`). Se não achar, varrem **um nível** abaixo do `cwd` — que
  cobre o layout `<workspace>/<projeto>/.stilo/`. Se acharem mais de um, listam todos e
  deixam o agente escolher pelo contexto da conversa.
- **Sem estado encontrado:** o agente é instruído a, ao iniciar um projeto novo, criar a
  subpasta e começar em `BRAINSTORM`.

Desligar é global, não por projeto: arquivo-flag em `~/.stilo/off`.

## 6. Modelo por fase

Nenhum hook consegue trocar o modelo da sessão principal. Portanto o pacote **declara o
alvo** e o agente confere contra o modelo em que está rodando, avisando o usuário só
quando houver divergência.

| Agente | Fase profunda | Fase rápida (`EXECUTE`) |
|---|---|---|
| **Claude Code** | Opus 5 @ effort `xhigh` (`/model opus`) | Sonnet 5 @ effort `medium` (`/model sonnet`) — ou subagente `model: sonnet`, automático |
| **Codex** | reasoning effort `high` (`/model`) | reasoning effort `medium` |
| **Demais agentes** | o modelo mais capaz disponível | um modelo mais rápido/barato |

No Claude Code, `EXECUTE` roda preferencialmente num **subagente com `model: sonnet`**:
é a única troca de modelo que acontece sem ação do usuário. O hook `SubagentStart`
injeta o estado e o plano nesse subagente.

Para Codex são usados níveis de reasoning effort, não nomes de modelo, para a instrução
não envelhecer a cada release.

## 7. Comandos

Conjunto mínimo, por decisão de escopo.

| Comando | Efeito |
|---|---|
| `/stilo` | Inicia um projeto novo (cria a subpasta, entra em `BRAINSTORM`) ou retoma o projeto ativo, reportando fase atual e próxima ação. Remove `~/.stilo/off` se existir. |
| `/stilo-off` | Cria `~/.stilo/off`. Os hooks param de injetar até o próximo `/stilo`. |

O avanço de fase é feito pelo agente ao concluir uma fase — não há comando manual.

O Modo Enxuto é controlado por **argumento**, não por comando novo:
`/stilo enxuto off|leve|pleno` grava `enxuto` no `state.json` e passa a sobrepor o nível
padrão da fase; `/stilo enxuto auto` volta ao padrão por fase (§ 4.3).

## 8. Hooks

Dois manifestos: `hooks/claude-codex-hooks.json` (Claude Code + Codex, mesmos nomes de
evento) e `hooks/qoder-hooks.json`.

| Evento | Matcher | Injeta |
|---|---|---|
| `SessionStart` | `startup\|resume\|clear\|compact` | Ruleset completo + estado atual (fase, próxima ação, modelo alvo) |
| `UserPromptSubmit` | — | Linha curta de estado (`fase=PLAN · próxima: escrever plan.md`) + trata `/stilo` e `/stilo-off` |
| `SubagentStart` | — | Ruleset + estado, para o subagente de `EXECUTE` |

O matcher `clear|compact` no `SessionStart` é o que faz a regra do `/clear` funcionar:
logo depois de limpar o contexto, o agente relê o estado em disco e sabe exatamente onde
parou.

Runtime: Node.js (mesmo requisito do ecossistema de plugins). Se `node` não estiver no
PATH, os hooks falham silenciosamente e as skills continuam funcionando manualmente.

O manifesto compartilhado usa `CLAUDE_PLUGIN_ROOT`; no Codex, o carregador fornece esse
nome como alias compatível para a raiz do plugin. A saída específica do Codex continua
identificada por `PLUGIN_DATA`.

## 9. Aviso de `/clear`

O agente avisa proativamente quando é seguro limpar o contexto.

- **Seguro** — logo após um artefato durável ser gravado: `spec.md`, `plan.md`, código
  executado e verificado, `.stilo/review-NN.md`, correções aplicadas. Nesses pontos o
  estado está todo em disco.
- **Não seguro** — no meio de `BRAINSTORM`, `PLAN` ou `EXECUTE`, quando decisões só
  existem na conversa.

Mensagem: uma linha curta, ex. `✅ Ponto seguro para /clear`.

## 10. Suporte por agente

**Camada 1 — só um arquivo** (`AGENTS.md` na raiz ou arquivo de regra próprio; sem hooks,
sem estado automático; suporte manual):
GitHub Copilot CLI, Cursor, Windsurf, Cline, Kiro, Gemini CLI / Antigravity e Pi.

**Camada 2 — plugin com hooks** (estado injetado automaticamente, incluindo pós-`/clear`):
Claude Code, Codex e Qoder.

**OpenCode — plugin experimental com fallback:** mantém
`experimental.chat.system.transform` e registra comandos e skills. Se a versão instalada
não expuser o hook experimental, o fallback suportado é copiar `AGENTS.md` para a raiz do
projeto; `config.instructions` não é considerado fallback no OpenCode V2. A compatibilidade
viva depende do smoke test da CLI.

## 11. Estrutura do repositório

```
stilo-code/
├─ AGENTS.md                     ← fonte única do ruleset
├─ README.md · README.pt-BR.md · LICENSE · .gitignore
├─ package.json
├─ .claude-plugin/{plugin.json, marketplace.json}
├─ .codex-plugin/plugin.json
├─ skills/
│  ├─ stilo/SKILL.md
│  └─ stilo-off/SKILL.md
├─ modules/                     ← carregados por fase, não são comandos
│  ├─ revisor.md · frontend.md
│  └─ autoria-skill.md · enxuto.md
├─ hooks/
│  ├─ claude-codex-hooks.json · qoder-hooks.json
│  ├─ stilo-activate.js         ← SessionStart
│  ├─ stilo-prompt.js           ← UserPromptSubmit
│  ├─ stilo-subagent.js         ← SubagentStart
│  ├─ stilo-state.js            ← lib: achar/ler/escrever state.json
│  └─ stilo-instructions.js     ← lib: montar o texto injetado
├─ commands/{stilo.toml, stilo-off.toml}
├─ scripts/sync-adapters.js     ← gera os arquivos de regra a partir do AGENTS.md
├─ .cursor/rules/stilo.mdc · .clinerules/stilo.md · .windsurf/rules/stilo.md
├─ .kiro/steering/stilo.md · .qoder/rules/stilo.md · .agents/rules/stilo.md
├─ .opencode/{command/, plugins/stilo.mjs}
├─ opencode.json · gemini-extension.json
└─ tests/
```

`AGENTS.md` é a **fonte única de verdade** do ruleset. Os arquivos de regra por agente
são gerados por `scripts/sync-adapters.js`, e um teste falha se estiverem dessincronizados
— nove cópias manuais do mesmo texto divergem em uma semana.

## 12. Critérios de aceite

1. `/plugin marketplace add <user>/stilo-code` + `/plugin install stilo-code@stilo-code`
   instala no Claude Code sem erro.
2. Numa sessão nova em pasta sem `.stilo/`, pedir um projeto novo faz o agente criar a
   subpasta e entrar em `BRAINSTORM` — não em implementação.
3. Com `state.json` em `phase: "PLAN"`, uma sessão nova (`SessionStart`) reporta
   corretamente a fase atual e a próxima ação **sem** o usuário dizer nada.
4. Rodar `/clear` no meio do projeto e mandar qualquer mensagem: o agente retoma na fase
   certa, lendo o disco.
5. Ao terminar `SPEC`, o agente grava `spec.md`, atualiza `state.json` para `PLAN` e
   emite o aviso de `/clear` seguro.
6. `/stilo-off` faz os hooks pararem de injetar; `/stilo` religa.
7. Os hooks não quebram a sessão quando `node` não está no PATH.
8. `node scripts/sync-adapters.js --check` passa (adaptadores em dia com `AGENTS.md`).
9. O `AGENTS.md` sozinho, colado num agente sem plugin, é suficiente para conduzir o
   pipeline manualmente.
10. O pipeline completa de ponta a ponta com **zero companions instalados**, e nenhum
    arquivo do repo cita pacote exclusivo de um único agente (§ 4.1).
11. Os módulos internos carregam só na fase certa: `frontend.md` não entra num projeto
    de CLI, `autoria-skill.md` não entra num projeto que não é skill (§ 4.2).
12. Modo Enxuto: em `EXECUTE`, a resposta não tem narração de tool call nem cortesia; e
    negações, números, blocos de código e mensagens de erro saem intactos (§ 4.3).
13. `/stilo enxuto pleno` durante `BRAINSTORM` sobrepõe o padrão da fase e persiste no
    `state.json` entre sessões.
14. Todo texto publicado no repo está em pt-BR, e o agente responde em inglês quando o
    usuário escreve em inglês (§ 3).
15. Copilot CLI aparece somente como suporte manual; OpenCode mantém o hook experimental,
    documenta `AGENTS.md` na raiz do projeto como fallback manual e tem smoke test
    condicionado à presença da CLI.

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Detecção do projeto erra com vários projetos no workspace | Subida a partir do `cwd` primeiro; varredura de um nível só como fallback; ambiguidade é reportada, não adivinhada |
| Nomes/efforts de modelo envelhecem | Codex e genéricos usam tiers, não versões; só Claude Code cita nomes |
| Agente esquece de atualizar `state.json` | Estado reinjetado a cada `UserPromptSubmit`, com a próxima ação explícita |
| Ruleset diverge entre os 9 adaptadores | `sync-adapters.js` + teste de `--check` no CI |
| Companion citado perde a portabilidade ou é abandonado | Critério de § 4.1 revalidado a cada release; degradação graciosa mantém o pipeline funcionando sem ele |

## 14. Emenda do ciclo automático sem comandos

Esta emenda substitui, para a próxima versão do pacote, as superfícies de comando,
skills e overrides manuais descritas nas seções 3, 7, 8, 11 e nos critérios 6, 12 e 13.
Reviews anteriores permanecem históricos e não são sobrescritos.

### Objetivo

Depois da instalação, o Stilo Code funciona automaticamente. O usuário conversa
normalmente; os hooks detectam o projeto, injetam o estado e aplicam o pipeline sem
comandos do Stilo, skills invocáveis ou configuração de tokens.

### Requisitos

1. O pacote não publica comandos nem skills do Stilo. Permanecem apenas os hooks,
   adaptadores de regras e o `AGENTS.md` manual para agentes sem hooks.
2. `UserPromptSubmit` não interpreta comandos: toda mensagem recebe a linha de estado;
   Qoder recebe o contexto automático completo/compactado pelo mesmo caminho.
3. `/stilo-off`, overrides de `enxuto`, `doctor`, `checkpoint` e `ciclo` deixam de ser
   superfícies públicas. Diagnóstico, checkpoints e ciclos continuam como dados internos
   opcionais lidos automaticamente quando existirem.
4. O nível de saída é sempre derivado da fase. Um campo `enxuto` legado pode continuar
   no `state.json` sem invalidar o arquivo, mas não altera o nível calculado.
5. O contexto automático é compacto por prioridade e preserva regras de segurança,
   estado, fase, próxima ação, comandos de shell citados nas regras, negações, números,
   versões e mensagens de erro. Se a seleção falhar, o hook injeta o contexto completo.
6. A compactação não usa rede, chave, modelo externo, transcript persistido ou opção de
   configuração do usuário.
7. `buildFullContext` continua disponível para compatibilidade interna; hooks automáticos
   usam a nova seleção compacta. Manifestos de hooks não mudam de formato.
8. O estado, reviews e checkpoints existentes não são apagados. Um novo ciclo registra
   seu `baseReview` e preserva a evidência anterior.

### Critérios de aceite adicionados/substituídos

| # | Critério | Verificação |
|---|---|---|
| 16 | Nenhum comando ou skill do Stilo é publicado | inventário de manifestos, diretórios e testes |
| 17 | Instalação ativa o pipeline sem configuração posterior | hooks em sessão nova e mensagem comum |
| 18 | Contexto automático é menor que o completo quando há blocos opcionais | teste de tamanho por fase |
| 19 | Contexto completo é usado quando fonte, estado ou seleção falha | testes de fallback byte a byte |
| 20 | Estado legado com `enxuto` continua legível, sem override manual | testes de validação e nível por fase |
| 21 | Reviews e pendências anteriores permanecem rastreáveis | `cycle.json`, `docs/aceite.md` e novo review |

Os critérios vivos antigos sobre comandos e override de `enxuto` deixam de ser
aplicáveis; os critérios vivos de criação natural, `/clear`, transição de fase e idioma
continuam pendentes até serem observados em uma sessão real.

## 15. Emenda do ciclo de auditoria opcional de simplificação

### Problema

Depois de um `REVIEW` limpo, ainda pode haver código, arquivo, dependência ou
configuração sem uso. O pipeline precisa oferecer uma última inspeção de simplificação
sem transformar uma heurística em apagamento automático.

### Objetivo

Permitir uma auditoria final opcional, baseada no `ponytail-audit` quando disponível, que
produza recomendações de remoção com evidência suficiente para decisão humana.

### Não-objetivos

- apagar, mover ou editar arquivos automaticamente;
- bloquear `DONE` quando a auditoria não for executada ou quando houver sugestões abertas;
- afirmar que uma remoção é segura apenas porque um símbolo não apareceu numa busca;
- criar um analisador, dependência ou comando próprio do Stilo Code.

### Requisitos

1. Na transição para `DONE`, depois de um `REVIEW/FIX` limpo, o agente oferece a auditoria;
   o usuário pode executá-la ou seguir sem relatório.
2. O escopo padrão é o repositório inteiro, com atenção especial aos arquivos alterados
   no ciclo atual.
3. A auditoria usa `ponytail-audit` quando o companion está disponível e segue uma
   instrução interna equivalente quando ele não está; a ausência do companion não gera
   erro nem pedido de instalação.
4. A saída é um relatório durável `.stilo/cleanup-NN.md`, sem sobrescrever relatórios
   anteriores.
5. Cada sugestão informa arquivo e linha (quando houver), evidência observada, risco,
   remoção mínima proposta e verificação necessária.
6. Sugestões são classificadas como `baixo risco`, `requer confirmação` ou `não
   recomendado`; referências dinâmicas, API pública, manifestos, migrações, fixtures e
   arquivos de histórico nunca são tratados como remoção automática.
7. Uma sugestão aceita pelo usuário volta ao fluxo normal `FIX → REVIEW`; a auditoria não
   edita código por conta própria.
8. A auditoria não altera `state.json`, reviews, checkpoints, ciclos ou evidências
   existentes, exceto pela criação do próprio relatório.

### Critérios de aceite

| # | Critério | Verificação |
|---|---|---|
| 22 | Auditoria é explicitamente opcional e não bloqueia `DONE` | instruções, teste textual e documentação |
| 23 | Companion disponível é usado sem dependência obrigatória | teste com e sem `ponytail-audit` |
| 24 | Relatório preserva histórico e contém evidência acionável | teste de formato e relatório de exemplo |
| 25 | Nenhuma execução automática remove ou edita código | teste textual e revisão do fluxo |
| 26 | Sugestão aceita retorna a `FIX → REVIEW` | instrução de transição e teste de contrato |
| 27 | Casos de referências dinâmicas e artefatos protegidos são sinalizados | casos de teste/documentação |

## 16. Seleção automática de modelo e esforço por tarefa

### Problema e objetivo

A orquestração distribui tarefas, mas não define como escolher modelo e esforço para
cada subagente. O coordenador deve fazer essa escolha automaticamente, reservando
capacidade maior para tarefas que precisam dela e usando modelos leves em trabalho
simples. O usuário não precisa escolher um modelo a cada delegação.

### Requisitos

1. Antes de delegar, avaliar complexidade, risco, ambiguidade, contexto necessário e
   possibilidade de verificar o resultado. A fase é um sinal, não o único critério.
2. Escolher o modelo menos exigente adequado entre os disponíveis na ferramenta atual,
   com esforço baixo para tarefas simples, médio para lógica relevante e alto para
   arquitetura, segurança, revisão crítica ou incerteza elevada. Modelo e esforço são
   escolhas separadas; usar somente combinações suportadas.
3. Uma tarefa pequena envolvendo autenticação, permissões, dados ou mudanças destrutivas
   não é classificada como simples apenas pelo número de arquivos ou linhas.
4. Registrar por tarefa a classificação, modelo e esforço solicitados e uma justificativa
   curta. Não afirmar que a seleção foi aplicada quando a ferramenta não a confirma.
5. Respeitar escolhas explícitas do usuário. Na ausência delas, não perguntar qual modelo
   usar a cada tarefa e não fixar nomes de modelos universais para todos os agentes.
6. Se a validação falhar, diagnosticar a causa antes de repetir. Quando houver limitação
   de capacidade, elevar modelo ou esforço e transmitir a evidência da falha. Falhas de
   ambiente não provocam escalada de modelo por si só. Após uma escalada sem sucesso,
   o coordenador reassume e registra o impedimento, sem repetição automática ilimitada.
7. Se não houver subagentes, executar em série. Se não houver seleção de modelo ou
   esforço, usar o recurso disponível e registrar a limitação sem fingir troca, exigir
   instalação ou bloquear o trabalho por esse motivo.
8. A seleção não altera as regras de ondas, dependências, separação de arquivos,
   verificação, commits pelo coordenador e revisão. Não cria subagentes quando o custo
   de delegação não se justifica por uma tarefa concreta e delimitada.
9. A política deve chegar aos adaptadores e ao contexto automático relevante, inclusive
   quando compactado, preservando as regras existentes e seu fallback.

### Não-objetivos e fora de escopo

- Criar um roteador externo, contratar provedores ou adicionar dependências de runtime.
- Trocar automaticamente o modelo da sessão principal.
- Garantir redução de custo ou latência sem medição real.
- Resolver ou apagar pendências de validação viva dos ciclos anteriores.

### Critérios de aceite

| # | Critério | Verificação |
|---|---|---|
| 28 | Seleção automática considera a tarefa e usa modelo e esforço disponíveis | cenários de classificação: edição mecânica, lógica comum, arquitetura e segurança |
| 29 | Risco prevalece sobre tamanho e instrução explícita prevalece sobre seleção automática | cenários de alteração curta em permissões e modelo imposto pelo usuário |
| 30 | Seleção e justificativa são rastreáveis sem alegar aplicação não confirmada | validar exemplos de contrato de tarefa e relatório de execução |
| 31 | Escalada tem diagnóstico e limite; erro de ambiente não muda modelo por si só | cenários de falha de capacidade, falha repetida e indisponibilidade de ambiente |
| 32 | Ausência de controle ou subagentes tem fallback honesto | cenários sem subagentes, sem escolha de modelo e sem escolha de esforço |
| 33 | Política é preservada nos adaptadores e na compactação aplicável | testes de instruções/contexto e verificação de sincronização dos adaptadores |
| 34 | Orquestração existente permanece válida | testes de plano/ondas e regressão da suíte existente |

Testes textuais e cenários documentados verificam o contrato, não comprovam a escolha
real de um modelo. A aplicação efetiva precisa de evidência de uma delegação em ambiente
que exponha essa capacidade; até lá, esse aceite vivo permanece explicitamente pendente.

## 17. Proposta — confiabilidade do agente e preparação do GitHub CLI

Status: spec e plano aprovados explicitamente pelo usuário em 2026-10-19.
Implementação local verificada; encerramento depende das evidências vivas registradas.

Documento normativo desta proposta:
`docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md`.
Ele contém problema, objetivo, não-objetivos, requisitos R1–R8, critérios verificáveis
35–48 e fora de escopo. As seções anteriores e suas pendências permanecem preservadas.

Escopo: avaliação do comportamento do agente; retomada contra o estado real; recursos
compartilhados nas ondas; evidência e contraprova no review; comparação limitada de
instruções; preparação idempotente do GitHub CLI (`gh`) na instalação/primeira ativação
suportada, com autenticação separada.

Plano aprovado:
`docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`.
Revisões e relatório de avaliação registram a execução e suas pendências.
