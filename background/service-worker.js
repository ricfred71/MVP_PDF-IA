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
const AI_DEFAULT_CONFIG = {
  providers: {
    gemini: true,
    chatgpt: false,
  },
  confirmBeforeSend: false,
  prompt:
    'Você é um assistente jurídico. Analise o texto abaixo e responda com objetividade.\n\nTexto:\n{{TEXTO}}',
};

async function getAiConfig() {
  const result = await chrome.storage.local.get({ [AI_CONFIG_KEY]: AI_DEFAULT_CONFIG });
  const cfg = result?.[AI_CONFIG_KEY] || AI_DEFAULT_CONFIG;
  return {
    providers: {
      ...AI_DEFAULT_CONFIG.providers,
      ...(cfg.providers || {}),
    },
    confirmBeforeSend: cfg.confirmBeforeSend === true,
    prompt: typeof cfg.prompt === 'string' && cfg.prompt.trim() ? cfg.prompt : AI_DEFAULT_CONFIG.prompt,
  };
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

  const content = buildAiMessage(cfg.prompt, texto);
  const delayMs = 5000;
  // ENVIO AUTOMÁTICO DESABILITADO (Sprint atual)
  // Motivo: neste momento não vamos auto-enviar para as IAs.
  // Para reativar:
  //   const shouldSend = !cfg.confirmBeforeSend;
  // e enviar no payload: { send: shouldSend }
  const shouldSend = false;

  const targets = [];
  if (cfg.providers.gemini) targets.push({ provider: 'gemini', url: 'https://gemini.google.com/app' });
  if (cfg.providers.chatgpt) targets.push({ provider: 'chatgpt', url: 'https://chatgpt.com/' });

  if (targets.length === 0) {
    throw new Error('Nenhuma IA selecionada nas opções');
  }

  const results = [];
  for (const t of targets) {
    const tab = await createTab(t.url);
    await waitForTabComplete(tab.id);
    // pequena folga para o site renderizar o input
    await new Promise((r) => setTimeout(r, 800));
    const resp = await sendToAiTab(tab.id, { content, delayMs, send: shouldSend });
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
          const results = await openAiTabsAndSend(storageKey);
          sendResponse({ status: 'ok', results });
        } catch (e) {
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
