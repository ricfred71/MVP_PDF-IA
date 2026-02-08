/**
 * Módulo de Processamento de PDF
 * 
 * Este módulo lida com a extração de texto de arquivos PDF
 * usando a biblioteca PDF.js (carregada via CDN)
 */

class PDFProcessor {
    constructor() {
        this.pdfDoc = null;
        this.extractedText = '';
        this.loadPDFJS();
    }

    /**
     * Carrega a biblioteca PDF.js dinamicamente
     */
    loadPDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            this.initPDFJS();
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                this.initPDFJS();
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Falha ao carregar biblioteca PDF.js'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializa o PDF.js com o worker
     */
    initPDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Processa um arquivo PDF e extrai todo o texto
     */
    async processPDF(file) {
        try {
            // Aguarda o PDF.js estar carregado
            await this.loadPDFJS();

            // Lê o arquivo como ArrayBuffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            // Carrega o PDF
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            this.pdfDoc = await loadingTask.promise;

            // Extrai texto de todas as páginas
            const numPages = this.pdfDoc.numPages;
            let fullText = '';

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await this.pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Concatena os itens de texto
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += `\n--- Página ${pageNum} ---\n${pageText}\n`;
            }

            this.extractedText = fullText.trim();
            return this.extractedText;

        } catch (error) {
            console.error('Erro ao processar PDF:', error);
            throw new Error(`Falha ao processar PDF: ${error.message}`);
        }
    }

    /**
     * Processa um arquivo de texto simples
     */
    async processTextFile(file) {
        try {
            const text = await this.readFileAsText(file);
            this.extractedText = text;
            return text;
        } catch (error) {
            console.error('Erro ao processar arquivo de texto:', error);
            throw new Error(`Falha ao processar arquivo de texto: ${error.message}`);
        }
    }

    /**
     * Processa qualquer arquivo suportado
     */
    async processFile(file) {
        if (!file) {
            throw new Error('Nenhum arquivo fornecido');
        }

        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await this.processPDF(file);
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            return await this.processTextFile(file);
        } else {
            throw new Error('Tipo de arquivo não suportado. Use PDF ou TXT.');
        }
    }

    /**
     * Lê arquivo como ArrayBuffer (para PDF)
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Lê arquivo como texto (para TXT)
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Retorna o texto extraído
     */
    getExtractedText() {
        return this.extractedText;
    }

    /**
     * Limpa o texto extraído
     */
    clear() {
        this.pdfDoc = null;
        this.extractedText = '';
    }

    /**
     * Retorna informações sobre o documento processado
     */
    async getDocumentInfo() {
        if (!this.pdfDoc) {
            return null;
        }

        try {
            const metadata = await this.pdfDoc.getMetadata();
            return {
                numPages: this.pdfDoc.numPages,
                metadata: metadata.info,
                textLength: this.extractedText.length
            };
        } catch (error) {
            console.error('Erro ao obter informações do documento:', error);
            return {
                numPages: this.pdfDoc.numPages,
                textLength: this.extractedText.length
            };
        }
    }
}

// Exporta a classe para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFProcessor;
}
