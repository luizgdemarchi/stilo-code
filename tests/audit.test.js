const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { FASES } = require('../hooks/stilo-state.js');
const { modulosDaFase } = require('../hooks/stilo-instructions.js');

const raiz = path.join(__dirname, '..');
const modulo = fs.readFileSync(path.join(raiz, 'modules', 'auditoria.md'), 'utf8');

test('auditoria e encerramento chegam só ao DONE', () => {
  for (const phase of FASES) {
    const modulos = modulosDaFase({ phase });
    assert.strictEqual(modulos.includes('auditoria.md'), phase === 'DONE', phase);
    assert.strictEqual(modulos.includes('encerramento.md'), phase === 'DONE', phase);
  }
});

test('auditoria grava relatório próprio e classifica cada sugestão', () => {
  assert.ok(modulo.includes('`.stilo/cleanup-NN.md`'));
  for (const classe of ['`baixo risco`', '`requer confirmação`', '`não recomendado`']) {
    assert.ok(modulo.includes(classe), classe);
  }
  assert.ok(modulo.includes('`ponytail-audit`'));
});
