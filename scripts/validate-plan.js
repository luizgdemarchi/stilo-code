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
  const waves = graphIsUsable ? formWaves([...tasksById.values()], tasksById) : [];

  waves.forEach((wave, index) => {
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

  return { valid: errors.length === 0, errors, waves };
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

