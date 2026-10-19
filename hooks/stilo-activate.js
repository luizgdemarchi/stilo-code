#!/usr/bin/env node
// Stilo Code — SessionStart automático.

try {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext, pluginRoot } = require('./stilo-instructions.js');
  const { probeGitHubCli, buildSetupNote } = require('./stilo-setup.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(process.cwd());
  caminhos.setupNote = buildSetupNote(pluginRoot(), probeGitHubCli());
  writeHookOutput('SessionStart', buildInjectedContext(state, caminhos));
} catch (e) {
  // Melhor esforço: um hook que falha não derruba a sessão.
}
