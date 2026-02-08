# 📋 Checklist para Adicionar Novos Types em Patentes

Use este arquivo como guia ao adicionar novos tipos ao sistema de patentes.

## 🆕 Novo Tipo: `_____________`

### 📁 Passo 1: Criar Estrutura

- [ ] Criar diretório: `types/pet_nome-tipo/`
- [ ] Criar arquivo: `types/pet_nome-tipo/pet_classifier.js`
- [ ] Criar arquivo: `types/pet_nome-tipo/pet_extractor.js`
- [ ] Criar arquivo: `types/pet_nome-tipo/pet_schema.js`
- [ ] Criar arquivo: `types/pet_nome-tipo/pet_relacionado.js` (opcional)

### 🔍 Passo 2: Registrar tipo em `tipos-map.js`

1. **Adicionar a `TIPOS_PETICAO`:**

```javascript
export const TIPOS_PETICAO = {
  // ... tipos existentes
  
  meuNovoTipoPeticao: {
    id: 'meuNovoTipoPeticao',
    abreviacao: 'novo-tipo',
    categoria: 'peticao',
    folder: 'pet_novo-tipo',
    schemaFile: 'pet_schema.js',
    extractorFile: 'pet_extractor.js',
    classifierFile: 'pet_classifier.js',
    relatedFile: 'pet_relacionado.js',
    descricao: 'Descrição do tipo de petição'
  }
};
```

**Checklist:**
- [ ] ID único (sem espaços, camelCase)
- [ ] Abreviação clara (hyphenated)
- [ ] Categoria = 'peticao'
- [ ] Folder = 'pet_' + abreviação com underscores
- [ ] Descricao = 50-60 caracteres máximo

### 🎯 Passo 3: Implementar Classifier (`pet_classifier.js`)

```javascript
/**
 * Classificador para [Seu Tipo de Petição]
 */

export const MEU_NOVO_TIPO_CLASSIFIER = {
  id: 'meuNovoTipoPeticao',
  descricao: 'Descrição legível de seu tipo',
  categoria: 'peticao',
  
  // ✅ MÉTODO 1: Teste simples (rápido)
  test: (texto) => {
    // Implementar regex que identifica este tipo
    // Exemplo:
    const padrao = /seu padrão identificador aqui/i;
    return padrao.test(texto);
  },
  
  // ✅ MÉTODO 2: Palavras-chave (contexto)
  keywords: [
    'palavra-chave 1 específica deste tipo',
    'palavra-chave 2 que ajuda a identificar',
    'padrão 3 que aparece no tipo'
  ],
  
  // Confiança base (0 a 1)
  confidenceBase: 0.85,
  
  // ✅ MÉTODO 3: Cálculo de confiança (mais sofisticado)
  calculateConfidence: (texto) => {
    let confidence = MEU_NOVO_TIPO_CLASSIFIER.confidenceBase;
    
    // Aumentar confiança se encontrar evidências adicionais
    if (texto.includes('evidência 1')) confidence += 0.05;
    if (texto.includes('evidência 2')) confidence += 0.03;
    
    // Diminuir se encontrar sinais contraditórios
    if (texto.includes('sinal de outro tipo')) confidence -= 0.10;
    
    return Math.min(confidence, 1.0);
  }
};

export function identificarMeuNovoTipo(texto) {
  if (!MEU_NOVO_TIPO_CLASSIFIER.test(texto)) {
    return null;
  }
  
  return {
    tipoId: MEU_NOVO_TIPO_CLASSIFIER.id,
    confianca: MEU_NOVO_TIPO_CLASSIFIER.calculateConfidence(texto),
    descricao: MEU_NOVO_TIPO_CLASSIFIER.descricao
  };
}
```

**Checklist:**
- [ ] ID único e sem espaços
- [ ] Regex de detecção testada manualmente
- [ ] Keywords relevantes (3-5 mínimo)
- [ ] Confiança base realista (0.75-0.95)
- [ ] Função `identificar*` exportada

### 🎯 Passo 4: Implementar Extractor (`pet_extractor.js`)

