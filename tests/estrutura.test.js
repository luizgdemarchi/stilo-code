// Estrutura e orçamento do ruleset (spec do ciclo 2026-11-02, R10.1): fases,
// gatilhos, âncoras, limites de tamanho, caminhos e ausências. Nenhuma frase de
// prosa é fixada aqui.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ENXUTO_POR_FASE, FASES } = require('../hooks/stilo-state.js');
const { MODULOS_POR_FASE, modulosDaFase } = require('../hooks/stilo-instructions.js');

const RAIZ = path.join(__dirname, '..');

// Conteúdo distribuído: o mesmo conjunto do hash de publicação (decisão 5 do
// plano do ciclo 2026-11-02).
const DISTRIBUIDOS = [
  'AGENTS.md', 'THIRD_PARTY_NOTICES.md', 'LICENSE', 'licenses', 'modules', 'hooks', 'scripts',
  '.claude-plugin', '.codex-plugin', 'package.json',
];

// Orçamento em caracteres, sem espaços finais (tabela do plano). `secao` limita o
// trecho que o subagente recebe.
const ORCAMENTOS = {
  'AGENTS.md': { max: 9000 },
  'modules/brainstorm.md': { max: 3500 },
  'modules/especificacao.md': { max: 2000 },
  'modules/plano.md': { max: 2500 },
  'modules/orquestracao.md': { max: 2800 },
  'modules/execucao.md': { max: 2500 },
  'modules/tdd.md': { max: 1800 },
  'modules/depuracao.md': { max: 1800 },
  'modules/correcao.md': { max: 1200 },
  'modules/revisor.md': { max: 4000, secao: ['## Formato de um achado', 2200] },
  'modules/revisor-editorial.md': { max: 4500, secao: ['## Formato do achado editorial', 1800] },
  'modules/enxuto.md': { max: 2400, secao: ['## O que nunca tocar', 600] },
  'modules/frontend.md': { max: 2000 },
  'modules/encerramento.md': { max: 1800 },
  'modules/auditoria.md': { max: 1500 },
  'modules/subagente.md': { max: 1500 },
  'modules/design.md': { max: 3500 },
  'modules/autoria-skill.md': { max: 5500 },
};

// Módulos novos ou reescritos no ciclo: a primeira linha declara o gatilho.
const COM_GATILHO = [
  'brainstorm', 'especificacao', 'plano', 'orquestracao', 'execucao', 'tdd', 'depuracao',
  'correcao', 'revisor', 'revisor-editorial', 'enxuto', 'frontend', 'encerramento',
  'subagente', 'design',
];

const CRITERIO_DE_SAIDA =
  'Critério de saída: repetir `REVIEW → FIX` até uma rodada sem achado `crítico` nem `alto`.';

// CRLF vira LF, como no hash de publicação: um checkout com autocrlf mede igual.
function le(rel) {
  return fs.readFileSync(path.join(RAIZ, rel), 'utf8').replace(/\r\n/g, '\n');
}

function tamanho(texto) {
  return texto.replace(/\s+$/, '').length;
}

function secao(texto, titulo) {
  const inicio = texto.indexOf(`\n${titulo}\n`);
  assert.ok(inicio >= 0, titulo);
  const fim = texto.indexOf('\n## ', inicio + 1);
  return texto.slice(inicio + 1, fim < 0 ? undefined : fim);
}

function arquivosDistribuidos() {
  const lista = [];
  function varre(rel) {
    const abs = path.join(RAIZ, rel);
    if (fs.statSync(abs).isDirectory()) {
      for (const nome of fs.readdirSync(abs).sort()) varre(path.posix.join(rel, nome));
    } else {
      lista.push(rel);
    }
  }
  for (const rel of DISTRIBUIDOS) varre(rel);
  return lista;
}

// Fases citadas entre crases numa linha.
function fasesCitadas(linha) {
  return FASES.filter((fase) => linha.includes(`\`${fase}\``));
}

test('C02: as três versões são 0.2.0', () => {
  for (const rel of ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']) {
    assert.equal(JSON.parse(le(rel)).version, '0.2.0', rel);
  }
});

test('C04 e orçamentos: AGENTS.md e cada módulo cabem no limite do plano', () => {
  assert.ok(tamanho(le('AGENTS.md')) <= 10000);
  for (const [rel, { max, secao: limite }] of Object.entries(ORCAMENTOS)) {
    const texto = le(rel);
    assert.ok(tamanho(texto) <= max, `${rel}: ${tamanho(texto)} > ${max}`);
    if (limite) {
      const trecho = secao(texto, limite[0]);
      assert.ok(tamanho(trecho) <= limite[1], `${rel} ${limite[0]}: ${tamanho(trecho)} > ${limite[1]}`);
    }
  }
});

test('C07: AGENTS.md tem as âncoras do núcleo e não tem as seções removidas', () => {
  const agents = le('AGENTS.md');
  for (const ancora of [
    '# Stilo Code — pipeline de projeto',
    '## Regra 0 — uma pasta por projeto',
    '## Regra 1 — nunca pular para a implementação',
    '## 1. Fases',
    '## 2. Ciclos e trilhas',
    '## 3. Estado em disco',
    '## 4. Retomada verificável',
    '## 5. Modelo por fase',
    '## 6. Módulos',
    '## 7. Execução segura',
    '## 8. Modo Enxuto',
    '## 9. Idioma',
    '## 10. Aviso de /clear seguro',
    '## 11. Companions',
    '## 12. Hosts e funcionamento automático',
    '**Verificação antes de concluir.**',
    '**Saída de comandos.**',
    '`.stilo/logs/`',
  ]) {
    assert.ok(agents.includes(ancora), ancora);
  }
  assert.ok(!agents.includes('Preparação do ambiente'));
  assert.ok(!agents.includes('Contrato de tarefas e ondas'));
});

