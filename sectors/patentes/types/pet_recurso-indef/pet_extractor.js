/**
 * sectors/patentes/types/pet_recurso-indef/pet_extractor.js
 * 
 * Extractor específico para: Recurso contra Indeferimento de Pedido de Patente
 * Implementa os métodos de captura específicos do tipo
 */

import { RECURSO_INDEF_SCHEMA, validarRecursoIndef } from './pet_schema.js';
import { sanitizeFilename } from '../base_extractor_utils.js';

export class RecursoIndefExtractor {
  
  /**
   * Extrai dados específicos do Recurso contra Indeferimento
   * Reutiliza dados genéricos (requerente, procurador, etc) do DataExtractor
   * 
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - { categoriaId, tipoId, confianca }
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} { storageKey, dados, validacao }
   */
  extract(textoCompleto, classificacao, urlPdf = '') {
    console.log('[RecursoIndefExtractor] Extraindo dados do Recurso contra Indeferimento...');
    
    // Primeira página (dados estruturais geralmente aqui)
    const textoPaginaUm = textoCompleto.substring(0, 2000);
    
    // ========================================
    // DADOS DA PETIÇÃO
    // ========================================
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
      nacionalidade: this._extrairRequerenteNacionalidade(textoPaginaUm),
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
    
    // ========================================
    // DADOS ESPECÍFICOS DO TIPO
    // ========================================

    // Dados específicos do tipo
    const dadosEspecificos = {
      form_Anexos: this._extrairAnexos(textoCompleto)
    };
    
    // ========================================
    // MONTA OBJETO FINAL
    // ========================================
    const storageKey = `peticao_${peticao.numeroProcesso}_${sanitizeFilename('recurso_indef')}_${peticao.numeroPeticao}`;
    
    const objetoFinal = {
      // Metadados de classificação
      categoria: 'peticao',
      setor: 'patentes',
      tipo: classificacao.tipoId || 'recursoIndeferimentoPedidoPatente',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      
      // Dados da petição
      form_numeroPeticao: peticao.numeroPeticao,
      form_numeroProcesso: peticao.numeroProcesso,
      form_nossoNumero: peticao.nossoNumero,
      form_dataPeticao: peticao.dataPeticao,
      
      // Dados do requerente
      form_requerente_nome: requerente.nome,
      form_requerente_cpfCnpjNumINPI: requerente.cpfCnpjNumINPI,
      form_requerente_endereco: requerente.endereco,
      form_requerente_cidade: requerente.cidade,
      form_requerente_estado: requerente.estado,
      form_requerente_cep: requerente.cep,
      form_requerente_pais: requerente.pais,
      form_requerente_nacionalidade: requerente.nacionalidade,
      form_requerente_naturezaJuridica: requerente.naturezaJuridica,
      form_requerente_email: requerente.email,
      
      // Dados do procurador
      form_procurador_nome: procurador.nome,
      form_procurador_cpf: procurador.cpf,
      form_procurador_email: procurador.email,
      form_procurador_numeroAPI: procurador.numeroAPI,
      form_procurador_numeroOAB: procurador.numeroOAB,
      form_procurador_uf: procurador.uf,
      form_procurador_escritorio_nome: procurador.escritorio_nome,
      form_procurador_escritorio_cnpj: procurador.escritorio_cnpj,
      
      // Texto completo e metadados
      textoPeticao: textoCompleto,
      urlPdf: urlPdf,
      dataProcessamento: new Date().toISOString(),
      processor: 'RecursoIndefExtractor',
      
      // Anexos
      form_Anexos: dadosEspecificos.form_Anexos
    };

    // ========================================
    // ANONIMIZAÇÃO (LGPD) PARA IA
    // ========================================
    const textoPeticaoLimpo = this._removerCabecalhoTextoPeticao(objetoFinal.textoPeticao);
    const listaLgpd = [
      'form_numeroPeticao',
      'form_numeroProcesso',
      'form_nossoNumero',
      'form_dataPeticao',
      'form_requerente_nome',
      'form_requerente_cpfCnpjNumINPI',
      'form_requerente_endereco',
      'form_requerente_cidade',
      'form_requerente_estado',
      'form_requerente_cep',
      'form_requerente_nacionalidade',
      'form_requerente_naturezaJuridica',
      'form_requerente_email',
      'form_procurador_nome',
      'form_procurador_cpf',
      'form_procurador_email',
      'form_procurador_numeroAPI',
      'form_procurador_numeroOAB',
      'form_procurador_uf',
      'form_procurador_escritorio_nome',
      'form_procurador_escritorio_cnpj'
    ];

    const { textoParaIa, tokenMap } = this._tokenizarTextoParaIa(textoPeticaoLimpo, objetoFinal, listaLgpd);
    objetoFinal.textoParaIa = this._removerTextosRepetidosTextoParaIa(textoParaIa);
    this._salvarMapaAnonimizacao(storageKey, tokenMap);
    
    // ========================================
    // VALIDAÇÃO
    // ========================================
    const validacao = validarRecursoIndef(objetoFinal);
    
    if (!validacao.valido) {
      console.warn('[RecursoIndefExtractor] ⚠️ Validação com erros:', validacao.erros);
    }
    
    console.log('[RecursoIndefExtractor] ✅ Dados extraídos:', {
      storageKey,
      numeroProcesso: peticao.numeroProcesso,
      numeroPeticao: peticao.numeroPeticao,
      requerente: requerente.nome,
      validado: validacao.valido
    });
    
    return {
      storageKey,
      dados: objetoFinal,
      validacao
    };
  }

