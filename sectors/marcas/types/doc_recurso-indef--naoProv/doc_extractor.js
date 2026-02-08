/**
 * sectors/marcas/types/doc_recurso-indef--naoProv/doc_extractor.js
 * 
 * Extrator para Documento Oficial: Recurso contra Indeferimento - Não Provido
 */

import { validarDocRecursoIndefNaoProv } from './doc_schema.js';

export class DocRecursoIndefNaoProvExtractor {
  
  constructor(dataExtractor) {
    this.dataExtractor = dataExtractor;
  }
  
  /**
   * Extrai dados do documento oficial
   * @param {string} textoCompleto - Texto completo do PDF
   * @param {Object} classificacao - Objeto de classificação
   * @param {string} urlPdf - URL do PDF
   * @returns {Object} { storageKey, dados, validacao }
   */
  extract(textoCompleto, classificacao, urlPdf = '') {
    console.log('[DocRecursoIndefNaoProvExtractor] Extraindo dados do documento pdf.read.js - tudo que tem dentro do pdf...');

    const textoDocOficial = textoCompleto;
    
    // Extrai dados básicos
    const numeroProcesso = this._extrairNumeroProcesso(textoDocOficial);
    const dataDespacho = this._extrairDataDespacho(textoDocOficial);
    
    // Monta objeto de dados
    const dados = {
      // Metadados
      categoria: 'documento_oficial',
      tipo: classificacao.tipoId || 'recursoIndeferimentoNaoProvido',
      subtipo: classificacao.subtipoId || '',
      confianca: classificacao.confianca || 0,
      
      // Identificação
      form_numeroProcesso: numeroProcesso,
      form_dataDespacho: dataDespacho,
      form_nomePeticao: this._extrairNomePeticao(textoDocOficial),
      form_numeroProtocolo: this._extrairNumeroProtocolo(textoDocOficial),
      form_dataApresentacao: this._extrairDataApresentacao(textoDocOficial),
      form_requerente_nome: this._extrairRequerente(textoDocOficial),
      form_dataNotificacaoIndeferimento: this._extrairDataNotificacaoIndeferimento(textoDocOficial),
      form_nomeDecisao: this._extrairNomeDecisao(textoDocOficial),
      form_dataParecer: this._extrairDataParecer(textoDocOficial),
      form_numeroParecer: this._extrairNumeroParecer(textoDocOficial),
      textoAutomaticoEtapa1: this._extrairTextoAutomaticoEtapa1(textoDocOficial),
      textoAutomaticoEtapa2: this._extrairTextoAutomaticoEtapa2(textoDocOficial),
      textoParecer: this._extrairTextoParecer(textoDocOficial),
      form_tecnico: this._extrairTecnico(textoDocOficial),
      form_marca: this._extrairMarca(textoDocOficial),
      
      // Dados do despacho
      tipoDespacho: 'Recurso não provido',
      
      
      // Fundamentação legal
      artigosInvocados: this._extrairArtigosInvocados(textoDocOficial),
      
      // Decisão
      decisao: 'indeferido_mantido',
      motivoIndeferimento: this._extrairMotivoIndeferimento(textoDocOficial),
      
      // Anterioridades
      anterioridades: this._extrairAnterioridades(textoDocOficial),
      processosConflitantes: this._extrairProcessosConflitantes(textoDocOficial),
      
      // Metadados gerais
      textoCompleto: textoDocOficial,
      urlPdf: urlPdf,
      dataProcessamento: new Date().toISOString(),
      processor: this.constructor.name
    };

    // ========================================
    // ANONIMIZAÇÃO (LGPD) PARA IA
    // ========================================
    const listaLgpd = [
      'form_numeroProcesso',
      'form_dataDespacho',
      'form_nomePeticao',
      'form_numeroProtocolo',
      'form_dataApresentacao',
      'form_requerente_nome',
      'form_dataNotificacaoIndeferimento',
      'form_dataParecer',
      'form_numeroParecer',
      'form_marca'
    ];

    const textoParecerLimpo = this._removerCabecalhosRodapes(dados.textoParecer || '');
    const { textoParaIa, tokenMap } = this._tokenizarTextoParaIa(textoParecerLimpo, dados, listaLgpd);
    dados.textoParaIa = this._removerTextosRepetidosTextoParaIa(textoParaIa);
    
    // Validação
    const validacao = validarDocRecursoIndefNaoProv(dados);
    
    // Storage key
    const storageKey = `doc_oficial_${numeroProcesso}_recurso_nao_provido`;

    // Salva mapa de anonimização na sessão (para reversão posterior)
    this._salvarMapaAnonimizacao(storageKey, tokenMap);
    
    console.log('[DocRecursoIndefNaoProvExtractor] Extração concluída:', {
      storageKey,
      valido: validacao.valido,
      campos: validacao.campos_preenchidos
    });
    
    return {
      storageKey,
      dados,
      validacao
    };
  }
  
