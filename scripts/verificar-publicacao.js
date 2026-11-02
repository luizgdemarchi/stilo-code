#!/usr/bin/env node

// Os hosts guardam o plugin em cache pela versão: conteúdo novo com versão repetida não
// chega a quem já instalou. Este script compara o conteúdo distribuído com o registrado.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DISTRIBUIDOS = [
  'AGENTS.md', 'THIRD_PARTY_NOTICES.md', 'LICENSE', 'licenses', 'modules', 'hooks', 'scripts',
  '.claude-plugin', '.codex-plugin', 'package.json',
];
const MANIFESTOS = ['package.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json'];
const REGISTRO = 'publicacao.json';

class ErroDeUso extends Error {}

function ler(raiz, relativo) {
  try {
    return fs.readFileSync(path.join(raiz, relativo), 'utf8');
  } catch (error) {
    throw new ErroDeUso(`não foi possível ler ${relativo}: ${error.message}`);
  }
}

function listar(raiz, relativo) {
  const absoluto = path.join(raiz, relativo);
  if (!fs.existsSync(absoluto)) return [];
  if (!fs.statSync(absoluto).isDirectory()) return [relativo];
  return fs.readdirSync(absoluto).flatMap((nome) => listar(raiz, `${relativo}/${nome}`));
}

function calcularHash(raiz) {
  const hash = crypto.createHash('sha256');
  const arquivos = DISTRIBUIDOS.flatMap((item) => listar(raiz, item)).sort();
  for (const relativo of arquivos) {
    let conteudo = ler(raiz, relativo).replace(/\r\n/g, '\n');
    // A versão fica fora do hash: só ela muda entre publicações de conteúdo idêntico.
    if (MANIFESTOS.includes(relativo)) conteudo = conteudo.replace(/("version"\s*:\s*)"[^"]*"/, '$1""');
    hash.update(`${relativo}\0${conteudo}\0`);
  }
  return hash.digest('hex');
}

function versoes(raiz) {
  return MANIFESTOS.map((relativo) => {
    try {
      return { relativo, version: JSON.parse(ler(raiz, relativo)).version };
    } catch (error) {
      if (error instanceof ErroDeUso) throw error;
      throw new ErroDeUso(`${relativo} não é JSON válido: ${error.message}`);
    }
  });
}

function versaoUnica(raiz) {
  const lista = versoes(raiz);
  if (new Set(lista.map(({ version }) => version)).size === 1) return { version: lista[0].version };
  return { erro: `versões divergentes: ${lista.map(({ relativo, version }) => `${relativo} ${version}`).join(', ')}` };
}

function lerRegistro(raiz) {
  if (!fs.existsSync(path.join(raiz, REGISTRO))) return null;
  try {
    return JSON.parse(ler(raiz, REGISTRO));
  } catch (error) {
    if (error instanceof ErroDeUso) throw error;
    throw new ErroDeUso(`${REGISTRO} não é JSON válido: ${error.message}`);
  }
}

function verificar(raiz) {
  const { version, erro } = versaoUnica(raiz);
  if (erro) return { ok: false, mensagem: erro };
  const sha256 = calcularHash(raiz);
  const registro = lerRegistro(raiz);
  if (!registro) return { ok: false, mensagem: `${REGISTRO} ausente: registre a publicação com --registrar` };
  if (registro.version === version && registro.sha256 !== sha256) {
    return { ok: false, mensagem: `conteúdo distribuído mudou sem versão nova (${version})` };
  }
  if (registro.version !== version) {
    return { ok: false, mensagem: `versão ${version} sem registro (registrada: ${registro.version}): registre a publicação` };
  }
  return { ok: true, mensagem: `publicação ${version} confere (sha256 ${sha256.slice(0, 12)})` };
}

function registrar(raiz) {
  const { version, erro } = versaoUnica(raiz);
  if (erro) return { ok: false, mensagem: erro };
  const sha256 = calcularHash(raiz);
  const registro = lerRegistro(raiz);
  if (registro && registro.version === version && registro.sha256 !== sha256) {
    return { ok: false, mensagem: `conteúdo distribuído mudou sem versão nova (${version}): suba a versão antes de registrar` };
  }
  if (!registro || registro.sha256 !== sha256 || registro.version !== version) {
    const novo = { version, sha256, registrado: new Date().toISOString().replace(/\.\d+Z$/, 'Z') };
    fs.writeFileSync(path.join(raiz, REGISTRO), `${JSON.stringify(novo, null, 2)}\n`);
  }
  return { ok: true, mensagem: `publicação ${version} registrada (sha256 ${sha256.slice(0, 12)})` };
}

function main(argv = process.argv.slice(2)) {
  const registrando = argv.includes('--registrar');
  const resto = argv.filter((arg) => arg !== '--registrar');
  if (resto.length > 1 || resto.some((arg) => arg.startsWith('-'))) {
    console.error('Uso: node scripts/verificar-publicacao.js [--registrar] [raiz]');
    return 2;
  }
  const raiz = path.resolve(resto[0] || path.join(__dirname, '..'));
  try {
    const resultado = registrando ? registrar(raiz) : verificar(raiz);
    (resultado.ok ? console.log : console.error)(`verificar-publicacao: ${resultado.mensagem}`);
    return resultado.ok ? 0 : 1;
  } catch (error) {
    if (!(error instanceof ErroDeUso)) throw error;
    console.error(`verificar-publicacao: ${error.message}`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { calcularHash, verificar, registrar, main };
