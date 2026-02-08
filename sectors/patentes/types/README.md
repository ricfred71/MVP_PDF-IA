# Arquitetura de Types - Extração Customizada por Tipo

## 📋 Visão Geral

A arquitetura de **Types** permite que cada tipo de documento (ex: `recursoIndeferimentoPedidoPatente`) tenha seu próprio extractor customizado com:

- **Classificador específico** (`classifier.js`) - detecta e valida o tipo
- **Extractor especializado** (`extractor.js`) - captura dados específicos do tipo
- **Schema validado** (`schema.js`) - define a estrutura esperada do objeto

## 🏗️ Estrutura de Diretórios

```
sectors/patentes/
├── extractor.js                    (DataExtractor - orquestra)
├── classifier.js                   (PatenteClassifier - classifica por tipo)
└── types/
    ├── index.js                    (Router de tipos)
    ├── tipos-map.js                (Registro de todos os tipos)
    ├── base_extractor_utils.js     (Utilitários compartilhados)
    ├── README.md                   (Este arquivo)
    └── pet_recurso-indef/          (Exemplo: Recurso Indeferimento)
        ├── pet_classifier.js       (Regras específicas deste tipo)
        ├── pet_extractor.js        (Lógica de extração deste tipo)
        ├── pet_schema.js           (Estrutura esperada)
        └── pet_relacionado.js      (Informações relacionadas)
```

## 🔄 Fluxo de Execução

```
1. Arquivo selecionado (PDF de patente)
   ↓
2. PatenteClassifier.classificar()
   → Identifica: categoria = 'peticao', tipoId = 'recursoIndeferimentoPedidoPatente'
   ↓
3. DataExtractor.extrairDadosPeticao()
   ↓
4. getExtractorForTipo(tipoId) 
   → Retorna RecursoIndefExtractor se tipo está registrado
   → Retorna null se tipo é genérico (fallback)
   ↓
5. Se específico: RecursoIndefExtractor.extract()
   Se genérico: DataExtractor usa lógica padrão
   ↓
6. Retorna { storageKey, dados, validacao }
   ↓
7. Salva em chrome.storage.local[storageKey]
```

## ✨ Características

### ✅ Mantém Classificação Existente
- Sistema de `setor → categoria → tipo` preservado
- Compatível com código existente

### ✅ Extração Especificada por Tipo
- Cada tipo pode ter seus próprios campos
- Lógica customizada por tipo

### ✅ Escalável
- Adicionar novos tipos é simples
- Código reutilizável e modular

### ✅ Documentado
- Cada tipo tem sua documentação
- Exemplos de uso disponíveis

### ✅ Validação de Dados
- Schema define campos obrigatórios/opcionais
- Validação acontece automaticamente

## 📝 Tipos Mapeados

### Petições

| ID | Abreviação | Descricao |
|----|-----------|-----------|
| `recursoIndeferimentoPedidoPatente` | `recurso-indef` | Recurso contra Indeferimento de Pedido de Patente |

### Documentos Oficiais (prefixo `doc_`)

| ID | Abreviação | Descricao |
|----|-----------|-----------|
| `recursoIndeferimentoNaoProvido` | `recurso-indef--naoProv` | Despacho: Recurso não provido |
| `recursoIndeferimentoProvido` | `recurso-indef--provido` | Despacho: Recurso provido |
| `recursoIndeferimentoProvidoParcial` | `recurso-indef--provParcial` | Despacho: Recurso provido parcialmente |

## 🔧 API de Tipos

### `tipos-map.js`

```javascript
// Obter informações de um tipo
const tipoConfig = getTipo('recursoIndeferimentoPedidoPatente');
// → { id, abreviacao, categoria, folder, schemaFile, extractorFile, ... }

// Verificar se é petição
const isPet = isPeticao('recursoIndeferimentoPedidoPatente'); // true

// Verificar se é documento
const isDoc = isDocumentoOficial('recursoIndeferimentoNaoProvido'); // true

// Obter documentos relacionados a petição
const docs = getDocumentosRelacionados('recursoIndeferimentoPedidoPatente');
// → [ { ...config do doc1 }, { ...config do doc2 }, ... ]
```

### `index.js`

```javascript
// Obter extractor para um tipo (assíncrono)
const extractor = await getExtractorForTipo(tipoId, dataExtractor);
if (extractor) {
  const resultado = extractor.extract(texto, classificacao);
}

// Versão síncrona para tipos pré-carregados
const extractor = getExtractorForTipoSync(tipoId, dataExtractor);

// Listar tipos disponíveis
const tipos = getTiposDisponiveis(); // Todos os tipos
const peticoes = getTiposPeticaoDisponiveis(); // Apenas petições
const docs = getTiposDocumentosDisponiveis(); // Apenas documentos
```

## 🛠️ Como Adicionar um Novo Tipo

Veja o arquivo `CHECKLIST_NOVO_TIPO.md` para um guia passo-a-passo.

Resumo rápido:

1. Criar diretório `types/pet_novo-tipo/`
2. Implementar `pet_classifier.js` (detecção)
3. Implementar `pet_extractor.js` (extração)
4. Implementar `pet_schema.js` (validação)
5. Registrar em `tipos-map.js`
6. Adicionar import em `index.js`

## 📚 Documentação Relacionada

- [00_COMECE_AQUI.md](00_COMECE_AQUI.md) - Resumo rápido
- [CHECKLIST_NOVO_TIPO.md](CHECKLIST_NOVO_TIPO.md) - Guia passo-a-passo
- [EXEMPLO_UTILIZACAO.js](EXEMPLO_UTILIZACAO.js) - Exemplos práticos
- [ARQUITETURA_IMPLEMENTADA.md](ARQUITETURA_IMPLEMENTADA.md) - Detalhes técnicos
