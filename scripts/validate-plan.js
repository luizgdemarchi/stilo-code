#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const TASK_HEADING = /^###\s+(?:Tarefa\s+|Task\s+)?[A-Za-z][A-Za-z0-9_-]*\b/i;
const FILE_ENTRY = /^\s*-\s*(Create|Modify|Delete|Read|Rename):\s*(.+?)\s*$/i;
const WRITE_ACTIONS = new Set(['create', 'modify', 'delete', 'rename']);

function lineError(line, task, message) {
  const owner = task ? ` na tarefa ${task}` : '';
  return `Linha ${line}${owner}: ${message}.`;
}

function isUncertainPath(filePath) {
  return /[*?\[\]{}<>]|\.\.\.|…|(?:^|[\\/])(TBD|TODO)(?:[\\/]|$)|\b(a definir|incerto)\b/i.test(filePath)
    || /[\\/]$/.test(filePath);
}

function normalizeFile(filePath) {
  return filePath
    .trim()
    .replace(/^['"`]|['"`]$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+/g, '/')
    .toLocaleLowerCase('en-US');
}

function taskBlocks(lines) {
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (TASK_HEADING.test(lines[index])) starts.push(index);
  }

  return starts.map((start, index) => ({
    start,
    end: index + 1 < starts.length ? starts[index + 1] : lines.length,
  })).filter(({ start, end }) => {
    const block = lines.slice(start, end);
    return block.some((line) => /^\s*ID\s*:/i.test(line))
      || /^###\s+(?:Tarefa\s+|Task\s+)?[A-Za-z]+\d+\b/i.test(lines[start]);
  });
}

function parseDependencies(value) {
  if (/^(nenhum|none|-)\.?$/i.test(value.trim())) return [];
  return value.split(',').map((dependency) => dependency.trim()).filter(Boolean);
}

function resourceKey(resource) {
  const match = resource.match(/^(port|db|dir|profile):(.+)$/i);
  if (!match || /[*?\[\]{}<>]/.test(resource.replace(/\[(?:::|::1)\]/g, 'ipv6'))) return null;
  const [, rawType, value] = match;
  const type = rawType.toLowerCase();
  if (type === 'dir') return { type, value: path.posix.normalize(value.replace(/\\/g, '/')).replace(/\/$/, '').toLowerCase() || '/' };
  if (type !== 'port') return { type, value: value.toLowerCase() };
  const port = value.match(/^(\[[^\]]+\]|[^:\s]+):(\d+)$/);
  if (!port || Number(port[2]) < 1 || Number(port[2]) > 65535) return null;
  let host = port[1].toLowerCase();
  if (['localhost', '127.0.0.1', '[::1]'].includes(host)) host = 'loopback';
  return { type, host, port: Number(port[2]), wildcard: ['0.0.0.0', '[::]'].includes(host) };
}

function resourceConflict(a, b) {
  const x = resourceKey(a), y = resourceKey(b);
  if (!x || !y || x.type !== y.type) return false;
  if (x.type === 'port') return x.port === y.port && (x.host === y.host || x.wildcard || y.wildcard);
  if (x.type !== 'dir') return x.value === y.value;
  const contains = (parent, child) => parent === child || child.startsWith(parent.endsWith('/') ? parent : parent + '/')
    || (parent === '.' && !path.posix.isAbsolute(child) && !/^[a-z]:/.test(child) && child !== '..' && !child.startsWith('../'));
  return contains(x.value, y.value) || contains(y.value, x.value);
}

