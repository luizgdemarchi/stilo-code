const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { EventEmitter } = require('node:events');
const { installStdoutGuard } = require('../hooks/stilo-runtime.js');

const HOOKS = path.join(__dirname, '..', 'hooks');

test('stdout fechado não transforma EPIPE em falha do processo', () => {
  const stdout = new EventEmitter();
  installStdoutGuard(stdout);
  assert.doesNotThrow(() => stdout.emit('error', Object.assign(new Error('pipe fechado'), { code: 'EPIPE' })));
});

function tmpdir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-hook-')));
}

function cenario(state) {
  const raiz = tmpdir();
  const projeto = path.join(raiz, 'projeto');
  const statePath = path.join(projeto, '.stilo', 'state.json');
  if (state !== null) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(
      statePath,
      typeof state === 'string'
        ? state
        : JSON.stringify(Object.assign({ version: 1, project: 'meu-app', phase: 'PLAN', reviewRound: 0 }, state))
    );
  } else fs.mkdirSync(projeto, { recursive: true });
  return { raiz, projeto, statePath, home: path.join(raiz, 'home-stilo') };
}

function rodaHook(arquivo, { cwd, home, stdin, env }) {
  return spawnSync(process.execPath, [path.join(HOOKS, arquivo)], {
    cwd,
    input: stdin === undefined ? '' : stdin,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { STILO_HOME: home }, env || {}),
  });
}

test('SessionStart injeta contexto e estado do projeto', () => {
  const c = cenario({ phase: 'PLAN', enxuto: 'auto' });
  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /Stilo Code — pipeline de projeto/);
  assert.match(r.stdout, /\*\*Fase:\*\* PLAN/);
  assert.match(r.stdout, /escrever plan\.md/);
});

test('SessionStart ignora flag legado e continua automático', () => {
  const c = cenario({ phase: 'PLAN' });
  fs.mkdirSync(c.home, { recursive: true });
  fs.writeFileSync(path.join(c.home, 'off'), '');
  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /Stilo Code — pipeline de projeto/);
});

test('state.json corrompido não quebra e orienta correção', () => {
  const c = cenario('{ isto não é json');
  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /state\.json/);
  assert.match(r.stdout, /ilegível/);
});

test('SessionStart reporta ambiguidade sem mandar criar projeto', () => {
  const raiz = tmpdir();
  for (const nome of ['app-a', 'app-b']) {
    const dir = path.join(raiz, nome, '.stilo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ phase: 'PLAN' }));
  }
  const r = rodaHook('stilo-activate.js', { cwd: raiz, home: path.join(raiz, 'home-stilo') });
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /mais de um projeto encontrado/);
  assert.doesNotMatch(r.stdout, /Nenhum `\.stilo\/state\.json` encontrado/);
});

test('SubagentStart envelopa o contexto automático', () => {
  const c = cenario({ phase: 'EXECUTE' });
  const r = rodaHook('stilo-subagent.js', { cwd: c.projeto, home: c.home });
  const saida = JSON.parse(r.stdout);
  assert.strictEqual(saida.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(saida.hookSpecificOutput.additionalContext, /\*\*Fase:\*\* EXECUTE/);
});

test('UserPromptSubmit injeta a linha na mensagem comum e em prompt com barra', () => {
  const c = cenario({ phase: 'PLAN', enxuto: 'pleno' });
  for (const prompt of ['como está o projeto?', '/stilo-off', '/qualquer coisa']) {
    const r = rodaHook('stilo-prompt.js', {
      cwd: c.projeto,
      home: c.home,
      stdin: JSON.stringify({ prompt, cwd: c.projeto }),
    });
    assert.strictEqual(r.status, 0);
    assert.match(r.stdout, /fase=PLAN/);
  }
  assert.strictEqual(fs.existsSync(path.join(c.home, 'off')), false);
  assert.strictEqual(JSON.parse(fs.readFileSync(c.statePath, 'utf8')).phase, 'PLAN');
});

test('prompt arbitrário não grava estado nem ciclo', () => {
  const c = cenario({ phase: 'REVIEW', reviewRound: 7, enxuto: 'auto' });
  const antes = fs.readFileSync(c.statePath, 'utf8');
  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo ciclo automatico-sem-comandos', cwd: c.projeto }),
  });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(fs.readFileSync(c.statePath, 'utf8'), antes);
  assert.strictEqual(fs.existsSync(path.join(c.projeto, '.stilo', 'cycle.json')), false);
});

test('Qoder recebe o mesmo contexto automático', () => {
  const c = cenario({ phase: 'PLAN', enxuto: 'auto' });
  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'oi', cwd: c.projeto }),
    env: { QODER_SESSION_ID: 'abc' },
  });
  const saida = JSON.parse(r.stdout);
  assert.match(saida.hookSpecificOutput.additionalContext, /Stilo Code — pipeline de projeto/);
  assert.match(saida.hookSpecificOutput.additionalContext, /\*\*Fase:\*\* PLAN/);
});

test('stdin vazio ou inválido não quebra o hook', () => {
  const c = cenario({ phase: 'PLAN' });
  for (const entrada of ['', 'isto não é json', '﻿{"prompt":"oi"}']) {
    const r = rodaHook('stilo-prompt.js', { cwd: c.projeto, home: c.home, stdin: entrada });
    assert.strictEqual(r.status, 0);
  }
});

test('cwd inválido no payload cai no cwd do processo', () => {
  const c = cenario({ phase: 'PLAN', enxuto: 'auto' });
  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'oi', cwd: '/nao/existe' }),
  });
  assert.match(r.stdout, /fase=PLAN/);
});
