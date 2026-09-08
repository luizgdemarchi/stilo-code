const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'validate-plan.js');

function tarefa(id, { especialista = 'Node.js', files = [`Modify: src/${id}.js`], dependsOn = 'nenhum' } = {}) {
  const blocoFiles = files === null
    ? ''
    : `\nFiles:\n${files.map((arquivo) => `- ${arquivo}`).join('\n')}`;

  return `### ${id} — tarefa\n\nID: ${id}\nEspecialista: ${especialista}.${blocoFiles}\n- Depends-on: ${dependsOn}\n`;
}

function plano(...tarefas) {
  return `# Plano\n\n${tarefas.join('\n')}`;
}

test('parsePlan extrai o contrato e validatePlan forma ondas pelas dependências', () => {
  const { parsePlan, validatePlan } = require(SCRIPT);
  const texto = plano(
    tarefa('T1'),
    tarefa('T2', { dependsOn: 'T1' }),
    tarefa('T3', { dependsOn: 'T1' }),
  );

  const parsed = parsePlan(texto);
  assert.deepStrictEqual(parsed.errors, []);
  assert.deepStrictEqual(parsed.tasks.map(({ id, specialist, files, dependsOn }) => ({
    id,
    specialist,
    files: files.map(({ action, path: filePath }) => ({ action, path: filePath })),
    dependsOn,
  })), [
    { id: 'T1', specialist: 'Node.js.', files: [{ action: 'Modify', path: 'src/T1.js' }], dependsOn: [] },
    { id: 'T2', specialist: 'Node.js.', files: [{ action: 'Modify', path: 'src/T2.js' }], dependsOn: ['T1'] },
    { id: 'T3', specialist: 'Node.js.', files: [{ action: 'Modify', path: 'src/T3.js' }], dependsOn: ['T1'] },
  ]);

  const result = validatePlan(texto);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, []);
  assert.deepStrictEqual(result.waves.map((wave) => wave.map((task) => task.id)), [['T1'], ['T2', 'T3']]);
});

test('rejeita ID duplicado', () => {
  const { validatePlan } = require(SCRIPT);
  const result = validatePlan(plano(tarefa('T1'), tarefa('T1', { files: ['Modify: src/outro.js'] })));

  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join('\n'), /ID duplicado.*T1/i);
});

test('rejeita dependência inexistente', () => {
  const { validatePlan } = require(SCRIPT);
  const result = validatePlan(plano(tarefa('T1', { dependsOn: 'T9' })));

  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join('\n'), /dependência inexistente.*T9/i);
});

test('rejeita ciclo A-B-A', () => {
  const { validatePlan } = require(SCRIPT);
  const result = validatePlan(plano(
    tarefa('A', { dependsOn: 'B' }),
    tarefa('B', { dependsOn: 'A' }),
  ));

  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join('\n'), /ciclo.*A.*B.*A/i);
});

test('rejeita arquivo compartilhado por tarefas da mesma onda após normalização', () => {
  const { validatePlan } = require(SCRIPT);
  const result = validatePlan(plano(
    tarefa('T1', { files: ['Modify: ./src/recurso.js'] }),
    tarefa('T2', { files: ['Create: SRC\\recurso.js'] }),
  ));

  assert.strictEqual(result.valid, false);
  assert.match(result.errors.join('\n'), /arquivo compartilhado.*src\/recurso\.js.*T1.*T2/i);
});

test('parsePlan aponta a linha aproximada quando Files está ausente', () => {
  const { parsePlan } = require(SCRIPT);
  const result = parsePlan(plano(tarefa('T1', { files: null })));

  assert.match(result.errors.join('\n'), /linha \d+.*T1.*Files/i);
});

test('tarefa com caminho incerto depende de todas as anteriores e roda sozinha', () => {
  const { validatePlan } = require(SCRIPT);
  const semSerializacao = validatePlan(plano(
    tarefa('T1'),
    tarefa('T2'),
    tarefa('T3', { files: ['Modify: src/*.js'], dependsOn: 'T1' }),
  ));
  assert.strictEqual(semSerializacao.valid, false);
  assert.match(semSerializacao.errors.join('\n'), /T3.*incerta.*T2/i);

  const serializado = validatePlan(plano(
    tarefa('T1'),
    tarefa('T2', { dependsOn: 'T1' }),
    tarefa('T3', { files: ['Modify: src/*.js'], dependsOn: 'T1, T2' }),
  ));
  assert.strictEqual(serializado.valid, true);
  assert.deepStrictEqual(serializado.waves.map((wave) => wave.map((task) => task.id)), [['T1'], ['T2'], ['T3']]);
});

test('CLI retorna 0 para plano válido, 1 para erro de validação e 2 para uso ou arquivo inválido', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-validate-plan-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const valido = path.join(dir, 'valido.md');
  const invalido = path.join(dir, 'invalido.md');
  fs.writeFileSync(valido, plano(tarefa('T1')), 'utf8');
  fs.writeFileSync(invalido, plano(tarefa('T1', { dependsOn: 'T9' })), 'utf8');

  const ok = spawnSync(process.execPath, [SCRIPT, valido], { encoding: 'utf8' });
  assert.strictEqual(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /Plano válido.*1 tarefa.*1 onda/i);

  const erro = spawnSync(process.execPath, [SCRIPT, invalido], { encoding: 'utf8' });
  assert.strictEqual(erro.status, 1, erro.stdout + erro.stderr);
  assert.match(erro.stderr, /Plano inválido/i);

  const uso = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  assert.strictEqual(uso.status, 2, uso.stdout + uso.stderr);
  assert.match(uso.stderr, /Uso:/i);

  const ausente = spawnSync(process.execPath, [SCRIPT, path.join(dir, 'ausente.md')], { encoding: 'utf8' });
  assert.strictEqual(ausente.status, 2, ausente.stdout + ausente.stderr);
  assert.match(ausente.stderr, /Não foi possível ler/i);
});
