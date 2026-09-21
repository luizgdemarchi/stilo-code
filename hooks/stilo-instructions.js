#!/usr/bin/env node
// Stilo Code — monta o texto que os hooks injetam no contexto.
//
// O AGENTS.md é lido do disco em tempo de execução, nunca embutido em JS: fonte
// única, sem drift, e o usuário pode editar o ruleset sem mexer em código.

const fs = require('fs');
const path = require('path');

const { normalizeFase, readCheckpoint, resolveEnxuto } = require('./stilo-state.js');
const { selectContextBlocks } = require('./stilo-context.js');

const CONTEXT_BUDGET = 16000;

// Próxima ação concreta de cada fase. É o campo que impede o agente de retomar
// um projeto sabendo a fase mas não o que fazer nela.
const PROXIMA_ACAO = {
  BRAINSTORM: 'fazer perguntas até o usuário confirmar problema e escopo',
  SPEC: 'escrever spec.md e submeter ao usuário',
  PLAN: 'escrever plan.md com passos verificáveis',
  EXECUTE: 'seguir plan.md na ordem, verificando cada passo',
  REVIEW: 'revisar o diff contra spec.md e plan.md e gravar .stilo/review-NN.md',
  FIX: 'resolver cada achado do review mais recente e voltar para REVIEW',
  DONE: 'projeto concluído — nada pendente',
};

const MODELO_ALVO = {
  BRAINSTORM: 'profundo',
  SPEC: 'profundo',
  PLAN: 'profundo',
  EXECUTE: 'rápido',
  REVIEW: 'profundo',
  FIX: 'profundo',
  DONE: 'profundo',
};

// CLAUDE_PLUGIN_ROOT quando instalado como plugin; senão o diretório acima
// deste arquivo, que é o que vale num checkout solto (OpenCode, uso manual).
function pluginRoot() {
  return process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');
}

function lerArquivo(...partes) {
  try {
    return fs.readFileSync(path.join(pluginRoot(), ...partes), 'utf8').trim();
  } catch (e) {
    return '';
  }
}

// Todo valor lido do state.json vira texto injetado no contexto do modelo, e o
// arquivo pode ter vindo junto num repositório clonado — é entrada de fora do
// sistema. Colapsa espaço em branco (uma quebra de linha viraria uma instrução
// solta no meio da injeção) e trunca.
function sanitiza(valor, limite) {
  const texto = String(valor === undefined || valor === null ? '' : valor)
    .replace(/\s+/g, ' ')
    .trim();
  const max = limite || 120;
  return texto.length > max ? texto.slice(0, max) + '…' : texto;
}

function checkpointPathFromState(statePath) {
  return statePath ? path.join(path.dirname(statePath), 'checkpoint.json') : null;
}

function buildCheckpointNote(statePath, orientarAusente = true) {
  const checkpointPath = checkpointPathFromState(statePath);
  if (!checkpointPath) {
    return 'stilo: nenhum projeto ativo aqui — não há `.stilo/checkpoint.json` para consultar.';
  }
  const checkpoint = readCheckpoint(checkpointPath);
  if (!checkpoint) {
    if (fs.existsSync(checkpointPath)) {
      return `stilo: checkpoint inválido ou ilegível em ${sanitiza(checkpointPath, 180)} — não sobrescrevi o arquivo.`;
    }
    if (!orientarAusente) return '';
    return [
      `stilo: checkpoint ausente em ${sanitiza(checkpointPath, 180)}.`,
      'Crie um objeto JSON com: version, cycle, phase, task, decisions, verified, pending, nextAction, gitHead opcional e updated.',
    ].join('\n');
  }
  const pendencias = checkpoint.pending.length ? checkpoint.pending.join('; ') : 'nenhuma';
  return [
    `stilo: checkpoint · tarefa=${sanitiza(checkpoint.task)} · fase=${sanitiza(checkpoint.phase)}`,
    `próxima: ${sanitiza(checkpoint.nextAction, 240)}`,
    `pendências: ${sanitiza(pendencias, 300)}`,
  ].join('\n');
}

