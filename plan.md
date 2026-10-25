<!-- Aprovação: usuário confirmou spec e plano em 2026-10-19. Status históricos abaixo não revogam esta aprovação. Execução serial sem commits/publicação. -->

# Stilo Code — Plano de Implementação

## Emenda ativa (2026-10-25) — README overview-first

**Objetivo:** reorganizar `README.md` e `README.en.md` para que quem chega ao projeto
entenda o que o Stilo Code faz antes dos detalhes de instalação e referência. Escopo e
critérios em `spec.md` § 19; plano aprovado pelo usuário em 2026-10-25. Esta emenda
substitui o escopo histórico do Passo 14 apenas para este ciclo. Não publicar.

**Arquitetura:** dois documentos equivalentes, português como fonte e inglês como
tradução, com a mesma ordem de assuntos: resumo, problema, fluxo e estado persistido,
funcionamento automático, hosts suportados, instalação, detalhes opcionais e links de
referência. Os critérios 55–60 ficam registrados na spec; validar evidência sem alterar
outros arquivos do produto.

**Stack:** Markdown; verificações estáticas com `rg`, `Test-Path` e `git diff --check`.
Não executar código do repositório nem testes.

### Tarefas

**T01 — Reescrever README em português**

- Especialista: documentação
- Files: `README.md`
- Depends-on: nenhum
- Resources: nenhum
- Execução: abrir com definição direta do produto e seu benefício; explicar o fluxo de
  sete fases, estado por projeto e retomada; depois apresentar operação automática,
  suporte a Claude Code/Codex e instalação. Preservar links úteis e claims compatíveis
  com a spec. Não anunciar hosts removidos.
- Verificação: conferir ordem de títulos e primeiros 20 linhas; buscar fases, estado,
  `/clear`, ambos os hosts e destinos dos links.

**T02 — Reescrever README em inglês**

- Especialista: documentação
- Files: `README.en.md`
- Depends-on: T01
- Resources: nenhum
- Execução: traduzir a estrutura e o conteúdo de T01 para inglês, preservando equivalência
  dos tópicos, links cruzados e nomes técnicos.
- Verificação: comparar títulos em ordem com T01; conferir fases, estado, `/clear`, hosts e
  destinos dos links.

**T03 — Verificar o conjunto**

- Especialista: documentação
- Files: `README.md`, `README.en.md`
- Depends-on: T01, T02
- Resources: nenhum
- Execução: validar os critérios 55–60 conforme `spec.md` § 19 e registrar a evidência no
  review desta rodada, sem ampliar os arquivos alterados.
- Verificação: executar buscas e checagem de links previstas pelos critérios 55–60;
  confirmar `git diff --check` e que os únicos arquivos de produto alterados são os dois
  READMEs.

**Ordem:** T01 → T02 → T03, serial por dependência. O coordenador edita e revisa sem
delegação. Ao fim, gravar evidências dos critérios em `docs/aceite.md` e solicitar REVIEW.

> **Ciclo atual (2026-10-24):** suporte apenas a Claude Code e Codex, conforme `spec.md` § 18.
> Plano: `docs/superpowers/plans/2026-10-24-apenas-claude-codex-plan.md`.

> **Proposta anterior (2026-10-19):** confiabilidade do agente e preparação do GitHub CLI.
> Plano aprovado em `docs/superpowers/plans/2026-10-19-confiabilidade-agente-plan.md`;
> spec em `docs/superpowers/specs/2026-10-19-confiabilidade-agente-design.md` e `spec.md` § 17.
> Spec e plano aprovados explicitamente em 2026-10-19; implementação local verificada,
> com evidências vivas pendentes no relatório do ciclo.
> A emenda anterior está preservada; sua integração pendente é tratada como pré-requisito
> em T01 da proposta, sem declarar os aceites anteriores concluídos.

