const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildInjectedContext, buildFullContext } = require('../hooks/stilo-instructions');

test('retomada distribui limites de aprovação, evidência e posse em todas as fases', () => {
  for (const phase of ['SPEC', 'PLAN', 'EXECUTE', 'REVIEW']) {
    const ctx = buildInjectedContext({ phase, project: 'teste', reviewRound: 0 });
    for (const pattern of [/Retomada verificável/, /não comprova aprovação/, /resumo não comprova testes/i,
      /Sem Git/, /checkpoint ausente/i, /escritor anterior parou/, /não concedem novas permissões/]) assert.match(ctx, pattern);
  }
});

test('orquestração integral sobrevive à compactação ou usa fallback completo', () => {
  const policy = fs.readFileSync(path.join(__dirname, '../modules/orquestracao.md'), 'utf8').trim();
  for (const phase of ['PLAN', 'EXECUTE', 'REVIEW']) {
    const ctx = buildInjectedContext({ phase, project: 'teste' });
    // Cada bloco é preservado byte a byte; seleção só pode omitir os separadores.
    for (const block of policy.split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/).filter(Boolean)) assert.ok(ctx.includes(block.trim()));
    assert.match(buildFullContext({ phase }), /Orquestração multiagente/);
  }
});
