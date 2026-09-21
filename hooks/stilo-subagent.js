#!/usr/bin/env node
// Stilo Code — SubagentStart automático.

try {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext } = require('./stilo-instructions.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(process.cwd());
  writeHookOutput('SubagentStart', buildInjectedContext(state, caminhos));
} catch (e) {
  // Melhor esforço.
}
