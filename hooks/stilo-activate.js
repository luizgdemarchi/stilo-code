#!/usr/bin/env node
// Stilo Code — SessionStart automático, em duas partes (docs/contrato-hooks.md):
// `nucleo` injeta o AGENTS.md e a nota do gh; `fase`, o bloco de estado e os
// módulos da fase. Cada host mede cada hook à parte e troca por uma prévia o texto
// acima do limite. Sem argumento, as duas partes saem juntas, para inspeção manual.

function main(data, parte) {
  const { resolveProjeto } = require('./stilo-state.js');
  const { buildInjectedContext, podeInjetarModulos, pluginRoot } = require('./stilo-instructions.js');
  const { probeGitHubCli, buildSetupNote } = require('./stilo-setup.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { registrarFase } = require('./stilo-sessao.js');
  const { diretorio } = require('./stilo-prompt.js');
  const { state, caminhos } = resolveProjeto(diretorio(data));
  if (parte !== 'fase') caminhos.setupNote = buildSetupNote(pluginRoot(), probeGitHubCli());
  writeHookOutput('SessionStart', buildInjectedContext(state, caminhos, parte));
  // Registra a fase cujos módulos foram injetados. Sem módulos (estado ausente
  // ou com problema), registra nenhuma, para a primeira fase válida chegar
  // inteira no próximo prompt. O núcleo não traz módulos e não registra.
  if (parte !== 'nucleo') registrarFase(data.session_id, podeInjetarModulos(state, caminhos) ? state : null);
}

if (require.main === module) {
  const parte = process.argv[2];
  try {
    // O núcleo não depende da sessão: sai sem esperar o stdin, que no Windows pode
    // não fechar.
    if (parte === 'nucleo') main({}, parte);
    else require('./stilo-runtime.js').readStdinJson((data) => main(data, parte));
  } catch (e) {
    // Melhor esforço: um hook que falha não derruba a sessão.
  }
}

module.exports = { main };
