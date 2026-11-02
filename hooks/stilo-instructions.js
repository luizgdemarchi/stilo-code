#!/usr/bin/env node
// Stilo Code — monta o texto que os hooks injetam no contexto.
//
// O AGENTS.md é lido do disco em tempo de execução, nunca embutido em JS: fonte
// única, sem drift, e o usuário pode editar o ruleset sem mexer em código.

const fs = require('fs');
const path = require('path');

const { documentosDoCiclo, normalizeFase, readCheckpoint, resolveEnxuto } = require('./stilo-state.js');
const { SEPARADOR, selectContextBlocks } = require('./stilo-context.js');

// Limite de cada texto que um hook injeta. Acima dele, o Claude Code entrega ao
// modelo só o caminho de um arquivo e uma prévia de 2.000 caracteres, e o Codex faz
// o mesmo acima de ~2.500 tokens. Por isso o SessionStart sai em duas partes.
const CONTEXT_BUDGET = 10000;

// Próxima ação concreta de cada fase, com os documentos ativos do ciclo. É o
// campo que impede o agente de retomar um projeto sabendo a fase mas não o que
// fazer nela.
const PROXIMA_ACAO = {
  BRAINSTORM: () => 'fazer perguntas até o usuário confirmar problema, escopo e trilha',
  SPEC: (d) => {
    if (d.trilha === 'curta') return `escrever ${d.ciclo} com ## Spec e ## Plano e submeter ao usuário`;
    const curta = d.cycle ? ` (trilha curta: docs/ciclos/${d.cycle}/ciclo.md)` : '';
    return `escrever ${d.spec}${curta} e submeter ao usuário`;
  },
  PLAN: (d) => (d.trilha === 'curta' ? `conferir os passos de ${d.ciclo}` : `escrever ${d.plan} com passos verificáveis`),
  EXECUTE: (d) => `seguir ${d.trilha === 'curta' ? d.ciclo : d.plan} na ordem, verificando cada passo`,
  REVIEW: (d) => {
    const base = d.trilha === 'curta' ? d.ciclo : `${d.spec} e ${d.plan}`;
    return `revisar o diff contra ${base}${d.design ? ` e ${d.design}` : ''} e gravar .stilo/review-NN.md`;
  },
  FIX: () => 'resolver cada achado do review mais recente e voltar para REVIEW',
  EDITORIAL_REVIEW: () => 'revisar o texto alterado no ciclo e gravar .stilo/editorial-review-NN.md',
  EDITORIAL_FIX: () => 'resolver os achados editoriais e voltar para EDITORIAL_REVIEW',
  DONE: () => 'oferecer a auditoria opcional e as opções de integração',
};

// Módulos que o hook injeta em cada fase (spec R7.1). enxuto.md entra à frente
// quando o nível não é off, e frontend.md em EXECUTE e REVIEW quando o ciclo tem
// design.md. Os demais o agente lê pelo gatilho (AGENTS.md § 6).
const MODULOS_POR_FASE = {
  BRAINSTORM: ['brainstorm.md'],
  SPEC: ['especificacao.md'],
  PLAN: ['orquestracao.md', 'plano.md'],
  EXECUTE: ['execucao.md', 'tdd.md'],
  REVIEW: ['revisor.md'],
  FIX: ['tdd.md', 'depuracao.md', 'correcao.md'],
  EDITORIAL_REVIEW: ['revisor-editorial.md'],
  EDITORIAL_FIX: ['revisor-editorial.md'],
  DONE: ['auditoria.md', 'encerramento.md'],
};

// Seção que o subagente recebe do módulo da fase. Os títulos são contrato
// (decisão 3 do plano do ciclo 2026-11-02).
const SECAO_DO_SUBAGENTE = {
  REVIEW: ['revisor.md', '## Formato de um achado'],
  EDITORIAL_REVIEW: ['revisor-editorial.md', '## Formato do achado editorial'],
};

// Âncoras do AGENTS.md que a compactação nunca descarta.
const ANCORAS = [
  'Regra 0',
  'Regra 1',
  '## 3. Estado em disco',
  '## 4. Retomada verificável',
  '## 6. Módulos',
  '## 7. Execução segura',
];

const MODELO_ALVO = {
  BRAINSTORM: 'profundo',
  SPEC: 'profundo',
  PLAN: 'profundo',
  EXECUTE: 'rápido',
  REVIEW: 'profundo',
  FIX: 'profundo',
  EDITORIAL_REVIEW: 'profundo',
  EDITORIAL_FIX: 'profundo',
  DONE: 'profundo',
};

// CLAUDE_PLUGIN_ROOT quando instalado como plugin; senão o diretório acima
// deste arquivo, que é o que vale num checkout solto.
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

function modulosDir() {
  return path.join(path.resolve(pluginRoot()), 'modules');
}

