#!/usr/bin/env node
// Stilo Code — leitura e escrita do estado do projeto.
//
// Biblioteca pura: só sistema de arquivos, nenhum I/O de hook. Nada aqui lança
// exceção para fora; arquivos ilegíveis e estados inválidos preservam o caminho
// e retornam diagnóstico explícito.

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = '.stilo';
const STATE_FILE = 'state.json';

const FASES = ['BRAINSTORM', 'SPEC', 'PLAN', 'EXECUTE', 'REVIEW', 'FIX', 'DONE'];
const NIVEIS = ['off', 'leve', 'pleno'];
const ENXUTO_VALIDOS = ['auto', ...NIVEIS];

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

function readStateResult(statePath) {
  let raw;
  try {
    raw = fs.readFileSync(statePath, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    return {
      parsed: false,
      state: null,
      error: e && e.message ? String(e.message) : 'não foi possível ler o arquivo',
    };
  }
  try {
    const state = JSON.parse(raw);
    return { parsed: true, state, error: null };
  } catch (e) {
    return { parsed: false, state: null, error: 'JSON inválido ou truncado' };
  }
}

function validateState(state) {
  const errors = [];
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return { valid: false, errors: ['state deve ser um objeto JSON'] };
  }
  if (state.version !== 1) errors.push('version deve ser 1');
  if (typeof state.project !== 'string' || !state.project.trim()) {
    errors.push('project deve ser uma string não vazia');
  }
  if (typeof state.phase !== 'string' || !FASES.includes(state.phase)) {
    errors.push(`phase deve ser uma de: ${FASES.join(', ')}`);
  }
  if (!Number.isInteger(state.reviewRound) || state.reviewRound < 0) {
    errors.push('reviewRound deve ser um inteiro não negativo');
  }
  if (typeof state.enxuto !== 'string' || !ENXUTO_VALIDOS.includes(state.enxuto)) {
    errors.push(`enxuto deve ser um de: ${ENXUTO_VALIDOS.join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
}

// Carimba `updated` na hora de gravar: o agente esquecer o timestamp faz a
// próxima sessão confiar num estado que não sabe de quando é.
function agoraUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function writeJsonAtomic(filePath, value) {
  const temporario = filePath + `.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(temporario, JSON.stringify(value, null, 2) + '\n', 'utf8');
    fs.renameSync(temporario, filePath);
    return true;
  } catch (e) {
    try {
      fs.unlinkSync(temporario);
    } catch (e2) {
      // Limpeza best-effort.
    }
    return false;
  }
}

function writeState(statePath, state) {
  const completo = Object.assign({ version: 1 }, state, { updated: agoraUtc() });
  return writeJsonAtomic(statePath, completo) ? completo : null;
}

function normalizeFase(fase) {
  const f = String(fase || '').trim().toUpperCase();
  return FASES.includes(f) ? f : null;
}

function readJsonObject(filePath) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch (e) {
    return null;
  }
}

function listaDeStrings(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validateCheckpoint(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      typeof value.cycle === 'string' && value.cycle.trim() &&
      normalizeFase(value.phase) &&
      typeof value.task === 'string' && value.task.trim() &&
      listaDeStrings(value.decisions) &&
      listaDeStrings(value.verified) &&
      listaDeStrings(value.pending) &&
      typeof value.nextAction === 'string' && value.nextAction.trim() &&
      (value.gitHead === undefined || typeof value.gitHead === 'string') &&
      typeof value.updated === 'string' && value.updated.trim()
  );
}

function readCheckpoint(checkpointPath) {
  const value = readJsonObject(checkpointPath);
  return validateCheckpoint(value) ? value : null;
}

function writeCheckpoint(checkpointPath, checkpoint) {
  const completo = Object.assign({ version: 1 }, checkpoint, { updated: agoraUtc() });
  if (!validateCheckpoint(completo)) return null;
  return writeJsonAtomic(checkpointPath, completo) ? completo : null;
}

const CICLO_SLUG = /^[a-z0-9][a-z0-9-]{1,48}$/;

function validateCycle(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      typeof value.id === 'string' && CICLO_SLUG.test(value.id) &&
      typeof value.started === 'string' && value.started.trim() &&
      Number.isInteger(value.baseReview) && value.baseReview >= 0 &&
      typeof value.updated === 'string' && value.updated.trim()
  );
}

function readCycle(cyclePath) {
  const value = readJsonObject(cyclePath);
  return validateCycle(value) ? value : null;
}

function writeCycle(cyclePath, cycle) {
  const timestamp = agoraUtc();
  const completo = Object.assign({ version: 1, started: timestamp }, cycle, {
    updated: timestamp,
  });
  if (!validateCycle(completo)) return null;
  return writeJsonAtomic(cyclePath, completo) ? completo : null;
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
  if (caminhos.length === 0) return resolution('absent', null, null, caminhos);
  if (caminhos.length > 1) return resolution('ambiguous', null, null, caminhos);

  const statePath = caminhos[0];
  const leitura = readStateResult(statePath);
  if (!leitura.parsed) {
    return resolution('unreadable', null, statePath, caminhos, [], leitura.error);
  }

  const validacao = validateState(leitura.state);
  if (!validacao.valid) {
    return resolution('invalid', leitura.state, statePath, caminhos, validacao.errors);
  }
  return resolution('valid', leitura.state, statePath, caminhos);
}

function resolution(status, state, statePath, caminhos, errors = [], error = null) {
  // Os hooks antigos passam apenas `state` e `caminhos` para a camada de
  // instruções. Metadados não enumeráveis preservam a API da lista e carregam
  // o diagnóstico sem obrigar todos os adaptadores a mudar juntos.
  Object.defineProperties(caminhos, {
    status: { value: status, enumerable: false },
    statePath: { value: statePath, enumerable: false },
    errors: { value: errors, enumerable: false },
    error: { value: error, enumerable: false },
  });
  return { status, state, statePath, caminhos, errors, error };
}

module.exports = {
  CICLO_SLUG,
  ENXUTO_POR_FASE,
  FASES,
  NIVEIS,
  findStateFiles,
  isOff,
  normalizeFase,
  offFlagPath,
  readCheckpoint,
  readCycle,
  readState,
  resolveEnxuto,
  resolveProjeto,
  setOff,
  stiloHome,
  validateCheckpoint,
  validateCycle,
  validateState,
  writeCheckpoint,
  writeCycle,
  writeState,
};
