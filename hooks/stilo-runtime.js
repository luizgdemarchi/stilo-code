#!/usr/bin/env node
// Stilo Code — formato de saída dos hooks, por agente e por evento.
//
// Ver docs/contrato-hooks.md. O resumo: Claude Code aceita stdout cru no
// SessionStart e no UserPromptSubmit, mas descarta o contexto do SubagentStart
// se ele não vier no envelope hookSpecificOutput. Codex e Qoder sempre exigem
// JSON. Uma escrita em stdout por invocação — duas viram JSON inválido.

const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);
const isQoder = !isCopilot && !isCodex && Boolean(process.env.QODER_SESSION_ID);

function envelope(event, context) {
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: context },
  });
}

function writeHookOutput(event, context) {
  try {
    const texto = String(context || '');

    if (isCopilot) {
      process.stdout.write(
        JSON.stringify(event === 'SessionStart' && texto ? { additionalContext: texto } : {})
      );
      return;
    }
    if (isCodex || isQoder) {
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

module.exports = { isCodex, isCopilot, isQoder, readStdinJson, writeHookOutput };
