const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');

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

// Cláusulas exatas, sem flag `s`: palavra-chave solta passaria com a regra invertida.
const CLAUSULAS = [
  /^Carregue somente nas fases `PLAN`, `EXECUTE`, `REVIEW` e `FIX`\.$/m,
  /Escolhas explícitas do usuário prevalecem\./,
  /Sem preferência explícita, não pergunte o modelo a cada tarefa\./,
  /^- Edição mecânica verificável: menor modelo adequado e esforço baixo\.$/m,
  /^- Lógica comum: esforço médio\.$/m,
  /^- Arquitetura, segurança, revisão crítica ou incerteza alta: capacidade maior e esforço alto suportado\.$/m,
  /uma linha em autenticação, permissões, dados ou operação\s+destrutiva não é simples só por ser curta\./,
  /não invente equivalência nem alegue\s+uma troca que a ferramenta não confirmou\./,
  /Sem subagentes, execute em série\./,
  /^- Permissões: mesmo uma alteração curta não é classificada como simples\.$/m,
  /^- Ausência de subagentes: o coordenador executa em série\.$/m,
  /^- Sem controle de modelo ou sem controle de esforço: usar o disponível e registrar a limitação\.$/m,
];

const ESCALADA = [
  /Quando a validação falhar, diagnosticar a causa antes de escalar\./,
  /Falha de capacidade permite\s+escalar modelo ou esforço uma vez/,
  /Falha de ambiente não provoca escalada\./,
  /Se a escalada terminar sem sucesso, o coordenador reassume e registra o impedimento\./,
  /^Ambiente: comando ausente, permissão ou sandbox, rede, dependência ou teste instável\.$/m,
  /^Capacidade: resultado errado com o ambiente íntegro\.$/m,
];

test('seleção pondera risco e tem fallback honesto', () => {
  const texto = le('modules/orquestracao.md');
  for (const clausula of CLAUSULAS) assert.match(texto, clausula);
});

test('escalada distingue falha de capacidade de falha de ambiente', () => {
  const texto = le('modules/orquestracao.md');
  for (const clausula of ESCALADA) assert.match(texto, clausula);
});

test('cláusulas exatas rejeitam a política invertida', () => {
  const texto = le('modules/orquestracao.md')
    .replace('menor modelo adequado e esforço baixo', 'maior modelo e esforço alto')
    .replace('não é simples só por ser curta', 'é simples por ser curta')
    .replace('Sem subagentes, execute em série', 'Sem subagentes, bloqueie e peça instalação')
    .replace('Falha de ambiente não provoca escalada', 'Falha de ambiente provoca escalada');
  const falhas = [...CLAUSULAS, ...ESCALADA].filter((clausula) => !clausula.test(texto));
  assert.strictEqual(falhas.length, 4);
});
