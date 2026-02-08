/**
 * core/data-extractor.js
 * 
 * RESPONSABILIDADE: Extração estruturada de dados de PDFs (Petições e Documentos Oficiais)
 * - Extrai dados de petições (página 1)
 * - Extrai dados de documentos oficiais (despachos, indeferimentos, etc)
 * - Retorna objetos estruturados para salvar no storage
 */

class DataExtractor {
  
  /**
   * Extrai dados de uma PETIÇÃO e monta o objeto para storage
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - Objeto de classificação {categoriaId, tipoId, confianca}
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} - Objeto estruturado para salvar no storage
   */
  extrairDadosPeticao(textoCompleto, classificacao, urlPdf = '') {
    console.log('[DataExtractor] Extraindo dados de PETIÇÃO...');
    
    // Extrai primeira página (primeiros ~2000 caracteres geralmente contém todos os dados principais)
    const textoPaginaUm = textoCompleto.substring(0, 2000);
    
    // Extrai dados estruturados
    const peticao = {
      numeroPeticao: this._extrairNumeroPeticao(textoPaginaUm),
      numeroProcesso: this._extrairNumeroProcesso(textoPaginaUm),
      nossoNumero: this._extrairNossoNumero(textoPaginaUm),
      dataPeticao: this._extrairDataPeticao(textoPaginaUm)
    };
    
    const requerente = {
      nome: this._extrairRequerenteNome(textoPaginaUm),
      cpfCnpjNumINPI: this._extrairRequerenteCpfCnpjNumINPI(textoPaginaUm),
      endereco: this._extrairRequerenteEndereco(textoPaginaUm),
      cidade: this._extrairRequerenteCidade(textoPaginaUm),
      estado: this._extrairRequerenteEstado(textoPaginaUm),
      cep: this._extrairRequerenteCep(textoPaginaUm),
      pais: this._extrairRequerentePais(textoPaginaUm),
      naturezaJuridica: this._extrairRequerenteNaturezaJuridica(textoPaginaUm),
      email: this._extrairRequerenteEmail(textoPaginaUm)
    };
    
    const procurador = {
      nome: this._extrairProcuradorNome(textoPaginaUm),
      cpf: this._extrairProcuradorCpf(textoPaginaUm),
      email: this._extrairProcuradorEmail(textoPaginaUm),
      numeroAPI: this._extrairProcuradorNumeroAPI(textoPaginaUm),
      numeroOAB: this._extrairProcuradorNumeroOAB(textoPaginaUm),
      uf: this._extrairProcuradorUF(textoPaginaUm),
      escritorio_nome: this._extrairEscritorioNome(textoPaginaUm),
      escritorio_cnpj: this._extrairEscritorioCNPJ(textoPaginaUm)
    };
    
    // Monta objeto final para storage
    const storageKey = `peticao_${peticao.numeroProcesso}_${this._sanitizeFilename(peticao.numeroPeticao)}`;
    
    const objetoPeticao = {
      // Metadados de classificação
      categoria: 'peticao',
      tipo: classificacao.tipoId || '',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      
      // Dados da petição (flat structure para facilitar acesso)
      numeroPeticao: peticao.numeroPeticao,
      numeroProcesso: peticao.numeroProcesso,
      nossoNumero: peticao.nossoNumero,
      dataPeticao: peticao.dataPeticao,
      
      // Dados do requerente
      requerente_nome: requerente.nome,
      requerente_cpfCnpjNumINPI: requerente.cpfCnpjNumINPI,
      requerente_endereco: requerente.endereco,
      requerente_cidade: requerente.cidade,
      requerente_estado: requerente.estado,
      requerente_cep: requerente.cep,
      requerente_pais: requerente.pais,
      requerente_naturezaJuridica: requerente.naturezaJuridica,
      requerente_email: requerente.email,
      
      // Dados do procurador
      procurador_nome: procurador.nome,
      procurador_cpf: procurador.cpf,
      procurador_email: procurador.email,
      procurador_numeroAPI: procurador.numeroAPI,
      procurador_numeroOAB: procurador.numeroOAB,
      procurador_uf: procurador.uf,
      procurador_escritorio_nome: procurador.escritorio_nome,
      procurador_escritorio_cnpj: procurador.escritorio_cnpj,
      
      // Texto completo e metadados
      textoPeticao: textoCompleto,
      urlPdf: urlPdf,
      dataProcessamento: new Date().toISOString()
    };
    
    console.log('[DataExtractor] ✅ Dados da petição extraídos:', {
      storageKey,
      numeroProcesso: peticao.numeroProcesso,
      numeroPeticao: peticao.numeroPeticao,
      requerente: requerente.nome
    });
    
    return {
      storageKey,
      dados: objetoPeticao
    };
  }
  
