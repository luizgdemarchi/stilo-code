// Gera o coverage-ledger.json inicial (Fase 1) de forma determinística.
// Uso: node audit-ledger-seed.js <arquivo-de-saida>
const fs = require('fs');

const enc = (ref) => {
  if (ref !== ref.normalize('NFC') || ref.trim() !== ref || !ref) throw new Error('ref inválida: ' + ref);
  return Array.from(Buffer.from(ref, 'utf8'))
    .map((b) => {
      const c = String.fromCharCode(b);
      return /[A-Za-z0-9\-._~]/.test(c) ? c : '%' + b.toString(16).toUpperCase().padStart(2, '0');
    })
    .join('');
};

const AI = (cls) => ['AI-AND-LLM.md#Core discipline', `AI-AND-LLM.md#${cls}`, 'AI-AND-LLM.md#Universal moves', 'AI-AND-LLM.md#Validation rules'];
const IPC = (cls) => ['DESKTOP-MOBILE-AND-LOCAL-IPC.md#Core discipline', `DESKTOP-MOBILE-AND-LOCAL-IPC.md#${cls}`, 'DESKTOP-MOBILE-AND-LOCAL-IPC.md#Universal moves', 'DESKTOP-MOBILE-AND-LOCAL-IPC.md#Validation rules'];
const SC = (cls) => ['SUPPLY-CHAIN-AND-RELEASE.md#Core discipline', `SUPPLY-CHAIN-AND-RELEASE.md#${cls}`, 'SUPPLY-CHAIN-AND-RELEASE.md#Universal moves', 'SUPPLY-CHAIN-AND-RELEASE.md#Validation rules'];
const RE = (cls) => ['RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Core discipline', `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#${cls}`, 'RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Universal moves', 'RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Validation rules'];
const NO_WEB = [
  { block: 'WEB-PROTOCOL-AND-AUTH.md#Core discipline', reason: 'no HTTP server, session or identity protocol in source (recon 1c §11)' },
  { block: 'CLIENT-SIDE.md#Core discipline', reason: 'no browser, DOM or webview surface in source' },
];

