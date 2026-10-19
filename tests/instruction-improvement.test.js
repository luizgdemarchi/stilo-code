const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
test('comparação limita candidata, conserva avaliador e exige evidência para adoção', () => {
  const text=fs.readFileSync(path.join(__dirname,'../modules/melhoria-instrucoes.md'),'utf8');
  for(const pattern of [/uma candidata/, /Sem falha.*nenhuma alteração/, /sem evidência.*sem adoção/i,
    /avaliador alterado invalida/, /contextos independentes/, /rejeitada preserva/,
    /condição de invalidação/, /documentação canônica/]) assert.match(text,pattern);
});
