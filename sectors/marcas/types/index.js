/**
 * sectors/marcas/types/index.js
 * 
 * Router central para os extractors específicos por tipo
 * Delega a extração para o tipo específico baseado no tipoId da classificação
 * 
 * Suporta:
 * - Tipos de petição (sem prefixo): recurso-indef/extractor.js
 * - Tipos de documento oficial (com prefixo doc_): recurso-indef/doc_extractor.js
 * - Mapeamento dinâmico via tipos-map.js
 */

import { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS, getTipo } from './tipos-map.js';

// Importações dos tipos implementados (para backward compatibility)
import { RecursoIndefExtractor } from './pet_recurso-indef/pet_extractor.js';
import { DocRecursoIndefNaoProvExtractor } from './doc_recurso-indef--naoProv/doc_extractor.js';
import { identificarRecursoIndef } from './pet_recurso-indef/pet_classifier.js';
import { RECURSO_INDEF_SCHEMA, validarRecursoIndef } from './pet_recurso-indef/pet_schema.js';

/**
 * Mapa de tipos implementados (mantém tipos carregados para melhor performance)
 * Para novos tipos, adicionar aqui após implementação
 */
const TYPE_EXTRACTORS_MAP = {
  // Petições
  'recursoIndeferimentoPedidoRegistro': {
    ExtractorClass: RecursoIndefExtractor,
    categoria: 'peticao',
    folder: 'pet_recurso-indef'
  },

  // Documentos oficiais
  'recursoIndeferimentoNaoProvido': {
    ExtractorClass: DocRecursoIndefNaoProvExtractor,
    categoria: 'documento_oficial',
    folder: 'doc_recurso-indef--naoProv'
  },
  'recursoIndeferimentoPedidoRegistro_naoProvido': {
    ExtractorClass: DocRecursoIndefNaoProvExtractor,
    categoria: 'documento_oficial',
    folder: 'doc_recurso-indef--naoProv'
  }
  
  // Próximos tipos de petição:
  // 'oposicao': { ExtractorClass: OposicaoExtractor, categoria: 'peticao', folder: 'oposicao' },
  // 'manifestacao': { ExtractorClass: ManifestacaoExtractor, categoria: 'peticao', folder: 'manifestacao' },
  
  // Documentos oficiais com prefixo doc_:
  // 'recursoIndeferimentoNaoProvido': { 
  //   ExtractorClass: DocExtractor, 
  //   categoria: 'documento_oficial',
  //   folder: 'recurso-indef',
  //   isPrefixedDoc: true 
  // }
};

/**
 * Cache de módulos importados dinamicamente
 */
const moduleCache = {};

/**
 * Obtém o extractor apropriado para um tipo específico
 * Suporta tanto tipos mapeados quanto tipos descobertos via tipos-map.js
 * 
 * @param {string} tipoId - ID do tipo (ex: 'recursoIndeferimentoPedidoRegistro')
 * @param {DataExtractor} dataExtractor - Instância do DataExtractor pai
 * @returns {Object|null} Instância do extractor ou null se tipo não encontrado
 */
export async function getExtractorForTipo(tipoId, dataExtractor) {
  // Primeiro, tenta mapa local de tipos implementados
  const mapEntry = TYPE_EXTRACTORS_MAP[tipoId];
  if (mapEntry) {
    return new mapEntry.ExtractorClass(dataExtractor);
  }
  
  // Depois, tenta descobrir via tipos-map.js
  const tipoConfig = getTipo(tipoId);
  if (!tipoConfig) {
    console.warn(`[TypeRouter] Tipo não reconhecido: ${tipoId}. Usando fallback ao DataExtractor genérico.`);
    return null;
  }
  
  // Construir caminho do arquivo
  const isPeticao = tipoConfig.categoria === 'peticao';
  const extractorFileName = isPeticao ? 'extractor.js' : 'doc_extractor.js';
  const modulePath = `./${tipoConfig.folder}/${extractorFileName}`;
  
  // Importar dinamicamente com cache
  if (!moduleCache[modulePath]) {
    try {
      moduleCache[modulePath] = await import(modulePath);
    } catch (error) {
      console.error(`[TypeRouter] Erro ao carregar módulo: ${modulePath}`, error);
      return null;
    }
  }
  
  const module = moduleCache[modulePath];
  
  // Determinar nome da classe extratora baseado na abreviação
  // Exemplo: 'recurso-indef' → 'RecursoIndefExtractor'
  // Exemplo: 'recurso-indef--naoProv' → 'DocExtractor' (documentos sempre Doc)
  let ExtractorClass;
  if (isPeticao) {
    // Para petições: [Abreviacao]Extractor (com camelCase)
    const classNameParts = tipoConfig.abreviacao
      .split('-')
      .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    const className = classNameParts.charAt(0).toUpperCase() + classNameParts.slice(1) + 'Extractor';
    ExtractorClass = module[className];
  } else {
    // Para documentos: sempre DocExtractor
    ExtractorClass = module.DocExtractor;
  }
  
  if (!ExtractorClass) {
    console.error(`[TypeRouter] Extractor class não encontrada para: ${tipoId}`);
    return null;
  }
  
  return new ExtractorClass(dataExtractor);
}

