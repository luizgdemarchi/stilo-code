const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { diagnoseProject } = require('../hooks/stilo-diagnostics.js');

function tmpdir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-doctor-')));
}

function criaProjeto(raiz, state, nome = 'app') {
  const projeto = path.join(raiz, nome);
  const stilo = path.join(projeto, '.stilo');
  fs.mkdirSync(stilo, { recursive: true });
  fs.writeFileSync(path.join(stilo, 'state.json'), JSON.stringify(state));
  return { projeto, stilo };
}

function estado(overrides) {
  return Object.assign(
    { version: 1, project: 'app', phase: 'REVIEW', reviewRound: 2, enxuto: 'auto' },
    overrides
  );
}

test('diagnoseProject é somente leitura e relata artefatos da fase', () => {
  const raiz = tmpdir();
  const { projeto, stilo } = criaProjeto(raiz, estado());
  fs.writeFileSync(path.join(projeto, 'spec.md'), '# Spec\n');
  fs.writeFileSync(path.join(projeto, 'plan.md'), '# Plano\n');
  fs.writeFileSync(path.join(stilo, 'review-02.md'), '# Review 02\n');
  fs.writeFileSync(path.join(stilo, 'checkpoint.json'), '{ "task": "T2" }');
  fs.writeFileSync(path.join(stilo, 'cycle.json'), '{ "id": "retomada" }');
  fs.mkdirSync(path.join(projeto, 'docs'));
  fs.writeFileSync(path.join(projeto, 'docs', 'aceite.md'), '# Evidências\n');
  const antes = fs.readdirSync(stilo).sort();

  const diagnostico = diagnoseProject(raiz);

  assert.strictEqual(diagnostico.status, 'valid');
  assert.match(diagnostico.statePath, /state\.json$/);
  assert.deepStrictEqual(
    diagnostico.checks.map((check) => [check.name, check.status]),
    [
      ['spec.md', 'ok'],
      ['plan.md', 'ok'],
      ['review-02.md', 'ok'],
    ]
  );
  assert.strictEqual(diagnostico.checkpoint.status, 'present');
  assert.strictEqual(diagnostico.cycle.status, 'present');
  assert.strictEqual(diagnostico.evidence.status, 'present');
  assert.deepStrictEqual(fs.readdirSync(stilo).sort(), antes);
});

test('diagnoseProject relata ausências e não cria arquivos', () => {
  const raiz = tmpdir();
  const { projeto, stilo } = criaProjeto(raiz, estado({ phase: 'EXECUTE', reviewRound: 0 }));
  const antes = fs.readdirSync(stilo).sort();

  const diagnostico = diagnoseProject(raiz);

  assert.strictEqual(diagnostico.status, 'valid');
  assert.deepStrictEqual(
    diagnostico.checks.map((check) => [check.name, check.status]),
    [
      ['spec.md', 'missing'],
      ['plan.md', 'missing'],
    ]
  );
  assert.strictEqual(diagnostico.checkpoint.status, 'absent');
  assert.strictEqual(diagnostico.cycle.status, 'absent');
  assert.strictEqual(diagnostico.evidence.status, 'absent');
  assert.deepStrictEqual(fs.readdirSync(stilo).sort(), antes);
  assert.strictEqual(fs.existsSync(path.join(projeto, 'docs')), false);
});

test('diagnoseProject propaga state ilegível e ambiguidade', () => {
  const ilegivel = tmpdir();
  const { stilo } = criaProjeto(ilegivel, estado());
  fs.writeFileSync(path.join(stilo, 'state.json'), '{');
  const diagnosticoIlegivel = diagnoseProject(ilegivel);
  assert.strictEqual(diagnosticoIlegivel.status, 'unreadable');
  assert.match(diagnosticoIlegivel.statePath, /state\.json$/);
  assert.match(diagnosticoIlegivel.error, /JSON|fim|token|parse/i);

  const ambiguo = tmpdir();
  criaProjeto(ambiguo, estado({ project: 'a' }), 'a');
  criaProjeto(ambiguo, estado({ project: 'b' }), 'b');
  const diagnosticoAmbiguo = diagnoseProject(ambiguo);
  assert.strictEqual(diagnosticoAmbiguo.status, 'ambiguous');
  assert.strictEqual(diagnosticoAmbiguo.caminhos.length, 2);
});