  // ========================================
  // MÉTODOS DE EXTRAÇÃO
  // ========================================
  
  /**
   * Remove caracteres de formatação (quebras de linha, tabs, espaços extras)
   */
  _limparFormatacao(texto) {
    if (!texto) return texto;
    return texto
      .replace(/\n/g, ' ')      // Remove quebras de linha
      .replace(/\t/g, ' ')      // Remove tabs
      .replace(/\s+/g, ' ')     // Normaliza espaços múltiplos em um único espaço
      .trim();                  // Remove espaços nas extremidades
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
          console.warn('[DocRecursoIndefNaoProvExtractor] Falha ao salvar mapa LGPD:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.warn('[DocRecursoIndefNaoProvExtractor] Erro ao salvar mapa LGPD:', error);
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
      form_numeroProcesso: 'PROCESSO_PRINCIPAL',
      form_dataDespacho: 'DATA_DESPACHO',
      form_nomePeticao: 'NOME_PETICAO',
      form_numeroProtocolo: 'PROTOCOLO_PRINCIPAL',
      form_dataApresentacao: 'DATA_APRESENTACAO',
      form_requerente_nome: 'REQUERENTE',
      form_dataNotificacaoIndeferimento: 'DATA_NOTIFICACAO_INDEFERIMENTO',
      form_dataParecer: 'DATA_PARECER',
      form_numeroParecer: 'NUMERO_PARECER',
      form_marca: 'MARCA'
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

    // 3) Tokenização de números de protocolo (12 dígitos)
    const protocoloRegex = /\b\d{12}\b/g;
    textoTokenizado = textoTokenizado.replace(protocoloRegex, (match) => createToken('PROTOCOLO_CITADO', match));

    // 4) Tokenização de números de processo (9 dígitos)
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

  _removerCabecalhosRodapes(texto) {
    if (!texto) return texto;

    const linhas = texto.split(/\r?\n/);
    const normalizar = (linha) => linha.replace(/\s+/g, ' ').trim();

    const counts = new Map();
    linhas.forEach((linha) => {
      const norm = normalizar(linha);
      if (!norm) return;
      counts.set(norm, (counts.get(norm) || 0) + 1);
    });

    const pageRegex = /^P[áa]gina\s+\d+\s+de\s+\d+$/i;
    const emailRegex = /\b[\w.\-]+@[\w.\-]+\.[A-Za-z]{2,}\b/;
    const urlRegex = /(?:https?:\/\/|www\.)/i;
    const phoneRegex = /\(\d{2}\)\s*\d{4,5}\s*[- ]?\d{4}/;
    const cepRegex = /\b\d{2}\.\d{3}-?\d{3}\b|\b\d{5}-\d{3}\b|\bCep\.?\s*\d{2}\.\d{3}-?\d{3}\b/i;
    const enderecoRegex = /\b(Rua|Avenida|Av\.?|Rodovia|Travessa|Alameda|Pra[çc]a|Bloco|Andar|Sala|Centro|Bairro|Setor|Conjunto)\b/i;
    const identificadorRegex = /\b(CNPJ|CPF|Telefone|Tel\.?|Central\s+de\s+Atendimento|Atendimento|Matriz)\b/i;

    const isCabecalhoRodape = (norm) => {
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

      return temSinal || norm.length >= 40;
    };

    const filtradas = linhas.filter((linha) => {
      const norm = normalizar(linha);
      return !isCabecalhoRodape(norm);
    });

    return filtradas.join('\n').trim();
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
  _extrairNumeroProcesso(texto) {
    const match = texto.match(/Processo\s+(\d{9})/i);
    if (match) return match[1];
    
    const matchPrimeiro = texto.match(/\b(\d{9})\b/);
    return matchPrimeiro ? matchPrimeiro[1] : null;
  }

  _extrairNomePeticao(texto) {
    const match = texto.match(/Processo\s+\d{9}\s+([\s\S]+?)\s+N[úu]mero\s+de\s+protocolo\s*:/i);
    return match ? this._limparFormatacao(match[1]) : null;
  }

  _extrairNumeroProtocolo(texto) {
    const match = texto.match(/N[úu]mero\s+de\s+protocolo\s*:\s*(\d{6,})/i);
    return match ? match[1] : null;
  }

  _extrairDataApresentacao(texto) {
    const match = texto.match(/Data\s+de\s+apresenta[cç][aã]o\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  _extrairRequerente(texto) {
    const match = texto.match(/Requerente\s*:\s*([\s\S]+?)\s+Indeferimento\s+do\s+pedido/i);
    return match ? this._limparFormatacao(match[1]) : null;
  }

  _extrairDataNotificacaoIndeferimento(texto) {
    const match = texto.match(/Notificada\s+(\d{2}\/\d{2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  _extrairNomeDecisao(texto) {
    const match = texto.match(/Recurso\s+n[ãa]o\s+provido\.?\s*Decis[aã]o\s+mantida/i);
    return match ? this._limparFormatacao(match[0]) : null;
  }

  _extrairDataParecer(texto) {
    const match = texto.match(/Data\s+do\s+parecer\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  _extrairNumeroParecer(texto) {
    const match = texto.match(/N[úu]mero\s+do\s+parecer\s*:\s*(\d{3,})/i);
    return match ? match[1] : null;
  }

  _extrairTextoAutomaticoEtapa1(texto) {
    const match = texto.match(/Processo\s+de\s+registro\s+de\s+marca[\s\S]+?N[úu]mero\s+do\s+parecer\s*:\s*\d+/i);
    return match ? this._limparFormatacao(match[0]) : null;
  }

  _extrairTextoAutomaticoEtapa2(texto) {
    const match = texto.match(/MINIST[ÉE]RIO\s+DO\s+DESENVOLVIMENTO,[\s\S]+?(?=Decis[aã]o\s+tomada\s+pelo\s+Presidente)/i);
    return match ? this._limparFormatacao(match[0]) : null;
  }

  //Resultado do PDF na etapa 1: tudo depois da parte automática do INPI (Recurso não provido. Decisão mantida  Data do parecer: 26/01/2026  Número do parecer: 133221) - 
  //texto do parecer em si
  _extrairTextoParecer(texto) {
    const match = texto.match(/N[úu]mero\s+do\s+parecer\s*:\s*\d+\s*([\s\S]+?)(?=\n[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,}\s*\n\s*Delegação\s+de\s+compet[eê]ncia|\nMINIST[ÉE]RIO|\nPRESID[ÊE]NCIA|$)/i);
    if (!match) return null;

    const textoParecer = match[1];
    return textoParecer;
  }

  _extrairTecnico(texto) {
    // Primeira regra: Captura nome (maiúsculas e minúsculas) antes de "Delegação de competência"
    // Exemplo: "(...).  RICARDO FREDERICO NICOL Delegação de competência"
    let match = texto.match(/(?:\.\ s+|\n\s*)([A-Za-záéíóúâêôãõç]+(?: [A-Za-záéíóúâêôãõç]+)*)\s+Delegação\s+de\s+compet[eê]ncia/i);
    if (match) return match[1].trim();
    
    // Segunda regra (fallback): Captura após "à consideração superior." até "Delegação de competência"
    match = texto.match(/à\s+considera[çc][ãa]o\s+superior\.?\s+([\s\S]+?)\s+Delegação\s+de\s+compet[eê]ncia/i);
    if (match) {
      const textoBruto = match[1].trim();
      // Extrai apenas a primeira palavra/nome em maiúsculas
      const nomeMaiuscula = textoBruto.match(/^([A-Za-záéíóúâêôãõç]+(?: [A-Za-záéíóúâêôãõç]+)*)/);
      return nomeMaiuscula ? nomeMaiuscula[1].trim() : textoBruto;
    }
    
    return null;
  }
  
  _extrairMarca(texto) {
    // Captura marca entre parênteses após "Afeta\nProcesso NNNNNNNNN\n(MARCA)"
    const match = texto.match(/Afeta[\s\n]+Processo[\s\n]+\d{9}[\s\n]+\(([^)]+)\)/i);
    return match ? match[1].trim() : null;
  }
  
  _extrairDataDespacho(texto) {
    const matchDataDecisao = texto.match(/Data\s+da\s+decis[ãa]o\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (matchDataDecisao) return matchDataDecisao[1];
    
    const matchPrimeiraData = texto.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
    return matchPrimeiraData ? matchPrimeiraData[1] : null;
  }
  
  // _extrairNumeroRPI(texto) {
  //   const match = texto.match(/RPI\s*[Nn][ºo°]\s*(\d+)/i);
  //   return match ? match[1] : null;
  // }
  
  _extrairTextoDespacho(texto) {
    // Texto entre "Recurso não provido" e próxima seção
    const match = texto.match(/Recurso\s+n[ãa]o\s+provido[.\s]+([\s\S]+?)(?=(?:Efetuadas\s+buscas|Matr[íi]cula\s+SIAPE|Processo\s+\d{9}|$))/i);
    if (match) return this._limparFormatacao(match[1]);
    
    // Fallback: primeiros 500 caracteres após "não provido"
    const matchSimples = texto.match(/n[ãa]o\s+provido[.\s]+([\s\S]{1,500})/i);
    return matchSimples ? this._limparFormatacao(matchSimples[1]) : null;
  }
  
  _extrairArtigosInvocados(texto) {
    const artigos = [];
    const regex = /(?:art|artigo)\s*\.?\s*(\d+)(?:\s*,?\s*(?:inc|inciso)\s*\.?\s*([IVX]+))?\b/gi;
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const numeroArtigo = match[1];
      const inciso = match[2] || '';
      
      // Ignora art. 212 e art. 169 (artigos procedimentais)
      if (numeroArtigo === '212' || numeroArtigo === '169') {
        continue;
      }
      
      // Normaliza formato: sempre "Art. XXX" ou "Art. XXX, inc. X"
      const artigoNormalizado = inciso 
        ? `Art. ${numeroArtigo}, inc. ${inciso}`
        : `Art. ${numeroArtigo}`;
      
      if (!artigos.includes(artigoNormalizado)) {
        artigos.push(artigoNormalizado);
      }
    }
    
    return artigos;
  }
  
  _extrairMotivoIndeferimento(texto) {
    // Captura após "FOI INDEFERIDO COM A SEGUINTE MOTIVAÇÃO:" até um dos marcadores de fim
    const match = texto.match(/FOI\s+INDEFERIDO\s+COM\s+A\s+SEGUINTE\s+MOTIVA[ÇC][ÃA]O\s*:([\s\S]+?)(?=alega[çc][õo]es\s+da\s+requerente|Inicialmente|No\s+m[ée]rito|Ap[óo]s\s+ter\s+sido\s+examinado|$)/i);
    if (match) return this._limparFormatacao(match[1]);
    
    return null;
  }
  
  _extrairAnterioridades(texto) {
    const anterioridades = [];
    
    // Extrai trecho entre "MARCA(S) APONTADA(S) COMO IMPEDITIVA(S):" e "Após ter sido examinado"
    const matchSecao = texto.match(/MARCA\(S\)\s+APONTADA\(S\)\s+COMO\s+IMPEDITIVA\(S\)\s*:([\s\S]+?)(?=Ap[óo]s\s+ter\s+sido\s+examinado|$)/i);
    
    if (matchSecao) {
      const secaoAnterioridades = matchSecao[1];
      
      // Captura todas as sequências de 9 dígitos na seção
      const regex = /\b(\d{9})\b/g;
      let match;
      
      while ((match = regex.exec(secaoAnterioridades)) !== null) {
        const processo = match[1];
        if (!anterioridades.includes(processo)) {
          anterioridades.push(processo);
        }
      }
    }
    
    // Padrões antigos (comentados, mantidos para referência)
    // const regex = /Processo\s+(\d{9})\s+\([^)]+anterioridade[^)]*\)/gi;
    // let match;
    // while ((match = regex.exec(texto)) !== null) {
    //   const processo = match[1];
    //   if (!anterioridades.includes(processo)) {
    //     anterioridades.push(processo);
    //   }
    // }
    
    return anterioridades;
  }
  
  _extrairProcessosConflitantes(texto) {
    const processos = [];
    const regex = /Processo\s+(\d{9})/gi;
    let match;
    
    while ((match = regex.exec(texto)) !== null) {
      const processo = match[1];
      if (!processos.includes(processo)) {
        processos.push(processo);
      }
    }
    
    // Remove o processo principal (primeiro encontrado)
    if (processos.length > 1) {
      processos.shift();
    }
    
    return processos;
  }
}
