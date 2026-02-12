# Guia Rápido - Arquitetura de Tipos para Patentes

## ✨ Visão Geral

A estrutura `sectors/patentes/types/` replica o padrão bem-sucedido implementado em `sectors/marcas/types/`, permitindo:

- **Extração customizada** por tipo de documento
- **Classificação específica** para patentes
- **Validação de dados** com schema
- **Escalabilidade** para novos tipos

## 📂 Estrutura Básica

### Para uma Nova Petição
```
types/pet_[tipo-abreviado]/
├── pet_schema.js             (schema + validador)
├── pet_extractor.js          (classe Extrator)
├── pet_classifier.js         (função classificadora)
└── pet_relacionado.js        (metadados - opcional)
```

### Para Documento Oficial de Petição
```
types/doc_[tipo-abreviado]/
├── doc_schema.js             (schema do documento)
├── doc_extractor.js          (classe Extrator do doc)
└── doc_classifier.js         (função classificadora do doc)
```

## 🔧 Como Usar

### Opção 1: Carregamento Dinâmico (Recomendado)

```javascript
import { getExtractorForTipo } from './types/index.js';

// Qualquer tipo - petição ou documento
const extractor = await getExtractorForTipo('recursoIndeferimentoPedidoPatente', dataExtractor);
const result = extractor.extract(pdfText);
```

### Opção 2: Carregamento Síncrono (Pré-carregado)

```javascript
import { getExtractorForTipoSync } from './types/index.js';

// Apenas tipos em TYPE_EXTRACTORS_MAP
const extractor = getExtractorForTipoSync('recursoIndeferimentoPedidoPatente', dataExtractor);
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
const peticoes = getTiposPeticaoDisponiveis();
const documentos = getTiposDocumentosDisponiveis();
```

### Obter Configuração de Tipo

```javascript
import { getTipoConfig } from './types/index.js';

const config = getTipoConfig('recursoIndeferimentoPedidoPatente');
// {
//   id: 'recursoIndeferimentoPedidoPatente',
//   abreviacao: 'recurso-indef',
//   categoria: 'peticao',
//   folder: 'pet_recurso-indef',
//   descricao: 'Recurso contra Indeferimento de Pedido de Patente'
// }
```

### Explorar Tipo e Documentos Relacionados

```javascript
import { TIPOS_PETICAO, TIPOS_DOCUMENTOS_OFICIAIS } from './types/index.js';

// Ver uma petição
const recursoIndef = TIPOS_PETICAO['recursoIndeferimentoPedidoPatente'];
console.log(recursoIndef);

// Ver documento
const naoProvido = TIPOS_DOCUMENTOS_OFICIAIS['recursoIndeferimentoNaoProvido'];
console.log(naoProvido.parentTipo);  // 'recursoIndeferimentoPedidoPatente'
console.log(naoProvido.parentAbreviacao);  // 'recurso-indef'
```

## ✅ Validação e Classificação

### Classificar Texto

```javascript
import { identificarRecursoIndef } from './types/pet_recurso-indef/pet_classifier.js';

const resultado = identificarRecursoIndef(pdfText);
// {
//   isMatch: true,
//   tipoId: 'recursoIndeferimentoPedidoPatente',
//   descricao: 'Recurso contra Indeferimento',
//   confidence: 95
// }
```

### Validar Dados Extraídos

```javascript
import { validarRecursoIndef } from './types/pet_recurso-indef/pet_schema.js';

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
mkdir sectors/patentes/types/pet_[tipo-abreviado]

# Criar arquivos
touch pet_schema.js
touch pet_extractor.js  
touch pet_classifier.js
touch pet_relacionado.js  # opcional
```

### 2. Adicionar ao tipos-map.js

```javascript
export const TIPOS_PETICAO = {
  // ... tipos existentes
  
  meuNovoPedido: {
    id: 'meuNovoPedido',
    abreviacao: 'novo-pedido',
    categoria: 'peticao',
    folder: 'pet_novo-pedido',
    schemaFile: 'pet_schema.js',
    extractorFile: 'pet_extractor.js',
    classifierFile: 'pet_classifier.js',
    relatedFile: 'pet_relacionado.js',
    descricao: 'Descrição do novo tipo'
  }
};
```

### 3. Registrar em index.js (Opcional, para Sync)

```javascript
import { MeuNovoPedidoExtractor } from './pet_novo-pedido/pet_extractor.js';

const TYPE_EXTRACTORS_MAP = {
  'meuNovoPedido': {
    ExtractorClass: MeuNovoPedidoExtractor,
    categoria: 'peticao',
    folder: 'pet_novo-pedido'
  }
};
```

### 4. Seguir Checklist Completo

Veja `CHECKLIST_NOVO_TIPO.md` para um guia detalhado com todos os passos.

## 🔍 Verificar Implementação

### Testar Carregamento Dinâmico

```javascript
// test-dynamic-loading.js
import { getExtractorForTipo } from './types/index.js';

async function test() {
  const extractor = await getExtractorForTipo('recursoIndeferimentoPedidoPatente', null);
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

console.log('✅ recursoIndeferimentoPedidoPatente:', getTipo('recursoIndeferimentoPedidoPatente') ? 'OK' : 'FALHA');
console.log('✅ recursoIndeferimentoNaoProvido:', getTipo('recursoIndeferimentoNaoProvido') ? 'OK' : 'FALHA');
```

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
   const { dados, validacao } = extractor.extract(text, classified);
   ```

4. **Validar resultado**
   ```javascript
   if (validacao.valido) {
     // Salvar dados
     chrome.storage.local.set({ [storageKey]: dados });
   } else {
     // Tratar erros
     console.error('Erros de validação:', validacao.erros);
   }
   ```

## 📚 Documentação Complementar

- **README.md** - Arquitetura completa e fluxo de execução
- **00_COMECE_AQUI.md** - Resumo e próximos passos
- **CHECKLIST_NOVO_TIPO.md** - Guia passo-a-passo para novos tipos
- **base_extractor_utils.js** - Funções auxiliares reutilizáveis
- **tipos-map.js** - Configuração de todos os tipos

## 💡 Dicas de Implementação

### Reutilizar do DataExtractor Pai
```javascript
const nomeRequerente = this.dataExtractor._extrairNomeRequerente(texto);
const numeroProcesso = this.dataExtractor._extrairNumeroProcesso(texto);
const numeroProtocolo = this.dataExtractor._extrairNumeroPeticao(texto);
```

### Extrair com Regex Específicos
```javascript
const padrao = /seu padrão específico aqui/i;
const match = texto.match(padrao);
const valor = match ? match[1].trim() : '';
```

### Validar Antes de Retornar
```javascript
const validacao = validarMeuNovoTipo(objetoFinal);
if (!validacao.valido) {
  console.error('Erros de validação:', validacao.erros);
}
return { storageKey, dados: objetoFinal, validacao };
```

## 🔄 Integração com Classificador

Para integrar com o classificador de patentes, adicione uma chamada em `sectors/patentes/classifier.js`:

```javascript
import { identificarRecursoIndef } from './types/pet_recurso-indef/pet_classifier.js';

export function classificar(texto) {
  // ... outras classificações ...
  
  const recursoIndef = identificarRecursoIndef(texto);
  if (recursoIndef?.isMatch) {
    return {
      categoria: 'peticao',
      tipoId: recursoIndef.tipoId,
      confianca: recursoIndef.confidence
    };
  }
  
  // ... fallback ...
}
```

---

**Status**: ✅ Estrutura pronta para implementação  
**Próximo Passo**: Implementar primeiro tipo seguindo `CHECKLIST_NOVO_TIPO.md`
