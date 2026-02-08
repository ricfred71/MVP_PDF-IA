# Convenções de Nomenclatura - Sistema de Tipos de Extração

## 1. Estrutura de Pastas

### Formato Base
```
sectors/marcas/types/
├── [tipo-abreviado]/               # Pasta com nome abreviado
│   ├── schema.js                   # Definição de schema (sem prefixo)
│   ├── extractor.js                # Classe extratora (sem prefixo)
│   ├── classifier.js               # Classificador (sem prefixo)
│   ├── relacionado.js              # Metadados de relacionamento
│   ├── doc_schema.js               # Schema do documento oficial
│   ├── doc_extractor.js            # Extrator do documento oficial
│   └── doc_classifier.js           # Classificador do documento oficial
├── tipos-map.js                    # Registro central de tipos
└── NAMING-CONVENTIONS.md           # Este arquivo
```

## 2. Convenções de Nomenclatura de Tipos

### Petições (sem prefixo)
- **Padrão ID Completo**: `camelCase` descritivo
  - Ex: `recursoIndeferimentoPedidoRegistro`

- **Abreviação (pasta e referências)**: `kebab-case` conciso
  - Exemplo: `recurso-indef`
  - Comprimento: 2-3 palavras principais
  - Sem números iniciais

- **Classe Extratora**: `PascalCase` + "Extractor"
  - Ex: `RecursoIndefExtractor`

- **Função Validadora**: `validar` + `PascalCaseAbreviado`
  - Ex: `validarRecursoIndef()`

- **Função Classificadora**: `identificar` + `PascalCaseAbreviado`
  - Ex: `identificarRecursoIndef()`

### Documentos Oficiais (com prefixo `doc_`)
- **Padrão ID Completo**: `camelCase` + relação com petição
  - Ex: `recursoIndeferimentoNaoProvido`

- **Abreviação (pasta referência)**: `[tipo-peticao]--[resultado]`
  - Ex: `recurso-indef--naoProv`
  - Conecta-se ao tipo de petição com `--`

- **Arquivo Schema**: `doc_schema.js` (compartilhado ou específico)
  
- **Arquivo Extrator**: `doc_extractor.js` (reutilizável)
  
- **Arquivo Classificador**: `doc_classifier.js` (reutilizável)

## 3. Mapeamento de Abreviações

### Componentes Comuns
```javascript
// Desfechos de recursos
'nao-provido'      → não provido (indeferido/mantém decisão)
'provido'          → provido (reformado totalmente)
'provParcial'      → provido parcial (reformado parcialmente)

// Tipos principais
'recurso-indef'    → Recurso contra Indeferimento
'recurso-marca'    → Recurso contra Indeferimento de Marca
'recurso-pat'      → Recurso contra Indeferimento de Patente

// Prefixos
'form_'            → Campo de entrada do formulário (petição)
'doc_'             → Arquivo de documento oficial
```

## 4. Convenções de Campos

### Campos de Petição (form_)
Todos os campos extratos de petições devem ter prefixo `form_`:

```javascript
// Correto
form_NumeroPeticao
form_DataPresentacao
form_TextoDaPetição
form_Anexos

// Incorreto
numeroPeticao
data_apresentacao
textoPeticao
```

### Campos de Metadados (sem prefixo)
```javascript
categoria          // 'peticao' ou 'documento_oficial'
tipo               // ID completo do tipo
subtipo            // Opcional: classificação adicional
confianca          // Score de confiança [0-100]
```

### Campos Gerais (sem prefixo)
```javascript
textoPeticao       // Texto completo extraído
urlPdf             // URL do PDF original
dataProcessamento  // Data/hora de processamento
processoRelacionado // Número do processo relacionado
```

## 5. Estrutura de Arquivo de Tipo

### schema.js
```javascript
export const RECURSO_INDEF_SCHEMA = {
  // Metadados
  metadados: { ... },
  
  // Campos específicos da petição
  form_*: { type: 'string', required: true, ... },
  
  // Campos gerais
  textoPeticao: { type: 'string', ... }
};

export function validarRecursoIndef(dados) {
  // Lógica de validação
}
```

### extractor.js
```javascript
export class RecursoIndefExtractor extends DataExtractor {
  extract(pdfText) {
    // Retorna { storageKey, dados, validacao }
  }
  
  _extrairCampo() {
    // Métodos privados de extração
  }
}
```

