# Candidate verifier prompt — verifier-08

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
  "fingerprint": "hooks/stilo-instructions.js:buildFullContext:companion-name-endorsement",
  "title": "Injected companion recommendations may lend plugin trust to a project-supplied MCP server with the same name",
  "description": "An operator opens an untrusted project containing a project-local MCP server named `context7` or `playwright`. Stilo injects plugin-authored instructions recommending those names as MCP companions and saying to use them when available. If the host loads the project server and the agent treats the name match as endorsement, it may send tool requests or context to the untrusted server. Source confirms the injected recommendation, but does not establish project MCP loading, consent behavior, or whether the agent relies on the recommendation when selecting a server.",
  "claimed_root_cause": "The plugin injects bare MCP companion names as trusted recommendations without binding them to an authenticated server identity or distinguishing plugin-provided tools from project-provided tools. Whether this crosses a trust boundary depends on host and agent behavior not established in source.",
  "trace": [
    {
      "kind": "entrypoint",
      "file": "hooks/stilo-activate.js",
      "line": 9,
      "scope": "SessionStart project resolution",
      "description": "The hook resolves the opened project's state before building the context to inject."
    },
    {
      "kind": "propagation",
      "file": "hooks/stilo-instructions.js",
      "line": 298,
      "scope": "buildFullContext",
      "description": "The plugin reads AGENTS.md from pluginRoot and combines it with state and applicable modules."
    },
    {
      "kind": "propagation",
      "file": "AGENTS.md",
      "line": 244,
      "scope": "companion recommendations",
      "description": "The injected rules name context7 and playwright as MCP companions and recommend them for project phases."
    },
    {
      "kind": "sink",
      "file": "hooks/stilo-activate.js",
      "line": 11,
      "scope": "SessionStart hook output",
      "description": "The assembled instructions are returned to the host as additional context; whether they influence selection of a project-supplied same-name server is host/model behavior."
    }
  ],
  "evidence": [
    {
      "file": "AGENTS.md",
      "line": 233,
      "description": "The rules instruct the agent to use a listed companion if installed and proceed without it otherwise."
    },
    {
      "file": "AGENTS.md",
      "line": 244,
      "description": "context7 is explicitly identified as an MCP companion."
    },
    {
      "file": "AGENTS.md",
      "line": 245,
      "description": "playwright is explicitly identified as an MCP companion."
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 45,
      "description": "lerArquivo reads instruction files from pluginRoot; the AGENTS.md text is plugin-authored context."
    },
    {
      "file": "hooks/stilo-instructions.js",
      "line": 298,
      "description": "buildFullContext includes the plugin-root AGENTS.md text in the context assembled for SessionStart and SubagentStart."
    },
    {
      "file": "hooks/stilo-activate.js",
      "line": 11,
      "description": "SessionStart passes buildInjectedContext output to writeHookOutput."
    },
    {
      "file": "hooks/stilo-context.js",
      "line": 12,
      "description": "Context selection operates on text blocks and protected markers; it does not bind a companion name to a server identity."
    }
  ],
  "blockers": [
    "Source does not establish whether Claude Code or Codex automatically loads project-local MCP configuration, what user consent or trust gates apply, or whether those controls show the actual server identity.",
    "Source cannot establish whether an agent interprets Stilo's name-only recommendation as endorsement of a same-name project server or sends sensitive tool input to it."
  ],
  "validation_plan": {
    "local": "In an approved OS-enforced sandbox with networking disabled, use a disposable project and a harmless dummy MCP server named `context7`; configure it to record only a fixed nonsensitive test request. Observe whether the host loads the project configuration, what consent or identity information it presents, and whether the agent treats the injected Stilo recommendation as endorsement. Do not use real credentials or project data. If such a sandbox is unavailable, do not run the target and retain this blocker.",
    "deployment": "Owner-observed in a disposable Claude Code and Codex profile: open a throwaway project with a harmless same-name project MCP server and the plugin installed. Record whether the host loads it, whether consent identifies its source and endpoint, and whether the agent selects it because of the injected companion recommendation. Do not use a production project, real credentials, or sensitive prompts."
  }
}
```

## Linked coverage-unit checks and artifact paths

Artifact paths are relative to C:\Users\luizg\security-audit-skill\stilo-code\run-1\ and may be read.

```json
[
  {
    "coverage_id": "AGENTS.md%239.%20Companions%20%E2%80%94%20usados%20se%20existirem%2C%20nunca%20exigidos::hooks%2Fstilo-instructions.js%23buildInjectedContext::hooks::AI-AND-LLM.md%23MCP%20server%20and%20tool%20identity%20confusion",
    "assignment_owner": "hunter-companion-endorsement",
    "checks": [
      {
        "agent_id": "hunter-companion-endorsement",
        "reviewed_paths": [
          "AGENTS.md",
          "hooks/stilo-instructions.js",
          "hooks/stilo-activate.js",
          "hooks/stilo-context.js"
        ],
        "invariant": "Injected companion recommendations must not make an untrusted project MCP server appear to be a plugin-endorsed or trusted tool solely because it uses the same name.",
        "method": "source",
        "result": "AGENTS.md names context7 and playwright as MCP companions and tells the agent to use available companions (AGENTS.md:231-249). SessionStart builds the injected context from the plugin-root AGENTS.md and returns it to the host (hooks/stilo-instructions.js:37-49, 295-305, 315-339; hooks/stilo-activate.js:9-11). The context selector has no companion identity or provenance check (hooks/stilo-context.js:12-44). Source does not show project MCP configuration being loaded or establish how either host resolves same-name servers, so the boundary effect remains unverified.",
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

### AI-AND-LLM.md#Validation rules

## Validation rules (apply before reporting ANY finding here)

1. Name the crossed boundary and observable result: attacker, affected principal or shared resource, execution identity, target, and unauthorized or unrequested action or disclosure.
2. For confused-deputy authority claims, prove the tool lacks requester-and-resource authorization and that the attacker cannot perform the same action normally. For action-binding claims, instead prove attacker-controlled content caused an action under the affected principal's authority that the principal did not intentionally request or approve. Valid generic authorization does not establish that intent.
3. For memory or retrieval claims, cite both the attacker-controlled write and the later cross-principal read or privileged decision. A shared record without a reachable consumer is not enough.
4. For action binding, establish the intentional request or normalized approved object, if any, and compare it with the object the handler uses. Confirm a locally observable unrequested action, mutation, duplicate, or authority change without extending the test into harmful execution. For schema disagreement, compare the normalized validated object with the handler's object.
5. For MCP identity claims, verify the authenticated connection, request correlation, tool namespace, and effective credential. Mark `needs_validation` if external server identity or deployment routing is required.
6. Return `confirmed` findings only with a complete source trace and meaningful result. Return `needs_validation` for a specific unresolved boundary fact and state the bounded local or owner-observed check needed to resolve it.

## Source/local execution boundary for this run

Target repository (read-only): C:\Users\luizg\Documents\claude code\stilo-code at commit 6f01438. This host has NO OS-enforced sandbox (no WSL2, Docker or Windows Sandbox) and no no-follow descriptor APIs, so safe promotion of scratch files is unavailable. Do not execute any target-controlled code, test, hook or script. Your own scratch directory is C:\Users\luizg\security-audit-skill\stilo-code\run-1\agents\verifier-08\scratch\ and you should not need it. The parent ran one platform probe that executed no repository code; where linked above, its artifact is agents/parent-probe/artifacts/cwd-resolution-probe.json and you may rely on it as parent-promoted evidence after reading it. Facts about Claude Code/Codex hook processes (cwd, environment, trust prompts) and model behavior are host facts not observed in this run.

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
