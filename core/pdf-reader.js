/**
 * core/pdf-reader.js
 * 
 * Leitor de PDFs para extensão standalone
 * Migrado e adaptado de: content/ipas/pdf_reader.js
 * 
 * MUDANÇAS:
 * - Usa File API ao invés de fetch/URL
 * - Remove dependências do background script
 * - Classe ao invés de função exportada
 * - Mantém proteções de memória do original
 * - Usa PdfTextFormatter para preservar quebras de linha (v2.0)
 * 
 * @version 2.0.0
 * @migrated 26/01/2026
 */

import { PdfTextFormatter } from '../utils/pdf-text-formatter.js';

// Cache do PDF.js
let pdfjsLib;

async function loadPdfjs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import(chrome.runtime.getURL("lib/pdfjs/pdf.mjs"));
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
        "lib/pdfjs/pdf.worker.mjs"
      );
      console.log("[PdfReader] PDF.js carregado com sucesso");
    } catch (error) {
      console.error("[PdfReader] Erro ao carregar PDF.js:", error);
      throw new Error("Falha ao carregar biblioteca PDF.js");
    }
  }
  return pdfjsLib;
}

/**
 * Classe PdfReader - Extrai texto de arquivos PDF
 */
export class PdfReader {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 100;
    this.maxTextSizeMB = options.maxTextSizeMB || 10;
  }
  
  /**
   * Carrega e extrai texto de um arquivo PDF
   * 
   * @param {File} file - Objeto File do input
   * @returns {Promise<Object>} { texto, numeroPaginas, metadata }
   */
  async loadFromFile(file) {
    if (!file || !(file instanceof File)) {
      throw new Error("[PdfReader] Arquivo inválido");
    }
    
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      throw new Error("[PdfReader] Arquivo não é um PDF");
    }
    
    console.log(`[PdfReader] Processando: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    try {
      this._checkMemory('início');
      
      // 1. Carregar PDF.js
      const pdfjs = await loadPdfjs();
      
      // 2. Ler bytes do arquivo
      const arrayBuffer = await file.arrayBuffer();
      
      this._checkMemory('após leitura do arquivo');
      
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("[PdfReader] Arquivo vazio");
      }
      
      // 3. Validar que é realmente PDF
      const dataUA = new Uint8Array(arrayBuffer);
      if (!this._looksLikePdf(dataUA)) {
        throw new Error("[PdfReader] Arquivo não parece ser um PDF válido");
      }
      
      // 4. Carregar documento PDF
      const pdf = await pdfjs.getDocument({ 
        data: dataUA, 
        isEvalSupported: false 
      }).promise;
      
      console.log(`[PdfReader] PDF carregado: ${pdf.numPages} páginas`);
      
      // 5. Proteção: Limitar páginas
      if (pdf.numPages > this.maxPages) {
        console.warn(
          `[PdfReader] ⚠️ PDF tem ${pdf.numPages} páginas. ` +
          `Processando apenas ${this.maxPages} primeiras.`
        );
      }
      
      const pagesToProcess = Math.min(pdf.numPages, this.maxPages);
      
      // 6. Extrair texto de cada página
      let textoCompleto = "";
      
      for (let i = 1; i <= pagesToProcess; i++) {
        // Verifica memória a cada 10 páginas
        if (i % 10 === 0) {
          if (!this._checkMemory(`página ${i}/${pagesToProcess}`)) {
            console.error(`[PdfReader] Memória insuficiente na página ${i}`);
            textoCompleto += `\n\n[AVISO: Processamento interrompido na página ${i} - memória insuficiente]`;
            break;
          }
        }
        
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // Usa formatter para preservar quebras de linha
          const pageText = PdfTextFormatter.formatWithLineBreaks(textContent.items);
          textoCompleto += pageText + "\n";
          
          // Libera recursos da página
          if (page.cleanup) {
            page.cleanup();
          }
        } catch (pageError) {
          console.error(`[PdfReader] Erro na página ${i}:`, pageError.message);
          textoCompleto += `\n\n[ERRO: Falha ao processar página ${i}]`;
        }
      }
      
      // 7. Obter metadata
      let metadata = {};
      try {
        const pdfMetadata = await pdf.getMetadata();
        metadata = {
          titulo: pdfMetadata?.info?.Title || '',
          autor: pdfMetadata?.info?.Author || '',
          criador: pdfMetadata?.info?.Creator || '',
          dataCriacao: pdfMetadata?.info?.CreationDate || '',
          producer: pdfMetadata?.info?.Producer || ''
        };
      } catch (metaError) {
        console.warn("[PdfReader] Erro ao extrair metadata:", metaError.message);
      }
      
      // 8. Liberar recursos do PDF
      if (pdf && typeof pdf.destroy === 'function') {
        try {
          pdf.destroy();
          console.log("[PdfReader] Recursos do PDF liberados");
        } catch (destroyError) {
          console.warn("[PdfReader] Erro ao liberar recursos:", destroyError.message);
        }
      }
      
      this._checkMemory('após processamento');
      
      // 9. Proteção: Limitar tamanho do texto
      const maxTextSize = this.maxTextSizeMB * 1024 * 1024;
      if (textoCompleto.length > maxTextSize) {
        const sizeMB = (textoCompleto.length / 1024 / 1024).toFixed(2);
        console.warn(`[PdfReader] Texto muito grande (${sizeMB}MB). Truncando...`);
        textoCompleto = textoCompleto.substring(0, maxTextSize) + 
          "\n\n[AVISO: Texto truncado devido ao tamanho]";
      }
      
      // 10. Normalizar texto usando formatter (mantém quebras de linha)
      const textoNormalizado = PdfTextFormatter.normalize(
        textoCompleto
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
      );
      
      console.log(
        `[PdfReader] ✅ Extração concluída: ${textoNormalizado.length} caracteres, ` +
        `${pagesToProcess} páginas processadas`
      );
      
      console.log('[PdfReader] Texto completo extraído:', textoNormalizado);
      
      return {
        texto: textoNormalizado,
        numeroPaginas: pdf.numPages,
        paginasProcessadas: pagesToProcess,
        metadata,
        tamanhoBytes: file.size,
        nomeArquivo: file.name
      };
      
    } catch (error) {
      this._checkMemory('erro');
      console.error("[PdfReader] Erro ao processar PDF:", error);
      throw error;
    }
  }
  
  /**
   * Verifica se os bytes parecem ser de um PDF
   * @private
   */
  _looksLikePdf(uint8Array) {
    if (!uint8Array || uint8Array.byteLength < 5) return false;
    
    const limit = Math.min(uint8Array.byteLength - 5, 2048);
    
    for (let i = 0; i <= limit; i++) {
      if (
        uint8Array[i] === 0x25 &&     // %
        uint8Array[i + 1] === 0x50 && // P
        uint8Array[i + 2] === 0x44 && // D
        uint8Array[i + 3] === 0x46 && // F
        uint8Array[i + 4] === 0x2d    // -
      ) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Monitora uso de memória (se disponível)
   * @private
   */
  _checkMemory(label) {
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      const percentUsed = ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1);
      
      console.log(`[PdfReader] Memória (${label}): ${usedMB}MB / ${limitMB}MB (${percentUsed}%)`);
      
      // Se uso > 85%, alerta crítico
      if (percentUsed > 85) {
        console.error(`[PdfReader] ⚠️ CRÍTICO: Memória em ${percentUsed}%!`);
        return false;
      }
      
      return true;
    }
    
    return true; // Se não tem API de memória, continua
  }
}