function buildDoctorReport(diagnostico) {
  const nomes = { absent: 'ausente', unreadable: 'ilegível', invalid: 'inválido', valid: 'válido', ambiguous: 'ambíguo' };
  const linhas = [`stilo doctor: state ${nomes[diagnostico.status] || diagnostico.status}`];
  if (diagnostico.statePath) linhas.push(`state: ${sanitiza(diagnostico.statePath, 200)}`);
  if (diagnostico.error) linhas.push(`erro: ${sanitiza(diagnostico.error, 240)}`);
  if (diagnostico.errors && diagnostico.errors.length) linhas.push(`campos: ${sanitiza(diagnostico.errors.join('; '), 300)}`);
  for (const nome of ['checkpoint', 'cycle', 'evidence']) {
    const item = diagnostico[nome] || { status: 'unavailable' };
    const status = { present: 'presente', absent: 'ausente', invalid: 'inválido', unavailable: 'indisponível' }[item.status] || item.status;
    linhas.push(`${nome}: ${status}${item.path ? ` · ${sanitiza(item.path, 200)}` : ''}`);
  }
  if (diagnostico.cycle && diagnostico.cycle.errors && diagnostico.cycle.errors.length) {
    linhas.push(`ciclo: ${sanitiza(diagnostico.cycle.errors.join('; '), 300)}`);
  }
  for (const documento of (diagnostico.cycle && diagnostico.cycle.documents) || []) {
    linhas.push(`documento ${sanitiza(documento.name)}: ${documento.status === 'ok' ? 'ok' : documento.status}`);
  }
  if (diagnostico.evidence && diagnostico.evidence.errors && diagnostico.evidence.errors.length) {
    linhas.push(`evidências: ${sanitiza(diagnostico.evidence.errors.join('; '), 300)}`);
  }
  if (diagnostico.completion && diagnostico.completion.status === 'pending') {
    const criterios = diagnostico.completion.criteria.length
      ? ` · critérios=${sanitiza(diagnostico.completion.criteria.join(', '), 120)}`
      : '';
    linhas.push(`DONE: requisito obrigatório pendente${criterios}`);
  }
  for (const check of diagnostico.checks || []) {
    linhas.push(`artefato ${sanitiza(check.name)}: ${check.status === 'ok' ? 'ok' : check.status}`);
  }
  return linhas.join('\n');
}

function fase(state) {
  return normalizeFase(state && state.phase) || 'BRAINSTORM';
}

// Fase presente no arquivo mas fora da lista. Cair no default silenciosamente
// faria um projeto em EXECUTE ser reportado como BRAINSTORM, e o agente voltaria
// a fazer perguntas de escopo — errado, e sem nenhum sinal do erro de digitação.
function faseInvalida(state) {
  if (!state || !state.phase) return null;
  return normalizeFase(state.phase) ? null : sanitiza(state.phase);
}

function diagnosticoEstado(state, caminhos) {
  const status = caminhos && caminhos.status;
  if (status === 'unreadable') {
    return {
      status,
      statePath: caminhos.statePath,
      error: caminhos.error,
      errors: [],
    };
  }
  if (status === 'invalid') {
    return {
      status,
      statePath: caminhos.statePath,
      error: null,
      errors: Array.isArray(caminhos.errors) ? caminhos.errors : [],
    };
  }
  return null;
}

// Módulos que o hook injeta sozinho. frontend.md e autoria-skill.md ficam de
// fora de propósito: o gatilho deles depende do que o diff toca e do que o
// projeto é, coisas que só o agente sabe. O AGENTS.md § 5 diz quando lê-los.
function modulosDaFase(state) {
  const modulos = [];
  if (resolveEnxuto(state) !== 'off') modulos.push('enxuto.md');
  if (fase(state) === 'REVIEW') modulos.push('revisor.md');
  return modulos;
}

