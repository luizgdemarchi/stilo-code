#!/usr/bin/env node
// Stilo Code — UserPromptSubmit automático. O texto do prompt nunca é comando.

const fs = require('fs');

function diretorio(data) {
  try {
    if (data.cwd && fs.statSync(data.cwd).isDirectory()) return data.cwd;
  } catch (e) {
    // Caminho inválido: usa o cwd da sessão.
  }
  return process.cwd();
}

function main(data) {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext, buildStateLine } = require('./stilo-instructions.js');
  const { isQoder, writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(diretorio(data));
  const contexto = buildInjectedContext(state, caminhos);
  writeHookOutput('UserPromptSubmit', isQoder ? contexto : buildStateLine(state, caminhos));
}

if (require.main === module) {
  try {
    require('./stilo-runtime.js').readStdinJson(main);
  } catch (e) {
    // Melhor esforço: hook nunca derruba a sessão.
  }
}

module.exports = { diretorio, main };
