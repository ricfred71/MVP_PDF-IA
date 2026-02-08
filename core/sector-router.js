/**
 * core/sector-router.js
 * 
 * Seleciona o setor (marcas ou patentes) e retorna o extrator correto.
 * Mantém o MVP funcional para ambos os setores e facilita o split futuro.
 */

import marcasExtractor from '../sectors/marcas/extractor.js';
import patentesExtractor from '../sectors/patentes/extractor.js';

export function detectSector(texto = '', contexto = {}) {
  const sample = (texto || '').substring(0, 1200).toLowerCase();
  const url = (contexto?.url || '').toLowerCase();
  const fileName = (contexto?.fileName || '').toLowerCase();

  // Heurística simples para patentes (pode ser refinada depois)
  const sinaisPatentes = [
    'patente',
    'invenção', 
    'modelo de utilidade',
    'certificado de adição de invenção',    
    'relatório descritivo',
    'reivindicações'
  ];

  const sinaisMarcas = [
    'marca',
    'petição de marca',
    'processo de registro de marca'
  ];

  const matchPatentes = sinaisPatentes.some((s) => sample.includes(s) || url.includes(s) || fileName.includes(s));
  const matchMarcas = sinaisMarcas.some((s) => sample.includes(s) || url.includes(s) || fileName.includes(s));

  if (matchPatentes && !matchMarcas) return 'patentes';
  if (matchMarcas && !matchPatentes) return 'marcas';

  // Default do MVP: marcas
  return 'marcas';
}

export function getExtractor(sector = 'marcas') {
  return sector === 'patentes' ? patentesExtractor : marcasExtractor;
}

export function getExtractorForTexto(texto = '', contexto = {}) {
  const sector = contexto?.sector || detectSector(texto, contexto);
  return {
    sector,
    extractor: getExtractor(sector)
  };
}
