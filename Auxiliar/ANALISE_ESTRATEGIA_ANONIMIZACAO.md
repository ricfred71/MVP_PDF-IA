# Estratégia de Anonimização LGPD - Status de Implementação

**Data de criação**: 01/02/2026  
**Última atualização**: 15/02/2026 (Advanced LGPD anonimization completa em todos 4 extractors)  
**Contexto**: Extensão IPAS - Anonimização de documentos para envio a IAs gratuitas  
**Conformidade**: LGPD (Lei Geral de Proteção de Dados, lei 13.709/2018).

---

## 📋 Visão Geral

Estratégia de **Tokenização/Pseudonimização Reversível** implementada em 3 etapas:

1. **Remoção de cabeçalhos automáticos** (metadados identificadores)
2. **Tokenização semântica de dados LGPD** (campos sensíveis mapeados)
3. **Tokenização genérica de padrões numéricos** (CPF, CNPJ, processos, protocolos)

LGPD (Lei Geral de Proteção de Dados, lei 13.709/2018).
	**Conceito de Anonimização**:**
	Art. 5º, inc. XI: "*anonimização: utilização de meios técnicos razoáveis e disponíveis no momento do tratamento, por meio dos quais um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo;*"
	**Conceito de Pseudonimização:**
	Art. 13 , § 4º: "*Para os efeitos deste artigo, a pseudonimização é o tratamento por meio do qual um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo, senão pelo uso de informação adicional mantida separadamente pelo controlador em ambiente controlado e seguro*".
	**Conceito de Tokenização:**
	A tokenização é uma técnica que substitui dados sensíveis por tokens únicos e seguros. Um token é uma representação digital de um signo.

### Status Atual por Tipo de Documento

| Tipo | Tokenização Básica | Regex Flexível | Auditoria | Logs Debug |
|------|:------------------:|:--------------:|:---------:|:----------:|
| **Marcas > Petição > Recurso Indef** | ✅ | ✅ | ✅ | ✅ |
| **Patentes > Petição > Recurso Indef** | ✅ | ✅ | ✅ | ✅ |
| **Marcas > Doc Oficial > Recurso Não Provido** | ✅ | ✅ | ✅ | ✅ |
| **Patentes > Doc Oficial > Recurso Não Provido** | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 Funcionalidades Implementadas (Comuns a Todos)

### ✅ 1. Tokenização Semântica Básica
- Substituição de valores extraídos por tokens com tipo semântico
- Exemplo: `João Silva` → `[REQUERENTE_1]`, `123.456.789-00` → `[CPF_1]`
- Preserva contexo semântico para a IA entender papéis
- Determinístico: mesmo valor = mesmo token em todo o documento

### ✅ 2. Mapeamento Reversível
- Mapa `tokenToValue` e `valueToToken` armazenado em `chrome.storage.session`
- Permite destokenização das respostas da IA
- Chave: `lgpd_map_{storageKey}`
- Limpeza automática ao fechar a sessão

### ✅ 3. Tokenização de Padrões Genéricos
Regex para capturar padrões comuns não mapeados explicitamente:
- **CNPJ**: `/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/` e `/\b\d{14}\b/`
- **CPF**: `/\b\d{11}\b/`
- **Protocolo**: `/\b\d{12}\b/` (12 dígitos)
- **Processo**: `/\b\d{9}\b/` (9 dígitos)

### ✅ 4. Remoção de Cabeçalhos/Rodapés Repetidos
- Remove texto que se repete em múltiplas páginas
- Detecta padrões: "Página X de Y", dados de contato INPI, etc.
- Reduz ruído e tamanho do texto para IA

---

## 📂 Implementação Específica por Tipo

### ✅ Marcas > Petição > Recurso contra Indeferimento

**Arquivo**: [`sectors/marcas/types/pet_recurso-indef/pet_extractor.js`](../sectors/marcas/types/pet_recurso-indef/pet_extractor.js)

