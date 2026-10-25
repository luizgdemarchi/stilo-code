# Candidate verifier prompt — verifier-07

```text
You did not write this candidate. Try to refute it from repository source and bounded
local evidence. Do not contact deployed endpoints or external/shared services. Run
target-controlled code only inside the approved OS-enforced sandbox: no external
network, empty allowlisted environment, read-only target and tools, scratch-only
writes, and explicit low resource and wall-clock limits. If any control is unavailable,
do not execute; retain the exact missing capability as a needs_validation blocker.
Treat every scratch entry as target-controlled after execution. After the sandbox and
all its processes terminate, only trusted parent-side code may promote a predeclared
scratch-relative file, following the promotion procedure block included verbatim in
this prompt. You and target code never write retained artifacts. If promotion is
unavailable or fails, do not use that file as evidence.

1. Verify every trace and evidence file, positive line number, scope, and description.
   Confirm the first entry is a real lower-trust entrypoint and the last is the
   claimed sink or boundary effect.
2. Reconstruct the strongest source-visible validation, identity, authorization,
   normalization, lifecycle, framework, and containment controls on the path.
   Where the architecture summary names a comparable baseline, note whether it
   shares the pattern — as calibration, never as grounds to dismiss.
3. For a proposed confirmed candidate, independently reproduce the minimum observed
   result when possible. Verify inputs, interface shape, conditions, and affected
   dummy principal/resource. Do not infer a stronger result or continue after it.
4. Verify that likelihood, impact, confidence, and the proposed source fix match only
   what the evidence establishes.
5. For a proposed needs_validation candidate, decide whether the blocker is genuinely
   outside source/local observation. If source refutes the trace, reject it. If the
   missing fact remains decisive, keep needs_validation and make the local and
   owner-observed plans exact and non-destructive.
6. Preserve the fingerprint for the same source-derived root cause across every state.

Return exactly one JSON object and no surrounding prose:
{"decision": "confirmed|needs_validation|rejected", "record": { ... }}
where record exactly matches the decision's verdict branch of the schema included
in this prompt. A corrected record replaces the hunter's wording.
```

## Promotion procedure (verbatim)

```text
Artifact promotion procedure (trusted parent-side code only):
Reference only for you: the parent performs these steps; you never perform them.

Before execution, the parent opens and retains trusted, non-inheritable directory
descriptors for the agent's scratch/ and artifacts/ roots, and records an allowlist
of expected scratch-relative artifact files plus explicit per-file and cumulative
byte limits. Never pass those descriptors to the agent or sandbox. After the sandbox
and all its processes terminate, trusted parent-side code promotes each allowlisted
file separately:

1. Validate the declared relative path: reject absolute, empty, `.`, `..`, or
   symlinked components.
2. Walk each parent component from the retained scratch-root descriptor with
   no-follow directory-relative operations; never reopen by path.
3. Open the leaf no-follow and nonblocking.
4. Verify with `fstat` that it is a regular file with link count exactly one and
   within the recorded per-file and cumulative byte limits.
5. Enforce those limits again while reading from that descriptor.
6. Copy exactly the verified size, repeat `fstat`, and reject a changed identity,
   type, link count, or size.
7. For the destination, walk every parent component from the retained
   artifacts-root descriptor with no-follow directory-relative operations; require
   each existing component to be a real directory, and create any missing directory
   exclusively before reopening and verifying it no-follow.
8. Create the leaf exclusively without following links, verify that the opened
   destination is a regular file with link count exactly one, and copy from the
   verified source descriptor without reopening either path.
9. Use equivalent race-safe APIs on non-POSIX systems.
10. Never recursively copy or glob scratch, extract an archive into artifacts, or
    open or promote a symlink, FIFO, socket, device, directory, hard-linked file,
    changing file, or file that exceeds its bound.
11. If any check is unavailable, cannot be enforced, or fails, discard the scratch
    entry; if it is decisive evidence, retain `needs_validation` with the exact
    promotion blocker.
```

## Candidate (as proposed by the hunter; you did not write it)

