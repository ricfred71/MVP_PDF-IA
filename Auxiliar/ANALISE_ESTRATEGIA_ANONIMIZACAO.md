# Análise da Proposta de Anonimização de Dados

**Data**: 01/02/2026  
**Contexto**: Extensão IPAS - Anonimização de documentos para envio a IAs gratuitas  
**Conformidade**: LGPD (Lei Geral de Proteção de Dados)

---

## 📋 Visão Geral

Sua estratégia de **Tokenização/Pseudonimização Reversível** é **sólida e viável**. Proposta de 3 etapas:

1. **Remoção de cabeçalhos automáticos** (metadados identificadores)
2. **Tokenização de dados LGPD** (já mapeados em variáveis)
3. **Masking de números de processos** (padrão \d{9})

---

## 1️⃣ Remoção de Cabeçalhos Automáticos

### ✅ Pontos Positivos

- **Metadados identificadores**: Elimina dados desnecessários para análise
- **Determinístico e rápido**: Sem dependência de ML
- **Seguro**: Remove informações não relevantes para a IA

### ⚠️ Considerações

- **Estrutura variável**: Os headers são sempre iguais?
- **Risco de perda de contexto**: Algumas datas/informações são importantes
  - Ex: Data do despacho é crucial para análise temporal

### 💡 Sugestão: Separar em Dois Grupos

#### REMOVER COMPLETAMENTE
```
- Assinaturas digitais
- Nomes de técnicos/servidores INPI
- IDs internos do sistema
- Datas de processamento interno
- Cabeçalhos de protocolo
- URLs de download
- Hashes de autenticação
```

#### MANTER (será tokenizado depois)
```
- Número do processo
- Datas de despacho/decisão
- Data de apresentação
- Tipo de documento
- Nomes de partes (será pseudonimizado)
```

---

## 2️⃣ Tokenização de Dados LGPD

### Dados Já Identificados no `doc_extractor.js`

```javascript
// Campos sensíveis já mapeados:
requerente: this._extrairRequerente()                    // ⚠️ NOME
tecnico: this._extrairTecnico()                          // ⚠️ NOME
dataNotificacaoIndeferimento: this._extrairDataNotificacaoIndeferimento()  // DATA
textoParecer: this._extrairTextoParecer()                // ⚠️ PODE TER NOMES
```

### Exemplo de Tokenização Semântica

```javascript
// ANTES (Original)
Requerente: João Silva Oliveira CPF 123.456.789-00
Técnico: RICARDO FREDERICO NICOL

// DEPOIS (Tokenizado)
Requerente: [PESSOA_NATURAL_1] CPF [CPF_1]
Técnico: [PESSOA_NATURAL_2]

// MAPA LOCAL (armazenado localmente na extensão)
{
  "[PESSOA_NATURAL_1]": "João Silva Oliveira",
  "[CPF_1]": "123.456.789-00",
  "[PESSOA_NATURAL_2]": "RICARDO FREDERICO NICOL"
}
```

### ✅ Vantagens da Abordagem

| Vantagem | Detalhe |
|----------|---------|
| **Semântica preservada** | IA entende que é pessoa, não confunde com empresa |
| **Distinguibilidade** | Múltiplas pessoas → `[PESSOA_NATURAL_1]`, `[PESSOA_NATURAL_2]` |
| **Reversão trivial** | Busca-e-substitui no texto retornado |
| **Determinístico** | Mesma pessoa → mesmo token em todo documento |
| **LGPD compatível** | Pseudonimização reconhecida legalmente |

### 🎯 Tipos de Tokens Recomendados

```javascript
// Dados identificadores diretos
[PESSOA_NATURAL_1], [PESSOA_NATURAL_2], ...
[PESSOA_JURIDICA_1], [PESSOA_JURIDICA_2], ...
[CPF_1], [CPF_2], ...
[CNPJ_1], [CNPJ_2], ...
[EMAIL_1], [EMAIL_2], ...
[TELEFONE_1], [TELEFONE_2], ...
[ENDERECO_1], [ENDERECO_2], ...

// Dados de processos relacionados
[PROCESSO_ANTERIOR_1], [PROCESSO_ANTERIOR_2], ...
[PROCESSO_CONFLITANTE_1], [PROCESSO_CONFLITANTE_2], ...

// Dados contextuais (quando sensível)
[DATA_NASCIMENTO_1], ...
```

### ⚠️ Desafios Identificados

#### 1. **Separação de Dados Compostos**

