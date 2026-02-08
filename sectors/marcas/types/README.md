# Arquitetura de Types - Extração Customizada por Tipo

## 📋 Visão Geral

A arquitetura de **Types** permite que cada tipo de documento (ex: `recursoIndeferimentoPedidoRegistro`) tenha seu próprio extractor customizado com:

- **Classificador específico** (`classifier.js`) - detecta e valida o tipo
- **Extractor especializado** (`extractor.js`) - captura dados específicos do tipo
- **Schema validado** (`schema.js`) - define a estrutura esperada do objeto

## 🏗️ Estrutura de Diretórios

```
sectors/marcas/
├── extractor.js                    (DataExtractor - orquestra)
├── classifier.js                   (MarcasClassifier - classifica por tipo)
└── types/
    ├── index.js                    (Router de tipos)
    └── recurso-indeferimento/
        ├── classifier.js           (Regras específicas deste tipo)
        ├── extractor.js            (Lógica de extração deste tipo)
        └── schema.js               (Estrutura esperada)
```

## 🔄 Fluxo de Execução

```
1. Arquivo selecionado
   ↓
2. MarcasClassifier.classificar()
   → Identifica: categoria = 'peticao', tipoId = 'recursoIndeferimentoPedidoRegistro'
   ↓
3. DataExtractor.extrairDadosPeticao()
   ↓
4. getExtractorForTipo(tipoId) 
   → Retorna RecursoInderimentoExtractor se tipo está registrado
   → Retorna null se tipo é genérico (fallback)
   ↓
5. Se específico: RecursoInderimentoExtractor.extract()
   Se genérico: DataExtractor usa lógica padrão
   ↓
6. Retorna { storageKey, dados, validacao }
   ↓
7. Salva em chrome.storage.local[storageKey]
```

## ✨ Características

### ✅ Mantém Classificação Existente
- Sistema de `setor → categoria → tipo` preservado
- MarcasClassifier continua funcionando normalmente
- Compatível com patentes, documentos oficiais, etc

### ✅ Separação de Responsabilidades
- Cada tipo tem seu próprio diretório isolado
- Fácil adicionar novo tipo sem impactar outros
- Testes unitários por tipo

### ✅ Fallback Automático
- Se tipo não tem extractor específico, usa genérico
- Permite evolução incremental

### ✅ Validação de Schema
- Cada tipo define campos obrigatórios
- Valida tipos de dados
- Confere padrões regex

## 📦 Tipos Implementados

### 1. **recursoIndeferimentoPedidoRegistro**

**Arquivos:**
- `types/recurso-indeferimento/classifier.js` - Detecta este tipo
- `types/recurso-indeferimento/extractor.js` - Extrai dados
- `types/recurso-indeferimento/schema.js` - Define estrutura

**Dados Capturados:**
- ✅ Número da petição (12 dígitos)
- ✅ Número do processo (9 dígitos)
- ✅ Dados do requerente (nome, CPF/CNPJ, endereço, etc)
- ✅ Dados do procurador (nome, OAB, etc)
- ✅ Data da petição
- ✅ Texto completo

**Próximas Expansões (placeholders já prontos):**
- [ ] Fundamentação do recurso
- [ ] Classes recorridas
- [ ] Valor da causa

## 🚀 Como Adicionar Novo Tipo

### Passo 1: Criar Diretório
```bash
mkdir types/novo-tipo
```

### Passo 2: Criar `classifier.js`
```javascript
// types/novo-tipo/classifier.js

export const NOVO_TIPO_CLASSIFIER = {
  id: 'novoTipo',
  descricao: 'Descrição do novo tipo',
  test: (texto) => {
    return texto.includes('padrão identificador');
  },
  calculateConfidence: (texto) => 0.95
};
```

### Passo 3: Criar `extractor.js`
```javascript
// types/novo-tipo/extractor.js

export class NovoTipoExtractor {
  constructor(dataExtractor) {
    this.dataExtractor = dataExtractor;
  }
  
  extract(textoCompleto, classificacao, urlPdf = '') {
    // Lógica específica do tipo
    return {
      storageKey,
      dados,
      validacao
    };
  }
}
```

### Passo 4: Criar `schema.js`
```javascript
// types/novo-tipo/schema.js

export const NOVO_TIPO_SCHEMA = {
  campo1: { type: 'string', required: true },
  campo2: { type: 'number', required: false }
  // ...
};
```

### Passo 5: Registrar em `types/index.js`
```javascript
import { NovoTipoExtractor } from './novo-tipo/extractor.js';

const TYPE_EXTRACTORS_MAP = {
  'recursoIndeferimentoPedidoRegistro': RecursoInderimentoExtractor,
  'novoTipo': NovoTipoExtractor  // ← Adicionar aqui
};
```

## 🔗 Integração com o DataExtractor

O DataExtractor principal foi atualizado para:

1. Tentar obter extractor específico
2. Se encontrado, delegar a extração
3. Se não encontrado, usar lógica genérica

```javascript
// Em sectors/marcas/extractor.js

extrairDadosPeticao(textoCompleto, classificacao, urlPdf = '') {
  const extractorEspecifico = getExtractorForTipo(classificacao.tipoId, this);
  
  if (extractorEspecifico) {
    return extractorEspecifico.extract(textoCompleto, classificacao, urlPdf);
  }
  
  // Fallback genérico
  return this._extrairDadosPeticaoGenerica(...);
}
```

## 📝 Schema Validation

Cada tipo valida seus dados:

```javascript
const validacao = validarRecursoIndeferimento(objeto);
// { valido: true, erros: [] }
```

Retorna:
- `valido` - booleano indicando se passou
- `erros` - array com descrição de cada erro

## 🎯 Próximos Passos

1. ✅ Implementar `recursoIndeferimentoPedidoRegistro`
2. [ ] Implementar `oposicao`
3. [ ] Implementar `manifestacao`
4. [ ] Expandir `recursoIndeferimento` com campos específicos
5. [ ] Adicionar tipos de documentos oficiais personalizados

## 📚 Referências

- **Schema atual** - `recurso-indeferimento/schema.js`
- **Extractor genérico** - `sectors/marcas/extractor.js`
- **Router** - `types/index.js`
