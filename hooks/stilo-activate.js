#!/usr/bin/env node
// Stilo Code — SessionStart.
//
// Injeta o ruleset e o estado do projeto a cada início de sessão. O matcher
// `clear|compact` do manifesto é o que faz o pipeline sobreviver ao /clear: o
// agente relê o disco e volta na fase certa sem o usuário dizer nada.
//
// Não lê stdin de propósito — nada aqui precisa do payload, e um hook que não
// espera stdin não trava a sessão.

try {
  const { isOff, resolveProjeto } = require('./stilo-state.js');
  const { buildFullContext } = require('./stilo-instructions.js');
  const { writeHookOutput } = require('./stilo-runtime.js');

  if (isOff()) process.exit(0);

  const { state, caminhos } = resolveProjeto(process.cwd());

  writeHookOutput('SessionStart', buildFullContext(state, caminhos));
} catch (e) {
  // Melhor esforço: um hook que quebra a sessão é pior do que um hook que não roda.
}