const units = [
  {
    surface: ['hooks/stilo-state.js#findStateFiles', 'project discovery from hook cwd (walk up, then one level down)'],
    boundary: ['hooks/stilo-state.js#findStateFiles', 'which directory owns the active .stilo/state.json'],
    subsystem: ['hooks', 'hooks'],
    attack: ['ATTACK-CLASSES.md#Resource and file handling', 'Resource and file handling'],
    ordinary: 'ATTACK-CLASSES.md#Resource and file handling',
    companions: [],
    starting: ['hooks/stilo-state.js', 'hooks/stilo-prompt.js', 'hooks/stilo-activate.js', 'hooks/stilo-subagent.js'],
    excluded: [...NO_WEB, { block: 'DATA-ISOLATION-AND-LIFECYCLE.md#Core discipline', reason: 'no multi-tenant store; the project directory is the only scope' }],
  },
  {
    surface: ['hooks/stilo-state.js#readStateResult', '.stilo/state.json fields injected into agent context'],
    boundary: ['hooks/stilo-instructions.js#sanitiza', 'repo-controlled text rendered as plugin state'],
    subsystem: ['hooks', 'hooks'],
    attack: ['AI-AND-LLM.md#Indirect injection through retrieved or ingested content', 'Indirect injection through retrieved or ingested content'],
    ordinary: null,
    companions: AI('Indirect injection through retrieved or ingested content'),
    starting: ['hooks/stilo-state.js', 'hooks/stilo-instructions.js', 'hooks/stilo-context.js', 'hooks/stilo-runtime.js'],
    excluded: [{ block: 'ATTACK-CLASSES.md#Injection', reason: 'no shell, SQL, HTML or template sink for state fields; the only sink is model context, covered by the AI companion' }],
  },
  {
    surface: ['hooks/stilo-state.js#readStateResult', '.stilo/state.json fields injected into agent context'],
    boundary: ['hooks/stilo-instructions.js#blocoEstado', 'framing of repo-derived values inside the protected state block'],
    subsystem: ['hooks', 'hooks'],
    attack: ['AI-AND-LLM.md#Prompt role and provenance confusion', 'Prompt role and provenance confusion'],
    ordinary: null,
    companions: AI('Prompt role and provenance confusion'),
    starting: ['hooks/stilo-instructions.js', 'hooks/stilo-context.js', 'AGENTS.md'],
    excluded: [{ block: 'AI-AND-LLM.md#Persistent memory poisoning', reason: 'the plugin keeps no memory store of its own; persistence is the repo file itself (separate unit)' }],
  },
  {
    surface: ['hooks/stilo-instructions.js#buildCheckpointNote', '.stilo/checkpoint.json task/phase/nextAction/pending injected into agent context'],
    boundary: ['hooks/stilo-state.js#validateCheckpoint', 'checkpoint next action presented as plugin instruction'],
    subsystem: ['hooks', 'hooks'],
    attack: ['AI-AND-LLM.md#Indirect injection through retrieved or ingested content', 'Indirect injection through retrieved or ingested content'],
    ordinary: null,
    companions: AI('Indirect injection through retrieved or ingested content'),
    starting: ['hooks/stilo-instructions.js', 'hooks/stilo-state.js'],
    excluded: [{ block: 'ATTACK-CLASSES.md#Injection', reason: 'checkpoint values reach no shell/SQL/HTML sink; model context only' }],
  },
  {
    surface: ['hooks/stilo-subagent.js#main', 'SubagentStart full-context injection'],
    boundary: ['hooks/stilo-instructions.js#buildInjectedContext', 'sub-agents inherit repo-derived state and plugin instructions'],
    subsystem: ['hooks', 'hooks'],
    attack: ['AI-AND-LLM.md#Sub-agent and MCP trust inheritance', 'Sub-agent and MCP trust inheritance'],
    ordinary: null,
    companions: AI('Sub-agent and MCP trust inheritance'),
    starting: ['hooks/stilo-subagent.js', 'hooks/stilo-instructions.js', 'hooks/stilo-runtime.js'],
    excluded: [{ block: 'AI-AND-LLM.md#MCP server and tool identity confusion', reason: 'the plugin registers no MCP server or tool' }],
  },
  {
    surface: ['hooks/stilo-setup.js#probeGitHubCli', 'SessionStart spawn of gh --version from the project cwd'],
    boundary: ['hooks/stilo-setup.js#probeGitHubCli', 'bare-name executable resolution with shell:false'],
    subsystem: ['hooks', 'hooks'],
    attack: ['DESKTOP-MOBILE-AND-LOCAL-IPC.md#Install, update, and repair path trust', 'Install, update, and repair path trust'],
    ordinary: null,
    companions: IPC('Install, update, and repair path trust'),
    starting: ['hooks/stilo-setup.js', 'hooks/stilo-activate.js', 'hooks/claude-codex-hooks.json'],
    excluded: [{ block: 'DESKTOP-MOBILE-AND-LOCAL-IPC.md#IPC peer-authentication gaps', reason: 'no IPC channel; only stdin/stdout to the host' }],
  },
  {
    surface: ['scripts/setup-github-cli.js#ensureGitHubCli', 'agent-run package-manager and gh spawns'],
    boundary: ['scripts/setup-github-cli.js#realRun', 'bare-name executable resolution with inherited env and cwd'],
    subsystem: ['scripts', 'scripts'],
    attack: ['DESKTOP-MOBILE-AND-LOCAL-IPC.md#Install, update, and repair path trust', 'Install, update, and repair path trust'],
    ordinary: 'ATTACK-CLASSES.md#Injection',
    companions: IPC('Install, update, and repair path trust'),
    starting: ['scripts/setup-github-cli.js', 'hooks/stilo-setup.js'],
    excluded: [{ block: 'SUPPLY-CHAIN-AND-RELEASE.md#Dependency source and namespace confusion', reason: 'package source configuration (winget/brew/apt/dnf repositories) is host state outside source' }],
  },
  {
    surface: ['scripts/setup-github-cli.js#ensureGitHubCli', 'setup lock and receipt files'],
    boundary: ['scripts/setup-github-cli.js#readReceipt', 'state directory ownership and exclusive creation'],
    subsystem: ['scripts', 'scripts'],
    attack: ['DESKTOP-MOBILE-AND-LOCAL-IPC.md#Local file ownership and TOCTOU', 'Local file ownership and TOCTOU'],
    ordinary: null,
    companions: IPC('Local file ownership and TOCTOU'),
    starting: ['scripts/setup-github-cli.js', 'hooks/stilo-setup.js', 'hooks/stilo-state.js'],
    excluded: [{ block: 'DESKTOP-MOBILE-AND-LOCAL-IPC.md#Credential-store and local-secret boundary mismatch', reason: 'login is explicitly not performed; no credential is read or stored' }],
  },
  {
    surface: ['hooks/stilo-setup.js#buildSetupNote', 'injected instruction to run the GitHub CLI installer'],
    boundary: ['hooks/stilo-setup.js#buildSetupNote', 'agent authority to install software on the user host'],
    subsystem: ['hooks', 'hooks'],
    attack: ['AI-AND-LLM.md#Excessive agency and confused-deputy authority', 'Excessive agency and confused-deputy authority'],
    ordinary: null,
    companions: AI('Excessive agency and confused-deputy authority'),
    starting: ['hooks/stilo-setup.js', 'scripts/setup-github-cli.js', 'docs/preparacao-github-cli.md'],
    excluded: [{ block: 'AI-AND-LLM.md#Unbounded delegated action loops', reason: 'note forbids automatic --retry and repetition; loop control is a separate claim inside this unit if found' }],
  },
  {
    surface: ['scripts/evaluate-harness.js#main', 'evaluated copy src/records.js executed by the harness'],
    boundary: ['scripts/evaluate-harness.js#vm.Script.runInContext', 'node:vm used to run lower-trust code'],
    subsystem: ['scripts', 'scripts'],
    attack: ['ATTACK-CLASSES.md#Injection', 'Injection'],
    ordinary: 'ATTACK-CLASSES.md#Injection',
    companions: [],
    starting: ['scripts/evaluate-harness.js', 'docs/avaliacao-agente.md', 'tests/harness-evaluation.test.js'],
    excluded: [{ block: 'MEMORY-SAFETY-AND-BINARY.md#Core discipline', reason: 'JavaScript only; no native code' }],
  },
  {
    surface: ['scripts/validate-plan.js#main', 'markdown plan file parsed from argv'],
    boundary: ['scripts/validate-plan.js#parsePlan', 'parser and graph work on repo-provided plans'],
    subsystem: ['scripts', 'scripts'],
    attack: ['RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Superlinear parsing, matching, or evaluation', 'Superlinear parsing, matching, or evaluation'],
    ordinary: null,
    companions: RE('Superlinear parsing, matching, or evaluation'),
    starting: ['scripts/validate-plan.js'],
    excluded: [{ block: 'RESOURCE-EXHAUSTION-AND-AVAILABILITY.md#Pre-authentication work imbalance', reason: 'local CLI run by the user or agent; no shared service' }],
  },
  {
    surface: ['.claude-plugin/marketplace.json#plugins', 'plugin distribution and hook registration'],
    boundary: ['hooks/claude-codex-hooks.json#hooks', 'what an installed or updated plugin may execute and inject'],
    subsystem: ['plugin-packaging', 'plugin packaging'],
    attack: ['SUPPLY-CHAIN-AND-RELEASE.md#Plugin and extension trust expansion', 'Plugin and extension trust expansion'],
    ordinary: null,
    companions: SC('Plugin and extension trust expansion'),
    starting: ['.claude-plugin/marketplace.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'hooks/claude-codex-hooks.json', 'package.json'],
    excluded: [{ block: 'SUPPLY-CHAIN-AND-RELEASE.md#Untrusted code in a privileged workflow', reason: 'no CI configuration in the repository (no .github/)' }],
  },
  {
    surface: ['hooks/stilo-state.js#validateState', 'repo-provided phase, reviewRound and project lifecycle state'],
    boundary: ['hooks/stilo-instructions.js#buildFullContext', 'pipeline state machine and fallback behavior'],
    subsystem: ['hooks', 'hooks'],
    attack: ['ATTACK-CLASSES.md#Business logic', 'Business logic'],
    ordinary: 'ATTACK-CLASSES.md#Business logic',
    companions: [],
    starting: ['hooks/stilo-state.js', 'hooks/stilo-instructions.js', 'hooks/stilo-context.js', 'hooks/stilo-prompt.js'],
    excluded: [{ block: 'ATTACK-CLASSES.md#Access control', reason: 'no multi-user authorization model; single-user local tool' }],
  },
  {
    surface: ['repository#tracked-files', 'all tracked product files'],
    boundary: ['repository#tracked-files', 'basic exposure checklist'],
    subsystem: ['repository', 'repository'],
    attack: ['ATTACK-CLASSES.md#Obvious things', 'Obvious things'],
    ordinary: 'ATTACK-CLASSES.md#Obvious things',
    companions: [],
    starting: ['hooks', 'scripts', '.claude-plugin', '.codex-plugin', 'package.json', '.gitignore'],
    excluded: [],
  },
  {
    surface: ['repository#product-code', 'hooks and scripts outside assigned classes'],
    boundary: ['repository#product-code', 'unassigned behavior, fallbacks and compatibility paths'],
    subsystem: ['repository', 'repository'],
    attack: ['ATTACK-CLASSES.md#Wildcard', 'Wildcard'],
    ordinary: 'ATTACK-CLASSES.md#Wildcard',
    companions: [],
    starting: ['hooks', 'scripts'],
    excluded: [],
  },
  {
    surface: ['hooks/stilo-diagnostics.js#diagnoseProject', 'cycle.json, aceite.md and cycle document reads'],
    boundary: ['hooks/stilo-diagnostics.js#readCycle', 'diagnostics reads of repo-controlled files'],
    subsystem: ['hooks', 'hooks'],
    attack: ['ATTACK-CLASSES.md#Resource and file handling', 'Resource and file handling'],
    ordinary: 'ATTACK-CLASSES.md#Resource and file handling',
    companions: [],
    starting: ['hooks/stilo-diagnostics.js', 'hooks/stilo-instructions.js'],
    excluded: [],
    notApplicable: 'diagnoseProject and buildDoctorReport have no caller in hooks/ or scripts/ (recon 1b §0, 1c §6); not reachable from any entry surface at this source ref',
  },
];

const ledger = units.map((u) => {
  const canonical_refs = { surface: u.surface[0], boundary: u.boundary[0], subsystem: u.subsystem[0], attack_class: u.attack[0] };
  const coverage_id = [canonical_refs.surface, canonical_refs.boundary, canonical_refs.subsystem, canonical_refs.attack_class].map(enc).join('::');
  const na = Boolean(u.notApplicable);
  return {
    coverage_id,
    canonical_refs,
    surface: u.surface[1],
    boundary: u.boundary[1],
    subsystem: u.subsystem[1],
    attack_class: u.attack[1],
    starting_paths: u.starting,
    ordinary_attack_class_block: u.ordinary,
    selected_companion_blocks: u.companions,
    excluded_blocks: u.excluded,
    prior_status: 'none',
    attempts: [],
    wave: 1,
    status: na ? 'not_applicable' : 'planned',
    agent_id: null,
    reviewed_paths: [],
    local_checks: [],
    result_fingerprints: [],
    unresolved: na ? [u.notApplicable] : [],
  };
});
ledger.sort((a, b) => (a.coverage_id < b.coverage_id ? -1 : a.coverage_id > b.coverage_id ? 1 : 0));
fs.writeFileSync(process.argv[2], JSON.stringify(ledger, null, 2) + '\n');
console.log(`${ledger.length} unidades`);
