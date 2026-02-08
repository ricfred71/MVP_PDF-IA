/**
 * utils/pdf-layout-preserving-extractor.js
 * 
 * Extrator alternativo simples que preserva layout do PDF
 * Pode ser usado diretamente no seu doc_extractor.js
 * 
 * Uso:
 *   const textoComLinhas = PdfLayoutPreservingExtractor.extract(textContent.items);
 * 
 * @version 1.0.0
 */

export class PdfLayoutPreservingExtractor {
  /**
   * Extrai texto preservando quebras de linha
   * 
   * @param {Array} items - textContent.items do pdf.js
   * @param {Object} options - Opções de extração
   * @returns {string} Texto com quebras de linha preservadas
   */
  static extract(items, options = {}) {
    const {
      normalizeSpaces = true,
      removeArtifactLines = false,
      minCharsPerLine = 3
    } = options;

    if (!items || !Array.isArray(items)) return '';

    let text = '';
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      text += item.str || '';
      
      // Se tem EOL (End of Line), adiciona quebra
      if (item.hasEOL) {
        text += '\n';
      } else if (i < items.length - 1) {
        // Caso contrário, adiciona espaço (lógica inteligente)
        const proximoItem = items[i + 1];
        if (this._shouldAddSpace(item, proximoItem)) {
          text += ' ';
        }
      }
    }

    // Post-processamento opcional
    if (normalizeSpaces) {
      text = text.replace(/[ \t]+/g, ' ');       // Remove múltiplos espaços
      text = text.replace(/ +\n/g, '\n');        // Remove espaço antes de quebra
    }

    if (removeArtifactLines) {
      text = text
        .split('\n')
        .filter(line => line.trim().length >= minCharsPerLine || line === '')
        .join('\n');
    }

    return text;
  }

  /**
   * Lógica de espaçamento
   * @private
   */
  static _shouldAddSpace(current, next) {
    const currStr = (current.str || '').trim();
    const nextStr = (next.str || '').trim();

    if (!currStr || !nextStr) return false;
    if (currStr.endsWith('-')) return false;        // Hífen
    if (/^[,.\);:\']/.test(nextStr)) return false;  // Pontuação
    
    return true;
  }
}
