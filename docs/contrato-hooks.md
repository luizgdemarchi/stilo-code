# Contrato de I/O dos hooks

Fonte: ponytail 4.8.4 em `~/.claude/plugins/cache/ponytail/ponytail/4.8.4/`, que já roda
em produção nos três agentes. Cada afirmação abaixo aponta para arquivo e linha.

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
| Claude Code | nenhuma env das outras | **texto cru** | texto cru | `{"hookSpecificOutput":{"hookEventName":…,"additionalContext":…}}` |
| Codex | `process.env.PLUGIN_DATA` | `{"systemMessage":…,"hookSpecificOutput":{…}}` | idem | idem |
| Copilot CLI | `process.env.COPILOT_PLUGIN_DATA` | `{"additionalContext":…}` | `{}` (ignora) | `{}` (ignora) |
| Qoder | `process.env.QODER_SESSION_ID` | *(não tem o evento)* | `{"hookSpecificOutput":{…}}` | via `PreToolUse` matcher `task\|Task` |

Detalhes que só aparecem lendo o código:

- **Claude Code aceita stdout cru no `SessionStart`, mas não no `SubagentStart`.** Sem o
  envelope `hookSpecificOutput`, o contexto do subagente é silenciosamente descartado
  (`ponytail-runtime.js:67-73`). Este é o detalhe que mais custa tempo se inventado.
- **Codex sempre exige JSON**, e usa `systemMessage` para a linha visível ao usuário e
  `hookSpecificOutput.additionalContext` para o contexto injetado — são coisas diferentes
  (`ponytail-runtime.js:43-53`).
- **Qoder não tem `SessionStart`.** O `UserPromptSubmit` faz papel duplo: ativa na primeira
  mensagem e injeta o ruleset em toda mensagem (`ponytail-mode-tracker.js:96-113`). Por
  isso o ponytail dobra a confirmação de troca de modo dentro do mesmo JSON: **uma escrita
  em stdout por invocação** (`ponytail-mode-tracker.js:107-111`).
- **Um `process.stdout.write` por invocação.** Duas escritas viram JSON concatenado
  inválido no Codex/Qoder.

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
  PowerShell. Codex usa `${PLUGIN_ROOT}` (`copilot-hooks.json`), e o Qoder não expande
  nada — seu manifesto é um template com o caminho literal a substituir
  (`qoder-hooks.json:2`).

Dentro do JS, o ponytail nunca lê `CLAUDE_PLUGIN_ROOT`: resolve tudo por `__dirname`
(`ponytail-instructions.js:9`). Mais robusto, porque funciona também em checkout solto
(OpenCode). O Stilo Code faz igual, com `CLAUDE_PLUGIN_ROOT` só como sobreposição.

## 4. Regra de falha

Todo `writeHookOutput` do ponytail está dentro de `try/catch` que engole a exceção
(`ponytail-activate.js:92-96`, `ponytail-subagent.js:26-28`), e todo erro de leitura de
estado devolve `null` em vez de lançar (`ponytail-runtime.js:28-34`). Saída com código 0 e
stdout vazio é sempre uma resposta válida. **Um hook que quebra a sessão é pior do que um
hook que não roda.**
