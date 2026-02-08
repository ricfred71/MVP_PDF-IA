/**
 * sectors/patentes/classifier.js
 * 
 * Classificador de documentos específico do setor Patentes
 * Identifica categorias e tipos de documentos relacionados a patentes
 * 
 * CATEGORIAS PATENTES (mesmas de Marcas):
 * - PETICAO: Petição com 17 dígitos OU padrões específicos de patentes
 * - DOCUMENTO_OFICIAL: Despachos, decisões, pareceres técnicos do INPI
 * - CATEGORIADESCONHECIDA: Não se enquadra nos padrões
 * 
 * NOTA: Patentes usam os mesmos identificadores de categoria que Marcas,
 *       mas com padrões regex específicos para documentos de patentes.
 */

export class PatentesClassifier {
  constructor() {
    // Regras para identificação de tipos de PETIÇÃO
    this.regrasPeticao = [
      {
        id: 'recursoIndeferimentoPedidoPatente',
        descricao: 'Recurso contra Indeferimento de Pedido de Patente',
        test: (texto) => {
          // Verifica se começa com "Recurso de patente"
          const texto200 = texto.substring(0, 200).trim();
          if (texto200.startsWith('Recurso de patente de invenção, modelo de utilidade ou certificado de adição de invenção')) {
            return true;
          }
          
          // Verifica se contém padrões de recurso contra indeferimento
          const texto1000 = texto.substring(0, 1000).toLowerCase();
          return texto1000.includes('recurso') && 
                 (texto1000.includes('indeferimento') || texto1000.includes('recurso de patente'));
        }
      }
      // Outros tipos de petição serão adicionados aqui
    ];

    // Regras para identificação de tipos de DOCUMENTO OFICIAL
    this.regrasDocOficial = [
      {
        id: 'recursoIndeferimentoNaoProvidoPatente',
        descricao: 'Recurso conhecido e negado provimento - Patente',
        test: (texto) => {
          const ultimos400 = texto.substring(Math.max(0, texto.length - 400));
          return ultimos400.includes('Recurso conhecido e negado provimento. Mantido o indeferimento do pedido');
        }
      }
      // Outros tipos de documento oficial serão adicionados aqui
    ];
  }

  /**
   * Classifica um documento de patente
   * @param {string} texto - Texto completo do documento
   * @returns {Object} { categoriaId, tipoId, subtipoId, confianca, tipoOriginal }
   */
  classificar(texto) {
    // VALIDAÇÃO
    if (!texto || typeof texto !== 'string') {
      throw new Error('[PatentesClassifier] Texto inválido para classificação');
    }
    
    console.log(`[PatentesClassifier] Iniciando classificação (${texto.length} caracteres)`);
    
    // ETAPA 1: Identifica categoria (PETICAO ou DOCUMENTO_OFICIAL)
    const categoria = this._identificarCategoria(texto);
    console.log(`[PatentesClassifier] 📋 Categoria detectada: "${categoria}"`);
    
    // ETAPA 2: Identifica tipo específico baseado na categoria
    let tipoId = '';
    if (categoria === 'peticao') {
      tipoId = this._identificarTipoPeticao(texto);
      console.log(`[PatentesClassifier] 📝 Tipo de petição: "${tipoId}"`);
    } else if (categoria === 'documento_oficial') {
      tipoId = this._identificarTipoDocOficial(texto);
      console.log(`[PatentesClassifier] 📝 Tipo de doc oficial: "${tipoId}"`);
    }
    
    // ETAPA 3: Subtipo - ⚠️ DESATIVADO por enquanto
    const subtipoId = '';
    
    // ETAPA 4: Calcula confiança
    const confianca = categoria === 'categoriaDesconhecida' ? 0.0 : 0.85;
    
    // ETAPA 5: Converte em categoriaId final
    const categoriaId = categoria === 'peticao' ? 'peticao' : 
                        categoria === 'documento_oficial' ? 'documento_oficial' : 
                        'categoriaDesconhecida';
    
    console.log(
      `[PatentesClassifier] Classificado: ${categoriaId} ` +
      `(tipo/subtipo: não implementado) ` +
      `(confiança: ${(confianca * 100).toFixed(0)}%)`
    );
    
    return {
      categoriaId,
      tipoId,
      subtipoId,
      confianca,
      tipoOriginal: '',
      setor: 'patentes'
    };
  }
  
  /**
   * Identifica a categoria do documento de patente
   * Padrões específicos para patentes, mas categorias iguais a Marcas
   * @private
   */
  _identificarCategoria(texto) {
    const texto250 = texto.substring(0, 250).toLowerCase();
    
    console.log('[PatentesClassifier] Analisando primeiros 250 caracteres');
    
    // PADRÃO 1: PETIÇÃO - 17 dígitos (padrão universal, igual a Marcas)
    const regexPeticao = /(?<!\d)\d{17}(?!\d)/;
    
    // PADRÃO 2: DOCUMENTO OFICIAL PATENTES
    const regexDocOficial = /(instituto nacional da propriedade industrial)/i;
    
    let categoria = 'categoriaDesconhecida';
    
    // 1. Verifica PETIÇÃO por 17 dígitos
    if (regexPeticao.test(texto250)) {
      categoria = 'peticao';
      console.log('[PatentesClassifier] ✅ CATEGORIA: PETIÇÃO (17 dígitos encontrados)');
    } 
    // 2. Verifica DOCUMENTO OFICIAL
    else if (regexDocOficial.test(texto250)) {
      categoria = 'documento_oficial';
      console.log('[PatentesClassifier] ✅ CATEGORIA: DOCUMENTO OFICIAL');
    } 
    // 3. Nenhum padrão reconhecido
    else {
      console.log('[PatentesClassifier] ⚠️ CATEGORIA: DESCONHECIDA (nenhum padrão reconhecido)');
    }
    
    return categoria;
  }
  
  /**
   * Identifica tipo específico de petição de patente
   * @private
   */
  _identificarTipoPeticao(texto) {
    const regraEncontrada = this.regrasPeticao.find(regra => regra.test(texto));
    
    if (regraEncontrada) {
      console.log(`[PatentesClassifier] ✅ TIPO: ${regraEncontrada.id} (${regraEncontrada.descricao})`);
      return regraEncontrada.id;
    }
    
    // Tipo genérico (não identificado)
    console.log('[PatentesClassifier] ℹ️ TIPO: genérico (não identificado)');
    return '';
  }
  
  /**
   * Identifica tipo específico de documento oficial de patente
   * @private
   */
  _identificarTipoDocOficial(texto) {
    const regraEncontrada = this.regrasDocOficial.find(regra => regra.test(texto));
    
    if (regraEncontrada) {
      console.log(`[PatentesClassifier] ✅ TIPO DOC OFICIAL: ${regraEncontrada.id} (${regraEncontrada.descricao})`);
      return regraEncontrada.id;
    }
    
    // Tipo genérico (não identificado)
    console.log('[PatentesClassifier] ℹ️ TIPO DOC OFICIAL: genérico (não identificado)');
    return '';
  }
}

// Exporta instância única (singleton)
export default new PatentesClassifier();
