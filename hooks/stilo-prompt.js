#!/usr/bin/env node
// Stilo Code — UserPromptSubmit.
//
// Duas funções: tratar /stilo e /stilo-off, e reinjetar a linha de estado a
// cada mensagem. A reinjeção é o que impede o agente de esquecer a fase no meio
// de uma conversa longa.
//
// Os hooks gravam só o que precisa de efeito imediato — desligar e o nível de
// enxuto. Transição de fase é do agente: só ele sabe que uma fase acabou.

const fs = require('fs');

const NIVEIS_ENXUTO = ['off', 'leve', 'pleno', 'auto'];

// O `cwd` do payload vem do agente e nem sempre é um caminho válido para este
// runtime (um caminho estilo POSIX num Node de Windows, por exemplo). Só use o
// que existe em disco; o process.cwd() do hook é o da sessão de qualquer jeito.
function diretorio(data) {
  try {
    if (data.cwd && fs.statSync(data.cwd).isDirectory()) return data.cwd;
  } catch (e) {
    // Caminho inválido ou inacessível — cai no cwd do próprio processo.
  }
  return process.cwd();
}

// Aceita /stilo, @stilo, $stilo e a forma com namespace de plugin
// (/stilo-code:stilo), que é como o Claude Code expõe o comando.
function parseComando(prompt) {
  const bruto = String(prompt || '').trim();
  if (!/^[/@$]/.test(bruto)) return null;

  const partes = bruto.toLowerCase().split(/\s+/);
  const nome = partes[0].replace(/^[/@$]/, '').replace(/^[a-z0-9-]+:/, '');
  if (nome !== 'stilo' && nome !== 'stilo-off') return null;

  return { nome, args: partes.slice(1) };
}

function main(data) {
  const { isOff, readState, resolveEnxuto, resolveProjeto, setOff, writeState } =
    require('./stilo-state.js');
  const { buildAmbiguityNote, buildFullContext, buildStateLine } =
    require('./stilo-instructions.js');
  const { isQoder, writeHookOutput } = require('./stilo-runtime.js');

  const cwd = diretorio(data);
  const comando = parseComando(data.prompt);

  if (comando && comando.nome === 'stilo-off') {
    setOff(true);
    writeHookOutput('UserPromptSubmit', 'STILO OFF — o pipeline para de ser injetado até o próximo /stilo.');
    return;
  }

  if (comando) {
    // /stilo religa: desligar é global e só sai por comando explícito.
    setOff(false);

    if (comando.args[0] === 'enxuto') {
      const nivel = comando.args[1];
      if (!NIVEIS_ENXUTO.includes(nivel)) {
        writeHookOutput(
          'UserPromptSubmit',
          `stilo: nível inválido. Use um de: ${NIVEIS_ENXUTO.join(', ')}.`
        );
        return;
      }
      const { statePath, caminhos } = resolveProjeto(cwd);
      if (!statePath) {
        writeHookOutput(
          'UserPromptSubmit',
          caminhos.length > 1
            ? buildAmbiguityNote(caminhos)
            : 'stilo: nenhum projeto ativo aqui — nada onde gravar o nível de enxuto.'
        );
        return;
      }
      // Arquivo ilegível nunca é sobrescrito: gravar por cima apagaria project e
      // phase, que são o único registro durável de onde o projeto está.
      const atual = readState(statePath);
      if (!atual) {
        writeHookOutput(
          'UserPromptSubmit',
          `stilo: ${statePath} está ilegível (JSON inválido). Não gravei nada — conserte o arquivo e repita o comando.`
        );
        return;
      }
      const novo = writeState(statePath, Object.assign({}, atual, { enxuto: nivel }));
      if (!novo) {
        writeHookOutput('UserPromptSubmit', `stilo: não consegui gravar ${statePath}.`);
        return;
      }
      writeHookOutput(
        'UserPromptSubmit',
        `stilo: enxuto=${nivel} gravado em ${statePath} (nível efetivo: ${resolveEnxuto(novo)}).`
      );
      return;
    }

    // /stilo puro: a sessão pode ter começado desligada, então vai o ruleset
    // inteiro, não só a linha de estado.
    const { state, caminhos } = resolveProjeto(cwd);
    writeHookOutput('UserPromptSubmit', buildFullContext(state, caminhos));
    return;
  }

  if (isOff()) return;

  const { state, caminhos } = resolveProjeto(cwd);
  // O Qoder não tem SessionStart, então aqui é o único lugar por onde o ruleset
  // entra — nele o UserPromptSubmit faz papel duplo (contrato § 2).
  writeHookOutput(
    'UserPromptSubmit',
    isQoder ? buildFullContext(state, caminhos) : buildStateLine(state, caminhos)
  );
}

try {
  require('./stilo-runtime.js').readStdinJson(main);
} catch (e) {
  // Melhor esforço.
}
