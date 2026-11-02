#!/usr/bin/env node
// Stilo Code — SessionStart automático.

function main(data) {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext, podeInjetarModulos, pluginRoot } = require('./stilo-instructions.js');
  const { probeGitHubCli, buildSetupNote } = require('./stilo-setup.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { registrarFase } = require('./stilo-sessao.js');
  const { diretorio } = require('./stilo-prompt.js');
  const { state, caminhos } = resolveProjeto(diretorio(data));
  caminhos.setupNote = buildSetupNote(pluginRoot(), probeGitHubCli());
  writeHookOutput('SessionStart', buildInjectedContext(state, caminhos));
  // Registra a fase cujos módulos foram injetados. Sem módulos (estado ausente
  // ou com problema), registra nenhuma, para a primeira fase válida chegar
  // inteira no próximo prompt.
  registrarFase(data.session_id, podeInjetarModulos(state, caminhos) ? state : null);
}

if (require.main === module) {
  try {
    require('./stilo-runtime.js').readStdinJson(main);
  } catch (e) {
    // Melhor esforço: um hook que falha não derruba a sessão.
  }
}

module.exports = { main };
