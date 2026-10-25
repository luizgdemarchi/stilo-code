const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');

function leJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'));
}

function existe(rel) {
  return fs.existsSync(path.join(RAIZ, rel));
}


const MANIFESTOS = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  'hooks/claude-codex-hooks.json',
  'package.json',
];

test('todo manifesto JSON parseia', () => {
  for (const m of MANIFESTOS) {
    assert.doesNotThrow(() => leJson(m), `${m} não parseia`);
  }
});

test('os caminhos citados nos manifestos existem em disco', () => {
  for (const rel of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    const m = leJson(rel);
    assert.strictEqual(existe(m.hooks), true, `${rel}: hooks ${m.hooks} não existe`);
    if (m.skills) assert.strictEqual(existe(m.skills), true, `${rel}: skills não existe`);
  }
  assert.strictEqual(existe(leJson('.claude-plugin/marketplace.json').plugins[0].source), true);
});

test('todo comando de hook aponta para um arquivo que existe', () => {
  const manifesto = leJson('hooks/claude-codex-hooks.json');
  const eventos = Object.keys(manifesto.hooks);
  assert.deepStrictEqual(eventos.sort(), ['SessionStart', 'SubagentStart', 'UserPromptSubmit']);

  for (const evento of eventos) {
    for (const grupo of manifesto.hooks[evento]) {
      for (const hook of grupo.hooks) {
        const arquivo = (hook.command.match(/hooks\/([\w-]+\.js)/) || [])[1];
        assert.ok(arquivo, `${evento}: comando sem arquivo .js reconhecível`);
        assert.strictEqual(existe(path.join('hooks', arquivo)), true, `${evento}: ${arquivo}`);
        // Windows precisa da guarda de node no PATH (critério de aceite 7).
        assert.match(hook.commandWindows, /Get-Command node/, `${evento}: sem guarda de node`);
        assert.match(hook.commandWindows, new RegExp(arquivo.replace('.', '\\.')));
        assert.strictEqual(typeof hook.timeout, 'number');
      }
    }
  }
});

test('SessionStart tem o matcher que faz o /clear funcionar', () => {
  const grupo = leJson('hooks/claude-codex-hooks.json').hooks.SessionStart[0];
  assert.strictEqual(grupo.matcher, 'startup|resume|clear|compact');
});

test('nenhum comando ou skill público do Stilo é publicado', () => {
  for (const rel of [
    'commands/stilo.toml',
    'commands/stilo-off.toml',
    'skills/stilo/SKILL.md',
    'skills/stilo-off/SKILL.md',
    '.opencode/command/stilo.md',
    '.opencode/command/stilo-off.md',
  ]) {
    assert.strictEqual(existe(rel), false, `${rel} ainda existe`);
  }
  for (const rel of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    const manifesto = leJson(rel);
    assert.strictEqual(Object.hasOwn(manifesto, 'skills'), false, `${rel} ainda publica skills`);
  }
});

test('nenhum arquivo publicado cita pacote preso a um único agente', () => {
  // Critério de aceite 10 do spec: § 4.1 proíbe citar o que não é portátil.
  const proibidos = ['code-review', 'frontend-design', 'skill-creator'];
  const ignorar = new Set(['.git', '.superpowers', 'node_modules', 'tests', 'spec.md', 'plan.md']);

  function varre(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignorar.has(e.name)) continue;
      const full = path.join(dir, e.name);
      const r = path.join(rel, e.name);
      if (e.isDirectory()) {
        varre(full, r);
        continue;
      }
      if (!/\.(md|json|js|mjs|toml|mdc)$/.test(e.name)) continue;
      const texto = fs.readFileSync(full, 'utf8').toLowerCase();
      for (const p of proibidos) {
        const pacote = new RegExp(`(?<![a-z0-9_-])${p}(?![a-z0-9_-])`, 'i');
        assert.strictEqual(pacote.test(texto), false, `${r} cita "${p}"`);
      }
    }
  }

  varre(RAIZ, '');
});

// Spec § 18: só Claude Code e Codex têm integração publicada.
const REMOVIDOS = [
  '.opencode',
  'opencode.json',
  'gemini-extension.json',
  'hooks/qoder-hooks.json',
  '.cursor',
  '.kiro',
  '.clinerules',
  '.windsurf',
  '.qoder',
  '.agents',
  'scripts/sync-adapters.js',
  'tests/opencode-runtime.test.js',
];

test('só Claude Code e Codex têm integração publicada', () => {
  // Critério de aceite 49 do spec.
  for (const rel of REMOVIDOS) assert.strictEqual(existe(rel), false, `${rel} ainda existe`);
  for (const rel of ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'hooks/claude-codex-hooks.json']) {
    assert.ok(existe(rel), `${rel} ausente`);
  }
  assert.strictEqual(leJson('package.json').scripts.sync, undefined);
});

test('documentação e código publicados não anunciam agente removido', () => {
  // Critério de aceite 51 do spec. Reviews, specs, planos, avaliações e a matriz são históricos.
  const removido = /\b(opencode|qoder|copilot|gemini|antigravity|cursor|windsurf|cline|clinerules|kiro)\b|sync-adapters|qualquer agente|demais agentes|any agent|other agents/i;
  const raizes = [
    'AGENTS.md',
    'README.md',
    'README.en.md',
    'package.json',
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    '.codex-plugin/plugin.json',
  ];
  const diretorios = ['modules', 'docs', 'hooks', 'scripts'].flatMap((dir) =>
    fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(md|js|json)$/.test(e.name))
      .map((e) => `${dir}/${e.name}`)
  );
  for (const rel of [...raizes, ...diretorios].filter((r) => r !== 'docs/aceite.md')) {
    const linhas = fs.readFileSync(path.join(RAIZ, rel), 'utf8').split('\n');
    const citacoes = linhas.filter((linha) => removido.test(linha));
    assert.deepStrictEqual(citacoes, [], `${rel} cita agente removido`);
  }
});
