# 📋 Checklist para Adicionar Novos Types

Use este arquivo como guia ao adicionar novos tipos ao sistema.

## 🆕 Novo Tipo: `_____________`

### 📁 Passo 1: Criar Estrutura

- [ ] Criar diretório: `types/nome-tipo/`
- [ ] Criar arquivo: `types/nome-tipo/classifier.js`
- [ ] Criar arquivo: `types/nome-tipo/extractor.js`
- [ ] Criar arquivo: `types/nome-tipo/schema.js`

### 🔍 Passo 2: Implementar Classifier (`classifier.js`)

```javascript
export const NOVO_TIPO_CLASSIFIER = {
  id: 'idExato',                    // ← Deve corresponder ao tipoId
  descricao: 'Descrição legível',   // ← 50 caracteres máximo
  categoria: 'peticao',             // ← ou 'documento_oficial'
  
  test: (texto) => {
    // [ ] Implementar regex para detectar este tipo
    // Exemplo: return texto.includes('padrão identificador');
    return false;
  },
  
  keywords: [
    // [ ] Listar palavras-chave que ajudam a identificar
    // Exemplo: 'palavra-chave 1', 'palavra-chave 2'
  ],
  
  confidenceBase: 0.85,             // [ ] Definir confiança base (0-1)
  
  calculateConfidence: (texto) => {
    let confidence = NOVO_TIPO_CLASSIFIER.confidenceBase;
    
    // [ ] Aumentar confiança se encontrar mais evidências
    // if (texto.includes('evidência 1')) confidence += 0.02;
    
    return Math.min(confidence, 1.0);
  }
};
```

**Checklist:**
- [ ] ID únco e sem espaços
- [ ] Descrição clara
- [ ] Regex de detecção testada
- [ ] Keywords relevantes
- [ ] Confiança base realista (0.80-0.95)

### 🎯 Passo 3: Implementar Extractor (`extractor.js`)

```javascript
import { NOVO_TIPO_SCHEMA, validarNovoTipo } from './schema.js';

export class NovoTipoExtractor {
  
  constructor(dataExtractor) {
    this.dataExtractor = dataExtractor;
  }
  
  extract(textoCompleto, classificacao, urlPdf = '') {
    console.log('[NovoTipoExtractor] Extraindo dados...');
    
    const textoPaginaUm = textoCompleto.substring(0, 2000);
    
    // [ ] Extrair dados comuns (reutilizar do pai)
    const dadosComuns = {
      form_numeroPeticao: this.dataExtractor._extrairNumeroPeticao(textoPaginaUm),
      form_numeroProcesso: this.dataExtractor._extrairNumeroProcesso(textoPaginaUm),
      // ... outros dados
    };
    
    // [ ] Extrair dados específicos deste tipo
    const dadosEspecificos = {
      // campo1: this._extrairCampo1(textoCompleto),
      // campo2: this._extrairCampo2(textoCompleto),
    };
    
    // [ ] Montar objeto final
    const objetoFinal = {
      categoria: classificacao.categoriaId,
      tipo: classificacao.tipoId,
      ...dadosComuns,
      ...dadosEspecificos
    };
    
    // [ ] Validar contra schema
    const validacao = validarNovoTipo(objetoFinal);
    
    return {
      storageKey: `peticao_${dadosComuns.form_numeroProcesso}_novo-tipo_${dadosComuns.form_numeroPeticao}`,
      dados: objetoFinal,
      validacao
    };
  }
  
  // [ ] Implementar métodos privados para extração
  _extrairCampo1(texto) {
    // const match = texto.match(/regex_aqui/);
    // return match ? match[1].trim() : null;
    return null;
  }
  
  _sanitizeFilename(nome) {
    return nome
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
```

**Checklist:**
- [ ] Constructor recebe dataExtractor
- [ ] Método extract implementado
- [ ] Reutiliza dados genéricos do pai
- [ ] Captura dados específicos
- [ ] Validação integrada
- [ ] Todos os métodos privados implementados

### 📐 Passo 4: Implementar Schema (`schema.js`)