function parsePlan(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const errors = [];
  const tasks = [];

  for (const { start, end } of taskBlocks(lines)) {
    const block = lines.slice(start, end);
    const headingLine = start + 1;
    const idEntry = block.findIndex((line) => /^\s*ID\s*:/i.test(line));
    const specialistEntry = block.findIndex((line) => /^\s*Especialista\s*:/i.test(line));
    const filesEntry = block.findIndex((line) => /^\s*Files\s*:\s*$/i.test(line));
    const dependencyEntry = block.findIndex((line) => /^\s*-?\s*Depends-on\s*:/i.test(line));
    const headingId = (lines[start].match(/^###\s+(?:Tarefa\s+|Task\s+)?([A-Za-z][A-Za-z0-9_-]*)\b/i) || [])[1];
    const resourceEntries = block.map((line, i) => /^\s*Resources\s*:/i.test(line) ? i : -1).filter(i => i >= 0);
    const resourcesDeclared = resourceEntries.length > 0;
    let resources = [];
    if (resourceEntries.length > 1) errors.push(lineError(headingLine, headingId, 'Resources duplicado'));
    if (resourcesDeclared) {
      const raw = block[resourceEntries[0]].replace(/^\s*Resources\s*:\s*/i, '').trim();
      if (!/^nenhum$/i.test(raw)) {
        resources = raw.split(',').map(value => value.trim());
        if (resources.some(value => !resourceKey(value))) errors.push(lineError(headingLine, headingId, 'recurso inválido em Resources'));
      }
    }

    let id = '';
    if (idEntry >= 0) id = block[idEntry].replace(/^\s*ID\s*:\s*/i, '').trim();
    if (!id) errors.push(lineError(headingLine, headingId, 'campo ID ausente ou vazio'));

    let specialist = '';
    if (specialistEntry >= 0) {
      specialist = block[specialistEntry].replace(/^\s*Especialista\s*:\s*/i, '').trim();
    }
    if (!specialist) errors.push(lineError(headingLine, id || headingId, 'campo Especialista ausente ou vazio'));

    const files = [];
    if (filesEntry < 0) {
      errors.push(lineError(headingLine, id || headingId, 'campo Files ausente'));
    } else {
      const filesEnd = dependencyEntry >= 0 ? dependencyEntry : block.length;
      for (let index = filesEntry + 1; index < filesEnd; index += 1) {
        const line = block[index];
        if (!line.trim()) continue;
        const match = line.match(FILE_ENTRY);
        if (!match) {
          if (/^\s*-/i.test(line)) {
            errors.push(lineError(start + index + 1, id || headingId, 'entrada de Files inválida'));
          }
          continue;
        }
        const [, action, filePath] = match;
        files.push({ action, path: filePath.trim(), line: start + index + 1 });
      }
      if (files.length === 0) errors.push(lineError(start + filesEntry + 1, id || headingId, 'Files não contém caminhos'));
    }

    let dependsOn = [];
    if (dependencyEntry < 0) {
      errors.push(lineError(headingLine, id || headingId, 'campo Depends-on ausente'));
    } else {
      const value = block[dependencyEntry].replace(/^\s*-?\s*Depends-on\s*:\s*/i, '').trim();
      if (!value) errors.push(lineError(start + dependencyEntry + 1, id || headingId, 'campo Depends-on vazio'));
      else dependsOn = parseDependencies(value);
    }

    tasks.push({
      id,
      specialist,
      files,
      dependsOn,
      resources,
      resourcesDeclared,
      uncertain: files.some((file) => isUncertainPath(file.path)),
      line: headingLine,
    });
  }

  if (tasks.length === 0) errors.push('Nenhuma tarefa com contrato foi encontrada.');
  return { tasks, errors };
}

function findCycle(tasksById) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(id) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    stack.push(id);
    for (const dependency of tasksById.get(id).dependsOn) {
      if (!tasksById.has(dependency)) continue;
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  }

  for (const id of tasksById.keys()) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
}

function dependencyClosure(task, tasksById, seen = new Set()) {
  for (const dependency of task.dependsOn) {
    if (seen.has(dependency) || !tasksById.has(dependency)) continue;
    seen.add(dependency);
    dependencyClosure(tasksById.get(dependency), tasksById, seen);
  }
  return seen;
}

function formWaves(tasks, tasksById) {
  const pending = new Set(tasks.map((task) => task.id));
  const completed = new Set();
  const waves = [];

  while (pending.size > 0) {
    const ready = tasks.filter((task) => pending.has(task.id)
      && task.dependsOn.every((dependency) => completed.has(dependency)));
    if (ready.length === 0) return [];

    const certain = ready.filter((task) => !task.uncertain);
    const wave = certain.length > 0 ? certain : [ready[0]];
    waves.push(wave);
    for (const task of wave) {
      pending.delete(task.id);
      completed.add(task.id);
    }
  }

  return waves;
}

function validatePlan(text) {
  const parsed = parsePlan(text);
  const errors = [...parsed.errors];
  const warnings = parsed.tasks.filter(task => !task.resourcesDeclared)
    .map(task => `${task.id}: plano legado sem Resources; execução conservadora em série.`);
  const tasksById = new Map();

  for (const task of parsed.tasks) {
    if (!task.id) continue;
    if (tasksById.has(task.id)) {
      errors.push(lineError(task.line, task.id, `ID duplicado ${task.id}`));
      continue;
    }
    tasksById.set(task.id, task);
  }

  for (const task of tasksById.values()) {
    for (const dependency of task.dependsOn) {
      if (!tasksById.has(dependency)) {
        errors.push(lineError(task.line, task.id, `dependência inexistente ${dependency}`));
      }
    }
  }

  const cycle = findCycle(tasksById);
  if (cycle) errors.push(`Ciclo de dependências: ${cycle.join(' -> ')}.`);

  if (!cycle) {
    const ordered = parsed.tasks.filter((task) => tasksById.get(task.id) === task);
    ordered.forEach((task, index) => {
      if (!task.uncertain) return;
      const previousIds = ordered.slice(0, index).map((previous) => previous.id);
      const closure = dependencyClosure(task, tasksById);
      const missing = previousIds.filter((id) => !closure.has(id));
      if (missing.length > 0) {
        errors.push(lineError(task.line, task.id, `marcação incerta sem serialização; faltam dependências anteriores: ${missing.join(', ')}`));
      }
    });
  }

  const graphIsUsable = !cycle
    && [...tasksById.values()].every((task) => task.dependsOn.every((dependency) => tasksById.has(dependency)))
    && tasksById.size === parsed.tasks.length;
  const candidateWaves = graphIsUsable ? formWaves([...tasksById.values()], tasksById) : [];

  // A barreira legada não pode esconder colisões já rejeitadas pelo contrato antigo.
  let waves = candidateWaves;

  candidateWaves.forEach((wave, index) => {
    const owners = new Map();
    for (const task of wave) {
      for (const file of task.files) {
        if (!WRITE_ACTIONS.has(file.action.toLowerCase()) || isUncertainPath(file.path)) continue;
        const normalized = normalizeFile(file.path);
        if (owners.has(normalized)) {
          errors.push(`Onda ${index + 1}: arquivo compartilhado ${normalized} entre ${owners.get(normalized)} e ${task.id}.`);
        } else {
          owners.set(normalized, task.id);
        }
      }
    }
  });

  if (graphIsUsable && warnings.length) {
    const serial = [...tasksById.values()].map(task => ({ ...task, dependsOn: [...task.dependsOn] }));
    for (let index = 0; index < serial.length; index++) {
      if (serial[index].resourcesDeclared) continue;
      serial[index].dependsOn.push(...serial.slice(0, index).map(task => task.id));
      for (const later of serial.slice(index + 1)) later.dependsOn.push(serial[index].id);
    }
    const serialById = new Map(serial.map(task => [task.id, task]));
    if (findCycle(serialById)) {
      errors.push('Plano legado: ambiguidade entre a ordem conservadora e dependência futura. Declare Resources e revise a ordem.');
      waves = [];
    } else waves = formWaves(serial, serialById);
  }

  waves.forEach((wave, index) => {
    for (let i = 0; i < wave.length; i++) for (let j = i + 1; j < wave.length; j++) {
      for (const a of wave[i].resources) for (const b of wave[j].resources) {
        if (resourceConflict(a, b)) errors.push(`Onda ${index + 1}: recurso compartilhado ${a} / ${b} entre ${wave[i].id} e ${wave[j].id}.`);
      }
    }
  });
  return { valid: errors.length === 0, errors, waves, warnings };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    console.error('Uso: node scripts/validate-plan.js <arquivo.md>');
    return 2;
  }

  const planPath = path.resolve(argv[0]);
  let text;
  try {
    text = fs.readFileSync(planPath, 'utf8');
  } catch (error) {
    console.error(`Não foi possível ler ${planPath}: ${error.message}`);
    return 2;
  }

  const result = validatePlan(text);
  for (const warning of result.warnings) console.error(`Aviso: ${warning}`);
  if (!result.valid) {
    console.error(`Plano inválido: ${result.errors.length} erro(s).`);
    for (const error of result.errors) console.error(`- ${error}`);
    return 1;
  }

  const taskCount = result.waves.reduce((count, wave) => count + wave.length, 0);
  console.log(`Plano válido: ${taskCount} tarefa(s), ${result.waves.length} onda(s).`);
  result.waves.forEach((wave, index) => console.log(`Onda ${index + 1}: ${wave.map((task) => task.id).join(', ')}`));
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { parsePlan, validatePlan, main };

