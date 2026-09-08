const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  findStateFiles,
  isOff,
  readState,
  resolveEnxuto,
  resolveProjeto,
  setOff,
  validateState,
  writeState,
} = require('../hooks/stilo-state.js');

function tmpdir() {
  // realpath: no macOS /var é link para /private/var, e o caminho resolvido
  // precisa bater com o que findStateFiles devolve.
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stilo-')));
}

function criaProjeto(raiz, nome, state) {
  const dir = path.join(raiz, nome, '.stilo');
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'state.json');
  fs.writeFileSync(
    p,
    JSON.stringify(
      state || { version: 1, project: nome, phase: 'PLAN', reviewRound: 0, enxuto: 'auto' }
    )
  );
  return p;
}

function estadoValido(overrides) {
  return Object.assign(
    { version: 1, project: 'app', phase: 'PLAN', reviewRound: 0, enxuto: 'auto' },
    overrides
  );
}

test('findStateFiles acha subindo a partir de uma subpasta', () => {
  const raiz = tmpdir();
  const esperado = criaProjeto(raiz, 'app');
  const fundo = path.join(raiz, 'app', 'src', 'nested');
  fs.mkdirSync(fundo, { recursive: true });

  assert.deepStrictEqual(findStateFiles(fundo), [esperado]);
});

test('findStateFiles acha um nível abaixo do cwd', () => {
  const raiz = tmpdir();
  const esperado = criaProjeto(raiz, 'app');

  assert.deepStrictEqual(findStateFiles(raiz), [esperado]);
});

test('findStateFiles devolve a lista inteira quando há dois projetos', () => {
  const raiz = tmpdir();
  const a = criaProjeto(raiz, 'app-a');
  const b = criaProjeto(raiz, 'app-b');

  assert.deepStrictEqual(findStateFiles(raiz), [a, b].sort());
});

test('findStateFiles devolve vazio quando não há projeto nenhum', () => {
  const raiz = tmpdir();
  fs.mkdirSync(path.join(raiz, 'sem-estado'));

  assert.deepStrictEqual(findStateFiles(raiz), []);
});

test('subir tem prioridade sobre varrer abaixo', () => {
  const raiz = tmpdir();
  const acima = criaProjeto(raiz, 'app');
  criaProjeto(path.join(raiz, 'app'), 'sub');

  assert.deepStrictEqual(findStateFiles(path.join(raiz, 'app')), [acima]);
});

test('readState não lança com JSON malformado', () => {
  const raiz = tmpdir();
  const p = path.join(raiz, 'state.json');
  fs.writeFileSync(p, '{ isto não é json');

  assert.strictEqual(readState(p), null);
});

test('readState devolve null para arquivo ausente e para JSON que não é objeto', () => {
  const raiz = tmpdir();
  const lista = path.join(raiz, 'lista.json');
  fs.writeFileSync(lista, '[1, 2]');

  assert.strictEqual(readState(path.join(raiz, 'nao-existe.json')), null);
  assert.strictEqual(readState(lista), null);
});

