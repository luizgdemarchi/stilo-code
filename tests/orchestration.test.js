const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const { ADAPTADORES } = require(path.join(RAIZ, 'scripts', 'sync-adapters.js'));

function le(rel) {
  return fs.readFileSync(path.join(RAIZ, rel), 'utf8');
}

test('o contrato publicado de orquestração permanece presente', () => {
  const orquestracao = le('modules/orquestracao.md');
  const revisor = le('modules/revisor.md');
  const agents = le('AGENTS.md');

  assert.match(orquestracao, /Files:/);
  assert.match(orquestracao, /Depends-on:/);
  assert.match(orquestracao, /coordenador.*comm/i);
  assert.match(agents, /modules\/orquestracao\.md.*PLAN.*EXECUTE.*REVIEW/i);
  assert.match(agents, /coordenador.*ondas/i);
  assert.match(agents, /serializa.*commits/i);
  assert.match(agents, /todos os implementadores.*revis/is);
  assert.match(agents, /sem companions.*sem erro.*sem.*instala/is);
  assert.match(revisor, /qualidade\s+geral.*segurança.*tipagem.*framework/is);
  assert.match(revisor, /arquivo:linha.*gravidade.*alegação curta.*cenário concreto/is);
  assert.match(revisor, /deduplica.*descart.*sem cenário concreto.*já\s+resolvid.*gravidade.*\.stilo\/review-NN\.md/is);
  assert.match(revisor, /sem subagentes/i);
  assert.match(revisor, /sem erro.*sem.*instala/is);
});

test('cada adaptador sincronizado contém o contrato de tarefa', () => {
  assert.strictEqual(ADAPTADORES.length, 6);
  for (const { destino } of ADAPTADORES) {
    const texto = le(destino);
    assert.match(texto, /Files:/, `${destino}: sem Files:`);
    assert.match(texto, /Depends-on:/, `${destino}: sem Depends-on:`);
  }
});
