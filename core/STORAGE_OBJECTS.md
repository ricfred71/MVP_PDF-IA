# Estrutura de Objetos no Storage Local

## Visão Geral

Os dados extraídos dos PDFs são salvos no `chrome.storage.local` com chaves estruturadas e objetos otimizados para consulta e processamento posterior.

## Convenção de Chaves

### Petição
```
peticao_{numeroProcesso}_{tipoSanitizado}_{numeroPeticao}
```
**Exemplo:**
```
peticao_929063775_recurso_contra_indeferimento_de_pedido_de_registro_de_marca_valor_por_classe_850240311055
```

### Documento Oficial
```
doc_oficial_{numeroProcesso}_{tipoSanitizado}
```
**Exemplo:**
```
doc_oficial_929063775_despacho_indeferimento
```

### Categoria Desconhecida
```
documento_desconhecido_{timestamp}
```

---

## Estrutura: Objeto PETIÇÃO

### Exemplo Completo

```javascript
{
  // ==========================================
  // METADADOS DE CLASSIFICAÇÃO
  // ==========================================
  "categoria": "peticao",
  "tipo": "pet_recurso_indeferimento",
  "subtipo": "",
  "confianca": 0.968,
  
  // ==========================================
  // DADOS DA PETIÇÃO
  // ==========================================
  "tipoPeticao": "Recurso contra indeferimento de pedido de registro de marca - valor por classe",
  "numeroPeticao": "850240311055",
  "numeroProcesso": "929063775",
  "nossoNumero": "31123252322211720",
  "dataPeticao": "24/06/2024 20:54",
  
  // ==========================================
  // DADOS DO REQUERENTE
  // ==========================================
  "requerente_nome": "YOLOVEYO CONFECÇÕES DE PEÇAS DO VESTUARIO LTDA - ME",
  "requerente_cpfCnpjNumINPI": "34091592000116",
  "requerente_endereco": "RUA BAGDA , 137 - AREIAS - CAMBORIU - SC",
  "requerente_cidade": "Camboriu",
  "requerente_estado": "SC",
  "requerente_cep": "88345-113",
  "requerente_pais": "Brasil",
  "requerente_naturezaJuridica": "Microempresa assim definida em lei",
  "requerente_email": "regina-de-carvalho@hotmail.com",
  
  // ==========================================
  // DADOS DO PROCURADOR
  // ==========================================
  "procurador_nome": null,
  "procurador_cpf": null,
  "procurador_email": null,
  "procurador_numeroAPI": null,
  "procurador_numeroOAB": null,
  "procurador_uf": null,
  "procurador_escritorio_nome": null,
  "procurador_escritorio_cnpj": null,
  
  // ==========================================
  // TEXTO COMPLETO E METADADOS
  // ==========================================
  "textoPeticao": "Recurso contra indeferimento de pedido de registro de marca...",
  "processoRelacionado": "929063775",
  "urlPdf": "http://172.19.0.14:8888/nuxeo/restAPI/default/edmsAPI/getEDocPdfById?eDocId=55747697",
  "dataProcessamento": "2026-01-27T11:52:50.281Z"
}
```

### Campos Principais

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `categoria` | string | Sempre "peticao" | ✅ |
| `tipo` | string | ID canônico do tipo | ✅ |
| `confianca` | number | Score 0-1 de confiança | ✅ |
| `numeroPeticao` | string | Número da petição (12 dígitos) | ✅ |
| `numeroProcesso` | string | Número do processo (9 dígitos) | ✅ |
| `nossoNumero` | string | Número interno (17 dígitos) | ⚠️ |
| `dataPeticao` | string | Data/hora da petição | ⚠️ |
| `requerente_nome` | string | Nome/razão social | ⚠️ |
| `requerente_cpfCnpjNumINPI` | string | CPF/CNPJ/Número INPI | ⚠️ |
| `textoPeticao` | string | Texto completo extraído | ✅ |
| `dataProcessamento` | string | ISO 8601 timestamp | ✅ |

⚠️ = Pode ser `null` se não encontrado no PDF

---

## Estrutura: Objeto DOCUMENTO OFICIAL

### Exemplo Completo (Despacho de Indeferimento)

