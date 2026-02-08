
Objetivo:
Criar uma extensão para o Chrome, que ira carregar um pdf que está no computador, ler este pdf, processar, e enviá-lo para uma IA fazer o trabalho de análise.
O documento passara por um processamento para retirar dados sensíveis, de modo que uma terceira parte, que interceptar o documento, não consiga fazer a  identificação dos requerentes ou titulares, ou relacionar o documento com qualquer processo específico do INPI.

O sistema irá:
## 1. Extrair o texto do pdf automaticamente
		Uma biblioteca lera o pdf, transformando-o em txt.
		
##  2. Identificar o tipo de documento, conforme uma classificação.
		
## 3. Processar os dados estruturados e converte-los em um objeto.

Salvar no storage
	Esse texto será classificado e transformado em um objeto, salvo no storange.
	
## 5. Enviar para a IA

## 6. Receber da IA

## 7. Disponibilizar o documento, com os dados originais reconstituídos para o usuário




##  2. Identificar o tipo de documento, conforme uma taxonomia própria.
	1. identificação das categoria, tipo e subtipo do documento, se dará pela localização de strings específicas, uma para cada divisão, por meio de regex.
	2. Conforme a divisão haverá chaves diferentes no objeto.
	 
	 2. Em todas haverá uma chave chamada LGPD, que será um array de nomes de chaves do próprio objeto. Esta chave objetiva codificar os dados sensíveis, antes de serem enviados para a IA, a fim de que não haja a identificação das partes ou relação com qualquer processo específico do INPI
		[colocar uma de exemplo, para a petição de recurso]
	O conteudo de cada variável listada na LGPD será trocada por uma string aleatória, criada pelo p´roprio código. Será armazenado no objeto em outra variável a relação entre a variavel original e a a nova, pois o objetivo é gerar uma nova variável textoCompletoLGPD, onde as vairáveis foram alteradas, por exemplo, texto riginal 'a petição numero 948563258, do titular fernando neve', textoLGPD 'a petição numero lic8s+#l, do titular 54f%=_'

guardar no storange esse objeto

após o storange, a extensão ira abrir uma página html, definida na página options da extensão:
		fazer caixa vazia para o usuário inserir a sua preferida. (depois fazer o código para as principais.
			se não houver configuração na página options de qual IA esta definida, usar esta:
				https://gemini.google.com/app	
				
Enviar para a janela do chat o texto limpo, cifrado: