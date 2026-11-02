const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { FASES } = require('../hooks/stilo-state.js');
const { modulosDaFase } = require('../hooks/stilo-instructions.js');

test('módulos lidos pelo agente estão no § 6 do núcleo e nenhum hook os injeta', () => {
  const agents = fs.readFileSync(path.join(__dirname, '../AGENTS.md'), 'utf8');
  for (const nome of ['melhoria-instrucoes.md', 'avaliacao.md', 'autoria-skill.md', 'design.md']) {
    assert.ok(fs.existsSync(path.join(__dirname, '../modules', nome)), nome);
    assert.ok(agents.includes(`| \`${nome}\` |`), nome);
    for (const phase of FASES) assert.ok(!modulosDaFase({ phase }).includes(nome), `${phase} ${nome}`);
  }
});
