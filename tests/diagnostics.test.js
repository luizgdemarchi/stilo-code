const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { diagnoseProject, readCycle, readEvidence } = require('../hooks/stilo-diagnostics.js');

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

test('diagnoseProject aponta DONE com evidência obrigatória pendente sem alterar arquivos', () => {
  const raiz = tmpdir();
  const { projeto, stilo } = criaProjeto(raiz, estado({ phase: 'DONE', reviewRound: 0 }));
  fs.writeFileSync(path.join(projeto, 'spec.md'), '# Spec\n');
  fs.writeFileSync(path.join(projeto, 'plan.md'), '# Plano\n');
  fs.mkdirSync(path.join(projeto, 'docs'));
  fs.writeFileSync(
    path.join(projeto, 'docs', 'aceite.md'),
    [
      '| Critério | Tarefa | Comando | Tipo | Resultado | Review |',
      '|---|---|---|---|---|---|',
      ...Array.from({ length: 21 }, (_, index) => {
        const criterion = index + 1;
        const type = criterion === 2 ? 'pendente' : 'local';
        return `| ${criterion} | T5 | teste ${criterion} | ${type} | resultado ${criterion} | review-05 |`;
      }),
      '',
    ].join('\n')
  );
  const statePath = path.join(stilo, 'state.json');
  const antes = fs.readFileSync(statePath, 'utf8');

  const diagnostico = diagnoseProject(raiz);

  assert.strictEqual(diagnostico.completion.status, 'pending');
  assert.strictEqual(diagnostico.completion.mandatory, true);
  assert.deepStrictEqual(diagnostico.completion.criteria, ['2']);
  assert.match(diagnostico.completion.reason, /evidência obrigatória pendente/i);
  assert.strictEqual(diagnostico.evidence.criteria.length, 21);
  assert.deepStrictEqual(diagnostico.evidence.errors, []);
  assert.strictEqual(fs.readFileSync(statePath, 'utf8'), antes);
  assert.deepStrictEqual(fs.readdirSync(stilo).sort(), ['state.json']);
});

test('readEvidence separa tipos e relata linha inválida', () => {
  const raiz = tmpdir();
  const arquivo = path.join(raiz, 'aceite.md');
  fs.writeFileSync(
    arquivo,
    [
      '| Critério | Tarefa | Comando | Tipo | Resultado | Review |',
      '|---|---|---|---|---|---|',
      '| 1 | T2 | `node --test` | local | passou | review-05 |',
      '| 2 | T6 | OpenCode CLI | externo | não executado | review-05 |',
      '',
    ].join('\n')
  );

  const evidence = readEvidence(arquivo);

  assert.strictEqual(evidence.status, 'present');
  assert.deepStrictEqual(evidence.criteria.map((item) => [item.criterion, item.type]), [['1', 'local']]);
  assert.deepStrictEqual(evidence.errors, [
    'linha 4: tipo deve ser local, viva ou pendente',
    'critérios obrigatórios ausentes: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21',
  ]);
});