```javascript
import { MEU_NOVO_TIPO_SCHEMA, validarMeuNovoTipo } from './pet_schema.js';
import { sanitizeFilename } from '../base_extractor_utils.js';

/**
 * Extractor para [Seu Tipo de Petição]
 * Captura campos específicos deste tipo
 */
export class MeuNovoTipoExtractor {
  constructor(dataExtractor) {
    this.dataExtractor = dataExtractor;
  }
  
  /**
   * Método principal de extração
   * @param {string} textoCompleto - Texto inteiro do PDF
   * @param {object} classificacao - Resultado da classificação
   * @param {string} urlPdf - URL do PDF (opcional)
   * @returns {object} { storageKey, dados, validacao }
   */
  extract(textoCompleto, classificacao, urlPdf = '') {
    console.log('[MeuNovoTipoExtractor] Extraindo dados...');
    
    const textoPaginaUm = textoCompleto.substring(0, 2000);
    
    // ✅ PASSO 1: Extrair dados comuns (reutilizar do pai)
    const dadosComuns = {
      form_numeroPeticao: this.dataExtractor._extrairNumeroPeticao(textoPaginaUm),
      form_numeroProcesso: this.dataExtractor._extrairNumeroProcesso(textoPaginaUm),
      form_dataProtocolo: this.dataExtractor._extrairDataProtocolo(textoPaginaUm),
      form_nomeRequerente: this.dataExtractor._extrairNomeRequerente(textoPaginaUm),
      // ... adicionar outros campos comuns necessários
    };
    
    // ✅ PASSO 2: Extrair dados específicos deste tipo
    const dadosEspecificos = {
      campoEspecifico1: this._extrairCampoEspecifico1(textoCompleto),
      campoEspecifico2: this._extrairCampoEspecifico2(textoCompleto),
      // ... adicionar todos os campos específicos
    };
    
    // ✅ PASSO 3: Montar objeto final
    const objetoFinal = {
      categoria: classificacao.categoriaId,
      tipo: classificacao.tipoId,
      urlPdf,
      ...dadosComuns,
      ...dadosEspecificos
    };
    
    // ✅ PASSO 4: Validar contra schema
    const validacao = validarMeuNovoTipo(objetoFinal);
    
    // ✅ PASSO 5: Gerar storage key
    const storageKey = `peticao_${sanitizeFilename(dadosComuns.form_numeroProcesso)}_novo-tipo_${sanitizeFilename(dadosComuns.form_numeroPeticao)}`;
    
    return {
      storageKey,
      dados: objetoFinal,
      validacao
    };
  }
  
  // ✅ Implementar métodos privados para extração específica
  _extrairCampoEspecifico1(texto) {
    // Implementar lógica de extração
    // Usar regex ou busca por padrão
    const padrao = /seu padrão aqui/i;
    const match = texto.match(padrao);
    return match ? match[1].trim() : '';
  }
  
  _extrairCampoEspecifico2(texto) {
    // Implementar outra extração
    return '';
  }
  
  // Adicione mais métodos conforme necessário...
  // _extrairCampo3(texto) { ... }
  // _extrairCampo4(texto) { ... }
}
```

**Checklist:**
- [ ] Classe nomeada `[TipoCamelCase]Extractor`
- [ ] Método `extract()` retorna `{ storageKey, dados, validacao }`
- [ ] Reutilizar métodos do pai (`this.dataExtractor._extrair*`)
- [ ] Implementar métodos privados para cada campo específico
- [ ] Validação acontece antes do return
- [ ] `storageKey` é único e descritivo

### 📊 Passo 5: Implementar Schema (`pet_schema.js`)