```json
{
  "proposed_verdict": "needs_validation",
  "fingerprint": "hooks/stilo-instructions.js:blocoEstado:write-repair-directive-to-unverified-state-identity",
  "title": "Injected 'fix/write .stilo/state.json' directives can steer the agent to overwrite a user file outside the project through a repository-planted symlink",
  "description": "A third-party repository can ship .stilo/state.json (or the .stilo directory) as a symlink to a file outside the project. Examples are a JSON config such as ~/.claude/settings.json or ~/.docker/config.json, which lands in the 'invalid' branch, or any non-JSON dotfile, which lands in the 'unreadable' branch. Discovery accepts the link because fs.existsSync follows it. The hooks then inject a protected plugin-state block that names the in-project link path as the 'Arquivo'. The block tells the agent, as high-authority plugin instructions, that it must correct all fields of state.json (invalid) or fix the file (unreadable) before doing anything else. Every subsequent prompt repeats 'nÃ£o avance nem aja atÃ© corrigir o arquivo'. The valid branch also tells the agent to write the next phase into .stilo/state.json. If the agent's write tool follows the link, the user's file outside the project is overwritten or edited with Stilo state JSON. The agent's tool-permission system is the only remaining gate.",
  "claimed_root_cause": "Neither hooks/stilo-state.js#findStateFiles nor resolveProjeto checks the identity of the discovered state path before blocoEstado/buildStateLine tell the agent to write or repair it. There is no lstat or no-follow check on the .stilo component or the state.json leaf, no realpath containment inside the project directory and no isFile check. Discovery uses only fs.existsSync, which follows links. The injected text then shows the unresolved link path, so the agent and the user cannot see that the write target lies outside the project.",
  "trace": [
    {
      "kind": "entrypoint",
      "file": "hooks/stilo-activate.js",
      "line": 9,
      "scope": "SessionStart hook",
      "description": "resolveProjeto(process.cwd()) runs on the opened, possibly cloned, project directory. stilo-subagent.js:8 and stilo-prompt.js:45 do the same for SubagentStart and UserPromptSubmit."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-state.js",
      "line": 87,
      "scope": "findStateFiles",
      "description": "Candidate <dir>/.stilo/state.json is accepted with fs.existsSync(p), which follows symlinks. A symlinked .stilo directory or state.json leaf whose target exists is returned as the active path, with no lstat or containment check (same at :108 for the one-level scan)."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-state.js",
      "line": 284,
      "scope": "resolveProjeto",
      "description": "readStateResult(statePath) reads through the link (readFileSync at :132). A non-JSON target gives status 'unreadable' (:285-286). A JSON object missing the state fields gives 'invalid' (:289-291). statePath keeps the lexical link path."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-instructions.js",
      "line": 210,
      "scope": "blocoEstado",
      "description": "Shows '- **Arquivo:** <link path>' inside the protected '## Estado do Stilo Code' block, the unresolved in-project-looking path."
    },
    {
      "kind": "sink",
      "file": "hooks/stilo-instructions.js",
      "line": 234,
      "scope": "blocoEstado",
      "description": "Directs the agent: 'NÃ£o avance nem aja no projeto atÃ© corrigir todos os campos do `state.json`.' The unreadable branch at :217 says 'Corrija o `state.json` antes de agir.', the valid branch at :290 says 'grave vocÃª mesmo a fase seguinte em `.stilo/state.json`', and buildStateLine at :176/:183 repeats this on every prompt. The agent's file-write tool is the effect sink."
    }
  ],
  "evidence": [
    {
      "file": "hooks/stilo-state.js",
      "line": 87,
      "description": "if (fs.existsSync(p)) return [p]; is the only acceptance test for the discovered state path, and it follows symlinks."
    },
    {
      "file": "hooks/stilo-state.js",
      "line": 105,
      "description": "The one-level scan rejects symlinked subdirectories through Dirent.isDirectory(), but it never checks the .stilo component or the state.json leaf. This shows the identity check is partial, not absent by design."
    },
    {
      "file": "hooks/stilo-state.js",
      "line": 132,
      "description": "readStateResult reads statePath with fs.readFileSync, following links. There is no lstat, isFile or realpath containment check before the status is decided."
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 217,
      "description": "Unreadable branch: 'NÃ£o crie nem reinicie o projeto. Corrija o `state.json` antes de agir.' A repair directive for a file whose identity was never checked."
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 234,
      "description": "Invalid branch: 'NÃ£o avance nem aja no projeto atÃ© corrigir todos os campos do `state.json`.' A link to any JSON-object file outside the project reaches it."
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 290,
      "description": "Valid branch: 'Ao concluir esta fase, grave vocÃª mesmo a fase seguinte em `.stilo/state.json`.'"
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 183,
      "description": "buildStateLine re-injects 'state.json invÃ¡lido em <link path> ... nÃ£o avance nem aja atÃ© corrigir o arquivo' on every user prompt."
    },
    {
      "file": "hooks/stilo-diagnostics.js",
      "line": 13,
      "description": "The only file-type check in the codebase (statSync().isFile()) follows links and is not wired into any hook. Even it would accept a symlink to a regular file outside the project."
    },
    {
      "file": "AGENTS.md",
      "line": 99,
      "description": "The injected ruleset makes writing state.json the agent's responsibility at each phase transition, with no symlink or containment precondition."
    }
  ],
  "blockers": [
    "Host write-tool behavior is not source-visible. It is unknown whether Claude Code's Write/Edit tools (and Codex's apply_patch/shell writes) follow a symlink at .stilo/state.json or a symlinked .stilo directory. It is also unknown whether their permission check resolves the real target path, so that a target outside the working directory triggers an out-of-workspace prompt or denial, or uses the lexical in-project path and auto-allows the write.",
    "Checkout behavior is a platform fact. git creates tracked symlinks on POSIX clones, but on Windows only with core.symlinks=true and symlink privilege (Developer Mode or admin). The host here is Windows, where a default clone would check the link out as a plain text file. That gives 'unreadable' with no outside-project write.",
    "Agent behavior is not deterministic. Whether the model, after reading the link target's content (which the tool shows), actually writes or edits the file rather than reporting the anomaly needs an owner-observed run.",
    "No OS-enforced sandbox is available on this host, so no hook or target code was executed. Whether a symlinked state.json reaches the 'invalid' or 'unreadable' injected block was established from source only."
  ],
  "validation_plan": {
    "local": "In a disposable sandbox (POSIX VM or container, no network, dummy HOME) create /tmp/home/dummy-config.json containing {\"keep\":true}. Create a project dir with .stilo/state.json as a symlink to /tmp/home/dummy-config.json. Run `node hooks/stilo-activate.js` with cwd set to the project and STILO_HOME pointing to scratch. Confirm the output contains '## Estado do Stilo Code', '**Arquivo:** <project>/.stilo/state.json', '**Estado:** invÃ¡lido' and 'corrigir todos os campos do `state.json`'. Repeat with the link pointing at a non-JSON dummy file and confirm the 'ilegÃ­vel' / 'Corrija o `state.json`' block. Regression after the fix: the hook must report the path as refused (symlink or outside the project) and emit no write or repair directive.",
    "deployment": "Owner-observed, with a dummy HOME. Open a Claude Code session, and separately a Codex session, on a project whose .stilo/state.json is a symlink to a dummy JSON file outside the working directory. Ask the agent to proceed. Record whether the write tool asks for out-of-workspace permission (and which path the prompt names: link or resolved target), denies the write, or modifies the dummy target file. Check whether the dummy file content changed."
  }
}
```