  /**
   * Extrai dados de um DOCUMENTO OFICIAL e monta o objeto para storage
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - Objeto de classificação {categoriaId, tipoId, confianca}
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} - Objeto estruturado para salvar no storage
   */
  extrairDadosDocumentoOficial(textoCompleto, classificacao, urlPdf = '') {
    console.log('[DataExtractor] Extraindo dados de DOCUMENTO OFICIAL...');
    
    const numeroProcesso = this._extrairNumeroProcessoDocOficial(textoCompleto);
    const dataDespacho = this._extrairDataDespacho(textoCompleto);
    
    // Dados específicos para indeferimento
    let dadosEspecificos = {};
    
    if (classificacao.tipoId === 'despacho_indeferimento' || 
        textoCompleto.toLowerCase().includes('indeferimento')) {
      dadosEspecificos = {
        textoIndeferimento: this._extrairTextoIndeferimento(textoCompleto),
        anterioridades: this._extrairAnterioridades(textoCompleto),
        fundamentosLegais: this._extrairFundamentosLegais(textoCompleto),
        normasInfringidas: this._extrairNormasInfringidas(textoCompleto)
      };
    }
    
    // Monta objeto final para storage
    const tipoSimplificado = this._sanitizeFilename(classificacao.tipoId || 'documento');
    const storageKey = `doc_oficial_${numeroProcesso}_${tipoSimplificado}`;
    
    const objetoDocOficial = {
      // Metadados de classificação
      categoria: 'documento_oficial',
      tipo: classificacao.tipoId || '',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      
      // Dados do documento
      numeroProcesso: numeroProcesso,
      dataDespacho: dataDespacho,
      tipoDocumento: classificacao.tipoOriginal || '',
      
      // Dados específicos (se aplicável)
      ...dadosEspecificos,
      
      // Texto completo e metadados
      textoCompleto: textoCompleto,
      processoRelacionado: numeroProcesso,
      urlPdf: urlPdf,
      dataProcessamento: new Date().toISOString(),
      processor: this.constructor.name
    };
    
    console.log('[DataExtractor] ✅ Dados do documento oficial extraídos:', {
      storageKey,
      numeroProcesso,
      tipo: classificacao.tipoId
    });
    
    return {
      storageKey,
      dados: objetoDocOficial
    };
  }
  
  // ============================================================
  // MÉTODOS DE EXTRAÇÃO - PETIÇÃO
  // ============================================================
  
  /**
   * Extrai número da petição (12 dígitos)
   */
  _extrairNumeroPeticao(texto) {
    // Caso mais comum: "Petição de Marca 850240038509"
    const matchPeticaoDeMarca = texto.match(/\bPeti[cç][ãa]o\s+de\s+Marca\s+(\d{12})\b/i);
    if (matchPeticaoDeMarca) return matchPeticaoDeMarca[1];
    
    // Valor após o rótulo "Número da Petição:"
    const matchDepoisLabel = texto.match(/N[úu]mero\s+da\s+Peti[cç][ãa]o\s*:\s*(\d{12})\b/);
    if (matchDepoisLabel) return matchDepoisLabel[1];
    
    // Antes de "Número da Petição"
    const matchAntes = texto.match(/(\d{12})\s*(?=N[úu]mero\s+da\s+Peti[cç][ãa]o)/);
    if (matchAntes) return matchAntes[1];
    
    // Fallback: primeira ocorrência de 12 dígitos
    const matchPrimeiro = texto.match(/\b(\d{12})\b/);
    return matchPrimeiro ? matchPrimeiro[1] : null;
  }
  
  /**
   * Extrai número do processo (9 dígitos)
   */
  _extrairNumeroProcesso(texto) {
    // Valor após o rótulo "Número do Processo:"
    const matchDepoisLabel = texto.match(/N[úu]mero\s+do\s+Processo\s*:\s*(\d{9})\b/);
    if (matchDepoisLabel) return matchDepoisLabel[1];
    
    // Após data/hora: "26/01/2024 12:07 924360976 Número do Processo:"
    const matchAposDataHora = texto.match(/\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+(\d{9})\s+N[úu]mero\s+do\s+Processo\b/);
    if (matchAposDataHora) return matchAposDataHora[1];
    
    // Antes de "Número do Processo"
    const matchAntes = texto.match(/(\d{9})\s*(?=N[úu]mero\s+do\s+Processo)/);
    if (matchAntes) return matchAntes[1];
    
    // Fallback: primeira ocorrência de 9 dígitos
    const matchPrimeiro = texto.match(/\b(\d{9})\b/);
    return matchPrimeiro ? matchPrimeiro[1] : null;
  }
  
