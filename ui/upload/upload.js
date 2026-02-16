/**
 * ui/upload/upload.js
 * 
 * Controlador da interface de upload
 * Integração E2E: File → PdfReader → Classifier → DataExtractor → Storage
 * 
 * @version 1.0.0
 * @created 26/01/2026
 */

import { PdfReader } from '../../core/pdf-reader.js';
import { DocumentClassifier } from '../../core/document-classifier.js';
import { getExtractorForTexto, detectSector } from '../../core/sector-router.js';

// ============================================
// ELEMENTOS DOM
// ============================================
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const fileName = document.getElementById('fileName');
const fileInfo = document.getElementById('fileInfo');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const lgpdBtn = document.getElementById('lgpdBtn');
const lgpdCustom = document.getElementById('lgpdCustom');
const lgpdResult = document.getElementById('lgpdResult');
const lgpdText = document.getElementById('lgpdText');
const lgpdCopyBtn = document.getElementById('lgpdCopyBtn');
const openAiBtn = document.getElementById('openAiBtn');
const lgpdTermValue = document.getElementById('lgpdTermValue');
const lgpdTermAddBtn = document.getElementById('lgpdTermAddBtn');
const lgpdTermList = document.getElementById('lgpdTermList');
const lgpdTermEmpty = document.getElementById('lgpdTermEmpty');

// ============================================
// ESTADO GLOBAL
// ============================================
let selectedFile = null;
let currentSessionId = null;
let lastStorageKey = null;
let lgpdCustomTerms = [];