/**
 * Versão síncrona para tipos pré-carregados
 * Use apenas para tipos no TYPE_EXTRACTORS_MAP
 * 
 * @param {string} tipoId - ID do tipo
 * @param {DataExtractor} dataExtractor - Instância do DataExtractor pai
 * @returns {Object|null} Instância do extractor ou null
 */
export function getExtractorForTipoSync(tipoId, dataExtractor) {
  const mapEntry = TYPE_EXTRACTORS_MAP[tipoId];
  
  if (!mapEntry) {
    console.warn(`[TypeRouter] Tipo não encontrado no mapa síncrono: ${tipoId}. Use getExtractorForTipo() async ou carregue o tipo.`);
    return null;
  }
  
  return new mapEntry.ExtractorClass(dataExtractor);
}

/**
 * Lista todos os tipos disponíveis de petições
 * @returns {string[]} Array de tipoIds de petições
 */
export function getTiposPeticaoDisponiveis() {
  return Object.keys(TIPOS_PETICAO);
}

/**
 * Lista todos os tipos de documentos oficiais disponíveis
 * @returns {string[]} Array de tipoIds de documentos
 */
export function getTiposDocumentosDisponiveis() {
  return Object.keys(TIPOS_DOCUMENTOS_OFICIAIS);
}

/**
 * Lista todos os tipos disponíveis (petições + documentos)
 * @returns {string[]} Array de tipoIds
 */
export function getTiposDisponiveis() {
  return [
    ...Object.keys(TIPOS_PETICAO),
    ...Object.keys(TIPOS_DOCUMENTOS_OFICIAIS)
  ];
}

/**
 * Verifica se um tipo está disponível
 * @param {string} tipoId - ID do tipo
 * @returns {boolean}
 */
export function isTipoDisponivel(tipoId) {
  return !!getTipo(tipoId);
}

/**
 * Obtém informações de configuração de um tipo
 * @param {string} tipoId - ID do tipo
 * @returns {object|null} Configuração do tipo ou null
 */
export function getTipoConfig(tipoId) {
  return getTipo(tipoId);
}

// ============================================================================
// EXPORTS DE TIPOS ESPECÍFICOS (backward compatibility + conveniência)
// ============================================================================

// Recurso contra Indeferimento (Petição)
export { RecursoIndefExtractor } from './pet_recurso-indef/pet_extractor.js';
export { identificarRecursoIndef } from './pet_recurso-indef/pet_classifier.js';
export { RECURSO_INDEF_SCHEMA, validarRecursoIndef } from './pet_recurso-indef/pet_schema.js';
export { TIPO_PETICAO as RECURSO_INDEF_TIPO_PETICAO } from './pet_recurso-indef/pet_relacionado.js';

// Recurso contra Indeferimento - Não Provido (Documento)
export { DocRecursoIndefNaoProvExtractor } from './doc_recurso-indef--naoProv/doc_extractor.js';
export { identificarDocRecursoIndefNaoProv } from './doc_recurso-indef--naoProv/doc_classifier.js';
export { DOC_RECURSO_INDEF_NAO_PROV_SCHEMA, validarDocRecursoIndefNaoProv } from './doc_recurso-indef--naoProv/doc_schema.js';

// Mapa central de tipos
export { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS } from './tipos-map.js';
