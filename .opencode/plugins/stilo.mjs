// Stilo Code — plugin do OpenCode.
//
// O OpenCode não tem os eventos de hook do Claude Code, então o pipeline entra
// pelo system prompt de cada turno. Reaproveita hooks/ e modules/ do próprio
// checkout: uma fonte de verdade só, sem cópia do ruleset aqui dentro.
//
// Instalação: em opencode.json,
//   { "plugin": ["./.opencode/plugins/stilo.mjs"] }

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// A biblioteca compartilhada é CommonJS; a ponte é o createRequire. O caminho é
// relativo a este arquivo, não ao cwd, porque o OpenCode roda de um checkout.
const require = createRequire(import.meta.url);
const { isOff, resolveProjeto } = require('../../hooks/stilo-state.js');
const { buildFullContext } = require('../../hooks/stilo-instructions.js');

// Frontmatter dos arquivos de comando: description entre --- e o resto é o
// template. Duas linhas de parser bastam para o formato que nós mesmos geramos.
function leComando(arquivo) {
  try {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!m) return { template: texto.trim() };
    const desc = (m[1].match(/^description:\s*(.+)$/m) || [])[1];
    return { description: desc && desc.trim(), template: m[2].trim() };
  } catch (e) {
    return null;
  }
}

export default async () => {
  const dirComandos = path.join(__dirname, '..', 'command');

  return {
    config: async (config) => {
      if (!config.command) config.command = {};
      try {
        for (const arquivo of fs.readdirSync(dirComandos).filter((f) => f.endsWith('.md'))) {
          const comando = leComando(path.join(dirComandos, arquivo));
          if (comando) config.command[path.basename(arquivo, '.md')] = comando;
        }
      } catch (e) {
        // Sem diretório de comando o plugin ainda injeta o ruleset.
      }

      const dirSkills = path.resolve(__dirname, '../../skills');
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(dirSkills)) config.skills.paths.push(dirSkills);
    },

    'experimental.chat.system.transform': async (_entrada, saida) => {
      try {
        if (isOff()) return;
        const { state, caminhos } = resolveProjeto(process.cwd());
        const contexto = buildFullContext(state, caminhos);
        if (saida.system.length > 0) saida.system[saida.system.length - 1] += '\n\n' + contexto;
        else saida.system.push(contexto);
      } catch (e) {
        // Melhor esforço: nunca derrubar o turno por causa do pipeline.
      }
    },
  };
};
