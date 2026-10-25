// Consolida o resultado estruturado de um caçador no ledger (Fase 2).
// Uso: node audit-consolidate.js <run-dir> <agent-id> <resultado.json>
// O resultado é o JSON devolvido pelo caçador, salvo pelo parent em agents/<id>/result.json.
const fs = require('fs');
const path = require('path');

const [run, agent, resPath] = process.argv.slice(2);
const ledgerPath = path.join(run, 'coverage-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const res = JSON.parse(fs.readFileSync(resPath, 'utf8'));
const SAFE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const relOk = (p) => typeof p === 'string' && p && !path.isAbsolute(p) && !/^[A-Za-z]:/.test(p) && !p.split(/[\\/]/).includes('..');

const meus = ledger.filter((u) => u.agent_id === agent && u.status === 'in_progress');
const vistos = new Set();
const erros = [];
for (const r of res.units || []) {
  const u = meus.find((x) => x.coverage_id === r.coverage_id);
  if (!u) { erros.push('unidade não atribuída: ' + r.coverage_id); continue; }
  if (vistos.has(r.coverage_id)) { erros.push('unidade duplicada: ' + r.coverage_id); continue; }
  vistos.add(r.coverage_id);
  if (!['covered', 'candidate', 'blocked'].includes(r.disposition)) { erros.push('disposição inválida: ' + r.disposition); continue; }
  const checks = (r.checks || []).map((c) => ({
    agent_id: c.agent_id, reviewed_paths: c.reviewed_paths, invariant: c.invariant,
    method: c.method, result: c.result, artifact: c.artifact,
  }));
  for (const c of checks) {
    if (!SAFE.test(c.agent_id || '')) erros.push('agent_id inseguro em check');
    if (c.method !== 'source' || c.artifact !== null) erros.push('check local/artefato não promovido não é aceito nesta rodada');
    if (!Array.isArray(c.reviewed_paths) || !c.reviewed_paths.length || !c.reviewed_paths.every(relOk)) erros.push('reviewed_paths inválidos em check');
  }
  const uniao = [...new Set(checks.flatMap((c) => c.reviewed_paths || []))].sort();
  u.status = r.disposition;
  u.reviewed_paths = uniao;
  u.local_checks = checks;
  u.result_fingerprints = r.disposition === 'candidate' ? [...new Set(r.candidate_fingerprints || [])] : [];
  u.unresolved = r.disposition === 'covered' ? [] : (r.unresolved || []);
  u.hardening_notes = res.hardening || [];
}
for (const u of meus) if (!vistos.has(u.coverage_id)) erros.push('unidade ausente no resultado: ' + u.coverage_id);
if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}
fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
const cands = (res.candidates || []).map((c) => `${c.fingerprint} [${c.proposed_verdict}] ${c.title}`);
console.log(`${agent}: ${vistos.size} unidade(s); candidatos: ${cands.length}`);
for (const c of cands) console.log('  ' + c);
console.log(`uncovered: ${(res.uncovered || []).length}; hardening: ${(res.hardening || []).length}`);
