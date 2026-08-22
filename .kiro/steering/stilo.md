---
title: Stilo Code
inclusion: always
---

<!-- Gerado a partir de AGENTS.md por scripts/sync-adapters.js. Não edite aqui: edite o AGENTS.md e rode `npm run sync`. -->

# Stilo Code — pipeline de projeto

Este arquivo é o ruleset completo. Sozinho, colado em qualquer agente, é suficiente para
conduzir um projeto de ponta a ponta. Nenhum plugin, servidor ou pacote é necessário.

## Regra 0 — uma pasta por projeto

Todo projeto novo ganha sua própria subpasta no workspace, com seu próprio
`.stilo/state.json`. Nunca misturar projetos na raiz do workspace.

## Regra 1 — nunca pular para a implementação

Um pedido pequeno ainda passa pelo pipeline, só que rápido. Só se pula uma fase com
autorização explícita do usuário para aquela tarefa — nunca por julgar o pedido simples.

## 1. As sete fases

```
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE
```

| # | Fase | Modelo | Artefato durável | Critério de saída |
|---|---|---|---|---|
| 1 | `BRAINSTORM` | profundo | *(nenhum — só conversa)* | Usuário confirma que problema e escopo estão claros |
| 2 | `SPEC` | profundo | `spec.md` | `spec.md` escrito e aprovado pelo usuário |
| 3 | `PLAN` | profundo | `plan.md` | `plan.md` escrito, com passos verificáveis |
| 4 | `EXECUTE` | **rápido** | o código | Todos os passos do plano feitos e verificados |
| 5 | `REVIEW` | profundo | `.stilo/review-NN.md` | Review escrito em arquivo |
| 6 | `FIX` | profundo | código corrigido | Todos os achados do review resolvidos |
| — | *(loop)* | | | `REVIEW` → `FIX` → `REVIEW` até zero achados |
| 7 | `DONE` | — | — | Review limpo: nenhum achado `crítico` nem `alto` |

## 2. O que fazer em cada fase

**BRAINSTORM** — entender antes de propor. Perguntar sobre o problema real, quem usa, as
restrições e o critério de sucesso. Uma decisão por vez, sempre com uma recomendação —
não um menu de opções. Não produzir arquivo nenhum. Termina quando o usuário confirma o
escopo em palavras.

**SPEC** — escrever `spec.md` com: problema, objetivo, não-objetivos, requisitos,
critérios de aceite testáveis, fora de escopo. **O que, não como.** Um critério de aceite
que não dá para verificar rodando algo não é critério, é desejo.

**PLAN** — escrever `plan.md` com passos numerados. Cada passo pequeno o bastante para ser
verificado sozinho, listando os arquivos afetados e como confirmar que funcionou. **O
como.** O plano também registra o que ficou decidido, e essas decisões não se reabrem
durante a execução.

**EXECUTE** — seguir o plano na ordem. Não redesenhar durante a execução: se o plano
estiver errado, parar, dizer isso ao usuário e voltar para `PLAN`. Verificar cada passo
antes de seguir para o próximo.

**REVIEW** — revisar o diff contra o `spec.md` e o `plan.md`, carregando
`modules/revisor.md`. Achados numerados, cada um com arquivo, linha, gravidade
(`crítico|alto|médio|baixo`), o que quebra e como corrigir. Sempre gravado em
`.stilo/review-NN.md`, com `NN` igual a `reviewRound` + 1.

**FIX** — resolver cada achado do review mais recente, marcando o estado de cada um no
próprio arquivo de review. Depois voltar para `REVIEW`, incrementando `reviewRound`.

## 3. Estado em disco — `.stilo/state.json`

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

`phase` é uma de `BRAINSTORM`, `SPEC`, `PLAN`, `EXECUTE`, `REVIEW`, `FIX`, `DONE`.
`enxuto` é uma de `auto`, `off`, `leve`, `pleno` (§ 6).

- **Escrever é sua responsabilidade.** Ao concluir uma fase, gravar o arquivo com a fase
  nova e o `updated` em ISO 8601 UTC. Só você sabe que uma fase acabou. Um estado
  desatualizado faz a próxima sessão retomar no lugar errado.
- **Procurar:** subir a partir do diretório atual até achar `.stilo/state.json`, como o
  git faz com `.git`. Se não achar, varrer **um** nível abaixo. Se achar mais de um,
  listar todos e perguntar ao usuário qual é — nunca adivinhar.
- **Não achou nenhum:** é projeto novo. Criar a subpasta, criar
  `<subpasta>/.stilo/state.json` em `phase: "BRAINSTORM"`, com `reviewRound: 0` e
  `enxuto: "auto"`, e começar a fazer perguntas.

## 4. Modelo por fase

Nenhum hook troca o modelo da sessão. Confira em que modelo você está rodando e avise o
usuário **só quando houver divergência** — uma linha, sem insistir.

| Agente | Fase profunda | Fase rápida (`EXECUTE`) |
|---|---|---|
| Claude Code | Opus 5, effort `xhigh` (`/model opus`) | Sonnet 5, effort `medium` (`/model sonnet`) — ou um subagente com `model: sonnet`, que não exige ação do usuário |
| Codex | reasoning effort `high` | reasoning effort `medium` |
| Demais agentes | o modelo mais capaz disponível | um modelo mais rápido e barato |

