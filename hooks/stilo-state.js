#!/usr/bin/env node
// Stilo Code — leitura e escrita do estado do projeto.
//
// Biblioteca pura: só sistema de arquivos, nenhum I/O de hook. Nada aqui lança
// exceção para fora — estado ilegível vira "não encontrei", nunca uma sessão
// quebrada.

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = '.stilo';
const STATE_FILE = 'state.json';

const FASES = ['BRAINSTORM', 'SPEC', 'PLAN', 'EXECUTE', 'REVIEW', 'FIX', 'DONE'];
const NIVEIS = ['off', 'leve', 'pleno'];

// Nível de enxuto por fase quando state.enxuto é "auto" (AGENTS.md § 6).
const ENXUTO_POR_FASE = {
  BRAINSTORM: 'off',
  SPEC: 'leve',
  PLAN: 'leve',
  EXECUTE: 'pleno',
  REVIEW: 'pleno',
  FIX: 'pleno',
  DONE: 'off',
};

// STILO_HOME existe para os testes trocarem o home sem mexer no do usuário.
function stiloHome() {
  return process.env.STILO_HOME || path.join(os.homedir(), STATE_DIR);
}

function offFlagPath() {
  return path.join(stiloHome(), 'off');
}

function isOff() {
  try {
    return fs.existsSync(offFlagPath());
  } catch (e) {
    return false;
  }
}

// Melhor esforço: devolve true quando o flag ficou no estado pedido.
function setOff(off) {
  try {
    if (off) {
      fs.mkdirSync(stiloHome(), { recursive: true });
      fs.writeFileSync(offFlagPath(), '');
    } else {
      try {
        fs.unlinkSync(offFlagPath());
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

function candidato(dir) {
  return path.join(dir, STATE_DIR, STATE_FILE);
}

// Sobe a partir de `cwd` procurando .stilo/state.json, como o git faz com .git.
// Se não achar, varre UM nível abaixo. Devolve sempre uma lista: vazia quando
// não há projeto, com mais de um item quando há ambiguidade — que o agente
// resolve perguntando, nunca adivinhando.
function findStateFiles(cwd) {
  let dir;
  try {
    dir = path.resolve(cwd || process.cwd());
  } catch (e) {
    return [];
  }

  // 1. Subindo.
  let atual = dir;
  for (;;) {
    const p = candidato(atual);
    try {
      if (fs.existsSync(p)) return [p];
    } catch (e) {
      // Diretório ilegível — segue subindo.
    }
    const pai = path.dirname(atual);
    if (pai === atual) break;
    atual = pai;
  }

  // 2. Um nível abaixo — cobre o layout <workspace>/<projeto>/.stilo/.
  const achados = [];
  let entradas = [];
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  for (const entrada of entradas) {
    if (!entrada.isDirectory() || entrada.name === STATE_DIR) continue;
    const p = candidato(path.join(dir, entrada.name));
    try {
      if (fs.existsSync(p)) achados.push(p);
    } catch (e) {
      // Ignora subpasta ilegível.
    }
  }
  return achados.sort();
}

// JSON malformado, arquivo ausente ou conteúdo que não é objeto devolvem null.
function readState(statePath) {
  try {
    // Alguns editores no Windows gravam BOM, que quebra o JSON.parse.
    const raw = fs.readFileSync(statePath, 'utf8').replace(/^\uFEFF/, '');
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    return state;
  } catch (e) {
    return null;
  }
}

// Carimba `updated` na hora de gravar: o agente esquecer o timestamp faz a
// próxima sessão confiar num estado que não sabe de quando é.
function writeState(statePath, state) {
  try {
    const completo = Object.assign({ version: 1 }, state, {
      updated: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(completo, null, 2) + '\n', 'utf8');
    return completo;
  } catch (e) {
    return null;
  }
}

function normalizeFase(fase) {
  const f = String(fase || '').trim().toUpperCase();
  return FASES.includes(f) ? f : null;
}

// "auto" (ou qualquer valor inválido) cai na tabela por fase; um nível explícito
// sobrepõe a tabela inteira.
function resolveEnxuto(state) {
  const bruto = String((state && state.enxuto) || 'auto').trim().toLowerCase();
  if (NIVEIS.includes(bruto)) return bruto;
  const fase = normalizeFase(state && state.phase);
  return fase ? ENXUTO_POR_FASE[fase] : 'off';
}

// Resolve o projeto do diretório atual em uma chamada só. `caminhos` com mais de
// um item é ambiguidade: quem chama reporta, nunca escolhe.
function resolveProjeto(cwd) {
  const caminhos = findStateFiles(cwd);
  if (caminhos.length !== 1) return { state: null, statePath: null, caminhos };
  return { state: readState(caminhos[0]), statePath: caminhos[0], caminhos };
}

module.exports = {
  ENXUTO_POR_FASE,
  FASES,
  NIVEIS,
  findStateFiles,
  isOff,
  normalizeFase,
  offFlagPath,
  readState,
  resolveEnxuto,
  resolveProjeto,
  setOff,
  stiloHome,
  writeState,
};
