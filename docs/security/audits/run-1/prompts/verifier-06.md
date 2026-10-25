# Candidate verifier prompt — verifier-06

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
  "fingerprint": "hooks/stilo-state.js:readStateResult:unbounded-readFileSync-state-special-file",
  "title": "Per-prompt state.json read follows a repository-planted symlink to a device or FIFO, with no file-type or size check",
  "description": "A cloned or extracted project can ship `.stilo/state.json` as a symlink to /dev/zero (git stores symlinks and materializes them by default on Linux/macOS) or as a FIFO (via archive extraction). On every UserPromptSubmit, SessionStart and SubagentStart, resolveProjeto â†’ readStateResult synchronously calls fs.readFileSync(statePath,'utf8') on it. For /dev/zero the read never reaches EOF and the buffer keeps growing. For a FIFO it blocks. In both cases the hook runs until the host's 5 s timeout kills it, the Stilo state injection is lost, and each prompt is delayed. For /dev/zero, memory may also spike by multiple GB on the developer's machine. Concurrent SubagentStart hooks multiply that. If timeout kill reaches only the shell parent, an orphaned node could keep allocating until the system runs out of memory. The trigger persists in the repository until the user removes it. This is a sibling of the checkpoint candidate hooks/stilo-state.js:readJsonObject:unbounded-readFileSync-checkpoint-special-file, but it is a different function on the per-prompt path and needs its own fix.",
  "claimed_root_cause": "hooks/stilo-state.js#readStateResult passes a path taken from repository-controlled discovery (findStateFiles, which only checks fs.existsSync and so follows symlinks) straight to fs.readFileSync(statePath,'utf8'). There is no lstat or no-follow open, no isFile() check and no byte cap. Unlike the unwired sibling stilo-diagnostics.js#fileCheck, it never verifies the target is a regular file. The only bound is the external host hook timeout, because the prompt hook's own 1 s timer cannot fire while the synchronous read blocks the event loop.",
  "trace": [
    {
      "kind": "entrypoint",
      "file": "hooks/stilo-prompt.js",
      "line": 19,
      "scope": "main",
      "description": "UserPromptSubmit hook resolves the project for the host-supplied cwd on every user prompt (SessionStart stilo-activate.js:9 and SubagentStart stilo-subagent.js:8 do the same with process.cwd())."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-state.js",
      "line": 87,
      "scope": "findStateFiles",
      "description": "fs.existsSync(<dir>/.stilo/state.json) follows symlinks and accepts any existing target type, including devices and FIFOs."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-state.js",
      "line": 284,
      "scope": "resolveProjeto",
      "description": "The single discovered path is passed unchanged to readStateResult."
    },
    {
      "kind": "sink",
      "file": "hooks/stilo-state.js",
      "line": 132,
      "scope": "readStateResult",
      "description": "fs.readFileSync(statePath,'utf8') reads synchronously with no type, link or size check, so it is unbounded on /dev/zero and blocking on a FIFO."
    }
  ],
  "evidence": [
    {
      "file": "hooks/stilo-state.js",
      "line": 132,
      "description": "Unconditional readFileSync of the discovered path; the catch at 133-138 only handles thrown errors, not non-terminating reads."
    },
    {
      "file": "hooks/stilo-state.js",
      "line": 87,
      "description": "Discovery test is existsSync only, which follows symlinks; no lstat in the module."
    },
    {
      "file": "hooks/stilo-runtime.js",
      "line": 77,
      "description": "Prompt hook self-timeout is an unref'd setTimeout that cannot run while main blocks synchronously inside the 'end' handler."
    },
    {
      "file": "hooks/claude-codex-hooks.json",
      "line": 24,
      "description": "Only bound is host timeout 5 s per hook; the same applies to SessionStart (line 11) and SubagentStart (line 37)."
    },
    {
      "file": "hooks/stilo-diagnostics.js",
      "line": 14,
      "description": "Sibling reader rejects non-regular files with statSync().isFile(); the wired hook path has no equivalent control."
    }
  ],
  "blockers": [
    "No OS-enforced sandbox on this host, so a resolveProjeto call against a /dev/zero symlink or FIFO fixture could not be executed. The Node 24 readFileSync('utf8') behaviour on a character device (readFileUtf8 fast path: growth rate, bad_alloc versus ERR_STRING_TOO_LONG) is unobserved.",
    "Host behaviour at the 5 s hook timeout is not source-visible: whether Claude Code/Codex kill the node process or only the `sh -c` / PowerShell parent, and whether the prompt proceeds.",
    "Peak RSS within the timeout window, and whether concurrent SubagentStart hooks cause system-wide memory pressure, are unobserved.",
    "Materialization of the symlink depends on the git client config (core.symlinks). It defaults to true on Linux/macOS and false on Git for Windows, so the default Windows host is likely not affected by the symlink vector."
  ],
  "validation_plan": {
    "local": "In an isolated Linux VM or container with networking disabled, an empty environment, the repo mounted read-only, a memory cgroup limit (e.g. 256 MB) and a 6 s wall-clock limit: create fixture dir F with `.stilo/state.json -> /dev/zero`. Run `node -e \"require('/ro/stilo-code/hooks/stilo-state.js').resolveProjeto('F')\"`, then record whether it is OOM-killed or still running at timeout, and its peak RSS. Repeat with `mkfifo F/.stilo/state.json` and confirm it blocks until the wall limit. Then `git clone` a local bare repo committing that symlink, with default config, and confirm the symlink is materialized.",
    "deployment": "Owner check on a Linux or macOS workstation with Claude Code: open a disposable project containing `.stilo/state.json -> /dev/zero`, submit one prompt, and observe in a process monitor whether the hook's node process is terminated at 5 s (no orphan survives its shell parent), its peak RSS, and whether the prompt continues. On Windows, confirm `git config core.symlinks` is false by default, so the symlink is checked out as a plain text file."
  }
}
```

## Linked coverage-unit checks and artifact paths

Artifact paths are relative to C:\Users\luizg\security-audit-skill\stilo-code\run-1\ and may be read.

```json
[
  {
    "coverage_id": "hooks%2Fstilo-prompt.js%23main::hooks%2Fstilo-state.js%23readStateResult::hooks::ATTACK-CLASSES.md%23Resource%20and%20file%20handling",
    "assignment_owner": "hunter-readfile",
    "checks": [
      {
        "agent_id": "hunter-readfile",
        "reviewed_paths": [
          "hooks/stilo-state.js"
        ],
        "invariant": "Before reading a repository-discovered .stilo/state.json, readStateResult must refuse symlinks, non-regular files (FIFO, character device, directory) and files above a byte limit",
        "method": "source",
        "result": "readStateResult (hooks/stilo-state.js:129-146) calls fs.readFileSync(statePath,'utf8') directly. It does no lstat, no O_NOFOLLOW, no isFile() check and has no byte limit. statePath comes from findStateFiles, whose only test is fs.existsSync (line 87/108), and existsSync follows symlinks. A symlink to /dev/zero, or a FIFO, therefore reaches an unbounded or blocking synchronous read. readStateResult is a separate function from readJsonObject (lines 202-209, the checkpoint/cycle reader). Fixing the existing checkpoint candidate does not fix this path. readState (lines 117-127) has the same pattern but no hook calls it.",
        "artifact": null
      },
      {
        "agent_id": "hunter-readfile",
        "reviewed_paths": [
          "hooks/stilo-prompt.js",
          "hooks/stilo-activate.js",
          "hooks/stilo-subagent.js",
          "hooks/stilo-runtime.js"
        ],
        "invariant": "Each hook entry point that resolves the project must bound how long the state read can take",
        "method": "source",
        "result": "stilo-prompt.js#main (line 19), stilo-activate.js (line 9) and stilo-subagent.js (line 8) all call resolveProjeto → readStateResult on every user prompt, session start and subagent start. The prompt hook's own 1 s bound in readStdinJson (stilo-runtime.js:77-80) is an unref'd setTimeout, and it cannot fire while main is blocked in synchronous readFileSync. The only effective bound is the external host timeout.",
        "artifact": null
      },
      {
        "agent_id": "hunter-readfile",
        "reviewed_paths": [
          "hooks/claude-codex-hooks.json"
        ],
        "invariant": "The host-level bound and the process-kill semantics that contain a runaway hook read",
        "method": "source",
        "result": "All three hooks declare timeout 5 (lines 11, 24, 37). The POSIX command is `node \"${CLAUDE_PLUGIN_ROOT}/hooks/...\"` and the Windows command wraps node in PowerShell. The source does not show whether the host kills the node process, or only its shell parent, on timeout. Peak memory reached within 5 s is also not source-visible.",
        "artifact": null
      },
      {
        "agent_id": "hunter-readfile",
        "reviewed_paths": [
          "hooks/stilo-instructions.js"
        ],
        "invariant": "Content read through a symlinked state.json must not be disclosed into agent context",
        "method": "source",
        "result": "For a non-JSON target, the error is the fixed string 'JSON inválido ou truncado' (stilo-state.js:144). A read error injects e.message, which names the link path, not the target. For JSON targets that fail validateState, only the fixed validation error strings are injected, plus state.phase via faseInvalida (sanitiza, 120 chars) (stilo-instructions.js:130-133, 176-183, 210-232). A valid state injects project and updated. Disclosure through a symlink is limited to a `phase` field of a foreign JSON file, so it is hardening, not a finding.",
        "artifact": null
      },
      {
        "agent_id": "hunter-readfile",
        "reviewed_paths": [
          "hooks/stilo-diagnostics.js"
        ],
        "invariant": "Sibling readers apply equivalent file-type controls",
        "method": "source",
        "result": "hooks/stilo-diagnostics.js#fileCheck (lines 11-27) uses statSync + isFile() and rejects non-files, but no hook wires that module. The wired readStateResult has no equivalent check, so the sibling controls are inconsistent.",
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

### RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Validation rules

## Validation rules (apply before reporting ANY finding here)

1. Name untrusted input, requester work, service amplification or retained resource, shared blast radius, and recovery. Missing limits without concrete shared impact are hardening.
2. Confirm no source-visible upstream, parser, queue, tenant, or framework bound prevents the path. Unknown deployed controls require `needs_validation`.
3. For superlinear behavior, establish the accepted complexity and bounded local growth. For leaks, show repeatable retention after cleanup should occur. For fatal paths, identify process/supervisor isolation.
4. Prioritize by low requester work, unauthenticated reachability, cross-tenant scope, persistence, and poor recovery; do not validate with availability impact.
5. Return `confirmed` only with safe local proof and meaningful shared effect. Return `needs_validation` with the exact upstream limit, topology, quota, or recovery observation an owner must check.

## Source/local execution boundary for this run

Target repository (read-only): C:\Users\luizg\Documents\claude code\stilo-code at commit 6f01438. This host has NO OS-enforced sandbox (no WSL2, Docker or Windows Sandbox) and no no-follow descriptor APIs, so safe promotion of scratch files is unavailable. Do not execute any target-controlled code, test, hook or script. Your own scratch directory is C:\Users\luizg\security-audit-skill\stilo-code\run-1\agents\verifier-06\scratch\ and you should not need it. The parent ran one platform probe that executed no repository code; where linked above, its artifact is agents/parent-probe/artifacts/cwd-resolution-probe.json and you may rely on it as parent-promoted evidence after reading it. Facts about Claude Code/Codex hook processes (cwd, environment, trust prompts) and model behavior are host facts not observed in this run.

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
