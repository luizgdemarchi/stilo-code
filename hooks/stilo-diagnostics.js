#!/usr/bin/env node
// Diagnóstico somente leitura do projeto Stilo Code.

const fs = require('fs');
const path = require('path');

const { documentosDoCiclo, resolveProjeto } = require('./stilo-state.js');

const REQUIRED_EVIDENCE_CRITERIA = Array.from({ length: 54 }, (_, index) => String(index + 1));

function fileCheck(name, filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return { name, path: filePath, status: 'unreadable', error: 'o caminho não é um arquivo' };
    }
    fs.accessSync(filePath, fs.constants.R_OK);
    return { name, path: filePath, status: 'ok' };
  } catch (e) {
    if (e && e.code === 'ENOENT') return { name, path: filePath, status: 'missing' };
    return {
      name,
      path: filePath,
      status: 'unreadable',
      error: e && e.message ? String(e.message) : 'não foi possível ler o arquivo',
    };
  }
}

function optionalJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { status: 'invalid', path: filePath, error: 'o conteúdo JSON não é um objeto' };
    }
    return { status: 'present', path: filePath, value };
  } catch (e) {
    if (e && e.code === 'ENOENT') return { status: 'absent', path: filePath };
    return {
      status: 'invalid',
      path: filePath,
      error: e && e.message ? String(e.message) : 'não foi possível ler o arquivo',
    };
  }
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function tableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  return trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function readEvidence(filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return { status: 'absent', path: filePath, criteria: [], errors: [], missing: [...REQUIRED_EVIDENCE_CRITERIA], duplicates: [] };
    }
    return {
      status: 'invalid',
      path: filePath,
      criteria: [],
      errors: [e && e.message ? String(e.message) : 'não foi possível ler o arquivo'],
      missing: [...REQUIRED_EVIDENCE_CRITERIA],
      duplicates: [],
    };
  }

  const required = ['criterio', 'tarefa', 'comando', 'tipo', 'resultado', 'review'];
  const lines = text.split(/\r?\n/);
  let headerIndex = -1;
  let headers = [];
  for (let index = 0; index < lines.length; index += 1) {
    const cells = tableCells(lines[index]);
    const normalized = cells.map(normalizeHeader);
    if (required.every((name) => normalized.includes(name))) {
      headerIndex = index;
      headers = normalized;
      break;
    }
  }

  if (headerIndex < 0) {
    return {
      status: 'present',
      path: filePath,
      criteria: [],
      errors: ['tabela de evidências ausente ou sem as colunas Critério, Tarefa, Comando, Tipo, Resultado e Review'],
      missing: [...REQUIRED_EVIDENCE_CRITERIA],
      duplicates: [],
    };
  }

  const criteria = [];
  const errors = [];
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const cells = tableCells(lines[index]);
    if (!cells.length) break;
    const row = Object.fromEntries(headers.map((name, column) => [name, cells[column] || '']));
    const type = normalizeHeader(row.tipo);
    if (!required.every((name) => row[name])) {
      errors.push(`linha ${index + 1}: todos os campos da evidência são obrigatórios`);
      continue;
    }
    if (!['local', 'viva', 'pendente', 'retirado'].includes(type)) {
      errors.push(`linha ${index + 1}: tipo deve ser local, viva, pendente ou retirado`);
      continue;
    }
    criteria.push({
      criterion: row.criterio,
      task: row.tarefa,
      command: row.comando,
      type,
      result: row.resultado,
      review: row.review,
    });
  }

  if (!criteria.length) errors.push('nenhum critério de evidência válido encontrado');
  const counts = new Map();
  for (const criterion of criteria) {
    counts.set(criterion.criterion, (counts.get(criterion.criterion) || 0) + 1);
  }
  const duplicates = [...counts]
    .filter(([, count]) => count > 1)
    .map(([criterion]) => criterion);
  for (const criterion of duplicates) errors.push(`critério duplicado: ${criterion}`);
  const missing = REQUIRED_EVIDENCE_CRITERIA.filter((criterion) => !counts.has(criterion));
  if (missing.length) errors.push(`critérios obrigatórios ausentes: ${missing.join(', ')}`);
  for (const criterion of counts.keys()) {
    if (!REQUIRED_EVIDENCE_CRITERIA.includes(criterion)) errors.push(`critério inesperado: ${criterion}`);
  }
  return { status: 'present', path: filePath, criteria, errors, missing, duplicates };
}

