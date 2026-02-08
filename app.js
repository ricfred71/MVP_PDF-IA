/**
 * Aplicação Principal - Processador de Documentos INPI
 * 
 * Integra todos os módulos para processar documentos com IA
 * mantendo conformidade com LGPD
 */

// Estado da aplicação
const appState = {
    selectedAI: null,
    uploadedFile: null,
    extractedText: '',
    anonymizedText: '',
    aiResponse: null
};

// Instâncias dos processadores
const anonymizer = new DataAnonymizer();
const pdfProcessor = new PDFProcessor();

/**
 * Inicialização da aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setDefaultAIConfig();
});

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Drag and drop para upload de arquivo
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

/**
 * Seleciona o tipo de IA (gratuita ou paga)
 */
function selectAI(type) {
    appState.selectedAI = type;
    
    // Atualiza UI
    document.getElementById('freeAI').classList.remove('selected');
    document.getElementById('paidAI').classList.remove('selected');
    
    if (type === 'free') {
        document.getElementById('freeAI').classList.add('selected');
    } else {
        document.getElementById('paidAI').classList.add('selected');
    }
    
    // Mostra configuração
    document.getElementById('aiConfig').style.display = 'block';
    
    // Define valores padrão baseados no tipo
    setDefaultAIConfig();
    
    // Habilita botão de processamento se arquivo estiver carregado
    updateProcessButton();
}

/**
 * Define configurações padrão da IA baseado no tipo selecionado
 */
function setDefaultAIConfig() {
    if (appState.selectedAI === 'free') {
        document.getElementById('apiEndpoint').value = 'http://localhost:11434/api/chat';
        document.getElementById('modelName').value = 'llama2';
        document.getElementById('apiKey').value = '';
        document.getElementById('apiKey').placeholder = 'Não necessário para modelos locais';
    } else if (appState.selectedAI === 'paid') {
        document.getElementById('apiEndpoint').value = 'https://api.openai.com/v1/chat/completions';
        document.getElementById('modelName').value = 'gpt-4';
        document.getElementById('apiKey').placeholder = 'sk-...';
    }
}

/**
 * Manipula a seleção de arquivo
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    handleFile(file);
}

/**
 * Processa o arquivo selecionado
 */
async function handleFile(file) {
    if (!file) return;
    
    appState.uploadedFile = file;
    
    // Atualiza UI
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').textContent = file.name;
    
    // Limpa resultados anteriores
    hideOutput();
    hideAlert();
    
    updateProcessButton();
}

/**
 * Atualiza o estado do botão de processar
 */
function updateProcessButton() {
    const processBtn = document.getElementById('processBtn');
    const canProcess = appState.selectedAI && appState.uploadedFile;
    processBtn.disabled = !canProcess;
}

/**
 * Processa o documento com IA
 */
async function processDocument() {
    try {
        showLoading();
        hideAlert();
        hideOutput();
        hideAnonymizationStats();
        
        // 1. Extrai texto do documento
        showAlert('info', '📄 Extraindo texto do documento...');
        appState.extractedText = await pdfProcessor.processFile(appState.uploadedFile);
        
        if (!appState.extractedText || appState.extractedText.trim().length === 0) {
            throw new Error('Não foi possível extrair texto do documento. Verifique se o PDF não está protegido ou corrompido.');
        }
        
        // 2. Anonimiza dados sensíveis
        showAlert('info', '🔒 Anonimizando dados sensíveis (LGPD)...');
        anonymizer.resetStats();
        
        const anonymizationOptions = {
            anonymizeCPF: document.getElementById('anonymizeCPF').checked,
            anonymizeCNPJ: document.getElementById('anonymizeCNPJ').checked,
            anonymizeNames: document.getElementById('anonymizeNames').checked,
            anonymizeEmails: document.getElementById('anonymizeEmails').checked,
            anonymizeAddresses: document.getElementById('anonymizeAddresses').checked,
            anonymizePhones: document.getElementById('anonymizePhones').checked
        };
        
        appState.anonymizedText = anonymizer.anonymize(appState.extractedText, anonymizationOptions);
        
        // Mostra estatísticas de anonimização
        showAnonymizationStats();
        
        // 3. Envia para IA
        showAlert('info', '🤖 Enviando para análise da IA...');
        const aiResponse = await sendToAI(appState.anonymizedText);
        appState.aiResponse = aiResponse;
        
        // 4. Exibe resultado
        displayResult(aiResponse);
        showAlert('success', '✅ Documento processado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao processar documento:', error);
        showAlert('error', `❌ Erro: ${error.message}`);
    } finally {
        hideLoading();
    }
}

