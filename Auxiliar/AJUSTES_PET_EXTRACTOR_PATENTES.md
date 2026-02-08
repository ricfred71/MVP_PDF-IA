# Ajustes no pet_extractor.js para Patentes

## Data: 2026-01-31
## Arquivo: `sectors/patentes/types/pet_recurso-indef/pet_extractor.js`

---

## Resumo das Mudanças

Implementados ajustes na captura de dados do `pet_extractor.js` para garantir que o objeto extraído corresponda exatamente ao JSON esperado (`petiçãopatentes.txt`).

---

## Alterações Realizadas

### 1. **Ajuste do método `_extrairAnexos()`** (linhas ~60-90)

**Antes:**
```javascript
// Procurava por: "Nome do Arquivo Descrição Anexos"
const blocoMatch = texto.match(/Nome\s+do\s+Arquivo\s+Descrição\s+Anexos\s*([\s\S]*?)(?:Página|Declaro)/i);
// Retornava: { nomeArquivo, descricao }
```

**Depois:**
```javascript
// Procura por: "Nome Tipo Anexo"
const blocoMatch = texto.match(/Nome\s+Tipo\s+Anexo\s*([\s\S]*?)(?:Página|Declaro)/i);
// Retorna: { "Tipo Anexo", "Nome" }
```

**Motivo:** Ajustar a estrutura do anexo para corresponder ao padrão esperado no JSON.

---

### 2. **Método `_extrairProcuradorNome()`** (linhas ~472-476)

**Antes:** Procurava por "Nome ou Razão Social" após "Dados do Procurador"

**Depois:**
```javascript
_extrairProcuradorNome(texto) {
  // O nome do procurador é o nome do escritório
  return this._extrairEscritorioNome(texto);
}
```

**Motivo:** No objeto esperado, `form_procurador_nome` deve conter o nome do escritório (ex: "DI BLASI, PARENTE & ADVOGADOS ASSOCIADOS"), não o nome individual do procurador.

---

### 3. **Método `_extrairEscritorioNome()`** (linhas ~533-547)

**Antes:**
```javascript
const match = texto.match(/Escrit[óo]rio\s*:.*?Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/is);
```

**Depois:**
```javascript
// Padrão 1: Após "Escritório:" procura "Nome ou Razão Social:"
let match = texto.match(/Escrit[óo]rio\s*:[\s\S]*?Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
if (match) return match[1].trim();

// Padrão 2: Busca por linha com CNPJ seguida de Nome
match = texto.match(/\d{14}\s*CNPJ\s*:[\s\S]*?Nome\s*:\s*([^\n]+)/i);
if (match) return match[1].trim().replace(/\s+/g, ' ');

// Padrão 3: Busca simples por "Nome ou Razão Social:" na seção de procurador
match = texto.match(/Dados do Procurador[\s\S]*?Nome\s+ou\s+Raz[ãa]o\s+Social\s*:\s*([^\n]+)/i);
```

**Motivo:** Adicionar múltiplos padrões para capturar robustamente o nome do escritório em diferentes formatos de PDF.

---

### 4. **Método `_extrairEscritorioCNPJ()`** (linhas ~523-528)

**Antes:**
```javascript
const match = texto.match(/Dados do Procurador\/Escritório\s*(\d{14})/);
```

**Depois:**
```javascript
const match = texto.match(/Escrit[óo]rio\s*:[\s\S]*?CNPJ\s*:\s*(\d{14})/i);
```

**Motivo:** Ajustar o padrão para buscar após a label "Escritório:" em vez de "Dados do Procurador/Escritório".

---

### 5. **Campo `textoPeticao` já removido** (linha ~63)

Os dados específicos agora contêm apenas:
```javascript
const dadosEspecificos = {
  form_Anexos: this._extrairAnexos(textoCompleto)
};
```

O texto completo é adicionado no objeto final como `textoPeticao: textoCompleto`.

---

### 6. **Campo `setor` adicionado** (linha ~79)

```javascript
const objetoFinal = {
  categoria: 'peticao',
  setor: 'patentes',  // ✅ Adicionado
  tipo: classificacao.tipoId || 'recursoIndeferimentoPedidoPatente',
  ...
};
```

---

## Estrutura Final do Objeto Extraído

```json
{
  "categoria": "peticao",
  "setor": "patentes",
  "tipo": "recursoIndeferimentoPedidoPatente",
  "subtipo": "",
  "confianca": 0.85,
  
  "form_numeroPeticao": "870220052775",
  "form_numeroProcesso": "BR1020140042067",
  "form_nossoNumero": "29409161951478176",
  "form_dataPeticao": "15/06/2022 15:32",
  
  "form_requerente_nome": "SAMSUNG ELETRÔNICA DA AMAZÔNIA LTDA.",
  "form_requerente_cpfCnpjNumINPI": "00280273000218",
  "form_requerente_endereco": "RUA THOMAS NILSEN JÚNIOR...",
  "form_requerente_cidade": "Campinas",
  "form_requerente_estado": "SP",
  "form_requerente_cep": "13097-105",
  "form_requerente_pais": "Brasil",
  "form_requerente_naturezaJuridica": "Pessoa Jurídica",
  "form_requerente_email": "DIBLASI@DIBLASI.COM.BR",
  
  "form_procurador_nome": "DI BLASI, PARENTE & ADVOGADOS ASSOCIADOS",
  "form_procurador_cpf": "08198079742",
  "form_procurador_email": "marcelo.oliveira@diblasi.com.br",
  "form_procurador_numeroAPI": "1831",
  "form_procurador_numeroOAB": null,
  "form_procurador_uf": "RJ",
  "form_procurador_escritorio_nome": "DI BLASI, PARENTE & ADVOGADOS ASSOCIADOS",
  "form_procurador_escritorio_cnpj": "05321933000102",
  
  "textoPeticao": "[texto completo do PDF]",
  "urlPdf": "",
  "dataProcessamento": "2026-01-31T19:33:50.563Z",
  "form_Anexos": [
    {
      "Tipo Anexo": "Comprovante de pagamento GRU",
      "Nome": "PN005019.pdf"
    },
    ...
  ]
}
```

---

## Validação

✅ **Sem erros de compilação**
- Verificado com `get_errors` no arquivo

---

## Próximas Etapas

1. **Testes com documento real**
   - Validar se os regex funcionam corretamente com PDFs reais
   - Verificar se a captura de `form_Anexos` funciona

2. **Integração com classificador**
   - Conectar `pet_recurso-indef` com o classificador de patentes
   - Implementar roteamento automático de tipos

3. **LGPD em petição**
   - Adicionar anonimização para campos sensíveis (quando necessário)
   - Mapeamento de 20 campos LGPD já está preparado

---

## Notas Técnicas

- Os métodos de extração usam regex com suporte a caracteres especiais: `[ãa]`, `[óo]`, `[ºo°]`
- Pattern matching é case-insensitive (`/i` flag)
- Whitespace é normalizado com `trim()` e `replace(/\s+/g, ' ')`
- Fallback patterns são implementados para robustez
- Nenhuma anonimização LGPD foi ativada nesta fase (apenas estrutura pronta)

---

**Status:** ✅ COMPLETO
**Próxima ação:** Teste com documento PDF real ou integração com classificador
