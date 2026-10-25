# Stilo Code

**A project pipeline that picks up where it left off.** Stilo Code is a plugin for Claude
Code and Codex that stores each project's phase on disk and guides the agent to record
decisions in the workflow documents. Its hooks read that state automatically, so the agent
can resume work in a new session or after clearing the context with `/clear`.

*[Português](README.md) — the source language of this repository.*

## What Stilo Code does

Stilo guides work through clear stages: understand the request before proposing a
solution, record what should be done, plan how to do it, execute, and review. Execution
starts only after the spec and plan are approved. If the review finds problems, the agent
fixes them and reviews again.

```text
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE
```

Each project has a `.stilo/state.json` file with its current phase and review number. When
present, the spec, plan, review, and checkpoint documents preserve decisions and evidence.
When work resumes, the agent checks this state and the project files before continuing.
Conversation context is not the only source of continuity.

## How it works

The plugin hooks identify the project and inject its instructions and state into sessions,
messages, and subagents. The agent follows the pipeline and records phase transitions in
the project files. Messages beginning with `/` follow the same path; Stilo does not
interpret prompts as commands that change files.

The complete ruleset is in [`AGENTS.md`](AGENTS.md). Stilo has no public commands or
invocable skills: after installation, its instructions are injected automatically.

## Supported hosts

- **Claude Code:** installs the `SessionStart`, `UserPromptSubmit`, and `SubagentStart` hooks.
- **Codex:** uses `.codex-plugin/plugin.json` and the same shared hooks.

Stilo Code supports these two hosts.

## Installation

### Claude Code

```text
/plugin marketplace add luizgdemarchi/stilo-code
/plugin install stilo-code@stilo-code
```

### Codex

Clone this repository and point Codex to it. The hooks manifest is at
`.codex-plugin/plugin.json`.

## Details and development

- [Resumption and GitHub CLI setup](docs/preparacao-github-cli.md)
- [Agent evaluations](docs/avaliacao-agente.md)
- [Acceptance criteria](docs/aceite.md)

Companions such as `superpowers`, `ponytail`, `context7`, and `playwright` are optional.
The pipeline works without them. `AGENTS.md` is the source of the rules; modules in
`modules/` provide details for phases that need specific instructions.

For local development, `npm test` runs the project tests. The installed plugin copy is
separate from this checkout; local changes reach the host only after an authorized install
or update.

## License

MIT © Luiz Gabriel De Marchi Nascimento
