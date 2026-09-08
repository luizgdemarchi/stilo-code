#!/usr/bin/env node
// Diagnóstico somente leitura do projeto Stilo Code.

const fs = require('fs');
const path = require('path');

const { resolveProjeto } = require('./stilo-state.js');

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

function optionalText(filePath) {
  try {
    fs.readFileSync(filePath, 'utf8');
    return { status: 'present', path: filePath };
  } catch (e) {
    if (e && e.code === 'ENOENT') return { status: 'absent', path: filePath };
    return {
      status: 'unreadable',
      path: filePath,
      error: e && e.message ? String(e.message) : 'não foi possível ler o arquivo',
    };
  }
}

function expectedArtifacts(projectRoot, state) {
  const names = [];
  if (['PLAN', 'EXECUTE', 'REVIEW', 'FIX', 'DONE'].includes(state.phase)) names.push('spec.md');
  if (['EXECUTE', 'REVIEW', 'FIX', 'DONE'].includes(state.phase)) names.push('plan.md');
  if (['REVIEW', 'FIX', 'DONE'].includes(state.phase) && state.reviewRound > 0) {
    names.push(`review-${String(state.reviewRound).padStart(2, '0')}.md`);
  }
  return names.map((name) =>
    fileCheck(name, name.startsWith('review-') ? path.join(projectRoot, '.stilo', name) : path.join(projectRoot, name))
  );
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
  };

  if (!projeto.statePath) return base;

  const stiloDir = path.dirname(projeto.statePath);
  const projectRoot = path.dirname(stiloDir);
  base.projectRoot = projectRoot;
  base.checkpoint = optionalJson(path.join(stiloDir, 'checkpoint.json'));
  base.cycle = optionalJson(path.join(stiloDir, 'cycle.json'));
  base.evidence = optionalText(path.join(projectRoot, 'docs', 'aceite.md'));
  if (projeto.status === 'valid') base.checks = expectedArtifacts(projectRoot, projeto.state);
  return base;
}

module.exports = { diagnoseProject };