No `_extrairRequerente()`, o texto geralmente vem como:
```
Requerente: João Silva Oliveira - Empresa XYZ LTDA - CPF 123.456.789-00
```

**Problema**: Seu código extrai tudo junto. Precisa separar:
- Nome ← `[PESSOA_NATURAL_1]`
- Empresa ← `[PESSOA_JURIDICA_1]`
- CPF ← `[CPF_1]`

#### 2. **Nomes em `_extrairTextoParecer()`**

O parecer técnico pode conter nomes não capturados pelo extrator:
```
"... conforme entendimento de João Silva, técnico responsável..."
```

**Problema**: Esse nome NÃO é capturado pelo `_extrairTecnico()`.

**Solução**: Usar NER (Named Entity Recognition) automático ou procurar por padrões adicionais.

#### 3. **Dados Pseudonimizados Incompletos**

Seu extrator pode omitir dados sensíveis:
- Endereços mencionados no parecer
- Números de outras pessoas
- Informações contextuais identificáveis

---

## 3️⃣ Masking de Números de Processos

### Proposta

```javascript
// ANTES
"Conforme Processo 1234567890 e Processo 9876543210..."

// DEPOIS
"Conforme Processo [PROCESSO_ANTERIOR_1] e Processo [PROCESSO_ANTERIOR_2]..."

// MAPA
{
  "[PROCESSO_ANTERIOR_1]": "1234567890",
  "[PROCESSO_ANTERIOR_2]": "9876543210"
}
```

### ✅ Pontos Fortes

- Padrão bem definido: 9 dígitos
- Seu código já extrai com regex: `/\b(\d{9})\b/g`
- **Crítico para LGPD**: Números de processos INPI são **públicos** mas **identificam titulares**

### 🚨 Risco Crítico: Perda de Contexto Semântico

**Cenário problemático**:
```
Documento original:
- Processo 123456789 (titularidade: João Silva)
- Processo 234567890 (titularidade: João Silva)
- Processo 345678901 (titularidade: Maria Santos)

Após tokenização:
- [PROCESSO_ANTERIOR_1]
- [PROCESSO_ANTERIOR_2]
- [PROCESSO_ANTERIOR_3]

IA recebe: "... [PROCESSO_1] e [PROCESSO_2] e [PROCESSO_3]"
```

**Problema**: A IA **não sabe** que [PROCESSO_1] e [PROCESSO_2] são do **mesmo requerente**!

### 💡 Solução Recomendada: Hash Determinístico com Contexto

```javascript
// Ao invés de sequencial, use referência determinística:

// Opção A: Hash do número original
const hash = sha256(processo).substring(0, 8);
// "[PROCESSO_" + hash + "]"
// Problema: Menos legível para debug

// Opção B: Vincular ao requerente
[PROCESSO_ANTERIOR_REQUERENTE_JOÃO_SILVA_1]
[PROCESSO_ANTERIOR_REQUERENTE_MARIA_SANTOS_1]
// Problema: Ainda identifica o requerente (derrota o propósito)

// Opção C: Índice relacional com mapa
// Criar mapa: "requerente" → "lista de seus processos"
tokenMap: {
  "123456789": "[PROCESSO_ANTERIOR_1]",  // João Silva
  "234567890": "[PROCESSO_ANTERIOR_2]",  // João Silva (mesmo, token diferente)
  "345678901": "[PROCESSO_ANTERIOR_3]"   // Maria Santos
}
// A IA sabe que [1] e [2] são de ALGUÉM, mas não sabe de quem
```

---

## 📊 Fluxo Completo Proposto

