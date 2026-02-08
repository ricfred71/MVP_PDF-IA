(() => {
  const log = (...args) => console.log('[ChatGPTContentScript]', ...args);

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

  function setNativeValue(textarea, value) {
    const setter = Object.getOwnPropertyDescriptor(textarea.__proto__, 'value')?.set;
    if (setter) setter.call(textarea, value);
    else textarea.value = value;

    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function fillPrompt(content) {
    const input = await waitForAny([
      'textarea#prompt-textarea',
      'textarea[name="prompt"]',
      'textarea',
      'div[contenteditable="true"]'
    ]);

    if (!input) {
      throw new Error('Campo de prompt não encontrado');
    }

    input.focus();

    if (input.tagName.toLowerCase() === 'textarea') {
      setNativeValue(input, content);
    } else {
      // contenteditable
      input.textContent = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return true;
  }

  async function clickSend() {
    const btn = await waitForAny([
      'button[data-testid="send-button"]',
      'button[aria-label*="Send" i]',
      'button[aria-label*="Enviar" i]',
      'button[type="submit"]'
    ], 15000);

    if (!btn) {
      throw new Error('Botão de enviar não encontrado');
    }

    btn.click();
    return true;
  }

  async function fillAndMaybeSend(payload) {
    const content = String(payload?.content || '');
    const delayMs = Number(payload?.delayMs ?? 5000);
    const shouldSend = payload?.send !== false;

    if (!content.trim()) {
      throw new Error('Conteúdo vazio');
    }

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