// Trecho de um módulo do título até o próximo título de nível 1 ou 2, fora de
// bloco de código.
function secao(texto, titulo) {
  const linhas = String(texto || '').split('\n');
  const inicio = linhas.findIndex((linha) => linha.trim() === titulo);
  if (inicio < 0) return '';
  let cerca = false;
  let fim = linhas.length;
  for (let i = inicio + 1; i < linhas.length; i += 1) {
    if (/^\s*```/.test(linhas[i])) cerca = !cerca;
    else if (!cerca && /^#{1,2}\s/.test(linhas[i])) {
      fim = i;
      break;
    }
  }
  return linhas.slice(inicio, fim).join('\n').trim();
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

// Raiz do projeto: a pasta acima de `.stilo/`. Sem o caminho do estado (chamada
// direta, sem projeto resolvido), vale o diretório atual.
function raizDoProjeto(caminhos) {
  return caminhos && caminhos.statePath ? path.dirname(path.dirname(caminhos.statePath)) : process.cwd();
}

// Documentos ativos do ciclo, relativos à raiz do projeto e com `/`.
function documentosAtivos(state, caminhos) {
  const raiz = raizDoProjeto(caminhos);
  const docs = documentosDoCiclo(raiz, state);
  const relativo = (arquivo) => (arquivo ? path.relative(raiz, arquivo).split(path.sep).join('/') : null);
  return {
    cycle: docs.cycle,
    trilha: docs.trilha,
    spec: relativo(docs.spec),
    plan: relativo(docs.plan),
    ciclo: relativo(docs.ciclo),
    design: relativo(docs.design),
  };
}

function listaDeDocumentos(d) {
  return [d.spec, d.plan, d.ciclo, d.design].filter(Boolean).map((doc) => `\`${doc}\``).join(', ');
}

function modulosDaFase(state, projectRoot) {
  if (!state || faseInvalida(state)) return [];
  const f = fase(state);
  const modulos = [];
  if (resolveEnxuto(state) !== 'off') modulos.push('enxuto.md');
  modulos.push(...MODULOS_POR_FASE[f]);
  if ((f === 'EXECUTE' || f === 'REVIEW') && projectRoot && documentosDoCiclo(projectRoot, state).design) {
    modulos.push('frontend.md');
  }
  return modulos;
}

// Estado ilegível, inválido ou ambíguo não recebe módulos: o agente não deve
// agir na fase até o arquivo ser corrigido.
function podeInjetarModulos(state, caminhos) {
  return Boolean(state) && !faseInvalida(state) && !diagnosticoEstado(state, caminhos) && !(caminhos && caminhos.length > 1);
}

function modulosDoContexto(state, caminhos) {
  return podeInjetarModulos(state, caminhos) ? modulosDaFase(state, raizDoProjeto(caminhos)) : [];
}

// Texto dos módulos da fase, para a troca de fase dentro da sessão.
function textoDosModulos(state, caminhos) {
  return modulosDoContexto(state, caminhos)
    .map((modulo) => lerArquivo('modules', modulo))
    .filter(Boolean)
    .join(SEPARADOR);
}

// Caminhos absolutos dos módulos da fase, quando o hook não pode injetá-los.
function caminhosDosModulos(state, caminhos) {
  return modulosDoContexto(state, caminhos).map((modulo) => path.join(modulosDir(), modulo));
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
  const docs = documentosAtivos(state, caminhos);
  const ciclo = docs.cycle ? ` · ciclo=${docs.cycle}` : '';
  return `stilo: projeto=${nome} · fase=${f}${ciclo} · enxuto=${resolveEnxuto(state)} · próxima: ${PROXIMA_ACAO[f](docs)}`;
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
      'Se o usuário pedir um projeto novo: crie a subpasta dele e `<subpasta>/.stilo/state.json` com',
      '`{ "version": 1, "project": "<nome>", "phase": "BRAINSTORM", "cycle": "AAAA-MM-DD-assunto", "reviewRound": 0, "editorialReviewRound": 0, "updated": "<ISO 8601 UTC>" }`',
      'e comece pelas perguntas. Não pule para a implementação.',
      `Módulos sob demanda: ${modulosDir()}${path.sep}`,
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
      'Fases válidas: `BRAINSTORM`, `SPEC`, `PLAN`, `EXECUTE`, `REVIEW`, `FIX`, `EDITORIAL_REVIEW`, `EDITORIAL_FIX`, `DONE`.',
      'Diga isso ao usuário e pergunte em que fase o projeto está antes de agir. Não',
      'adivinhe a fase, e não recomece o projeto.',
    ].join('\n');
  }

  const f = fase(state);
  const docs = documentosAtivos(state, caminhos);
  const linhas = [
    '## Estado do Stilo Code',
    '',
    `- **Projeto:** ${sanitiza(state.project) || 'sem-nome'}`,
    `- **Fase:** ${f}`,
    `- **Ciclo:** ${docs.cycle || 'nenhum'}`,
    `- **Trilha:** ${docs.trilha}`,
    `- **Documentos:** ${listaDeDocumentos(docs)}`,
    `- **Próxima ação:** ${PROXIMA_ACAO[f](docs)}`,
    `- **Modelo alvo:** ${MODELO_ALVO[f]}`,
    `- **Modo Enxuto:** ${resolveEnxuto(state)}`,
    `- **Módulos sob demanda:** ${modulosDir()}${path.sep}`,
  ];
  if (f === 'REVIEW' || f === 'FIX') {
    const rodada = Number(state.reviewRound) || 0;
    linhas.push(
      f === 'REVIEW'
        ? `- **Rodada de review:** a próxima grava \`.stilo/review-${String(rodada + 1).padStart(2, '0')}.md\``
        : `- **Rodada de review:** corrigir os achados de \`.stilo/review-${String(rodada).padStart(2, '0')}.md\``
    );
  }
  if (f === 'EDITORIAL_REVIEW' || f === 'EDITORIAL_FIX') {
    const rodada = Number(state.editorialReviewRound) || 0;
    linhas.push(
      f === 'EDITORIAL_REVIEW'
        ? `- **Rodada editorial:** a próxima grava \`.stilo/editorial-review-${String(rodada + 1).padStart(2, '0')}.md\``
        : `- **Rodada editorial:** corrigir os achados de \`.stilo/editorial-review-${String(rodada).padStart(2, '0')}.md\``
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

// Partes do SessionStart, cada uma num comando de hook: o núcleo (ruleset e nota
// do gh) e a fase (bloco de estado e módulos que a fase pede).
function partesDoContexto(state, caminhos) {
  return {
    nucleo: [lerArquivo('AGENTS.md'), caminhos && caminhos.setupNote],
    fase: [
      blocoEstado(state, caminhos),
      ...modulosDoContexto(state, caminhos).map((modulo) => lerArquivo('modules', modulo)),
    ],
  };
}

// Contexto completo de uma parte; sem parte, as duas juntas.
function buildFullContext(state, caminhos, parte) {
  const partes = partesDoContexto(state, caminhos);
  const textos = partes[parte] || [...partes.nucleo, ...partes.fase];
  return textos.filter(Boolean).join(SEPARADOR);
}

// Contexto do SubagentStart: papel, proibições e o essencial da fase, sem o
// núcleo. O subagente executa uma tarefa; estado, fases e usuário são do
// coordenador.
function buildSubagentContext(state, caminhos) {
  if (!podeInjetarModulos(state, caminhos)) {
    const problema = diagnosticoEstado(state, caminhos) || (caminhos && caminhos.length > 1) || faseInvalida(state);
    return problema ? buildStateLine(state, caminhos) : '';
  }
  const f = fase(state);
  const docs = documentosAtivos(state, caminhos);
  const partes = [
    [
      '## Stilo Code — subagente',
      '',
      `- **Projeto:** ${sanitiza(state.project) || 'sem-nome'}`,
      `- **Fase:** ${f}`,
      `- **Ciclo:** ${docs.cycle || 'nenhum'}`,
    ].join('\n'),
    lerArquivo('modules', 'subagente.md'),
  ];
  if (resolveEnxuto(state) !== 'off') partes.push(secao(lerArquivo('modules', 'enxuto.md'), '## O que nunca tocar'));
  if (f === 'EXECUTE' || f === 'FIX') partes.push(lerArquivo('modules', 'tdd.md'));
  const extra = SECAO_DO_SUBAGENTE[f];
  if (extra) partes.push(secao(lerArquivo('modules', extra[0]), extra[1]));
  return partes.filter(Boolean).join(SEPARADOR);
}

function blocosDoContexto(texto) {
  return String(texto || '')
    .split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);
}

function buildInjectedContext(state, caminhos, parte) {
  if (parte !== 'nucleo' && parte !== 'fase') {
    return ['nucleo', 'fase']
      .map((p) => buildInjectedContext(state, caminhos, p))
      .filter(Boolean)
      .join(SEPARADOR);
  }
  const completo = buildFullContext(state, caminhos, parte);
  if (!lerArquivo('AGENTS.md')) return completo;
  if (caminhos && ['unreadable', 'invalid', 'ambiguous'].includes(caminhos.status)) return completo;
  // Rede de segurança: os orçamentos dos módulos mantêm cada parte abaixo do
  // limite, e a compactação só age se um texto crescer além do previsto.
  const protegidos =
    parte === 'nucleo'
      ? [...ANCORAS, ...(caminhos && caminhos.setupNote ? [caminhos.setupNote] : [])]
      : [
          '## Estado do Stilo Code',
          ...modulosDoContexto(state, caminhos).flatMap((modulo) => blocosDoContexto(lerArquivo('modules', modulo))),
        ];
  const selecionado = selectContextBlocks(completo, { budget: CONTEXT_BUDGET, protected: protegidos });
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
  MODULOS_POR_FASE,
  PROXIMA_ACAO,
  buildAmbiguityNote,
  buildCheckpointNote,
  buildDoctorReport,
  buildFullContext,
  buildInjectedContext,
  buildStateLine,
  buildSubagentContext,
  caminhosDosModulos,
  modulosDaFase,
  podeInjetarModulos,
  pluginRoot,
  textoDosModulos,
};