test('C08: critério único de saída do review, sem "até zero achados"', () => {
  for (const rel of arquivosDistribuidos()) {
    assert.ok(!le(rel).includes('até zero achados'), rel);
  }
  assert.ok(le('AGENTS.md').includes(CRITERIO_DE_SAIDA));
  assert.ok(le('modules/revisor.md').includes(CRITERIO_DE_SAIDA));
});

test('C09: gatilhos de enxuto.md e orquestracao.md coincidem com os hooks', () => {
  const niveis = new Set(Object.values(ENXUTO_POR_FASE).filter((nivel) => nivel !== 'off'));
  const linhaEnxuto = le('modules/enxuto.md').split('\n')[0];
  const citados = ['off', 'leve', 'pleno'].filter((nivel) => linhaEnxuto.includes(`\`${nivel}\``));
  assert.deepEqual(new Set(citados), niveis);

  const injetadaEm = FASES.filter((phase) => modulosDaFase({ phase }).includes('orquestracao.md'));
  assert.deepEqual(fasesCitadas(le('modules/orquestracao.md').split('\n')[0]), injetadaEm);
});

test('C18: cada módulo novo declara na primeira linha o gatilho e as fases em que é injetado', () => {
  for (const nome of COM_GATILHO) {
    const primeira = le(`modules/${nome}.md`).split('\n')[0];
    assert.match(primeira, /^Gatilho: /, nome);
    const injetadaEm = FASES.filter((phase) => MODULOS_POR_FASE[phase].includes(`${nome}.md`));
    const citadas = fasesCitadas(primeira);
    for (const phase of injetadaEm) assert.ok(citadas.includes(phase), `${nome}: ${phase}`);
  }
  for (const modulos of Object.values(MODULOS_POR_FASE)) {
    for (const modulo of modulos) assert.ok(fs.existsSync(path.join(RAIZ, 'modules', modulo)), modulo);
  }
});

test('C11: nenhum arquivo distribuído cita versão de modelo', () => {
  for (const rel of arquivosDistribuidos()) {
    assert.doesNotMatch(le(rel), /(Opus|Sonnet|Haiku) \d/, rel);
  }
});

test('C17: documentos migrados para docs/ciclos e originais ausentes', () => {
  for (const rel of ['spec.md', 'plan.md', 'docs/superpowers', '.stilo/cycle.json']) {
    assert.equal(fs.existsSync(path.join(RAIZ, rel)), false, rel);
  }
  const ciclos = {
    '2026-08-21-v1': ['spec.md', 'plan.md'],
    '2026-09-04-orquestracao-review-multiagente': ['spec.md', 'plan.md'],
    '2026-09-07-retomada-confiavel-governanca': ['spec.md', 'plan.md'],
    '2026-09-18-automatico-sem-comandos': ['plan.md'],
    '2026-09-21-auditoria-opcional-simplificacao': ['spec.md', 'plan.md'],
    '2026-10-01-selecao-modelo-esforco': ['plan.md'],
    '2026-10-19-confiabilidade-agente': ['spec.md', 'plan.md'],
    '2026-10-24-apenas-claude-codex': ['plan.md'],
    '2026-10-24-auditoria-seguranca': ['spec.md'],
  };
  for (const [ciclo, arquivos] of Object.entries(ciclos)) {
    for (const arquivo of arquivos) {
      assert.ok(fs.existsSync(path.join(RAIZ, 'docs', 'ciclos', ciclo, arquivo)), `${ciclo}/${arquivo}`);
    }
  }
  assert.match(JSON.parse(le('package.json')).scripts['validate-plan'], /docs\/ciclos\/[^ ]+\/plan\.md$/);
});

test('C19: superpowers só nos avisos de terceiros, com as duas licenças', () => {
  const avisos = le('THIRD_PARTY_NOTICES.md');
  assert.match(avisos, /MIT/);
  assert.match(avisos, /Jesse Vincent/);
  assert.match(avisos, /Apache/);
  assert.match(avisos, /frontend-design/);
  assert.ok(fs.existsSync(path.join(RAIZ, 'licenses', 'Apache-2.0.txt')));
  // O id do ciclo 2026-11-02 contém a palavra e aparece no caminho do
  // `validate-plan` do package.json; é nome de pasta, não menção ao plugin.
  const idDoCiclo = '2026-11-02-dieta-superpowers-design';
  for (const rel of arquivosDistribuidos().filter((r) => r !== 'THIRD_PARTY_NOTICES.md')) {
    assert.doesNotMatch(le(rel).split(idDoCiclo).join(''), /superpowers/i, rel);
  }
});

test('C22: package.json sem dependencies', () => {
  const pacote = JSON.parse(le('package.json'));
  assert.equal(Object.hasOwn(pacote, 'dependencies'), false);
});
