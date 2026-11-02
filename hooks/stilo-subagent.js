#!/usr/bin/env node
// Stilo Code — SubagentStart automático.

try {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildSubagentContext } = require('./stilo-instructions.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(process.cwd());
  writeHookOutput('SubagentStart', buildSubagentContext(state, caminhos));
} catch (e) {
  // Melhor esforço.
}
