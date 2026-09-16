const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');

function localizarOpenCode() {
  if (process.env.OPENCODE_BIN && process.env.OPENCODE_BIN.trim()) {
    return process.env.OPENCODE_BIN.trim();
  }

  const comando = process.platform === 'win32' ? 'where.exe' : 'which';
  const resultado = spawnSync(comando, ['opencode'], { encoding: 'utf8' });
  if (resultado.status !== 0) return null;
  const caminhos = resultado.stdout.split(/\r?\n/).filter(Boolean);
  return process.platform === 'win32'
    ? caminhos.find((caminho) => /\.(cmd|exe)$/i.test(caminho)) || caminhos[0] || null
    : caminhos[0] || null;
}

const opencode = localizarOpenCode();

test(
  'OpenCode recebe o Estado do Stilo Code em modo não interativo',
  { skip: opencode ? false : 'OpenCode CLI ausente; smoke test pendente' },
  () => {
    const projeto = `stilo-smoke-${randomUUID()}`;
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-opencode-'));
    const plugin = path.join(RAIZ, '.opencode', 'plugins', 'stilo.mjs');
    fs.mkdirSync(path.join(temporario, '.stilo'));
    fs.writeFileSync(
      path.join(temporario, '.stilo', 'state.json'),
      JSON.stringify({
        version: 1,
        project: projeto,
        phase: 'FIX',
        reviewRound: 37,
        enxuto: 'auto',
        updated: '2026-09-08T00:00:00Z',
      })
    );
    fs.writeFileSync(
      path.join(temporario, 'opencode.json'),
      JSON.stringify({
        plugin: [plugin.replaceAll('\\', '/')],
        permission: 'deny',
      })
    );

    const usaShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(opencode);
    try {
      const versao = spawnSync(opencode, ['--version'], {
        encoding: 'utf8',
        shell: usaShell,
        windowsHide: true,
      });
      assert.strictEqual(versao.status, 0, versao.stderr || versao.stdout);

      const execucao = spawnSync(
        opencode,
        ['run', 'Informe somente o identificador do projeto ativo e sua fase no Stilo Code.'],
        {
          cwd: temporario,
          encoding: 'utf8',
          shell: usaShell,
          timeout: 60_000,
          windowsHide: true,
        }
      );

      assert.strictEqual(execucao.status, 0, execucao.stderr || execucao.stdout);
      assert.match(execucao.stdout, new RegExp(projeto));
      assert.match(execucao.stdout, /\bFIX\b/);
    } finally {
      fs.rmSync(temporario, { recursive: true, force: true });
    }
  }
);