// Nome do artefato relativo à raiz do projeto, com `/` em qualquer sistema:
// `spec.md` no legado, `docs/ciclos/<id>/spec.md` com ciclo.
function nomeRelativo(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

// O ciclo vem do campo `cycle` do state.json; `.stilo/cycle.json` não é mais lido.
function cycleInfo(documentos) {
  const nomes = { spec: 'spec', plan: 'plano', ciclo: 'ciclo', design: 'design' };
  return {
    status: documentos.cycle ? 'present' : 'absent',
    path: documentos.dir,
    id: documentos.cycle,
    trilha: documentos.trilha,
    documents: documentos.cycle
      ? Object.keys(nomes)
          .filter((chave) => documentos[chave])
          .map((chave) => fileCheck(nomes[chave], documentos[chave]))
      : [],
  };
}

// Mesmo mapeamento fase → artefato de antes: spec a partir de PLAN, plano a
// partir de EXECUTE. Na trilha curta, o ciclo.md faz os dois papéis.
function expectedArtifacts(projectRoot, state, documentos) {
  const arquivos = [];
  const desdePlan = ['PLAN', 'EXECUTE', 'REVIEW', 'FIX', 'DONE'].includes(state.phase);
  const desdeExecute = ['EXECUTE', 'REVIEW', 'FIX', 'DONE'].includes(state.phase);
  if (documentos.trilha === 'curta') {
    if (desdePlan) arquivos.push(documentos.ciclo);
  } else {
    if (desdePlan) arquivos.push(documentos.spec);
    if (desdeExecute) arquivos.push(documentos.plan);
  }
  const checks = arquivos.map((arquivo) => fileCheck(nomeRelativo(projectRoot, arquivo), arquivo));
  if (['REVIEW', 'FIX', 'DONE'].includes(state.phase) && state.reviewRound > 0) {
    const review = `review-${String(state.reviewRound).padStart(2, '0')}.md`;
    checks.push(fileCheck(review, path.join(projectRoot, '.stilo', review)));
  }
  return checks;
}

function diagnoseProject(cwd) {
  const projeto = resolveProjeto(cwd);
  const base = {
    status: projeto.status,
    state: projeto.state,
    statePath: projeto.statePath,
    caminhos: projeto.caminhos,
    errors: projeto.errors,
    error: projeto.error,
    checks: [],
    checkpoint: { status: 'unavailable', path: null },
    cycle: { status: 'unavailable', path: null },
    evidence: { status: 'unavailable', path: null },
    completion: { status: 'unavailable', mandatory: false, criteria: [] },
  };

  if (!projeto.statePath) return base;

  const stiloDir = path.dirname(projeto.statePath);
  const projectRoot = path.dirname(stiloDir);
  base.projectRoot = projectRoot;
  base.checkpoint = optionalJson(path.join(stiloDir, 'checkpoint.json'));
  base.evidence = readEvidence(path.join(projectRoot, 'docs', 'aceite.md'));
  if (projeto.status === 'valid') {
    const documentos = documentosDoCiclo(projectRoot, projeto.state);
    base.cycle = cycleInfo(documentos);
    base.checks = expectedArtifacts(projectRoot, projeto.state, documentos);
    if (projeto.state.phase === 'DONE') {
      const pending = base.evidence.criteria
        .filter((criterion) => criterion.type === 'pendente')
        .map((criterion) => criterion.criterion);
      const pendingCriteria = [...new Set([...pending, ...base.evidence.missing, ...base.evidence.duplicates])];
      const incomplete = base.evidence.status !== 'present' || base.evidence.errors.length > 0 || pending.length > 0;
      base.completion = incomplete
        ? {
            status: 'pending',
            mandatory: true,
            criteria: pendingCriteria,
            reason: 'evidência obrigatória pendente',
          }
        : { status: 'ready', mandatory: true, criteria: [], reason: null };
    } else {
      base.completion = { status: 'not-applicable', mandatory: false, criteria: [] };
    }
  }
  return base;
}

module.exports = { diagnoseProject, readEvidence };
