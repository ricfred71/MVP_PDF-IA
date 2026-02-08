/**
 * sectors/marcas/types/EXEMPLO_UTILIZACAO.js
 * 
 * EXEMPLO DE COMO UTILIZAR O NOVO SISTEMA DE TYPES
 * Este arquivo demonstra como os types funcionam na prática
 */

// ========================================
// IMPORT (em um arquivo real, seria necessário)
// ========================================

// import { DataExtractor } from '../extractor.js';
// import { getExtractorForTipo, getTiposDisponiveis } from './index.js';
// import { identificarRecursoIndeferimento } from './recurso-indeferimento/classifier.js';

// ========================================
// EXEMPLO 1: FLUXO NORMAL DE PROCESSAMENTO
// ========================================

/*
// 1. Arquivo é carregado e classificado
const classificacao = {
  categoriaId: 'peticao',
  tipoId: 'recursoIndeferimentoPedidoRegistro',  // ← Tipo específico detectado
  confianca: 0.95
};

// 2. DataExtractor é instanciado
const dataExtractor = new DataExtractor();

// 3. Método extrairDadosPeticao é chamado
const resultado = dataExtractor.extrairDadosPeticao(
  textoCompleto,
  classificacao,
  'http://exemplo.com/pdf.pdf'
);

// 4. Internamente, o DataExtractor:
//    a) Chama getExtractorForTipo('recursoIndeferimentoPedidoRegistro', this)
//    b) Obtém RecursoInderimentoExtractor
//    c) Chama RecursoInderimentoExtractor.extract(...)
//    d) Retorna resultado com validação

// 5. Resultado contém:
console.log(resultado);
// {
//   storageKey: 'peticao_929063775_recurso_indeferimento_850240311055',
//   dados: {
//     categoria: 'peticao',
//     tipo: 'recursoIndeferimentoPedidoRegistro',
//     form_numeroPeticao: '850240311055',
//     form_numeroProcesso: '929063775',
//     form_requerente_nome: 'EMPRESA XYZ LTDA',
//     form_requerente_cpfCnpjNumINPI: '12.345.678/0001-90',
//     ... outros campos ...
//     textoPeticao: '... texto completo ...',
//     dataProcessamento: '2026-01-29T10:20:52.123Z'
//   },
//   validacao: {
//     valido: true,
//     erros: []
//   }
// }

// 6. Salva no storage
await chrome.storage.local.set({
  [resultado.storageKey]: resultado.dados
});
*/

// ========================================
// EXEMPLO 2: VALIDAÇÃO DE SCHEMA
// ========================================

/*
import { validarRecursoIndeferimento } from './recurso-indeferimento/schema.js';

const objeto = {
  categoria: 'peticao',
  tipo: 'recursoIndeferimentoPedidoRegistro',
  confianca: 0.95,
  form_numeroPeticao: '850240311055',
  form_numeroProcesso: '929063775',
  form_requerente_nome: 'EMPRESA XYZ LTDA',
  textoPeticao: '...',
  dataProcessamento: new Date().toISOString()
};

const validacao = validarRecursoIndeferimento(objeto);

if (validacao.valido) {
  console.log('✅ Objeto válido!');
} else {
  console.log('❌ Erros encontrados:', validacao.erros);
}
*/

// ========================================
// EXEMPLO 3: VERIFICAR TIPOS DISPONÍVEIS
// ========================================

/*
import { getTiposDisponiveis, isTipoDisponivel } from './index.js';

const tipos = getTiposDisponiveis();
console.log('Tipos disponíveis:', tipos);
// ['recursoIndeferimentoPedidoRegistro']

if (isTipoDisponivel('recursoIndeferimentoPedidoRegistro')) {
  console.log('✅ Tipo suportado!');
} else {
  console.log('❌ Tipo não suportado');
}
*/

// ========================================
// EXEMPLO 4: USAR CLASSIFIER ESPECÍFICO
// ========================================

/*
import { identificarRecursoIndeferimento } from './recurso-indeferimento/classifier.js';

const texto = `
Recurso contra indeferimento de pedido de registro de marca
Número da Petição: 850240311055
Número do Processo: 929063775
...
`;

const resultado = identificarRecursoIndeferimento(texto);

if (resultado.isMatch) {
  console.log(`✅ Detectado: ${resultado.descricao}`);
  console.log(`   Confiança: ${(resultado.confidence * 100).toFixed(0)}%`);
  console.log(`   Tipo ID: ${resultado.tipoId}`);
} else {
  console.log('❌ Não é um Recurso contra Indeferimento');
}
*/

// ========================================
// EXEMPLO 5: FALLBACK PARA TIPO GENÉRICO
// ========================================

/*
// Se um tipo não tem extractor específico, usa o genérico automaticamente

const classificacao = {
  categoriaId: 'peticao',
  tipoId: 'tipoQueAindaNaoTemExtractor',
  confianca: 0.85
};

const resultado = dataExtractor.extrairDadosPeticao(textoCompleto, classificacao);

// Internamente:
// 1. getExtractorForTipo('tipoQueAindaNaoTemExtractor') retorna null
// 2. DataExtractor usa sua lógica genérica
// 3. Retorna dados estruturados standard
// 4. Sem validação de schema específico

console.log(resultado);
// {
//   storageKey: 'peticao_...',
//   dados: { ... dados comuns ... }
//   // Nota: sem campo 'validacao' quando usa fallback genérico
// }
*/