// Uma linha, para o UserPromptSubmit — barato o bastante para repetir a cada
// mensagem, que é o que impede o agente de esquecer a fase no meio da conversa.
function buildStateLine(state, caminhos) {
  if (caminhos && caminhos.length > 1) {
    return `stilo: ${caminhos.length} projetos encontrados a partir do diretório atual — pergunte ao usuário qual é o desta conversa antes de agir`;
  }
  const diagnostico = diagnosticoEstado(state, caminhos);
  if (diagnostico && diagnostico.status === 'unreadable') {
    return `stilo: state.json ilegível em ${sanitiza(diagnostico.statePath, 160)} · erro: ${sanitiza(diagnostico.error, 120)} · não crie nem reinicie o projeto; corrija o arquivo antes de agir`;
  }
  if (diagnostico && diagnostico.status === 'invalid') {
    const invalida = faseInvalida(state);
    if (invalida) {
      return `stilo: fase inválida no state.json: "${invalida}" · campos: ${sanitiza(diagnostico.errors.join('; '), 130)} · não avance nem aja até corrigir o arquivo`;
    }
    return `stilo: state.json inválido em ${sanitiza(diagnostico.statePath, 140)} · campos: ${sanitiza(diagnostico.errors.join('; '), 150)} · não avance nem aja até corrigir o arquivo`;
  }
  if (!state) {
    return 'stilo: nenhum projeto ativo · próxima: criar a subpasta do projeto e começar em BRAINSTORM';
  }
  const invalida = faseInvalida(state);
  if (invalida) {
    return `stilo: fase inválida no state.json: "${invalida}" · próxima: peça ao usuário a fase correta antes de agir`;
  }
  const f = fase(state);
  const nome = sanitiza(state.project) || 'sem-nome';
  return `stilo: projeto=${nome} · fase=${f} · enxuto=${resolveEnxuto(state)} · próxima: ${PROXIMA_ACAO[f]}`;
}

function blocoEstado(state, caminhos) {
  // Ambiguidade sozinha: emitir também o bloco de "nenhum encontrado" seria uma
  // contradição, e a instrução de criar projeto novo é a ação errada num
  // workspace que já tem dois.
  if (caminhos && caminhos.length > 1) {
    return ['## Estado do Stilo Code', '', buildAmbiguityNote(caminhos)].join('\n');
  }

  const diagnostico = diagnosticoEstado(state, caminhos);
  if (diagnostico) {
    const linhas = [
      '## Estado do Stilo Code',
      '',
      `- **Arquivo:** ${sanitiza(diagnostico.statePath, 200)}`,
    ];
    if (diagnostico.status === 'unreadable') {
      linhas.push(
        '- **Estado:** ilegível',
        `- **Erro:** ${sanitiza(diagnostico.error, 240)}`,
        '',
        'Não crie nem reinicie o projeto. Corrija o `state.json` antes de agir.'
      );
    } else {
      const invalida = faseInvalida(state);
      if (invalida) {
        linhas.push(
          `- **Fase:** valor inválido no \`state.json\`: \`"${invalida}"\``,
          `- **Campos:** ${sanitiza(diagnostico.errors.join('; '), 300)}`,
          '',
          'Não avance nem aja no projeto até corrigir todos os campos do `state.json`.',
          'Não adivinhe a fase, e não recomece o projeto.'
        );
      } else {
        linhas.push(
          '- **Estado:** inválido',
          `- **Campos:** ${sanitiza(diagnostico.errors.join('; '), 300)}`,
          '',
          'Não avance nem aja no projeto até corrigir todos os campos do `state.json`.'
        );
      }
    }
    return linhas.join('\n');
  }

  if (!state) {
    return [
      '## Estado do Stilo Code',
      '',
      'Nenhum `.stilo/state.json` encontrado a partir do diretório atual.',
      '',
      'Se o usuário pedir um projeto novo: crie a subpasta dele, crie',
      '`<subpasta>/.stilo/state.json` em `phase: "BRAINSTORM"` (com `reviewRound: 0` e',
      '`enxuto: "auto"`) e comece pelas perguntas. Não pule para a implementação.',
    ].join('\n');
  }

  const invalida = faseInvalida(state);
  if (invalida) {
    return [
      '## Estado do Stilo Code',
      '',
      `- **Projeto:** ${sanitiza(state.project) || 'sem-nome'}`,
      `- **Fase:** valor inválido no \`state.json\`: \`"${invalida}"\``,
      '',
      'Fases válidas: `BRAINSTORM`, `SPEC`, `PLAN`, `EXECUTE`, `REVIEW`, `FIX`, `DONE`.',
      'Diga isso ao usuário e pergunte em que fase o projeto está antes de agir. Não',
      'adivinhe a fase, e não recomece o projeto.',
    ].join('\n');
  }

  const f = fase(state);
  const linhas = [
    '## Estado do Stilo Code',
    '',
    `- **Projeto:** ${sanitiza(state.project) || 'sem-nome'}`,
    `- **Fase:** ${f}`,
    `- **Próxima ação:** ${PROXIMA_ACAO[f]}`,
    `- **Modelo alvo:** ${MODELO_ALVO[f]}`,
    `- **Modo Enxuto:** ${resolveEnxuto(state)}`,
  ];
  if (f === 'REVIEW' || f === 'FIX') {
    const rodada = Number(state.reviewRound) || 0;
    linhas.push(
      f === 'REVIEW'
        ? `- **Rodada de review:** a próxima grava \`.stilo/review-${String(rodada + 1).padStart(2, '0')}.md\``
        : `- **Rodada de review:** corrigir os achados de \`.stilo/review-${String(rodada).padStart(2, '0')}.md\``
    );
  }
  if (state.updated) linhas.push(`- **Atualizado em:** ${sanitiza(state.updated, 40)}`);
  const checkpoint = buildCheckpointNote(caminhos && caminhos.statePath, false);
  if (checkpoint) linhas.push('', checkpoint);
  linhas.push('');
  linhas.push(
    'Ao concluir esta fase, grave você mesmo a fase seguinte em `.stilo/state.json`.'
  );
  return linhas.join('\n');
}

