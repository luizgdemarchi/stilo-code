# Candidate verifier prompt — verifier-05

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
  "fingerprint": "hooks/stilo-state.js:readJsonObject:unbounded-readFileSync-checkpoint-special-file",
  "title": "SessionStart/SubagentStart hooks read a repo-controlled .stilo/checkpoint.json without refusing symlinks, special files or large sizes",
  "description": "In a cloned repository with a valid .stilo/state.json, the SessionStart and SubagentStart hooks read the sibling .stilo/checkpoint.json with fs.readFileSync. They do not lstat it, require a regular file, refuse a symlink, or cap its size. On POSIX, git checks out a committed symlink such as .stilo/checkpoint.json -> /dev/zero (or a very large regular file). The hook would then try to buffer an endless or huge stream into memory until the host's 5 s timeout kills it. That would cost the user's machine a transient multi-GB memory spike at every session start and every subagent start, and silently drop the plugin's injected context. The impact is availability of the user's own workstation and of the plugin guidance. The size of the effect cannot be confirmed without execution.",
  "claimed_root_cause": "readJsonObject (hooks/stilo-state.js:202-209), used by readCheckpoint, passes a path taken from repo-controlled discovery straight to fs.readFileSync(filePath,'utf8'). There is no lstat/O_NOFOLLOW, no isFile() check and no byte limit. The only bound is the external 5 s hook timeout.",
  "trace": [
    {
      "kind": "entrypoint",
      "file": "hooks/stilo-activate.js",
      "line": 9,
      "scope": "SessionStart hook",
      "description": "resolveProjeto(process.cwd()) discovers <project>/.stilo/state.json in the opened (possibly third-party) clone; stilo-subagent.js:9 does the same on SubagentStart"
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-instructions.js",
      "line": 298,
      "scope": "buildFullContext",
      "description": "Called from buildInjectedContext (line 316), it builds the state block via blocoEstado(state, caminhos)"
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-instructions.js",
      "line": 286,
      "scope": "blocoEstado",
      "description": "For a valid state, calls buildCheckpointNote(caminhos.statePath, false)"
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-instructions.js",
      "line": 64,
      "scope": "checkpointPathFromState",
      "description": "Derives path.join(dirname(statePath),'checkpoint.json'), a repo-controlled filename that may be a committed symlink"
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-state.js",
      "line": 232,
      "scope": "readCheckpoint",
      "description": "Delegates to readJsonObject with no file-type or size precheck"
    },
    {
      "kind": "sink",
      "file": "hooks/stilo-state.js",
      "line": 204,
      "scope": "readJsonObject",
      "description": "fs.readFileSync(filePath,'utf8') follows symlinks and reads until EOF; for a device like /dev/zero there is no EOF"
    }
  ],
  "evidence": [
    {
      "file": "hooks/stilo-state.js",
      "line": 204,
      "description": "Unbounded readFileSync of the checkpoint path; the only guard is try/catch returning null"
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 286,
      "description": "Checkpoint read happens on every SessionStart/SubagentStart context build when state.json is valid"
    },
    {
      "file": "hooks/claude-codex-hooks.json",
      "line": 11,
      "description": "Host timeout of 5 s is the only bound on the read (also line 37 for SubagentStart)"
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 51,
      "description": "Code comment acknowledges .stilo content may come from a cloned repository (lower-trust input), but the control is only text sanitization, not file-type/size validation"
    },
    {
      "file": "scripts/evaluate-harness.js",
      "line": 132,
      "description": "Sibling code in the same repo refuses symlinks and special files via lstat, which shows the missing equivalent control in the hook readers"
    }
  ],
  "blockers": [
    "No OS-enforced sandbox on this host, so the hook could not be run against a dummy project whose checkpoint.json is a symlink to /dev/zero or a large file",
    "How fast Node >=20 fs.readFileSync grows memory on a non-regular (size 0) file, and its hard limit before throwing, is runtime behavior not visible in source",
    "Whether Claude Code / Codex enforce the 5 s timeout by killing the hook process (and how long memory stays allocated) is host behavior outside source",
    "Whether git checkout on the user's platform materializes the absolute symlink (core.symlinks default true on POSIX, false on Windows) is an environment fact"
  ],
  "validation_plan": {
    "local": "Inside an approved Linux sandbox with no network, an empty allowlisted environment, read-only target and a memory cgroup cap (e.g. 1 GiB): create scratch/proj/.stilo/state.json = {\"version\":1,\"project\":\"dummy\",\"phase\":\"PLAN\",\"reviewRound\":0} and ln -s /dev/zero scratch/proj/.stilo/checkpoint.json. With cwd=scratch/proj and CLAUDE_PLUGIN_ROOT set to the read-only target, run `/usr/bin/time -v timeout 5 node <target>/hooks/stilo-activate.js`. Record peak RSS, exit status and stdout length. Repeat with a regular checkpoint.json as a baseline. A confirmed result is a peak RSS far above the baseline and no injected context.",
    "deployment": "Owner-observed: on a throwaway macOS/Linux account, clone a dummy repo containing the symlinked checkpoint.json and a valid state.json, open Claude Code with the plugin installed, and watch the hook process memory in Activity Monitor/top during SessionStart and while a subagent starts."
  }
}
```

## Linked coverage-unit checks and artifact paths

Artifact paths are relative to C:\Users\luizg\security-audit-skill\stilo-code\run-1\ and may be read.

```json
[
  {
    "coverage_id": "repository%23product-code::repository%23product-code::repository::ATTACK-CLASSES.md%23Wildcard",
    "assignment_owner": "hunter-wildcard",
    "checks": [
      {
        "agent_id": "hunter-wildcard",
        "reviewed_paths": [
          "hooks/stilo-state.js",
          "hooks/stilo-instructions.js",
          "hooks/stilo-activate.js",
          "hooks/stilo-subagent.js",
          "hooks/claude-codex-hooks.json"
        ],
        "invariant": "Repo-controlled .stilo/checkpoint.json is read only if it is a bounded regular file, so a hostile clone cannot make the SessionStart/SubagentStart hook read an endless or special file",
        "method": "source",
        "result": "readCheckpoint -> readJsonObject (hooks/stilo-state.js:202-209) calls fs.readFileSync(path,'utf8') on dirname(statePath)/checkpoint.json with no lstat, no regular-file check, no symlink refusal and no size cap. It is reached from blocoEstado (hooks/stilo-instructions.js:286) whenever state.json is valid, on SessionStart and SubagentStart. The only bounds are the host's 5 s hook timeout (hooks/claude-codex-hooks.json:11,37) and the catch blocks. No test covers symlinked or special checkpoint files. Whether this causes real resource exhaustion depends on how Node reads devices and when the host kills the hook. That needs execution, so the result is needs_validation.",
        "artifact": null
      },
      {
        "agent_id": "hunter-wildcard",
        "reviewed_paths": [
          "hooks/stilo-context.js",
          "hooks/stilo-instructions.js",
          "AGENTS.md"
        ],
        "invariant": "Repo-controlled state/checkpoint text cannot change which protected blocks selectContextBlocks keeps or drops, and cannot hijack protected-marker matching",
        "method": "source",
        "result": "sanitiza collapses all whitespace, so injected values cannot create the block boundaries matched by /\\n{2}---\\n{2}|\\n(?=#{1,2}\\s)/. Every protected marker ('Regra 0', '## Retomada verificável', '## Preparação do ambiente', 'Travas de segurança', 'Negações', 'Mensagens de erro', '## 3. Estado em disco', '## 5. Módulos') appears in AGENTS.md (lines 6,109,120,196,198,202,83,151). AGENTS.md comes before the state block and findIndex takes the first match, so repo text cannot redirect a marker. If a marker is missing or the protected set is over budget, the function returns the full context (null fallback). The state block size (about 1 KB at most) only shifts which unprotected AGENTS.md sections the greedy fill drops, which is a guidance-quality effect only. No finding.",
        "artifact": null
      },
      {
        "agent_id": "hunter-wildcard",
        "reviewed_paths": [
          "hooks/stilo-runtime.js",
          "hooks/stilo-prompt.js",
          "hooks/stilo-activate.js"
        ],
        "invariant": "Hook stdout cannot be turned into host control JSON (e.g. continue:false / decision:block) by repo-controlled content",
        "method": "source",
        "result": "In Claude Code mode, raw stdout always starts with AGENTS.md ('# Stilo Code'), '## Estado do Stilo Code' or 'stilo:'. It is never a bare JSON object. The SubagentStart and Codex paths use JSON.stringify envelopes with a fixed hookEventName. readStdinJson takes only data.cwd, which comes from the trusted host and is checked with statSync().isDirectory(). No injection into the hook control channel.",
        "artifact": null
      },
      {
        "agent_id": "hunter-wildcard",
        "reviewed_paths": [
          "hooks/stilo-state.js",
          "hooks/stilo-diagnostics.js",
          "hooks/stilo-instructions.js"
        ],
        "invariant": "Unwired or legacy paths (setOff/isOff, writeState/writeCheckpoint/writeCycle, diagnoseProject, buildDoctorReport) are not reachable from any hook entrypoint",
        "method": "source",
        "result": "A repo-wide grep finds no hook caller for isOff/setOff/writeState/writeCheckpoint/writeCycle/diagnoseProject/buildDoctorReport outside tests and module.exports. The '/stilo-off' kill switch was removed on purpose (docs/superpowers/plans/2026-09-18-automatico-sem-comandos-plan.md:80), so the ~/.stilo/off flag no longer has any effect. Dead code is not reachable, so no finding.",
        "artifact": null
      },
      {
        "agent_id": "hunter-wildcard",
        "reviewed_paths": [
          "scripts/validate-plan.js",
          "scripts/evaluate-harness.js",
          "scripts/setup-github-cli.js",
          "hooks/stilo-setup.js"
        ],
        "invariant": "Script compatibility/fallback paths (legacy plan without Resources, original-fixture guard, Windows known-path fallback) do not grant a lower-trust principal new capability beyond peer-owned units",
        "method": "source",
        "result": "The legacy no-Resources path in validate-plan.js only adds serialization, which is more conservative. The plan validator only prints and makes no file or exec sinks. The harness original-fixture guard protects only evaluation honesty, since the harness never writes. knownWindowsExecutable uses ProgramFiles, which comes from the same user principal. The bare-name spawn/cwd resolution, lock/receipt TOCTOU and vm injection are peer-owned (hunter-install, hunter-scripts) and were not re-investigated.",
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

Target repository (read-only): C:\Users\luizg\Documents\claude code\stilo-code at commit 6f01438. This host has NO OS-enforced sandbox (no WSL2, Docker or Windows Sandbox) and no no-follow descriptor APIs, so safe promotion of scratch files is unavailable. Do not execute any target-controlled code, test, hook or script. Your own scratch directory is C:\Users\luizg\security-audit-skill\stilo-code\run-1\agents\verifier-05\scratch\ and you should not need it. The parent ran one platform probe that executed no repository code; where linked above, its artifact is agents/parent-probe/artifacts/cwd-resolution-probe.json and you may rely on it as parent-promoted evidence after reading it. Facts about Claude Code/Codex hook processes (cwd, environment, trust prompts) and model behavior are host facts not observed in this run.

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
