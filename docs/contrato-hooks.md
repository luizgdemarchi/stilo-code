# Contrato de I/O dos hooks

Este documento separa o contrato observado do código de compatibilidade ainda não
validado em instalação viva. A referência original é ponytail 4.8.4 em
`~/.claude/plugins/cache/ponytail/ponytail/4.8.4/`; as afirmações herdadas abaixo apontam
para arquivo e linha.

## Estado da compatibilidade

- **Observado no pacote:** Claude Code e Codex têm manifestos publicados; são os únicos
  agentes suportados (spec § 18). O Codex define
  `PLUGIN_DATA` para o formato de saída e também fornece `CLAUDE_PLUGIN_ROOT` como alias da raiz do plugin, permitindo reutilizar `hooks/claude-codex-hooks.json`.

## 1. Como o agente passa dados ao hook

Um objeto JSON único em **stdin**. O hook lê `data`, acumula e faz `JSON.parse` no evento
`end` (`ponytail-mode-tracker.js:119-120`).

| Evento | Campos usados pelo ponytail | Onde |
|---|---|---|
| `SessionStart` | *(nenhum — o hook nem lê stdin)* | `ponytail-activate.js` inteiro |
| `UserPromptSubmit` | `prompt` (string) | `ponytail-mode-tracker.js:18` |
| `SubagentStart` | `agent_type` (string) | `ponytail-subagent.js:63` |

Três regras que o ponytail aprendeu apanhando, e que o Stilo Code copia:

1. **BOM.** Alguns shells no Windows prependam `\uFEFF` ao JSON pipado, o que quebra o
   `JSON.parse`. Sempre `.replace(/^\uFEFF/, '')` antes de parsear
   (`ponytail-mode-tracker.js:17`).
2. **stdin pode nunca fechar.** No Windows, o wrapper PowerShell `if {}` engole o JSON e o
   evento `end` não dispara — a sessão congela. Todo hook que lê stdin precisa de
   `on('error')` e de um `setTimeout(..., 1000).unref()` que processa o que chegou e sai
   (`ponytail-mode-tracker.js:129-130`, `ponytail-subagent.js:76-77`).
3. **Quem não precisa de stdin não lê stdin.** O caminho padrão do `SubagentStart` do
   ponytail é síncrono justamente para não travar em `end` que não vem
   (`ponytail-subagent.js:41-48`).

`cwd` e `session_id` **não** são usados pelo ponytail em nenhum hook. Para o Stilo Code o
`cwd` importa (é a raiz da busca por `.stilo/state.json`), e o campo do payload não está
provado — então a regra é: usar `data.cwd` quando presente, cair em `process.cwd()` quando
não. O hook roda com o cwd da sessão, então o fallback é correto de qualquer jeito.

## 2. Como o hook devolve contexto

Tudo em **stdout**. O formato depende do agente e do evento — `writeHookOutput`
(`ponytail-runtime.js:36-75`) é a função inteira que resolve isso:

| Agente | Detecção | `SessionStart` | `UserPromptSubmit` | `SubagentStart` |
|---|---|---|---|---|
| Claude Code | sem `PLUGIN_DATA` | **texto cru** | texto cru | `{"hookSpecificOutput":{"hookEventName":…,"additionalContext":…}}` |
| Codex | `process.env.PLUGIN_DATA` | `{"systemMessage":…,"hookSpecificOutput":{…}}` | idem | idem |

Detalhes que só aparecem lendo o código:

- **Claude Code aceita stdout cru no `SessionStart`, mas não no `SubagentStart`.** Sem o
  envelope `hookSpecificOutput`, o contexto do subagente é silenciosamente descartado
  (`ponytail-runtime.js:67-73`). Este é o detalhe que mais custa tempo se inventado.
- **Codex sempre exige JSON**, e usa `systemMessage` para a linha visível ao usuário e
  `hookSpecificOutput.additionalContext` para o contexto injetado — são coisas diferentes
  (`ponytail-runtime.js:43-53`).
- **Um `process.stdout.write` por invocação.** Duas escritas viram JSON concatenado
  inválido no Codex.

## 3. Manifesto e resolução de caminho

`hooks/claude-codex-hooks.json` do ponytail dá o formato exato:

- `SessionStart` com `"matcher": "startup|resume|clear|compact"` — é o `clear|compact` que
  faz o estado voltar depois do `/clear`.
