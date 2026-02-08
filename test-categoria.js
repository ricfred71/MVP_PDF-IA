/**
 * Teste da função _identificarCategoria
 */

// Simula a lógica atual SIMPLIFICADA
function _identificarCategoria(texto) {
  const texto250 = texto.substring(0, 250);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 TEXTO ANALISADO (primeiros 250 caracteres):');
  console.log(texto250);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // PETIÇÃO: Sequência de 17 dígitos (simplificado)
  const regexPeticao = /\d{17}/;
  
  // DOCUMENTO OFICIAL: Presença de "Processo de registro de marca" OU "Petição de Marca"
  const regexDocOficial = /(Processo de registro de marca|Petição de Marca)/i;
  
  console.log('🔍 TESTANDO REGEX DE PETIÇÃO (SIMPLIFICADA):');
  console.log('   Formato: [17 dígitos consecutivos]');
  console.log('   Regex:', regexPeticao);
  const matchPeticao = texto250.match(regexPeticao);
  console.log('   Match encontrado?', matchPeticao ? '✅ SIM' : '❌ NÃO');
  if (matchPeticao) {
    console.log('   Trecho identificado:', matchPeticao[0]);
  }
  console.log('');
  
  console.log('🔍 TESTANDO REGEX DE DOCUMENTO OFICIAL:');
  console.log('   Padrão esperado: "Processo de registro de marca" OU "Petição de Marca"');
  console.log('   Regex:', regexDocOficial);
  const matchDocOficial = texto250.match(regexDocOficial);
  console.log('   Match encontrado?', matchDocOficial ? '✅ SIM' : '❌ NÃO');
  if (matchDocOficial) {
    console.log('   Trecho identificado:', matchDocOficial[0]);
  }
  console.log('');
  
  let categoria = 'categoriaDesconhecida';
  
  if (regexPeticao.test(texto250)) {
    categoria = 'pet';
    console.log('✅ RESULTADO: PETIÇÃO');
  } else if (regexDocOficial.test(texto250)) {
    categoria = 'doc_oficial';
    console.log('✅ RESULTADO: DOCUMENTO OFICIAL');
  } else {
    console.log('⚠️ RESULTADO: CATEGORIA DESCONHECIDA');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return categoria;
}

// TESTE COM O TEXTO FORNECIDO
const textoTeste = "Pedido de Registro de Marca de Produto e/ou Serviço (Mista) 29409171959441031 10:40 23/12/2022 850220572701 Dados Gerais";

console.log('═══════════════════════════════════════════');
console.log('🧪 TESTE DE CLASSIFICAÇÃO DE CATEGORIA');
console.log('═══════════════════════════════════════════\n');

const resultado = _identificarCategoria(textoTeste);

console.log('\n═══════════════════════════════════════════');
console.log('📊 ANÁLISE DO RESULTADO:');
console.log('═══════════════════════════════════════════');
console.log('Categoria identificada:', resultado);
console.log('');
if (resultado === 'pet') {
  console.log('✅ SUCESSO! Regex simplificada funcionando:');
  console.log('  • Basta encontrar 17 dígitos consecutivos');
  console.log('  • Não precisa de data/hora');
  console.log('  • Busca nos primeiros 250 caracteres');
} else {
  console.log('❌ FALHA: Não encontrou 17 dígitos consecutivos nos primeiros 250 caracteres');
}
console.log('═══════════════════════════════════════════');