```javascript
export const NOVO_TIPO_SCHEMA = {
  // [ ] Listar TODOS os campos esperados
  
  // Metadados
  categoria: { type: 'string', required: true, value: 'peticao' },
  tipo: { type: 'string', required: true, value: 'idDoTipo' },
  confianca: { type: 'number', required: true, min: 0, max: 1 },
  
  // Dados comuns (copiar do schema pai se necessário)
  form_numeroPeticao: { type: 'string', required: true, pattern: '\\d{12}' },
  form_numeroProcesso: { type: 'string', required: true, pattern: '\\d{9}' },
  
  // [ ] Dados específicos deste tipo
  // EXEMPLOS implementados em "recurso-indeferimento":
  // form_TextoDaPetição: { type: 'string', required: false, description: 'Texto da petição' },
  // form_Anexos: { type: 'array', required: false, description: 'Lista de anexos' },
  
  campoEspecifico1: { type: 'string', required: true },
  campoEspecifico2: { type: 'number', required: false, min: 0 }
};

export function validarNovoTipo(objeto) {
  const erros = [];
  
  // [ ] Implementar lógica de validação
  // Usar como referência: recurso-indeferimento/schema.js
  
  return {
    valido: erros.length === 0,
    erros
  };
}
```

**Checklist:**
- [ ] Todos os campos mapeados
- [ ] Tipos corretos (string, number, boolean, array)
- [ ] Required/optional corretos
- [ ] Patterns/ranges/formatos definidos
- [ ] Função validar implementada
- [ ] Teste validação com objeto real

### 🔗 Passo 5: Registrar em `types/index.js`

```javascript
// 1. [ ] Adicionar import
import { NovoTipoExtractor } from './novo-tipo/extractor.js';

// 2. [ ] Adicionar ao mapa
const TYPE_EXTRACTORS_MAP = {
  'recursoIndeferimentoPedidoRegistro': RecursoInderimentoExtractor,
  'novoTipo': NovoTipoExtractor  // ← AQUI
};

// 3. [ ] Adicionar export (opcional, mas recomendado)
export * from './novo-tipo/classifier.js';
export * from './novo-tipo/extractor.js';
export * from './novo-tipo/schema.js';
```

**Checklist:**
- [ ] Import adicionado
- [ ] Tipo adicionado ao MAP
- [ ] ID corresponde ao tipoId da classificação
- [ ] Exports adicionados

### 🧪 Passo 6: Testar

- [ ] Criar documento teste para este tipo
- [ ] Classificar manualmente
- [ ] Verificar se detecta corretamente
- [ ] Executar extração
- [ ] Validar schema
- [ ] Verificar storage.local
- [ ] Testar campos opcionais vs obrigatórios
- [ ] Testar padrões regex

### 📚 Passo 7: Documentar

- [ ] Atualizar `types/README.md` com novo tipo na lista
- [ ] Adicionar seção no `ARQUITETURA_IMPLEMENTADA.md`
- [ ] Adicionar exemplos em `EXEMPLO_UTILIZACAO.js`
- [ ] Documentar campos específicos

---

## 📋 Modelo de Dados por Tipo

### Para PETIÇÃO

**Campos Comuns:**
```javascript
categoria: 'peticao',
tipo: 'idDoTipo',
form_numeroPeticao: string (12 dígitos),
form_numeroProcesso: string (9 dígitos),
form_requerente_nome: string,
form_procurador_nome: string,
textoPeticao: string,
dataProcessamento: datetime
```

**Adicionar:**
- [ ] Campos específicos deste tipo
- [ ] Validações específicas
- [ ] Métodos de extração específicos

### Para DOCUMENTO OFICIAL

**Campos Comuns:**
```javascript
categoria: 'documento_oficial',
tipo: 'idDoTipo',
form_numeroProcesso: string,
dataDespacho: datetime,
textoOficial: string,
dataProcessamento: datetime
```

**Adicionar:**
- [ ] Campos específicos deste tipo
- [ ] Validações específicas
- [ ] Métodos de extração específicos

---

## 🎯 Tipos Planejados

- [ ] **oposicao** - Oposição ao pedido de registro
  - Dados: marca oposta, processo oposto, fundamentos
  
- [ ] **manifestacao** - Manifestação sobre petição
  - Dados: manifestação sobre, argumentos
  
- [ ] **despacho_indeferimento** - Doc Oficial: Indeferimento
  - Dados: fundamentação, normas infringidas
  
- [ ] **despacho_concessao** - Doc Oficial: Concessão
  - Dados: data da concessão, classes concedidas

---

## ✅ Antes de Commitar

- [ ] Todos os passos acima completados
- [ ] Código segue padrão dos tipos existentes
- [ ] Sem erros de sintaxe
- [ ] Testado com documento real
- [ ] README atualizado
- [ ] Exemplos criados/atualizados

---

## 📞 Dúvidas?

Consulte:
1. `types/README.md` - Documentação da arquitetura
2. `types/recurso-indeferimento/` - Implementação de referência
3. `types/EXEMPLO_UTILIZACAO.js` - Exemplos práticos