test('writeState cria o diretório, carimba updated e volta legível', () => {
  const raiz = tmpdir();
  const p = path.join(raiz, 'novo', '.stilo', 'state.json');

  const escrito = writeState(p, { project: 'x', phase: 'SPEC', enxuto: 'auto' });

  assert.strictEqual(escrito.phase, 'SPEC');
  assert.strictEqual(escrito.version, 1);
  assert.match(escrito.updated, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.deepStrictEqual(readState(p), escrito);
});

test('validateState aceita somente o schema completo da versão 1', () => {
  assert.deepStrictEqual(validateState(estadoValido()), { valid: true, errors: [] });

  const casos = [
    [estadoValido({ version: 2 }), /version/],
    [estadoValido({ project: '  ' }), /project/],
    [estadoValido({ phase: undefined }), /phase/],
    [estadoValido({ phase: null }), /phase/],
    [estadoValido({ phase: '' }), /phase/],
    [estadoValido({ phase: 'BUILD' }), /phase/],
    [estadoValido({ reviewRound: -1 }), /reviewRound/],
    [estadoValido({ reviewRound: 1.5 }), /reviewRound/],
    [estadoValido({ enxuto: 'compacto' }), /enxuto/],
  ];

  for (const [state, padrao] of casos) {
    const resultado = validateState(state);
    assert.strictEqual(resultado.valid, false, JSON.stringify(state));
    assert.match(resultado.errors.join(' '), padrao);
  }
});

test('resolveProjeto distingue ausente, ilegível, inválido, válido e ambíguo', () => {
  const ausente = tmpdir();
  assert.strictEqual(resolveProjeto(ausente).status, 'absent');

  const ilegivel = tmpdir();
  const caminhoIlegivel = criaProjeto(ilegivel, 'app', estadoValido());
  fs.writeFileSync(caminhoIlegivel, '{ "version": 1');
  const resolucaoIlegivel = resolveProjeto(ilegivel);
  assert.strictEqual(resolucaoIlegivel.status, 'unreadable');
  assert.strictEqual(resolucaoIlegivel.statePath, caminhoIlegivel);
  assert.match(resolucaoIlegivel.error, /JSON|fim|token|parse/i);

  const invalido = tmpdir();
  const caminhoInvalido = criaProjeto(invalido, 'app', estadoValido({ phase: null }));
  const resolucaoInvalida = resolveProjeto(invalido);
  assert.strictEqual(resolucaoInvalida.status, 'invalid');
  assert.strictEqual(resolucaoInvalida.statePath, caminhoInvalido);
  assert.match(resolucaoInvalida.errors.join(' '), /phase/);

  const valido = tmpdir();
  const caminhoValido = criaProjeto(valido, 'app', estadoValido({ phase: 'EXECUTE' }));
  const resolucaoValida = resolveProjeto(valido);
  assert.strictEqual(resolucaoValida.status, 'valid');
  assert.strictEqual(resolucaoValida.statePath, caminhoValido);
  assert.strictEqual(resolucaoValida.state.phase, 'EXECUTE');

  const ambiguo = tmpdir();
  criaProjeto(ambiguo, 'a', estadoValido({ project: 'a' }));
  criaProjeto(ambiguo, 'b', estadoValido({ project: 'b' }));
  assert.strictEqual(resolveProjeto(ambiguo).status, 'ambiguous');
});

test('resolveProjeto classifica JSON válido não objeto como estado inválido', () => {
  for (const valor of [null, [], 'texto']) {
    const raiz = tmpdir();
    const caminho = criaProjeto(raiz, 'app', estadoValido());
    fs.writeFileSync(caminho, JSON.stringify(valor));

    const resolucao = resolveProjeto(raiz);

    assert.strictEqual(resolucao.status, 'invalid', JSON.stringify(valor));
    assert.strictEqual(resolucao.statePath, caminho);
    assert.deepStrictEqual(resolucao.state, valor);
    assert.match(resolucao.errors.join(' '), /objeto JSON/);
    assert.strictEqual(resolucao.error, null);
  }
});

test('resolveEnxuto usa a tabela por fase quando o valor é auto', () => {
  assert.strictEqual(resolveEnxuto({ phase: 'BRAINSTORM', enxuto: 'auto' }), 'off');
  assert.strictEqual(resolveEnxuto({ phase: 'SPEC', enxuto: 'auto' }), 'leve');
  assert.strictEqual(resolveEnxuto({ phase: 'PLAN', enxuto: 'auto' }), 'leve');
  assert.strictEqual(resolveEnxuto({ phase: 'EXECUTE', enxuto: 'auto' }), 'pleno');
  assert.strictEqual(resolveEnxuto({ phase: 'REVIEW', enxuto: 'auto' }), 'pleno');
  assert.strictEqual(resolveEnxuto({ phase: 'FIX', enxuto: 'auto' }), 'pleno');
});

test('resolveEnxuto respeita a sobreposição explícita', () => {
  // Critério 13 do spec: pleno durante BRAINSTORM sobrepõe o padrão da fase.
  assert.strictEqual(resolveEnxuto({ phase: 'BRAINSTORM', enxuto: 'pleno' }), 'pleno');
  assert.strictEqual(resolveEnxuto({ phase: 'EXECUTE', enxuto: 'off' }), 'off');
  assert.strictEqual(resolveEnxuto({ phase: 'EXECUTE', enxuto: 'LEVE' }), 'leve');
});

test('resolveEnxuto não quebra com estado ausente ou fase desconhecida', () => {
  assert.strictEqual(resolveEnxuto(null), 'off');
  assert.strictEqual(resolveEnxuto({}), 'off');
  assert.strictEqual(resolveEnxuto({ phase: 'INVENTADA', enxuto: 'auto' }), 'off');
  assert.strictEqual(resolveEnxuto({ phase: 'EXECUTE', enxuto: 'inventado' }), 'pleno');
});

test('isOff e setOff usam o flag em disco', () => {
  const home = tmpdir();
  const anterior = process.env.STILO_HOME;
  process.env.STILO_HOME = path.join(home, '.stilo');
  try {
    assert.strictEqual(isOff(), false);
    assert.strictEqual(setOff(true), true);
    assert.strictEqual(isOff(), true);
    assert.strictEqual(setOff(false), true);
    assert.strictEqual(isOff(), false);
    // Desligar duas vezes seguidas não é erro.
    assert.strictEqual(setOff(false), true);
  } finally {
    if (anterior === undefined) delete process.env.STILO_HOME;
    else process.env.STILO_HOME = anterior;
  }
});
