/**
 * sectors/patentes/types/doc_recurso-indef--naoProv/doc_classifier.js
 * 
 * Classificador para Documento Oficial: Recurso contra Indeferimento - Não Provido (Patentes)
 */

/**
 * Identifica se o documento é um despacho de Recurso Não Provido
 * @param {string} textoCompleto - Texto completo do PDF
 * @returns {Object} { isMatch, tipoId, descricao, confidence, patternsMatched }
 */
export function identificarDocRecursoIndefNaoProv(textoCompleto) {
  const texto = textoCompleto.toLowerCase();
  //ajustar conforme casos reais de despqachos
  const patterns = [
    /recurso\s+n[ãa]o\s+provido/i,
    /recurso\s+administrativo.*?n[ãa]o\s+provido/i,
    /n[ãa]o\s+se\s+prov[êe]\s+o\s+recurso/i,
    /mantida\s+a\s+decis[ãa]o\s+de\s+indeferimento/i,
    /recurso.*?indeferido/i,
    /decis[ãa]o.*?mantida/i
  ];
  
  let patternsMatched = 0;
  for (const pattern of patterns) {
    if (pattern.test(texto)) {
      patternsMatched++;
    }
  }
  
  // Confiança baseada em quantos padrões foram encontrados
  const confidence = Math.min(100, (patternsMatched / patterns.length) * 100 + 20);
  const isMatch = patternsMatched >= 1;
  
  return {
    isMatch,
    tipoId: 'recursoIndeferimentoNaoProvido',
    descricao: 'Recurso não provido. Decisão mantida',
    confidence: Math.round(confidence),
    patternsMatched
  };
}
