/**
 * Service Worker - Background Script
 * Extensão IA Análise Jurídica
 * 
 * Responsabilidades:
 * - Gerenciar ciclo de vida da extensão
 * - Coordenar comunicação entre componentes
 * - Orquestrar fluxo de análise
 */

console.log('[ServiceWorker] Iniciado - IA Análise Jurídica v1.0.0');

const AI_CONFIG_KEY = 'ai_config';
const AI_DEFAULT_PROMPT =
  'Você é um assistente jurídico. Analise o texto abaixo (documento do INPI) e responda de forma objetiva.\n\n' +
  'Tarefas:\n' +
  '1) Resuma o caso.\n' +
  '2) Identifique pontos críticos e riscos.\n' +
  '3) Sugira próximos passos.\n\n' +
  'Texto:\n{{TEXTO}}';

const AI_DEFAULT_CONFIG = {
  providers: {
    gemini: true,
    chatgpt: false,
    claude: false,
    perplexity: false,
    deepseek: false,
    notebooklm: false,
  },
  urls: {
    notebooklm: 'https://notebooklm.google.com/notebook/0378d129-bef9-40a9-b337-59b4bd677200/',
  },
  confirmBeforeSend: false,
  prompts: {
    marcasDocRecursoIndefNaoProv: AI_DEFAULT_PROMPT,
    marcasPetRecursoIndef: AI_DEFAULT_PROMPT,
    patentesDocRecursoIndefNaoProv: AI_DEFAULT_PROMPT,
    patentesPetRecursoIndef: AI_DEFAULT_PROMPT,
    notebooklm: '',
  },
};

async function getAiConfig() {
  const result = await chrome.storage.local.get({ [AI_CONFIG_KEY]: AI_DEFAULT_CONFIG });
  const cfg = result?.[AI_CONFIG_KEY] || AI_DEFAULT_CONFIG;
  const legacyPrompt = typeof cfg.prompt === 'string' && cfg.prompt.trim() ? cfg.prompt : '';
  const hasPromptConfig = cfg.prompts && Object.keys(cfg.prompts).length > 0;

  const mergedPrompts = {
    ...AI_DEFAULT_CONFIG.prompts,
    ...(hasPromptConfig ? cfg.prompts : {}),
  };

  if (legacyPrompt) {
    Object.keys(mergedPrompts).forEach((key) => {
      const current = mergedPrompts[key];
      if (!current || !String(current).trim()) {
        mergedPrompts[key] = legacyPrompt;
      }
    });

    if (!hasPromptConfig) {
      Object.keys(mergedPrompts).forEach((key) => {
        mergedPrompts[key] = legacyPrompt;
      });
    }
  }

  return {
    providers: {
      ...AI_DEFAULT_CONFIG.providers,
      ...(cfg.providers || {}),
    },
    urls: {
      ...AI_DEFAULT_CONFIG.urls,
      ...(cfg.urls || {}),
    },
    confirmBeforeSend: cfg.confirmBeforeSend === true,
    prompts: mergedPrompts,
  };
}

function inferSectorFromStorageKey(storageKey) {
  if (!storageKey) return '';
  const key = String(storageKey).toLowerCase();
  if (key.includes('patente')) return 'patentes';
  if (key.includes('marca')) return 'marcas';
  return '';
}

function resolvePromptKey(dados, storageKey) {
  const setor = String(dados?.setor || inferSectorFromStorageKey(storageKey) || '').toLowerCase();
  const categoria = String(dados?.categoria || dados?.categoriaId || '').toLowerCase();
  const tipo = String(dados?.tipo || dados?.tipoId || '').trim();

  if (setor === 'marcas' && categoria === 'documento_oficial' && tipo === 'recursoIndeferimentoNaoProvido') {
    return 'marcasDocRecursoIndefNaoProv';
  }

  if (setor === 'patentes' && categoria === 'documento_oficial' && tipo === 'recursoIndeferimentoNaoProvido') {
    return 'patentesDocRecursoIndefNaoProv';
  }

  if (setor === 'marcas' && categoria === 'peticao') {
    return 'marcasPetRecursoIndef';
  }

  if (setor === 'patentes' && categoria === 'peticao') {
    return 'patentesPetRecursoIndef';
  }

  return '';
}

function getFallbackPrompt(prompts) {
  const values = Object.values(prompts || {}).filter((val) => typeof val === 'string' && val.trim());
  if (values.length > 0) return values[0];
  return AI_DEFAULT_PROMPT;
}

function buildAiMessage(prompt, text) {
  const safePrompt = String(prompt || '').trim();
  const safeText = String(text || '');

  if (!safePrompt) return safeText;
  if (safePrompt.includes('{{TEXTO}}')) {
    return safePrompt.replaceAll('{{TEXTO}}', safeText);
  }
  return `${safePrompt}\n\n${safeText}`;
}

function createTab(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: true }, (tab) => {
      const err = chrome.runtime?.lastError;
      if (err) return reject(new Error(err.message));
      resolve(tab);
    });
  });
}

function waitForTabComplete(tabId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const listener = (updatedTabId, info) => {
      if (updatedTabId !== tabId) return;
      if (info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    const timer = setInterval(() => {
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Timeout aguardando carregamento da aba'));
      }
    }, 500);
  });
}

