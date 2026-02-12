# Guia Rápido - Nova Arquitetura de Tipos

## ✨ Resumo das Mudanças

- **Nova pasta**: `recurso-indef/` (em vez de `recurso-indeferimento/`)
- **Nova nomenclatura**: `recurso-indef` (abreviado), classe `RecursoIndefExtractor`
- **Novo registro**: `tipos-map.js` com todos os tipos mapeados
- **Novo router**: `index.js` com suporte a tipos dinâmicos
- **Novo padrão de documentos**: `recurso-indef--naoProv` (petição--resultado)

## 📂 Estrutura Básica

### Para uma Nova Petição
```
types/[tipo-abreviado]/
├── schema.js                 (schema + validador)
├── extractor.js              (classe Extrator)
├── classifier.js             (função classificadora)
└── relacionado.js            (metadados e relacionamentos)
```

### Para Documento Oficial de Petição
```
types/[tipo-abreviado]/
├── doc_schema.js             (schema do documento)
├── doc_extractor.js          (classe Extrator do doc)
└── doc_classifier.js         (função classificadora do doc)
```

## 🔧 Como Usar

### Opção 1: Carregamento Dinâmico (Recomendado)

```javascript
import { getExtractorForTipo } from './types/index.js';

// Qualquer tipo - petição ou documento
const extractor = await getExtractorForTipo('recursoIndeferimentoPedidoRegistro', dataExtractor);
const result = extractor.extract(pdfText);
```

### Opção 2: Carregamento Síncrono (Pré-carregado)

```javascript
import { getExtractorForTipoSync } from './types/index.js';

// Apenas tipos em TYPE_EXTRACTORS_MAP
const extractor = getExtractorForTipoSync('recursoIndeferimentoPedidoRegistro', dataExtractor);
const result = extractor.extract(pdfText);
```

### Opção 3: Importação Direta (Legacy)

```javascript
import { RecursoIndefExtractor } from './types/index.js';
import { identificarRecursoIndef } from './types/index.js';
import { RECURSO_INDEF_SCHEMA, validarRecursoIndef } from './types/index.js';

const extractor = new RecursoIndefExtractor(dataExtractor);
const classified = identificarRecursoIndef(text);
const validated = validarRecursoIndef(data);
```

## 📋 Mapas de Tipos

### Listar Tipos Disponíveis

```javascript
import { 
  getTiposDisponiveis,
  getTiposPeticaoDisponiveis,
  getTiposDocumentosDisponiveis 
} from './types/index.js';

const todos = getTiposDisponiveis();
const peticiones = getTiposPeticaoDisponiveis();
const documentos = getTiposDocumentosDisponiveis();
```

### Obter Configuração de Tipo

```javascript
import { getTipoConfig } from './types/index.js';

const config = getTipoConfig('recursoIndeferimentoPedidoRegistro');
// {
//   id: 'recursoIndeferimentoPedidoRegistro',
//   abreviacao: 'recurso-indef',
//   categoria: 'peticao',
//   folder: 'recurso-indef',
//   descricao: '...'
// }
```

### Explorar Tipo e Documentos Relacionados

```javascript
import { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS } from './types/index.js';

// Ver uma petição
const recursoIndef = TIPOS_PETICAO['recursoIndeferimentoPedidoRegistro'];
console.log(recursoIndef.documentosRelacionados);
// [
//   { id: 'recursoIndeferimentoNaoProvido', abreviacao: 'recurso-indef--naoProv', ... },
//   { id: 'recursoIndeferimentoProvido', abreviacao: 'recurso-indef--provido', ... },
//   { id: 'recursoIndeferimentoProvidoParcial', abreviacao: 'recurso-indef--provParcial', ... }
// ]

// Ver documento
const naoProvido = TIPOS_DOCUMENTOS_OFICIAIS['recursoIndeferimentoNaoProvido'];
console.log(naoProvido.parentTipo);  // 'recursoIndeferimentoPedidoRegistro'
console.log(naoProvido.parentAbreviacao);  // 'recurso-indef'
```

## ✅ Validação e Classificação

### Classificar Texto

```javascript
import { identificarRecursoIndef } from './types/index.js';

const resultado = identificarRecursoIndef(pdfText);
// {
//   isMatch: true,
//   tipoId: 'recursoIndeferimentoPedidoRegistro',
//   descricao: 'Recurso contra Indeferimento',
//   confidence: 95,
//   patternsMatched: 3
// }
```

### Validar Dados Extraídos

