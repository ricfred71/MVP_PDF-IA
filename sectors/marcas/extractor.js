/**
 * sectors/marcas/extractor.js
 * 
 * Extrator específico do setor de Marcas.
 * Movido do core para facilitar o split futuro.
 * 
 * Agora integrado com o sistema de tipos específicos:
 * - Para tipos com extractor customizado, delega para o tipo
 * - Para tipos genéricos, usa a lógica genérica deste arquivo
 */

import { getExtractorForTipoSync } from './types/index.js';
import { sanitizeFilename } from './types/base_extractor_utils.js';

class DataExtractor {
  
  /**
   * Extrai dados de uma PETIÇÃO e monta o objeto para storage
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - Objeto de classificação {categoriaId, tipoId, confianca}
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} - Objeto estruturado para salvar no storage
   */
  extrairDadosPeticao(textoCompleto, classificacao, urlPdf = '', options = {}) {
    console.log('[DataExtractor] Extraindo dados de PETIÇÃO...');
    
    // ========================================
    // VERIFICAR SE EXISTE EXTRACTOR ESPECÍFICO PARA ESTE TIPO
    // ========================================
    // Validar tipoId antes de buscar extractor específico
    if (!classificacao || !classificacao.tipoId) {
      console.warn('[DataExtractor] ⚠️ Classificação sem tipoId válido. Usando fallback genérico.', classificacao);
      // Continue com extração genérica abaixo
    } else {
      const extractorEspecifico = getExtractorForTipoSync(classificacao.tipoId, this);
    
      if (extractorEspecifico) {
        console.log(`[DataExtractor] ✅ Usando extractor específico para tipo: ${classificacao.tipoId}`);
        return extractorEspecifico.extract(textoCompleto, classificacao, urlPdf, options);
      }
    
      console.log(`[DataExtractor] ℹ️ Tipo sem extractor específico: ${classificacao.tipoId}. Usando fallback genérico.`);
    }
    
    // ========================================
    // FALLBACK: EXTRAÇÃO GENÉRICA
    // ========================================
    // Extrai primeira página (primeiros ~2000 caracteres geralmente contém todos os dados principais)
    const textoPaginaUm = textoCompleto.substring(0, 2000);
    
    let numeroProcesso = null;
    const matchNumeroProcesso = textoPaginaUm.match(/N[úu]mero\s+do\s+Processo\s*:\s*(\d{9})\b/);
    if (matchNumeroProcesso) {
      numeroProcesso = matchNumeroProcesso[1];
    } else {
      const matchPrimeiro = textoPaginaUm.match(/\b(\d{9})\b/);
      numeroProcesso = matchPrimeiro ? matchPrimeiro[1] : null;
    }
    
    // Monta objeto final para storage (mínimo de metadados)
    const storageKey = `peticao_${numeroProcesso || 'sem_processo'}_${sanitizeFilename(classificacao.tipoId || 'peticao')}`;
    
    const objetoPeticao = {
      // Metadados essenciais
      categoria: 'peticao',
      tipo: classificacao.tipoId || '',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      setor: 'marcas',
      
      // Texto completo e metadados mínimos
      textoPeticao: textoCompleto,
      processoRelacionado: numeroProcesso,
      dataProcessamento: new Date().toISOString()
    };
    
    console.log('[DataExtractor] ✅ Dados da petição extraídos:', {
      storageKey,
      numeroProcesso,
      tipo: classificacao.tipoId
    });
    
    return {
      storageKey,
      dados: objetoPeticao
    };
  }
  
  /**
   * Extrai dados de um DOCUMENTO OFICIAL e monta o objeto para storage
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - Objeto de classificação {categoriaId, tipoId, confianca}
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} - Objeto estruturado para salvar no storage
   */
  extrairDadosDocumentoOficial(textoCompleto, classificacao, urlPdf = '', options = {}) {
    console.log('[DataExtractor] Extraindo dados de DOCUMENTO OFICIAL...');

    // ========================================
    // VERIFICAR SE EXISTE EXTRACTOR ESPECÍFICO PARA ESTE TIPO
    // ========================================
    // Validar tipoId antes de buscar extractor específico
    if (!classificacao || !classificacao.tipoId) {
      console.warn('[DataExtractor] ⚠️ Classificação sem tipoId válido. Usando fallback genérico.', classificacao);
      // Continue com extração genérica abaixo
    } else {
      const extractorEspecifico = getExtractorForTipoSync(classificacao.tipoId, this);

      if (extractorEspecifico) {
        console.log(`[DataExtractor] ✅ Usando extractor específico para tipo: ${classificacao.tipoId}`);
        return extractorEspecifico.extract(textoCompleto, classificacao, urlPdf, options);
      }

      console.log(`[DataExtractor] ℹ️ Tipo sem extractor específico: ${classificacao.tipoId}. Usando fallback genérico.`);
    }
    
    let numeroProcesso = null;
    const matchProcesso = textoCompleto.match(/Processo\s+(\d{9})/i);
    if (matchProcesso) {
      numeroProcesso = matchProcesso[1];
    } else {
      const matchPrimeiro = textoCompleto.match(/\b(\d{9})\b/);
      numeroProcesso = matchPrimeiro ? matchPrimeiro[1] : null;
    }
    
    // Monta objeto final para storage (mínimo de metadados)
    const tipoSimplificado = sanitizeFilename(classificacao.tipoId || 'documento');
    const storageKey = `doc_oficial_${numeroProcesso || 'sem_processo'}_${tipoSimplificado}`;
    
    const objetoDocOficial = {
      // Metadados essenciais
      categoria: 'documento_oficial',
      tipo: classificacao.tipoId || '',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      setor: 'marcas',
      
      // Texto completo e metadados mínimos
      textoPeticao: textoCompleto,
      dataProcessamento: new Date().toISOString()
    };
    
    console.log('[DataExtractor] ✅ Dados do documento oficial extraídos:', {
      storageKey,
      numeroProcesso,
      tipo: classificacao.tipoId
    });
    
    return {
      storageKey,
      dados: objetoDocOficial
    };
  }
  
  // ============================================================
  // UTILITÁRIOS
  // ============================================================
}

// Exporta como singleton
export default new DataExtractor();
