# Hunter prompt — hunter-packaging

## 1. Role

Your goal is to find source-grounded security invariant failures in your assigned coverage units of the stilo-code repository. You must return exactly one JSON object matching the structured-result contract at the end of this prompt, with no surrounding prose.

## 2. architecture.md (verbatim)

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

## 3. Assigned units and block maps

```json
{
  "coverage_id": ".claude-plugin%2Fmarketplace.json%23plugins::hooks%2Fclaude-codex-hooks.json%23hooks::plugin-packaging::SUPPLY-CHAIN-AND-RELEASE.md%23Plugin%20and%20extension%20trust%20expansion",
  "surface": "plugin distribution and hook registration",
  "boundary": "what an installed or updated plugin may execute and inject",
  "subsystem": "plugin packaging",
  "attack_class": "Plugin and extension trust expansion",
  "starting_paths": [
    ".claude-plugin/marketplace.json",
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    "hooks/claude-codex-hooks.json",
    "package.json"
  ],
  "ordinary_attack_class_block": null,
  "selected_companion_blocks": [
    "SUPPLY-CHAIN-AND-RELEASE.md#Core discipline",
    "SUPPLY-CHAIN-AND-RELEASE.md#Plugin and extension trust expansion",
    "SUPPLY-CHAIN-AND-RELEASE.md#Universal moves",
    "SUPPLY-CHAIN-AND-RELEASE.md#Validation rules"
  ]
}
```

Target repository root (read-only): C:\Users\luizg\Documents\claude code\stilo-code at commit 6f01438. All paths you report are repository-relative.

## 4. Selected blocks (verbatim)

### SUPPLY-CHAIN-AND-RELEASE.md#Core discipline

## Core discipline (include in every agent prompt for this domain)

```
- A mutable or known-vulnerable dependency is not a finding by itself. Show who can influence resolution, which build consumes it, and what execution or release boundary follows.
- Follow integrity across every handoff: source identity, resolved inputs, build worker, artifact identity, test result, signature/attestation, promotion, and update consumer.
- CI configuration is authorization code. Establish which event triggered a workflow, whose code runs, which secrets and tokens exist, and what it may publish or mutate.
- A checksum fetched from the same untrusted location as the artifact does not establish independent integrity. Identify the trusted root and failure behavior.
- Use `confirmed` for in-repo control-flow failures with bounded local validation. Use `needs_validation` for branch protection, hosted-runner, registry, signing-service, or production promotion facts that are not observable.
```

### SUPPLY-CHAIN-AND-RELEASE.md#Plugin and extension trust expansion

**Plugin and extension trust expansion**
An extension package gains host authority beyond its declared scope, a lower-trust publisher can replace another publisher's identity, or install/update hooks run before authenticity and capability checks. Intended installation of arbitrary same-user plugins is not a privilege boundary.

### SUPPLY-CHAIN-AND-RELEASE.md#Universal moves

## Universal moves (apply across the above)

- Walk backward from a released digest or installed update to every source, generated input, credential, worker, cache, test result, and authorization decision.
- Compare untrusted and protected workflow events side by side. Mark each persisted channel crossing between them and require an immutable identity plus producer trust.
- Review revoked key, failed download, missing attestation, partial platform release, rollback, and registry outage paths. The failure policy is part of release integrity.

### SUPPLY-CHAIN-AND-RELEASE.md#Validation rules

## Validation rules (apply before reporting ANY finding here)

1. Name the lower-trust actor, controllable source/cache/artifact/metadata, consuming trusted job or updater, and resulting unauthorized publication, code inclusion, secret disclosure, or privileged execution.
2. Prove artifact identity across the broken handoff. A different mutable name or unbound digest must reach a real consumer.
3. Verify built-in package-manager, repository-host, registry, and signing defaults for the pinned version. Unknown hosted controls require `needs_validation`.
4. Keep local validation bounded: use a harmless fixture repository, dummy credential marker, local registry/config, and non-production artifact namespace. Do not publish or alter a real release.
5. Return `confirmed` only with a complete source-visible handoff and meaningful result. Return `needs_validation` with the precise branch, runner, registry, signing, or deployment fact an owner must observe.

## 5. Excluded blocks

