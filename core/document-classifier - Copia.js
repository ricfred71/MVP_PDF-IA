/**
 * core/document-classifier.js
 * 
 * Classificador de documentos jurídicos
 * Migrado e refatorado de: content/ipas/peticao_processor.js
 * 
 * MUDANÇAS:
 * - Função → Classe
 * - Suporte a petições E documentos oficiais
 * - Score de confiança adicionado
 * - Mantém switch completo do IPAS (10 tipos testados)
 * - Remove dependências externas
 * 
 * @version 1.0.0
 * @migrated 26/01/2026
 */

/**
 * Classe DocumentClassifier
 * Identifica tipo e categoria de documentos jurídicos
 */
export class DocumentClassifier {
  /**
   * Classifica um documento baseado no texto
   * 
   * @param {string} texto - Texto completo do documento
   * @returns {Object} { categoriaId, tipoId, subtipoId, confianca, tipoOriginal }
   */
  classificar(texto) {
    // VALIDAÇÃO: Verifica se o texto é válido (não nulo/vazio e string)
    if (!texto || typeof texto !== 'string') {
      throw new Error('[DocumentClassifier] Texto inválido para classificação');
    }
    
    // LOG: Informa início da classificação com tamanho do documento
    console.log(`[DocumentClassifier] Iniciando classificação (${texto.length} caracteres)`);
    
    // ETAPA 1: Identifica categoria principal (PETIÇÃO vs DOCUMENTO OFICIAL)
    // Esta é a ÚNICA parte que você quer acompanhar, o resto foi comentado
    const categoria = this._identificarCategoria(texto);
    
    console.log(`[DocumentClassifier] 📋 Categoria detectada: "${categoria}"`);
    
    // ETAPA 2: Identifica tipo específico dentro da categoria detectada
    // (ex: RECURSO_INDEFERIMENTO, OPOSICAO, etc.)
    const tipoOriginal = this._identificarTipo(texto, categoria);
    
    // ETAPA 3: Converte tipo original em ID padronizado
    // (ex: "OPOSICAO" → "pet_oposicao")
    const tipoId = this._mapearParaTipoId(tipoOriginal, categoria);
    
    // ETAPA 4: Calcula um score de confiança (0-1) baseado em heurísticas
    // Ajuda a indicar se a classificação é segura ou duvidosa
    const confianca = this._calcularConfianca(texto, tipoOriginal);
    
    // ETAPA 5: Converte categoria em ID final
    // Mapeia "pet" → "pet", "doc_oficial" → "doc_oficial", ou desconhecida
    const categoriaId = categoria === 'pet' ? 'pet' : 
                        categoria === 'doc_oficial' ? 'doc_oficial' : 
                        'categoriaDesconhecida';
    
    // LOG: Exibe resultado final da classificação com nível de confiança em %
    console.log(
      `[DocumentClassifier] Classificado: ${categoriaId} > ${tipoId} ` +
      `(confiança: ${(confianca * 100).toFixed(0)}%)`
    );
    
    // RETORNO: Objeto com resultado da classificação
    return {
      categoriaId,
      tipoId,
      subtipoId: '',
      confianca,
      tipoOriginal // Mantém tipo do IPAS para compatibilidade
    };
  }
  
  /**
   * Identifica se é petição ou documento oficial
   * @private
   */
  _identificarCategoria(texto) {
    // Extrai primeiros 250 caracteres para análise
    const texto250 = texto.substring(0, 250);
    
    console.log('[DocumentClassifier] Analisando primeiros 250 caracteres:', texto250);
    
    // PETIÇÃO: Sequência de 17 dígitos + data (dd/mm/aaaa hh:mm)
    // Exemplo: 31123252330338563 16/12/2024 12:29
    const regexPeticao = /\d{17}\s+\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/;
    
    // DOCUMENTO OFICIAL: Presença de "Processo de registro de marca" OU "Petição de Marca" nos primeiros 250 caracteres
    const regexDocOficial = /(Processo de registro de marca|Petição de Marca)/i;
    
    let categoria = 'categoriaDesconhecida';
    
    // 1. Verifica PETIÇÃO primeiro
    if (regexPeticao.test(texto250)) {
      categoria = 'pet';
      console.log('[DocumentClassifier] ✅ CATEGORIA IDENTIFICADA: PETIÇÃO (sequência 17 dígitos + data encontrada)');
    } 
    // 2. Se não for petição, verifica DOCUMENTO OFICIAL
    else if (regexDocOficial.test(texto250)) {
      categoria = 'doc_oficial';
      console.log('[DocumentClassifier] ✅ CATEGORIA IDENTIFICADA: DOCUMENTO OFICIAL (strings indicadoras encontradas)');
    } 
    // 3. Nenhum padrão reconhecido
    else {
      console.log('[DocumentClassifier] ⚠️ CATEGORIA IDENTIFICADA: CATEGORIA DESCONHECIDA (nenhum padrão reconhecido)');
    }
    
    return categoria;
  }
  
