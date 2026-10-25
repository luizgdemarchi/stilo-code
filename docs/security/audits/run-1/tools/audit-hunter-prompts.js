// Monta os prompts dos caçadores (Fase 2) a partir da skill, do architecture.md e do ledger.
// Uso: node audit-hunter-prompts.js <skill-dir> <run-dir> <atribuicoes.json>
// atribuicoes.json: [{ "agent": "hunter-x", "units": ["<coverage_id>", ...] }]
const fs = require('fs');
const path = require('path');

const [skill, run, atribPath] = process.argv.slice(2);
const le = (f) => fs.readFileSync(path.join(skill, f), 'utf8');
const ledger = JSON.parse(fs.readFileSync(path.join(run, 'coverage-ledger.json'), 'utf8'));
const atrib = JSON.parse(fs.readFileSync(atribPath, 'utf8'));
const arquitetura = fs.readFileSync(path.join(run, 'architecture.md'), 'utf8');

function secao(texto, titulo) {
  // "## Core discipline (…)" até o próximo "## "
  const linhas = texto.split('\n');
  const i = linhas.findIndex((l) => /^##\s/.test(l) && l.replace(/^##\s+/, '').startsWith(titulo));
  if (i < 0) throw new Error('seção ausente: ' + titulo);
  let j = i + 1;
  while (j < linhas.length && !/^##\s/.test(linhas[j])) j++;
  return linhas.slice(i, j).join('\n').trim();
}

function classe(texto, nome) {
  // "**Nome**" até a próxima linha que começa com "**" ou "## "
  const linhas = texto.split('\n');
  const i = linhas.findIndex((l) => l.startsWith(`**${nome}**`));
  if (i < 0) throw new Error('classe ausente: ' + nome);
  let j = i + 1;
  while (j < linhas.length && !linhas[j].startsWith('**') && !/^##\s/.test(linhas[j])) j++;
  return linhas.slice(i, j).join('\n').trim();
}

function bloco(ref) {
  const [arquivo, nome] = ref.split('#');
  const texto = le(arquivo);
  if (['Core discipline', 'Universal moves', 'Validation rules'].includes(nome)) return secao(texto, nome);
  return classe(texto, nome);
}

function cercado(arquivoMd, titulo) {
  // primeiro bloco ```text após o título
  const texto = le(arquivoMd);
  const i = texto.indexOf(titulo);
  if (i < 0) throw new Error('título ausente: ' + titulo);
  const a = texto.indexOf('```', i);
  const b = texto.indexOf('```', a + 3);
  return texto.slice(a, b + 3);
}

const metodo = cercado('HUNTING.md', '#### Core hunting method');
const promocao = cercado('HUNTING.md', '#### Promotion procedure');
const gate = cercado('HUNTING.md', '#### Core validation rules');
const hunting = le('HUNTING.md');
const iRes = hunting.indexOf('## Structured hunter result');
const fimRes = hunting.indexOf('## Parent consolidation');
const resultado = hunting.slice(iRes, fimRes).trim();

const schema = JSON.parse(le('report-schema.json'));
const ramo = (v) => schema.items.oneOf.find((r) => r.properties && r.properties.verdict && r.properties.verdict.const === v);
const ramos = JSON.stringify({ confirmed: ramo('confirmed'), needs_validation: ramo('needs_validation') }, null, 2);

const todos = atrib.flatMap((a) => a.units.map((id) => ({ id, agent: a.agent })));
fs.mkdirSync(path.join(run, 'prompts'), { recursive: true });

for (const a of atrib) {
  const us = a.units.map((id) => {
    const u = ledger.find((x) => x.coverage_id === id);
    if (!u) throw new Error('unidade ausente: ' + id);
    return u;
  });
  const selecionados = [...new Set(us.flatMap((u) => [u.ordinary_attack_class_block, ...u.selected_companion_blocks].filter(Boolean)))];
  const excluidos = us.flatMap((u) => u.excluded_blocks.map((e) => `- ${e.block} (unit ${u.coverage_id}): ${e.reason}`));
  const pares = todos.filter((t) => t.agent !== a.agent).map((t) => `- ${t.id} (owner ${t.agent})`);
  const partes = [
    `# Hunter prompt — ${a.agent}`,
    '## 1. Role',
    'Your goal is to find source-grounded security invariant failures in your assigned coverage units of the stilo-code repository. You must return exactly one JSON object matching the structured-result contract at the end of this prompt, with no surrounding prose.',
    '## 2. architecture.md (verbatim)',
    arquitetura.trim(),
    '## 3. Assigned units and block maps',
    us.map((u) => '```json\n' + JSON.stringify({
      coverage_id: u.coverage_id, surface: u.surface, boundary: u.boundary, subsystem: u.subsystem,
      attack_class: u.attack_class, starting_paths: u.starting_paths,
      ordinary_attack_class_block: u.ordinary_attack_class_block,
      selected_companion_blocks: u.selected_companion_blocks,
    }, null, 2) + '\n```').join('\n\n'),
    'Target repository root (read-only): C:\\Users\\luizg\\Documents\\claude code\\stilo-code at commit 6f01438. All paths you report are repository-relative.',
    '## 4. Selected blocks (verbatim)',
    selecionados.map((r) => `### ${r}\n\n${bloco(r)}`).join('\n\n'),
    '## 5. Excluded blocks',
    excluidos.length ? excluidos.join('\n') : '- none',
    '## 6. Core hunting method and promotion procedure',
    metodo,
    promocao,
    '## 7. Core validation rules',
    gate,
    '## 8. Exclusions and peer-owned units',
    'Carried same-source prior confirmed exclusions: none (first run).',
    'Peer-owned coverage IDs you must not duplicate:',
    pares.join('\n'),
    '## 9. Execution, scratch and result contract',
    `Agent ID: ${a.agent}. Scratch: C:\\Users\\luizg\\security-audit-skill\\stilo-code\\run-1\\agents\\${a.agent}\\scratch\\ (the only writable location; you should not need it). Parent-owned artifacts: agents/${a.agent}/artifacts/ (you never write there).`,
    'Promotion allowlist: empty; per-file and cumulative byte limits: 0. The parent verified that this host has NO OS-enforced sandbox (no WSL2, Docker, Windows Sandbox; no no-follow descriptor APIs for promotion). Therefore do not execute any target-controlled code, tests, scripts or hooks. Use method "source" with artifact null for every check. When a decisive fact can only be established by execution or by host/runtime behavior, return needs_validation with that exact blocker.',
    'You may use read-only tools (Read, Grep, Glob, git show/log). You may read Node.js documentation already present locally if any; do not use the network.',
    resultado,
    'Schema branches for candidate records (confirmed and needs_validation), verbatim from report-schema.json:',
    '```json\n' + ramos + '\n```',
  ];
  fs.writeFileSync(path.join(run, 'prompts', `${a.agent}.md`), partes.join('\n\n') + '\n');
  fs.mkdirSync(path.join(run, 'agents', a.agent, 'scratch'), { recursive: true });
  fs.mkdirSync(path.join(run, 'agents', a.agent, 'artifacts'), { recursive: true });
  console.log(a.agent, us.length, 'unidade(s),', selecionados.length, 'blocos');
}