#### Campos Anonimizados
```javascript
const listaLgpd = [
  'form_numeroPeticao',          // 12 dígitos
  'form_numeroProcesso',         // 9 dígitos
  'form_nossoNumero',            // 17 dígitos
  'form_requerente_nome',        // Nome/Razão Social
  'form_requerente_cpfCnpjNumINPI',  // CPF/CNPJ/Nº INPI
  'form_requerente_endereco',    // Endereço completo
  'form_requerente_cep',         // CEP
  'form_requerente_email',       // E-mail
  'form_procurador_nome',        // Nome procurador
  'form_procurador_cpf',         // CPF procurador
  'form_procurador_email',       // E-mail procurador
  'form_procurador_numeroAPI',   // Nº API
  'form_procurador_numeroOAB',   // Nº OAB
  'form_procurador_escritorio_nome',   // Nome escritório
  'form_procurador_escritorio_cnpj'    // CNPJ escritório
];
```

#### ✅ Funcionalidades Avançadas Implementadas

**1. Regex Flexível para Variantes**
- **Estratégia por campo**: cada campo tem uma estratégia de matching
- **Tipos de matching**:
  - `digits`: aceita separadores opcionais (`123456789` ↔ `123.456.789` ↔ `123-456-789`)
  - `alnum`: alfanuméricos com separadores (`ABC123` ↔ `ABC-123`)
  - `text`: texto com pontuação flexível (`João Silva` ↔ `João/Silva`)
  - `mixed`: combinação de digits + text

```javascript
const fieldToStrategy = {
  form_numeroPeticao: 'digits',
  form_numeroProcesso: 'digits',
  form_nossoNumero: 'digits',
  form_procurador_numeroAPI: 'alnum',
  form_procurador_numeroOAB: 'alnum',
  form_requerente_cep: 'digits',
  form_requerente_cpfCnpjNumINPI: 'mixed',
  form_procurador_cpf: 'digits',
  form_procurador_escritorio_cnpj: 'digits',
  form_requerente_nome: 'text',
  form_procurador_nome: 'text',
  form_procurador_escritorio_nome: 'text',
  form_requerente_endereco: 'text'
};
```

**2. Auditoria Pós-Tokenização**
- Reaplica as mesmas regex após tokenização
- Detecta vazamentos (valores que escaparam)
- Loga campos com vazamento: `console.warn('[RecursoIndefExtractor] ⚠️ Possivel vazamento LGPD detectado:', vazamentosLgpd)`

**3. Logs de Debug**
- Logs de cada campo durante tokenização:
  - `console.log('[RecursoIndefExtractor] LGPD matches:', campo, totalMatches)`
  - `console.log('[RecursoIndefExtractor] LGPD sem match:', campo)`
- Logs de vazamento na auditoria:
  - `console.log('[RecursoIndefExtractor] LGPD vazamento match:', campo, totalMatches)`
- Enviados também via `chrome.runtime.sendMessage({ type: 'LGPD_DEBUG', payload })`

**4. Helpers Reutilizáveis**
```javascript
_buildFlexibleDigitsRegex(digits)     // Regex para números com separadores
_buildFlexibleAlnumRegex(value)       // Regex para alfanuméricos
_buildFlexibleTextRegex(value)        // Regex para texto com pontuação
_getLgpdRegexesForField(campo, valor) // Retorna todas as regex para um campo
_countRegexMatches(texto, regexes)    // Conta matches totais
_auditarVazamentoLgpd(texto, dados)   // Auditoria completa
_logLgpdDebug(evento, dados)          // Log unificado
```

---

### ✅ Patentes > Petição > Recurso contra Indeferimento

**Arquivo**: [`sectors/patentes/types/pet_recurso-indef/pet_extractor.js`](../sectors/patentes/types/pet_recurso-indef/pet_extractor.js)

#### Campos Anonimizados
```javascript
const listaLgpd = [
  'form_numeroPeticao',          // 12 dígitos
  'form_numeroProcesso',         // 9 dígitos
  'form_nossoNumero',            // 17 dígitos
  'form_requerente_nome',        // Nome/Razão Social
  'form_requerente_cpfCnpjNumINPI',  // CPF/CNPJ/Nº INPI
  'form_requerente_endereco',    // Endereço completo
  'form_requerente_cep',         // CEP
  'form_requerente_email',       // E-mail
  'form_procurador_nome',        // Nome procurador (pessoa física)
  'form_procurador_cpf',         // CPF procurador
  'form_procurador_email',       // E-mail procurador
  'form_procurador_numeroAPI',   // Nº API
  'form_procurador_numeroOAB',   // Nº OAB
  'form_procurador_escritorio_nome',   // Nome escritório (pessoa jurídica)
  'form_procurador_escritorio_cnpj'    // CNPJ escritório
];
```