// ========================================
// ESTRUTURA DE ARMAZENAMENTO NO STORAGE
// ========================================

/*
// Exemplo de objeto armazenado em chrome.storage.local:

const chaveStorage = 'peticao_929063775_recurso_indeferimento_850240311055';

const objeto = {
  // Metadados de classificação
  categoria: 'peticao',
  tipo: 'recursoIndeferimentoPedidoRegistro',
  subtipo: '',
  confianca: 0.95,
  
  // Dados da petição
  form_numeroPeticao: '850240311055',
  form_numeroProcesso: '929063775',
  form_nossoNumero: '12345678901234567',
  form_dataPeticao: '29/01/2026 10:20',
  
  // Requerente
  form_requerente_nome: 'EMPRESA XYZ LTDA',
  form_requerente_cpfCnpjNumINPI: '12.345.678/0001-90',
  form_requerente_endereco: 'Rua A, 123',
  form_requerente_cidade: 'São Paulo',
  form_requerente_estado: 'SP',
  form_requerente_cep: '01234-567',
  form_requerente_pais: 'Brasil',
  form_requerente_naturezaJuridica: 'Empresa Privada',
  form_requerente_email: 'contato@empresa.com',
  
  // Procurador
  form_procurador_nome: 'Dr. João Silva',
  form_procurador_cpf: '123.456.789-00',
  form_procurador_email: 'joao@escritorio.com',
  form_procurador_numeroAPI: '123456',
  form_procurador_numeroOAB: '123456',
  form_procurador_uf: 'SP',
  form_procurador_escritorio_nome: 'Silva e Associados',
  form_procurador_escritorio_cnpj: '12.345.678/0001-00',
  
  // Texto e metadados
  textoPeticao: '... texto completo do PDF ...',
  urlPdf: 'http://exemplo.com/pdf.pdf',
  dataProcessamento: '2026-01-29T10:20:52.123Z'
};

// Leitura posterior:
const resultado = await chrome.storage.local.get(chaveStorage);
console.log(resultado[chaveStorage]);
*/

// ========================================
// DÚVIDAS FREQUENTES
// ========================================

/*
P1: Como adicionar um novo tipo?
R: Ver tipos/README.md - seção "Como Adicionar Novo Tipo"

P2: Como expandir um tipo existente com novos campos?
R: 
  1. Adicionar campos ao schema.js
  2. Criar método _extrair* no extractor.js
  3. Chamar o método no extract()
  4. Testar validação

P3: Como remover a validação de tipo?
R: O extractor retorna { storageKey, dados, validacao }
   Basta ignorar o campo 'validacao' se necessário.
   Ou remover o schema.js e importação no extractor.

P4: Tipo genérico retorna validacao?
R: Não. Apenas tipos específicos (com extractor) retornam.
   Use isso para detectar qual caminho foi tomado.

P5: Como testar um novo tipo?
R: Criar arquivo de teste com:
   - Texto simulado do documento
   - Chamar classificador
   - Chamar extractor
   - Validar resultado
   - Verificar schema

P6: Como são extraídos form_TextoDaPetição e form_Anexos?
R: 
   - form_TextoDaPetição: Capturado entre "Classes objeto do recurso NCL" e "Texto da Petição"
   - form_Anexos: Tabela com "Descrição" e "Nome do Arquivo", entre "Texto da Petição" e "Declaro, sob as penas da lei"

// ========================================
// EXEMPLO 6: NOVA EXTRAÇÃO DE CAMPOS ESPECÍFICOS
// ========================================

/*
import { RecursoInderimentoExtractor } from './recurso-indeferimento/extractor.js';

const texto = `
Classes objeto do recurso NCL (11) 35 
Tem a presente petição o objetivo de apresentar tempestivamente o recurso contra o Indeferimento publicado na RPI 2781 de 24/04/2024
Texto da Petição

Descrição                          Nome do Arquivo
Recurso                           RECURSO YOLOVEYO ART 124 INC XIX PROC 929063775.pdf
Taxa comprovante pagto taxa       TAXA RECURSO.pdf
Comprovante pagto                 comprovante pagto taxa recurso.pdf

Declaro, sob as penas da lei, que todas as informações prestadas neste formulário são verdadeiras
`;

const dataExtractor = new DataExtractor();
const extractor = new RecursoInderimentoExtractor(dataExtractor);

const resultado = extractor.extract(texto, {
  categoriaId: 'peticao',
  tipoId: 'recursoIndeferimentoPedidoRegistro',
  confianca: 0.95
});

// Resultado contém:
console.log(resultado.dados.form_TextoDaPetição);
// Output: "Tem a presente petição o objetivo de apresentar tempestivamente o recurso contra o Indeferimento publicado na RPI 2781 de 24/04/2024"

console.log(resultado.dados.form_Anexos);
// Output: [
//   { nomeArquivo: 'RECURSO YOLOVEYO ART 124 INC XIX PROC 929063775.pdf', descricao: 'Recurso' },
//   { nomeArquivo: 'TAXA RECURSO.pdf', descricao: 'Taxa comprovante pagto taxa' },
//   { nomeArquivo: 'comprovante pagto taxa recurso.pdf', descricao: 'Comprovante pagto' }
// ]
*/

export {};
