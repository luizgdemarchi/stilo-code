// Stilo Code — plugin do OpenCode.
//
// O OpenCode não tem os eventos de hook do Claude Code, então o pipeline entra
// pelo system prompt de cada turno. Reaproveita hooks/ e modules/ do próprio
// checkout: uma fonte de verdade só, sem cópia do ruleset aqui dentro.
//
// Instalação: em opencode.json,
//   { "plugin": ["./.opencode/plugins/stilo.mjs"] }

import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A biblioteca compartilhada é CommonJS; a ponte é o createRequire. O caminho é
// relativo a este arquivo, não ao cwd, porque o OpenCode roda de um checkout.
const require = createRequire(import.meta.url);
const { resolveProjeto } = require('../../hooks/stilo-state.js');
const { buildInjectedContext } = require('../../hooks/stilo-instructions.js');

export default async () => {
  return {
    'experimental.chat.system.transform': async (_entrada, saida) => {
      try {
        const { state, caminhos } = resolveProjeto(process.cwd());
        const contexto = buildInjectedContext(state, caminhos);
        if (saida.system.length > 0) saida.system[saida.system.length - 1] += '\n\n' + contexto;
        else saida.system.push(contexto);
      } catch (e) {
        // Melhor esforço: nunca derrubar o turno por causa do pipeline.
      }
    },
  };
};
