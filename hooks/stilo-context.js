// Seleção determinística e local do contexto automático.

const SEPARADOR = '\n\n---\n\n';

function blocos(texto) {
  return String(texto || '')
    .split(/\n{2}---\n{2}|\n(?=#{1,2}\s)/)
    .map((texto, indice) => ({ texto, indice }))
    .filter((bloco) => bloco.texto.trim());
}

function selectContextBlocks(texto, options = {}) {
  const fonte = String(texto || '');
  const budget = Number.isInteger(options.budget) ? options.budget : 12000;
  if (budget < 0) return null;
  if (fonte.length <= budget) return fonte;

  const itens = blocos(fonte);
  const protegidos = Array.isArray(options.protected) ? options.protected : [];
  const obrigatorios = new Set();
  for (const marcador of protegidos) {
    const indice = itens.findIndex(({ texto: bloco }) => {
      if (marcador instanceof RegExp) {
        marcador.lastIndex = 0;
        return marcador.test(bloco);
      }
      return bloco.includes(String(marcador));
    });
    if (indice < 0) return null;
    obrigatorios.add(indice);
  }

  const indices = [...obrigatorios].sort((a, b) => a - b);
  const tamanho = (lista) => lista.map((i) => itens[i].texto).join(SEPARADOR).length;
  if (tamanho(indices) > budget) return null;

  for (const item of itens) {
    if (obrigatorios.has(item.indice)) continue;
    const tentativa = [...indices, item.indice].sort((a, b) => a - b);
    if (tamanho(tentativa) <= budget) indices.push(item.indice);
  }
  if (!indices.length) return null;
  return indices.sort((a, b) => a - b).map((i) => itens[i].texto).join(SEPARADOR);
}

module.exports = { SEPARADOR, selectContextBlocks };
