(() => {
  const log = (...args) => console.log('[DeepSeekContentScript]', ...args);
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
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  }

  async function fillPrompt(content) {
    const input = await waitForAny([
      'textarea[placeholder*="mensagem" i]',
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="digite" i]',
      'textarea[placeholder*="type" i]',
      'textarea',
      'div[contenteditable="true"]',
      '[role="textbox"]'
    ]);
    if (!input) throw new Error('Campo de prompt não encontrado');

    if (!trySetValue(input, content)) {
      throw new Error('Falha ao preencher o campo de prompt');
    }
  }

  async function clickSend() {
    const btn = await waitForAny([
      'button[aria-label*="Send" i]',
      'button[aria-label*="Enviar" i]',
      'button[type="submit"]',
      'button[data-testid*="send" i]'
    ], 15000);
    if (btn) {
      if (!btn.disabled) {
        btn.click();
        return;
      }
    }

    const sendIconPath = document.querySelector('svg[width="16"][height="16"] path[d="M8.3125 0.981587C8.66767 1.0545 8.97902 1.20558 9.2627 1.43374C9.48724 1.61438 9.73029 1.85933 9.97949 2.10854L14.707 6.83608L13.293 8.25014L9 3.95717V15.0431H7V3.95717L2.70703 8.25014L1.29297 6.83608L6.02051 2.10854C6.26971 1.85933 6.51277 1.61438 6.7373 1.43374C6.97662 1.24126 7.28445 1.04542 7.6875 0.981587C7.8973 0.94841 8.1031 0.956564 8.3125 0.981587Z"]');
    if (sendIconPath) {
      const iconButton = sendIconPath.closest('div[role="button"], .ds-icon-button, button');
      if (iconButton) {
        iconButton.click();
        return;
      }
    }

    const possibleButtons = document.querySelectorAll('div[role="button"], .ds-icon-button, button');
    for (const button of possibleButtons) {
      const icon = button.querySelector('svg[width="16"][height="16"]');
      if (icon && icon.innerHTML.includes('M8.3125 0.981587')) {
        button.click();
        return;
      }
    }

    const specificButton = document.querySelector('._7436101.bcc55ca1.ds-icon-button.ds-icon-button--l.ds-icon-button--sizing-container');
    if (specificButton) {
      specificButton.click();
      return;
    }

    throw new Error('Botão de enviar não encontrado');
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
