## Arquitetura de Classificação por Setor

### Problema Resolvido
Antes, a classificação de documentos era genérica e usava patterns que não diferenciavam entre Marcas e Patentes. Agora a classificação é **específica por setor**.

### Solução Implementada: Padrão Strategy

A classificação segue o padrão Strategy com 3 níveis:

```
DocumentClassifier (Orquestrador)
  ├─ MarcasClassifier (Estratégia Marcas)
  └─ PatentesClassifier (Estratégia Patentes)
```

### Fluxo de Classificação

```
1. upload.js: texto + setor detectado
         ↓
2. DocumentClassifier.classificar(texto, setor) [NOVO PARÂMETRO]
         ↓
3. Router interno decide qual classifier usar:
   - Se setor === 'patentes' → PatentesClassifier
   - Se setor === 'marcas' (ou default) → MarcasClassifier
         ↓
4. Classifier específico executa a lógica adequada
         ↓
5. Retorna: { categoriaId, tipoId, subtipoId, confianca, setor }
```

### Categorias por Setor

#### MARCAS (MarcasClassifier)
- **PETICAO**: Documento com 17 dígitos contínuos
  - Exemplo: `31123252330338563`
- **DOCUMENTO_OFICIAL**: Padrões como DESPACHO, DECISÃO, INTIMAÇÃO, PARECER
- **CATEGORIADESCONHECIDA**: Não se enquadra em nenhum padrão

#### PATENTES (PatentesClassifier) 
- **PETICAO**: Documento com 17 dígitos OU padrões específicos de patentes
  - 17 dígitos: `31123252330338563`
  - Padrões patente: "Relatório Descritivo", "Reivindicações", "PI123456", "MU789012"
- **DOCUMENTO_OFICIAL**: Despachos, pareceres técnicos, decisões do INPI
- **CATEGORIADESCONHECIDA**: Não se enquadra

### Arquivos Criados

#### `sectors/marcas/classifier.js`
- Classe: `MarcasClassifier`
- Método: `classificar(texto)` → Object com categoriaId e setor='marcas'
- Regex específicos para marcas
- Exporta: `new MarcasClassifier()` (singleton)

#### `sectors/patentes/classifier.js`
- Classe: `PatentesClassifier`
- Método: `classificar(texto)` → Object com categoriaId e setor='patentes'
- Regex específicos para patentes (PI, MU, Reivindicações, Relatório)
- Exporta: `new PatentesClassifier()` (singleton)

#### `core/document-classifier.js` (REFATORADO)
- Função: Orquestrador apenas
- Novo método: `classificar(texto, setor)`
- Remove 300+ linhas de lógica (agora em sector-classifiers)
- Importa e roteá para o classifier correto
- Mantém interface compatível

### Modificações em `ui/upload/upload.js`

**Antes:**
```javascript
const classifier = new DocumentClassifier();
const classificacao = classifier.classificar(resultado.texto);
```

**Depois:**
```javascript
const detectedSector = detectSector(resultado.texto, {...});
const classifier = new DocumentClassifier();
const classificacao = classifier.classificar(resultado.texto, detectedSector);
// ↑ Novo parâmetro
```

### Benefícios

1. **Separação de Responsabilidades**: Cada setor tem sua própria lógica
2. **Fácil de Estender**: Adicionar novos setores é simples (criar novo arquivo)
3. **Testável**: Cada classifier pode ser testado independentemente
4. **Reutilizável**: Padrão Strategy facilita testes e manutenção
5. **Preparado para Split**: Após MVP, copiar `sectors/marcas/` para nova extensão é trivial

### Próximos Passos

1. ✅ **FEITO**: Classificação por setor implementada
2. **Implementar tipos específicos**: Ativar `_identificarTipoPeticao()` em cada classifier
3. **Implementar subtipos**: Adicionar lógica complementar conforme necessário
4. **Testar padrões reais**: Validar regex com documentos reais de cada setor
5. **LGPD**: Implementar anonymização se necessário

### Exemplo de Uso

```javascript
import { DocumentClassifier } from '../../core/document-classifier.js';

const classifier = new DocumentClassifier();

// Marca
const resultMarca = classifier.classificar(textoMarca, 'marcas');
// Resultado: { categoriaId: 'peticao', setor: 'marcas', ... }

// Patente
const resultPatente = classifier.classificar(textoPatente, 'patentes');
// Resultado: { categoriaId: 'relatorio_descritivo', setor: 'patentes', ... }
```

### Mapeamento de Categorias

Ambos setores usam as **mesmas categorias**:
- **PETICAO**: Documento inicial do requerente (com padrões específicos por setor)
- **DOCUMENTO_OFICIAL**: Resposta/decisão do órgão

| Marcas (PETICAO) | Patentes (PETICAO) | 
|---|---|
| 17 dígitos (número único) | 17 dígitos OU padrões de patente (PI, MU, Relatório) |

### Notas de Implementação

- Cada classifier retorna `setor` no resultado para validação
- Padrões regex são específicos por setor (não há contaminação cruzada)
- Logging mantém prefixo `[MarcasClassifier]` ou `[PatentesClassifier]` para rastreabilidade
- `tipoId` e `subtipoId` continuam vazios até implementação (⚠️ DESATIVADOS)
