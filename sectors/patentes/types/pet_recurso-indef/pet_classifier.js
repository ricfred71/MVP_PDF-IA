/**
 * sectors/marcas/types/recurso-indef/classifier.js
 * 
 * Classificador específico para: Recurso contra Indeferimento de Pedido de Registro de Marca
 */

export function identificarRecursoIndef(texto) {
  // Padrões que indicam um Recurso contra Indeferimento
  const padroes = [
    /recurso\s+contra\s+indeferimento/i,
    /recurs[os]?\s+administrativo/i,
    /recurso\s+ao\s+presidente/i,
    /impugna[çc][ã a]o\s+ao\s+indeferimento/i,
    /art\.\s*124\s+inc\.\s+xix/i,
    /despacho\s+de\s+indeferimento/i
  ];
  
  let confianca = 0;
  let matchCount = 0;
  
  for (const padrao of padroes) {
    if (padrao.test(texto)) {
      matchCount++;
    }
  }
  
  // Calcula confiança baseada no número de padrões encontrados
  confianca = Math.min(0.95, (matchCount / padroes.length) * 1.2);
  
  return {
    isMatch: matchCount > 0,
    descricao: 'Recurso contra Indeferimento de Pedido de Registro de Marca',
    tipoId: 'recursoIndeferimentoPedidoRegistro',
    confidence: confianca,
    patternsMatched: matchCount
  };
}