```
┌──────────────────────────────────────────────┐
│ 1️⃣  DOCUMENTO ORIGINAL (PDF do INPI)        │
│ ✓ Cabeçalhos com metadados                  │
│ ✓ Nomes de pessoas e empresas               │
│ ✓ CPF/CNPJ                                  │
│ ✓ Datas variadas                            │
│ ✓ Referências a outros processos            │
└─────────────┬────────────────────────────────┘
              │
         ✅ ETAPA 1: REMOÇÃO DE CABEÇALHOS
         (Remove headers, assinaturas internas)
              │
┌──────────────────────────────────────────────┐
│ 2️⃣  DOCUMENTO "LIMPO"                       │
│ ✓ Conteúdo técnico/jurídico preservado      │
│ ✓ Ainda com dados identificadores           │
└─────────────┬────────────────────────────────┘
              │
    ✅ ETAPA 2: TOKENIZAÇÃO LGPD
    (Substitui dados já mapeados)
              │ Tokens semânticos: [PESSOA_1], [CPF_1], etc.
              │ Gera mapa local
              │
┌──────────────────────────────────────────────┐
│ 3️⃣  DOCUMENTO PSEUDONIMIZADO (1º NÍVEL)    │
│ "[PESSOA_NATURAL_1] CPF [CPF_1]..."         │
│ "Empresa [PESSOA_JURIDICA_1]..."            │
│ "Parecer de [PESSOA_NATURAL_2]..."          │
└─────────────┬────────────────────────────────┘
              │
    ✅ ETAPA 3: MASKING DE PROCESSOS
    (Regex para todos \d{9})
              │ [PROCESSO_ANTERIOR_1], [PROCESSO_ANTERIOR_2]
              │
┌──────────────────────────────────────────────┐
│ 4️⃣  DOCUMENTO ANONIMIZADO (2º NÍVEL)       │
│ "[PESSOA_NATURAL_1] CPF [CPF_1]..."         │
│ "Processo [PROCESSO_ANTERIOR_1] anterior"   │
│ "vs Processo [PROCESSO_ANTERIOR_2]"         │
│ Parecer de [PESSOA_NATURAL_2]               │
└─────────────┬────────────────────────────────┘
              │
         📤 ENVIO PARA IA
         (ChatGPT/Gemini/Claude)
              │
        📥 IA RETORNA RESPOSTA
        (Análise/parecer do documento)
              │
    ✅ ETAPA 4: DESTOKENIZAÇÃO
    (Busca-e-substitui reverso usando mapa)
              │
┌──────────────────────────────────────────────┐
│ 5️⃣  RESPOSTA COM DADOS REAIS                │
│ Usuário recebe documento com:                │
│ ✓ Nomes reais                               │
│ ✓ CPFs reais                                │
│ ✓ Números de processos originais            │
└──────────────────────────────────────────────┘
```

---

## 🔍 Análise Crítica - Matriz de Avaliação

| Aspecto | Status | Observação | Risco |
|---------|--------|-----------|-------|
| **Reversibilidade** | ✅ | Simples com find-replace em mapa | Baixo |
| **Segurança do mapa** | ⚠️ | Onde guardar? Sem criptografia? | **Médio** |
| **Completude** | ⚠️ | Podem existir dados omitidos | **Médio** |
| **Contexto semântico** | ⚠️ | Processos diferentes não se distinguem | Baixo |
| **Performance** | ✅ | Regex rápidas, O(n) | Baixo |
| **LGPD compliance** | ✅ | Pseudonimização é reconhecida | Baixo |
| **Detectabilidade** | ✅ | Sem PII óbvia | Baixo |
| **Resistência a re-id** | ⚠️ | Combinação de tokens pode revelar | **Médio** |

---

## 🚨 Problemas Práticos Identificados

### 1. **`_extrairTecnico()` - Regex insuficiente**

```javascript
// Problema: Captura apenas nomes em maiúsculas contíguas
match = texto.match(/(?:\.\s+|\n\s*)([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+(?: [A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)*)\s+Delegação/i);

// Pode falhar em:
// - "RICARDO FREDERICO N." (abreviaturas)
// - "R. F. NICOL" (iniciais)
// - "Ricardo Frederico Nicol" (sem maiúsculas)
```

### 2. **Dados Não Anonimizados no Extrator**

O extrator **identifica** mas **não anonimiza**:
```javascript
requerente: this._extrairRequerente(texto)
// Retorna: "João Silva Oliveira"
// ❌ PRECISA SER: "[PESSOA_NATURAL_1]"

tecnico: this._extrairTecnico(texto)
// Retorna: "RICARDO FREDERICO NICOL"
// ❌ PRECISA SER: "[PESSOA_NATURAL_2]"
```

### 3. **Nomes em `_extrairTextoParecer()`**

```javascript
_extrairTextoParecer(texto) {
  const match = texto.match(/N[úu]mero\s+do\s+parecer\s*:\s*\d+\s*([\s\S]+?)(...)/i);
  if (!match) return null;
  const textoParecer = match[1].trim();
  // ❌ PROBLEMA: Retorna texto com nomes soltos!
  // Exemplo: "Conforme análise de João Silva, [...]"
  return `<<<INICIO_TEXTO_PARECER>>>\n${textoParecer}\n<<<FIM_TEXTO_PARECER>>>`;
}
```

### 4. **Contexto de Processos Perdido**

