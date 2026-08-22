#!/usr/bin/env node
// Stilo Code — SubagentStart.
//
// O contexto de SessionStart é só da thread principal e nunca chega a um
// subagente. Sem este hook, o subagente de EXECUTE roda sem saber o plano nem a
// fase — que é justamente o caminho recomendado para rodar EXECUTE num modelo
// mais rápido.
//
// Síncrono e sem stdin, pelo mesmo motivo do activate: nunca atrasar o spawn.

try {
  const { isOff, resolveProjeto } = require('./stilo-state.js');
  const { buildFullContext } = require('./stilo-instructions.js');
  const { writeHookOutput } = require('./stilo-runtime.js');

  if (isOff()) process.exit(0);

  const { state, caminhos } = resolveProjeto(process.cwd());

  writeHookOutput('SubagentStart', buildFullContext(state, caminhos));
} catch (e) {
  // Melhor esforço.
}
