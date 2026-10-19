# Stilo Code

The project pipeline that survives `/clear`.

*[Português](README.md) — the source language of this repo.*

## The problem

You have a way of running a project: think first, write the spec, plan, execute, review.
While that lives only in the agent's memory, three things happen:

1. **It disappears.** One config reset and the workflow stops applying.
2. **It isn't portable.** It exists inside one agent, on one machine.
3. **It doesn't survive `/clear`.** Once the context is cleared, the agent forgets which
   phase the project is in and starts improvising — usually by writing code nobody asked
   for.

Stilo Code turns that pipeline into a **state machine written to disk**. A six-line file
per project, read automatically at every session start. After `/clear`, the agent re-reads
the disk and picks up exactly where it left off.

## The pipeline

On the first supported activation, the agent prepares GitHub CLI (`gh`) outside hooks.
It reuses an existing version or uses WinGet, an existing Homebrew, or apt/dnf with an
already configured package repository and allowed privileges. It validates the executable;
Windows may require a new window to refresh PATH. Authentication remains a separate step.
Plugin installation is distinct from activation; npm install scripts are not assumed.
Copying `AGENTS.md` directs the agent to prepare gh with its tools; the file alone cannot
install it. Unavailable network, manager or privileges remain pending without blocking the
pipeline or automatic retries. [Methods and limits (Portuguese)](docs/preparacao-github-cli.md).

Resumption compares state, checkpoint and checkout before edits. Tasks declare exclusive
resources; reviews record evidence, confidence and counterevidence. Agent evaluations use
disposable copies and distinguish local tests from live observation. A fresh subagent does
not prove `/clear`. Model/effort selection considers risk, explicit preferences and exposed
capabilities, and never claims an unconfirmed model switch.

```
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE
```

| Phase | Model | Durable artifact | Exits when |
|---|---|---|---|
| `BRAINSTORM` | deep | *(none)* | you confirm the scope |
| `SPEC` | deep | `spec.md` | the spec is approved |
| `PLAN` | deep | `plan.md` | the plan has verifiable steps |
| `EXECUTE` | **fast** | the code | every step done and verified |
| `REVIEW` | deep | `.stilo/review-NN.md` | the review is in a file |
| `FIX` | deep | fixed code | every finding resolved |
| `DONE` | — | — | review with no critical or high finding |

**Rule 0 — one folder per project.** **Rule 1 — never jump to implementation:** a small
request still goes through the pipeline, just faster.

State lives in `<project>/.stilo/state.json`:

```json
{
  "version": 1,
  "project": "my-app",
  "phase": "PLAN",
  "reviewRound": 0,
  "enxuto": "auto",
  "updated": "2026-08-21T20:40:00Z"
}
```