/**
 * Envia texto anonimizado para a IA
 */
async function sendToAI(text) {
    const endpoint = document.getElementById('apiEndpoint').value;
    const apiKey = document.getElementById('apiKey').value;
    const model = document.getElementById('modelName').value;
    const prompt = document.getElementById('analysisPrompt').value;
    
    if (!endpoint) {
        throw new Error('Endpoint da API não configurado');
    }
    
    if (!model) {
        throw new Error('Modelo não especificado');
    }
    
    // Prepara o payload baseado no tipo de API
    const isOpenAICompatible = endpoint.includes('openai') || endpoint.includes('chat/completions');
    
    let requestBody;
    let headers = {
        'Content-Type': 'application/json'
    };
    
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    if (isOpenAICompatible || appState.selectedAI === 'paid') {
        // Formato OpenAI
        requestBody = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente especializado em análise de documentos do INPI (Instituto Nacional da Propriedade Industrial). Forneça análises precisas e profissionais.'
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nDocumento:\n${text}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
    } else {
        // Formato Ollama/outros
        requestBody = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente especializado em análise de documentos do INPI (Instituto Nacional da Propriedade Industrial). Forneça análises precisas e profissionais.'
                },
                {
                    role: 'user',
                    content: `${prompt}\n\nDocumento:\n${text}`
                }
            ],
            stream: false
        };
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro da API (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        // Extrai a resposta baseado no formato
        let aiMessage;
        if (data.choices && data.choices[0]) {
            // Formato OpenAI
            aiMessage = data.choices[0].message.content;
        } else if (data.message) {
            // Formato Ollama
            aiMessage = data.message.content;
        } else if (data.response) {
            // Formato alternativo
            aiMessage = data.response;
        } else {
            throw new Error('Formato de resposta não reconhecido');
        }
        
        return aiMessage;
        
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Não foi possível conectar à API. Verifique se o endpoint está correto e acessível. Para modelos locais (Ollama), certifique-se de que o serviço está rodando.');
        }
        throw error;
    }
}

/**
 * Exibe o resultado da análise
 */
function displayResult(result) {
    const outputArea = document.getElementById('outputArea');
    const outputContent = document.getElementById('outputContent');
    
    outputContent.innerHTML = `<pre>${escapeHtml(result)}</pre>`;
    outputArea.classList.add('visible');
    
    // Scroll suave até o resultado
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Mostra estatísticas de anonimização
 */
function showAnonymizationStats() {
    const statsArea = document.getElementById('anonymizationStats');
    const statsContent = document.getElementById('statsContent');
    
    statsContent.innerHTML = anonymizer.getStatsHTML();
    statsArea.style.display = 'block';
}

/**
 * Esconde estatísticas de anonimização
 */
function hideAnonymizationStats() {
    document.getElementById('anonymizationStats').style.display = 'none';
}

/**
 * Mostra área de loading
 */
function showLoading() {
    document.getElementById('loadingArea').classList.add('visible');
}

/**
 * Esconde área de loading
 */
function hideLoading() {
    document.getElementById('loadingArea').classList.remove('visible');
}

/**
 * Mostra área de output
 */
function hideOutput() {
    document.getElementById('outputArea').classList.remove('visible');
}

/**
 * Mostra alerta
 */
function showAlert(type, message) {
    const alertArea = document.getElementById('alertArea');
    const alertClass = `alert-${type}`;
    
    alertArea.innerHTML = `
        <div class="alert ${alertClass} visible">
            ${escapeHtml(message)}
        </div>
    `;
}

/**
 * Esconde alerta
 */
function hideAlert() {
    document.getElementById('alertArea').innerHTML = '';
}

/**
 * Reseta o formulário
 */
function resetForm() {
    // Limpa estado
    appState.uploadedFile = null;
    appState.extractedText = '';
    appState.anonymizedText = '';
    appState.aiResponse = null;
    
    // Limpa processadores
    pdfProcessor.clear();
    anonymizer.resetStats();
    
    // Limpa UI
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analysisPrompt').value = `Analise este documento do INPI e forneça:
1. Tipo de documento (patente, marca, etc.)
2. Resumo das principais informações
3. Status e datas relevantes
4. Observações importantes`;
    
    hideOutput();
    hideAlert();
    hideAnonymizationStats();
    hideLoading();
    
    updateProcessButton();
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Utilitário para formatar bytes
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
