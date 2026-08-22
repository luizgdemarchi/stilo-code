const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const HOOKS = path.join(RAIZ, 'hooks');

function tmpdir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-hook-')));
}

// Cada caso roda num home próprio, para o flag global de off de um teste não
// vazar para o outro.
function cenario(state) {
  const raiz = tmpdir();
  const projeto = path.join(raiz, 'projeto');
  const statePath = path.join(projeto, '.stilo', 'state.json');
  if (state !== null) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(
      statePath,
      typeof state === 'string' ? state : JSON.stringify(state)
    );
  } else {
    fs.mkdirSync(projeto, { recursive: true });
  }
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

test('SessionStart injeta ruleset e estado do projeto', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN', enxuto: 'auto' });

  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });

  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /Stilo Code — pipeline de projeto/);
  assert.match(r.stdout, /\*\*Fase:\*\* PLAN/);
  assert.match(r.stdout, /escrever plan\.md/);
});

test('SessionStart com o flag de off não injeta nada', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });
  fs.mkdirSync(c.home, { recursive: true });
  fs.writeFileSync(path.join(c.home, 'off'), '');

  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });

  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('SessionStart com state.json corrompido sai com código 0', () => {
  const c = cenario('{ isto não é json');

  const r = rodaHook('stilo-activate.js', { cwd: c.projeto, home: c.home });

  assert.strictEqual(r.status, 0);
  // Sem estado legível, ainda injeta o ruleset e manda começar em BRAINSTORM.
  assert.match(r.stdout, /Stilo Code — pipeline de projeto/);
  assert.match(r.stdout, /BRAINSTORM/);
});

test('SessionStart reporta ambiguidade quando há dois projetos', () => {
  const raiz = tmpdir();
  for (const nome of ['app-a', 'app-b']) {
    const dir = path.join(raiz, nome, '.stilo');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ phase: 'PLAN' }));
  }

  const r = rodaHook('stilo-activate.js', {
    cwd: raiz,
    home: path.join(raiz, 'home-stilo'),
  });

  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /mais de um projeto encontrado/);
  assert.match(r.stdout, /app-a/);
  assert.match(r.stdout, /app-b/);
});

test('SubagentStart envelopa o contexto em hookSpecificOutput', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'EXECUTE' });

  const r = rodaHook('stilo-subagent.js', { cwd: c.projeto, home: c.home });

  assert.strictEqual(r.status, 0);
  const saida = JSON.parse(r.stdout);
  assert.strictEqual(saida.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(saida.hookSpecificOutput.additionalContext, /\*\*Fase:\*\* EXECUTE/);
});

test('UserPromptSubmit injeta a linha de estado numa mensagem comum', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN', enxuto: 'auto' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'como está o projeto?', cwd: c.projeto }),
  });

  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.includes('\n'), false);
  assert.match(r.stdout, /fase=PLAN/);
  assert.match(r.stdout, /enxuto=leve/);
});

test('/stilo-off grava o flag e /stilo o remove', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });
  const flag = path.join(c.home, 'off');

  const off = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo-off', cwd: c.projeto }),
  });
  assert.strictEqual(off.status, 0);
  assert.strictEqual(fs.existsSync(flag), true);
  assert.match(off.stdout, /STILO OFF/);

  // Enquanto desligado, mensagem comum não injeta nada.
  const calado = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'oi', cwd: c.projeto }),
  });
  assert.strictEqual(calado.stdout, '');

  const on = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo', cwd: c.projeto }),
  });
  assert.strictEqual(on.status, 0);
  assert.strictEqual(fs.existsSync(flag), false);
  assert.match(on.stdout, /Stilo Code — pipeline de projeto/);
});

test('/stilo-code:stilo-off funciona com o namespace do plugin', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo-code:stilo-off', cwd: c.projeto }),
  });

  assert.match(r.stdout, /STILO OFF/);
  assert.strictEqual(fs.existsSync(path.join(c.home, 'off')), true);
});

test('/stilo enxuto pleno persiste no state.json', () => {
  // Critério 13 do spec: sobrepõe o padrão da fase e sobrevive à sessão.
  const c = cenario({ version: 1, project: 'meu-app', phase: 'BRAINSTORM', enxuto: 'auto' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo enxuto pleno', cwd: c.projeto }),
  });

  assert.strictEqual(r.status, 0);
  const gravado = JSON.parse(fs.readFileSync(c.statePath, 'utf8'));
  assert.strictEqual(gravado.enxuto, 'pleno');
  assert.strictEqual(gravado.phase, 'BRAINSTORM');
  assert.match(r.stdout, /nível efetivo: pleno/);
});

test('/stilo enxuto com nível inválido não grava nada', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN', enxuto: 'auto' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo enxuto turbo', cwd: c.projeto }),
  });

  assert.match(r.stdout, /nível inválido/);
  assert.strictEqual(JSON.parse(fs.readFileSync(c.statePath, 'utf8')).enxuto, 'auto');
});

test('UserPromptSubmit sem projeto manda começar em BRAINSTORM', () => {
  const c = cenario(null);

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'quero um app novo', cwd: c.projeto }),
  });

  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /nenhum projeto ativo/);
  assert.match(r.stdout, /BRAINSTORM/);
});

test('stdin vazio ou inválido não quebra o hook', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });

  for (const entrada of ['', 'isto não é json', '﻿{"prompt":"oi"}']) {
    const r = rodaHook('stilo-prompt.js', {
      cwd: c.projeto,
      home: c.home,
      stdin: entrada,
    });
    assert.strictEqual(r.status, 0, `entrada: ${JSON.stringify(entrada)}`);
  }
});

test('no Codex a saída é sempre JSON com hookSpecificOutput', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });

  const r = rodaHook('stilo-activate.js', {
    cwd: c.projeto,
    home: c.home,
    env: { PLUGIN_DATA: c.home },
  });

  assert.strictEqual(r.status, 0);
  const saida = JSON.parse(r.stdout);
  assert.strictEqual(saida.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(saida.hookSpecificOutput.additionalContext, /\*\*Fase:\*\* PLAN/);
});

test('no Qoder o UserPromptSubmit carrega o ruleset inteiro', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'oi', cwd: c.projeto }),
    env: { QODER_SESSION_ID: 'abc' },
  });

  assert.strictEqual(r.status, 0);
  const saida = JSON.parse(r.stdout);
  assert.match(saida.hookSpecificOutput.additionalContext, /Stilo Code — pipeline de projeto/);
});

test('cwd inválido no payload cai no cwd do processo', () => {
  // Achado do passo 13: um caminho estilo POSIX vindo do agente resolvia para
  // um diretório inexistente e o projeto sumia silenciosamente.
  const c = cenario({ version: 1, project: 'meu-app', phase: 'PLAN', enxuto: 'auto' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: 'oi', cwd: '/nao/existe/em/lugar/nenhum' }),
  });

  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /fase=PLAN/);
});

test('/stilo enxuto grava mesmo com cwd inválido no payload', () => {
  const c = cenario({ version: 1, project: 'meu-app', phase: 'BRAINSTORM', enxuto: 'auto' });

  const r = rodaHook('stilo-prompt.js', {
    cwd: c.projeto,
    home: c.home,
    stdin: JSON.stringify({ prompt: '/stilo enxuto pleno', cwd: '/nao/existe' }),
  });

  assert.strictEqual(r.status, 0);
  assert.strictEqual(JSON.parse(fs.readFileSync(c.statePath, 'utf8')).enxuto, 'pleno');
});
