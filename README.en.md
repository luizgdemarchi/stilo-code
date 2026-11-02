# Stilo Code

**A project pipeline that picks up where it left off.** Stilo Code is a plugin for Claude
Code and Codex that stores each project's phase on disk and guides the agent to record
decisions in the workflow documents. Its hooks read that state automatically, so the agent
can resume work in a new session or after clearing the context with `/clear`.

*[Português](README.md) — the source language of this repository.*

## What Stilo Code does

Stilo guides work through clear stages: understand the request before proposing a
solution, record what should be done, plan how to do it, execute with tests first, review
the implementation, and fix its findings. A separate editorial phase then reviews the text
changed in the cycle and records minimal edits. It preserves the writer's voice and does not
try to infer whether AI wrote the text. At the end, the agent offers to merge, open a PR,
keep the branch, or discard it, and does none of these without your choice.

```text
BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → EDITORIAL_REVIEW ⇄ EDITORIAL_FIX → DONE
```

Each project has a `.stilo/state.json` file with its current phase, the active cycle, and
separate technical and editorial review counters. Each request is a cycle, with its
documents in `docs/ciclos/<cycle>/`: `spec.md` and `plan.md`, plus `design.md` when a user
interface is in scope. A small change (up to 3 files, no new dependency, nothing touching
security, persisted data, or a public contract) can take the short track, with a single
`ciclo.md` approved once; no phase is skipped. When work resumes, the agent checks the state
and the project files before continuing. Conversation context is not the only source of
continuity.

## How it works

The plugin hooks identify the project and inject the core rules, the state, and the current
phase's modules when a session starts. When the phase changes mid-session, the next message
carries the new phase's modules; the record of which phase was already injected lives in the
plugin's data directory, outside the project. Subagents receive a reduced context with their
role and the phase essentials. Messages beginning with `/` follow the same path; Stilo does
not interpret prompts as commands that change files.

The core is in [`AGENTS.md`](AGENTS.md), and each phase's instructions are in `modules/`.
Stilo has no public commands or invocable skills: after installation, its instructions are
injected automatically.

## Measuring token use

```text
node scripts/medir-tokens.js <transcript.jsonl|folder> [--json]
```

The script reads Claude Code transcripts and Codex sessions and reports the number of model
calls, input, cache, and output tokens, and the output size of each tool. Run the same
request before and after a change to compare.

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

Companions such as `ponytail`, `context7`, and `playwright` are optional. The pipeline
works without them.

For local development, `npm test` runs the project tests. The installed plugin copy is
separate from this checkout; local changes reach the host only after an authorized install
or update.

Hosts cache the plugin by version. Contributors who change a distributed file (`AGENTS.md`,
`modules/`, `hooks/`, `scripts/`, manifests) bump the version in all three manifests
(`package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`) and, in
`DONE`, right before publishing, record the release with
`node scripts/verificar-publicacao.js --registrar` and check it with
`npm run verificar-publicacao`. The check fails when content changed and the version did
not, so the record waits until after the last `FIX`.

## License

MIT © Luiz Gabriel De Marchi Nascimento

Parts of the instructions were adapted from the superpowers plugin by Jesse Vincent (MIT)
and from an Anthropic interface design skill (Apache-2.0). Notices and licenses are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