> **Emenda ativa (2026-10-01):** seleção automática de modelo e esforço por tarefa,
> conforme `spec.md` § 16. Seguir
> `docs/superpowers/plans/2026-10-01-selecao-modelo-esforco-plan.md`.
> As instruções e planos anteriores abaixo são históricos e não substituem este ciclo.

> Fase do pipeline: PLAN · Baseado em `spec.md`
> Execução em **Sonnet 5 @ medium** (fase `EXECUTE`); voltar a Opus/xhigh no `REVIEW`.

> **Emenda ativa (2026-09-18):** o escopo atual é o ciclo automático sem comandos,
> detalhado em `docs/superpowers/plans/2026-09-18-automatico-sem-comandos-plan.md`.
> Os passos abaixo preservam a implementação histórica; não reintroduza comandos, skills
> ou overrides manuais. A execução da emenda segue o plano detalhado e serial.

## Contexto de execução

| Item | Valor |
|---|---|
| GitHub | `luizgdemarchi` |
| Node | v24.18.0 (usar `node:test` embutido — **zero dependências de runtime**) |
| Repo | `C:\Users\luizg\Documents\claude code\stilo-code` |
| Referências locais | ponytail 4.8.4 e superpowers 6.3.0 em `~/.claude/plugins/cache/` |

**Regra de execução:** seguir os passos na ordem. Se um passo revelar que o plano está
errado, parar e voltar para `PLAN` — não redesenhar no meio da execução.

**Decisões de arquitetura já travadas** (não reabrir durante a execução):

- `AGENTS.md` é lido **em runtime** pelos hooks, não embutido em JS. Fonte única, sem
  drift, e o usuário pode editar sem mexer em código.
- Módulos são lidos **sob demanda**, só quando a fase pede. Injetar os quatro sempre
  contradiria o próprio Modo Enxuto.
- **Quem escreve o estado:** o agente grava transições de fase (tem ferramenta de
  escrita, funciona em qualquer agente); os hooks gravam apenas `/stilo-off` e
  `/stilo enxuto <nível>`, porque esses precisam de efeito imediato sem gastar um turno.

---

## Passo 1 — Esqueleto do repositório

**Objetivo:** repo versionado e vazio, pronto para receber conteúdo.

**Arquivos:** `.git/`, `package.json`, `LICENSE` (MIT, Luiz Gabriel De Marchi
Nascimento), `.gitignore` (`node_modules`, `.stilo/`, `*.log`), `README.md` (stub de
uma linha).

`package.json`: nome `stilo-code`, versão `0.1.0`, `"private": false`, sem `dependencies`,
scripts `test` (`node --test tests/`) e `sync` (`node scripts/sync-adapters.js`).

**Verificação:** `git status` limpo após o commit inicial; `node -e "require('./package.json')"` sem erro.

---

## Passo 2 — Fixar o contrato de I/O dos hooks (spike)

**Objetivo:** descobrir empiricamente como Claude Code e Codex passam dados para o hook e
como o hook devolve contexto. **Não inventar esse contrato** — é o maior risco técnico do
projeto.

**Fonte:** ler de `~/.claude/plugins/cache/ponytail/ponytail/4.8.4/hooks/`:
`ponytail-runtime.js` (formato de saída, detecção de Codex/Copilot),
`ponytail-config.js` (resolução de `CLAUDE_CONFIG_DIR`), `ponytail-activate.js`.

**Saída:** `docs/contrato-hooks.md` documentando, para cada um dos 3 eventos: shape do
JSON de stdin, campos usáveis (`cwd`, `session_id`), formato de saída que vira contexto,
e como a saída difere entre Claude Code e Codex.

**Verificação:** o documento responde às 3 perguntas sem "provavelmente" ou "talvez"; cada
afirmação aponta para arquivo e linha do ponytail.

---

## Passo 3 — `AGENTS.md`, o ruleset (artefato de maior valor)

**Objetivo:** o pipeline inteiro em um arquivo, em pt-BR, autossuficiente. Colado sozinho
num agente sem plugin, tem que ser suficiente para conduzir o projeto (critério 9).