```javascript
/**
 * Schema de validação para [Seu Tipo de Petição]
 */

export const MEU_NOVO_TIPO_SCHEMA = {
  // ✅ Campos obrigatórios
  campos_obrigatorios: [
    'form_numeroPeticao',
    'form_numeroProcesso',
    'form_nomeRequerente',
    'campoEspecifico1',  // Seu campo específico
    'campoEspecifico2'   // Seu outro campo
  ],
  
  // ✅ Campos opcionais
  campos_opcionais: [
    'form_dataProtocolo',
    'urlPdf',
    'observacoes'
  ],
  
  // ✅ Validações customizadas (regex, ranges, etc)
  validacoes: {
    form_numeroPeticao: {
      tipo: 'string',
      padrao: /^\d+$/,
      mensagem: 'Número de petição deve conter apenas dígitos'
    },
    form_numeroProcesso: {
      tipo: 'string',
      padrao: /^\d{9}$/,
      mensagem: 'Número de processo deve ter 9 dígitos'
    },
    campoEspecifico1: {
      tipo: 'string',
      minLength: 3,
      maxLength: 200,
      mensagem: 'Campo específico 1 deve ter entre 3 e 200 caracteres'
    }
  },
  
  // ✅ Descrição dos campos
  descricoes: {
    form_numeroPeticao: 'Número de identificação da petição',
    form_numeroProcesso: 'Número do processo administrativo',
    campoEspecifico1: 'Descrição do seu campo específico',
    campoEspecifico2: 'Descrição do seu outro campo'
  }
};

/**
 * Valida um objeto contra o schema
 * @param {object} dados - Objeto a validar
 * @returns {object} { valido, erros, avisos }
 */
export function validarMeuNovoTipo(dados) {
  const erros = [];
  const avisos = [];
  let valido = true;
  
  // ✅ Verificar campos obrigatórios
  for (const campo of MEU_NOVO_TIPO_SCHEMA.campos_obrigatorios) {
    if (!dados[campo] || dados[campo].toString().trim() === '') {
      erros.push(`Campo obrigatório "${campo}" está vazio`);
      valido = false;
    }
  }
  
  // ✅ Validações customizadas
  for (const [campo, validacao] of Object.entries(MEU_NOVO_TIPO_SCHEMA.validacoes)) {
    if (dados[campo]) {
      if (validacao.padrao && !validacao.padrao.test(dados[campo])) {
        erros.push(`${campo}: ${validacao.mensagem}`);
        valido = false;
      }
      
      if (validacao.minLength && dados[campo].length < validacao.minLength) {
        erros.push(`${campo}: ${validacao.mensagem}`);
        valido = false;
      }
    }
  }
  
  return {
    valido,
    erros,
    avisos,
    timestamp: new Date().toISOString()
  };
}
```

**Checklist:**
- [ ] Lista de campos obrigatórios definida
- [ ] Campos opcionais documentados
- [ ] Validações regex para campos específicos
- [ ] Função `validar*` implementada
- [ ] Mensagens de erro claras

### 🔗 Passo 6: Registrar em `index.js`

Adicione as importações no início:

```javascript
import { MeuNovoTipoExtractor } from './pet_novo-tipo/pet_extractor.js';
import { identificarMeuNovoTipo } from './pet_novo-tipo/pet_classifier.js';
import { MEU_NOVO_TIPO_SCHEMA, validarMeuNovoTipo } from './pet_novo-tipo/pet_schema.js';
```

E adicione ao mapa:

```javascript
const TYPE_EXTRACTORS_MAP = {
  // ... tipos existentes
  
  'meuNovoTipoPeticao': {
    ExtractorClass: MeuNovoTipoExtractor,
    categoria: 'peticao',
    folder: 'pet_novo-tipo'
  }
};
```

E aos exports:

```javascript
// Novo Tipo de Petição
export { MeuNovoTipoExtractor } from './pet_novo-tipo/pet_extractor.js';
export { identificarMeuNovoTipo } from './pet_novo-tipo/pet_classifier.js';
export { MEU_NOVO_TIPO_SCHEMA, validarMeuNovoTipo } from './pet_novo-tipo/pet_schema.js';
```

**Checklist:**
- [ ] Importações adicionadas ao topo
- [ ] Tipo adicionado a `TYPE_EXTRACTORS_MAP`
- [ ] Exports adicionados no final

### ✅ Passo 7: Testar

1. [ ] Criar arquivo de teste com exemplo do seu tipo
2. [ ] Validar que classifier identifica corretamente
3. [ ] Validar que extractor captura todos os campos
4. [ ] Validar que schema aceita dados válidos e rejeita inválidos

## 📝 Dicas e Boas Práticas

### Nomenclatura
- **IDs de tipo:** camelCase, descritivo (ex: `meuNovoTipoPeticao`)
- **Abreviações:** hyphenated, curto (ex: `novo-tipo`)
- **Nomes de classe:** PascalCase + Extractor (ex: `MeuNovoTipoExtractor`)
- **Nomes de função:** camelCase, com prefixo `_` se privada

### Extração de Campos
- Sempre use regex com flags case-insensitive (`/padrão/i`)
- Trim whitespace: `.trim()`
- Valide antes de retornar
- Use helpers do `dataExtractor` para campos comuns

### Performance
- Limite buscas a seções do texto (ex: primeira página)
- Use regex específicos em vez de genéricos
- Cache resultados intermediários se necessário

### Documentação
- Docstring em todos os métodos
- Exemplo de uso no arquivo
- Comentários em regex complexas

## 📚 Referências

- [README.md](README.md) - Documentação completa
- [00_COMECE_AQUI.md](00_COMECE_AQUI.md) - Visão geral
- [base_extractor_utils.js](base_extractor_utils.js) - Utilitários
- [tipos-map.js](tipos-map.js) - Registro de tipos
