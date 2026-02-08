/**
 * Módulo de Anonimização de Dados Sensíveis (LGPD Compliance)
 * 
 * Este módulo protege dados pessoais sensíveis antes do envio para serviços de IA,
 * em conformidade com a Lei Geral de Proteção de Dados (LGPD).
 */

class DataAnonymizer {
    constructor() {
        this.stats = {
            cpf: 0,
            cnpj: 0,
            names: 0,
            emails: 0,
            addresses: 0,
            phones: 0
        };
        
        // Mapa para rastrear substituições e permitir reversão se necessário
        this.replacementMap = new Map();
        this.replacementCounter = 0;
    }

    /**
     * Reseta as estatísticas de anonimização
     */
    resetStats() {
        this.stats = {
            cpf: 0,
            cnpj: 0,
            names: 0,
            emails: 0,
            addresses: 0,
            phones: 0
        };
        this.replacementMap.clear();
        this.replacementCounter = 0;
    }

    /**
     * Retorna as estatísticas de anonimização
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Valida CPF usando o algoritmo de dígitos verificadores
     */
    isValidCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        
        // CPFs com todos os dígitos iguais são inválidos
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Valida primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit1 = 11 - (sum % 11);
        if (digit1 >= 10) digit1 = 0;
        
        if (parseInt(cpf.charAt(9)) !== digit1) return false;
        
        // Valida segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        let digit2 = 11 - (sum % 11);
        if (digit2 >= 10) digit2 = 0;
        
