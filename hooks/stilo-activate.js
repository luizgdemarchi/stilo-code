#!/usr/bin/env node
// Stilo Code — SessionStart automático.

try {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext } = require('./stilo-instructions.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(process.cwd());
  writeHookOutput('SessionStart', buildInjectedContext(state, caminhos));
} catch (e) {
  // Melhor esforço: um hook que falha não derruba a sessão.
}
