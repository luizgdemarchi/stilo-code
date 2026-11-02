const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectContextBlocks } = require('../hooks/stilo-context.js');
const { FASES } = require('../hooks/stilo-state.js');
const { buildSetupNote } = require('../hooks/stilo-setup.js');
const { buildFullContext, buildInjectedContext, modulosDaFase, pluginRoot } = require('../hooks/stilo-instructions.js');

// Âncoras do AGENTS.md que a compactação protege (contrato do plano, T08).
const ANCORAS = [
  '## Regra 0',
  '## Regra 1',
  '## 3. Estado em disco',
  '## 4. Retomada verificável',
  '## 6. Módulos',
  '## 7. Execução segura',
  '## Estado do Stilo Code',
];

function blocos(texto) {
  return texto.split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/).map((s) => s.trim()).filter(Boolean);
}

function modulo(nome) {
  return fs.readFileSync(path.join(__dirname, '../modules', nome), 'utf8');
}

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

test('fonte ausente faz fallback byte a byte para contexto completo', () => {
  const anterior = process.env.CLAUDE_PLUGIN_ROOT;
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-context-'));
  process.env.CLAUDE_PLUGIN_ROOT = vazio;
  try {
    const state = { version: 1, project: 'x', phase: 'PLAN', reviewRound: 0 };
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

test('cada fase preserva as âncoras e os blocos dos seus módulos; orquestração só no PLAN', () => {
  const orquestracao = blocos(modulo('orquestracao.md'));
  for (const phase of FASES) {
    const state = { version: 1, project: 'x', phase, reviewRound: 11, updated: '2026-01-01T00:00:00Z' };
    const contexto = buildInjectedContext(state);
    for (const ancora of ANCORAS) assert.ok(contexto.includes(ancora), `${phase} ${ancora}`);
    for (const nome of modulosDaFase(state)) {
      for (const bloco of blocos(modulo(nome))) assert.ok(contexto.includes(bloco), `${phase} ${nome}`);
    }
    const temOrquestracao = orquestracao.every((bloco) => contexto.includes(bloco));
    assert.strictEqual(temOrquestracao, phase === 'PLAN', phase);
  }
});

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
    const state = { version: 1, project: 'x', phase: 'PLAN', reviewRound: 11 };
    const completo = buildFullContext(state);
    assert.match(completo, /Bloco extenso/);
    assert.strictEqual(buildInjectedContext(state), completo);
  } finally {
    if (anterior === undefined) delete process.env.CLAUDE_PLUGIN_ROOT;
    else process.env.CLAUDE_PLUGIN_ROOT = anterior;
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

test('ruleset acima do orçamento compacta sem perder âncoras nem módulos', () => {
  const anterior = process.env.CLAUDE_PLUGIN_ROOT;
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-compacta-'));
  fs.writeFileSync(
    path.join(raiz, 'AGENTS.md'),
    fs.readFileSync(path.join(__dirname, '../AGENTS.md'), 'utf8') +
      '\n\n## 99. Seção descartável\n\n' + 'texto opcional '.repeat(800) + '\n'
  );
  fs.cpSync(path.join(__dirname, '../modules'), path.join(raiz, 'modules'), { recursive: true });
  process.env.CLAUDE_PLUGIN_ROOT = raiz;
  try {
    const state = { version: 1, project: 'x', phase: 'EXECUTE', reviewRound: 0 };
    const nucleo = buildInjectedContext(state, undefined, 'nucleo');
    const daFase = buildInjectedContext(state, undefined, 'fase');
    assert.ok(nucleo.length <= 10000, String(nucleo.length));
    assert.doesNotMatch(nucleo, /Seção descartável/);
    assert.strictEqual(daFase, buildFullContext(state, undefined, 'fase'));
    const injetado = buildInjectedContext(state);
    for (const ancora of ANCORAS) assert.ok(injetado.includes(ancora), ancora);
    for (const nome of modulosDaFase(state)) {
      for (const bloco of blocos(modulo(nome))) assert.ok(daFase.includes(bloco), nome);
    }
  } finally {
    if (anterior === undefined) delete process.env.CLAUDE_PLUGIN_ROOT;
    else process.env.CLAUDE_PLUGIN_ROOT = anterior;
    fs.rmSync(raiz, { recursive: true, force: true });
  }
});

// Pior caso do bloco de estado: campos acima dos limites de `sanitiza`, checkpoint
// no limite, nota do gh e design.md no ciclo.
for (const phase of FASES) test(`${phase} com checkpoint no limite cabe sem compactar`, () => {
  const projeto = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-checkpoint-')));
  try {
    const cycle = '2026-11-02-pior-caso';
    fs.mkdirSync(path.join(projeto, '.stilo'));
    fs.mkdirSync(path.join(projeto, 'docs', 'ciclos', cycle), { recursive: true });
    fs.writeFileSync(path.join(projeto, 'docs', 'ciclos', cycle, 'design.md'), '# design\n');
    const statePath = path.join(projeto, '.stilo', 'state.json');
    const state = { version: 1, project: 'x'.repeat(200), phase, cycle, reviewRound: 12, editorialReviewRound: 4, updated: '2026-01-01T00:00:00Z' };
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
    const caminhos = Object.assign([statePath], {
      statePath,
      status: 'valid',
      setupNote: buildSetupNote(pluginRoot(), { status: 'absent' }),
    });
    assert.match(buildFullContext(state, caminhos, 'fase'), /checkpoint/);
    for (const parte of ['nucleo', 'fase']) {
      const completo = buildFullContext(state, caminhos, parte);
      const injetado = buildInjectedContext(state, caminhos, parte);
      const bytes = Buffer.byteLength(injetado, 'utf8');
      assert.strictEqual(injetado, completo, `${phase} ${parte}`);
      assert.ok(injetado.length <= 10000 && bytes <= 10000, `${phase} ${parte}: ${injetado.length} / ${bytes}`);
    }
  } finally {
    fs.rmSync(projeto, { recursive: true, force: true });
  }
});
