const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { FASES } = require('../hooks/stilo-state.js');
const { buildInjectedContext } = require('../hooks/stilo-instructions');

function secao(arquivo, titulo) {
  const texto = fs.readFileSync(path.join(__dirname, '../modules', arquivo), 'utf8');
  const inicio = texto.indexOf(titulo);
  assert.ok(inicio >= 0, `${arquivo}: ${titulo}`);
  const fim = texto.indexOf('\n## ', inicio + 1);
  return texto.slice(inicio, fim < 0 ? undefined : fim).trim();
}

test('retomada verificável chega a toda fase, e o roteiro completo chega ao EXECUTE', () => {
  const roteiro = secao('execucao.md', '## Retomada');
  for (const phase of FASES) {
    const ctx = buildInjectedContext({ phase, project: 'teste', reviewRound: 0 });
    assert.ok(ctx.includes('## 4. Retomada verificável'), phase);
    assert.ok(ctx.includes('## 7. Execução segura'), phase);
    assert.equal(ctx.includes(roteiro), phase === 'EXECUTE', phase);
  }
});

test('orquestração chega inteira ao PLAN e a nenhuma outra fase', () => {
  const policy = fs.readFileSync(path.join(__dirname, '../modules/orquestracao.md'), 'utf8').trim();
  const blocos = policy.split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/).map((b) => b.trim()).filter(Boolean);
  for (const phase of FASES) {
    const ctx = buildInjectedContext({ phase, project: 'teste' });
    // Cada bloco é preservado byte a byte; seleção só pode omitir os separadores.
    assert.equal(blocos.every((block) => ctx.includes(block)), phase === 'PLAN', phase);
  }
});