## 5. Módulos — carregar só quando a fase pede

Módulos ficam em `modules/` ao lado deste arquivo. Não são comandos: você os lê quando o
gatilho vale.

| Módulo | Carregar quando |
|---|---|
| `modules/enxuto.md` | Sempre que `enxuto` resolver para `leve` ou `pleno` |
| `modules/revisor.md` | Fase `REVIEW` |
| `modules/frontend.md` | `EXECUTE` ou `REVIEW`, **e** o diff toca interface de usuário |
| `modules/autoria-skill.md` | `PLAN` ou `EXECUTE`, **e** o projeto **é** uma skill ou plugin de agente |

Carregar um módulo fora do gatilho é desperdício de contexto: um projeto de CLI nunca lê
`modules/frontend.md`.

## 6. Modo Enxuto — compressão da saída

Mesmo conteúdo técnico, menos token. É regra de estilo da **sua saída**, não do que você
lê.

**Nível por fase**, quando `enxuto` é `auto`:

| Fase | Nível | Porquê |
|---|---|---|
| `BRAINSTORM` | `off` | Explorar problema precisa de nuance e pergunta bem formulada |
| `SPEC`, `PLAN` | `leve` | O documento é lido depois; corta enchimento, mantém frase inteira |
| `EXECUTE`, `REVIEW`, `FIX` | `pleno` | Fases mecânicas: narração e cortesia são puro custo |
| `DONE` | `off` | Não há mais trabalho a comprimir |

Um valor explícito (`off`, `leve`, `pleno`) no `state.json` sobrepõe a tabela em todas as
fases, e persiste entre sessões.

**O que cortar:** enchimento (`basicamente`, `na verdade`, `simplesmente`), cortesia
(`claro!`, `fico feliz em ajudar`), hedging, narração de ferramenta (`agora vou ler o
arquivo…`), tabela e emoji decorativos, despejo de log longo — citar só a linha decisiva.

**Travas de segurança — nunca tocar:**

- Negações (`não`, `nunca`, `só`, `exceto`). Inverter sentido é pior que qualquer token
  economizado.
- Números, unidades, versões.
- Blocos de código, nomes de símbolo, API, comando.
- Mensagens de erro — sempre citadas literalmente.

**As duas regras que quase toda tentativa de compressão erra:**

1. **Nunca adicionar palavra para parecer comprimido.** Compressão só encurta.
2. **Se a forma "comprimida" não for realmente menor, use a normal.** Abreviações (`cfg`,
   `impl`, `req`) e setas custam os mesmos tokens da palavra inteira: economia zero,
   leitura pior.

**Escape de clareza:** ambiguidade, conceito novo, aviso de segurança ou ação
irreversível — escrever normal. Clareza ganha de token.

## 7. Idioma

Todo o repositório é escrito em português. **Responda sempre no idioma em que o usuário
escreveu** — usuário em inglês recebe resposta em inglês. Comprime-se o estilo, nunca o
idioma.

## 8. Aviso de `/clear` seguro

Avise proativamente quando é seguro limpar o contexto — uma linha curta, no formato
`✅ Ponto seguro para /clear`.

- **Seguro:** logo depois de um artefato durável ir para o disco — `spec.md`, `plan.md`,
  código executado e verificado, `.stilo/review-NN.md`, correções aplicadas. Nesses
  pontos o estado inteiro está em disco.
- **Não seguro:** no meio de `BRAINSTORM`, `PLAN` ou `EXECUTE`, quando decisões ainda só
  existem na conversa.

## 9. Companions — usados se existirem, nunca exigidos

Se algum destes estiver instalado, aproveite. Se não estiver, siga com as instruções deste
arquivo: **sem erro, sem aviso, sem pedir instalação.** O pipeline completa inteiro com
zero companions.

| Companion | Onde ajuda |
|---|---|
| `superpowers` | `BRAINSTORM`, `PLAN`, `EXECUTE` |
| `ponytail` | `EXECUTE`, `FIX` — mantém o diff mínimo |
| `context7` (MCP) | `SPEC`, `PLAN` — documentação atualizada de biblioteca |
| `playwright` (MCP) | `EXECUTE`, `REVIEW` — verificar em navegador de verdade |

Só entra nessa lista o que instala em quase todo agente: servidor MCP, ou pacote que envia
adaptadores multi-agente. Ferramenta presa a um único agente cria um pipeline que quebra
ao trocar de ferramenta — exatamente o problema que o Stilo Code existe para resolver.

## 10. Comandos

| Comando | Efeito |
|---|---|
| `/stilo` | Inicia um projeto novo ou retoma o ativo, reportando fase e próxima ação. Religa o Stilo Code se estiver desligado. |
| `/stilo enxuto <nível>` | Grava `enxuto` no `state.json`. Nível: `off`, `leve`, `pleno` ou `auto` |
| `/stilo-off` | Desliga globalmente até o próximo `/stilo` |

Não há comando de avanço de fase: quem avança é você, ao concluir uma fase.
