const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('contrato de review separa impacto, confiança, contraprova e hipóteses', () => {
  const text = fs.readFileSync(path.join(__dirname, '../modules/revisor.md'), 'utf8');
  for (const re of [/Evidência/, /Confiança.*alta.*média.*baixa/, /Contraprova verificada/,
    /Classificação.*confirmado.*hipótese.*sugestão/, /staged/, /unstaged/, /preexistente/,
    /não executad/i, /chamadores/, /não.*bug confirmado/i]) assert.match(text, re);
  assert.doesNotMatch(text, /quase sempre significa/);
});