- SUPPLY-CHAIN-AND-RELEASE.md#Untrusted code in a privileged workflow (unit .claude-plugin%2Fmarketplace.json%23plugins::hooks%2Fclaude-codex-hooks.json%23hooks::plugin-packaging::SUPPLY-CHAIN-AND-RELEASE.md%23Plugin%20and%20extension%20trust%20expansion): no CI configuration in the repository (no .github/)

## 6. Core hunting method and promotion procedure

```text
## Defensive vulnerability-finding method

Your goal is to find source-grounded security invariant failures and the smallest fix,
not to expand harm beyond the boundary result. Stay within source review and bounded local execution.
Do not contact deployed endpoints, provider APIs, registries, identity systems,
message brokers, shared services, or other users. Use local dummy data only.

READ THE CODE AT DEPTH. Follow each assigned input through parsing, identity,
authorization, normalization, state, derived copies, and the final sink. Read sibling,
legacy, batch, retry, cancellation, migration, and error paths that produce the same
effect. Compare sibling controls for equivalence, not only presence, and compare what
one component guarantees with what the next component assumes.

WORK FROM A CONCRETE INVARIANT:
1. Name the lower-trust principal and starting capability.
2. Name the accepted value, action, state transition, or resource selector.
3. Locate the control that should reject, bind, isolate, limit, or revoke it.
4. Trace the exact source path after that decision.
5. Stop at the smallest affected dummy record, wrong return value, process-integrity
   effect, or locally observable shared-resource effect.
6. State a source-level change and regression case that enforce the invariant.

DEPTH BOUND: trace only paths that can reach your assigned boundary or whose
guarantees that boundary relies on. Stop a line of investigation as soon as the
invariant is settled either way, and record the result in your structured output —
a covered, candidate, or blocked disposition, or an `uncovered` entry — instead of
continuing to search.

TEST SAD PATHS AND DISAGREEMENTS. Check absent, empty, zero, negative, maximum,
over-limit, duplicate, mixed encoding, stale, revoked, reordered, concurrent,
partially migrated, failed dependency, and rollback state only where the interface
accepts them. Compare canonicalization and units at every parser or policy handoff.
For multi-step issues, treat each output as a prerequisite and do not assume a later
boundary. If any prerequisite is not established, record a blocker.

When a proposed high or critical candidate reveals a reusable root cause, search paths
owned by the assigned coverage IDs for lexical, structural, and logical variants.
Consolidate the same root cause, but establish each variant's conditions and impact
independently. Do not investigate peer-owned units. Return a variant with no current
coverage unit as `uncovered`.

USE THE NARROWEST LOCAL CHECK THAT SETTLES THE CLAIM. Target-controlled builds,
tests, processes, browsers, emulators, fuzzers, and fixture processing may run only
inside the parent-approved OS-enforced sandbox. It must disable external networking,
start from an empty allowlisted environment, expose target and tools read-only, permit
writes only to your scratch directory, and apply low CPU, memory, process, file-size,
disk, and wall-clock limits. Isolated loopback is allowed only for a local fixture.
If any control is unavailable, do not execute: return needs_validation with that exact
blocker. Prefer an existing unit test, minimal function harness, dummy-tenant service
call, small malformed fixture, deterministic race schedule, or locally rendered policy.
Do not install or fetch tools.

Record the exact input, command, limits, and minimum result. For the environment,
record only allowlisted variable names and safe non-secret values needed to reproduce
the check. Never capture the ambient environment, inherited variables, credentials,
authentication state, or unrelated host paths. The target-controlled process writes
only in scratch. After the sandbox and all its processes terminate, only trusted
parent-side code may promote predeclared scratch-relative files, following the
promotion procedure block included verbatim in this prompt. You and target code never
write retained artifacts. If promotion is unavailable or fails for decisive evidence,
return needs_validation with the exact promotion blocker.
Never stress availability, invoke a live target, use a real credential, publish an
artifact, or continue past the minimum observed effect.

A deployment, browser, provider, broker, OS, proxy, package, secret, or identity fact
outside source is not proof either way. If one such fact is decisive, return a
needs_validation record with the exact missing observation and safe owner-observed check.
```

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

## 7. Core validation rules

