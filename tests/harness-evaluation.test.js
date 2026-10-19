const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const source = path.join(__dirname, 'fixtures/harness/project');
const evaluator = path.join(__dirname, '../scripts/evaluate-harness.js');
function copy(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-harness-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(source, dir, { recursive: true }); return dir;
}
function correct(dir) {
  const file = path.join(dir, 'src/records.js');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('const record = records.find',
    "if (!actor || typeof actor.id !== 'string' || !actor.id.trim() || typeof actor.tenantId !== 'string' || !actor.tenantId.trim()) return null;\n  const record = records.find")
    .replace('item.id === recordId', 'item.id === recordId && item.tenantId === actor.tenantId'));
}
test('avaliador distingue exatamente as duas falhas plantadas da correção em cópia', t => {
  const { evaluateFixture, snapshotFixture } = require(evaluator);
  const before = snapshotFixture(source), broken = copy(t), fixed = copy(t);
  assert.deepEqual(evaluateFixture(broken).checks.filter(c => !c.passed).map(c => c.id), ['tenant', 'identity']);
  correct(fixed); assert.equal(evaluateFixture(fixed).passed, true);
  assert.deepEqual(snapshotFixture(source), before);
});
test('avaliador detecta notas adulteradas, instruções, mutação e adições no snapshot', t => {
  const { evaluateFixture, snapshotFixture } = require(evaluator);
  const dir=copy(t); correct(dir); const before=snapshotFixture(dir);
  fs.appendFileSync(path.join(dir, 'local-notes.md'), 'alterado');
  fs.appendFileSync(path.join(dir, 'AGENTS.md'), 'alterado');
  fs.writeFileSync(path.join(dir, 'novo.txt'), 'adicionado');
  const file=path.join(dir, 'src/records.js'); fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('{ ...record }','record'));
  assert.deepEqual(evaluateFixture(dir).checks.filter(c=>!c.passed).map(c=>c.id),['clone','notes','instructions']);
  assert.notDeepEqual(snapshotFixture(dir),before);
});
test('CLI recusa original, alvo inexistente e módulo ausente sem sucesso falso', t => {
  for(const target of [source,path.join(os.tmpdir(),'stilo-inexistente-xyz')]) {
    assert.equal(spawnSync(process.execPath,[evaluator,target],{encoding:'utf8'}).status,2);
  }
  const dir=copy(t); fs.unlinkSync(path.join(dir,'src/records.js'));
  assert.equal(spawnSync(process.execPath,[evaluator,dir],{encoding:'utf8'}).status,2);
});

test('snapshot recusa symlinks e detecta exclusão de arquivo', t => {
  const {snapshotFixture}=require(evaluator),dir=copy(t),before=snapshotFixture(dir);
  fs.unlinkSync(path.join(dir,'local-notes.md'));
  assert.notDeepEqual(snapshotFixture(dir),before);
  const link=path.join(dir,'link');
  try {fs.symlinkSync(source,link,process.platform==='win32'?'junction':'dir');}
  catch(error){if(['EPERM','EACCES'].includes(error.code)){t.skip('Host não permite criar symlink');return;}throw error;}
  assert.throws(()=>snapshotFixture(dir),/Symlink recusado/);
});