## Linked coverage-unit checks and artifact paths

Artifact paths are relative to C:\Users\luizg\security-audit-skill\stilo-code\run-1\ and may be read.

```json
[
  {
    "coverage_id": "hooks%2Fstilo-instructions.js%23blocoEstado::hooks%2Fstilo-state.js%23findStateFiles::hooks::ATTACK-CLASSES.md%23Resource%20and%20file%20handling",
    "assignment_owner": "hunter-writeback",
    "checks": [
      {
        "agent_id": "hunter-writeback",
        "reviewed_paths": [
          "hooks/stilo-state.js"
        ],
        "invariant": "findStateFiles/resolveProjeto verify that the discovered .stilo/state.json (and its .stilo parent) is a non-symlink regular file whose real path lies inside the project before it becomes the active state path",
        "method": "source",
        "result": "Not enforced. findStateFiles accepts a candidate with fs.existsSync(p) only (hooks/stilo-state.js:87 upward walk, :108 one-level scan). existsSync follows symlinks, so a symlinked .stilo directory or state.json is accepted as long as the target exists. The one-level scan skips symlinked subdirectories (Dirent.isDirectory at :105), but it does not check the .stilo component or the state.json leaf. resolveProjeto (:278-294) then passes the lexical link path to readStateResult (:132, fs.readFileSync, which also follows links) and stores it as statePath. No lstat, realpath, containment check or isFile check exists on this path. The only sibling with a file-type check is stilo-diagnostics.js#fileCheck (statSync().isFile(), which follows links and is not wired into the hooks). No hook calls writeJsonAtomic/writeState.",
        "artifact": null
      },
      {
        "agent_id": "hunter-writeback",
        "reviewed_paths": [
          "hooks/stilo-instructions.js",
          "hooks/stilo-activate.js",
          "hooks/stilo-subagent.js",
          "hooks/stilo-prompt.js"
        ],
        "invariant": "injected text that tells the agent to write, repair or correct the state file refers only to a verified in-project regular file, and shows its resolved identity",
        "method": "source",
        "result": "Not enforced. SessionStart and SubagentStart (stilo-activate.js:9-11, stilo-subagent.js:8-9) and UserPromptSubmit (stilo-prompt.js:45-46) inject these write directives inside the protected '## Estado do Stilo Code' block or the per-prompt line. Unreadable: 'Corrija o `state.json` antes de agir.' (stilo-instructions.js:217, :176). Invalid: 'Não avance nem aja no projeto até corrigir todos os campos do `state.json`.' (:226, :234, :181, :183). Valid: 'Ao concluir esta fase, grave você mesmo a fase seguinte em `.stilo/state.json`.' (:290). The path shown as '**Arquivo:**' (:210) is the lexical link path from discovery, never the resolved target. A link pointing outside the project therefore looks like an ordinary in-project file. The unreadable and invalid branches are reachable with any existing link target: a non-JSON file gives 'unreadable', and a JSON object without the state fields gives 'invalid'.",
        "artifact": null
      },
      {
        "agent_id": "hunter-writeback",
        "reviewed_paths": [
          "AGENTS.md",
          "hooks/stilo-instructions.js"
        ],
        "invariant": "the injected ruleset that tells the agent to write .stilo/state.json carries an identity precondition (refuse symlinks, links that resolve outside the project, or non-regular files)",
        "method": "source",
        "result": "Absent. AGENTS.md:99-107 (§3, injected verbatim by buildFullContext at stilo-instructions.js:298) tells the agent to write the file at each phase transition, with no symlink or containment caveat. AGENTS.md:67 only requires a conservative check of symlinks for task file-set disjointness. The unwired buildCheckpointNote(statePath, true) branch ('Crie um objeto JSON', :78-81) has no caller in hooks (only :286 with orientarAusente=false), so the checkpoint-creation directive is not live.",
        "artifact": null
      }
    ]
  }
]
```

