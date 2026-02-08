/**
 * utils/pdf-text-formatter.js
 * 
 * Utilidade para formatar texto extraído do PDF.js preservando quebras de linha
 * e estrutura original do documento.
 * 
 * Usa a propriedade `hasEOL` (End of Line) do pdf.js para manter a formatação.
 * 
 * @version 1.0.0
 */

export class PdfTextFormatter {
  /**
   * Extrai texto preservando quebras de linha reais
   * 
   * @param {Array} items - Array de items do textContent do pdf.js
   * @returns {string} Texto formatado com quebras de linha
   */
  static formatWithLineBreaks(items) {
    if (!items || !Array.isArray(items)) {
      return '';
    }

    let text = '';
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Adiciona o texto do item
      text += item.str || '';
      
      // Se o item tem EOL (fim de linha), adiciona quebra de linha
      if (item.hasEOL) {
        text += '\n';
      } else {
        // Se não há EOL mas há próximo item, adiciona espaço
        // (exceto em casos especiais como hífens)
        if (i < items.length - 1) {
          const proximoItem = items[i + 1];
          
          // Detecta se deve adicionar espaço
          if (this._shouldAddSpace(item, proximoItem)) {
            text += ' ';
          }
        }
      }
    }
    
    return text;
  }

  /**
   * Remove espaços excessivos mantendo quebras de linha
   * 
   * @param {string} text - Texto com possíveis espaços excessivos
   * @returns {string} Texto limpo
   */
  static cleanExcessiveSpaces(text) {
    // Remove múltiplos espaços em branco (exceto quebras de linha)
    text = text.replace(/[ \t]+/g, ' ');
    
    // Remove espaços antes de quebras de linha
    text = text.replace(/ +\n/g, '\n');
    
    // Remove múltiplas quebras de linha consecutivas (máx 2)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text;
  }

  /**
   * Preserva apenas quebras de linha significativas
   * Remove linhas muito curtas que são apenas artefatos de layout
   * 
   * @param {string} text - Texto formatado
   * @param {number} minCharsPerLine - Mínimo de caracteres para considerar uma linha válida
   * @returns {string} Texto com linhas filtradas
   */
  static filterArtifactLines(text, minCharsPerLine = 3) {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length >= minCharsPerLine || line === '')
      .join('\n');
  }

  /**
   * Detecta se deve adicionar espaço entre dois items
   * Lógica inteligente para não adicionar espaço em casos como hífens
   * 
   * @private
   * @param {Object} currentItem - Item atual
   * @param {Object} nextItem - Próximo item
   * @returns {boolean} True se deve adicionar espaço
   */
  static _shouldAddSpace(currentItem, nextItem) {
    if (!currentItem || !nextItem) return false;
    
    const currentStr = currentItem.str || '';
    const nextStr = nextItem.str || '';
    
    // Não adiciona espaço se o item termina com hífen (continuação de palavra)
    if (currentStr.endsWith('-')) {
      return false;
    }
    
    // Não adiciona espaço se o próximo item começa com pontuação
    if (/^[,.\);:\']/.test(nextStr)) {
      return false;
    }
    
    // Não adiciona espaço se o item atual está vazio
    if (currentStr.length === 0) {
      return false;
    }
    
    // Caso padrão: adiciona espaço
    return true;
  }

  /**
   * Normaliza espaçamento mantendo estrutura de linhas
   * Útil para comparações de regex mais robustas
   * 
   * @param {string} text - Texto para normalizar
   * @returns {string} Texto normalizado
   */
  static normalize(text) {
    return this.cleanExcessiveSpaces(
      this.filterArtifactLines(text)
    );
  }

  /**
   * Extrai uma seção de texto entre dois marcadores
   * Mantendo a estrutura de linhas
   * 
   * @param {string} text - Texto completo
   * @param {RegExp} startMarker - Regex para início da seção
   * @param {RegExp} endMarker - Regex para fim da seção
   * @returns {string|null} Texto da seção ou null
   */
  static extractSection(text, startMarker, endMarker) {
    const match = text.match(
      new RegExp(
        startMarker.source + '[\\s\\S]*?' + endMarker.source,
        startMarker.flags || 'i'
      )
    );
    
    return match ? match[0].trim() : null;
  }

  /**
   * Debug: retorna visualização do texto com marcadores de quebra de linha
   * Útil para testar formatação
   * 
   * @param {string} text - Texto para visualizar
   * @returns {string} Texto com marcadores visíveis
   */
  static visualizeLineBreaks(text) {
    return text
      .replace(/\n/g, '↵\n')
      .replace(/ /g, '·');
  }
}