        return parseInt(cpf.charAt(10)) === digit2;
    }

    /**
     * Anonimiza CPF no formato xxx.xxx.xxx-xx ou xxxxxxxxxxx
     */
    anonymizeCPF(text) {
        // Regex para CPF com formatação: xxx.xxx.xxx-xx
        const cpfRegex1 = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
        // Regex para CPF sem formatação: xxxxxxxxxxx
        const cpfRegex2 = /\b\d{11}\b/g;
        
        text = text.replace(cpfRegex1, (match) => {
            if (this.isValidCPF(match)) {
                this.stats.cpf++;
                this.replacementMap.set(`CPF-${this.replacementCounter}`, match);
                this.replacementCounter++;
                return '[CPF-REDACTED]';
            }
            return match;
        });
        
        // Para números de 11 dígitos, valida se é CPF antes de anonimizar
        text = text.replace(cpfRegex2, (match) => {
            if (this.isValidCPF(match)) {
                this.stats.cpf++;
                this.replacementMap.set(`CPF-${this.replacementCounter}`, match);
                this.replacementCounter++;
                return '[CPF-REDACTED]';
            }
            return match;
        });
        
        return text;
    }

    /**
     * Valida CNPJ usando o algoritmo de dígitos verificadores
     */
    isValidCNPJ(cnpj) {
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/\D/g, '');
        
        if (cnpj.length !== 14) return false;
        
        // CNPJs com todos os dígitos iguais são inválidos
        if (/^(\d)\1{13}$/.test(cnpj)) return false;
        
        // Valida primeiro dígito verificador
        let sum = 0;
        let weight = 5;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnpj.charAt(i)) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        if (parseInt(cnpj.charAt(12)) !== digit1) return false;
        
        // Valida segundo dígito verificador
        sum = 0;
        weight = 6;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cnpj.charAt(i)) * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        return parseInt(cnpj.charAt(13)) === digit2;
    }

    /**
     * Anonimiza CNPJ no formato xx.xxx.xxx/xxxx-xx ou xxxxxxxxxxxxxx
     */
    anonymizeCNPJ(text) {
        // Regex para CNPJ com formatação: xx.xxx.xxx/xxxx-xx
        const cnpjRegex1 = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
        // Regex para CNPJ sem formatação: xxxxxxxxxxxxxx
        const cnpjRegex2 = /\b\d{14}\b/g;
        
        text = text.replace(cnpjRegex1, (match) => {
            if (this.isValidCNPJ(match)) {
                this.stats.cnpj++;
                this.replacementMap.set(`CNPJ-${this.replacementCounter}`, match);
                this.replacementCounter++;
                return '[CNPJ-REDACTED]';
            }
            return match;
        });
        
        text = text.replace(cnpjRegex2, (match) => {
            if (this.isValidCNPJ(match)) {
                this.stats.cnpj++;
                this.replacementMap.set(`CNPJ-${this.replacementCounter}`, match);
                this.replacementCounter++;
                return '[CNPJ-REDACTED]';
            }
            return match;
        });
        
        return text;
    }

    /**
     * Anonimiza e-mails
     */
    anonymizeEmails(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        
        return text.replace(emailRegex, (match) => {
            this.stats.emails++;
            this.replacementMap.set(`EMAIL-${this.replacementCounter}`, match);
            this.replacementCounter++;
            return '[EMAIL-REDACTED]';
        });
    }

    /**
     * Anonimiza telefones brasileiros
     * Formatos: (xx) xxxx-xxxx, (xx) xxxxx-xxxx, xx xxxx-xxxx, etc.
     */
    anonymizePhones(text) {
        // Telefone com DDD entre parênteses: (xx) xxxx-xxxx ou (xx) xxxxx-xxxx
        const phoneRegex1 = /\(\d{2}\)\s?\d{4,5}-?\d{4}/g;
        // Telefone com DDD: xx xxxx-xxxx ou xx xxxxx-xxxx
        const phoneRegex2 = /\b\d{2}\s\d{4,5}-?\d{4}\b/g;
        // Telefone sem DDD: xxxx-xxxx ou xxxxx-xxxx
        const phoneRegex3 = /\b\d{4,5}-\d{4}\b/g;
        
        text = text.replace(phoneRegex1, (match) => {
            this.stats.phones++;
            this.replacementMap.set(`PHONE-${this.replacementCounter}`, match);
            this.replacementCounter++;
            return '[TELEFONE-REDACTED]';
        });
        
        text = text.replace(phoneRegex2, (match) => {
            this.stats.phones++;
            this.replacementMap.set(`PHONE-${this.replacementCounter}`, match);
            this.replacementCounter++;
            return '[TELEFONE-REDACTED]';
        });
        
        text = text.replace(phoneRegex3, (match) => {
            this.stats.phones++;
            this.replacementMap.set(`PHONE-${this.replacementCounter}`, match);
            this.replacementCounter++;
            return '[TELEFONE-REDACTED]';
        });
        
        return text;
    }

    /**
     * Anonimiza nomes próprios comuns (heurística conservadora)
     * Procura por palavras capitalizadas que podem ser nomes
     * Usa uma abordagem conservadora para minimizar falsos positivos
     */
    anonymizeNames(text) {
        // Lista expandida de palavras que não devem ser consideradas nomes
        const excludedWords = new Set([
            'INPI', 'Brasil', 'Brasileiro', 'Brasileira', 'CPF', 'CNPJ', 'RG',
            'São', 'Paulo', 'Rio', 'Janeiro', 'Minas', 'Gerais', 'Santa', 'Catarina',
            'Patente', 'Marca', 'Documento', 'Requerente', 'Titular', 'Inventor',
            'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo',
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
            'Rua', 'Avenida', 'Alameda', 'Praça', 'Travessa',
            'Instituto', 'Nacional', 'Propriedade', 'Industrial', 'Serviços',
            'Software', 'Empresa', 'Tecnológicas', 'Inovações'
        ]);
        
        // Padrão mais específico para nomes próprios: procura por sequências típicas de nomes brasileiros
        // Ex: Nome + Sobrenome, Nome + de/da/do + Sobrenome
        // Requer pelo menos uma palavra com mais de 3 caracteres para evitar iniciais
        const namePattern = /\b([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]{2,}(?:\s+(?:da|de|do|das|dos)\s+)?(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]{2,})+)\b/g;
        
        return text.replace(namePattern, (match) => {
            // Verifica se não é uma palavra excluída
            const words = match.split(/\s+/);
            
            // Se qualquer palavra estiver na lista de exclusão, não anonimiza
            const hasExcludedWord = words.some(word => excludedWords.has(word));
            if (hasExcludedWord) {
                return match;
            }
            
            // Conta palavras substantivas (não preposições)
            const substantiveWords = words.filter(w => 
                !['da', 'de', 'do', 'das', 'dos', 'e'].includes(w.toLowerCase())
            );
            
            // Requer pelo menos 2 palavras substantivas para ser considerado nome
            // E a primeira palavra deve ter pelo menos 3 caracteres
            if (substantiveWords.length >= 2 && substantiveWords[0].length >= 3) {
                this.stats.names++;
                this.replacementMap.set(`NAME-${this.replacementCounter}`, match);
                this.replacementCounter++;
                return '[NOME-REDACTED]';
            }
            
            return match;
        });
    }

    /**
     * Anonimiza endereços (padrão simplificado)
     */
    anonymizeAddresses(text) {
        // Padrão para endereços: Rua/Avenida/etc + nome + número
        const addressPattern = /(?:Rua|Avenida|Av\.|R\.|Alameda|Praça|Travessa)\s+[^,\n]{3,50}(?:,\s*(?:n[°º]?|número)\s*\d+)?(?:,\s*[^,\n]{3,30})?/gi;
        
        return text.replace(addressPattern, (match) => {
            this.stats.addresses++;
            this.replacementMap.set(`ADDRESS-${this.replacementCounter}`, match);
            this.replacementCounter++;
            return '[ENDERECO-REDACTED]';
        });
    }

    /**
     * Método principal para anonimizar texto com base nas configurações
     */
    anonymize(text, options = {}) {
        const {
            anonymizeCPF = true,
            anonymizeCNPJ = true,
            anonymizeNames = true,
            anonymizeEmails = true,
            anonymizeAddresses = true,
            anonymizePhones = true
        } = options;

        let anonymizedText = text;

        // Ordem de processamento importa para evitar conflitos
        if (anonymizeCPF) {
            anonymizedText = this.anonymizeCPF(anonymizedText);
        }
        
        if (anonymizeCNPJ) {
            anonymizedText = this.anonymizeCNPJ(anonymizedText);
        }
        
        if (anonymizeEmails) {
            anonymizedText = this.anonymizeEmails(anonymizedText);
        }
        
        if (anonymizePhones) {
            anonymizedText = this.anonymizePhones(anonymizedText);
        }
        
        if (anonymizeAddresses) {
            anonymizedText = this.anonymizeAddresses(anonymizedText);
        }
        
        if (anonymizeNames) {
            anonymizedText = this.anonymizeNames(anonymizedText);
        }

        return anonymizedText;
    }

    /**
     * Retorna uma representação em HTML das estatísticas
     */
    getStatsHTML() {
        const stats = this.getStats();
        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            return '<p style="color: #28a745;">✅ Nenhum dado sensível detectado no documento.</p>';
        }
        
        let html = `<p style="color: #856404; margin-bottom: 10px;"><strong>⚠️ ${total} item(ns) de dados sensíveis foram anonimizados:</strong></p>`;
        
        if (stats.cpf > 0) {
            html += `<div class="stat-item"><span>CPFs:</span><span><strong>${stats.cpf}</strong></span></div>`;
        }
        if (stats.cnpj > 0) {
            html += `<div class="stat-item"><span>CNPJs:</span><span><strong>${stats.cnpj}</strong></span></div>`;
        }
        if (stats.names > 0) {
            html += `<div class="stat-item"><span>Nomes:</span><span><strong>${stats.names}</strong></span></div>`;
        }
        if (stats.emails > 0) {
            html += `<div class="stat-item"><span>E-mails:</span><span><strong>${stats.emails}</strong></span></div>`;
        }
        if (stats.addresses > 0) {
            html += `<div class="stat-item"><span>Endereços:</span><span><strong>${stats.addresses}</strong></span></div>`;
        }
        if (stats.phones > 0) {
            html += `<div class="stat-item"><span>Telefones:</span><span><strong>${stats.phones}</strong></span></div>`;
        }
        
        return html;
    }
}

// Exporta a classe para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAnonymizer;
}
