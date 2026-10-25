// Wrapper confiável do parent para os validadores da skill no Windows.
// Os CLIs recusam qualquer entrada sem O_NOFOLLOW/O_NONBLOCK, que o Node não expõe no
// Windows. As entradas aqui são arquivos escritos pelo próprio parent dentro do diretório
// da rodada; o wrapper exige arquivo regular (lstat, sem symlink), dentro do limite de
// 5 MiB e UTF-8 válido, e chama a mesma validação semântica exportada pelos validadores.
// Uso: node parent-validate.cjs <skill-dir> ledger|findings <arquivo>
const fs = require('fs');
const path = require('path');

const [skillDir, tipo, arquivo] = process.argv.slice(2);
const MAX = 5 * 1024 * 1024;

function lerSeguro(file) {
  const st = fs.lstatSync(file);
  if (st.isSymbolicLink() || !st.isFile()) throw new Error('entrada precisa ser arquivo regular, sem symlink');
  if (st.size > MAX) throw new Error('entrada acima de 5 MiB');
  const buf = fs.readFileSync(file);
  return new TextDecoder('utf-8', { fatal: true }).decode(buf);
}

const texto = lerSeguro(arquivo);
let erros;
if (tipo === 'ledger') {
  const v = require(path.join(skillDir, 'validate-coverage-ledger.cjs'));
  v.preflightJsonText(texto);
  const ledger = JSON.parse(texto);
  erros = v.validateDocument(ledger);
  if (!erros.length) console.log(`PASS: ${ledger.length} coverage units valid`);
} else if (tipo === 'findings') {
  const v = require(path.join(skillDir, 'validate-findings.cjs'));
  const schema = JSON.parse(fs.readFileSync(path.join(skillDir, 'report-schema.json'), 'utf8'));
  const findings = JSON.parse(texto);
  erros = v.validateDocument(findings, schema);
  if (!erros.length) console.log(`PASS: ${findings.length} findings valid`);
} else {
  console.error('tipo: ledger|findings');
  process.exit(2);
}
for (const e of erros) console.error('ERROR:', e);
if (erros.length) {
  console.error(`FAIL: ${erros.length} validation error(s)`);
  process.exit(1);
}