- `"command"` (POSIX) e `"commandWindows"` separados. O Windows usa
  `if (Get-Command node -ErrorAction SilentlyContinue) { node "$env:CLAUDE_PLUGIN_ROOT\hooks\x.js" }`
  — é essa guarda que satisfaz o critério de aceite 7 (`node` fora do PATH não quebra a
  sessão).
- `"timeout": 5`, `"statusMessage"` opcional.
- Raiz do plugin: `${CLAUDE_PLUGIN_ROOT}` em POSIX, `$env:CLAUDE_PLUGIN_ROOT` no
  PowerShell. No Codex, `CLAUDE_PLUGIN_ROOT` é um alias compatível da raiz do plugin; o
  formato de saída continua selecionado por `PLUGIN_DATA`.

Dentro do JS, o ponytail nunca lê `CLAUDE_PLUGIN_ROOT`: resolve tudo por `__dirname`
(`ponytail-instructions.js:9`). Mais robusto, porque funciona também em checkout solto. O Stilo Code faz igual, com `CLAUDE_PLUGIN_ROOT` só como sobreposição.

## 4. O que cada hook do Stilo Code injeta

Contrato do ciclo 2026-11-02. Os limites são conferidos pelos testes.

| Evento | Lê do stdin | Injeta |
|---|---|---|
| `SessionStart` | `session_id`, `cwd` | `AGENTS.md`, bloco de estado, nota do `gh` quando falta, módulos da fase; até 19.500 caracteres, sem compactação |
| `UserPromptSubmit` | `session_id`, `cwd` | linha de estado; na troca de fase, também os módulos da fase nova |
| `SubagentStart` | nada | contexto reduzido do subagente, até 6.000 caracteres |

O `SessionStart` passou a ler o stdin para saber a sessão e o `cwd`. Ele usa o mesmo
`readStdinJson` do `UserPromptSubmit`, com o timeout de 1 segundo da regra 2 da seção 1:
stdin vazio ou que nunca fecha cai no `cwd` do processo e segue sem registro de sessão.

### Contexto do subagente

Cabeçalho com projeto, fase e ciclo; `modules/subagente.md` inteiro (papel, proibições e
formato do relato); e o essencial da fase, extraído por título:

- `## O que nunca tocar`, de `enxuto.md`, quando o nível da fase não é `off`;
- `tdd.md` inteiro, em `EXECUTE` e `FIX`;
- `## Formato de um achado`, de `revisor.md`, em `REVIEW`;
- `## Formato do achado editorial`, de `revisor-editorial.md`, em `EDITORIAL_REVIEW`.

Esses títulos são contrato: renomear um deles tira a seção do subagente. Sem projeto, o
subagente não recebe nada; com estado ilegível, inválido ou ambíguo, recebe só a linha de
aviso.

### Rastreio de sessão e troca de fase

O `SessionStart` grava a fase injetada em `<dados>/sessoes/<id>.json`, em que `<id>` são os
16 primeiros dígitos hexadecimais do SHA-256 do `session_id`. `<dados>` é
`CLAUDE_PLUGIN_DATA`, `PLUGIN_DATA` ou `os.tmpdir()/stilo-code`, nessa ordem. Nada vai para
dentro do projeto.

A cada `UserPromptSubmit`, o hook compara a fase do estado com a registrada:

- mesma fase: só a linha de estado;
- fase nova, ou registro ausente: a linha, os módulos da fase nova e o registro atualizado;
- sem `session_id`, ou sem conseguir gravar: a linha seguida de ` · módulos: ` e dos
  caminhos absolutos dos módulos, para o agente lê-los.

A gravação poda, em melhor esforço, os registros com mais de 7 dias, e só os que têm o nome
de registro (16 hexadecimais e `.json`). No temporário do sistema, o hook recusa pasta que
seja link ou que pertença a outro usuário, e cai no fallback de caminhos. Nenhuma dessas
funções lança.

## 5. Regra de falha

Todo `writeHookOutput` do ponytail está dentro de `try/catch` que engole a exceção
(`ponytail-activate.js:92-96`, `ponytail-subagent.js:26-28`), e todo erro de leitura de
estado devolve `null` em vez de lançar (`ponytail-runtime.js:28-34`). Saída com código 0 e
stdout vazio é sempre uma resposta válida. **Um hook que quebra a sessão é pior do que um
hook que não roda.**