  // ========================================
  // ANONIMIZAÇÃO (LGPD)
  // ========================================

  _salvarMapaAnonimizacao(storageKey, tokenMap) {
    if (!tokenMap || Object.keys(tokenMap.tokenToValue || {}).length === 0) return;
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.session) return;

    const mapaKey = `lgpd_map_${storageKey}`;
    try {
      chrome.storage.session.set({ [mapaKey]: tokenMap }, () => {
        if (chrome.runtime?.lastError) {
          console.warn('[RecursoIndefExtractor] Falha ao salvar mapa LGPD:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.warn('[RecursoIndefExtractor] Erro ao salvar mapa LGPD:', error);
    }
  }

  _tokenizarTextoParaIa(texto, dados, listaLgpd) {
    if (!texto) {
      return { textoParaIa: texto, tokenMap: { tokenToValue: {}, valueToToken: {} } };
    }

    const tokenState = {
      counters: {},
      valueToToken: new Map(),
      tokenToValue: {}
    };

    const escapeRegExp = (valor) => String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const createToken = (tipo, valor) => {
      const valueKey = String(valor);
      if (tokenState.valueToToken.has(valueKey)) {
        return tokenState.valueToToken.get(valueKey);
      }

      const next = (tokenState.counters[tipo] || 0) + 1;
      tokenState.counters[tipo] = next;
      const token = `[${tipo}_${next}]`;

      tokenState.valueToToken.set(valueKey, token);
      tokenState.tokenToValue[token] = valueKey;
      return token;
    };

    const replaceAll = (orig, valor, token) => {
      if (valor == null || valor === '') return orig;
      const regex = new RegExp(escapeRegExp(valor), 'g');
      return orig.replace(regex, token);
    };

    const fieldToTipo = {
      form_numeroPeticao: 'NUMERO_PETICAO',
      form_numeroPct: 'NUMERO_PCT',
      form_dataDeposito: 'DATA_DEPOSITO',
      form_inventor_nome: 'INVENTOR',
      form_numeroProcesso: 'PROCESSO_PRINCIPAL',
      form_nossoNumero: 'NOSSO_NUMERO',
      form_dataPeticao: 'DATA_PETICAO',
      form_requerente_nome: 'REQUERENTE',
      form_requerente_cpfCnpjNumINPI: 'CPF_CNPJ_REQUERENTE',
      form_requerente_endereco: 'ENDERECO_REQUERENTE',
      form_requerente_cidade: 'CIDADE_REQUERENTE',
      form_requerente_estado: 'UF_REQUERENTE',
      form_requerente_cep: 'CEP_REQUERENTE',
      form_requerente_nacionalidade: 'NACIONALIDADE_REQUERENTE',
      form_requerente_naturezaJuridica: 'NATUREZA_JURIDICA_REQUERENTE',
      form_requerente_email: 'EMAIL_REQUERENTE',
      form_procurador_nome: 'PROCURADOR',
      form_procurador_cpf: 'CPF_PROCURADOR',
      form_procurador_email: 'EMAIL_PROCURADOR',
      form_procurador_numeroAPI: 'API_PROCURADOR',
      form_procurador_numeroOAB: 'OAB_PROCURADOR',
      form_procurador_uf: 'UF_PROCURADOR',
      form_procurador_escritorio_nome: 'ESCRITORIO_PROCURADOR',
      form_procurador_escritorio_cnpj: 'CNPJ_ESCRITORIO'
    };

    let textoTokenizado = texto;

    // 1) Tokenização semântica dos dados já extraídos (lista LGPD)
    listaLgpd.forEach((campo) => {
      const valor = dados[campo];
      if (!valor) return;
      const tipo = fieldToTipo[campo] || 'DADO_LGPD';
      const token = createToken(tipo, valor);
      textoTokenizado = replaceAll(textoTokenizado, valor, token);
    });

    // 2) Tokenização de CNPJ (formato inteiro e formatado)
    const cnpjRegexFormatado = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
    const cnpjRegexInteiro = /\b\d{14}\b/g;
    textoTokenizado = textoTokenizado.replace(cnpjRegexFormatado, (match) => createToken('CNPJ', match));
    textoTokenizado = textoTokenizado.replace(cnpjRegexInteiro, (match) => createToken('CNPJ', match));

    // 3) Tokenização de CPF (11 dígitos)
    const cpfRegex = /\b\d{11}\b/g;
    textoTokenizado = textoTokenizado.replace(cpfRegex, (match) => createToken('CPF', match));

    // 4) Tokenização de números de protocolo (12 dígitos)
    const protocoloRegex = /\b\d{12}\b/g;
    textoTokenizado = textoTokenizado.replace(protocoloRegex, (match) => createToken('PROTOCOLO_CITADO', match));

    // 5) Tokenização de números de processo (9 dígitos)
    const processoRegex = /\b\d{9}\b/g;
    textoTokenizado = textoTokenizado.replace(processoRegex, (match) => createToken('PROCESSO_CITADO', match));

    return {
      textoParaIa: textoTokenizado,
      tokenMap: {
        tokenToValue: tokenState.tokenToValue,
        valueToToken: Object.fromEntries(tokenState.valueToToken)
      }
    };
  }

  _removerTextosRepetidosTextoParaIa(texto) {
    if (!texto) return texto;

    const linhas = texto.split(/\r?\n/);
    const normalizar = (linha) => linha.replace(/\s+/g, ' ').trim();

    const counts = new Map();
    linhas.forEach((linha) => {
      const norm = normalizar(linha);
      if (!norm) return;
      counts.set(norm, (counts.get(norm) || 0) + 1);
    });

    const emailRegex = /\b[\w.\-]+@[\w.\-]+\.[A-Za-z]{2,}\b/;
    const urlRegex = /(?:https?:\/\/|www\.)/i;
    const phoneRegex = /\(\d{2}\)\s*\d{4,5}\s*[- ]?\d{4}/;
    const cepRegex = /\b\d{2}\.\d{3}-?\d{3}\b|\b\d{5}-\d{3}\b|\bCep\.?\s*\d{2}\.\d{3}-?\d{3}\b/i;
    const enderecoRegex = /\b(Rua|Avenida|Av\.?|Rodovia|Travessa|Alameda|Pra[çc]a|Bloco|Andar|Sala|Centro|Bairro|Setor|Conjunto)\b/i;
    const identificadorRegex = /\b(CNPJ|CPF|Telefone|Tel\.?|Central\s+de\s+Atendimento|Atendimento|Matriz)\b/i;
    const pageRegex = /^P[áa]gina\s+\d+\s+de\s+\d+$/i;

    const isRepetidoCabRod = (norm) => {
      if (!norm) return false;
      if (pageRegex.test(norm)) return true;
      const repetido = (counts.get(norm) || 0) >= 2;
      if (!repetido) return false;

      const temSinal = emailRegex.test(norm)
        || urlRegex.test(norm)
        || phoneRegex.test(norm)
        || cepRegex.test(norm)
        || enderecoRegex.test(norm)
        || identificadorRegex.test(norm);

      const poucasPalavras = norm.split(' ').length <= 12;
      const tudoMaiusculo = norm === norm.toUpperCase() && /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(norm);

      return temSinal || poucasPalavras || tudoMaiusculo;
    };

    const filtradas = linhas.filter((linha) => {
      const norm = normalizar(linha);
      return !isRepetidoCabRod(norm);
    });

    return filtradas.join('\n').trim();
  }

  _removerCabecalhoTextoPeticao(texto) {
    if (!texto) return texto;

    const marcadorDeclaro = 'Declaro, sob as penas da lei,';
    const pageRegex = /\n\s*P[áa]gina\s+\d+\s+de\s+\d+/i;

    const posDeclaro = texto.indexOf(marcadorDeclaro);
    let textoBase = texto;

    if (posDeclaro !== -1) {
      textoBase = texto.slice(posDeclaro + marcadorDeclaro.length);
    }

    const matchPage = textoBase.match(pageRegex);
    if (!matchPage || matchPage.index == null) {
      return textoBase.trimStart();
    }

    const corte = matchPage.index + matchPage[0].length;
    return textoBase.slice(corte).trimStart();
  }
  
  // ========================================
  // MÉTODOS DE EXTRAÇÃO - PETIÇÃO
  // ========================================
  
  /**
   * Extrai número da petição (12 dígitos)
   */
  _extrairNumeroPeticao(texto) {
    const matchPeticaoDePatente = texto.match(/\bPeti[cç][ãa]o\s+de\s+Patente\s+(\d{12})\b/i);
    if (matchPeticaoDePatente) return matchPeticaoDePatente[1];
    
    const matchDepoisLabel = texto.match(/N[úu]mero\s+da\s+Peti[cç][ãa]o\s*:\s*(\d{12})\b/);
    if (matchDepoisLabel) return matchDepoisLabel[1];
    
    const matchAntes = texto.match(/(\d{12})\s*(?=N[úu]mero\s+da\s+Peti[cç][ãa]o)/);
    if (matchAntes) return matchAntes[1];
    
    const matchPrimeiro = texto.match(/\b(\d{12})\b/);
    return matchPrimeiro ? matchPrimeiro[1] : null;
  }
  
  /**
   * Extrai número do processo (9 dígitos)
   */
  _extrairNumeroProcesso(texto) {
    const matchBr = texto.match(/\b(BR\d{8,}-?\d?)\b/i);
    if (matchBr) return matchBr[1].replace(/[^0-9A-Za-z]/g, '');

    const matchDepoisLabel = texto.match(/N[úu]mero\s+do\s+Processo\s*:\s*(\d{9})\b/);
    if (matchDepoisLabel) return matchDepoisLabel[1];
    
    const matchAposDataHora = texto.match(/\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+(\d{9})\s+N[úu]mero\s+do\s+Processo\b/);
    if (matchAposDataHora) return matchAposDataHora[1];
    
    const matchAntes = texto.match(/(\d{9})\s*(?=N[úu]mero\s+do\s+Processo)/);
    if (matchAntes) return matchAntes[1];
    
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
    const regex = /(\d{2}\/\d{2}\/\d{4})\s+[\d\s]*(\d{2}:\d{2})/;
    const match = texto.match(regex);
    if (!match) return null;
    
    return `${match[1]} ${match[2]}`;
  }
  
  /**
   * Extrai nome do requerente
   */
  _extrairRequerenteNome(texto) {
    const match = texto.match(/Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
    return match ? match[1].trim().replace(/\s+/g, ' ') : null;
  }
  
  /**
   * Extrai CPF/CNPJ/Número INPI do requerente
   */
  _extrairRequerenteCpfCnpjNumINPI(texto) {
    const match = texto.match(/CPF\/CNPJ\s*:\s*(\d+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai endereço do requerente
   */
  _extrairRequerenteEndereco(texto) {
    const match = texto.match(/Endere[çc]o\s*:\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai cidade do requerente
   */
  _extrairRequerenteCidade(texto) {
    const match = texto.match(/Cidade\s*:\s*([^\n]+)/i);
    const cidade = match ? match[1].trim() : null;
    return cidade && cidade.length > 0 ? cidade : null;
  }
  
  /**
   * Extrai estado/UF do requerente
   */
  _extrairRequerenteEstado(texto) {
    const match = texto.match(/Estado\s*:\s*([^\n]+)/i);
    const estado = match ? match[1].trim() : null;
    return estado && estado.length > 0 ? estado : null;
  }
  
  /**
   * Extrai CEP do requerente
   */
  _extrairRequerenteCep(texto) {
    const match = texto.match(/CEP\s*:\s*([^\n]+)/i);
    const cep = match ? match[1].trim() : null;
    return cep && cep.length > 0 ? cep : null;
  }
  
  /**
   * Extrai país do requerente
   */
  _extrairRequerentePais(texto) {
    const match = texto.match(/Pa[ií]s\s*:\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai nacionalidade do requerente
   */
  _extrairRequerenteNacionalidade(texto) {
    const match = texto.match(/Nacionalidade\s*:\s*([^\n]+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai natureza jurídica do requerente
   */
  _extrairRequerenteNaturezaJuridica(texto) {
    const match = texto.match(/Tipo\s+de\s+Pessoa\s*:\s*([^\n]+)/i);
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
   * Extrai nome do procurador (nome do escritório)
   * O nome do procurador na estrutura esperada é o nome do escritório
   */
  _extrairProcuradorNome(texto) {
    // Busca o nome do escritório após "Escrit[óo]rio:"
    return this._extrairEscritorioNome(texto);
  }
  
  /**
   * Extrai UF do procurador
   */
  _extrairProcuradorUF(texto) {
    // UF do procurador está na segunda ocorrência de "Estado:"
    const estadoRegex = /Estado\s*:\s*([^\n]+)/gi;
    const estados = [];
    let m;
    while ((m = estadoRegex.exec(texto)) !== null) {
      estados.push(m[1].trim());
    }

    if (estados.length >= 2) {
      const uf = estados[1];
      return uf && uf.length > 0 ? uf : null;
    }

    // Fallback para "UF:"
    const match = texto.match(/UF\s*:\s*(\w{2})/);
    return match ? match[1] : null;
  }
  
  /**
   * Extrai número OAB do procurador
   */
  _extrairProcuradorNumeroOAB(texto) {
    const match = texto.match(/N[ºo°]\s*OAB\s*:\s*([^\n]+)/i);
    if (!match) return null;
    const value = match[1].trim();
    return value && value.length > 0 && value !== '-' ? value : null;
  }
  
  /**
   * Extrai número API do procurador
   */
  _extrairProcuradorNumeroAPI(texto) {
    const match = texto.match(/(?:N[ºo°]|N[uú]mero)\s*API\s*:\s*(\d+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai e-mail do procurador
   */
  _extrairProcuradorEmail(texto) {
    const match = texto.match(/(?:e-?mail|email)\s*:\s*([\w.\-]+@[\w.\-]+)/i);
    return match ? match[1].trim() : null;
  }
  
  /**
   * Extrai CNPJ do escritório
   * Busca após "Escrit[óo]rio:" e depois "CNPJ:"
   */
  _extrairEscritorioCNPJ(texto) {
    const match = texto.match(/CNPJ\s*:\s*(\d{14})/i);
    return match ? match[1] : null;
  }
  
  /**
   * Extrai nome do escritório
   * Busca por "Escrit[óo]rio:" seguido de "Nome ou Raz[ãa]o Social:"
   */
  _extrairEscritorioNome(texto) {
    // Padrão 1: Busca "Nome ou Razão Social:" na seção de procurador/escritório
    let match = texto.match(/Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
    if (match) {
      const nome = match[1].trim();
      // Verifica se está na seção de procurador (não requerente) procurando por "Escritório" ou "Procurador" nas linhas anteriores
      return nome.length > 0 ? nome : null;
    }
    
    // Padrão 2: Após "Escritório:" procura "Nome ou Razão Social:"
    match = texto.match(/Escrit[óo]rio\s*:[\s\S]*?Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
    if (match) return match[1].trim();
    
    // Padrão 3: Busca por "Dados do Procurador"
    match = texto.match(/Dados\s+do\s+Procurador[\s\S]*?Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
    if (match) return match[1].trim();
    
    return null;
  }
  
  
  
  // ========================================
  // MÉTODOS ESPECÍFICOS DO TIPO: RECURSO INDEFERIMENTO
  // ========================================
  
  /**
   * Extrai o texto da petição
   * Localiza entre "Classes objeto do recurso NCL" (com dígitos) e "Texto da Petição"
   * @private
   */
  _extrairTextoDaPetição(texto) {
    const match = texto.match(/Classes\s+objeto\s+do\s+recurso\s+NCL[\d()\s]+([\s\S]*?)Texto\s+da\s+Peti[çc][ãa]o/i);
    
    if (match && match[1]) {
      let textoExtraido = match[1].trim();
      // Remove "Página X de Y" do início
      textoExtraido = textoExtraido.replace(/^Página\s+\d+\s+de\s+\d+\s*\n?\s*/i, '');
      // Remove "À" ou "A" do início se presente
      textoExtraido = textoExtraido.replace(/^[ÀA]\s+/i, '');
      return textoExtraido.trim();
    }
    
    return null;
  }
  
  /**
   * Extrai os anexos da petição
   * Localiza tabela com colunas "Tipo Anexo" e "Nome do Arquivo"
   * Entre "Nome Tipo Anexo" e "Declaro, sob as penas da lei,"
   * @private
   */
  _extrairAnexos(texto) {
    // Extrai bloco entre "Nome Tipo Anexo" e "Declaro"
    const blocoMatch = texto.match(/Nome\s+Tipo\s+Anexo\s*\n([\s\S]*?)(?:\n\s*Documentos anexados|\nDeclaro)/i);
    
    if (!blocoMatch || !blocoMatch[1]) {
      return [];
    }
    
    const blocoAnexos = blocoMatch[1];
    const listaDeAnexos = [];
    
    // Split por linhas
    const linhas = blocoAnexos.split('\n');
    let tipoAtual = null;
    
    for (let linha of linhas) {
      linha = linha.trim();
      if (!linha) continue;
      
      // Verifica se a linha contém extensão de arquivo
      if (/\.(pdf|doc|docx|xls|xlsx|txt|jpg|png|jpeg)$/i.test(linha)) {
        // Encontrou uma linha com arquivo
        // Separa tipo do nome
        const partes = linha.split(/\s+/);
        
        if (partes.length >= 2) {
          // Primeiro item é o tipo
          const tipo = partes[0];
          // Resto é o nome do arquivo
          const nome = partes.slice(1).join(' ');
          
          listaDeAnexos.push({
            'Tipo Anexo': tipo,
            'Nome': nome
          });
        }
      }
    }
    
    return listaDeAnexos;
  }
}
