const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { FASES } = require('../hooks/stilo-state.js');
const { modulosDaFase } = require('../hooks/stilo-instructions.js');

const RAIZ = path.join(__dirname, '..');

function le(rel) {
  return fs.readFileSync(path.join(RAIZ, rel), 'utf8');
}

test('orquestracao.md traz o contrato da tarefa com todos os campos', () => {
  const orquestracao = le('modules/orquestracao.md');
  for (const titulo of ['## Contrato da tarefa', '## Ondas', '## Modelo e esforço', '## Escalada']) {
    assert.ok(orquestracao.includes(titulo), titulo);
  }
  for (const campo of ['ID:', 'Especialista:', 'Files:', 'Depends-on:', 'Resources:']) {
    assert.match(orquestracao, new RegExp(`^${campo}`, 'm'), campo);
  }
});

test('registro de modelo separa classificação, pedido e confirmação', () => {
  const orquestracao = le('modules/orquestracao.md');
  for (const campo of ['Classificação:', 'Modelo solicitado:', 'Esforço solicitado:', 'Aplicação confirmada:']) {
    assert.match(orquestracao, new RegExp(`^${campo}`, 'm'), campo);
  }
});

test('orquestração vale só no PLAN; execução e revisão têm módulos próprios', () => {
  for (const phase of FASES) {
    const modulos = modulosDaFase({ phase });
    assert.strictEqual(modulos.includes('orquestracao.md'), phase === 'PLAN', phase);
  }
  assert.ok(modulosDaFase({ phase: 'EXECUTE' }).includes('execucao.md'));
  assert.ok(modulosDaFase({ phase: 'REVIEW' }).includes('revisor.md'));
  const agents = le('AGENTS.md');
  assert.ok(agents.includes('`orquestracao.md`'));
  assert.ok(agents.includes('`execucao.md`'));
});

test('revisor.md mantém o despacho de revisores e o formato do achado', () => {
  const revisor = le('modules/revisor.md');
  for (const titulo of ['## Despacho', '## Formato de um achado', '## Arquivo e saída']) {
    assert.ok(revisor.includes(titulo), titulo);
  }
  assert.ok(revisor.includes('.stilo/review-NN.md'));
});
