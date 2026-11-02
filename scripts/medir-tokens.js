#!/usr/bin/env node

// Mede o consumo de tokens de transcripts do Claude Code e de sessões do Codex, para comparar
// o custo de uma mesma tarefa antes e depois de mudar as instruções.

const fs = require('node:fs');
const path = require('node:path');

class CaminhoInvalido extends Error {}

function arquivosJsonl(caminho) {
  let stat;
  try {
    stat = fs.statSync(caminho);
  } catch (error) {
    throw new CaminhoInvalido(`caminho não encontrado: ${caminho}`);
  }
  if (!stat.isDirectory()) return [caminho];
  return fs.readdirSync(caminho, { withFileTypes: true }).flatMap((entrada) => {
    const filho = path.join(caminho, entrada.name);
    if (entrada.isDirectory()) return arquivosJsonl(filho);
    return entrada.name.endsWith('.jsonl') ? [filho] : [];
  }).sort();
}

function tamanho(valor) {
  if (typeof valor === 'string') return valor.length;
  if (Array.isArray(valor)) return valor.reduce((soma, item) => soma + tamanho(item), 0);
  if (valor && typeof valor.text === 'string') return valor.text.length;
  return 0;
}

function nomeDaFerramenta(nome) {
  if (typeof nome !== 'string') return 'desconhecida';
  return nome.startsWith('mcp__') ? 'mcp' : nome;
}

function numero(valor) {
  return Number.isFinite(valor) ? valor : 0;
}

function lerClaude(registro, contexto, total) {
  const mensagem = registro.message;
  if (!mensagem || typeof mensagem !== 'object') return;
  const blocos = Array.isArray(mensagem.content) ? mensagem.content : [];
  if (registro.type === 'assistant') {
    for (const bloco of blocos) {
      if (bloco && bloco.type === 'tool_use') contexto.nomes.set(bloco.id, bloco.name);
    }
    // O transcript repete o mesmo uso em uma linha por bloco da resposta.
    if (!mensagem.usage || (mensagem.id && contexto.vistos.has(mensagem.id))) return;
    if (mensagem.id) contexto.vistos.add(mensagem.id);
    total.chamadas += 1;
    total.tokens.entrada += numero(mensagem.usage.input_tokens);
    total.tokens.escritaCache += numero(mensagem.usage.cache_creation_input_tokens);
    total.tokens.leituraCache += numero(mensagem.usage.cache_read_input_tokens);
    total.tokens.saida += numero(mensagem.usage.output_tokens);
  } else if (registro.type === 'user') {
    for (const bloco of blocos) {
      if (bloco && bloco.type === 'tool_result') contexto.saidas.push([bloco.tool_use_id, tamanho(bloco.content)]);
    }
  }
}

function lerCodex(registro, contexto) {
  const carga = registro.payload;
  if (registro.type === 'event_msg' && carga.type === 'token_count' && carga.info) {
    contexto.chamadasCodex += 1;
    contexto.usoCodex = carga.info.total_token_usage || contexto.usoCodex;
  } else if (registro.type === 'response_item') {
    if (carga.type === 'function_call' || carga.type === 'custom_tool_call') contexto.nomes.set(carga.call_id, carga.name);
    if (carga.type === 'function_call_output' || carga.type === 'custom_tool_call_output') {
      contexto.saidas.push([carga.call_id, tamanho(carga.output)]);
    }
  }
}

function medirArquivo(arquivo, total) {
  let texto;
  try {
    texto = fs.readFileSync(arquivo, 'utf8');
  } catch (error) {
    throw new CaminhoInvalido(`caminho ilegível: ${arquivo}`);
  }
  const contexto = { vistos: new Set(), nomes: new Map(), saidas: [], chamadasCodex: 0, usoCodex: null };
  const chamadasAntes = total.chamadas;
  let validas = 0;
  for (const linha of texto.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    let registro;
    try {
      registro = JSON.parse(linha);
    } catch (error) {
      total.linhasInvalidas += 1;
      continue;
    }
    validas += 1;
    if (!registro || typeof registro !== 'object' || typeof registro.type !== 'string') {
      total.linhasDesconhecidas += 1;
    } else if (registro.payload && typeof registro.payload === 'object') {
      lerCodex(registro, contexto);
    } else {
      lerClaude(registro, contexto, total);
    }
  }

  // O Codex grava o uso acumulado da sessão: vale só o último total do arquivo. Lá a entrada
  // inclui o cache; aqui ela é separada para ficar comparável à do Claude Code.
  if (contexto.usoCodex) {
    const uso = contexto.usoCodex;
    const leitura = numero(uso.cached_input_tokens);
    const escrita = numero(uso.cache_write_input_tokens);
    total.chamadas += contexto.chamadasCodex;
    total.tokens.entrada += Math.max(0, numero(uso.input_tokens) - leitura - escrita);
    total.tokens.escritaCache += escrita;
    total.tokens.leituraCache += leitura;
    total.tokens.saida += numero(uso.output_tokens);
  }

  // Os hosts acrescentam tipos de linha com frequência, e uma lista de tipos conhecidos
  // viraria ruído. O sinal de formato novo é o arquivo legível sem nenhuma chamada.
  if (validas > 0 && total.chamadas === chamadasAntes) total.arquivosSemChamadas += 1;

  for (const [id, caracteres] of contexto.saidas) {
    const nome = nomeDaFerramenta(contexto.nomes.get(id));
    const item = total.ferramentas[nome] || (total.ferramentas[nome] = { chamadas: 0, caracteres: 0 });
    item.chamadas += 1;
    item.caracteres += caracteres;
  }
}

