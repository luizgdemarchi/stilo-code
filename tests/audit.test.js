const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const agents = fs.readFileSync(path.join(raiz, 'AGENTS.md'), 'utf8');
const modulo = fs.readFileSync(path.join(raiz, 'modules', 'auditoria.md'), 'utf8');

test('auditoria opcional tem contrato durável e não cria remoção automática', () => {
  for (const texto of [modulo]) {
    assert.match(texto, /ponytail-audit/);
    assert.match(texto, /\.stilo\/cleanup-NN\.md/);
    assert.match(texto, /arquivo e linha/);
    assert.match(texto, /evidência/);
    assert.match(texto, /risco/);
    assert.match(texto, /remoção mínima/);
    assert.match(texto, /(verifica|validar)/);
    assert.match(texto, /baixo risco/);
    assert.match(texto, /requer confirmação/);
    assert.match(texto, /não recomendado/);
    assert.match(texto, /não .*?(apague|remova).*?(mova|edite)/i);
  }
  assert.match(agents, /auditoria opcional/);
  assert.match(agents, /\.stilo\/cleanup-NN\.md/);
  assert.match(agents, /não bloqueia `DONE`/);
});

test('áreas protegidas exigem confirmação humana e aceitação retorna a FIX e REVIEW', () => {
  assert.match(modulo, /Referências dinâmicas, APIs públicas, manifestos, migrações, fixtures/);
  assert.match(modulo, /confirmação humana/);
  assert.match(modulo, /FIX.*REVIEW/);
});