#### ✅ Funcionalidades Avançadas Implementadas
- ✅ Regex flexível para variantes (digits/alnum/text/mixed)
- ✅ Auditoria pós-tokenização
- ✅ Logs de debug (console)
- ✅ 15 campos sensíveis anonimizados (sem include de cidade/estado/nacionalidade/natureza jurídica)

---

### ✅ Marcas > Documento Oficial > Recurso Não Provido

**Arquivo**: [`sectors/marcas/types/doc_recurso-indef--naoProv/doc_extractor.js`](../sectors/marcas/types/doc_recurso-indef--naoProv/doc_extractor.js)

#### Campos Anonimizados
```javascript
const listaLgpd = [
  'form_numeroProcesso',
  'form_dataDespacho',
  'form_numeroProtocolo',
  'form_dataApresentacao',
  'form_requerente_nome',
  'form_dataNotificacaoIndeferimento',
  'form_marca',
  'motivoIndeferimento',
  'anterioridades',
  'processosConflitantes'
];
```

#### ✅ Funcionalidades Avançadas Implementadas
- ✅ Regex flexível para variantes (digits/text)
- ✅ Auditoria pós-tokenização
- ✅ Logs de debug (console)
- ✅ Suporte a arrays (anterioridades, processosConflitantes)

---

### ✅ Patentes > Documento Oficial > Recurso Não Provido

**Arquivo**: [`sectors/patentes/types/doc_recurso-indef--naoProv/doc_extractor.js`](../sectors/patentes/types/doc_recurso-indef--naoProv/doc_extractor.js)

#### Campos Anonimizados (8 campos LGPD)
```javascript
const listaLgpd = [
  'form_numeroProcesso',              // 9 dígitos
  'form_numeroPct',                   // Formato PCT (e.g., "BR2023001234")
  'form_prioridadeUnionista',         // Data (e.g., "01/01/2020")
  'form_requerente_nome',             // Nome/Razão Social
  'form_inventor_nome',               // Nome inventor
  'form_titulo',                      // Título da invenção
  'dataDespacho',                     // Data (e.g., "15/02/2026")
  'dataNotificacaoIndeferimento'      // Data (e.g., "20/02/2026")
];
```

#### ✅ Funcionalidades Avançadas Implementadas

**1. Regex Flexível por Campo**
- **Estratégia por campo**:
  - `digits`: `form_numeroProcesso`, `form_numeroPct`, `form_prioridadeUnionista`, `dataDespacho`, `dataNotificacaoIndeferimento`
  - `text`: `form_requerente_nome`, `form_inventor_nome`, `form_titulo`

**2. Auditoria Pós-Tokenização**
- Método `_auditarVazamentoLgpd()` reobtém as regex e valida se há vazamentos
- Log: `console.warn('[DocRecursoIndefNaoProvExtractor] ⚠️ Possivel vazamento LGPD detectado:', vazamentosLgpd)`

**3. Logs de Debug**
- Durante tokenização: `console.log('[DocRecursoIndefNaoProvExtractor] LGPD matches:', campo, totalMatches)`
- Durante auditoria: `console.log('[DocRecursoIndefNaoProvExtractor] LGPD vazamento match:', campo, totalMatches)`

**4. Helpers Implementados**
```javascript
_buildFlexibleDigitsRegex(digits)     // Regex flexível para dígitos
_buildFlexibleAlnumRegex(value)       // Regex para alfanuméricos
_buildFlexibleTextRegex(value)        // Regex para texto com pontuação
_getLgpdFieldStrategies()             // Mapa estratégia → campo
_getLgpdRegexesForField(campo, ...) // Gera regex literal + variantes
_countRegexMatches(texto, regexes)    // Conta matches totais
_auditarVazamentoLgpd(texto, dados)   // Auditoria completa
_escapeRegExp(valor)                  // Escapa especiais regex
```

