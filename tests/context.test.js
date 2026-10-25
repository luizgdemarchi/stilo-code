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

for (const phase of ['PLAN', 'EXECUTE', 'REVIEW', 'FIX']) {
  test(`política integral no contexto de ${phase}`, () => {
    const state = { version: 1, project: 'x', phase, reviewRound: 11 };
    const modulo = fs.readFileSync(path.join(__dirname, '../modules/orquestracao.md'), 'utf8');
    for (const build of [buildFullContext, buildInjectedContext]) {
      const contexto = build(state);
      const blocos = modulo.split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/)
        .map(s => s.trim()).filter(Boolean);
      for (const bloco of blocos) assert.ok(contexto.includes(bloco), phase);
    }
  });
}

test('política maior que o orçamento faz fallback byte a byte para contexto completo', () => {
  const anterior = process.env.CLAUDE_PLUGIN_ROOT;
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-politica-'));
  fs.copyFileSync(path.join(__dirname, '../AGENTS.md'), path.join(raiz, 'AGENTS.md'));
  fs.cpSync(path.join(__dirname, '../modules'), path.join(raiz, 'modules'), { recursive: true });
  fs.appendFileSync(
    path.join(raiz, 'modules', 'orquestracao.md'),
    '\n\n## Bloco extenso\n\n' + 'política protegida '.repeat(1000) + '\n'
  );
  process.env.CLAUDE_PLUGIN_ROOT = raiz;
  try {
    const state = { version: 1, project: 'x', phase: 'PLAN', reviewRound: 11, enxuto: 'auto' };
    const completo = buildFullContext(state);
    assert.match(completo, /Bloco extenso/);
    assert.strictEqual(buildInjectedContext(state), completo);
  } finally {
    if (anterior === undefined) delete process.env.CLAUDE_PLUGIN_ROOT;
    else process.env.CLAUDE_PLUGIN_ROOT = anterior;
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

for (const phase of ['SPEC', 'PLAN', 'EXECUTE', 'REVIEW', 'FIX']) {
  test(`compactação de ${phase} preserva estado em disco e gatilhos de módulos`, () => {
    const state = { version: 1, project: 'x', phase, reviewRound: 12, enxuto: 'auto', updated: '2026-01-01T00:00:00Z' };
    const contexto = buildInjectedContext(state);
    assert.match(contexto, /## 3\. Estado em disco/);
    assert.match(contexto, /ISO 8601/);
    assert.match(contexto, /## 5\. Módulos/);
    assert.match(contexto, /modules\/frontend\.md/);
  });
}

// REVIEW protege mais que o orçamento e usa o contexto completo; as demais fases compactam.
for (const phase of ['PLAN', 'EXECUTE', 'REVIEW', 'FIX']) test(`${phase} com checkpoint no limite preserva estado e checkpoint`, () => {
  const projeto = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-checkpoint-'));
  try {
    fs.mkdirSync(path.join(projeto, '.stilo'));
    const statePath = path.join(projeto, '.stilo', 'state.json');
    // Campos acima dos limites de `sanitiza`: mede o pior caso real do bloco de estado.
    const state = { version: 1, project: 'x'.repeat(200), phase, reviewRound: 12, enxuto: 'auto', updated: '2026-01-01T00:00:00Z' };
    fs.writeFileSync(statePath, JSON.stringify(state));
    fs.writeFileSync(path.join(projeto, '.stilo', 'checkpoint.json'), JSON.stringify({
      version: 1,
      cycle: 'ciclo',
      phase,
      task: 't'.repeat(200),
      decisions: ['d'],
      verified: ['v'],
      pending: ['p'.repeat(400)],
      nextAction: 'a'.repeat(400),
      updated: '2026-01-01T00:00:00Z',
    }));
    const caminhos = Object.assign([statePath], { statePath, status: 'valid' });
    const completo = buildFullContext(state, caminhos);
    const injetado = buildInjectedContext(state, caminhos);
    assert.match(completo, /checkpoint/);
    if (phase === 'REVIEW') assert.strictEqual(injetado, completo);
    else assert.ok(injetado.length < completo.length, 'fallback: ' + injetado.length);
    assert.match(injetado, /checkpoint/);
    assert.match(injetado, /## 3\. Estado em disco/);
    assert.match(injetado, /## 5\. Módulos/);
  } finally {
    fs.rmSync(projeto, { recursive: true, force: true });
  }
});
