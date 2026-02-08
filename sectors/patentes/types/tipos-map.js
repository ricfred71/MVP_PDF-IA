/**
 * sectors/patentes/types/tipos-map.js
 * 
 * Registro central de todas as petições e documentos oficiais
 * Permite roteamento dinâmico e consulta de tipos disponíveis
 */

// ============================================================================
// MAPEAMENTO DE PETIÇÕES (sem prefixo de arquivo)
// ============================================================================
export const TIPOS_PETICAO = {
  // Recurso contra Indeferimento
  recursoIndeferimentoPedidoPatente: {
    id: 'recursoIndeferimentoPedidoPatente',
    abreviacao: 'recurso-indef',
    categoria: 'peticao',
    folder: 'pet_recurso-indef',
    schemaFile: 'pet_schema.js',
    extractorFile: 'pet_extractor.js',
    classifierFile: 'pet_classifier.js',
    relatedFile: 'pet_relacionado.js',
    descricao: 'Recurso contra Indeferimento de Pedido de Patente'
  }
};

// ============================================================================
// MAPEAMENTO DE DOCUMENTOS OFICIAIS (com prefixo doc_)
// ============================================================================
export const TIPOS_DOCUMENTOS_OFICIAIS = {
  // Documentos relacionados ao Recurso contra Indeferimento
  recursoIndeferimentoNaoProvido: {
    id: 'recursoIndeferimentoNaoProvido',
    abreviacao: 'recurso-indef--naoProv',
    categoria: 'documento_oficial',
    folder: 'doc_recurso-indef--naoProv',
    parentTipo: 'recursoIndeferimentoPedidoPatente',
    parentAbreviacao: 'recurso-indef',
    schemaFile: 'doc_schema.js',
    extractorFile: 'doc_extractor.js',
    classifierFile: 'doc_classifier.js',
    descricao: 'Despacho: Recurso não provido',
    prefixoArquivo: 'doc_'
  },

  recursoIndeferimentoProvido: {
    id: 'recursoIndeferimentoProvido',
    abreviacao: 'recurso-indef--provido',
    categoria: 'documento_oficial',
    folder: 'doc_recurso-indef--provido',
    parentTipo: 'recursoIndeferimentoPedidoPatente',
    parentAbreviacao: 'recurso-indef',
    schemaFile: 'doc_schema.js',
    extractorFile: 'doc_extractor.js',
    classifierFile: 'doc_classifier.js',
    descricao: 'Despacho: Recurso provido',
    prefixoArquivo: 'doc_'
  },

  recursoIndeferimentoProvidoParcial: {
    id: 'recursoIndeferimentoProvidoParcial',
    abreviacao: 'recurso-indef--provParcial',
    categoria: 'documento_oficial',
    folder: 'doc_recurso-indef--provParcial',
    parentTipo: 'recursoIndeferimentoPedidoPatente',
    parentAbreviacao: 'recurso-indef',
    schemaFile: 'doc_schema.js',
    extractorFile: 'doc_extractor.js',
    classifierFile: 'doc_classifier.js',
    descricao: 'Despacho: Recurso provido parcialmente',
    prefixoArquivo: 'doc_'
  }
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém informações de um tipo de petição
 * @param {string} tipoId - ID da petição (ex: 'recursoIndeferimentoPedidoPatente')
 * @returns {object|null} Configuração do tipo ou null
 */
export function getTipoPeticao(tipoId) {
  return TIPOS_PETICAO[tipoId] || null;
}

/**
 * Obtém informações de um tipo de documento oficial
 * @param {string} tipoId - ID do documento (ex: 'recursoIndeferimentoNaoProvido')
 * @returns {object|null} Configuração do tipo ou null
 */
export function getTipoDocumentoOficial(tipoId) {
  return TIPOS_DOCUMENTOS_OFICIAIS[tipoId] || null;
}

/**
 * Obtém informações de qualquer tipo (petição ou documento)
 * @param {string} tipoId - ID do tipo
 * @returns {object|null} Configuração do tipo ou null
 */
export function getTipo(tipoId) {
  return getTipoPeticao(tipoId) || getTipoDocumentoOficial(tipoId) || null;
}

/**
 * Verifica se um tipo é uma petição
 * @param {string} tipoId - ID do tipo
 * @returns {boolean}
 */
export function isPeticao(tipoId) {
  return !!TIPOS_PETICAO[tipoId];
}

/**
 * Verifica se um tipo é um documento oficial
 * @param {string} tipoId - ID do tipo
 * @returns {boolean}
 */
export function isDocumentoOficial(tipoId) {
  return !!TIPOS_DOCUMENTOS_OFICIAIS[tipoId];
}

/**
 * Retorna todos os documentos relacionados a uma petição
 * @param {string} peticaoTipoId - ID da petição
 * @returns {array} Array de configurações de documentos relacionados
 */
export function getDocumentosRelacionados(peticaoTipoId) {
  const resultado = [];
  
  for (const [tipoId, config] of Object.entries(TIPOS_DOCUMENTOS_OFICIAIS)) {
    if (config.parentTipo === peticaoTipoId) {
      resultado.push(config);
    }
  }
  
  return resultado;
}

/**
 * Converte ID de tipo para abreviação
 * @param {string} tipoId - ID do tipo
 * @returns {string|null} Abreviação ou null
 */
export function tipoIdParaAbreviacao(tipoId) {
  const tipo = getTipo(tipoId);
  return tipo ? tipo.abreviacao : null;
}

/**
 * Encontra tipo pelo ID abreviado (ex: 'recurso-indef')
 * @param {string} abreviacao - Abreviação (ex: 'recurso-indef')
 * @returns {object|null} Configuração do tipo ou null
 */
export function findTipoByAbreviacao(abreviacao) {
  // Busca em petições
  for (const [tipoId, config] of Object.entries(TIPOS_PETICAO)) {
    if (config.abreviacao === abreviacao) {
      return config;
    }
  }
  
  // Busca em documentos
  for (const [tipoId, config] of Object.entries(TIPOS_DOCUMENTOS_OFICIAIS)) {
    if (config.abreviacao === abreviacao) {
      return config;
    }
  }
  
  return null;
}