(`enxuto` is Portuguese for *lean* — it's the output compression level. See below.)

## Install

### Claude Code

```
/plugin marketplace add luizgdemarchi/stilo-code
/plugin install stilo-code@stilo-code
```

Installs all three hooks (`SessionStart`, `UserPromptSubmit`, `SubagentStart`). Stilo
publishes no commands or skills; state is injected on its own, including right
after a `/clear`.

### Codex

Same package, same hook manifest. Point Codex at the cloned repo;
`.codex-plugin/plugin.json` carries the hooks. Codex exposes
`CLAUDE_PLUGIN_ROOT` as a compatibility alias for the shared manifest.

### GitHub Copilot CLI

Manual support: copy `AGENTS.md` to the project root or provide its contents as
instructions. This package does not publish a Copilot hook manifest, so it does not claim
automatic state injection or post-`/clear` recovery in that agent.

### OpenCode

```bash
git clone https://github.com/luizgdemarchi/stilo-code
```

In your `opencode.json`:

```json
{ "plugin": ["/path/to/stilo-code/.opencode/plugins/stilo.mjs"] }
```

The plugin injects context automatically through the experimental
`experimental.chat.system.transform` hook. If the installed OpenCode version does not
accept the hook, copy `AGENTS.md` to the project root, where OpenCode loads it as a rule.
Do not use `config.instructions` as the fallback on OpenCode V2; live compatibility is
confirmed only when the CLI smoke test runs.

### Gemini CLI / Antigravity

Clone the repo and use `gemini-extension.json`, which points at `AGENTS.md` as the context
file. This package publishes no Stilo commands; normal conversation activates the pipeline.

### Cursor, Windsurf, Cline, Kiro, Qoder

Copy your agent's rule file into your project:

| Agent | File |
|---|---|
| Cursor | `.cursor/rules/stilo.mdc` |
| Windsurf | `.windsurf/rules/stilo.md` |
| Cline | `.clinerules/stilo.md` |
| Kiro | `.kiro/steering/stilo.md` |
| Qoder | `.qoder/rules/stilo.md` |
| Anything else | `AGENTS.md` at the root |

In those agents the pipeline works without hooks: the ruleset is always in context and the
agent reads and writes `state.json` itself. Qoder also supports hooks — the template is in
`hooks/qoder-hooks.json`.

### Without installing anything

Paste `AGENTS.md` into the agent. It is self-sufficient by design: on its own, it runs the
whole pipeline.

## Automatic operation

After installation, hooks detect the project and inject state and instructions into every
session, message and subagent. Normal messages and prompts beginning with `/` follow the
same path; prompt text never mutates files.

## Lean Mode (`enxuto`)

Same technical content, fewer tokens. It's an output style rule — no proxy, no runtime,
nothing intercepted, which is what keeps the package portable.

```
before: Great question! I ran the tests and I'm happy to report that the vast
        majority passed. There were 47 tests in total, of which 46 passed and
        only 1 failed. The failing test was `test_retry_backoff`, and the full
        error message was: `AssertionError: expected 3 retries, got 2`.

after:  46/47. `test_retry_backoff`: `AssertionError: expected 3 retries, got 2`.
```

Note what did **not** change: the numbers, the symbol name and the literal error message.
Negations, numbers, versions, code blocks and error messages are safety locks — compression
never touches them.

The level comes from the phase: `off` in `BRAINSTORM`, `leve` (light) in `SPEC` and `PLAN`,
`pleno` (full) in `EXECUTE`, `REVIEW` and `FIX`. Legacy `enxuto` state does not override it.

Hooks also compact context automatically by prioritized blocks. This does not summarize
text and falls back to the full context whenever validation fails.

## Companions

None is required. **The pipeline completes end to end with zero companions installed** —
every phase carries its own instructions, and detection is silent: no error, no warning, no
prompt to install.

| Companion | Where it helps |
|---|---|
| `superpowers` | `BRAINSTORM`, `PLAN`, `EXECUTE` |
| `ponytail` | `EXECUTE`, `FIX` — keeps the diff minimal; `DONE` — optional simplification audit |
| `context7` (MCP) | `SPEC`, `PLAN` — up-to-date library docs |
| `playwright` (MCP) | `EXECUTE`, `REVIEW` — verify in a real browser |

Only packages that install in nearly every agent make this list: an MCP server, or a repo
shipping multi-agent adapters. A tool tied to a single agent creates a pipeline that breaks
when you switch tools — the very problem this package exists to solve.

### Optional audit

After a clean `REVIEW/FIX`, the agent may offer a consultative simplification audit. It uses
`ponytail-audit` when already available, or the built-in instructions otherwise. The
optional output is `.stilo/cleanup-NN.md`, with evidence, risk, minimal removal and a
verification path for each suggestion. The audit never deletes, moves or edits files, never
installs a companion, and never blocks `DONE`.

## Language

The source is entirely in Portuguese. The ruleset instructs the agent to **reply in the
language you write in** — write in English, get English back.

## Development

```bash
npm test          # node --test, zero dependencies
npm run sync      # regenerates the adapters from AGENTS.md
node scripts/sync-adapters.js --check   # fails if any adapter drifted
```

`AGENTS.md` is the single source of truth for the ruleset. The six per-agent rule files are
generated, never hand-edited — a test fails if they drift.

The checkout and the installed plugin copy are separate states. After changing the
checkout, run `claude plugin validate .`; `claude plugin details stilo-code@stilo-code`
shows the active copy. The installation receives changes only after an authorized install
or update.

The instruction test monitors a 22,000-character budget for the seven nominal phase
contexts. Ambiguities with many projects add text proportionally and remain reported by
the diagnostic. `UserPromptSubmit` still uses a short state line; `SessionStart` and
`SubagentStart` load the ruleset needed to keep `AGENTS.md` self-contained.

## License

MIT © Luiz Gabriel De Marchi Nascimento
