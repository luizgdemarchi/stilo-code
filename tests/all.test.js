const fs = require('node:fs');
const path = require('node:path');

// Descobre os testes sozinho, para que nenhum arquivo novo dependa de editar esta lista.
const testes = fs.readdirSync(__dirname)
  .filter((nome) => nome.endsWith('.test.js') && nome !== path.basename(__filename))
  .sort();

for (const nome of testes) require(path.join(__dirname, nome));
