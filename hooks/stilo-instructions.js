#!/usr/bin/env node
// Stilo Code — monta o texto que os hooks injetam no contexto.
//
// O AGENTS.md é lido do disco em tempo de execução, nunca embutido em JS: fonte
// única, sem drift, e o usuário pode editar o ruleset sem mexer em código.

const fs = require('fs');
const path = require('path');

const { normalizeFase, resolveEnxuto } = require('./stilo-state.js');

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

function fase(state) {
  return normalizeFase(state && state.phase) || 'BRAINSTORM';
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
function buildStateLine(state) {
  if (!state) {
    return 'stilo: nenhum projeto ativo · próxima: criar a subpasta do projeto e começar em BRAINSTORM';
  }
  const f = fase(state);
  const nome = String(state.project || 'sem-nome');
  return `stilo: projeto=${nome} · fase=${f} · enxuto=${resolveEnxuto(state)} · próxima: ${PROXIMA_ACAO[f]}`;
}

function blocoEstado(state) {
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

  const f = fase(state);
  const linhas = [
    '## Estado do Stilo Code',
    '',
    `- **Projeto:** ${state.project || 'sem-nome'}`,
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
  if (state.updated) linhas.push(`- **Atualizado em:** ${state.updated}`);
  linhas.push('');
  linhas.push(
    'Ao concluir esta fase, grave você mesmo a fase seguinte em `.stilo/state.json`.'
  );
  return linhas.join('\n');
}

// Contexto completo para SessionStart e SubagentStart: ruleset + estado +
// módulos que a fase pede.
function buildFullContext(state) {
  const partes = [lerArquivo('AGENTS.md'), blocoEstado(state)];
  for (const modulo of modulosDaFase(state)) {
    const texto = lerArquivo('modules', modulo);
    if (texto) partes.push(texto);
  }
  return partes.filter(Boolean).join('\n\n---\n\n');
}

// Ambiguidade é reportada, nunca resolvida por chute.
function buildAmbiguityNote(caminhos) {
  return [
    'stilo: mais de um projeto encontrado a partir do diretório atual:',
    ...caminhos.map((c) => `  - ${c}`),
    'Pergunte ao usuário qual deles é o projeto desta conversa antes de agir.',
  ].join('\n');
}

module.exports = {
  MODELO_ALVO,
  PROXIMA_ACAO,
  buildAmbiguityNote,
  buildFullContext,
  buildStateLine,
  modulosDaFase,
  pluginRoot,
};