#### Diferenças Estruturais
- **Simplificação de variáveis**: Removidas redundâncias (tipoDespacho, form_decisao)
- **Campos mantidos**: nomeDespacho (texto literal) + decisao (enum código)
- **Métodos desativados**: _extrairArtigosInvocados, _extrairMotivoIndeferimento, _extrairAnterioridades, _extrairProcessosConflitantes (específicos de marcas, não aplicáveis)

---
```

#### ⚠️ Funcionalidades Pendentes
- ❌ Regex flexível para variantes
- ❌ Auditoria pós-tokenização
- ❌ Logs de debug

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

## ✅ Auditoria de Vazamento (pos-tokenizacao)

Depois de gerar `textoParaIa`, fazemos uma segunda passagem de validacao usando **as mesmas regex flexiveis** da tokenizacao. Se alguma variante ainda casar no texto tokenizado, registramos o campo com possivel vazamento.

Beneficios:
- Evita confiar apenas na substituicao literal.
- Detecta casos onde o valor aparece com separadores diferentes.
- Permite logar ou bloquear envios com risco.

Exemplo de fluxo:
```javascript
const { textoParaIa } = tokenizar(...);
const vazamentos = auditarVazamento(textoParaIa, dados, listaLgpd);
if (vazamentos.length) console.warn('Vazamentos:', vazamentos);
```

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
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
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

## 💡 SUGESTÕES E PRÓXIMOS PASSOS

> **⚠️ IMPORTANTE**: As seções abaixo contêm **análises, recomendações e propostas de melhorias futuras**.  
> **NÃO** representam funcionalidades já implementadas. Use a seção de Status (topo do documento) para identificação clara.

---

### 🔄 Replicar Funcionalidades Avançadas nos Extractors Pendentes

#### Prioridade Alta

- [x] **Implementar regex flexível em Patentes > Petição > Recurso Indef** ✅ **CONCLUÍDO (15/02/2026)**
  - Copiar helpers de `pet_extractor.js` (Marcas)
  - Adaptar `_getLgpdFieldStrategies()` para campos específicos de patentes
  - Testar com PDFs reais de patentes

- [ ] **Implementar regex flexível em Marcas > Doc Oficial > Recurso Não Provido**
  - Copiar helpers de `pet_extractor.js` (Marcas)
  - Adaptar estratégias para campos de formulário (`form_*`)
  - Validar com documentos oficiais

- [x] **Implementar regex flexível em Patentes > Doc Oficial > Recurso Não Provido** ✅ CONCLUÍDO
  - Copiar helpers já adaptados
  - Ajustar para campos únicos de patentes (PCT, inventor, título)
  - Testar cobertura completa

- [ ] **Implementar auditoria pós-tokenização nos 3 extractors restantes**
  - Adicionar `_auditarVazamentoLgpd()` em todos
  - Logar vazamentos detectados via `_logLgpdDebug()`
  - Considerar bloquear envio para IA se houver vazamento crítico (CPF/CNPJ)

- [ ] **Adicionar logs de debug nos 3 extractors restantes**
  - Implementar `_logLgpdDebug()` em todos
  - Configurar listener no service worker para `type: 'LGPD_DEBUG'`
  - Adicionar flag de configuração para ligar/desligar logs em produção

#### Prioridade Média

- [ ] **Centralizar helpers em módulo compartilhado**
  - Criar `utils/lgpd_tokenization_helpers.js`
  - Exportar funções: `buildFlexibleDigitsRegex`, `buildFlexibleAlnumRegex`, `buildFlexibleTextRegex`
  - Evitar duplicação de código entre 4 extractors
  - Facilitar manutenção e testes unitários

- [ ] **Adicionar configuração de logs via Options Page**
  - Campo checkbox: "Ativar logs de depuração LGPD"
  - Salvar em `chrome.storage.sync`
  - Verificar flag antes de chamar `_logLgpdDebug()`
  - Evitar poluição de logs em ambiente de produção

- [ ] **Criar testes unitários para regex flexíveis**
  - Testar variantes: `123.456.789`, `123-456-789`, `123 456 789`
  - Validar textos: `João Silva`, `João-Silva`, `João.Silva`
  - Garantir que código alfanumérico: `ABC123-XY`, `ABC-123-XY`, `ABC 123 XY` sejam detectados

#### Prioridade Baixa

- [ ] **Dashboard de auditoria LGPD**
  - Criar página de relatórios de vazamentos detectados
  - Exibir histórico de substituições
  - Permitir exportação de logs para compliance

- [ ] **Implementar cleanup automático de mapas**
  - Limpar mapas de tokenização com mais de 24h
  - Notificar usuário antes de limpar
  - Adicionar opção manual de limpeza

---

### 🚨 Desafios Técnicos Identificados

> **Nota**: Estes desafios foram identificados durante análise do código. Soluções propostas abaixo.

#### 1. **Separação de Dados Compostos no `_extrairRequerente()`**

**Problema**: No `_extrairRequerente()`, o texto geralmente vem como:
```
Requerente: João Silva Oliveira - Empresa XYZ LTDA - CPF 123.456.789-00
```

O código atual extrai tudo junto. O ideal seria separar:
- Nome pessoa física ← `[REQUERENTE_PESSOA_NATURAL_1]`
- Empresa ← `[REQUERENTE_PESSOA_JURIDICA_1]`
- CPF ← `[CPF_1]`

**Sugestão de implementação**:
```javascript
_extrairRequerente(texto) {
  const regex = /Requerente:\s*([^-\n]+?)(?:\s*-\s*([^-\n]+?))?(?:\s*-\s*CPF\s*([0-9.\-]+))?/i;
  const match = texto.match(regex);
  
  if (!match) return { nome: null, empresa: null, cpf: null };
  
  return {
    nome: match[1]?.trim() || null,
    empresa: match[2]?.trim() || null,
    cpf: match[3]?.trim() || null
  };
}
```

Depois, tokenizar cada campo individualmente no `_tokenizarTextoParaIa()`.

---

#### 2. **Nomes Não Capturados em Texto Livre (Parecer Técnico)**

**Problema**: O parecer técnico pode conter nomes não capturados pelo extrator:
```
"... conforme entendimento de João Silva, técnico responsável..."
```

Este nome **NÃO** é capturado pelo `_extrairTecnico()` porque não está no formato padrão.

**Soluções possíveis**:

**Opção A: NER (Named Entity Recognition) automático**
- Usar biblioteca como **spaCy** ou **Presidio** (Microsoft)
- Detectar automaticamente entidades `PERSON`
- ⚠️ **Risco**: Falsos positivos (nomes de marcas, lugares)

**Opção B: Regex adicional para padrões comuns**
```javascript
// Detectar "Sr./Sra. Nome Sobrenome"
const regexTitulo = /\b(?:Sr\.|Sra\.|Dr\.|Dra\.)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+){1,3})/g;

