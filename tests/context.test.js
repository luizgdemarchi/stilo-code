const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectContextBlocks } = require('../hooks/stilo-context.js');
const { buildFullContext, buildInjectedContext } = require('../hooks/stilo-instructions.js');

test('seleciona blocos determinísticos dentro do orçamento', () => {
  const texto = ['essencial 1', 'opcional grande '.repeat(20), 'essencial 2'].join('\n\n---\n\n');
  const a = selectContextBlocks(texto, { budget: 80, protected: ['essencial 1', 'essencial 2'] });
  const b = selectContextBlocks(texto, { budget: 80, protected: ['essencial 1', 'essencial 2'] });
  assert.strictEqual(a, b);
  assert.ok(a.length <= 80);
  assert.match(a, /essencial 1/);
  assert.match(a, /essencial 2/);
});

test('retorna null quando os blocos protegidos não cabem', () => {
  assert.strictEqual(
    selectContextBlocks('um bloco', { budget: 3, protected: ['um bloco'] }),
    null
  );
});

test('retorna null quando nenhum bloco cabe no orçamento', () => {
  assert.strictEqual(selectContextBlocks('texto grande '.repeat(10), { budget: 2 }), null);
});

test('texto sem blocos ainda é selecionável sem resumir', () => {
  assert.strictEqual(selectContextBlocks('linha única', { budget: 40 }), 'linha única');
});

test('contexto automático preserva os módulos e usa fallback quando os protegidos não cabem', () => {
  const state = { version: 1, project: 'x', phase: 'REVIEW', reviewRound: 1, enxuto: 'auto' };
  const completo = buildFullContext(state);
  const automatico = buildInjectedContext(state);
  if (automatico.length > 16000) assert.strictEqual(automatico, completo);
  else assert.ok(automatico.length <= completo.length);
  assert.match(automatico, /Estado do Stilo Code/);
  assert.match(automatico, /Módulo: Revisor/);
  assert.match(automatico, /Formato de um achado/);
  assert.match(automatico, /Quando declarar `DONE`/);
  assert.match(automatico, /Travas de segurança/);
});

test('fonte ausente faz fallback byte a byte para contexto completo', () => {
  const anterior = process.env.CLAUDE_PLUGIN_ROOT;
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-context-'));
  process.env.CLAUDE_PLUGIN_ROOT = vazio;
  try {
    const state = { version: 1, project: 'x', phase: 'PLAN', reviewRound: 0, enxuto: 'auto' };
    assert.strictEqual(buildInjectedContext(state), buildFullContext(state));
  } finally {
    if (anterior === undefined) delete process.env.CLAUDE_PLUGIN_ROOT;
    else process.env.CLAUDE_PLUGIN_ROOT = anterior;
  }
});

test('estado inválido faz fallback byte a byte para contexto completo', () => {
  const caminhos = [];
  Object.defineProperty(caminhos, 'status', { value: 'invalid' });
  const state = { version: 1, project: 'x', phase: 'PLAN', reviewRound: 0 };
  assert.strictEqual(buildInjectedContext(state, caminhos), buildFullContext(state, caminhos));
});