**Conteúdo:**
1. Regra 0 — uma pasta por projeto; Regra 1 — nunca pular para a implementação
2. As 7 fases com o quadro do spec § 4 (modelo, artefato, critério de saída)
3. Instruções concretas de cada fase (spec § 4, "Conteúdo de cada fase")
4. Como ler e gravar `.stilo/state.json` (§ 5) — com o JSON de exemplo
5. Modelo por fase, com a tabela dos 3 tiers (§ 6)
6. Quando carregar cada módulo (§ 4.2)
7. Modo Enxuto: níveis por fase, travas de segurança, as 2 regras anti-erro (§ 4.3)
8. Regra de idioma: responder no idioma do usuário
9. Aviso de `/clear` seguro (§ 9)
10. Companions portáteis e degradação graciosa (§ 4.1)

**Verificação:** cada uma das 10 seções presente; nenhuma menção a `code-review`,
`frontend-design` ou `skill-creator` (`grep -i` nesses três nomes retorna vazio,
critério 10).

---

## Passo 4 — `modules/enxuto.md`

**Objetivo:** o Modo Enxuto detalhado, além do resumo que já está no `AGENTS.md`.

**Conteúdo:** listas do que cortar e do que nunca tocar; as duas regras anti-erro com
exemplo concreto de cada; tabela de nível por fase; escape de clareza; 3 pares
antes/depois mostrando `leve` e `pleno` sobre o mesmo texto.

**Verificação:** os exemplos "depois" são realmente mais curtos que os "antes" e
preservam toda negação, número e nome de símbolo do original.

---

## Passo 5 — `modules/revisor.md`

**Objetivo:** revisor próprio, autocontido (substitui `code-review`).

**Conteúdo:** o que revisar em ordem (o diff cumpre o `spec.md`? cumpre o `plan.md`?
corretude, casos de borda, tratamento de erro, segurança, testes); formato de achado
(número, arquivo:linha, gravidade `crítico|alto|médio|baixo`, o que quebra, como
corrigir); template do `.stilo/review-NN.md`; regra de encerramento — só declarar `DONE`
quando a rodada não produzir achado `crítico` nem `alto`.

**Verificação:** rodar o módulo à mão sobre um diff de exemplo com um bug plantado; o bug
aparece como achado com arquivo, linha e gravidade.

---

## Passo 6 — `modules/frontend.md` e `modules/autoria-skill.md`

**Objetivo:** os outros dois módulos internos, deliberadamente mais simples.

`frontend.md`: hierarquia visual, espaçamento consistente, contraste WCAG AA, os quatro
estados obrigatórios (vazio, carregando, erro, sucesso), responsividade, foco e
navegação por teclado. **Gatilho explícito no topo:** só carregar quando o diff toca UI.

`autoria-skill.md`: anatomia do `SKILL.md` (frontmatter `name`/`description`), como
escrever `description` que dispara na hora certa (gatilhos concretos, não abstratos),
quando quebrar em módulos, e a lista de adaptadores multi-agente. **Gatilho:** só quando
o projeto **é** uma skill ou plugin.

**Verificação:** critério 11 — o gatilho de cada módulo é uma frase inequívoca na
primeira linha do arquivo.

---

## Passo 7 — `hooks/stilo-state.js`

**Objetivo:** biblioteca pura de estado. Sem I/O de hook, só sistema de arquivos — o que
a torna a peça mais testável do projeto.

**API:** `findStateFile(cwd)`, `readState(path)`, `writeState(path, state)`,
`resolveEnxuto(state)`, `isOff()` / `setOff(bool)` (`~/.stilo/off`).

**Busca (spec § 5):** subir do `cwd` procurando `.stilo/state.json`; se não achar, varrer
**um** nível abaixo; se achar mais de um, devolver a lista inteira — ambiguidade é
reportada, nunca adivinhada.