  /**
   * Extrai nosso número (17 dígitos)
   */
  _extrairNossoNumero(texto) {
    const match = texto.match(/\b((?:\d\.?){17})\b/);
    if (!match) return null;
    return match[1].replace(/\./g, '');
  }
  
  /**
   * Extrai data e hora da petição
   */
  _extrairDataPeticao(texto) {
    const regex = /(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})|(\d{2}:\d{2})\s*(\d{2}\/\d{2}\/\d{4})/;
    const match = texto.match(regex);
    if (!match) return null;
    
    if (match[1] && match[2]) return `${match[1]} ${match[2]}`;
    if (match[3] && match[4]) return `${match[4]} ${match[3]}`;
    
    return null;
  }
  
  /**
   * Extrai nome do requerente
   */
  _extrairRequerenteNome(texto) {
    const match = texto.match(/Nome(?:\s*\/\s*Raz[ãa]o\s+Social)?\s*:\s*(.*?)\s*(?=CPF\/CNPJ\/N[úu]mero\s+INPI\s*:)/s);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  }
  
  /**
   * Extrai CPF/CNPJ/Número INPI do requerente
   */
  _extrairRequerenteCpfCnpjNumINPI(texto) {
    const match = texto.match(
      /CPF\/CNPJ\/N[úu]mero\s+INPI\s*:\s*(.*?)(?=\s*(?:Endere[cç]o|Cidade|Estado|CEP|Pa[ií]s|Natureza\s+Jur[íi]dica|(?:e-?mail|email)|Dados\s+Gerais|Dados\s+do\s+Procurador\/Escrit[óo]rio)\b)/is
    );
    if (!match) return null;
    const value = match[1].trim();
    return value.length > 0 ? value : null;
  }
  
  /**
   * Extrai endereço do requerente
   */
  _extrairRequerenteEndereco(texto) {
    const match = texto.match(/Endereço:\s*(.*?)(?=\s*Cidade:)/s);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai cidade do requerente
   */
  _extrairRequerenteCidade(texto) {
    const match = texto.match(/Cidade:\s*(.*?)(?=\s*Estado:)/s);
    const cidade = match ? match[1].trim() : null;
    return cidade && cidade.length > 0 ? cidade : null;
  }
  
  /**
   * Extrai estado/UF do requerente
   */
  _extrairRequerenteEstado(texto) {
    const match = texto.match(/Estado:\s*(.*?)(?=\s*CEP:)/s);
    const estado = match ? match[1].trim() : null;
    return estado && estado.length > 0 ? estado : null;
  }
  
  /**
   * Extrai CEP do requerente
   */
  _extrairRequerenteCep(texto) {
    const match = texto.match(/CEP:\s*(.*?)(?=\s*Pais:)/s);
    const cep = match ? match[1].trim() : null;
    return cep && cep.length > 0 ? cep : null;
  }
  
  /**
   * Extrai país do requerente
   */
  _extrairRequerentePais(texto) {
    const match = texto.match(/Pa[ií]s\s*:\s*(.*?)(?=\s*Natureza\s+Jur[íi]dica\s*:)/s);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai natureza jurídica do requerente
   */
  _extrairRequerenteNaturezaJuridica(texto) {
    const match = texto.match(/Natureza\s+Jur[íi]dica\s*:\s*(.*?)(?=\s*(?:e-?mail|email)\s*:)/is);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai e-mail do requerente
   */
  _extrairRequerenteEmail(texto) {
    const match = texto.match(/(?:e-?mail|email)\s*:\s*([\w.\-]+@[\w.\-]+)/i);
    return match ? match[1].trim() : null;
  }
  
  // ============================================================
  // MÉTODOS DE EXTRAÇÃO - PROCURADOR
  // ============================================================
  
  /**
   * Extrai CPF do procurador
   */
  _extrairProcuradorCpf(texto) {
    const match = texto.match(/CPF\s*:\s*([\d.\-]{11,})/);
    if (!match) return null;
    const digits = match[1].replace(/\D/g, '');
    return digits.length === 11 ? digits : null;
  }
  
  /**
   * Extrai nome do procurador
   */
  _extrairProcuradorNome(texto) {
    const match = texto.match(/CPF\s*:\s*[\d.\-]{11,}\s*Nome\s*:\s*(.*?)(?=\s*UF\s*:)/s);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  }
  
  /**
   * Extrai UF do procurador
   */
  _extrairProcuradorUF(texto) {
    const match = texto.match(/UF\s*:\s*(\w{2})/);
    return match ? match[1] : null;
  }
  
  /**
   * Extrai número OAB do procurador
   */
  _extrairProcuradorNumeroOAB(texto) {
    const match = texto.match(/N[ºo°]\s*OAB\s*:\s*(\d[\d\sA-Za-z]{0,15})/);
    if (!match) return null;
    const value = match[1].trim().replace(/\s+/g, '');
    return value.length > 0 ? value : null;
  }
  
  /**
   * Extrai número API do procurador
   */
  _extrairProcuradorNumeroAPI(texto) {
    const match = texto.match(/N[ºo°]\s*API\s*:\s*(.*?)(?=\s*(?:e-?mail|email)\s*:)/is);
    const api = match ? match[1].trim() : null;
    return api && api.length > 0 ? api : null;
  }
  
  /**
   * Extrai e-mail do procurador
   */
  _extrairProcuradorEmail(texto) {
    const match = texto.match(/N[ºo°]\s*API\s*:.*?(?:e-?mail|email)\s*:\s*([\w.\-]+@[\w.\-]+)/is);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai CNPJ do escritório
   */
  _extrairEscritorioCNPJ(texto) {
    const match = texto.match(/Dados do Procurador\/Escritório\s*(\d{14})/);
    return match ? match[1] : null;
  }
  
  /**
   * Extrai nome do escritório
   */
  _extrairEscritorioNome(texto) {
    const match = texto.match(/\d{14}\s*CNPJ\s*:\s*Nome\s*:\s*(.*?)(?=\s*N[ºo°]\s*API\s*:)/s);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  }
  
  // ============================================================
  // MÉTODOS DE EXTRAÇÃO - DOCUMENTO OFICIAL
  // ============================================================
  
  /**
   * Extrai número do processo de documento oficial
   */
  _extrairNumeroProcessoDocOficial(texto) {
    // "Processo 929063775"
    const matchProcesso = texto.match(/Processo\s+(\d{9})/i);
    if (matchProcesso) return matchProcesso[1];
    
    // Fallback: primeira ocorrência de 9 dígitos
    const matchPrimeiro = texto.match(/\b(\d{9})\b/);
    return matchPrimeiro ? matchPrimeiro[1] : null;
  }
  
  /**
   * Extrai data do despacho
   */
  _extrairDataDespacho(texto) {
    // "Data da decisão 10/04/2024" ou "Data de depósito 29/12/2022"
    const matchDataDecisao = texto.match(/Data\s+da\s+decis[ãa]o\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (matchDataDecisao) return matchDataDecisao[1];
    
    const matchDataDeposito = texto.match(/Data\s+de\s+dep[óo]sito\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (matchDataDeposito) return matchDataDeposito[1];
    
    // Fallback: primeira data no formato dd/mm/aaaa
    const matchPrimeiraData = texto.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
    return matchPrimeiraData ? matchPrimeiraData[1] : null;
  }
  
  /**
   * Extrai texto de indeferimento
   */
  _extrairTextoIndeferimento(texto) {
    // Procura por texto após "A marca reproduz" ou similar
    const match = texto.match(/A marca reproduz.*?(?=(?:Efetuadas buscas|Matrícula SIAPE|$))/is);
    return match ? match[0].trim() : null;
  }
  
  /**
   * Extrai anterioridades (processos conflitantes)
   */
  _extrairAnterioridades(textoCompleto) {
    const anterioridades = [];
    const regex = /Processo\s+(\d{9})\s+\([^)]+\)/gi;
    let match;
    
    while ((match = regex.exec(textoCompleto)) !== null) {
      const processo = match[1];
      // Evita duplicatas e ignora o processo principal
      if (!anterioridades.includes(processo)) {
        anterioridades.push(processo);
      }
    }
    
    return anterioridades.length > 0 ? anterioridades : [];
  }
  
  /**
   * Extrai fundamentos legais
   */
  _extrairFundamentosLegais(texto) {
    const fundamentos = [];
    const regex = /Art\.\s*\d+(?:\s+inc\.\s+[IVX]+)?/gi;
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const fundamento = match[0];
      if (!fundamentos.includes(fundamento)) {
        fundamentos.push(fundamento);
      }
    }
    
    return fundamentos.length > 0 ? fundamentos : [];
  }
  
  /**
   * Extrai normas infringidas (texto completo dos artigos)
   */
  _extrairNormasInfringidas(texto) {
    const normas = [];
    const regex = /Art\.\s*\d+[^;]+;/g;
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      normas.push(match[0].trim());
    }
    
    return normas.length > 0 ? normas : [];
  }
  
  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  
  /**
   * Sanitiza nome de arquivo/chave para storage
   */
  _sanitizeFilename(str) {
    if (!str) return 'documento';
    return str
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '_') // Substitui caracteres especiais por _
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, '') // Remove underscores no início/fim
      .substring(0, 100); // Limita tamanho
  }
}

// Exporta como singleton
export default new DataExtractor();
