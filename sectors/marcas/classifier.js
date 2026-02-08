/**
 * sectors/marcas/classifier.js
 * 
 * Classificador de documentos específico do setor Marcas
 * Identifica categorias e tipos de documentos relacionados a marcas
 * 
 * CATEGORIAS MARCAS:
 * - PETICAO: Petição com 17 dígitos
 * - DOCUMENTO_OFICIAL: Despachos, decisões, intimações do INPI
 * - CATEGORIADESCONHECIDA: Não se enquadra nos padrões
 */

export class MarcasClassifier {
  constructor() {
    // Regras para identificação de tipos de PETIÇÃO
    this.regrasPeticao = [
      {
        id: 'recursoIndeferimentoPedidoRegistro',
        descricao: 'Recurso contra indeferimento de pedido de registro de marca',
        test: (texto) => {
          const texto250 = texto.substring(0, 250);
          return texto250.includes('Recurso contra indeferimento de pedido de registro de marca');
        }
      }
      // Outros tipos de petição de marcas serão adicionados aqui
    ];

    // Regras para identificação de tipos de DOCUMENTO OFICIAL
    this.regrasDocOficial = [
      {
        id: 'recursoIndeferimentoPedidoRegistro_naoProvido',
        descricao: 'Recurso não provido - Decisão mantida',
        test: (texto) => {
          const texto600 = texto.substring(0, 600);
          return texto600.includes('Processo de registro de marca') &&
                 texto600.includes('Recurso contra indeferimento de pedido de registro de marca') &&
                 texto600.includes('Recurso não provido. Decisão mantida');
        }
      }
      // Outros tipos de documento oficial serão adicionados aqui
    ];
  }

  /**
   * Classifica um documento de marca
   * @param {string} texto - Texto completo do documento
   * @returns {Object} { categoriaId, tipoId, subtipoId, confianca, tipoOriginal }
   */
  classificar(texto) {
    // VALIDAÇÃO
    if (!texto || typeof texto !== 'string') {
      throw new Error('[MarcasClassifier] Texto inválido para classificação');
    }
    
    console.log(`[MarcasClassifier] Iniciando classificação (${texto.length} caracteres)`);
    
    // ETAPA 1: Identifica categoria (PETICAO, DOCUMENTO_OFICIAL, etc)
    const categoria = this._identificarCategoria(texto);
    console.log(`[MarcasClassifier] 📋 Categoria detectada: "${categoria}"`);
    
    // ETAPA 2: Identifica tipo específico baseado na categoria
    let tipoId = '';
    if (categoria === 'peticao') {
      tipoId = this._identificarTipoPeticao(texto);
      console.log(`[MarcasClassifier] 📝 Tipo de petição: "${tipoId}"`);
    } else if (categoria === 'documento_oficial') {
      tipoId = this._identificarTipoDocOficial(texto);
      console.log(`[MarcasClassifier] 📝 Tipo de doc oficial: "${tipoId}"`);
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
      `[MarcasClassifier] Classificado: ${categoriaId} ` +
      `(tipo/subtipo: não implementado) ` +
      `(confiança: ${(confianca * 100).toFixed(0)}%)`
    );
    
    return {
      categoriaId,
      tipoId,
      subtipoId,
      confianca,
      tipoOriginal: '',
      setor: 'marcas'
    };
  }
  
  /**
   * Identifica a categoria do documento de marca
   * @private
   */
  _identificarCategoria(texto) {
    const texto250 = texto.substring(0, 250);
    console.log('[MarcasClassifier] Analisando primeiros 250 caracteres:', texto250);
    
    // PADRÃO 1: PETIÇÃO - 17 dígitos contínuos
    // Exemplo: 31123252330338563
    // (?<!\d) = não há dígito antes
    // (?!\d) = não há dígito depois
    const regexPeticao = /(?<!\d)\d{17}(?!\d)/;
    
    // PADRÃO 2: DOCUMENTO OFICIAL MARCAS
    // Strings características de documentos oficiais do INPI para marcas
    const regexDocOficial = /(Processo de registro de marca|Petição de Marca)/i;
    
    let categoria = 'categoriaDesconhecida';
    
    // 1. Verifica PETICAO (17 dígitos)
    if (regexPeticao.test(texto250)) {
      categoria = 'peticao';
      console.log('[MarcasClassifier] ✅ CATEGORIA: PETIÇÃO (17 dígitos encontrados)');
    } 
    // 2. Verifica DOCUMENTO OFICIAL
    else if (regexDocOficial.test(texto250)) {
      categoria = 'documento_oficial';
      console.log('[MarcasClassifier] ✅ CATEGORIA: DOCUMENTO OFICIAL (padrões encontrados)');
    } 
    // 3. Nenhum padrão reconhecido
    else {
      console.log('[MarcasClassifier] ⚠️ CATEGORIA: DESCONHECIDA (nenhum padrão reconhecido)');
    }
    
    return categoria;
  }
  
  /**
   * Identifica tipo específico de petição de marca
   * @private
   */
  _identificarTipoPeticao(texto) {
    const regraEncontrada = this.regrasPeticao.find(regra => regra.test(texto));
    
    if (regraEncontrada) {
      console.log(`[MarcasClassifier] ✅ TIPO: ${regraEncontrada.id} (${regraEncontrada.descricao})`);
      return regraEncontrada.id;
    }
    
    // Tipo genérico (não identificado)
    console.log('[MarcasClassifier] ℹ️ TIPO: genérico (não identificado)');
    return '';
  }
  
  /**
   * Identifica tipo específico de documento oficial de marca
   * @private
   */
  _identificarTipoDocOficial(texto) {
    const regraEncontrada = this.regrasDocOficial.find(regra => regra.test(texto));
    
    if (regraEncontrada) {
      console.log(`[MarcasClassifier] ✅ TIPO DOC OFICIAL: ${regraEncontrada.id} (${regraEncontrada.descricao})`);
      return regraEncontrada.id;
    }
    
    // Tipo genérico (não identificado)
    console.log('[MarcasClassifier] ℹ️ TIPO DOC OFICIAL: genérico (não identificado)');
    return '';
  }
}

// Exporta instância única (singleton)
export default new MarcasClassifier();
