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

function secaoMarkdown(texto, titulo, nivel) {
  const marcador = `${'#'.repeat(nivel)} ${titulo}`;
  const inicio = texto.indexOf(marcador);
  assert.notStrictEqual(inicio, -1, `seção ausente: ${marcador}`);
  const resto = texto.slice(inicio + marcador.length);
  const proxima = resto.search(new RegExp(`^#{1,${nivel}}\\s`, 'm'));
  return proxima === -1 ? resto : resto.slice(0, proxima);
}

const MANIFESTOS = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  'hooks/claude-codex-hooks.json',
  'hooks/qoder-hooks.json',
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

test('os adaptadores estão em dia com o AGENTS.md', () => {
  // Critério de aceite 8 do spec.
  const r = require('node:child_process').spawnSync(
    process.execPath,
    [path.join(RAIZ, 'scripts', 'sync-adapters.js'), '--check'],
    { encoding: 'utf8' }
  );

  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
});

// Sem parser de TOML embutido no Node, um verificador mínimo do que nós mesmos
// geramos: as chaves obrigatórias, e barra invertida só dentro de string
// literal ('''), onde o TOML não interpreta escape nenhum.
test('o plugin do OpenCode importa e injeta apenas contexto automático', async () => {
  const url = require('node:url').pathToFileURL(
    path.join(RAIZ, '.opencode', 'plugins', 'stilo.mjs')
  ).href;
  const plugin = await import(url);

  const instancia = await plugin.default({});
  const saida = { system: [] };
  assert.strictEqual(typeof instancia['experimental.chat.system.transform'], 'function');
  await instancia['experimental.chat.system.transform']({}, saida);
  assert.match(saida.system[0], /Stilo Code — pipeline de projeto/);
});

test('a documentação não promove Copilot à camada de hooks sem manifesto', () => {
  const spec = fs.readFileSync(path.join(RAIZ, 'spec.md'), 'utf8');
  const suporteSpec = secaoMarkdown(spec, '10. Suporte por agente', 2);
  const camadaManual = suporteSpec.match(/\*\*Camada 1[\s\S]*?(?=\n\*\*Camada 2)/);
  const camadaHooks = suporteSpec.match(/\*\*Camada 2[\s\S]*?:\*\*([\s\S]*?)(?:\n\*\*|$)/);
  assert.ok(camadaManual, 'spec.md precisa delimitar a camada manual');
  assert.match(camadaManual[0], /GitHub Copilot CLI/i);
  assert.match(camadaManual[0], /manual/i);
  assert.ok(camadaHooks, 'spec.md precisa delimitar a camada de hooks');
  assert.doesNotMatch(camadaHooks[1], /Copilot/i);

  const agentes = fs.readFileSync(path.join(RAIZ, 'AGENTS.md'), 'utf8');
  const suporteAgentes = secaoMarkdown(agentes, '10. Suporte por agente', 2);
  assert.match(suporteAgentes, /GitHub Copilot CLI:[\s\S]*suporte manual/i);
  assert.doesNotMatch(
    suporteAgentes.match(/\*\*Claude Code[\s\S]*?(?=\n- \*\*)/)[0],
    /Copilot/i
  );

  for (const [rel, titulo, manual] of [
    ['README.md', 'GitHub Copilot CLI', /Suporte manual/],
    ['README.en.md', 'GitHub Copilot CLI', /Manual support/],
  ]) {
    const texto = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    const secao = secaoMarkdown(texto, titulo, 3);
    assert.match(secao, manual, `${rel}: Copilot precisa constar como suporte manual`);
    assert.match(secao, /não publica|does not publish/i, `${rel}: manifesto ausente não declarado`);
    assert.doesNotMatch(secao, /suporte automático|automatic support/i);
  }

  const contrato = fs.readFileSync(path.join(RAIZ, 'docs/contrato-hooks.md'), 'utf8');
  const compatibilidade = secaoMarkdown(contrato, 'Estado da compatibilidade', 2);
  assert.match(compatibilidade, /GitHub Copilot CLI não verificado[\s\S]*suporte publicado é manual/i);
});
