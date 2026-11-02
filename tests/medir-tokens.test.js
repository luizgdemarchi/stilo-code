const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'medir-tokens.js');
const FIXTURES = path.join(__dirname, 'fixtures', 'transcripts');
const { medir } = require(SCRIPT);

function rodar(...args) {
  const resultado = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { codigo: resultado.status, stdout: resultado.stdout, stderr: resultado.stderr };
}

function porNome(resultado) {
  return Object.fromEntries(resultado.ferramentas.map(({ nome, caracteres }) => [nome, caracteres]));
}

test('Claude Code: deduplica por message.id e mede ferramentas, com mcp agrupado', () => {
  const resultado = medir(path.join(FIXTURES, 'claude.jsonl'));
  assert.strictEqual(resultado.chamadas, 2);
  assert.deepStrictEqual(resultado.tokens, { entrada: 150, escritaCache: 1000, leituraCache: 1000, saida: 50 });
  assert.deepStrictEqual(porNome(resultado), { mcp: 30, Bash: 10 });
  assert.strictEqual(resultado.ferramentas[0].percentual, 75);
  assert.strictEqual(resultado.linhasInvalidas, 1);
  assert.strictEqual(resultado.linhasDesconhecidas, 1);
});

test('formato novo: arquivo com linhas válidas e nenhuma chamada reconhecida é sinalizado', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'medir-formato-'));
  const arquivo = path.join(dir, 'novo.jsonl');
  fs.writeFileSync(arquivo, [
    JSON.stringify({ type: 'response', message: { id: 'm1', usage: { input_tokens: 100, output_tokens: 20 } } }),
    JSON.stringify({ type: 'assistant_v2', message: { id: 'm2', usage: { input_tokens: 50, output_tokens: 5 } } }),
  ].join('\n'));
  try {
    const resultado = medir(arquivo);
    assert.strictEqual(resultado.chamadas, 0);
    assert.strictEqual(resultado.arquivosSemChamadas, 1);
    assert.match(rodar(arquivo).stdout, /sem chamada reconhecida: 1/);
    assert.strictEqual(medir(path.join(FIXTURES, 'claude.jsonl')).arquivosSemChamadas, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Codex: usa o último total acumulado e separa o cache da entrada', () => {
  const resultado = medir(path.join(FIXTURES, 'codex.jsonl'));
  assert.strictEqual(resultado.chamadas, 2);
  assert.deepStrictEqual(resultado.tokens, { entrada: 700, escritaCache: 0, leituraCache: 1800, saida: 100 });
  assert.deepStrictEqual(porNome(resultado), { shell: 20, apply_patch: 5 });
  assert.strictEqual(resultado.linhasInvalidas, 0);
});

test('diretório soma os arquivos e --json gera JSON válido com médias por chamada', () => {
  const { codigo, stdout } = rodar(FIXTURES, '--json');
  assert.strictEqual(codigo, 0);
  const resultado = JSON.parse(stdout);
  assert.strictEqual(resultado.arquivos, 2);
  assert.strictEqual(resultado.chamadas, 4);
  assert.deepStrictEqual(resultado.tokens, { entrada: 850, escritaCache: 1000, leituraCache: 2800, saida: 150 });
  assert.strictEqual(resultado.porChamada.entrada, 212.5);
});

test('caminho inexistente sai com código 2 citando o caminho', () => {
  const ausente = path.join(FIXTURES, 'nao-existe.jsonl');
  const { codigo, stderr } = rodar(ausente);
  assert.strictEqual(codigo, 2);
  assert.ok(stderr.includes(`medir-tokens: caminho não encontrado: ${ausente}`));
});
