(() => {
  const log = (...args) => console.log('[GeminiContentScript]', ...args);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  async function waitForAny(selectors, timeoutMs = 30000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && isVisible(el)) return el;
      }
      await sleep(250);
    }
    return null;
  }

  function trySetValue(el, value) {
    if (!el) return false;

    el.focus();

    if (el.tagName?.toLowerCase() === 'textarea') {
      const setter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // contenteditable
    if (el.getAttribute?.('contenteditable') === 'true') {
      el.textContent = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  async function fillPrompt(content) {
    const input = await waitForAny([
      'textarea',
      'div[contenteditable="true"]'
    ]);
    if (!input) throw new Error('Campo de prompt não encontrado');

    if (!trySetValue(input, content)) {
      throw new Error('Falha ao preencher o campo de prompt');
    }
  }

  async function clickSend() {
    const btn = await waitForAny([
      'button[aria-label="Enviar mensagem"]',
      'button[aria-label="Send message"]',
      '.send-button-container button',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Enviar" i]',
      'button[type="submit"]'
    ], 15000);
    if (!btn) throw new Error('Botão de enviar não encontrado');
    if (btn.disabled) throw new Error('Botão de enviar está desativado');
    btn.click();
  }

  async function fillAndMaybeSend(payload) {
    const content = String(payload?.content || '');
    const delayMs = Number(payload?.delayMs ?? 5000);
    const shouldSend = payload?.send !== false;
    if (!content.trim()) throw new Error('Conteúdo vazio');

    log('Recebido conteúdo. Preenchendo prompt...');
    await fillPrompt(content);

    if (!shouldSend) {
      log('Confirmar antes de enviar: preenchido, sem enviar.');
      return;
    }

    log(`Aguardando ${delayMs}ms para enviar...`);
    await sleep(delayMs);
    log('Enviando...');
    await clickSend();
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== 'AI_FILL_AND_SEND') return;

    fillAndMaybeSend(message.payload)
      .then(() => sendResponse({ status: 'ok' }))
      .catch((e) => {
        log('Erro:', e?.message || e);
        sendResponse({ status: 'error', message: e?.message || String(e) });
      });

    return true;
  });

  log('Loaded');
})();
