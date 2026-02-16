/**
 * sectors/patentes/types/doc_recurso-indef--naoProv/doc_extractor.js
 * 
 * Extrator para Documento Oficial: Recurso contra Indeferimento - Não Provido
 * Extrai dados do documento oficial de decisão de recurso
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
  extract(textoCompleto, classificacao, urlPdf = '', options = {}) {
    console.log('[DocRecursoIndefNaoProvExtractor] Extraindo dados do documento oficial...');

    const textoDocOficial = textoCompleto || '';
    const confiancaNormalizada = this._normalizarConfianca(classificacao?.confianca);
    const numeroProcesso = this._extrairNumeroProcesso(textoDocOficial);
    const nomeDecisao = this._extrairNomeDecisao(textoDocOficial);
    const textoParecer = this._extrairTextoParecer(textoDocOficial);

    // Monta objeto de dados (Patentes)
    const dados = {
      categoria: 'documento_oficial',
      setor: 'patentes',
      tipo: classificacao?.tipoId || 'recursoIndeferimentoNaoProvido',
      subtipo: classificacao?.subtipoId || '',
      confianca: confiancaNormalizada,

      // Cabeçalho (campos do formulário)
      form_numeroProcesso: numeroProcesso,
      form_numeroPct: this._extrairNumeroPct(textoDocOficial),
      form_dataDeposito: this._extrairDataDeposito(textoDocOficial),
      form_prioridadeUnionista: this._extrairPrioridadeUnionista(textoDocOficial),
      form_requerente_nome: this._extrairDepositante(textoDocOficial),
      form_inventor_nome: this._extrairInventor(textoDocOficial),
      form_titulo: this._extrairTitulo(textoDocOficial),

      // Textos automáticos (blocos de cabeçalho)
      textoAutomaticoEtapa1: this._extrairTextoAutomaticoEtapa1(textoDocOficial),
      textoAutomaticoEtapa2: this._extrairTextoAutomaticoEtapa2(textoDocOficial),

      // Dados do despacho / decisão
      dataDespacho: this._extrairDataDespacho(textoDocOficial),
      dataNotificacaoIndeferimento: this._extrairDataNotificacaoIndeferimento(textoDocOficial),
      nomeDecisao: nomeDecisao,
      // ⚠️ REMOVIDO: tipoDespacho (redundante com `decisao`)
      // ⚠️ REMOVIDO: form_decisao (cópia de `nomeDecisao`, use nomeDecisao diretamente)
      decisao: 'indeferido_mantido',  // Código programático para processamento

      // Parecer
      textoParecer: textoParecer,
      tecnico: this._extrairTecnico(textoDocOficial),

      // Fundamentação
      // ⚠️ CAMPOS NÃO UTILIZADOS (Comentados - sem utilidade identificada)
      // artigosInvocados: this._extrairArtigosInvocados(textoDocOficial),
      // motivoIndeferimento: this._extrairMotivoIndeferimento(textoDocOficial),
      // Nota: Estes campos não são processados pela IA nem exibidos na UI.
      // Se necessários no futuro, descomente e verifique compatibilidade.

      // Conflitos (ainda não aplicável para patentes)
      // ⚠️ CAMPOS VAZIOS (Não relevante para patentes, apenas marcas)
      // anterioridades: [],
      // processosConflitantes: [],
      // Nota: Patentes não possuem "anterioridades" como marcas.
      // Estes campos são mantidos vazios para compatibilidade de schema.

      // Metadados gerais
      textoCompleto: textoDocOficial,
      urlPdf: urlPdf,
      dataProcessamento: new Date().toISOString(),
      processor: this.constructor.name
    };

    // Storage key
    const storageKey = options?.overrideStorageKey
      || `doc_oficial_${numeroProcesso || 'sem_processo'}_recurso_nao_provido_patente`;

    // ========================================
    // ANONIMIZAÇÃO (LGPD) PARA IA
    // ========================================
    const listaLgpd = [
      'form_numeroProcesso',
      'form_numeroPct',
      'form_prioridadeUnionista',
      'form_requerente_nome',
      'form_inventor_nome',
      'form_titulo',
      'dataDespacho',
      'dataNotificacaoIndeferimento'
    ];

    this._aplicarTermosLgpdCustomizados(dados, listaLgpd, options?.lgpdCustomTerms);

    const { textoParaIa, tokenMap } = this._tokenizarTextoParaIa(dados.textoParecer, dados, listaLgpd);
    dados.textoParaIa = this._removerTextosRepetidosTextoParaIa(textoParaIa);
    this._salvarMapaAnonimizacao(storageKey, tokenMap);

    // Auditoria pós-tokenização para detectar variantes que escaparam.
    const vazamentosLgpd = this._auditarVazamentoLgpd(dados.textoParaIa, dados, listaLgpd);
    if (vazamentosLgpd.length > 0) {
      console.warn('[DocRecursoIndefNaoProvExtractor] ⚠️ Possivel vazamento LGPD detectado:', vazamentosLgpd);
    }
    
    // Validação
    const validacao = validarDocRecursoIndefNaoProv(dados);
    
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

  _normalizarConfianca(confianca) {
    if (confianca == null) return 0;
    if (typeof confianca !== 'number' || Number.isNaN(confianca)) return 0;
    // Aceita 0-1 ou 0-100
    if (confianca > 1) return Math.max(0, Math.min(100, confianca));
    return Math.max(0, Math.min(1, confianca));
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

  _normalizarTermosLgpdCustomizados(customTerms) {
    if (!Array.isArray(customTerms)) return [];
    const vistos = new Set();

    return customTerms
      .map((item) => {
        if (typeof item === 'string') {
          const termo = String(item).trim();
          return termo ? { descricao: '', termo } : null;
        }

        if (!item || typeof item !== 'object') return null;
        const termo = String(item.termo || item.valor || '').trim();
        if (!termo) return null;
        const descricao = String(item.descricao || item.desc || '').trim();
        return { descricao, termo };
      })
      .filter(Boolean)
      .filter((item) => {
        const chave = item.termo.toLowerCase();
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });
  }

  _aplicarTermosLgpdCustomizados(dados, listaLgpd, customTerms) {
    const termos = this._normalizarTermosLgpdCustomizados(customTerms);
    if (!termos.length) return;

    termos.forEach((item, index) => {
      const campo = `lgpd_custom_${index + 1}`;
      dados[campo] = item.termo;
      listaLgpd.push(campo);
    });
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

    // Substitui com base nas regexes flexíveis geradas por campo.
    const replaceByRegexes = (orig, regexes, token) => {
      return regexes.reduce((acc, regex) => acc.replace(regex, token), orig);
    };

    // Estratégia por campo para lidar com separadores/abreviações.
    const fieldToStrategy = this._getLgpdFieldStrategies();

    const fieldToTipo = {
      form_numeroProcesso: 'PROCESSO_PRINCIPAL',
      form_numeroPct: 'PCT',
      form_prioridadeUnionista: 'PRIORIDADE_UNIONISTA',
      form_requerente_nome: 'DEPOSITANTE',
      form_inventor_nome: 'INVENTOR',
      form_titulo: 'TITULO',
      dataDespacho: 'DATA_DESPACHO',
      dataNotificacaoIndeferimento: 'DATA_NOTIFICACAO'
    };

    let textoTokenizado = texto;

    // 1) Tokenização semântica dos dados já extraídos (lista LGPD)
    listaLgpd.forEach((campo) => {
      const valor = dados[campo];
      if (!valor) return;
      const tipo = fieldToTipo[campo] || (campo.startsWith('lgpd_custom_') ? 'TERM_LGPD' : 'DADO_LGPD');
      const token = createToken(tipo, valor);

      const regexes = this._getLgpdRegexesForField(campo, valor, fieldToStrategy);
      if (!regexes.length) return;
      const totalMatches = this._countRegexMatches(textoTokenizado, regexes);
      if (totalMatches === 0) {
        console.log('[DocRecursoIndefNaoProvExtractor] LGPD sem match:', campo);
      } else {
        console.log('[DocRecursoIndefNaoProvExtractor] LGPD matches:', campo, totalMatches);
      }
      textoTokenizado = replaceByRegexes(textoTokenizado, regexes, token);
    });

    // 2) Tokenização de CNPJ (formato inteiro e formatado)
    const cnpjRegexFormatado = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
    const cnpjRegexInteiro = /\b\d{14}\b/g;
    textoTokenizado = textoTokenizado.replace(cnpjRegexFormatado, (match) => createToken('CNPJ', match));
    textoTokenizado = textoTokenizado.replace(cnpjRegexInteiro, (match) => createToken('CNPJ', match));

    // 3) Tokenização de números de protocolo (12 dígitos)
    const protocoloRegex = /\b\d{12}\b/g;
    textoTokenizado = textoTokenizado.replace(protocoloRegex, (match) => createToken('PROTOCOLO_CITADO', match));

    // 4) Tokenização de números de pedido (BR + dígitos + hífen)
    const pedidoRegex = /\bBR\s*\d{8,}\s*-\s*\d\b/gi;
    textoTokenizado = textoTokenizado.replace(pedidoRegex, (match) => createToken('PROCESSO_CITADO', match.replace(/\s+/g, '')));

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

  // ========================================
  // MÉTODOS DE EXTRAÇÃO DE DADOS
  // ========================================

  _extrairNumeroProcesso(texto) {
    const match = texto.match(/\bN\.?\s*[º°o]\s*do\s+Pedido\s*:\s*(BR\s*\d{8,}\s*-\s*\d)\b/i);
    if (match) return match[1].replace(/\s+/g, '');

    const match2 = texto.match(/\b(BR\s*\d{8,}\s*-\s*\d)\b/i);
    return match2 ? match2[1].replace(/\s+/g, '') : null;
  }

  _extrairNumeroPct(texto) {
    const match = texto.match(/N\.?\s*[º°o]\s*de\s+Dep[óo]sito\s+PCT\s*:\s*([^\n\r]+)/i);
    if (!match) return null;

    const valor = this._limparFormatacao(match[1]).replace(/\s+$/, '');
    if (!valor || valor === '-' || valor === '–') return null;

    // Quando não há valor após ':' o PDF costuma quebrar linha.
    // Em alguns OCRs, a linha seguinte é "colada" e acaba capturando uma etiqueta.
    // Nesses casos, o correto é tratar como null.
    const valorLower = valor.toLowerCase();
    const etiquetasNaoValor = [
      'data de depósito:',
      'data de deposito:',
      'prioridade unionista:',
      'depositante:',
      'inventor:',
      'título:',
      'titulo:'
    ];
    if (etiquetasNaoValor.some((e) => valorLower.startsWith(e))) {
      return null;
    }

    // Se o "valor" contém claramente uma etiqueta, também não é um PCT válido
    if (/(data\s+de\s+dep[óo]sito\s*:|prioridade\s+unionista\s*:|depositante\s*:|inventor\s*:|t[ií]tulo\s*:)/i.test(valor)) {
      return null;
    }

    return valor;
  }

  _extrairDataDeposito(texto) {
    const match = texto.match(/Data\s+de\s+Dep[óo]sito\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  _extrairPrioridadeUnionista(texto) {
    const match = texto.match(/Prioridade\s+Unionista\s*:\s*([^\n\r]+)/i);
    if (!match) return null;
    const valor = this._limparFormatacao(match[1]);
    if (!valor || valor === '-' || valor === '–') return null;
    return valor;
  }

  _extrairDepositante(texto) {
    const match = texto.match(/Depositante\s*:\s*([\s\S]+?)(?=\n\s*Inventor\s*:|\n\s*T[ií]tulo\s*:|\r\n\s*Inventor\s*:|\r\n\s*T[ií]tulo\s*:)/i);
    if (!match) return null;
    const bruto = this._limparFormatacao(match[1]);
    // Remove UF/país em parênteses no final (ex: (BRSP))
    return bruto.replace(/\s*\([A-Z]{2,}\)\s*$/i, '').trim() || null;
  }

  _extrairInventor(texto) {
    const match = texto.match(/Inventor\s*:\s*([\s\S]+?)(?=\n\s*T[ií]tulo\s*:|\r\n\s*T[ií]tulo\s*:)/i);
    if (!match) return null;
    return this._limparFormatacao(match[1]) || null;
  }

  _extrairTitulo(texto) {
    // Recorta estritamente: começa após "Título:" e termina antes de "SUBSÍDIOS TÉCNICOS"
    // Exemplo alvo:
    // Título: “Método ...\n...integrado ”\nSUBSÍDIOS TÉCNICOS
    const match = texto.match(
      /T[ií]tulo\s*:\s*([\s\S]+?)(?=\r?\n\s*SUBS[IÍ]DIOS\s+T[EÉ]CNICOS\b)/i
    );
    if (!match) {
      // Fallback: se não houver a seção, tenta parar antes de DECISÃO / linha em branco
      const matchFallback = texto.match(/T[ií]tulo\s*:\s*([\s\S]+?)(?=\r?\n\s*(?:DECIS[ÃA]O|DECISAO)\b|\n\s*\n|\r\n\s*\r\n|$)/i);
      if (!matchFallback) return null;
      const limpoFallback = this._limparFormatacao(matchFallback[1])
        .replace(/^[“"]\s*/, '')
        .trim();
      return limpoFallback || null;
    }

    const limpo = this._limparFormatacao(match[1])
      .replace(/^[“"]\s*/, '')
      .trim();
    return limpo || null;
  }

  _extrairDataDespacho(texto) {
    const matchExplicito = texto.match(/Data\s+do\s+Despacho\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (matchExplicito) return matchExplicito[1];

    // Heurística: maior data (dd/mm/aaaa) no documento
    const datas = texto.match(/\b(\d{2}\/\d{2}\/\d{4})\b/g) || [];
    let melhor = null;
    let melhorTime = -1;
    for (const d of datas) {
      const [dd, mm, aaaa] = d.split('/').map((x) => parseInt(x, 10));
      if (!dd || !mm || !aaaa) continue;
      const t = new Date(aaaa, mm - 1, dd).getTime();
      if (Number.isFinite(t) && t > melhorTime) {
        melhorTime = t;
        melhor = d;
      }
    }
    return melhor;
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
    const match = texto.match(/Requerente\s*:\s*([\s\S]+?)\s+(?:Indeferimento\s+do\s+pedido|Notificada)/i);
    return match ? this._limparFormatacao(match[1]) : null;
  }

  _extrairDataNotificacaoIndeferimento(texto) {
    // Normalmente: "Tal decisão foi publicada na RPI #### de dd/mm/aaaa."
    const match = texto.match(/publicad[ao]\s+na\s+RPI\s*\d+\s+de\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (match) return match[1];

    // Fallback: primeira ocorrência de "RPI #### de dd/mm/aaaa"
    const match2 = texto.match(/RPI\s*\d+\s+de\s+(\d{2}\/\d{2}\/\d{4})/i);
    return match2 ? match2[1] : null;
  }


  //
  //BR102014004206-7
//Recurso conhecido e negado provimento. Mantido o indeferimento do pedido [código 111].
  _extrairNomeDecisao(texto) {
    const match = texto.match(/Recurso\s+conhecido\s+e\s+negado\s+provimento\.[\s\S]{0,160}?(?:\[\s*c[oó]digo\s*\d+\s*\])?/i);
    if (match) return this._limparFormatacao(match[0]);

    const match2 = texto.match(/Recurso\s+n[ãa]o\s+provido\.[\s\S]{0,120}?Mantid[oa]\s+o\s+indeferimento\s+do\s+pedido/i);
    if (match2) return this._limparFormatacao(match2[0]);

    const match3 = texto.match(/Recurso\s+n[ãa]o\s+provido\.?/i);
    return match3 ? this._limparFormatacao(match3[0]) : null;
  }

  _extrairDataParecer(texto) {
    const match = texto.match(/Data\s+do\s+parecer\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  _extrairNumeroParecer(texto) {
    const match = texto.match(/N[úu]mero\s+do\s+parecer\s*:\s*(\d{3,})/i);
    return match ? match[1] : null;
  }

  _extrairTecnico(texto) {
    // Primeira regra: Captura nome antes de "Delegação de competência"
    let match = texto.match(/(?:\.\ s+|\n\s*)([A-Za-záéíóúâêôãõç]+(?: [A-Za-záéíóúâêôãõç]+)*)\s+Delegação\s+de\s+compet[eê]ncia/i);
    if (match) return match[1].trim();
    
    // Segunda regra: Captura após "à consideração superior."
    match = texto.match(/à\s+considera[çc][ãa]o\s+superior\.?\s+([\s\S]+?)\s+Delegação\s+de\s+compet[eê]ncia/i);
    if (match) {
      const textoBruto = match[1].trim();
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

  _extrairTextoAutomaticoEtapa1(texto) {
    const blocos = this._extrairBlocosCabecalho(texto);
    return blocos[0] ? blocos[0] : null;
  }

  _extrairTextoAutomaticoEtapa2(texto) {
    const blocos = this._extrairBlocosCabecalho(texto);
    return blocos[1] ? blocos[1] : null;
  }

  _extrairTextoParecer(texto) {
    // Se já veio com marcadores, extrai APENAS o conteúdo interno
    if (texto.includes('<<<INICIO_TEXTO_PARECER>>>')) {
      const matchMarcado = texto.match(/<<<INICIO_TEXTO_PARECER>>>\s*([\s\S]*?)\s*<<<FIM_TEXTO_PARECER>>>/i);
      return matchMarcado ? matchMarcado[1].trim() : null;
    }

    const match = texto.match(/O\s+referido\s+pedido\s+foi\s+indeferido[\s\S]+?sua\s+respectiva\s+decis[aã]o\./i);
    if (!match) return null;

    return match[0].trim();
  }

  // ⚠️ MÉTODO NÃO UTILIZADO (Campos não são extraídos nem enviados para IA)
  // _extrairArtigosInvocados(texto) {
  //   const artigos = [];
  //   const regex = /\bart(?:igo)?s?\s*\.?\s*(\d+)(?:\s*,?\s*(?:inc|inciso)\s*\.?\s*([IVX]+))?\b/gi;
  //   let match;
  //   
  //   while ((match = regex.exec(texto)) !== null) {
  //     const numeroArtigo = match[1];
  //     const inciso = match[2] || '';
  //     
  //     const artigoNormalizado = inciso 
  //       ? `Art. ${numeroArtigo}, inc. ${inciso}`
  //       : `Art. ${numeroArtigo}`;
  //     
  //     if (!artigos.includes(artigoNormalizado)) {
  //       artigos.push(artigoNormalizado);
  //     }
  //   }
  //   
  //   return artigos;
  // }
  
  // ⚠️ MÉTODO NÃO UTILIZADO (Campo não é extraído nem enviado para IA)
  // _extrairMotivoIndeferimento(texto) {
  //   const match = texto.match(/indeferido\s+com\s+base\s+nos?\s+([^\.\n\r]+)[\.\n\r]/i);
  //   if (!match) return null;
  //   return this._limparFormatacao(match[1]) || null;
  // }

  _extrairBlocosCabecalho(texto) {
    const indices = [];
    const reStart = /SERVI[ÇC]O\s+P[ÚU]BLICO\s+FEDERAL/gi;
    let mm;
    while ((mm = reStart.exec(texto)) !== null) {
      indices.push(mm.index);
      if (indices.length >= 2) break;
    }

    if (indices.length === 0) return [];

    const startIdx1 = indices[0];
    const startIdx2 = indices[1] ?? indices[0];

    const pickEnd = (preferred, fallbacks) => {
      if (typeof preferred === 'number') return preferred;
      for (const fb of fallbacks) {
        if (typeof fb === 'number') return fb;
      }
      return null;
    };

    const recortar = (inicio, preferido, alternativos) => {
      const aPartir = texto.slice(inicio);
      const findEnd = (re) => {
        const m = aPartir.match(re);
        return m && typeof m.index === 'number' ? m.index : null;
      };

      const endPreferido = findEnd(preferido);
      const endsAlt = alternativos.map((r) => findEnd(r));
      const end = pickEnd(endPreferido, endsAlt);
      return (end != null ? aPartir.slice(0, end) : aPartir.slice(0, 3000)).trim();
    };

    // Marcadores de corte (sempre relativos ao início escolhido)
    const reSubsidios = /\r?\n\s*SUBS[IÍ]DIOS\s+T[EÉ]CNICOS\b/i;
    const reDecisao = /\r?\n\s*DECIS[ÃA]O\b/i;
    const reCodigo = /\r?\n\s*C[oó]digo\s*:/i;
    const rePagina = /\r?\n\s*P[aá]gina\s+\d+/i;
    const reFim = /\r?\n\s*@MODELO_SISCAP@/i;

    // Etapa 1: começa no PRIMEIRO "SERVIÇO PÚBLICO FEDERAL" e termina antes de "SUBSÍDIOS TÉCNICOS"
    // Fallbacks: DECISÃO / CÓDIGO / PÁGINA / @MODELO_SISCAP@
    const etapa1 = recortar(startIdx1, reSubsidios, [reDecisao, reCodigo, rePagina, reFim]);

    // Etapa 2: começa no SEGUNDO "SERVIÇO PÚBLICO FEDERAL" (se existir) e termina antes de "DECISÃO"
    // Fallbacks: SUBSÍDIOS / CÓDIGO / PÁGINA / @MODELO_SISCAP@
    const etapa2 = recortar(startIdx2, reDecisao, [reSubsidios, reCodigo, rePagina, reFim]);

    return [etapa1 || null, etapa2 || null].filter((x) => x);
  }
  
  // ⚠️ MÉTODO NÃO UTILIZADO (Relevante apenas para marcas, não para patentes)
  // _extrairAnterioridades(texto) {
  //   const anterioridades = [];
  //   const matchSecao = texto.match(/MARCA\(S\)\s+APONTADA\(S\)\s+COMO\s+IMPEDITIVA\(S\)\s*:([\s\S]+?)(?=Ap[óo]s\s+ter\s+sido\s+examinado|$)/i);
  //   
  //   if (matchSecao) {
  //     const secaoAnterioridades = matchSecao[1];
  //     const regex = /\b(\d{9})\b/g;
  //     let match;
  //     
  //     while ((match = regex.exec(secaoAnterioridades)) !== null) {
  //       const processo = match[1];
  //       if (!anterioridades.includes(processo)) {
  //         anterioridades.push(processo);
  //       }
  //     }
  //   }
  //   
  //   return anterioridades;
  // }
  
  // ⚠️ MÉTODO NÃO UTILIZADO (Relevante apenas para marcas, não para patentes)
  // _extrairProcessosConflitantes(texto) {
  //   const processos = [];
  //   const regex = /Processo\s+(\d{9})/gi;
  //   let match;
  //   
  //   while ((match = regex.exec(texto)) !== null) {
  //     const processo = match[1];
  //     if (!processos.includes(processo)) {
  //       processos.push(processo);
  //     }
  //   }
  //   
  //   // Remove o processo principal (primeiro encontrado)
  //   if (processos.length > 1) {
  //     processos.shift();
  //   }
  //   
  //   return processos;
  // }

  // Reaplica as regexes da tokenização para garantir ausência de vazamentos.
  _auditarVazamentoLgpd(textoParaIa, dados, listaLgpd) {
    if (!textoParaIa) return [];
    const fieldToStrategy = this._getLgpdFieldStrategies();
    const vazamentos = [];

    listaLgpd.forEach((campo) => {
      const valor = dados[campo];
      if (!valor) return;

      const regexes = this._getLgpdRegexesForField(campo, valor, fieldToStrategy);
      if (!regexes.length) return;

      const totalMatches = this._countRegexMatches(textoParaIa, regexes);
      const encontrou = totalMatches > 0;
      regexes.forEach((regex) => {
        if (regex.global) regex.lastIndex = 0;
      });

      if (encontrou) {
        console.log('[DocRecursoIndefNaoProvExtractor] LGPD vazamento match:', campo, totalMatches);
        vazamentos.push(campo);
      }
    });

    return vazamentos;
  }

  // Define a estratégia de matching por campo LGPD.
  _getLgpdFieldStrategies() {
    return {
      form_numeroProcesso: 'digits',
      form_numeroPct: 'alnum',
      form_prioridadeUnionista: 'digits',
      form_requerente_nome: 'text',
      form_inventor_nome: 'text',
      form_titulo: 'text',
      dataDespacho: 'digits',
      dataNotificacaoIndeferimento: 'digits'
    };
  }

  // Gera regexes (literal + variantes) a partir do valor extraído.
  _getLgpdRegexesForField(campo, valor, fieldToStrategy) {
    if (!valor) return [];

    const literalRegex = new RegExp(this._escapeRegExp(valor), 'g');
    const regexes = [literalRegex];
    const estrategia = fieldToStrategy[campo] || (campo.startsWith('lgpd_custom_') ? 'mixed' : undefined);
    if (!estrategia) return regexes;

    const digits = String(valor).replace(/\D/g, '');

    if (estrategia === 'digits') {
      const digitsRegex = this._buildFlexibleDigitsRegex(digits);
      if (digitsRegex) regexes.push(digitsRegex);
    } else if (estrategia === 'alnum') {
      const alnumRegex = this._buildFlexibleAlnumRegex(valor);
      if (alnumRegex) regexes.push(alnumRegex);
    } else if (estrategia === 'text') {
      const textRegex = this._buildFlexibleTextRegex(valor);
      if (textRegex) regexes.push(textRegex);
    } else if (estrategia === 'mixed') {
      const digitsRegex = this._buildFlexibleDigitsRegex(digits);
      if (digitsRegex) regexes.push(digitsRegex);
      const textRegex = this._buildFlexibleTextRegex(valor);
      if (textRegex) regexes.push(textRegex);
    }

    return regexes;
  }

  _buildFlexibleDigitsRegex(digits) {
    if (!digits) return null;
    const pattern = digits.split('').join('[\\s./-]*');
    return new RegExp(`\\b${pattern}\\b`, 'g');
  }

  _buildFlexibleAlnumRegex(value) {
    const compact = String(value).replace(/[^0-9A-Za-z]/g, '');
    if (!compact) return null;
    const pattern = compact.split('').map((char) => this._escapeRegExp(char)).join('[\\s./-]*');
    return new RegExp(pattern, 'gi');
  }

  _buildFlexibleTextRegex(value) {
    const tokens = String(value)
      .replace(/[.,;:/-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => this._escapeRegExp(token));
    if (!tokens.length) return null;
    const separator = '[\\s./,-]+';
    return new RegExp(tokens.join(separator), 'gi');
  }

  _escapeRegExp(valor) {
    return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  _countRegexMatches(texto, regexes) {
    let total = 0;
    regexes.forEach((regex) => {
      if (!regex) return;
      const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
      const cloned = new RegExp(regex.source, flags);
      let match;
      while ((match = cloned.exec(texto)) !== null) {
        total += 1;
        if (match.index === cloned.lastIndex) cloned.lastIndex += 1;
      }
    });
    return total;
  }
}