```javascript
{
  // ==========================================
  // METADADOS DE CLASSIFICAÇÃO
  // ==========================================
  "categoria": "documento_oficial",
  "tipo": "despacho_indeferimento",
  "subtipo": "",
  "confianca": 0.968,
  
  // ==========================================
  // DADOS DO DOCUMENTO
  // ==========================================
  "numeroProcesso": "929063775",
  "dataDespacho": "29/12/2022",
  "tipoDocumento": "Despacho de Indeferimento",
  
  // ==========================================
  // DADOS ESPECÍFICOS DE INDEFERIMENTO
  // ==========================================
  "textoIndeferimento": "A marca reproduz ou imita os seguintes registros de terceiros...",
  "anterioridades": [
    "822293013"
  ],
  "fundamentosLegais": [
    "Art. 124 inc. XIX"
  ],
  "normasInfringidas": [
    "Art. 124 - Não são registráveis como marca: XIX - reprodução ou imitação..."
  ],
  
  // ==========================================
  // TEXTO COMPLETO E METADADOS
  // ==========================================
  "textoCompleto": "Processo de registro de marca Processo 929063775...",
  "processoRelacionado": "929063775",
  "urlPdf": "http://172.19.0.14:8888/nuxeo/restAPI/default/edmsAPI/getEDocPdfById?eDocId=54537580",
  "dataProcessamento": "2026-01-27T11:52:26.692Z",
  "processor": "DataExtractor"
}
```

### Campos Principais

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `categoria` | string | Sempre "documento_oficial" | ✅ |
| `tipo` | string | ID canônico do tipo | ✅ |
| `confianca` | number | Score 0-1 de confiança | ✅ |
| `numeroProcesso` | string | Número do processo (9 dígitos) | ✅ |
| `dataDespacho` | string | Data do despacho/decisão | ⚠️ |
| `tipoDocumento` | string | Tipo original do documento | ⚠️ |
| `textoCompleto` | string | Texto completo extraído | ✅ |
| `dataProcessamento` | string | ISO 8601 timestamp | ✅ |

#### Campos Específicos de Indeferimento

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `textoIndeferimento` | string | Texto da justificativa | ⚠️ |
| `anterioridades` | array | Processos conflitantes | ⚠️ |
| `fundamentosLegais` | array | Artigos citados (resumo) | ⚠️ |
| `normasInfringidas` | array | Artigos completos | ⚠️ |

---

## Estrutura: Objeto CATEGORIA DESCONHECIDA

```javascript
{
  "categoria": "categoriaDesconhecida",
  "tipo": "",
  "subtipo": "",
  "confianca": 0,
  "textoCompleto": "...",
  "dataProcessamento": "2026-01-27T12:00:00.000Z",
  "urlPdf": ""
}
```

---

## Consulta de Dados

### Exemplo: Recuperar Petição

```javascript
// Método 1: Chave conhecida
const key = 'peticao_929063775_recurso_contra_indeferimento_850240311055';
const dados = await chrome.storage.local.get(key);
console.log(dados[key]);

// Método 2: Buscar todas as petições
const allData = await chrome.storage.local.get(null);
const peticoes = Object.entries(allData)
  .filter(([key]) => key.startsWith('peticao_'))
  .map(([key, value]) => ({ key, ...value }));
```

### Exemplo: Buscar por Processo

```javascript
const numeroProcesso = '929063775';
const allData = await chrome.storage.local.get(null);
const docs = Object.entries(allData)
  .filter(([key, value]) => 
    value.numeroProcesso === numeroProcesso || 
    value.processoRelacionado === numeroProcesso
  )
  .map(([key, value]) => ({ key, ...value }));

console.log(`Encontrados ${docs.length} documentos para processo ${numeroProcesso}`);
```

---

## Fluxo de Processamento

```
1. PDF Upload
   ↓
2. PdfReader.loadFromFile()
   → Extrai texto completo
   ↓
3. DocumentClassifier.classificar()
   → Identifica categoria/tipo
   ↓
4. DataExtractor.extrairDados[Peticao|DocOficial]()
   → Extrai campos estruturados
   → Gera chave do storage
   ↓
5. chrome.storage.local.set()
   → Salva objeto no storage
```

---

## Considerações

### Performance
- Objetos são salvos individualmente (não em arrays)
- Permite acesso direto por chave
- Facilita atualizações parciais

### LGPD (Sprint 2)
- Campos sensíveis serão anonimizados antes do salvamento
- Versão original será mantida em memória temporária
- Versão anonimizada será salva no storage

### Extensibilidade
- Estrutura flat facilita acesso aos campos
- Campos `null` indicam dados não encontrados
- Novos campos podem ser adicionados sem quebrar compatibilidade

---

## Manutenção

### Limpeza de Storage
```javascript
// Remove todos os documentos
await chrome.storage.local.clear();

// Remove documentos de um processo específico
const allData = await chrome.storage.local.get(null);
const keysToRemove = Object.keys(allData)
  .filter(key => allData[key].numeroProcesso === '929063775');
await chrome.storage.local.remove(keysToRemove);
```

### Exportação de Dados
```javascript
// Exporta todos os dados
const allData = await chrome.storage.local.get(null);
const json = JSON.stringify(allData, null, 2);
const blob = new Blob([json], { type: 'application/json' });
// ... download blob
```
