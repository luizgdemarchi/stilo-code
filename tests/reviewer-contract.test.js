const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const text = fs.readFileSync(path.join(__dirname, '../modules/revisor.md'), 'utf8').replace(/\r\n/g, '\n');
const inicio = text.indexOf('\n## Formato de um achado\n');
const fim = text.indexOf('\n## ', inicio + 1);
const formato = text.slice(inicio, fim < 0 ? undefined : fim);

test('formato de achado tem todos os campos e os valores enumerados', () => {
  assert.ok(inicio >= 0);
  for (const campo of ['Arquivo', 'Gravidade', 'O que quebra', 'Como corrigir', 'Evidência', 'Confiança',
    'Contraprova verificada', 'Classificação', 'Origem', 'Estado']) {
    assert.match(formato, new RegExp(`^- \\*\\*${campo}:\\*\\*`, 'm'), campo);
  }
  assert.match(formato, /\*\*Gravidade:\*\* crítico \| alto \| médio \| baixo/);
  assert.match(formato, /\*\*Confiança:\*\* alta \| média \| baixa/);
  assert.match(formato, /\*\*Classificação:\*\* confirmado \| hipótese \| sugestão/);
  assert.match(formato, /\*\*Origem:\*\* introduzido \| preexistente \| indeterminado/);
});

test('tabela de gravidade cobre os quatro níveis', () => {
  for (const nivel of ['crítico', 'alto', 'médio', 'baixo']) {
    assert.match(formato, new RegExp(`^\\| \`${nivel}\` \\|`, 'm'), nivel);
  }
});
