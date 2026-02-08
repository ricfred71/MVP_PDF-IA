/**
 * sectors/marcas/types/base_extractor_utils.js
 * 
 * Utilitários compartilhados entre extractors de petição e documento oficial
 */

/**
 * Sanitiza nome de arquivo/chave para storage
 * @param {string} str
 * @returns {string}
 */
export function sanitizeFilename(str) {
  if (!str) return 'documento';
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '_') // Substitui caracteres especiais por _
    .replace(/_+/g, '_') // Remove underscores duplicados
    .replace(/^_|_$/g, '') // Remove underscores no início/fim
    .substring(0, 100); // Limita tamanho
}
