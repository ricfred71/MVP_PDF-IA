/**
 * sectors/patentes/types/doc_recurso-indef--naoProv/doc_schema.js
 * 
 * Schema para Documento Oficial: Recurso contra Indeferimento - Não Provido (Patentes)
 */

export const DOC_RECURSO_INDEF_NAO_PROV_SCHEMA = {
  // Metadados do documento
  categoria: { type: 'string', required: true, default: 'documento_oficial' },
  tipo: { type: 'string', required: true },
  subtipo: { type: 'string', required: false },
  confianca: { type: 'number', required: true, min: 0, max: 100 },
  setor: { type: 'string', required: true, default: 'patentes' },
  
  // Identificação
  form_numeroProcesso: { type: 'string', required: true, pattern: /^BR\d{8,}(?:-\d)?$/ },
  form_numeroPct: { type: 'string', required: false },
  form_dataDeposito: { type: 'string', required: false, pattern: /^\d{2}\/\d{2}\/\d{4}$/ },
  form_prioridadeUnionista: { type: 'string', required: false },
  form_requerente_nome: { type: 'string', required: false },
  form_inventor_nome: { type: 'string', required: false },
  form_titulo: { type: 'string', required: false },
  form_decisao: { type: 'string', required: false },
  textoAutomaticoEtapa1: { type: 'string', required: false },
  textoAutomaticoEtapa2: { type: 'string', required: false },
  
  // Metadados gerais
  textoCompleto: { type: 'string', required: true },
  urlPdf: { type: 'string', required: false },
  dataProcessamento: { type: 'string', required: true },
  processor: { type: 'string', required: false }
};

/**
 * Valida dados extraídos do documento oficial
 * @param {Object} dados - Dados extraídos
 * @returns {Object} { valido: boolean, erros: [], campos_ausentes: [], campos_preenchidos: number }
 */
export function validarDocRecursoIndefNaoProv(dados) {
  const erros = [];
  const campos_ausentes = [];
  let campos_preenchidos = 0;
  
  // Validar campos obrigatórios
  const camposObrigatorios = [
    'categoria', 'tipo', 'confianca', 'setor',
    'form_numeroProcesso', 'textoCompleto', 'dataProcessamento'
  ];
  
  for (const campo of camposObrigatorios) {
    const schema = DOC_RECURSO_INDEF_NAO_PROV_SCHEMA[campo];
    const valor = dados[campo];
    
    if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
      campos_ausentes.push(campo);
      if (schema.required) {
        erros.push(`Campo obrigatório ausente: ${campo}`);
      }
    } else {
      campos_preenchidos++;
      
      // Validar tipo
      if (schema.type === 'string' && typeof valor !== 'string') {
        erros.push(`Campo ${campo} deve ser string`);
      }
      if (schema.type === 'number' && typeof valor !== 'number') {
        erros.push(`Campo ${campo} deve ser number`);
      }
      
      // Validar pattern
      if (schema.pattern && typeof valor === 'string' && !schema.pattern.test(valor)) {
        erros.push(`Campo ${campo} não corresponde ao padrão esperado`);
      }
      
      // Validar min/max
      if (schema.min !== undefined && valor < schema.min) {
        erros.push(`Campo ${campo} deve ser >= ${schema.min}`);
      }
      if (schema.max !== undefined && valor > schema.max) {
        erros.push(`Campo ${campo} deve ser <= ${schema.max}`);
      }
    }
  }
  
  return {
    valido: erros.length === 0,
    erros,
    campos_ausentes,
    campos_preenchidos,
    total_campos: Object.keys(DOC_RECURSO_INDEF_NAO_PROV_SCHEMA).length
  };
}