// Detectar "nome próprio + cargo"
const regexCargo = /\b([A-Z][a-záéíóúâêôãõç]+(?:\s+[A-Z][a-záéíóúâêôãõç]+){1,3}),\s+(?:técnico|perito|especialista|analista)/gi;
```
- ⚠️ **Risco**: Ainda pode ter falsos positivos/negativos

**Opção C: Aceitar limitação**
- Documentar que nomes dispersos em texto livre **não são tokenizados**
- Justificativa: Trade-off entre automação e precisão
- Adicionar aviso ao usuário: "Nomes não estruturados podem não ser anonimizados"

**Recomendação**: Implementar **Opção B** (regex adicional) como primeiro passo. Avaliar **Opção A** (NER) se houver muitos casos não cobertos.

---

#### 3. **Contexto Semântico de Processos Relacionados**

**Problema**: Processos relacionados ao mesmo requerente perdem esse vínculo após tokenização:
```
Processo 123456789 (João Silva) → [PROCESSO_CITADO_1]
Processo 234567890 (João Silva) → [PROCESSO_CITADO_2]
Processo 345678901 (Maria Santos) → [PROCESSO_CITADO_3]
```

A IA não sabe que `[PROCESSO_CITADO_1]` e `[PROCESSO_CITADO_2]` são da **mesma pessoa**.

**Soluções possíveis**:

**Opção A: Hash determinístico baseado no requerente**
```javascript
// Gerar ID único por requerente
const requerenteHash = sha256(requerente).substring(0, 8);
const token = `[PROCESSO_REQUERENTE_${requerenteHash}_1]`;
// Problema: Ainda identifica requerente (derrota o propósito)
```

**Opção B: Manter metadados adicionais (sem expor no texto)**
```javascript
// No mapa de tokens, incluir relação
tokenMap: {
  "[PROCESSO_CITADO_1]": {
    numero: "123456789",
    requerenteRef: "REQUERENTE_1"  // Link interno
  },
  "[PROCESSO_CITADO_2]": {
    numero: "234567890",
    requerenteRef: "REQUERENTE_1"  // Mesmo requerente
  }
}
// IA não vê isso, mas você pode usar para análise posterior
```

**Opção C: Aceitar limitação (trade-off privacidade vs contexto)**
- Documentar que vínculo entre processos é perdido
- Justificativa: Máxima proteção LGPD
- A IA analisa processos como entidades independentes

**Recomendação**: Implementar **Opção B** (metadados internos) para auditoria futura, mas **não expor** no texto enviado à IA.

---

### 🔒 Considerações de Segurança e Compliance

#### Armazenamento do Mapa de Tokens

**Implementação atual**: `chrome.storage.session`
- ✅ Dados apagados automaticamente ao fechar aba/navegador
- ✅ Isolado por origem (extensão)
- ⚠️ Vulnerável se outra extensão maliciosa tiver acesso ao storage

**Alternativas a considerar**:

| Opção | Vantagens | Desvantagens | Uso recomendado |
|-------|-----------|--------------|-----------------|
| **session storage** | Auto-cleanup, baixo risco | Perdido ao fechar aba | Análises pontuais (atual) ✅ |
| **local storage** | Persistente, reutilizável | Maior exposição | Mapas de longo prazo |
| **Memória (variável)** | Máxima privacidade | Perdido ao recarregar | Testes rápidos |
| **Criptografado** | Segurança adicional | Overhead implementação | Dados altamente sensíveis |

**Recomendação**: 
- Manter `chrome.storage.session` como está
- Adicionar aviso ao usuário: "Seu mapa de anonimização será deletado ao fechar esta aba"
- Considerar criptografia adicional **apenas se** armazenar em `local` storage

---

#### Validação com IA antes de Produção

Antes de produção, validar se a IA compreende os tokens:

```javascript
// Prompt de teste completo
const promptTeste = `
Você está analisando um documento anonimizado do INPI. 
Os códigos entre colchetes representam dados protegidos:
- [REQUERENTE_X]: Nome de pessoa natural
- [PESSOA_JURIDICA_X]: Nome de empresa
- [PROCESSO_CITADO_X]: Número de processo
- [CPF_X]: CPF
- [TECNICO_X]: Nome de técnico/perito

Documento:
"[REQUERENTE_1] solicitou registro de marca.
A empresa [PESSOA_JURIDICA_1] alegou conflito com processo [PROCESSO_CITADO_1].
Parecer técnico de [TECNICO_1]: 'Houve falta de análise adequada.'
CPF do requerente: [CPF_1]"

Questões:
1. Quantas pessoas naturais estão envolvidas?
2. Quantas empresas estão envolvidas?
3. Há algum conflito de interesse entre [REQUERENTE_1] e [PESSOA_JURIDICA_1]?
`;

