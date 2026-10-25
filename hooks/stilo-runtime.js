#!/usr/bin/env node
// Stilo Code — formato de saída dos hooks, por agente e por evento.
//
// Ver docs/contrato-hooks.md. O resumo: Claude Code aceita stdout cru no
// SessionStart e no UserPromptSubmit, mas descarta o contexto do SubagentStart
// se ele não vier no envelope hookSpecificOutput. O Codex sempre exige JSON.
// Uma escrita em stdout por invocação — duas viram JSON inválido.

const isCodex = Boolean(process.env.PLUGIN_DATA);

const stdoutGuards = new WeakSet();

function installStdoutGuard(stream = process.stdout) {
  if (stdoutGuards.has(stream)) return;
  stdoutGuards.add(stream);
  stream.on('error', () => {
    // O agente pode fechar o pipe ao interromper ou limitar uma saída grande.
  });
}

function envelope(event, context) {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: context },
  });
}

function writeHookOutput(event, context) {
  try {
    installStdoutGuard();
    const texto = String(context || '');

    if (isCodex) {
      process.stdout.write(texto ? envelope(event, texto) : '{}');
      return;
    }
    if (!texto) return;
    if (event === 'SubagentStart') {
      process.stdout.write(envelope(event, texto));
      return;
    }
    process.stdout.write(texto);
  } catch (e) {
    // stdout fechado no fim do hook não pode virar falha de hook.
  }
}

// Lê o JSON de stdin sem nunca travar a sessão: no Windows o wrapper PowerShell
// pode engolir o pipe e o evento 'end' nunca dispara (contrato § 1).
function readStdinJson(callback, timeoutMs) {
  let input = '';
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    let data = {};
    try {
      data = JSON.parse(input.replace(/^\uFEFF/, '')) || {};
    } catch (e) {
      data = {};
    }
    try {
      callback(data);
    } catch (e) {
      // Melhor esforço: erro no handler sai calado, com código 0.
    }
  }

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', finish);
  process.stdin.on('error', () => {
    finish();
    process.exit(0);
  });
  setTimeout(() => {
    finish();
    process.exit(0);
  }, timeoutMs || 1000).unref();
}

module.exports = { installStdoutGuard, isCodex, readStdinJson, writeHookOutput };