## Architecture facts (architecture.md)

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

## Relevant companion validation blocks (verbatim)

- none (ordinary attack class only)

## Source/local execution boundary for this run

Target repository (read-only): C:\Users\luizg\Documents\claude code\stilo-code at commit 6f01438. This host has NO OS-enforced sandbox (no WSL2, Docker or Windows Sandbox) and no no-follow descriptor APIs, so safe promotion of scratch files is unavailable. Do not execute any target-controlled code, test, hook or script. Your own scratch directory is C:\Users\luizg\security-audit-skill\stilo-code\run-1\agents\verifier-07\scratch\ and you should not need it. The parent ran one platform probe that executed no repository code; where linked above, its artifact is agents/parent-probe/artifacts/cwd-resolution-probe.json and you may rely on it as parent-promoted evidence after reading it. Facts about Claude Code/Codex hook processes (cwd, environment, trust prompts) and model behavior are host facts not observed in this run.

## Prior records with the same fingerprint

None (first run).

## Schema branches (verbatim from report-schema.json)

The record you return must match exactly the branch for your decision (additionalProperties is false; the record includes "verdict").

```json
{
  "confirmed": {
    "type": "object",
    "description": "A source-grounded vulnerability that was independently demonstrated.",
    "properties": {
      "verdict": {
        "type": "string",
        "const": "confirmed"
      },
      "fingerprint": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$",
        "description": "A stable source-derived identifier that does not change between validation states."
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "description": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "root_cause": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "intended_behavior": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "trace": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "kind": {
              "type": "string",
              "enum": [
                "entrypoint",
                "propagation",
                "sink"
              ]
            },
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "scope": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "kind",
            "file",
            "line",
            "scope",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "evidence": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "file",
            "line",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "conditions": {
        "type": "array",
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "kind": {
              "type": "string",
              "enum": [
                "authentication_level",
                "authorization_role",
                "user_interaction",
                "system_configuration",
                "network_routing",
                "environmental_dependency",
                "data_state",
                "timing_dependency",
                "third_party_dependency"
              ]
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "kind",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "execution": {
        "type": "object",
        "description": "Target-neutral reproduction in the target's native interface.",
        "properties": {
          "attacker_perspective": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "payloads": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          },
          "instructions": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "observed_result": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          }
        },
        "required": [
          "attacker_perspective",
          "payloads",
          "instructions",
          "observed_result"
        ],
        "additionalProperties": false
      },
      "remediation": {
        "type": "object",
        "properties": {
          "strategy": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "code_changes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "file_name": {
                  "type": "string",
                  "minLength": 1
                },
                "fixed_code": {
                  "type": "string"
                }
              },
              "required": [
                "file_name",
                "fixed_code"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "strategy"
        ],
        "additionalProperties": false
      },
      "severity": {
        "type": "object",
        "properties": {
          "likelihood": {
            "type": "object",
            "properties": {
              "score": {
                "type": "string",
                "enum": [
                  "informational",
                  "low",
                  "medium",
                  "high",
                  "critical"
                ]
              },
              "reason": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              }
            },
            "required": [
              "score",
              "reason"
            ],
            "additionalProperties": false
          },
          "impact": {
            "type": "object",
            "properties": {
              "score": {
                "type": "string",
                "enum": [
                  "informational",
                  "low",
                  "medium",
                  "high",
                  "critical"
                ]
              },
              "reason": {
                "type": "string",
                "minLength": 1,
                "visibleContent": true
              }
            },
            "required": [
              "score",
              "reason"
            ],
            "additionalProperties": false
          },
          "overall_severity": {
            "type": "string",
            "enum": [
              "informational",
              "low",
              "medium",
              "high",
              "critical"
            ]
          }
        },
        "required": [
          "likelihood",
          "impact",
          "overall_severity"
        ],
        "additionalProperties": false
      },
      "confidence": {
        "type": "object",
        "properties": {
          "score": {
            "type": "string",
            "enum": [
              "low",
              "medium",
              "high"
            ]
          },
          "reason": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          }
        },
        "required": [
          "score",
          "reason"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "verdict",
      "fingerprint",
      "title",
      "description",
      "root_cause",
      "intended_behavior",
      "trace",
      "evidence",
      "conditions",
      "execution",
      "remediation",
      "severity",
      "confidence"
    ],
    "additionalProperties": false
  },
  "needs_validation": {
    "type": "object",
    "description": "A source-grounded candidate whose decisive validation is blocked.",
    "properties": {
      "verdict": {
        "type": "string",
        "const": "needs_validation"
      },
      "fingerprint": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "description": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "claimed_root_cause": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "trace": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "kind": {
              "type": "string",
              "enum": [
                "entrypoint",
                "propagation",
                "sink"
              ]
            },
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "scope": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "kind",
            "file",
            "line",
            "scope",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "evidence": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "file",
            "line",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "blockers": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "string",
          "minLength": 1,
          "visibleContent": true
        }
      },
      "validation_plan": {
        "type": "object",
        "properties": {
          "local": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          },
          "deployment": {
            "type": "string",
            "minLength": 1,
            "visibleContent": true
          }
        },
        "additionalProperties": false
      }
    },
    "required": [
      "verdict",
      "fingerprint",
      "title",
      "description",
      "claimed_root_cause",
      "trace",
      "evidence",
      "blockers",
      "validation_plan"
    ],
    "additionalProperties": false
  },
  "rejected": {
    "type": "object",
    "description": "A source-grounded candidate refuted during validation.",
    "properties": {
      "verdict": {
        "type": "string",
        "const": "rejected"
      },
      "fingerprint": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$"
      },
      "title": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "description": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "claimed_root_cause": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      },
      "trace": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "kind": {
              "type": "string",
              "enum": [
                "entrypoint",
                "propagation",
                "sink"
              ]
            },
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "scope": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "kind",
            "file",
            "line",
            "scope",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "evidence": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "properties": {
            "file": {
              "type": "string",
              "minLength": 1
            },
            "line": {
              "type": "integer",
              "minimum": 1
            },
            "description": {
              "type": "string",
              "minLength": 1,
              "visibleContent": true
            }
          },
          "required": [
            "file",
            "line",
            "description"
          ],
          "additionalProperties": false
        }
      },
      "reason": {
        "type": "string",
        "minLength": 1,
        "visibleContent": true
      }
    },
    "required": [
      "verdict",
      "fingerprint",
      "title",
      "description",
      "claimed_root_cause",
      "trace",
      "evidence",
      "reason"
    ],
    "additionalProperties": false
  }
}
```