// ============================================
// VALIDAÇÃO DE ARQUIVO
// ============================================
function validarArquivo(file) {
  const errors = [];
  
  // Validação de tipo
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('Apenas arquivos PDF são aceitos');
  }
  
  // Validação de tamanho (máximo 50MB)
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    errors.push(`Arquivo muito grande (max 50MB). Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Validação de tamanho mínimo (1KB)
  const MIN_SIZE = 1024; // 1KB
  if (file.size < MIN_SIZE) {
    errors.push('Arquivo muito pequeno ou vazio');
  }
  
  return errors;
}

// ============================================
// FUNÇÕES DE UI
// ============================================
function mostrarStatus(mensagem, tipo = 'info') {
  status.textContent = mensagem;
  status.className = `status-message ${tipo} fade-in`;
  
  // Auto-hide para mensagens de sucesso/info após 5s
  if (tipo !== 'error') {
    setTimeout(() => {
      status.textContent = '';
      status.className = 'status-message';
    }, 5000);
  }
}

function mostrarProgresso(mensagem, percentual = null) {
  progress.style.display = 'block';
  progressText.textContent = mensagem;
  
  if (percentual !== null) {
    progressFill.style.width = `${percentual}%`;
  }
}

function esconderProgresso() {
  progress.style.display = 'none';
  progressFill.style.width = '0%';
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function limparInterface() {
  selectedFile = null;
  currentSessionId = null;
  lastStorageKey = null;
  fileName.textContent = '';
  fileInfo.textContent = '';
  status.textContent = '';
  status.className = 'status-message';
  processBtn.disabled = true;
  lgpdBtn.disabled = true;
  openAiBtn.disabled = true;
  lgpdResult.style.display = 'none';
  lgpdText.value = '';
  if (lgpdCustom) lgpdCustom.classList.add('hidden');
  esconderProgresso();
}

async function limparTermosLgpdCustomizados() {
  lgpdCustomTerms = [];
  renderizarTermosLgpd();
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  await chrome.storage.local.set({ lgpdCustomTerms: [] });
}

function normalizarTexto(valor) {
  return String(valor || '').trim().replace(/\s+/g, ' ');
}

function renderizarTermosLgpd() {
  if (!lgpdTermList || !lgpdTermEmpty) return;

  lgpdTermList.innerHTML = '';

  if (!lgpdCustomTerms.length) {
    lgpdTermEmpty.style.display = 'block';
    return;
  }

  lgpdTermEmpty.style.display = 'none';

  lgpdCustomTerms.forEach((item, index) => {
    const chip = document.createElement('div');
    chip.className = 'lgpd-term-chip';

    const label = document.createElement('span');
    const prefixo = item.descricao ? `${item.descricao}: ` : '';
    label.textContent = `${prefixo}${item.termo}`;

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'lgpd-term-remove';
    remover.textContent = '×';
    remover.addEventListener('click', () => removerTermoLgpdCustomizado(index));

    chip.appendChild(label);
    chip.appendChild(remover);
    lgpdTermList.appendChild(chip);
  });
}

function normalizarListaTermos(lista) {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set();

  return lista
    .map((item) => {
      if (typeof item === 'string') {
        const termo = normalizarTexto(item);
        return termo ? { descricao: '', termo } : null;
      }

      if (!item || typeof item !== 'object') return null;

      const termo = normalizarTexto(item.termo || item.valor || '');
      if (!termo) return null;

      const descricao = normalizarTexto(item.descricao || item.desc || '');
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

async function carregarTermosLgpdCustomizados() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

  const resultado = await chrome.storage.local.get('lgpdCustomTerms');
  lgpdCustomTerms = normalizarListaTermos(resultado?.lgpdCustomTerms || []);
  renderizarTermosLgpd();
}

async function salvarTermosLgpdCustomizados() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
  await chrome.storage.local.set({ lgpdCustomTerms });
}

async function adicionarTermoLgpdCustomizado() {
  const termo = normalizarTexto(lgpdTermValue?.value || '');
  if (!termo) {
    mostrarStatus('❌ Informe um termo/expressao para LGPD', 'error');
    return;
  }

  const jaExiste = lgpdCustomTerms.some((item) => item.termo.toLowerCase() === termo.toLowerCase());
  if (jaExiste) {
    mostrarStatus('⚠️ Termo LGPD ja cadastrado', 'info');
    return;
  }

  lgpdCustomTerms.push({ descricao: '', termo });
  await salvarTermosLgpdCustomizados();
  renderizarTermosLgpd();

  if (lgpdTermValue) lgpdTermValue.value = '';
  mostrarStatus('✅ Termo LGPD adicionado', 'success');
}

async function removerTermoLgpdCustomizado(index) {
  if (index < 0 || index >= lgpdCustomTerms.length) return;
  lgpdCustomTerms.splice(index, 1);
  await salvarTermosLgpdCustomizados();
  renderizarTermosLgpd();
}

// ============================================
// EVENTO: SELEÇÃO DE ARQUIVO
// ============================================
pdfInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  
  if (!file) {
    limparInterface();
    return;
  }
  
  // Validar arquivo
  const erros = validarArquivo(file);
  
  if (erros.length > 0) {
    mostrarStatus('❌ ' + erros[0], 'error');
    limparInterface();
    return;
  }
  
  // Arquivo válido
  selectedFile = file;
  lastStorageKey = null;
  lgpdBtn.disabled = true;
  openAiBtn.disabled = true;
  lgpdResult.style.display = 'none';
  lgpdText.value = '';
  limparTermosLgpdCustomizados();
  if (lgpdCustom) lgpdCustom.classList.add('hidden');
  if (lgpdCustom) lgpdCustom.classList.add('hidden');
  
  // Atualizar UI
  fileName.textContent = `📄 ${file.name}`;
  fileInfo.textContent = `${formatarTamanho(file.size)} · Pronto para processar`;
  
  processBtn.disabled = false;
  mostrarStatus('✅ Arquivo carregado com sucesso', 'success');
  
  console.log('[Upload] Arquivo selecionado:', {
    nome: file.name,
    tamanho: file.size,
    tipo: file.type
  });
});

if (lgpdTermAddBtn) {
  lgpdTermAddBtn.addEventListener('click', adicionarTermoLgpdCustomizado);
}

if (lgpdTermValue) {
  lgpdTermValue.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      adicionarTermoLgpdCustomizado();
    }
  });
}

// ============================================
// EVENTO: PROCESSAR PDF
// ============================================
processBtn.addEventListener('click', async () => {
  if (!selectedFile) {
    mostrarStatus('❌ Nenhum arquivo selecionado', 'error');
    return;
  }
  
  try {
    // Desabilita botão durante processamento
    processBtn.disabled = true;
    
    // ========================================
    // ETAPA 1: Extrair texto do PDF
    // ========================================
    mostrarProgresso('📄 Extraindo texto do PDF...', 20);
    
    const pdfReader = new PdfReader();
    const resultado = await pdfReader.loadFromFile(selectedFile);
    
    console.log('[Upload] Texto extraído:', {
      caracteres: resultado.texto.length,
      paginas: resultado.numeroPaginas,
      paginasProcessadas: resultado.paginasProcessadas,
      texto: resultado.texto.substring(0, 500) + (resultado.texto.length > 500 ? '...' : '')
    });
    
    mostrarProgresso('📄 Texto extraído com sucesso', 40);
    await sleep(300);
    
    // ========================================
    // ETAPA 2: Classificar documento
    // ========================================
    mostrarProgresso('🔍 Classificando documento...', 60);
    
    // Etapa 3a: Detectar setor
    const detectedSector = detectSector(resultado.texto, {
      url: window?.location?.href || '',
      fileName: selectedFile?.name || ''
    });

    console.log('[Upload] Setor detectado:', detectedSector);

    // Etapa 3b: Classificar com o setor correto
    const classifier = new DocumentClassifier();
    const classificacao = classifier.classificar(resultado.texto, detectedSector);
    
    console.log('[Upload] Classificação:', classificacao);
    
    mostrarProgresso('🔍 Documento classificado', 70);
    await sleep(300);
    
    // ========================================
    // ETAPA 3: Extrair dados estruturados (por setor)
    // ========================================
    mostrarProgresso('📊 Extraindo dados estruturados...', 75);

    let dadosExtraidos = null;
    let storageKey = null;
    let sector = detectedSector;

    const extractorInfo = getExtractorForTexto(resultado.texto, {
      sector: detectedSector,
      url: window?.location?.href || '',
      fileName: selectedFile?.name || ''
    });

    const extractor = extractorInfo.extractor;

    console.log('[Upload] Setor detectado:', sector);

    const extractorOptions = { lgpdCustomTerms: lgpdCustomTerms.slice() };

    if (classificacao.categoriaId === 'peticao') {
      // Extrai dados de PETIÇÃO
      const extractResult = extractor.extrairDadosPeticao(
        resultado.texto,
        classificacao,
        '', // urlPdf - pode ser preenchido se disponível
        extractorOptions
      );
      dadosExtraidos = extractResult.dados;
      storageKey = extractResult.storageKey;

      if (dadosExtraidos) dadosExtraidos.setor = sector;

      console.log('[Upload] Dados de petição extraídos:', {
        numeroProcesso: dadosExtraidos?.numeroProcesso,
        numeroPeticao: dadosExtraidos?.numeroPeticao,
        requerente: dadosExtraidos?.requerente_nome,
        storageKey
      });

    } else if (classificacao.categoriaId === 'documento_oficial') {
      // Extrai dados de DOCUMENTO OFICIAL
      const extractResult = extractor.extrairDadosDocumentoOficial(
        resultado.texto,
        classificacao,
        '', // urlPdf
        extractorOptions
      );
      dadosExtraidos = extractResult.dados;
      storageKey = extractResult.storageKey;

      if (dadosExtraidos) dadosExtraidos.setor = sector;

      console.log('[Upload] Dados de documento oficial extraídos:', {
        numeroProcesso: dadosExtraidos?.numeroProcesso,
        tipo: dadosExtraidos?.tipo,
        storageKey
      });

    } else {
      // Categoria desconhecida - cria objeto básico
      storageKey = `documento_desconhecido_${Date.now()}`;
      dadosExtraidos = {
        setor: sector,
        categoria: 'categoriaDesconhecida',
        tipo: classificacao.tipoId || '',
        subtipo: classificacao.subtipoId || '',
        confianca: classificacao.confianca || 0,
        textoCompleto: resultado.texto,
        dataProcessamento: new Date().toISOString(),
        urlPdf: ''
      };

      console.warn('[Upload] Categoria desconhecida - dados básicos salvos');
    }
    
    mostrarProgresso('📊 Dados extraídos', 85);
    await sleep(300);
    
    // ========================================
    // ETAPA 4: Salvar no storage local
    // ========================================
    mostrarProgresso('💾 Salvando no storage...', 90);
    
    // Salva o objeto estruturado no storage local
    await chrome.storage.local.set({
      [storageKey]: dadosExtraidos
    });
    
    console.log('[Upload] Dados salvos no storage local com chave:', storageKey);

    // Habilita visualização LGPD
    lastStorageKey = storageKey;
    lgpdBtn.disabled = false;
    openAiBtn.disabled = false;
    if (lgpdCustom) lgpdCustom.classList.remove('hidden');
    
    // ========================================
    // ETAPA 5: Concluído
    // ========================================
    mostrarProgresso('✅ Processamento concluído!', 100);
    await sleep(800);
    
    esconderProgresso();
    
    // Mensagem de sucesso detalhada
    const tipoFormatado = formatarTipoDocumento(classificacao.tipoId);
    const confiancaPct = (classificacao.confianca * 100).toFixed(0);
    
    let mensagemDetalhes = '';
    if (classificacao.categoriaId === 'pet' && dadosExtraidos) {
      mensagemDetalhes = `Processo: ${dadosExtraidos.numeroProcesso || 'N/A'}\n` +
                        `Petição: ${dadosExtraidos.numeroPeticao || 'N/A'}\n` +
                        `Requerente: ${dadosExtraidos.requerente_nome || 'N/A'}`;
    } else if (classificacao.categoriaId === 'doc_oficial' && dadosExtraidos) {
      mensagemDetalhes = `Processo: ${dadosExtraidos.numeroProcesso || 'N/A'}\n` +
                        `Data: ${dadosExtraidos.dataDespacho || 'N/A'}`;
    }
    
    mostrarStatus(
      `✅ Documento processado e salvo!\n` +
      `Tipo: ${tipoFormatado} (${confiancaPct}% confiança)\n` +
      `${mensagemDetalhes}\n` +
      `Storage: ${storageKey}`,
      'success'
    );
    
    // DEBUG: Mostra informações no console
    console.log('[Upload] ========================================');
    console.log('[Upload] PROCESSAMENTO CONCLUÍDO');
    console.log('[Upload] ========================================');
    console.log('[Upload] Session ID:', currentSessionId);
    console.log('[Upload] Storage Key:', storageKey);
    console.log('[Upload] Categoria:', classificacao.categoriaId);
    console.log('[Upload] Tipo:', classificacao.tipoId);
    console.log('[Upload] Confiança:', confiancaPct + '%');
    console.log('[Upload] Caracteres:', resultado.texto.length);
    console.log('[Upload] Dados extraídos:', dadosExtraidos);
    console.log('[Upload] ========================================');
    
    // Próxima etapa: LGPD (Sprint 2)
    console.log('[Upload] Próxima etapa: Anonimização LGPD (Sprint 2)');
    
    // Reabilita botão (permitir processar outro arquivo)
    setTimeout(() => {
      processBtn.disabled = false;
      mostrarStatus('Pronto para processar outro documento', 'info');
    }, 3000);
    
  } catch (error) {
    console.error('[Upload] Erro no processamento:', error);
    
    esconderProgresso();
    
    mostrarStatus(
      `❌ Erro: ${error.message || 'Falha ao processar PDF'}`,
      'error'
    );
    

    
    // Reabilita botão após erro
    setTimeout(() => {
      processBtn.disabled = false;
    }, 2000);
  }
});

// ============================================
// EVENTO: EXIBIR TEXTO LGPD (textoParaIa)
// ============================================
lgpdBtn.addEventListener('click', async () => {
  if (!lastStorageKey) {
    mostrarStatus('❌ Nenhum documento processado para exibir', 'error');
    return;
  }

  try {
    const resultado = await chrome.storage.local.get(lastStorageKey);
    const dados = resultado?.[lastStorageKey];

    if (!dados) {
      mostrarStatus('❌ Dados não encontrados para este documento', 'error');
      return;
    }

    const textoBase = dados.textoPeticao || dados.textoCompleto || dados.texto || '';
    const categoria = dados.categoria || '';

    if (!textoBase) {
      mostrarStatus('⚠️ Texto original não disponível para LGPD', 'info');
      lgpdResult.style.display = 'none';
      lgpdText.value = '';
      return;
    }

    const classificacao = {
      categoriaId: categoria,
      tipoId: dados.tipo || '',
      subtipoId: dados.subtipo || '',
      confianca: dados.confianca || 0
    };

    const extractorInfo = getExtractorForTexto(textoBase, {
      sector: dados.setor || detectSector(textoBase, {})
    });

    const extractor = extractorInfo.extractor;
    const extractorOptions = {
      lgpdCustomTerms: lgpdCustomTerms.slice(),
      overrideStorageKey: lastStorageKey
    };

    let novoResultado = null;

    if (categoria === 'peticao') {
      novoResultado = extractor.extrairDadosPeticao(textoBase, classificacao, dados.urlPdf || '', extractorOptions);
    } else if (categoria === 'documento_oficial') {
      novoResultado = extractor.extrairDadosDocumentoOficial(textoBase, classificacao, dados.urlPdf || '', extractorOptions);
    } else {
      mostrarStatus('⚠️ Categoria não suportada para LGPD', 'info');
      return;
    }

    if (!novoResultado?.dados?.textoParaIa) {
      mostrarStatus('⚠️ Texto LGPD não encontrado neste documento', 'info');
      lgpdResult.style.display = 'none';
      lgpdText.value = '';
      return;
    }

    await chrome.storage.local.set({
      [lastStorageKey]: {
        ...dados,
        ...novoResultado.dados
      }
    });

    lgpdText.value = novoResultado.dados.textoParaIa;
    lgpdResult.style.display = 'block';
  } catch (error) {
    console.warn('[Upload] Erro ao carregar texto LGPD:', error);
    mostrarStatus('❌ Erro ao carregar texto LGPD', 'error');
  }
});

lgpdCopyBtn.addEventListener('click', async () => {
  const texto = lgpdText.value || '';
  if (!texto) return;

  try {
    await navigator.clipboard.writeText(texto);
    mostrarStatus('✅ Texto LGPD copiado', 'success');
  } catch (error) {
    console.warn('[Upload] Falha ao copiar texto LGPD:', error);
    mostrarStatus('❌ Falha ao copiar texto LGPD', 'error');
  }
});

// ============================================
// EVENTO: ABRIR IAs (Gemini/ChatGPT)
// ============================================
openAiBtn.addEventListener('click', async () => {
  if (!lastStorageKey) {
    mostrarStatus('❌ Nenhum documento processado para enviar', 'error');
    return;
  }

  try {
    openAiBtn.disabled = true;
    mostrarStatus('🤖 Abrindo abas das IAs selecionadas e preenchendo prompt...', 'info');
    const resp = await chrome.runtime.sendMessage({ type: 'OPEN_AI_TABS', storageKey: lastStorageKey });

    if (resp?.status !== 'ok') {
      throw new Error(resp?.message || 'Falha ao abrir IAs');
    }

    const opened = Array.isArray(resp.results) ? resp.results.map(r => r.provider).join(', ') : 'IAs';
    mostrarStatus(`✅ Abas abertas: ${opened}. Prompt preenchido (sem envio automático).`, 'success');
  } catch (error) {
    console.warn('[Upload] Falha ao abrir IAs:', error);
    mostrarStatus(`❌ ${error.message || 'Falha ao abrir IAs'}`, 'error');
  } finally {
    setTimeout(() => {
      openAiBtn.disabled = false;
    }, 1500);
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatarTipoDocumento(tipoId) {
  // FORMATAÇÃO DE TIPO DESABILITADA TEMPORARIAMENTE
  // Mantemos apenas a categoria; tipificação virá em fase posterior.
  return 'Tipo não avaliado (fase futura)';

  /*
  const mapa = {
    'pet_recurso_indeferimento': 'Recurso contra Indeferimento',
    'pet_oposicao': 'Oposição',
    'pet_manifestacao': 'Manifestação',
    'pet_contestacao': 'Contestação',
    'pet_nulidade': 'Nulidade',
    'pet_caducidade': 'Caducidade',
    'pet_pedido_registro': 'Pedido de Registro',
    'pet_recurso_exigencia': 'Recurso contra Exigência',
    'pet_cumprimento_exigencia': 'Cumprimento de Exigência',
    'pet_juntada_documento': 'Juntada de Documento',
    'pet_generico': 'Petição Genérica',

    'doc_oficial_despacho_decisorio': 'Despacho Decisório',
    'doc_oficial_notificacao_exigencia': 'Notificação de Exigência',
    'doc_oficial_notificacao_oposicao': 'Notificação de Oposição',
    'doc_oficial_intimacao': 'Intimação',
    'doc_oficial_parecer_tecnico': 'Parecer Técnico',
    'doc_oficial_generico': 'Documento Oficial Genérico',

    'desconhecido': 'Tipo Desconhecido'
  };

  return mapa[tipoId] || tipoId;
  */
}

// ============================================
// INICIALIZAÇÃO
// ============================================
console.log('[Upload] Interface carregada - IA Análise Jurídica v1.0.0');
console.log('[Upload] Aguardando upload de PDF...');

// ============================================
// DEBUG TOOLTIPS
// ============================================
function debugTooltips() {
  console.log('=== TOOLTIP DEBUG ===');
  
  const allTooltips = document.querySelectorAll('[data-tooltip]');
  console.log(`Total elementos com data-tooltip: ${allTooltips.length}`);
  
  allTooltips.forEach((el, index) => {
    const computed = window.getComputedStyle(el);
    const tooltip = el.getAttribute('data-tooltip');
    const rect = el.getBoundingClientRect();
    
    // Verificar se elemento está visível
    let isVisible = el.offsetParent !== null;
    
    // Verificar se está dentro de container oculto
    let parent = el.parentElement;
    let hiddenParent = null;
    while (parent) {
      if (parent.classList.contains('hidden') || window.getComputedStyle(parent).display === 'none') {
        hiddenParent = parent.className || parent.tagName;
        break;
      }
      parent = parent.parentElement;
    }
    
    // Verificar hierarquia de pais com estilos importantes
    let parentInfo = [];
    parent = el.parentElement;
    let level = 0;
    while (parent && level < 6) {
      const parentComputed = window.getComputedStyle(parent);
      if (parentComputed.overflow !== 'visible' || parentComputed.zIndex !== 'auto') {
        parentInfo.push(`${parent.tagName}.${parent.className.split(' ')[0] || ''} (overflow: ${parentComputed.overflow}, z-index: ${parentComputed.zIndex})`);
      }
      level++;
      parent = parent.parentElement;
    }
    
    console.log(`
[Tooltip ${index + 1}]
  - ID: ${el.id}
  - Classe: ${el.className}
  - Tooltip: "${tooltip}"
  - Desabilitado: ${el.disabled}
  - Visível na página: ${isVisible}
  - Dentro de .hidden: ${hiddenParent ? 'SIM - ' + hiddenParent : 'NÃO'}
  - Rect: top=${rect.top.toFixed(0)}, left=${rect.left.toFixed(0)}, width=${rect.width.toFixed(0)}, height=${rect.height.toFixed(0)}
  - Position: ${computed.position}
  - Overflow: ${computed.overflow}
  - Z-index: ${computed.zIndex}
  - Display: ${computed.display}
  - Visibility: ${computed.visibility}
  - Opacity: ${computed.opacity}
  - Parents com overflow/z-index: ${parentInfo.length ? parentInfo.join(' | ') : 'nenhum relevante'}
    `);
    
    // Add hover listener para debug
    el.addEventListener('mouseenter', () => {
      console.log(`[HOVER]  ${el.id} - Tooltip: "${tooltip}"`);
    });
  });
  
  console.log('=== FIM DEBUG ===');
}

// Executar debug após DOM estar carregado
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    debugTooltips();
  }, 500);
});

// Teste de integração ao carregar
(async () => {
  try {
    await carregarTermosLgpdCustomizados();
    // Testa se service worker está ativo
    const response = await chrome.runtime.sendMessage({ type: 'PING' });
    console.log('[Upload] Service Worker status:', response);
  } catch (error) {
    console.warn('[Upload] Service Worker não respondeu:', error.message);
  }
})();