```javascript
_extrairAnterioridades(texto) {
  const anterioridades = [];
  const regex = /\b(\d{9})\b/g;
  let match;
  
  while ((match = regex.exec(secaoAnterioridades)) !== null) {
    const processo = match[1];
    anterioridades.push(processo);
  }
  // ⚠️ PROBLEM: Não vincula processo ao seu requerente original
  // Se tokenizar cegamente, perde essa informação
  return anterioridades;
}
```

---

## ✅ Recomendações de Implementação

### Ordem Prioritária

#### **1. PRIMEIRO - Definir Escopo Claro** ⭐
Listar TODOS os campos que requerem anonimização:
```javascript
// CAMPOS SENSÍVEIS (Obrigatório anonimizar)
- requerente (NOME)
- tecnico (NOME)
- Nomes dentro de textoParecer
- Nomes dentro de motivoIndeferimento
- CPF/CNPJ (se aparecerem)
- Emails (se aparecerem)
- Telefones (se aparecerem)
- Endereços (se aparecerem)
- Números de processos citados

// CAMPOS NÃO SENSÍVEIS (Não anonimizar)
- numeroProcesso (principal, pode deixar)
- dataDespacho (geral, pode deixar)
- artigosInvocados (genéricos)
- decisao (genérica)
- tipoDespacho (genérica)
```

#### **2. SEGUNDO - Criar DataAnonymizer** ⭐⭐
Novo módulo para gerenciar tokenização:
```javascript
// sectors/marcas/types/doc_recurso-indef--naoProv/data-anonymizer.js

export class DataAnonymizer {
  constructor() {
    this.tokenMap = {};      // token → valor original
    this.reverseMap = {};    // valor original → token
    this.tokenCounter = {};  // contadores por tipo
  }
  
  // Gera token semântico único
  generateToken(tipo, valor) {
    // tipo: PESSOA_NATURAL, CPF, EMPRESA, etc.
    // valor: string original
    // retorna: [TIPO_N]
  }
  
  // Tokeniza dados estruturados
  anonymizeDados(dados) {
    const dadosAnon = { ...dados };
    
    dadosAnon.requerente = this.anonymizeNome(dados.requerente, 'PESSOA_NATURAL');
    dadosAnon.tecnico = this.anonymizeNome(dados.tecnico, 'PESSOA_NATURAL');
    dadosAnon.anterioridades = this.anonymizeProcessos(dados.anterioridades);
    
    return { dadosAnon, tokenMap: this.tokenMap };
  }
  
  // Anonimiza texto com busca por padrões adicionais
  anonymizeTexto(texto) {
    // Encontra nomes, emails, CPFs, etc. por regex
    // Substitui por tokens
    // Atualiza mapa
  }
  
  // Reverter para dados originais
  deanonymize(texto) {
    let resultado = texto;
    for (const [token, valor] of Object.entries(this.reverseMap)) {
      resultado = resultado.replace(new RegExp(token, 'g'), valor);
    }
    return resultado;
  }
}
```

#### **3. TERCEIRO - Integrar no Extract**
Modificar o método `extract()` para usar anonimização:
```javascript
extract(textoCompleto, classificacao, urlPdf = '') {
  const anonymizer = new DataAnonymizer();
  
  // Extrai normalmente
  const dados = { /* ... */ };
  
  // Anonimiza
  const { dadosAnon, tokenMap } = anonymizer.anonymizeDados(dados);
  
  // Anonimiza texto técnico
  dadosAnon.textoParecer = anonymizer.anonymizeTexto(dadosAnon.textoParecer);
  dadosAnon.textoCompleto = anonymizer.anonymizeTexto(dadosAnon.textoCompleto);
  
  return {
    storageKey,
    dados: dadosAnon,
    tokenMap,  // ← NOVO: guardar mapa
    validacao
  };
}
```

#### **4. QUARTO - Armazenar e Reverter**
Gerenciar mapa localmente:
```javascript
// Guardar para sessão
chrome.storage.session.set({
  [`tokenMap_${storageKey}`]: tokenMap
});

// Ao receber resposta da IA, reverter
const tokenMap = await chrome.storage.session.get(`tokenMap_${storageKey}`);
const respostaDesanonimizada = anonymizer.deanonymize(respostaIA, tokenMap);
```

---

## 📋 Checklist de Implementação

