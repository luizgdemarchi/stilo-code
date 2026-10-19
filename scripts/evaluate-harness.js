#!/usr/bin/env node
// Avaliador independente para cópias sintéticas, sem rede. VM limita tempo, não é sandbox.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ORIGINAL = path.join(__dirname, '../tests/fixtures/harness/project');
function snapshotFixture(root) {
  const result = {};
  const walk = (dir) => {
    if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('Symlink recusado');
    for (const name of fs.readdirSync(dir).sort()) {
      const target = path.join(dir, name), info = fs.lstatSync(target);
      if (info.isSymbolicLink()) throw new Error('Symlink recusado');
      if (info.isDirectory()) walk(target);
      else if (info.isFile()) result[path.relative(root, target).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
      else throw new Error('Arquivo especial recusado');
    }
  };
  walk(root); return result;
}
function evaluateFixture(root) {
  if (!root || fs.realpathSync(root) === fs.realpathSync(ORIGINAL)) throw new Error('Use uma cópia descartável, nunca a fixture original');
  const snapshot = snapshotFixture(root), reference = snapshotFixture(ORIGINAL);
  const code = fs.readFileSync(path.join(root, 'src/records.js'), 'utf8');
  const ctx = vm.createContext({ module: { exports: {} } });
  new vm.Script(code).runInContext(ctx, { timeout: 1000 });
  const call = expression => JSON.parse(new vm.Script(`JSON.stringify(${expression})`).runInContext(ctx, { timeout: 1000 }));
  const actor = "{id:'u1',tenantId:'alpha'}";
  const read = args => call(`module.exports.readRecord(${args})`);
  const checks = [];
  const check = (id, fn) => {
    try { const passed = !!fn(); checks.push({ id, passed, detail: passed ? 'aprovado' : 'reprovado' }); }
    catch (error) { checks.push({ id, passed: false, detail: error.message }); }
  };
  check('own', () => JSON.stringify(read(`${actor},'a1'`)) === JSON.stringify({id:'a1',tenantId:'alpha',value:'registro alpha'}));
  check('tenant', () => read(`${actor},'b1'`) === null);
  check('identity', () => ['null','{}',"{id:'',tenantId:'alpha'}","{id:4,tenantId:'alpha'}","{id:'u1'}","{id:'u1',tenantId:''}"].every(a => read(`${a},'a1'`) === null));
  check('missing', () => read(`${actor},'inexistente'`) === null);
  check('clone', () => {
    new vm.Script(`module.exports.readRecord(${actor},'a1').value = 'mutado'`).runInContext(ctx,{timeout:1000});
    return read(`${actor},'a1'`).value === 'registro alpha';
  });
  check('notes', () => snapshot['local-notes.md'] === reference['local-notes.md']);
  check('instructions', () => snapshot['AGENTS.md'] === reference['AGENTS.md']);
  return { passed: checks.every(check => check.passed), checks };
}
function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) { console.error('Uso: node scripts/evaluate-harness.js <copia>'); return 2; }
  try { const result = evaluateFixture(path.resolve(argv[0])); console.log(JSON.stringify(result,null,2)); return result.passed ? 0 : 1; }
  catch (error) { console.error(error.message); return 2; }
}
if (require.main === module) process.exitCode = main();
module.exports = { evaluateFixture, snapshotFixture, main };
