#!/usr/bin/env node
// Stilo Code — UserPromptSubmit automático. O texto do prompt nunca é comando.

const fs = require('fs');

function diretorio(data) {
  try {
    if (data.cwd && fs.statSync(data.cwd).isDirectory()) return data.cwd;
  } catch (e) {
    // Caminho inválido: usa o cwd da sessão.
  }
  return process.cwd();
}

// A linha de estado vai em toda mensagem. Quando a fase mudou desde a última
// injeção nesta sessão, os módulos da fase nova vão junto, uma vez. Sem
// identificador de sessão ou sem onde registrar, a linha cita os caminhos dos
// módulos para o agente lê-los.
function contextoDoPrompt(data, state, caminhos) {
  const { SEPARADOR } = require('./stilo-context.js');
  const { buildStateLine, caminhosDosModulos, podeInjetarModulos, textoDosModulos } = require('./stilo-instructions.js');
  const { faseMudou, registrarFase } = require('./stilo-sessao.js');
  const linha = buildStateLine(state, caminhos);
  if (!podeInjetarModulos(state, caminhos)) return linha;
  const sessao = typeof data.session_id === 'string' && data.session_id ? data.session_id : null;
  if (sessao && !faseMudou(sessao, state)) return linha;
  if (sessao && registrarFase(sessao, state)) {
    const modulos = textoDosModulos(state, caminhos);
    return modulos ? `${linha}${SEPARADOR}${modulos}` : linha;
  }
  const arquivos = caminhosDosModulos(state, caminhos);
  return arquivos.length ? `${linha} · módulos: ${arquivos.join(', ')}` : linha;
}

function main(data) {
  const { resolveProjeto } = require('./stilo-state.js');
  const { writeHookOutput } = require('./stilo-runtime.js');
  const { state, caminhos } = resolveProjeto(diretorio(data));
  writeHookOutput('UserPromptSubmit', contextoDoPrompt(data, state, caminhos));
}

if (require.main === module) {
  try {
    require('./stilo-runtime.js').readStdinJson(main);
  } catch (e) {
    // Melhor esforço: hook nunca derruba a sessão.
  }
}

module.exports = { contextoDoPrompt, diretorio, main };