- [ ] **Definição de escopo**: Listar todos campos sensíveis
- [ ] **Design de tokens**: Definir tipos (PESSOA_NATURAL, CPF, EMPRESA, PROCESSO, etc.)
- [ ] **Hash determinístico**: Implementar para consistência
- [ ] **DataAnonymizer class**: Criar módulo novo
- [ ] **Integração no extract()**: Modificar método principal
- [ ] **Estratégia de armazenamento**: `chrome.storage.session` vs `chrome.storage.local`
- [ ] **Função de destokenização**: Para processar respostas da IA
- [ ] **Testes com casos reais**: Validar reversibilidade
- [ ] **Cleanup automático**: Limpar mapas antigos/expirados
- [ ] **Documentação LGPD**: Para conformidade legal
- [ ] **Validação com IA**: Testar se IA entende tokens (pode precisar ajustar prompt)

---

## 🔐 Segurança do Mapa Local

### ⚠️ Questão Crítica: Onde Guardar?

**Opção A: `chrome.storage.local`**
```javascript
// Vantagem: Persistente, criptografado pelo SO
// Risco: Pode ser acessado por extensões maliciosas
// Uso: Mapas que você quer manter entre sessões
chrome.storage.local.set({ tokenMap_123456789: {...} });
```

**Opção B: `chrome.storage.session`**
```javascript
// Vantagem: Limpo ao fechar aba, menos exposição
// Risco: Perdido ao fechar a aba
// Uso: Mapas de uma análise pontual
chrome.storage.session.set({ tokenMap_123456789: {...} });
```

**Opção C: Memória (runtime)**
```javascript
// Vantagem: Máxima privacidade, não persiste
// Risco: Perdido ao recarregar extensão
// Uso: Análises rápidas
const tokenMap = { ... }; // variável global
```

### 💡 Recomendação
- **Use `session`** para análises pontuais
- **Implemente cleanup**: após 24h ou quando usuário pede
- **Avisar ao usuário**: "Seu mapa será deletado em X horas"
- **Nunca** enviar mapa para servidor remoto

---

## 🤖 Validação com IA

### Importante: Testar Compreensão da IA

Antes de usar em produção, valide:

```javascript
// Prompt de teste
const prompt = `
Análise o seguinte documento anonimizado:

[PESSOA_NATURAL_1] solicitou registro de marca.
A empresa [PESSOA_JURIDICA_1] alegou conflito com processo [PROCESSO_ANTERIOR_1].
Parecer técnico de [PESSOA_NATURAL_2]: "Houve falta de análise adequada."

Questão: Quantas pessoas naturais estão envolvidas?
`;

// Resposta esperada: "2 pessoas naturais ([PESSOA_NATURAL_1] e [PESSOA_NATURAL_2])"
// Se IA responder "3 pessoas", seus tokens não estão claros
```

Se a IA não entender bem os tokens:
- **Aumentar contexto**: `[PESSOA_NATURAL_1_REQUERENTE]` em vez de `[PESSOA_NATURAL_1]`
- **Adicionar prompt preamble**: Explicar que [PESSOA_X] significa pessoa diferente
- **Usar nomes genéricos**: `[Pessoa A]`, `[Pessoa B]` em vez de tokens com números

---

## 🎯 Resumo Executivo

| Item | Avaliação | Ação |
|------|-----------|------|
| **Estratégia geral** | ✅ Sólida | Prosseguir com implementação |
| **Remoção de headers** | ✅ Viável | Documentar estrutura primeiro |
| **Tokenização LGPD** | ✅ Recomendado | Criar DataAnonymizer |
| **Masking de processos** | ✅ Necessário | Implementar com hash determinístico |
| **Segurança do mapa** | ⚠️ Crítico | Usar `chrome.storage.session` |
| **Completude** | ⚠️ Importante | Usar NER ou regex adicionais |
| **Conformidade LGPD** | ✅ Garantida | Documentar para auditoria |

---

## 📚 Referências Úteis

### LGPD & Privacidade
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.html)
- Artigo 13, §4º: Pseudonimização
- Artigo 32: Segurança de dados

### Técnicas de Anonimização
- **Tokenização Reversível**: Pseudonimização
- **K-Anonymity**: Indistinguibilidade
- **Differential Privacy**: Ruído estatístico
- **Hash Determinístico**: SHA-256 com salt

### Ferramentas Open-Source
- **Presidio** (Microsoft): NER para PII
- **spaCy**: NLP para detecção de entidades
- **Crypto-JS**: Hashing no navegador

---

**Documento Atualizado**: 01/02/2026  
**Status**: Proposta Analisada ✅ - Pronto para Implementação
