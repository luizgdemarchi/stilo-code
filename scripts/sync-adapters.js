#!/usr/bin/env node
// Stilo Code — gera os arquivos de regra por agente a partir do AGENTS.md.
//
//   node scripts/sync-adapters.js           grava
//   node scripts/sync-adapters.js --check   só verifica; sai com 1 se divergir
//
// AGENTS.md é a fonte única. Seis cópias mantidas à mão divergem em uma semana.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FONTE = 'AGENTS.md';

const AVISO =
  '<!-- Gerado a partir de AGENTS.md por scripts/sync-adapters.js. Não edite aqui: edite o AGENTS.md e rode `npm run sync`. -->';

const DESCRICAO =
  'Stilo Code — pipeline de projeto em máquina de estados. Nunca pule para a implementação.';

// Cada adaptador é só um cabeçalho próprio na frente do mesmo corpo.
const ADAPTADORES = [
  {
    destino: '.cursor/rules/stilo.mdc',
    cabecalho: ['---', `description: ${DESCRICAO}`, 'globs:', 'alwaysApply: true', '---'].join('\n'),
  },
  {
    destino: '.kiro/steering/stilo.md',
    cabecalho: ['---', 'title: Stilo Code', 'inclusion: always', '---'].join('\n'),
  },
  { destino: '.clinerules/stilo.md', cabecalho: '' },
  { destino: '.windsurf/rules/stilo.md', cabecalho: '' },
  { destino: '.qoder/rules/stilo.md', cabecalho: '' },
  { destino: '.agents/rules/stilo.md', cabecalho: '' },
];

function corpo() {
  return fs.readFileSync(path.join(RAIZ, FONTE), 'utf8').replace(/\r\n/g, '\n').trim();
}

function conteudo(adaptador, texto) {
  const partes = adaptador.cabecalho ? [adaptador.cabecalho, AVISO, texto] : [AVISO, texto];
  return partes.join('\n\n') + '\n';
}

// Compara ignorando a diferença de fim de linha: no Windows o git pode entregar
// CRLF no checkout, e isso não é dessincronia de conteúdo.
function normaliza(texto) {
  return String(texto).replace(/\r\n/g, '\n');
}

function main() {
  const check = process.argv.includes('--check');
  const texto = corpo();
  const divergentes = [];

  for (const adaptador of ADAPTADORES) {
    const alvo = path.join(RAIZ, adaptador.destino);
    const esperado = conteudo(adaptador, texto);

    let atual = null;
    try {
      atual = fs.readFileSync(alvo, 'utf8');
    } catch (e) {
      // Arquivo ausente conta como divergente.
    }

    if (atual !== null && normaliza(atual) === normaliza(esperado)) continue;

    if (check) {
      divergentes.push(adaptador.destino);
      continue;
    }
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.writeFileSync(alvo, esperado, 'utf8');
    console.log(`gravado  ${adaptador.destino}`);
  }

  if (!check) {
    console.log(`${ADAPTADORES.length} adaptadores em dia com ${FONTE}.`);
    return 0;
  }

  if (divergentes.length) {
    console.error(`Dessincronizado com ${FONTE}:`);
    for (const d of divergentes) console.error(`  ${d}`);
    console.error('Rode: npm run sync');
    return 1;
  }
  console.log(`${ADAPTADORES.length} adaptadores em dia com ${FONTE}.`);
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { ADAPTADORES, conteudo, corpo, main };
