const STORAGE_KEY = 'ai_config';

const DEFAULT_PROMPT =
`Você é um assistente jurídico. Analise o texto abaixo (documento do INPI) e responda de forma objetiva.

Tarefas:
1) Resuma o caso.
2) Identifique pontos críticos e riscos.
3) Sugira próximos passos.

Texto:
{{TEXTO}}`;

const DEFAULT_CONFIG = {
	providers: {
		gemini: true,
		chatgpt: false,
		claude: false,
		perplexity: false,
		deepseek: false,
	},
	confirmBeforeSend: false,
	prompts: {
		marcasDocRecursoIndefNaoProv: DEFAULT_PROMPT,
		marcasPetRecursoIndef: DEFAULT_PROMPT,
		patentesDocRecursoIndefNaoProv: DEFAULT_PROMPT,
		patentesPetRecursoIndef: DEFAULT_PROMPT,
	},
};

function $(id) {
	return document.getElementById(id);
}

function setStatus(message, isError = false) {
	const status = $('status');
	if (!status) return;
	status.textContent = message || '';
	status.style.color = isError ? '#b42318' : '#1a7f37';
}

async function loadConfig() {
	const result = await chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_CONFIG });
	const cfg = result?.[STORAGE_KEY] || DEFAULT_CONFIG;
	// Mescla defensiva (para upgrades)
	return {
		providers: {
			...DEFAULT_CONFIG.providers,
			...(cfg.providers || {}),
		},
		confirmBeforeSend: cfg.confirmBeforeSend === true,
		prompts: {
			...DEFAULT_CONFIG.prompts,
			...(cfg.prompts || {}),
		},
	};
}

let saveTimer = null;
function scheduleSave(saveFn) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(saveFn, 250);
}

async function saveConfig(partial) {
	const current = await loadConfig();
	const next = {
		...current,
		...partial,
		providers: {
			...current.providers,
			...(partial.providers || {}),
		},
		prompts: {
			...current.prompts,
			...(partial.prompts || {}),
		},
	};
	await chrome.storage.local.set({ [STORAGE_KEY]: next });
	setStatus('✓ Salvo');
	setTimeout(() => setStatus(''), 1200);
}

function setTab(active) {
	const tabProviders = $('tab-providers');
	const tabPrompt = $('tab-prompt');
	const panelProviders = $('panel-providers');
	const panelPrompt = $('panel-prompt');

	const isProviders = active === 'providers';
	tabProviders.classList.toggle('active', isProviders);
	tabPrompt.classList.toggle('active', !isProviders);
	tabProviders.setAttribute('aria-selected', String(isProviders));
	tabPrompt.setAttribute('aria-selected', String(!isProviders));
	panelProviders.classList.toggle('hidden', !isProviders);
	panelPrompt.classList.toggle('hidden', isProviders);
}

async function init() {
	const cfg = await loadConfig();

	$('provider-gemini').checked = !!cfg.providers.gemini;
	$('provider-chatgpt').checked = !!cfg.providers.chatgpt;
	$('provider-claude').checked = !!cfg.providers.claude;
	$('provider-perplexity').checked = !!cfg.providers.perplexity;
	$('provider-deepseek').checked = !!cfg.providers.deepseek;
	$('confirm-before-send').checked = !!cfg.confirmBeforeSend;
	$('prompt-marcas-doc-recurso-indef-naoProv').value = cfg.prompts.marcasDocRecursoIndefNaoProv;
	$('prompt-marcas-pet-recurso-indef').value = cfg.prompts.marcasPetRecursoIndef;
	$('prompt-patentes-doc-recurso-indef-naoProv').value = cfg.prompts.patentesDocRecursoIndefNaoProv;
	$('prompt-patentes-pet-recurso-indef').value = cfg.prompts.patentesPetRecursoIndef;

	$('tab-providers').addEventListener('click', () => setTab('providers'));
	$('tab-prompt').addEventListener('click', () => setTab('prompt'));

	$('provider-gemini').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ providers: { gemini: $('provider-gemini').checked } }));
	});

	$('provider-chatgpt').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ providers: { chatgpt: $('provider-chatgpt').checked } }));
	});

	$('provider-claude').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ providers: { claude: $('provider-claude').checked } }));
	});

	$('provider-perplexity').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ providers: { perplexity: $('provider-perplexity').checked } }));
	});

	$('provider-deepseek').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ providers: { deepseek: $('provider-deepseek').checked } }));
	});

	$('confirm-before-send').addEventListener('change', () => {
		scheduleSave(() => saveConfig({ confirmBeforeSend: $('confirm-before-send').checked }));
	});

	$('prompt-marcas-doc-recurso-indef-naoProv').addEventListener('input', () => {
		scheduleSave(() => saveConfig({ prompts: { marcasDocRecursoIndefNaoProv: $('prompt-marcas-doc-recurso-indef-naoProv').value } }));
	});

	$('prompt-marcas-pet-recurso-indef').addEventListener('input', () => {
		scheduleSave(() => saveConfig({ prompts: { marcasPetRecursoIndef: $('prompt-marcas-pet-recurso-indef').value } }));
	});

	$('prompt-patentes-doc-recurso-indef-naoProv').addEventListener('input', () => {
		scheduleSave(() => saveConfig({ prompts: { patentesDocRecursoIndefNaoProv: $('prompt-patentes-doc-recurso-indef-naoProv').value } }));
	});

	$('prompt-patentes-pet-recurso-indef').addEventListener('input', () => {
		scheduleSave(() => saveConfig({ prompts: { patentesPetRecursoIndef: $('prompt-patentes-pet-recurso-indef').value } }));
	});

	const togglePrompt = (targetId) => {
		const textarea = targetId ? $(targetId) : null;
		if (!textarea) return;
		const container = textarea.closest('.prompt-item');
		if (!container) return;
		const body = container.querySelector('.prompt-body');
		const header = container.querySelector('.prompt-header');
		const button = container.querySelector('.prompt-toggle');
		const isOpen = body && !body.classList.contains('hidden');
		if (body) body.classList.toggle('hidden', isOpen);
		if (header) header.setAttribute('aria-expanded', String(!isOpen));
		if (button) button.textContent = isOpen ? 'Abrir' : 'Fechar';
	};

	const promptHeaders = document.querySelectorAll('.prompt-header');
	promptHeaders.forEach((header) => {
		header.addEventListener('click', (event) => {
			const targetId = header.getAttribute('data-target');
			if (!targetId) return;
			if (event.target && event.target.closest('.prompt-toggle')) return;
			togglePrompt(targetId);
		});
		header.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			const targetId = header.getAttribute('data-target');
			if (!targetId) return;
			togglePrompt(targetId);
		});
	});

	const promptButtons = document.querySelectorAll('.prompt-toggle');
	promptButtons.forEach((btn) => {
		btn.addEventListener('click', (event) => {
			event.stopPropagation();
			const targetId = btn.getAttribute('data-target');
			if (!targetId) return;
			togglePrompt(targetId);
		});
	});

	setTab('providers');
}

document.addEventListener('DOMContentLoaded', () => {
	init().catch((e) => {
		console.warn('[AI Config] Falha ao inicializar:', e);
		setStatus('❌ Falha ao carregar configurações', true);
	});
});