  /**
   * Identifica tipo específico baseado na categoria
   * @private
   */
  _identificarTipo(texto, categoria) {
    // SE é petição: usa método específico para petições
    if (categoria === 'pet') {
      return this._identificarTipoPeticao(texto);
    } 
    // SENÃO se é documento oficial: usa método específico para docs oficiais
    else if (categoria === 'doc_oficial') {
      return this._identificarTipoDocOficial(texto);
    } 
    // SENÃO: categoria desconhecida, retorna tipo genérico
    else {
      return 'GENERICO';
    }
  }
  
  /**
   * Identifica tipo de petição (REUTILIZA LÓGICA DO IPAS)
   * @private
   */
  _identificarTipoPeticao(texto) {
    // MÉTODO 1: Procura variável "tipoPeticao" no código do documento
    // Padrão esperado: tipoPeticao: "OPOSICAO" ou tipo_da_peticao: "RECURSO_INDEFERIMENTO"
    const patterns = [
      /tipoPeticao[:\s]*["']?([A-Z_]+)["']?/i,
      /tipo[_\s]da[_\s]peticao[:\s]*["']?([A-Z_]+)["']?/i,
      /tipo[:\s]*["']?([A-Z_]+)["']?/i
    ];
    
    // Testa cada padrão em sequência
    for (const pattern of patterns) {
      const match = texto.match(pattern);
      // Se encontrou correspondência, extrai e normaliza o tipo
      if (match && match[1]) {
        const tipo = match[1].toUpperCase().replace(/\s+/g, '_');
        console.log(`[DocumentClassifier] Tipo via variável: ${tipo}`);
        return tipo;
      }
    }
    
    // MÉTODO 2: Fallback - identifica por palavras-chave no texto
    // Usado quando não há variável explícita de tipo
    console.log('[DocumentClassifier] Usando detecção por palavras-chave...');
    
    const textoLower = texto.toLowerCase();
    
    // MAPEIA OS 10 TIPOS DO IPAS COM SUAS PALAVRAS-CHAVE ASSOCIADAS
    // Exemplo: Se encontrar "oposição" ou "oposicao", é OPOSICAO
    const tiposMap = {
      'RECURSO_INDEFERIMENTO': [
        'recurso contra o indeferimento',
        'recurso contra indeferimento',
        'indeferimento',
        'recurso contra a decisão'
      ],
      'OPOSICAO': [
        'oposição',
        'oposicao',
        'manifesta oposição',
        'apresenta oposição'
      ],
      'MANIFESTACAO': [
        'manifestação',
        'manifestacao',
        'vem manifestar',
        'manifesta-se'
      ],
      'CONTESTACAO': [
        'contestação',
        'contestacao',
        'contesta',
        'vem contestar'
      ],
      'NULIDADE': [
        'nulidade',
        'anulação',
        'anulacao',
        'ação de nulidade',
        'pedido de nulidade'
      ],
      'CADUCIDADE': [
        'caducidade',
        'declaração de caducidade',
        'pedido de caducidade'
      ],
      'PEDIDO_REGISTRO': [
        'pedido de registro',
        'requer o registro',
        'apresenta pedido'
      ],
      'RECURSO_EXIGENCIA': [
        'recurso contra exigência',
        'recurso de exigência',
        'exigência técnica'
      ],
      'CUMPRIMENTO_EXIGENCIA': [
        'cumprimento de exigência',
        'atendimento de exigência',
        'cumpre exigência'
      ],
      'JUNTADA_DOCUMENTO': [
        'juntada de documento',
        'apresenta documento',
        'junta aos autos'
      ]
    };
    
    // BUSCA: Procura por tipo mais específico primeiro na ordem do mapa
    // Para cada tipo, verifica se ALGUMA de suas palavras-chave aparece no texto
    for (const [tipo, palavrasChave] of Object.entries(tiposMap)) {
      for (const palavra of palavrasChave) {
        if (textoLower.includes(palavra)) {
          console.log(`[DocumentClassifier] Tipo via palavra-chave: ${tipo} ("${palavra}")`);
          return tipo;
        }
      }
    }
    
    // FALLBACK: Se nenhum tipo foi identificado, usa genérico
    console.warn('[DocumentClassifier] Tipo não identificado, usando GENERICO');
    return 'GENERICO';
  }
  
  /**
   * Identifica tipo de documento oficial do INPI
   * @private
   */
  _identificarTipoDocOficial(texto) {
    // Converte todo o texto para minúsculas para facilitar busca case-insensitive
    const textoLower = texto.toLowerCase();
    
    // MAPEIA OS TIPOS DE DOCUMENTOS OFICIAIS COM SUAS PALAVRAS-CHAVE
    // Documentos emitidos pelo INPI em resposta a petições
    const tiposMap = {
      'DESPACHO_DECISORIO': [
        'despacho decisório',
        'despacho de decisão',
        'decide'
      ],
      'NOTIFICACAO_EXIGENCIA': [
        'notificação de exigência',
        'exigência técnica',
        'exige-se'
      ],
      'NOTIFICACAO_OPOSICAO': [
        'notificação de oposição',
        'ciência de oposição'
      ],
      'INTIMACAO': [
        'intimação',
        'intima-se',
        'fica intimado'
      ],
      'PARECER_TECNICO': [
        'parecer técnico',
        'parecer do inpi',
        'análise técnica'
      ]
    };
    
    // BUSCA: Procura por tipo na ordem do mapa
    for (const [tipo, palavrasChave] of Object.entries(tiposMap)) {
      for (const palavra of palavrasChave) {
        if (textoLower.includes(palavra)) {
          console.log(`[DocumentClassifier] Doc oficial: ${tipo} ("${palavra}")`);
          return tipo;
        }
      }
    }
    
    // FALLBACK: Se nenhum tipo específico identificado, retorna tipo genérico
    return 'DOC_OFICIAL_GENERICO';
  }
  
  /**
   * Mapeia tipo original para ID canônico
   * @private
   */
  _mapearParaTipoId(tipoOriginal, categoria) {
    // SE é petição: mapeia tipo de petição para ID padronizado
    if (categoria === 'pet') {
      // Dicionário de mapeamento: tipo da petição → identificador canônico
      const mapa = {
        'RECURSO_INDEFERIMENTO': 'pet_recurso_indeferimento',
        'OPOSICAO': 'pet_oposicao',
        'MANIFESTACAO': 'pet_manifestacao',
        'CONTESTACAO': 'pet_contestacao',
        'NULIDADE': 'pet_nulidade',
        'CADUCIDADE': 'pet_caducidade',
        'PEDIDO_REGISTRO': 'pet_pedido_registro',
        'RECURSO_EXIGENCIA': 'pet_recurso_exigencia',
        'CUMPRIMENTO_EXIGENCIA': 'pet_cumprimento_exigencia',
        'JUNTADA_DOCUMENTO': 'pet_juntada_documento',
        'GENERICO': 'pet_generico'
      };
      
      // Retorna ID mapeado ou genérico se tipo não encontrado
      return mapa[tipoOriginal] || 'pet_generico';
    } 
    // SENÃO se é documento oficial: mapeia tipo de doc oficial para ID padronizado
    else if (categoria === 'doc_oficial') {
      // Dicionário de mapeamento: tipo do doc oficial → identificador canônico
      const mapa = {
        'DESPACHO_DECISORIO': 'doc_oficial_despacho_decisorio',
        'NOTIFICACAO_EXIGENCIA': 'doc_oficial_notificacao_exigencia',
        'NOTIFICACAO_OPOSICAO': 'doc_oficial_notificacao_oposicao',
        'INTIMACAO': 'doc_oficial_intimacao',
        'PARECER_TECNICO': 'doc_oficial_parecer_tecnico',
        'DOC_OFICIAL_GENERICO': 'doc_oficial_generico'
      };
      
      // Retorna ID mapeado ou genérico se tipo não encontrado
      return mapa[tipoOriginal] || 'doc_oficial_generico';
    } 
    // SENÃO: categoria desconhecida
    else {
      return 'desconhecido';
    }
  }
  
  /**
   * Calcula score de confiança baseado em heurísticas
   * @private
   */
  _calcularConfianca(texto, tipo) {
    // SE o tipo é genérico: retorna baixa confiança (30%)
    // Indica que a classificação foi feita com pouca certeza
    if (tipo === 'GENERICO' || tipo === 'DOC_OFICIAL_GENERICO') {
      return 0.3;
    }
    
    // CÁLCULO: Conta quantas vezes o tipo aparece no texto (indicador de certeza)
    // Usa expressão regular para encontrar variações do tipo (com espaços em vez de underscore)
    const regex = new RegExp(tipo.replace(/_/g, '\\s+'), 'gi');
    const matches = (texto.match(regex) || []).length;
    
    // FÓRMULA: Score base 60% + 10% por cada ocorrência, máximo 95%
    // Exemplo: 0 matches = 60%, 1 match = 70%, 2 matches = 80%, etc.
    // Limita a 95% para deixar margem de incerteza
    const score = Math.min(0.95, 0.6 + (matches * 0.1));
    
    return score;
  }
}
