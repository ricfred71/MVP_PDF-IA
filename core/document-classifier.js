/**
 * core/document-classifier.js
 * 
 * Orquestrador de Classificação de Documentos
 * Roteia a classificação para o classifier específico do setor (Marcas ou Patentes)
 * 
 * ARQUITETURA:
 * - DocumentClassifier: Orquestrador (core)
 * - MarcasClassifier: Lógica específica do setor Marcas
 * - PatentesClassifier: Lógica específica do setor Patentes
 * 
 * @version 2.0.0
 * @updated 28/01/2026
 */

import marcasClassifier from '../sectors/marcas/classifier.js';
import patentesClassifier from '../sectors/patentes/classifier.js';

/**
 * Classe DocumentClassifier (Orquestrador)
 * Roteia a classificação para o classifier correto baseado no setor
 */
export class DocumentClassifier {
  /**
   * Classifica um documento baseado no setor
   * 
   * @param {string} texto - Texto completo do documento
   * @param {string} setor - Setor ('marcas' ou 'patentes')
   * @returns {Object} { categoriaId, tipoId, subtipoId, confianca, tipoOriginal, setor }
   */
  classificar(texto, setor = 'marcas') {
    // VALIDAÇÃO: Verifica se o texto é válido (não nulo/vazio e string)
    if (!texto || typeof texto !== 'string') {
      throw new Error('[DocumentClassifier] Texto inválido para classificação');
    }
    
    // LOG: Informa início da classificação com setor
    console.log(`[DocumentClassifier] 🎯 Orquestrando classificação para setor: ${setor}`);
    console.log(`[DocumentClassifier] Tamanho do documento: ${texto.length} caracteres`);
    
    // ROTEAMENTO: Seleciona o classifier correto baseado no setor
    let classificador;
    if (setor === 'patentes') {
      classificador = patentesClassifier;
      console.log('[DocumentClassifier] ➜ Usando PatentesClassifier');
    } else {
      classificador = marcasClassifier;
      console.log('[DocumentClassifier] ➜ Usando MarcasClassifier');
    }
    
    // EXECUÇÃO: Delega a classificação ao classifier específico do setor
    const resultado = classificador.classificar(texto);
    
    // LOG: Resumo do resultado
    console.log(
      `[DocumentClassifier] ✅ Classificação concluída: ${resultado.categoriaId} (${resultado.setor}) - ` +
      `Confiança: ${(resultado.confianca * 100).toFixed(0)}%`
    );
    
    // RETORNO: Resultado da classificação com setor incluso
    return resultado;
  }
}

// Exporta instância única (singleton)
export default new DocumentClassifier();