**Verificação:** `tests/state.test.js` cobrindo: acha subindo; acha um nível abaixo;
devolve lista quando há dois projetos; devolve vazio quando não há nenhum; JSON
malformado não lança exceção; `resolveEnxuto` devolve o nível da fase com `auto` e
respeita a sobreposição. Todos passando.

---

## Passo 8 — `hooks/stilo-instructions.js`

**Objetivo:** montar o texto injetado, a partir do `AGENTS.md` e do estado.

**API:** `buildFullContext(state)` — ruleset + estado + módulos da fase (`SessionStart`,
`SubagentStart`); `buildStateLine(state)` — uma linha curta (`UserPromptSubmit`).

Lê `AGENTS.md` e `modules/*.md` de `process.env.CLAUDE_PLUGIN_ROOT`, com fallback para o
caminho relativo ao próprio arquivo (necessário no OpenCode, que roda de um checkout).

**Verificação:** `tests/instructions.test.js` — `buildStateLine` cabe em uma linha e cita
fase e próxima ação; `buildFullContext` em `EXECUTE` inclui `enxuto.md` e **não** inclui
`frontend.md`; sem `CLAUDE_PLUGIN_ROOT`, o fallback acha os arquivos.

---

## Passo 9 — Os três hooks e os manifestos

**Objetivo:** ligar biblioteca e eventos, seguindo o contrato do Passo 2.

- `stilo-activate.js` (`SessionStart`) — sai cedo se `isOff()`; senão injeta
  `buildFullContext`.
- `stilo-prompt.js` (`UserPromptSubmit`) — detecta `/stilo-off`, `/stilo` e
  `/stilo enxuto <nível>` e **grava** o efeito; senão injeta `buildStateLine`.
- `stilo-subagent.js` (`SubagentStart`) — injeta `buildFullContext`.

`hooks/claude-codex-hooks.json` com os 3 eventos (`SessionStart` com matcher
`startup|resume|clear|compact`), `timeout: 5`, comandos via `${CLAUDE_PLUGIN_ROOT}`.
`hooks/qoder-hooks.json` conforme o formato do Qoder.

**Todo hook é best-effort:** qualquer falha sai com código 0 e saída vazia. Um hook que
quebra a sessão é pior do que um hook que não roda (critério 7).

**Verificação:** `tests/hooks.test.js` — pipar o JSON de stdin de cada evento e conferir a
saída; com `~/.stilo/off` presente, saída vazia; com `state.json` corrompido, código de
saída 0.

---

## Passo 10 — Skills e manifestos de plugin

**Objetivo:** a superfície de comandos e a instalabilidade.

`skills/stilo/SKILL.md` — frontmatter `name: stilo`,
`argument-hint: "[nome-do-projeto|enxuto off|leve|pleno|auto]"`, `description` disparando
em "novo projeto", "stilo", "retomar projeto", "em que fase". Corpo: iniciar (criar
subpasta + `state.json` em `BRAINSTORM`), retomar (ler estado e reportar fase e próxima
ação), ajustar enxuto.

`skills/stilo-off/SKILL.md` — curto, ~15 linhas.

`.claude-plugin/plugin.json` (nome `stilo-code`, `hooks` → `./hooks/claude-codex-hooks.json`),
`.claude-plugin/marketplace.json` (owner `luizgdemarchi`, `source: "./"`),
`.codex-plugin/plugin.json` (mesmos dados + bloco `interface`).

**Verificação:** os 3 JSON parseiam; todo caminho referenciado existe em disco.

---

## Passo 11 — `scripts/sync-adapters.js` e os adaptadores gerados

**Objetivo:** gerar de `AGENTS.md` os arquivos de regra por agente. Nove cópias manuais
divergem em uma semana (spec § 11).

**Gera:** `.cursor/rules/stilo.mdc` (com frontmatter `alwaysApply: true`),
`.clinerules/stilo.md`, `.windsurf/rules/stilo.md`, `.kiro/steering/stilo.md`,
`.qoder/rules/stilo.md`, `.agents/rules/stilo.md`.