async function sendToAiTab(tabId, payload, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: 'AI_FILL_AND_SEND', payload }, (resp) => {
        const err = chrome.runtime?.lastError;
        if (err) return resolve({ status: 'error', message: err.message });
        resolve(resp || { status: 'ok' });
      });
    });

    if (response?.status === 'ok') return response;
    await new Promise((r) => setTimeout(r, 700));
  }
  return { status: 'error', message: 'Falha ao comunicar com o content script da IA' };
}

async function openAiTabsAndSend(storageKey) {
  const cfg = await getAiConfig();
  const docResult = await chrome.storage.local.get(storageKey);
  const dados = docResult?.[storageKey];

  const texto = dados?.textoParaIa || dados?.textoParecer || dados?.textoCompleto || '';
  if (!texto || !String(texto).trim()) {
    throw new Error('Documento não possui texto para enviar (textoParaIa/textoParecer/textoCompleto)');
  }

  const promptKey = resolvePromptKey(dados, storageKey);
  const prompt = promptKey ? cfg.prompts?.[promptKey] : '';
  const content = buildAiMessage(prompt || getFallbackPrompt(cfg.prompts), texto);
  const delayMs = 5000;
  const shouldSend = !cfg.confirmBeforeSend;

  const targets = [];
  if (cfg.providers.gemini) targets.push({ provider: 'gemini', url: 'https://gemini.google.com/app' });
  if (cfg.providers.chatgpt) targets.push({ provider: 'chatgpt', url: 'https://chatgpt.com/' });
  if (cfg.providers.claude) targets.push({ provider: 'claude', url: 'https://claude.ai/new' });
  if (cfg.providers.perplexity) targets.push({ provider: 'perplexity', url: 'https://www.perplexity.ai/' });
  if (cfg.providers.deepseek) targets.push({ provider: 'deepseek', url: 'https://chat.deepseek.com/' });
  if (cfg.providers.notebooklm) targets.push({ provider: 'notebooklm', url: cfg.urls?.notebooklm || 'https://notebooklm.google.com/notebook/0378d129-bef9-40a9-b337-59b4bd677200/' });

  if (targets.length === 0) {
    throw new Error('Nenhuma IA selecionada nas opções');
  }

  const results = [];
  for (const t of targets) {
    console.log(`[ServiceWorker][AI][${t.provider}] Abrindo aba`, { url: t.url, shouldSend, delayMs });
    const tab = await createTab(t.url);
    await waitForTabComplete(tab.id);
    // pequena folga para o site renderizar o input
    await new Promise((r) => setTimeout(r, 800));
    
    // Para NotebookLM, usar prompt exclusivo se configurado
    let finalContent = content;
    if (t.provider === 'notebooklm' && cfg.prompts?.notebooklm?.trim?.()) {
      finalContent = buildAiMessage(cfg.prompts.notebooklm, texto);
    }
    
    const resp = await sendToAiTab(tab.id, { content: finalContent, delayMs, send: shouldSend });
    const ok = resp?.status === 'ok';
    const level = ok ? 'log' : 'warn';
    console[level](`[ServiceWorker][AI][${t.provider}] Resultado do envio`, {
      status: resp?.status || 'unknown',
      message: resp?.message || null,
      tabId: tab.id,
      shouldSend,
    });
    results.push({ provider: t.provider, tabId: tab.id, response: resp });
  }

  return results;
}

// Listener para clique no ícone da extensão - abre página completa
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('ui/upload/upload.html')
  });
});

// Listeners de instalação e ativação
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ServiceWorker] Extensão instalada/atualizada:', details.reason);
  
  if (details.reason === 'install') {
    // Primeira instalação
    console.log('[ServiceWorker] Primeira instalação - bem-vindo!');
    
    // Configurar defaults (storage.local - persistente)
    chrome.storage.local.get([AI_CONFIG_KEY], (result) => {
      if (result && result[AI_CONFIG_KEY]) return;
      chrome.storage.local.set({ [AI_CONFIG_KEY]: AI_DEFAULT_CONFIG });
    });
  }
});

// Listener de mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ServiceWorker] Mensagem recebida:', message.type);
  
  // Será expandido nos próximos sprints
  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'ok', message: 'Service Worker ativo' });
      break;

    case 'OPEN_AI_TABS':
      (async () => {
        try {
          const storageKey = message?.storageKey;
          if (!storageKey) throw new Error('storageKey ausente');
          console.log('[ServiceWorker][OPEN_AI_TABS] Iniciando fluxo', { storageKey });
          const results = await openAiTabsAndSend(storageKey);
          console.log('[ServiceWorker][OPEN_AI_TABS] Fluxo concluído', {
            storageKey,
            providers: results.map((r) => r.provider),
            success: results.filter((r) => r.response?.status === 'ok').length,
            failed: results.filter((r) => r.response?.status !== 'ok').length,
          });
          sendResponse({ status: 'ok', results });
        } catch (e) {
          console.error('[ServiceWorker][OPEN_AI_TABS] Erro no fluxo', {
            storageKey: message?.storageKey,
            message: e?.message || String(e),
          });
          sendResponse({ status: 'error', message: e?.message || String(e) });
        }
      })();
      break;
      
    default:
      console.warn('[ServiceWorker] Tipo de mensagem desconhecido:', message.type);
      sendResponse({ status: 'error', message: 'Tipo de mensagem não reconhecido' });
  }
  
  return true; // Mantém canal aberto para resposta assíncrona
});

// Manter service worker ativo (Manifest V3)
chrome.runtime.onStartup.addListener(() => {
  console.log('[ServiceWorker] Chrome iniciado - service worker ativo');
});