```javascript
import { validarRecursoIndef } from './types/index.js';

const resultado = validarRecursoIndef(dadosExtraidos);
// {
//   valido: true,
//   erros: [],
//   campos_ausentes: [],
//   campos_preenchidos: 45
// }
```

## 🏗️ Adicionar Novo Tipo

### 1. Criar Estrutura

```bash
# Criar pasta
mkdir sectors/marcas/types/[tipo-abreviado]

# Criar arquivo schema.js
# Criar arquivo extractor.js  
# Criar arquivo classifier.js
# Criar arquivo relacionado.js
```

### 2. Adicionar ao tipos-map.js

```javascript
export const TIPOS_PETICAO = {
  // ... tipos existentes
  
  novoTipo: {
    id: 'novoTipoCompleto',
    abreviacao: 'novo-tipo',
    categoria: 'peticao',
    folder: 'novo-tipo',
    schemaFile: 'schema.js',
    extractorFile: 'extractor.js',
    classifierFile: 'classifier.js',
    relatedFile: 'relacionado.js',
    descricao: 'Descrição do novo tipo'
  }
};
```

### 3. Registrar em index.js (Opcional, para Sync)

```javascript
import { NovoTipoExtractor } from './novo-tipo/extractor.js';

const TYPE_EXTRACTORS_MAP = {
  'novoTipoCompleto': {
    ExtractorClass: NovoTipoExtractor,
    categoria: 'peticao',
    folder: 'novo-tipo'
  }
};
```

### 4. Seguir Convenções

Veja `NAMING-CONVENTIONS.md` para:
- Nomes de classes
- Nomes de variáveis
- Nomes de funções
- Estrutura de arquivos

## 🔍 Verificar Implementação

### Testar Carregamento Dinâmico

```javascript
// test-dynamic-loading.js
import { getExtractorForTipo } from './types/index.js';

async function test() {
  const extractor = await getExtractorForTipo('recursoIndeferimentoPedidoRegistro', null);
  console.log('✅ Carregamento dinâmico:', extractor ? 'OK' : 'FALHA');
}

test().catch(console.error);
```

### Testar Tipos-Map

```javascript
// test-tipos-map.js
import { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS, getTipo } from './types/index.js';

console.log('Petições registradas:', Object.keys(TIPOS_PETICAO).length);
console.log('Documentos registrados:', Object.keys(TIPOS_DOCUMENTOS_OFICIAIS).length);

console.log('✅ recursoIndeferimentoPedidoRegistro:', getTipo('recursoIndeferimentoPedidoRegistro') ? 'OK' : 'FALHA');
console.log('✅ recursoIndeferimentoNaoProvido:', getTipo('recursoIndeferimentoNaoProvido') ? 'OK' : 'FALHA');
```

### Testar Compatibilidade

```javascript
// test-backward-compat.js
import { RecursoIndefExtractor, validarRecursoIndef } from './types/index.js';

const extractor = new RecursoIndefExtractor(null);
console.log('✅ Importação direta:', extractor ? 'OK' : 'FALHA');

const valido = validarRecursoIndef({});
console.log('✅ Validador:', valido ? 'OK' : 'FALHA');
```

## 📚 Documentação Complementar

- **NAMING-CONVENTIONS.md** - Guia detalhado de convenções
- **tipos-map.js** - Fonte de verdade para configuração de tipos
- **recurso-indef/relacionado.js** - Exemplo de metadados

## ⚠️ Migração do Código Antigo

### Antes (recurso-indeferimento/)
```javascript
import { RecursoInderimentoExtractor } from './recurso-indeferimento/extractor.js';
```

### Depois (recurso-indef/)
```javascript
import { RecursoIndefExtractor } from './recurso-indef/extractor.js';
// OU
import { RecursoIndefExtractor } from './types/index.js';
```

> **Nota**: O tipo ID `recursoIndeferimentoPedidoRegistro` continua o mesmo!

## 🎯 Fluxo de Uso Típico

1. **Classificar** o documento
   ```javascript
   const classified = identificarRecursoIndef(text);
   if (!classified.isMatch) return null;
   ```

2. **Obter extrator**
   ```javascript
   const extractor = await getExtractorForTipo(classified.tipoId, dataExtractor);
   ```

3. **Extrair dados**
   ```javascript
   const { dados, validacao } = extractor.extract(text);
   ```

4. **Validar resultado**
   ```javascript
   if (validacao.valido) {
     // Salvar dados
   } else {
     // Tratar erros
   }
   ```

---

**Versão**: 1.0  
**Atualizado**: 2024  
**Status**: ✅ Pronto para uso