// Respostas esperadas:
// 1. "2 pessoas naturais ([REQUERENTE_1] e [TECNICO_1])"
// 2. "1 empresa ([PESSOA_JURIDICA_1])"
// 3. "Sim, a empresa alegou conflito com o processo do requerente"
```

**Se a IA não entender**:
- **Aumentar contexto nos tokens**: `[REQUERENTE_PESSOA_NATURAL_1]` em vez de `[REQUERENTE_1]`
- **Adicionar prompt preamble padrão**: Explicar sistema de tokens em toda requisição
- **Usar nomes genéricos**: `[Pessoa A]`, `[Empresa X]` (menos técnico, mais legível)

---

### 📊 Matriz de Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação | Status |
|-------|---------------|---------|-----------|--------|
| **Vazamento de CPF/CNPJ** | Média | Alto | Regex flexível + auditoria | ✅ Implementado (Marcas Pet) |
| **Nomes dispersos não detectados** | Alta | Médio | Regex adicional + NER | ❌ Pendente |
| **Contexto perdido (processos)** | Alta | Baixo | Aceitar limitação | ⚠️ Documentado |
| **Mapa exposto a extensão maliciosa** | Baixa | Alto | Session storage + aviso | ✅ Implementado |
| **IA não compreende tokens** | Média | Médio | Prompt preamble | ❌ Pendente teste |
| **Performance lenta (regex múltiplas)** | Baixa | Baixo | Otimização regex | ✅ Não detectado |
| **Re-identificação por combinação** | Baixa | Médio | Limitar metadados expostos | ⚠️ Aceitar |

---

### 📚 Referências e Recursos

#### LGPD & Compliance
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.html)  
  - Artigo 13, §4º: Pseudonimização como técnica válida
  - Artigo 32: Segurança de dados pessoais
- [Guia de Boas Práticas LGPD - ANPD](https://www.gov.br/anpd)

#### Técnicas de Anonimização
- **Tokenização Reversível**: Pseudonimização (implementado)
- **K-Anonymity**: Indistinguibilidade em conjunto de dados
- **Differential Privacy**: Ruído estatístico para datasets
- **Hash Determinístico**: SHA-256 com salt

#### Ferramentas Open-Source
- **[Presidio](https://github.com/microsoft/presidio)** (Microsoft): NER para detecção de PII
- **[spaCy](https://spacy.io/)**: NLP para detecção de entidades nomeadas
- **[Crypto-JS](https://github.com/brix/crypto-js)**: Hashing SHA-256 no navegador

#### Artigos Acadêmicos
- *"A systematic literature review on compliance with the LGPD"* (2023)
- *"Privacy-Preserving Techniques for Legal Document Analysis"* (2022)

---

### ✅ Checklist de Expansão (Roadmap)

#### Curto Prazo (1-2 semanas)
- [ ] Replicar regex flexível para **Patentes > Petição**
- [ ] Replicar regex flexível para **Marcas > Doc Oficial**
- [ ] Replicar regex flexível para **Patentes > Doc Oficial**
- [ ] Implementar auditoria em todos os 3 extractors pendentes
- [ ] Adicionar `_logLgpdDebug()` em todos os 3 extractors
- [ ] Criar listener no service worker para receber logs `LGPD_DEBUG`
- [ ] Testar vazamentos com PDFs reais de cada tipo

#### Médio Prazo (3-4 semanas)
- [ ] Centralizar helpers em `utils/lgpd_tokenization_helpers.js`
- [ ] Adicionar testes unitários para regex flexíveis
- [ ] Implementar flag de configuração para logs (Options Page)
- [ ] Validar compreensão da IA com bateria de prompts de teste
- [ ] Melhorar `_extrairRequerente()` para separar nome/empresa/CPF
- [ ] Adicionar regex adicional para detectar nomes em texto livre
- [ ] Documentar para usuário final (Guia de Anonimização LGPD)

#### Longo Prazo (2-3 meses)
- [ ] Avaliar viabilidade de NER automático (Presidio/spaCy)
- [ ] Implementar detecção de endereços não estruturados
- [ ] Criar dashboard de auditoria LGPD (histórico de vazamentos)
- [ ] Automatizar cleanup de mapas antigos (TTL 24h)
- [ ] Adicionar criptografia adicional do mapa (se migrar para local storage)
- [ ] Implementar metadados relacionais (processos ↔ requerentes)
- [ ] Criar exportação de relatórios de compliance LGPD

---

**Documento Atualizado**: 15/02/2026  
**Status**: ✅ Funcionalidades Avançadas Implementadas em **Marcas > Petição** + **Patentes > Petição (NOVO)** | ⚠️ Expansão Pendente para Outros 2 Tipos de Documentos Oficiais  
**Versão**: 2.1 - Refletindo Implementação Real com Expansão para Patentes