function medir(caminho) {
  const total = {
    arquivos: 0,
    chamadas: 0,
    tokens: { entrada: 0, escritaCache: 0, leituraCache: 0, saida: 0 },
    ferramentas: {},
    linhasInvalidas: 0,
    linhasDesconhecidas: 0,
    arquivosSemChamadas: 0,
  };
  for (const arquivo of arquivosJsonl(caminho)) {
    medirArquivo(arquivo, total);
    total.arquivos += 1;
  }

  const porChamada = {};
  for (const [chave, valor] of Object.entries(total.tokens)) {
    porChamada[chave] = total.chamadas ? Math.round((valor / total.chamadas) * 10) / 10 : 0;
  }
  const caracteres = Object.values(total.ferramentas).reduce((soma, item) => soma + item.caracteres, 0);
  const ferramentas = Object.entries(total.ferramentas)
    .map(([nome, item]) => ({
      nome,
      chamadas: item.chamadas,
      caracteres: item.caracteres,
      percentual: caracteres ? Math.round((item.caracteres / caracteres) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.caracteres - a.caracteres || a.nome.localeCompare(b.nome));
  return { ...total, porChamada, ferramentas };
}

function formatar(resultado) {
  const rotulos = { entrada: 'entrada', escritaCache: 'escrita de cache', leituraCache: 'leitura de cache', saida: 'saída' };
  const linhas = [
    `Arquivos: ${resultado.arquivos}`,
    `Chamadas ao modelo: ${resultado.chamadas}`,
    '',
    `${'Tokens'.padEnd(18)}${'total'.padStart(14)}${'por chamada'.padStart(14)}`,
  ];
  for (const [chave, rotulo] of Object.entries(rotulos)) {
    linhas.push(`${rotulo.padEnd(18)}${String(resultado.tokens[chave]).padStart(14)}${String(resultado.porChamada[chave]).padStart(14)}`);
  }
  linhas.push('', 'Saída de ferramentas (caracteres):');
  if (!resultado.ferramentas.length) linhas.push('  nenhuma');
  for (const item of resultado.ferramentas) {
    linhas.push(`  ${item.nome.padEnd(24)}${String(item.caracteres).padStart(12)}${`${item.percentual}%`.padStart(9)}  (${item.chamadas} chamada(s))`);
  }
  linhas.push(
    '',
    `Linhas inválidas: ${resultado.linhasInvalidas} · linhas de tipo desconhecido: ${resultado.linhasDesconhecidas}` +
      ` · arquivos sem chamada reconhecida: ${resultado.arquivosSemChamadas}`
  );
  if (resultado.arquivosSemChamadas) {
    linhas.push('Aviso: arquivo legível sem nenhuma chamada reconhecida; o formato do transcript pode ter mudado.');
  }
  return linhas.join('\n');
}

function main(argv = process.argv.slice(2)) {
  const json = argv.includes('--json');
  const caminhos = argv.filter((arg) => arg !== '--json');
  if (caminhos.length !== 1 || caminhos[0].startsWith('-')) {
    console.error('Uso: node scripts/medir-tokens.js <transcript.jsonl|pasta> [--json]');
    return 2;
  }
  try {
    const resultado = medir(caminhos[0]);
    console.log(json ? JSON.stringify(resultado, null, 2) : formatar(resultado));
    return 0;
  } catch (error) {
    if (!(error instanceof CaminhoInvalido)) throw error;
    console.error(`medir-tokens: ${error.message}`);
    return 2;
  }
}

if (require.main === module) process.exitCode = main();

module.exports = { medir, main };