test('readEvidence exige cobertura única dos 21 critérios e mantém DONE pendente', () => {
  const raiz = tmpdir();
  const { projeto } = criaProjeto(raiz, estado({ phase: 'DONE', reviewRound: 0 }));
  fs.writeFileSync(path.join(projeto, 'spec.md'), '# Spec\n');
  fs.writeFileSync(path.join(projeto, 'plan.md'), '# Plano\n');
  fs.mkdirSync(path.join(projeto, 'docs'));
  fs.writeFileSync(
    path.join(projeto, 'docs', 'aceite.md'),
    [
      '| Critério | Tarefa | Comando | Tipo | Resultado | Review |',
      '|---|---|---|---|---|---|',
      '| 1 | T5 | teste local | local | passou | review-05 |',
      '| 1 | T5 | teste repetido | local | passou | review-05 |',
      '',
    ].join('\n')
  );

  const diagnostico = diagnoseProject(projeto);

  assert.deepStrictEqual(diagnostico.evidence.duplicates, ['1']);
  assert.deepStrictEqual(diagnostico.evidence.missing, ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21']);
  assert.match(diagnostico.evidence.errors.join('\n'), /critério duplicado: 1/i);
  assert.match(diagnostico.evidence.errors.join('\n'), /critérios obrigatórios ausentes: 2, 3, 4/i);
  assert.strictEqual(diagnostico.completion.status, 'pending');
  assert.deepStrictEqual(diagnostico.completion.criteria, [...diagnostico.evidence.missing, '1']);
});

test('docs/aceite registra os 21 critérios e mantém o smoke OpenCode pendente', () => {
  const evidence = readEvidence(path.join(__dirname, '..', 'docs', 'aceite.md'));

  assert.strictEqual(evidence.criteria.length, 21);
  assert.deepStrictEqual(evidence.errors, []);
  const openCode = evidence.criteria.find((criterion) => criterion.criterion === '15');
  assert.strictEqual(openCode.type, 'pendente');
  assert.strictEqual(openCode.command, 'smoke test OpenCode');
  assert.strictEqual(openCode.result, 'N\u00e3o executado por dispensa do usu\u00e1rio; sem alega\u00e7\u00e3o de compatibilidade viva');
});

test('readCycle tolera campos legados, rejeita id inseguro e diagnóstico lista documentos do ciclo', () => {
  const raiz = tmpdir();
  const legadoPath = path.join(raiz, 'legado.json');
  fs.writeFileSync(legadoPath, '{ "id": "ciclo-legado" }');
  assert.deepStrictEqual(
    (({ id, started, baseReview, errors }) => ({ id, started, baseReview, errors }))(readCycle(legadoPath)),
    {
      id: 'ciclo-legado',
      started: null,
      baseReview: null,
      errors: ['started ausente ou vazio', 'baseReview ausente ou inválido'],
    }
  );

  const inseguroPath = path.join(raiz, 'inseguro.json');
  fs.writeFileSync(inseguroPath, '{ "id": "../fora", "started": "2026-09-08T00:00:00Z", "baseReview": 4 }');
  assert.strictEqual(readCycle(inseguroPath).status, 'invalid');

  const { projeto, stilo } = criaProjeto(raiz, estado({ phase: 'REVIEW', reviewRound: 0 }), 'ciclo');
  fs.writeFileSync(
    path.join(stilo, 'cycle.json'),
    '{ "id": "2026-09-07-retomada-confiavel-governanca", "started": "2026-09-08T00:00:00Z", "baseReview": 4 }'
  );
  const specDir = path.join(projeto, 'docs', 'superpowers', 'specs');
  const planDir = path.join(projeto, 'docs', 'superpowers', 'plans');
  fs.mkdirSync(specDir, { recursive: true });
  fs.mkdirSync(planDir, { recursive: true });
  fs.writeFileSync(path.join(specDir, '2026-09-04-ciclo-anterior-design.md'), '# anterior\n');
  fs.writeFileSync(path.join(specDir, '2026-09-07-retomada-confiavel-governanca-design.md'), '# atual\n');
  fs.writeFileSync(path.join(planDir, '2026-09-04-ciclo-anterior-plan.md'), '# anterior\n');
  fs.writeFileSync(path.join(planDir, '2026-09-07-retomada-confiavel-governanca-plan.md'), '# atual\n');

  const diagnostico = diagnoseProject(projeto);

  assert.deepStrictEqual(
    diagnostico.cycle.documents.map((document) => [document.name, document.status]),
    [['spec do ciclo', 'ok'], ['plano do ciclo', 'ok']]
  );
  assert.strictEqual(fs.existsSync(path.join(specDir, '2026-09-04-ciclo-anterior-design.md')), true);
  assert.strictEqual(fs.existsSync(path.join(planDir, '2026-09-04-ciclo-anterior-plan.md')), true);
});
