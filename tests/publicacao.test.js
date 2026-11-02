const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'verificar-publicacao.js');
const { calcularHash } = require(SCRIPT);

function copiaMinima(version = '0.1.0') {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-publicacao-'));
  fs.mkdirSync(path.join(raiz, 'modules'));
  fs.mkdirSync(path.join(raiz, '.claude-plugin'));
  fs.mkdirSync(path.join(raiz, '.codex-plugin'));
  fs.writeFileSync(path.join(raiz, 'AGENTS.md'), '# Núcleo\n');
  fs.writeFileSync(path.join(raiz, 'modules', 'a.md'), 'Módulo A.\n');
  definirVersoes(raiz, version, version, version);
  return raiz;
}

function definirVersoes(raiz, pacote, claude, codex) {
  fs.writeFileSync(path.join(raiz, 'package.json'), JSON.stringify({ name: 'x', version: pacote }, null, 2));
  fs.writeFileSync(path.join(raiz, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'x', version: claude }, null, 2));
  fs.writeFileSync(path.join(raiz, '.codex-plugin', 'plugin.json'), JSON.stringify({ name: 'x', version: codex }, null, 2));
}

function rodar(...args) {
  const resultado = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { codigo: resultado.status, saida: resultado.stdout + resultado.stderr };
}

test('registrar e verificar sem mudança passam', () => {
  const raiz = copiaMinima();
  assert.strictEqual(rodar('--registrar', raiz).codigo, 0);
  const registro = JSON.parse(fs.readFileSync(path.join(raiz, 'publicacao.json'), 'utf8'));
  assert.strictEqual(registro.version, '0.1.0');
  assert.match(registro.sha256, /^[0-9a-f]{64}$/);
  assert.match(registro.registrado, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.strictEqual(rodar(raiz).codigo, 0);
});

test('conteúdo distribuído alterado sem versão nova reprova e não se registra', () => {
  const raiz = copiaMinima();
  rodar('--registrar', raiz);
  fs.appendFileSync(path.join(raiz, 'modules', 'a.md'), 'Regra nova.\n');
  const verificacao = rodar(raiz);
  assert.strictEqual(verificacao.codigo, 1);
  assert.match(verificacao.saida, /conteúdo distribuído mudou sem versão nova/);
  assert.strictEqual(rodar('--registrar', raiz).codigo, 1);
});

test('versão nova nos três manifestos exige registro e depois passa', () => {
  const raiz = copiaMinima();
  rodar('--registrar', raiz);
  fs.appendFileSync(path.join(raiz, 'modules', 'a.md'), 'Regra nova.\n');
  definirVersoes(raiz, '0.2.0', '0.2.0', '0.2.0');
  const semRegistro = rodar(raiz);
  assert.strictEqual(semRegistro.codigo, 1);
  assert.match(semRegistro.saida, /registre a publicação/);
  assert.strictEqual(rodar('--registrar', raiz).codigo, 0);
  assert.strictEqual(rodar(raiz).codigo, 0);
});

test('manifestos com versões diferentes reprovam', () => {
  const raiz = copiaMinima();
  rodar('--registrar', raiz);
  definirVersoes(raiz, '0.2.0', '0.2.0', '0.1.0');
  assert.strictEqual(rodar(raiz).codigo, 1);
  assert.strictEqual(rodar('--registrar', raiz).codigo, 1);
});

test('CRLF e LF no mesmo conteúdo dão o mesmo hash', () => {
  const raiz = copiaMinima();
  const antes = calcularHash(raiz);
  fs.writeFileSync(path.join(raiz, 'modules', 'a.md'), 'Módulo A.\r\n');
  assert.strictEqual(calcularHash(raiz), antes);
});

test('uso inválido e manifesto ilegível saem com código 2', () => {
  assert.strictEqual(rodar('--desconhecida').codigo, 2);
  const raiz = copiaMinima();
  fs.writeFileSync(path.join(raiz, 'package.json'), '{ quebrado');
  assert.strictEqual(rodar(raiz).codigo, 2);
});