```text
## Candidate gate

1. A candidate needs a complete repository-relative source trace and evidence for the
   claimed root cause, including the strongest source-visible control.
2. A proposed confirmed record needs a bounded local observed result, meaningful impact
   across a stated boundary, complete conditions, and no visible preventing layer.
3. Do not strengthen a crash into code execution, ordinary work into shared availability,
   or a same-principal action into privilege gain.
4. If a required fact is not source-visible or locally observable, use
   needs_validation. Name exact blockers; do not give it severity or speculative completion.
5. A missing best practice with no affected principal/resource is excluded or hardening,
   not a finding. A candidate disproved by source is not needs_validation.
6. Use the same source-derived fingerprint for the same root cause in every state.
   It must match `^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$` and must not include a line,
   wave, agent, severity, or verdict.
7. Return an empty candidate array when nothing survives these gates.
```

## 8. Exclusions and peer-owned units

Carried same-source prior confirmed exclusions: none (first run).

Peer-owned coverage IDs you must not duplicate:

- hooks%2Fstilo-instructions.js%23buildCheckpointNote::hooks%2Fstilo-state.js%23validateCheckpoint::hooks::AI-AND-LLM.md%23Indirect%20injection%20through%20retrieved%20or%20ingested%20content (owner hunter-context)
- hooks%2Fstilo-state.js%23readStateResult::hooks%2Fstilo-instructions.js%23blocoEstado::hooks::AI-AND-LLM.md%23Prompt%20role%20and%20provenance%20confusion (owner hunter-context)
- hooks%2Fstilo-state.js%23readStateResult::hooks%2Fstilo-instructions.js%23sanitiza::hooks::AI-AND-LLM.md%23Indirect%20injection%20through%20retrieved%20or%20ingested%20content (owner hunter-context)
- hooks%2Fstilo-state.js%23findStateFiles::hooks%2Fstilo-state.js%23findStateFiles::hooks::ATTACK-CLASSES.md%23Resource%20and%20file%20handling (owner hunter-discovery)
- hooks%2Fstilo-state.js%23validateState::hooks%2Fstilo-instructions.js%23buildFullContext::hooks::ATTACK-CLASSES.md%23Business%20logic (owner hunter-discovery)
- hooks%2Fstilo-setup.js%23buildSetupNote::hooks%2Fstilo-setup.js%23buildSetupNote::hooks::AI-AND-LLM.md%23Excessive%20agency%20and%20confused-deputy%20authority (owner hunter-agency)
- hooks%2Fstilo-subagent.js%23main::hooks%2Fstilo-instructions.js%23buildInjectedContext::hooks::AI-AND-LLM.md%23Sub-agent%20and%20MCP%20trust%20inheritance (owner hunter-agency)
- hooks%2Fstilo-setup.js%23probeGitHubCli::hooks%2Fstilo-setup.js%23probeGitHubCli::hooks::DESKTOP-MOBILE-AND-LOCAL-IPC.md%23Install%2C%20update%2C%20and%20repair%20path%20trust (owner hunter-install)
- scripts%2Fsetup-github-cli.js%23ensureGitHubCli::scripts%2Fsetup-github-cli.js%23readReceipt::scripts::DESKTOP-MOBILE-AND-LOCAL-IPC.md%23Local%20file%20ownership%20and%20TOCTOU (owner hunter-install)
- scripts%2Fsetup-github-cli.js%23ensureGitHubCli::scripts%2Fsetup-github-cli.js%23realRun::scripts::DESKTOP-MOBILE-AND-LOCAL-IPC.md%23Install%2C%20update%2C%20and%20repair%20path%20trust (owner hunter-install)
- scripts%2Fevaluate-harness.js%23main::scripts%2Fevaluate-harness.js%23vm.Script.runInContext::scripts::ATTACK-CLASSES.md%23Injection (owner hunter-scripts)
- scripts%2Fvalidate-plan.js%23main::scripts%2Fvalidate-plan.js%23parsePlan::scripts::RESOURCE-EXHAUSTION-AND-AVAILABILITY.md%23Superlinear%20parsing%2C%20matching%2C%20or%20evaluation (owner hunter-scripts)
- repository%23tracked-files::repository%23tracked-files::repository::ATTACK-CLASSES.md%23Obvious%20things (owner hunter-obvious)
- repository%23product-code::repository%23product-code::repository::ATTACK-CLASSES.md%23Wildcard (owner hunter-wildcard)