// Contexto completo para SessionStart e SubagentStart: ruleset + estado +
// módulos que a fase pede.
function buildFullContext(state, caminhos) {
  const partes = [lerArquivo('AGENTS.md'), blocoEstado(state, caminhos)];
  const podeAgir = !diagnosticoEstado(state, caminhos) && !(caminhos && caminhos.length > 1);
  for (const modulo of podeAgir ? modulosDaFase(state) : []) {
    const texto = lerArquivo('modules', modulo);
    if (texto) partes.push(texto);
  }
  return partes.filter(Boolean).join('\n\n---\n\n');
}

function blocosDoContexto(texto) {
  return String(texto || '')
    .split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}

function buildInjectedContext(state, caminhos) {
  const completo = buildFullContext(state, caminhos);
  if (!lerArquivo('AGENTS.md')) return completo;
  if (caminhos && ['unreadable', 'invalid', 'ambiguous'].includes(caminhos.status)) return completo;
  const modulosProtegidos = modulosDaFase(state).flatMap((modulo) =>
    blocosDoContexto(lerArquivo('modules', modulo))
  );
  const selecionado = selectContextBlocks(completo, {
    budget: CONTEXT_BUDGET,
    protected: [
      'Regra 0',
      'Regra 1',
      '## Estado do Stilo Code',
      'Travas de segurança',
      'Negações',
      'Mensagens de erro',
      ...modulosProtegidos,
    ],
  });
  return selecionado === null ? completo : selecionado;
}

// Ambiguidade é reportada, nunca resolvida por chute.
function buildAmbiguityNote(caminhos) {
  return [
    'stilo: mais de um projeto encontrado a partir do diretório atual:',
    ...caminhos.map((c) => `  - ${sanitiza(c, 200)}`),
    'Pergunte ao usuário qual deles é o projeto desta conversa antes de agir.',
  ].join('\n');
}

module.exports = {
  MODELO_ALVO,
  PROXIMA_ACAO,
  buildAmbiguityNote,
  buildCheckpointNote,
  buildDoctorReport,
  buildFullContext,
  buildInjectedContext,
  buildStateLine,
  modulosDaFase,
  pluginRoot,
};
