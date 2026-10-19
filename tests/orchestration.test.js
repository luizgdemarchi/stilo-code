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

test('seleção registra pedido, confirmação e resultado separadamente', () => {
  const texto = le('modules/orquestracao.md');
  for (const campo of [
    'Classificação:',
    'Modelo solicitado:',
    'Esforço solicitado:',
    'Justificativa:',
    'Aplicação confirmada:',
    'Validação:',
    'Escalada:'
  ]) {
    assert.ok(texto.includes(campo), campo);
  }
  assert.match(texto, /escolhas explícitas do usuário prevalecem/i);
  assert.match(texto, /não informada pela ferramenta/i);
});

test('seleção pondera risco e tem fallback honesto', () => {
  const texto = le('modules/orquestracao.md');
  assert.match(texto, /edição mecânica/i);
  assert.match(texto, /lógica comum/i);
  assert.match(texto, /arquitetura.*segurança.*incerteza/is);
  assert.match(texto, /permissões.*não.*simples/is);
  assert.match(texto, /sem subagentes.*série/is);
  assert.match(texto, /sem controle de modelo/i);
  assert.match(texto, /sem controle de esforço/i);
});

test('escalada distingue falha de capacidade de falha de ambiente', () => {
  const texto = le('modules/orquestracao.md');
  assert.match(texto, /diagnosticar.*antes.*escalar/is);
  assert.match(texto, /falha de capacidade.*escalar.*uma vez/is);
  assert.match(texto, /falha de ambiente não provoca escalada/i);
  assert.match(texto, /escalada.*sem sucesso.*coordenador reassume/is);
});