## 9. Execution, scratch and result contract

Agent ID: hunter-packaging. Scratch: C:\Users\luizg\security-audit-skill\stilo-code\run-1\agents\hunter-packaging\scratch\ (the only writable location; you should not need it). Parent-owned artifacts: agents/hunter-packaging/artifacts/ (you never write there).

Promotion allowlist: empty; per-file and cumulative byte limits: 0. The parent verified that this host has NO OS-enforced sandbox (no WSL2, Docker, Windows Sandbox; no no-follow descriptor APIs for promotion). Therefore do not execute any target-controlled code, tests, scripts or hooks. Use method "source" with artifact null for every check. When a decisive fact can only be established by execution or by host/runtime behavior, return needs_validation with that exact blocker.

You may use read-only tools (Read, Grep, Glob, git show/log). You may read Node.js documentation already present locally if any; do not use the network.

## Structured hunter result

Return exactly one JSON object, with no surrounding prose:

```json
{
  "units": [
    {
      "coverage_id": "one assigned ID",
      "disposition": "covered|candidate|blocked",
      "reviewed_paths": ["repo/relative/path"],
      "checks": [
        {
          "agent_id": "canonical owner of this check",
          "reviewed_paths": ["repo/relative/path owned by this check"],
          "invariant": "specific control checked for this unit",
          "method": "source|local",
          "result": "what source or the bounded check established",
          "artifact": "agents/<agent-id>/artifacts/file for local, null for source"
        }
      ],
      "candidate_fingerprints": [],
      "unresolved": []
    }
  ],
  "candidates": [],
  "hardening": ["concrete non-finding note"],
  "uncovered": [
    {
      "surface": "...",
      "boundary": "...",
      "subsystem": "...",
      "attack_class": "...",
      "starting_paths": ["repo/relative/path"],
      "reason": "why this needs its own deterministic coverage unit"
    }
  ]
}
```

Each `candidates` entry is schema-shaped except that it uses `proposed_verdict` in place of `verdict`:

- `proposed_verdict: "confirmed"`: include every field required by the `confirmed` branch of `report-schema.json` other than `verdict`: `fingerprint`, title, description, `root_cause`, `intended_behavior`, ordered `trace`, `evidence`, `conditions`, target-neutral `execution`, `remediation`, `severity`, and `confidence`. The execution instructions describe only the bounded local check already performed. `payloads` holds the minimum test input, fixture, or native invocation. `observed_result` records actual local output. Overall severity must not exceed observed impact.
- `proposed_verdict: "needs_validation"`: include every field required by that schema branch other than `verdict`: `fingerprint`, title, description, `claimed_root_cause`, ordered `trace`, `evidence`, nonempty `blockers`, and `validation_plan` with at least one applicable `local` or `deployment` step. Do not invent an inapplicable context. Do not include severity, execution, remediation, reason, or a confirmed `root_cause`. `deployment` is an owner-observed check, not a request to probe a live target.

Every assigned coverage ID appears exactly once in `units`. A `covered` unit needs an owner, nonempty `reviewed_paths` and `checks`, no unresolved fact, and no candidate. A `candidate` unit has the same owned evidence and is the only state that carries linked fingerprints. A `blocked` unit is an owned partial review with nonempty paths, checks, and unresolved facts but no fingerprint. All source paths are repository-relative, never absolute or traversal paths. A trace with several entries begins at `entrypoint`, ends at `sink`, and labels intermediate steps `propagation`. Every check has its own canonical lowercase `agent_id` and nonempty `reviewed_paths`; the unit-level list is exactly the union of those owned paths. A `source` check uses `artifact: null`. A `local` check uses one successfully parent-promoted regular file beneath `agents/<check.agent_id>/artifacts/`; this permits a verifier to add independently owned evidence without taking ownership from the hunter. Never link scratch, an output-root file, or another check owner's artifact.

Schema branches for candidate records (confirmed and needs_validation), verbatim from report-schema.json:

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
  }
}
```
