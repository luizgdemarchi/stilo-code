#!/usr/bin/env node
// Stilo Code — última fase injetada em cada sessão.
//
// Os módulos da fase só chegavam no SessionStart; uma troca de fase no meio da
// sessão deixava o agente sem as regras da fase nova. O registro fica fora do
// projeto, no diretório de dados do plugin, para nada entrar no repositório do
// usuário. Melhor esforço: nenhuma função lança, e uma falha cai no fallback de
// caminhos da linha de estado.

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { normalizeFase } = require('./stilo-state.js');

const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;
const NOME_REGISTRO = /^[0-9a-f]{16}\.json$/;

function dadosDir() {
  return process.env.CLAUDE_PLUGIN_DATA || process.env.PLUGIN_DATA || path.join(os.tmpdir(), 'stilo-code');
}

function arquivoDaSessao(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null;
  // Hash do id: nome previsível só para quem conhece a sessão, e sem caminho
  // vindo do payload.
  const nome = crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
  return path.join(dadosDir(), 'sessoes', `${nome}.json`);
}

// No temporário do sistema, outro usuário pode criar a pasta antes ou trocá-la
// por um link. Só grava em diretório real, que pertence a quem roda o hook.
function diretorioProprio(dir) {
  const info = fs.lstatSync(dir);
  if (!info.isDirectory() || info.isSymbolicLink()) return false;
  return typeof process.getuid !== 'function' || info.uid === process.getuid();
}

function faseDe(state) {
  return (state && normalizeFase(state.phase)) || null;
}

// Só apaga registros deste módulo (16 hex + .json) com mais de 7 dias.
function podar(dir) {
  try {
    const limite = Date.now() - VALIDADE_MS;
    for (const nome of fs.readdirSync(dir)) {
      if (!NOME_REGISTRO.test(nome)) continue;
      const arquivo = path.join(dir, nome);
      try {
        if (fs.lstatSync(arquivo).mtimeMs < limite) fs.unlinkSync(arquivo);
      } catch (e) {
        // Outro processo pode ter apagado antes.
      }
    }
  } catch (e) {
    // Poda é opcional.
  }
}

function registrarFase(sessionId, state) {
  try {
    const arquivo = arquivoDaSessao(sessionId);
    if (!arquivo) return false;
    const dir = path.dirname(arquivo);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const temporario = !process.env.CLAUDE_PLUGIN_DATA && !process.env.PLUGIN_DATA;
    if ((temporario && !diretorioProprio(path.dirname(dir))) || !diretorioProprio(dir)) return false;
    podar(dir);
    fs.writeFileSync(arquivo, JSON.stringify({ phase: faseDe(state), updated: new Date().toISOString() }));
    return true;
  } catch (e) {
    return false;
  }
}

// Registro ausente ou ilegível conta como mudança: injetar de novo custa pouco,
// e faltar a regra da fase custa a fase inteira.
function faseMudou(sessionId, state) {
  try {
    const arquivo = arquivoDaSessao(sessionId);
    if (!arquivo) return true;
    const registro = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    return !registro || registro.phase !== faseDe(state);
  } catch (e) {
    return true;
  }
}

module.exports = { dadosDir, faseMudou, registrarFase };
