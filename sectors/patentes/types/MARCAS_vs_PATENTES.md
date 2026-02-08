# 📊 COMPARAÇÃO: Marcas vs Patentes

## Estrutura de Diretórios

### Antes (Marcas)
```
sectors/marcas/
├── extractor.js
├── classifier.js
└── types/
    ├── index.js
    ├── tipos-map.js
    ├── base_extractor_utils.js
    ├── README.md
    ├── 00_COMECE_AQUI.md
    ├── CHECKLIST_NOVO_TIPO.md
    ├── GUIA_RAPIDO_NOVA_ARQUITETURA.md
    ├── NAMING-CONVENTIONS.md
    ├── pet_recurso-indef/
    │   ├── pet_schema.js
    │   ├── pet_extractor.js
    │   ├── pet_classifier.js
    │   └── pet_relacionado.js
    └── doc_recurso-indef--naoProv/
        ├── doc_schema.js
        ├── doc_extractor.js
        └── doc_classifier.js
```

### Agora (Patentes) ✅
```
sectors/patentes/
├── extractor.js                    (⚠️ Ainda genérico)
├── classifier.js                   (⚠️ Ainda genérico)
└── types/
    ├── index.js                    ✅ Idêntico ao de marcas
    ├── tipos-map.js                ✅ Adaptado para patentes
    ├── base_extractor_utils.js     ✅ Idêntico ao de marcas
    ├── README.md                   ✅ Adaptado para patentes
    ├── 00_COMECE_AQUI.md           ✅ Adaptado para patentes
    ├── CHECKLIST_NOVO_TIPO.md      ✅ Adaptado para patentes
    ├── GUIA_RAPIDO.md              ✅ Adaptado para patentes
    ├── RESUMO.md                   ✅ Novo arquivo
    └── [tipos específicos]         ⏳ A implementar
```

## Diferenças Importantes

### tipos-map.js

| Aspecto | Marcas | Patentes |
|---------|--------|----------|
| IDs de petição | `recursoIndeferimentoPedidoRegistro` | `recursoIndeferimentoPedidoPatente` |
| Descrição de petição | "...de Marca" | "...de Patente" |
| Documentos | Mesmos (naoProv, Provido, etc) | Mesmos (naoProv, Provido, etc) |
| Structure | Idêntica | Idêntica |

### index.js

| Aspecto | Marcas | Patentes |
|---------|--------|----------|
| Router logic | ✅ Idêntica | ✅ Idêntica |
| Dynamic loading | ✅ Idêntica | ✅ Idêntica |
| Module cache | ✅ Idêntica | ✅ Idêntica |
| Imports | Comentados (tipos não implementados) | Comentados (tipos não implementados) |

### Documentação

| Arquivo | Marcas | Patentes |
|---------|--------|----------|
| README.md | ✅ Completo | ✅ Adaptado |
| 00_COMECE_AQUI.md | ✅ Completo | ✅ Adaptado |
| CHECKLIST_NOVO_TIPO.md | ✅ Completo | ✅ Adaptado |
| GUIA_RAPIDO.md | GUIA_RAPIDO_NOVA_ARQUITETURA.md | ✅ Novo e melhorado |
| RESUMO.md | Não existe | ✅ Novo |

## O Que é Idêntico

1. **index.js** - Router e gestão de tipos (100% compatível)
2. **base_extractor_utils.js** - Funções auxiliares (100% reutilizável)
3. **Fluxo de execução** - Classificação → Roteamento → Extração → Validação
4. **API de tipos** - getTipo(), isPeticao(), isDocumentoOficial(), etc
5. **Padrão de nomes** - pet_*, doc_*, esquema camelCase

## O Que é Diferente

| Item | Marcas | Patentes |
|------|--------|----------|
| Setor | Marcas (registro de marca) | Patentes (registro de patente) |
| IDs de tipo | Contêm "Registro" | Contêm "Patente" |
| Contexto de negócio | Propriedade intelectual (marcas) | Propriedade intelectual (patentes) |
| Classificador | Baseado em padrões de marca | Baseado em padrões de patente |
| Campos extraídos | Específicos de marca | Específicos de patente (ainda) |

## Integração com Sistemas Existentes

### Classificador de Patentes

Quando implementar tipos em patentes, você precisará:

```javascript
// sectors/patentes/classifier.js

import { identificarRecursoIndef } from './types/pet_recurso-indef/pet_classifier.js';

export function classificarPeticaoPatente(texto) {
  // Tentar identificar como Recurso Indeferimento
  const recursoIndef = identificarRecursoIndef(texto);
  if (recursoIndef?.isMatch) {
    return {
      categoria: 'peticao',
      tipoId: 'recursoIndeferimentoPedidoPatente',
      confianca: recursoIndef.confidence
    };
  }
  
  // ... tentar outros tipos ...
  
  return null;  // Tipo desconhecido
}
```

### DataExtractor de Patentes

Quando implementar extração:

```javascript
// sectors/patentes/extractor.js

import { getExtractorForTipo } from './types/index.js';

export class DataExtractor {
  async extrairDadosPeticao(textoPdf, classificacao) {
    // Tentar obter extractor específico do tipo
    const extractor = await getExtractorForTipo(classificacao.tipoId, this);
    
    if (extractor) {
      // Usar extractor específico
      return extractor.extract(textoPdf, classificacao);
    }
    
    // Fallback para extração genérica
    return this._extrairGenerico(textoPdf, classificacao);
  }
}
```

## Checklist de Verificação

- ✅ Diretório `sectors/patentes/types/` criado
- ✅ `index.js` idêntico ao de marcas (funcionalidade completa)
- ✅ `tipos-map.js` registra tipos para patentes
- ✅ `base_extractor_utils.js` copiado e funcional
- ✅ Documentação adaptada para contexto de patentes
- ✅ Guias passo-a-passo prontos
- ✅ Comentários no code indicam onde implementar tipos específicos
- ✅ Estrutura pronta para escalação (novos tipos)

## Próximas Ações Recomendadas

### Imediato

1. **Integrar com Classificador** 
   - Adicionar importações em `sectors/patentes/classifier.js`
   - Implementar detecção de tipos de patente

2. **Integrar com DataExtractor**
   - Adicionar router em `sectors/patentes/extractor.js`
   - Implementar fallback genérico

### Médio Prazo

3. **Implementar Primeiro Tipo**
   - Seguir `CHECKLIST_NOVO_TIPO.md`
   - Criar `pet_recurso-indef/` em patentes
   - Testar com documentos reais

4. **Documentar Campos Específicos**
   - Mapear campos únicos de patentes
   - Criar templates de schema

### Longo Prazo

5. **Expandir para Mais Tipos**
   - Oposição, Manifestação, etc
   - Reutilizar padrão estabelecido

## 📌 Notas Importantes

> **Reutilização**: A estrutura é 100% reutilizável do código de marcas. Apenas os IDs de tipo e descrições foram adaptadas.

> **Compatibilidade**: O router dinâmico em `index.js` suporta tanto marcas quanto patentes sem modificações.

> **Escalabilidade**: Novos setores (design, etc) podem usar a mesma arquitetura.

> **Manutenção**: Mudanças no `index.js` beneficiam automaticamente todos os setores que o usam.

---

**Status**: ✅ Replicação completa e validada  
**Próximo Passo**: Implementar primeiro tipo em patentes
