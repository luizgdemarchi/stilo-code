# Coverage critic — post-wave 2 (critic-wave2)

Role: fresh read-only research coverage critic for a defensive audit of the user's own repository C:UsersluizgDocumentsclaude codestilo-code (commit 6f01438). You read source but do not write files or run target code. You propose coverage, not findings.

## architecture.md (verbatim)

# Architecture — stilo-code @ 6f01438 (run-1, standard profile)

## 1. Product, principals, authority, resources

Stilo Code is a Claude Code / Codex plugin (Node.js CommonJS, zero dependencies) that runs a
project pipeline (BRAINSTORM → SPEC → PLAN → EXECUTE → REVIEW ⇄ FIX → DONE) stored in
`<project>/.stilo/state.json`. Three lifecycle hooks (hooks/claude-codex-hooks.json) run as the
user's OS account with no sandbox: SessionStart → hooks/stilo-activate.js, UserPromptSubmit →
hooks/stilo-prompt.js, SubagentStart → hooks/stilo-subagent.js (5 s host timeout). They read
files and write text into the AI agent's context (hooks/stilo-runtime.js#writeHookOutput).

Principals:
- **User / operator** (trusted): installs the plugin, owns `~/.stilo` and the plugin directory.
- **Plugin files** (trusted at install time): AGENTS.md and modules/*.md read from
  `CLAUDE_PLUGIN_ROOT` or `__dirname/..` (hooks/stilo-instructions.js#pluginRoot) and injected
  verbatim as high-authority instructions.
- **Project directory contents** (lower trust when the project is a third-party clone):
  `.stilo/state.json` (all hooks) and `.stilo/checkpoint.json` (SessionStart, SubagentStart) are
  parsed, validated and injected into the agent's context; the code comments at
  hooks/stilo-instructions.js:19-21 and :51-54 acknowledge the repo-local origin. Discovery walks
  up from cwd without a home/repo boundary, then scans one level down (hooks/stilo-state.js#findStateFiles).
- **Hook host input** (trusted host): stdin JSON; only UserPromptSubmit reads it and uses only
  `data.cwd` (hooks/stilo-prompt.js#diretorio). Environment: CLAUDE_PLUGIN_ROOT, PLUGIN_DATA,
  STILO_HOME, ProgramFiles (same principal as the user).
- **AI agent / model** (consumer): receives injected text; its host tool-permission system is the
  only gate on actions the text suggests (e.g. running scripts/setup-github-cli.js).
- **Evaluated agent output** (lower trust, developer tooling): scripts/evaluate-harness.js runs a
  copy's `src/records.js` in `node:vm` (header states "VM limita tempo, não é sandbox").

Protected resources: the user's account (code execution, files, credentials reachable from the
shell), the integrity of the agent's instructions/state, `~/.stilo/setup` lock/receipt, installed
software (GitHub CLI via package managers).

## 2. Comparable baseline

No source-grounded comparable. The hook I/O contract (docs/contrato-hooks.md) is derived from the
ponytail plugin; no library dependencies exist.

## 3. Stack, deployment paths, offline limits

Node >= 20 (host: 24.19.0, Windows 11 ARM64). Deployment: Claude Code marketplace
(.claude-plugin/marketplace.json, `source: "./"`) and Codex (.codex-plugin/plugin.json); both use
hooks/claude-codex-hooks.json (POSIX `command` and PowerShell `commandWindows` guarded by
`Get-Command node`). Tests: `node --test tests/all.test.js`. **No OS-enforced sandbox exists on the
host** (no WSL2, Docker, Windows Sandbox; no O_NOFOLLOW/openat for safe promotion), so
target-controlled code is not executed in this run; decisive runtime facts become needs_validation.

## 4. Entry surfaces and source-to-sink paths

1. Project files → context: findStateFiles → readStateResult/validateState (hooks/stilo-state.js)
   → sanitiza (whitespace collapse + truncation only; hooks/stilo-instructions.js:55-61) →
   buildStateLine (every prompt), blocoEstado/buildCheckpointNote (SessionStart, SubagentStart) →
   selectContextBlocks (budget 19,500; protected blocks; full-context fallback) → stdout.
   Injected fields: project (120), invalid phase (120), statePath (200), error/errors, updated (40),
   checkpoint task (120), phase (120), nextAction (240, rendered as "próxima:"), pending (300).
2. SessionStart probe: hooks/stilo-setup.js#probeGitHubCli → `spawnSync('gh.exe'|'gh',
   ['--version'], {shell:false})` with the hook's cwd (the opened project) and inherited env;
   bare-name resolution. On ENOENT and no lock/receipt it injects buildSetupNote telling the agent
   to run `node <pluginRoot>/scripts/setup-github-cli.js`.
3. scripts/setup-github-cli.js (agent-run): bare-name spawns of gh, winget.exe, brew, apt-get,
   apt-cache, dnf, id with inherited env and cwd; lock (`wx`) and receipt (tmp + rename) under
   `$STILO_HOME/setup` or `~/.stilo/setup`; install timeout 180 s.
4. scripts/evaluate-harness.js: refuses the original fixture and symlinks, hashes the copy, runs its
   `src/records.js` in node:vm (1 s timeout) and evaluates fixed expressions.
5. scripts/validate-plan.js: parses a markdown plan path from argv with line regexes and graph
   algorithms; prints only.
6. Not wired: hooks/stilo-diagnostics.js#diagnoseProject and buildDoctorReport (tests only);
   stilo-state.js writers (writeState, writeCheckpoint, writeCycle, setOff) have no hook caller.

## 5. Trust boundaries and strongest controls

- Repo-controlled text → agent instructions: validateState / validateCheckpoint enums and types;
  sanitiza strips newlines (prevents block-marker injection) but not instruction-like content;
  protected "## Estado do Stilo Code" block frames it as plugin state.
- Untrusted cwd → executable resolution: `shell:false` only; no absolute path, no PATH/cwd
  hardening in the hook probe or in realRun.
- Evaluated copy → harness host: node:vm with timeout only.
- Local state dir: exclusive-create lock and tmp file; receipt status whitelist.
- Plugin distribution: marketplace source "./" (repository root); no integrity check of injected files.

## 6. Starting paths

hooks/stilo-state.js, hooks/stilo-instructions.js, hooks/stilo-context.js, hooks/stilo-setup.js,
hooks/stilo-runtime.js, hooks/stilo-activate.js, hooks/stilo-prompt.js, hooks/stilo-subagent.js,
hooks/claude-codex-hooks.json, scripts/setup-github-cli.js, scripts/evaluate-harness.js,
scripts/validate-plan.js, .claude-plugin/, .codex-plugin/, AGENTS.md, modules/.

## 7. Prior coverage

No prior run or ledger exists for this repository (first run).

## 8. Companion selection

- AI-AND-LLM.md: repo-derived text injected into agent context (indirect injection, provenance
  confusion), sub-agent inheritance via SubagentStart, agent directed to run an installer.
- DESKTOP-MOBILE-AND-LOCAL-IPC.md: install path trust (gh probe and package-manager spawns from an
  untrusted cwd), local file ownership/TOCTOU of the setup lock/receipt.
- SUPPLY-CHAIN-AND-RELEASE.md: plugin and extension trust expansion through the marketplace/hooks.
- RESOURCE-EXHAUSTION-AND-AVAILABILITY.md: plan parser regexes/graph on repo-provided plans.
Excluded: WEB-PROTOCOL-AND-AUTH, CLIENT-SIDE, CLOUD-AND-DEPLOYMENT, PROTOCOLS-RPC-AND-MESSAGING,
DATA-ISOLATION-AND-LIFECYCLE, MEMORY-SAFETY-AND-BINARY (no such surfaces; JavaScript only).

## Coverage ledger (verbatim, including assignment block maps and evidence)

File: C:Usersluizgsecurity-audit-skillstilo-codeun-1coverage-ledger.json — read it in full.

## Current candidate fingerprints and states

```json
[
  {
    "fingerprint": "hooks/stilo-setup.js:probeGitHubCli:bare-name-gh-cwd-resolution",
    "proposed_verdict": "needs_validation",
    "title": "SessionStart gh probe may run a gh.exe planted in the opened project directory (Windows)",
    "state": "candidate (awaiting Phase 3)"
  },
  {
    "fingerprint": "scripts/setup-github-cli.js:realRun:bare-name-installer-cwd-resolution",
    "proposed_verdict": "needs_validation",
    "title": "Agent-run GitHub CLI installer may run a project-planted winget.exe or gh.exe (Windows)",
    "state": "candidate (awaiting Phase 3)"
  },
  {
    "fingerprint": "hooks/stilo-state.js:findStateFiles:unbounded-ancestor-walk",
    "proposed_verdict": "needs_validation",
    "title": "Project discovery walks above the user's/repository's boundary, letting a state.json in a shared ancestor directory (e.g. C:\\.stilo) become the active project",
    "state": "candidate (awaiting Phase 3)"
  },
  {
    "fingerprint": "hooks/stilo-instructions.js:sanitiza/repo-free-text-injected-without-provenance-label",
    "proposed_verdict": "needs_validation",
    "title": "Repository-authored checkpoint/state text is auto-injected as plugin-authored 'próxima:' state with no provenance label",
    "state": "candidate (awaiting Phase 3)"
  },
  {
    "fingerprint": "hooks/stilo-state.js:readJsonObject:unbounded-readFileSync-checkpoint-special-file",
    "proposed_verdict": "needs_validation",
    "title": "SessionStart/SubagentStart hooks read a repo-controlled .stilo/checkpoint.json without refusing symlinks, special files or large sizes",
    "state": "candidate (awaiting Phase 3)"
  },
  {
    "fingerprint": "hooks/stilo-state.js:readStateResult:unbounded-readFileSync-state-special-file",
    "proposed_verdict": "needs_validation",
    "title": "Per-prompt state.json read follows a repository-planted symlink to a device or FIFO, with no file-type or size check",
    "state": "candidate (awaiting Phase 3)"
  }
]
```

## Prior-ledger gap summary

No prior run or ledger exists for this repository (first run); no prior needs_validation or changed-source gaps.

## Context

This is the post-wave critic after wave 2. Wave 2 added two units proposed by the wave-1 critic (persistent memory poisoning; state.json read path). One unit discovered by a wave-2 hunter is already queued as planned for wave 3 (agent write-back into a possibly symlinked state.json); do not propose it again.

## What to check

Unmapped entry points, unchecked parallel paths, missing lifecycle modes, selected companion classes without a unit, unjustified exclusions (including the not_applicable diagnostics unit and the excluded companion files listed in architecture.md section 8), units closed without paths/checks, and prior needs_validation or changed-source gaps that no unit addresses. Reject anything outside the source/local boundary.

## Required output

Return exactly this JSON shape and nothing else (no prose, no fences). Use canonical block references in the form FILE.md#<exact class or section name>. stop is true only when you accept no missing_units and no reassign_ids.

```json
{
  "missing_units": [
    {
      "surface": "...",
      "boundary": "...",
      "subsystem": "...",
      "attack_class": "...",
      "starting_paths": ["repo/relative/path"],
      "selected_companion_blocks": ["FILE.md#section"],
      "excluded_blocks": [{"block": "FILE.md#section", "reason": "..."}],
      "reason": "source-backed coverage gap"
    }
  ],
  "reassign_ids": ["existing-id-that-did-not-close"],
  "resolved_prior_leads": ["fingerprint"],
  "stop": false
}
```