### classifier.js
```javascript
export function identificarRecursoIndef(pdfText) {
  // Retorna { isMatch, tipoId, confidence, patternsMatched }
}
```

### relacionado.js (Petição)
```javascript
export const TIPO_PETICAO = {
  id: 'recursoIndeferimentoPedidoRegistro',
  categoria: 'peticao',
  abreviacao: 'recurso-indef',
  descricao: '...',
  documentosRelacionados: [ /* tipos de docs oficiais */ ]
};
```

## 6. Integração com tipos-map.js

### Registro de Petição
```javascript
export const TIPOS_PETICAO = {
  recursoIndeferimentoPedidoRegistro: {
    id: 'recursoIndeferimentoPedidoRegistro',
    abreviacao: 'recurso-indef',
    categoria: 'peticao',
    folder: 'recurso-indef',
    // ... mais configurações
  }
};
```

### Registro de Documento Oficial
```javascript
export const TIPOS_DOCUMENTOS_OFICIAIS = {
  recursoIndeferimentoNaoProvido: {
    id: 'recursoIndeferimentoNaoProvido',
    abreviacao: 'recurso-indef--naoProv',
    categoria: 'documento_oficial',
    folder: 'recurso-indef',
    parentTipo: 'recursoIndeferimentoPedidoRegistro',
    prefixoArquivo: 'doc_'
  }
};
```

## 7. Exemplos Completos

### Petição: Recurso contra Indeferimento
```
📁 recurso-indef/
├── schema.js
│   └── export RECURSO_INDEF_SCHEMA { ... }
│   └── export validarRecursoIndef() { ... }
├── extractor.js
│   └── export class RecursoIndefExtractor { ... }
├── classifier.js
│   └── export identificarRecursoIndef() { ... }
└── relacionado.js
    └── export TIPO_PETICAO { ... }
```

### Documento Oficial: Recurso Não Provido
```
📁 recurso-indef/
├── doc_schema.js
│   └── export const DOC_SCHEMA = { ... }
├── doc_extractor.js
│   └── export class DocExtractor { ... }
└── doc_classifier.js
    └── export identificarDocNaoProvido() { ... }
```

## 8. Roteamento em index.js

```javascript
import { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS } from './tipos-map.js';

export function getExtractorForTipo(tipoId) {
  const tipo = TIPOS_PETICAO[tipoId] || TIPOS_DOCUMENTOS_OFICIAIS[tipoId];
  
  if (!tipo) return null;
  
  // Importar dinamicamente o extrator apropriado
  if (tipo.categoria === 'peticao') {
    // Petição sem prefixo: extractor.js
    return import(`./${tipo.folder}/extractor.js`);
  } else {
    // Documento oficial com prefixo doc_: doc_extractor.js
    return import(`./${tipo.folder}/${tipo.prefixoArquivo}extractor.js`);
  }
}
```

## 9. Checklist para Novo Tipo

Ao adicionar novo tipo seguir:

- [ ] Criar pasta com nome abreviado: `[tipo-abreviado]/`
- [ ] Criar `schema.js` com `ABREVIADO_SCHEMA` e `validarAbreviado()`
- [ ] Criar `extractor.js` com `AbreviadoExtractor` class
- [ ] Criar `classifier.js` com `identificarAbreviado()` function
- [ ] Criar `relacionado.js` com `TIPO_PETICAO` export
- [ ] Adicionar entrada em `tipos-map.js` na seção apropriada
- [ ] Atualizar importações em `types/index.js`
- [ ] Adicionar testes de classificação e extração
- [ ] Documentar em `NAMING-CONVENTIONS.md` se novo padrão

## 10. Migração de Tipos Antigos

Ao renomear tipo existente (ex: `recursoIndeferimento` → `recurso-indef`):

1. Criar nova estrutura com nomes abreviados
2. Atualizar `tipos-map.js`
3. Atualizar `types/index.js` para suportar ambos IDs
4. Testar com ambos IDs durante período de transição
5. Documentar mudança em arquivo `MIGRATION.md`
6. Remover estrutura antiga após confirmação

---

**Versão**: 1.0  
**Atualizado**: 2024  
**Mantidor**: Extensão IPAS
