// Monta os prompts dos verificadores de candidatos (Fase 3).
// Uso: node audit-verifier-prompts.js <skill-dir> <run-dir> <candidates.json>
// Gera prompts/verifier-<n>.md e verifiers-map.json (verificador -> fingerprint).
const fs = require('fs');
const path = require('path');
const [skill, run, candPath] = process.argv.slice(2);
const le = (f) => fs.readFileSync(path.join(skill, f), 'utf8');
const ledger = JSON.parse(fs.readFileSync(path.join(run, 'coverage-ledger.json'), 'utf8'));
const cands = JSON.parse(fs.readFileSync(candPath, 'utf8'));
const arquitetura = fs.readFileSync(path.join(run, 'architecture.md'), 'utf8').trim();

const val = le('VALIDATION-AND-REPORTING.md');
function cercadoApos(texto, marcador) {
  const i = texto.indexOf(marcador);
  if (i < 0) throw new Error('marcador ausente: ' + marcador);
  const a = texto.indexOf('```', i);
  const b = texto.indexOf('```', a + 3);
  return texto.slice(a, b + 3);
}
const promptVerificador = cercadoApos(val, '#### Candidate-verifier prompt');
const promocao = cercadoApos(val, 'Copy this promotion procedure verbatim into every candidate-verifier prompt');

function secao(texto, titulo) {
  const linhas = texto.split('\n');
  const i = linhas.findIndex((l) => /^##\s/.test(l) && l.replace(/^##\s+/, '').startsWith(titulo));
  if (i < 0) throw new Error('seção ausente: ' + titulo);
  let j = i + 1;
  while (j < linhas.length && !/^##\s/.test(linhas[j])) j++;
  return linhas.slice(i, j).join('\n').trim();
}

const schema = JSON.parse(le('report-schema.json'));
const ramo = (v) => schema.items.oneOf.find((r) => r.properties && r.properties.verdict && r.properties.verdict.const === v);
const ramos = JSON.stringify({ confirmed: ramo('confirmed'), needs_validation: ramo('needs_validation'), rejected: ramo('rejected') }, null, 2);

const mapa = [];
cands.forEach((c, i) => {
  const id = `verifier-${String(i + 1).padStart(2, '0')}`;
  const unidades = ledger.filter((u) => (u.result_fingerprints || []).includes(c.fingerprint));
  if (!unidades.length) throw new Error('candidato sem unidade: ' + c.fingerprint);
  const companions = [...new Set(unidades.flatMap((u) => u.selected_companion_blocks.map((b) => b.split('#')[0])))];
  const blocosValidacao = companions.map((f) => `### ${f}#Validation rules\n\n${secao(le(f), 'Validation rules')}`).join('\n\n');
  const vinculos = unidades.map((u) => ({ coverage_id: u.coverage_id, assignment_owner: u.agent_id, checks: u.local_checks }));
  const registro = Object.assign({}, c);
  delete registro.hunter;
  const partes = [
    `# Candidate verifier prompt — ${id}`,
    promptVerificador,
    '## Promotion procedure (verbatim)',
    promocao,
    '## Candidate (as proposed by the hunter; you did not write it)',
    '```json\n' + JSON.stringify(registro, null, 2) + '\n```',
    '## Linked coverage-unit checks and artifact paths',
    'Artifact paths are relative to C:\\Users\\luizg\\security-audit-skill\\stilo-code\\run-1\\ and may be read.',
    '```json\n' + JSON.stringify(vinculos, null, 2) + '\n```',
    '## Architecture facts (architecture.md)',
    arquitetura,
    '## Relevant companion validation blocks (verbatim)',
    blocosValidacao || '- none (ordinary attack class only)',
    '## Source/local execution boundary for this run',
    'Target repository (read-only): C:\\Users\\luizg\\Documents\\claude code\\stilo-code at commit 6f01438. This host has NO OS-enforced sandbox (no WSL2, Docker or Windows Sandbox) and no no-follow descriptor APIs, so safe promotion of scratch files is unavailable. Do not execute any target-controlled code, test, hook or script. Your own scratch directory is C:\\Users\\luizg\\security-audit-skill\\stilo-code\\run-1\\agents\\' + id + '\\scratch\\ and you should not need it. The parent ran one platform probe that executed no repository code; where linked above, its artifact is agents/parent-probe/artifacts/cwd-resolution-probe.json and you may rely on it as parent-promoted evidence after reading it. Facts about Claude Code/Codex hook processes (cwd, environment, trust prompts) and model behavior are host facts not observed in this run.',
    '## Prior records with the same fingerprint',
    'None (first run).',
    '## Schema branches (verbatim from report-schema.json)',
    'The record you return must match exactly the branch for your decision (additionalProperties is false; the record includes "verdict").',
    '```json\n' + ramos + '\n```',
  ];
  fs.writeFileSync(path.join(run, 'prompts', `${id}.md`), partes.join('\n\n') + '\n');
  fs.mkdirSync(path.join(run, 'agents', id, 'scratch'), { recursive: true });
  fs.mkdirSync(path.join(run, 'agents', id, 'artifacts'), { recursive: true });
  mapa.push({ verifier: id, fingerprint: c.fingerprint, units: unidades.map((u) => u.coverage_id) });
});
fs.writeFileSync(path.join(run, 'verifiers-map.json'), JSON.stringify(mapa, null, 2) + '\n');
console.log(mapa.map((m) => `${m.verifier} <- ${m.fingerprint}`).join('\n'));
