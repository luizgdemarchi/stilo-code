// Acrescenta unidades aceitas do crítico ao ledger, já atribuídas (in_progress) para a onda indicada.
// Uso: node audit-add-units.js <run-dir> <novas.json>
// novas.json: [{ refs:{surface,boundary,subsystem,attack_class}, labels:{...}, starting, ordinary, companions, excluded, wave, agent, reason }]
const fs = require('fs');
const path = require('path');
const [run, novasPath] = process.argv.slice(2);
const enc = (ref) => {
  if (ref !== ref.normalize('NFC') || ref.trim() !== ref || !ref) throw new Error('ref inválida: ' + ref);
  return Array.from(Buffer.from(ref, 'utf8')).map((b) => {
    const c = String.fromCharCode(b);
    return /[A-Za-z0-9\-._~]/.test(c) ? c : '%' + b.toString(16).toUpperCase().padStart(2, '0');
  }).join('');
};
const ledgerPath = path.join(run, 'coverage-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const novas = JSON.parse(fs.readFileSync(novasPath, 'utf8'));
for (const n of novas) {
  const r = n.refs;
  const id = [r.surface, r.boundary, r.subsystem, r.attack_class].map(enc).join('::');
  if (ledger.some((u) => u.coverage_id === id)) throw new Error('colisão de ID: ' + id);
  ledger.push({
    coverage_id: id,
    canonical_refs: { surface: r.surface, boundary: r.boundary, subsystem: r.subsystem, attack_class: r.attack_class },
    surface: n.labels.surface, boundary: n.labels.boundary, subsystem: n.labels.subsystem, attack_class: n.labels.attack_class,
    starting_paths: n.starting,
    ordinary_attack_class_block: n.ordinary,
    selected_companion_blocks: n.companions,
    excluded_blocks: n.excluded,
    prior_status: 'none',
    attempts: [],
    wave: n.wave,
    status: n.agent ? 'in_progress' : 'planned',
    agent_id: n.agent,
    reviewed_paths: [], local_checks: [], result_fingerprints: [], unresolved: [],
    critic_reason: n.reason,
  });
  console.log('nova unidade', id, '->', n.agent);
}
ledger.sort((a, b) => (a.coverage_id < b.coverage_id ? -1 : a.coverage_id > b.coverage_id ? 1 : 0));
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