Flag `--check` sai com código 1 se algo estiver dessincronizado.

**Verificação:** rodar; editar uma linha do `AGENTS.md`; `--check` falha; rodar de novo;
`--check` passa (critério 8).

---

## Passo 12 — Adaptadores não gerados

**Objetivo:** os que têm formato próprio e não saem do `AGENTS.md`.

`commands/stilo.toml` e `commands/stilo-off.toml` (Gemini/Codex);
`.opencode/plugins/stilo.mjs` (reaproveita `hooks/` e `modules/`, resolvendo caminho
relativo ao próprio `.mjs`); `.opencode/command/`; `opencode.json`;
`gemini-extension.json`.

**Verificação:** TOML e JSON parseiam; `node --input-type=module -e "import('./.opencode/plugins/stilo.mjs')"` importa sem erro.

---

## Passo 13 — Verificação real no Claude Code

**Objetivo:** provar que funciona instalado de verdade, não só nos testes.

Instalar o marketplace a partir do caminho local, instalar o plugin, `/reload-plugins`,
e percorrer os **14 critérios de aceite** do spec § 12 um a um, registrando o resultado.

**Foco nos que só aparecem instalado:** critério 3 (sessão nova reporta a fase sozinha),
critério 4 (**`/clear` no meio e o agente retoma na fase certa** — o motivo do projeto
existir), critério 12 (saída em `EXECUTE` sem narração, com negações e erros intactos).

**Verificação:** `docs/aceite.md` com os 14 critérios e ✅/❌ em cada. Qualquer ❌ volta
para o passo correspondente antes de seguir.

---

## Passo 14 — README

**Objetivo:** `README.md` em pt-BR e `README.en.md` traduzido.

**Conteúdo:** o que é e o problema que resolve; o diagrama das 7 fases; instalação por
agente (Claude Code, Codex, OpenCode, Gemini, Cursor, Windsurf, Cline, Qoder, Kiro);
os 2 comandos; o Modo Enxuto com um par antes/depois; companions portáteis com a nota de
que nenhum é obrigatório; licença MIT.

**Verificação:** os comandos de instalação batem com os nomes reais dos manifestos
(`stilo-code@stilo-code`) — testar o do Claude Code copiando e colando.

---

## Passo 15 — Publicar

**Objetivo:** repo público em `github.com/luizgdemarchi/stilo-code`.

`gh repo create luizgdemarchi/stilo-code --public --source=. --push`, com a descrição do
spec § 2.

**Confirmar com o usuário antes de executar** — publicar é irreversível na prática.

**Verificação:** num diretório temporário, `/plugin marketplace add luizgdemarchi/stilo-code`
seguido de `/plugin install stilo-code@stilo-code` funciona a partir do GitHub
(critério 1).

---

## Ordem e paralelismo

Sequencial por dependência: 1 → 2 → 3 → (4, 5, 6 em paralelo) → 7 → 8 → 9 → 10 → 11 → 12
→ 13 → 14 → 15.

O Passo 3 (`AGENTS.md`) é o gargalo real: os passos 8, 11 e 14 consomem seu conteúdo.
Vale gastar mais tempo nele do que em qualquer outro.

## Riscos da execução

| Risco | Sinal | Resposta |
|---|---|---|
| Contrato de hook diferente do inferido | Passo 2 fica ambíguo | Testar o hook contra o Claude Code real antes de escrever os 3 hooks |
| `AGENTS.md` grande demais e caro de injetar | Passa de ~8 KB | Mover detalhe para `modules/`, deixando no ruleset só o que toda fase precisa |
| Formato de adaptador (Cursor/Kiro/Qoder) errado | — | Conferir contra superpowers 6.3.0 e ponytail 4.8.4 em cache, que já os enviam |
| Descoberta de estado erra com vários projetos | Teste do Passo 7 | Ambiguidade é reportada ao agente, nunca resolvida por chute |
