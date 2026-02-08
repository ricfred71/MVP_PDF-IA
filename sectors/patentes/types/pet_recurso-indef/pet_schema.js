/**
 * sectors/patentes/types/pet_recurso-indef/pet_schema.js
 * 
 * Schema do tipo: Recurso contra Indeferimento de Pedido de Patente
 * Define a estrutura esperada do objeto armazenado no storage
 */

export const RECURSO_INDEF_SCHEMA = {
  // ========================================
  // METADADOS DE CLASSIFICAÇÃO
  // ========================================
  categoria: { 
    type: 'string', 
    required: true,
    value: 'peticao',
    description: 'Categoria do documento'
  },
  tipo: { 
    type: 'string', 
    required: true,
    value: 'recursoIndeferimentoPedidoPatente',
    description: 'Tipo específico do documento'
  },
  subtipo: { 
    type: 'string', 
    required: false,
    description: 'Subtipo (para uso futuro)'
  },
  confianca: { 
    type: 'number', 
    required: true,
    min: 0,
    max: 1,
    description: 'Confiança da classificação (0-1)'
  },

  // ========================================
  // DADOS DA PETIÇÃO
  // ========================================
  form_numeroPeticao: { 
    type: 'string', 
    required: true,
    pattern: '\\d{12}',
    description: 'Número da petição (12 dígitos)'
  },
  form_numeroProcesso: { 
    type: 'string', 
    required: true,
    pattern: '^(BR\\d{8,}|\\d{9})$',
    description: 'Número do processo (BR + dígitos ou 9 dígitos)'
  },
  form_nossoNumero: { 
    type: 'string', 
    required: false,
    description: 'Nosso número (17 dígitos)'
  },
  form_dataPeticao: { 
    type: 'string', 
    required: false,
    description: 'Data e hora da petição (formato DD/MM/YYYY HH:MM)'
  },

  // ========================================
  // DADOS DO REQUERENTE
  // ========================================
  form_requerente_nome: { 
    type: 'string', 
    required: true,
    description: 'Nome ou Razão Social do requerente'
  },
  form_requerente_cpfCnpjNumINPI: { 
    type: 'string', 
    required: false,
    description: 'CPF/CNPJ/Número INPI do requerente'
  },
  form_requerente_endereco: { 
    type: 'string', 
    required: false,
    description: 'Endereço do requerente'
  },
  form_requerente_cidade: { 
    type: 'string', 
    required: false,
    description: 'Cidade do requerente'
  },
  form_requerente_estado: { 
    type: 'string', 
    required: false,
    pattern: '^[A-Z]{2}$',
    description: 'Estado/UF do requerente (2 letras)'
  },
  form_requerente_cep: { 
    type: 'string', 
    required: false,
    description: 'CEP do requerente'
  },
  form_requerente_pais: { 
    type: 'string', 
    required: false,
    description: 'País do requerente'
  },
  form_requerente_naturezaJuridica: { 
    type: 'string', 
    required: false,
    description: 'Natureza jurídica do requerente'
  },
  form_requerente_email: { 
    type: 'string', 
    required: false,
    format: 'email',
    description: 'E-mail do requerente'
  },

  // ========================================
  // DADOS DO PROCURADOR
  // ========================================
  form_procurador_nome: { 
    type: 'string', 
    required: false,
    description: 'Nome do procurador/advogado'
  },
  form_procurador_cpf: { 
    type: 'string', 
    required: false,
    description: 'CPF do procurador'
  },
  form_procurador_email: { 
    type: 'string', 
    required: false,
    format: 'email',
    description: 'E-mail do procurador'
  },
  form_procurador_numeroAPI: { 
    type: 'string', 
    required: false,
    description: 'Número de registro API do procurador'
  },
  form_procurador_numeroOAB: { 
    type: 'string', 
    required: false,
    description: 'Número OAB do procurador'
  },
  form_procurador_uf: { 
    type: 'string', 
    required: false,
    pattern: '^[A-Z]{2}$',
    description: 'UF da OAB do procurador'
  },
  form_procurador_escritorio_nome: { 
    type: 'string', 
    required: false,
    description: 'Nome do escritório do procurador'
  },
  form_procurador_escritorio_cnpj: { 
    type: 'string', 
    required: false,
    description: 'CNPJ do escritório do procurador'
  },

  // ========================================
  // DADOS ESPECÍFICOS DO TIPO: RECURSO INDEFERIMENTO
  // ========================================
  form_TextoDaPetição: { 
    type: 'string', 
    required: false,
    description: 'Texto principal da petição - contém a argumentação e fundamentação do recurso'
  },
  
  form_Anexos: { 
    type: 'array', 
    required: false,
    description: 'Lista de anexos da petição com descrição e nome do arquivo',
    itemSchema: {
      type: 'object',
      properties: {
        descricao: { type: 'string', description: 'Descrição do anexo' },
        nomeArquivo: { type: 'string', description: 'Nome do arquivo' }
      }
    }
  },

  // ========================================
  // METADADOS GERAIS
  // ========================================
  textoPeticao: { 
    type: 'string', 
    required: true,
    description: 'Texto completo da petição (não indexável)'
  },
  urlPdf: { 
    type: 'string', 
    required: false,
    format: 'uri',
    description: 'URL do PDF original'
  },
  dataProcessamento: { 
    type: 'string', 
    required: true,
    format: 'date-time',
    description: 'Data/hora de processamento (ISO 8601)'
  }
};

/**
 * Valida um objeto contra o schema
 * @param {Object} objeto - Objeto a validar
 * @returns {Object} { valido: boolean, erros: string[] }
 */
export function validarRecursoIndef(objeto) {
  const erros = [];

  // Valida campos obrigatórios
  const obrigatorios = Object.entries(RECURSO_INDEF_SCHEMA)
    .filter(([_, def]) => def.required)
    .map(([key, _]) => key);

  for (const campo of obrigatorios) {
    if (!(campo in objeto) || objeto[campo] === null || objeto[campo] === undefined) {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    }
  }

  // Valida tipos
  for (const [campo, def] of Object.entries(RECURSO_INDEF_SCHEMA)) {
    if (!(campo in objeto)) continue;

    const valor = objeto[campo];
    if (valor === null || valor === undefined) continue;

    // Verifica tipo
    if (typeof valor !== def.type && def.type !== 'array') {
      erros.push(`Tipo incorreto para ${campo}: esperado ${def.type}, recebido ${typeof valor}`);
    }

    // Verifica valor fixo (se aplicável)
    if (def.value && valor !== def.value) {
      erros.push(`Valor inválido para ${campo}: esperado ${def.value}, recebido ${valor}`);
    }

    // Verifica range numérico (se aplicável)
    if (def.min !== undefined && valor < def.min) {
      erros.push(`${campo} abaixo do mínimo: ${valor} < ${def.min}`);
    }
    if (def.max !== undefined && valor > def.max) {
      erros.push(`${campo} acima do máximo: ${valor} > ${def.max}`);
    }

    // Verifica padrão regex (se aplicável)
    if (def.pattern && !new RegExp(`^${def.pattern}$`).test(valor)) {
      erros.push(`${campo} não corresponde ao padrão esperado: ${valor}`);
    }
  }

  return {
    valido: erros.length === 0,
    erros
  };
}
