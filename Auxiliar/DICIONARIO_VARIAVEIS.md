# Dicionário de variáveis/campos por tipo de objeto

Este documento lista os campos definidos nos schemas do projeto e os campos efetivamente produzidos pelos extractors (quando divergem), com tipo e uma descrição breve do conteúdo atribuído.

## Patentes > Petição > Recurso contra Indeferimento de Pedido de Patente
Fonte: [sectors/patentes/types/pet_recurso-indef/pet_extractor.js](sectors/patentes/types/pet_recurso-indef/pet_extractor.js) (campos extraídos) e [sectors/patentes/types/pet_recurso-indef/pet_schema.js](sectors/patentes/types/pet_recurso-indef/pet_schema.js) (schema)

| Campo                              | Tipo   | Descrição                                                           |
| ---------------------------------- | ------ | ------------------------------------------------------------------- |
| `categoria`                        | string | Categoria do documento (valor fixo: peticao).                       |
| `tipo`                             | string | Tipo específico do documento (recursoIndeferimentoPedidoPatente).   |
| `subtipo`                          | string | Subtipo do documento (uso futuro).                                  |
| `confianca`                        | number | Confiança da classificação (0–1).                                   |
| `setor`                            | string | Setor do documento (patentes).                                      |
| `form_numeroPeticao`               | string | Número da petição (12 dígitos).                                     |
| `form_numeroProcesso`              | string | Número do processo (BR + dígitos ou 9 dígitos).                     |
| `form_nossoNumero`                 | string | Nosso número (17 dígitos).                                          |
| `form_dataPeticao`                 | string | Data e hora da petição (DD/MM/YYYY HH:MM).                          |
| `form_requerente_nome`             | string | Nome ou Razão Social do requerente.                                 |
| `form_requerente_cpfCnpjNumINPI`   | string | CPF/CNPJ/Número INPI do requerente.                                 |
| `form_requerente_endereco`         | string | Endereço do requerente.                                             |
| `form_requerente_cidade`           | string | Cidade do requerente.                                               |
| `form_requerente_estado`           | string | Estado/UF do requerente (2 letras).                                 |
| `form_requerente_cep`              | string | CEP do requerente.                                                  |
| `form_requerente_pais`             | string | País do requerente.                                                 |
| `form_requerente_nacionalidade`    | string | Nacionalidade do requerente.                                        |
| `form_requerente_naturezaJuridica` | string | Natureza jurídica do requerente.                                    |
| `form_requerente_email`            | string | E-mail do requerente.                                               |
| `form_procurador_nome`             | string | Nome do procurador/advogado.                                        |
| `form_procurador_cpf`              | string | CPF do procurador.                                                  |
| `form_procurador_email`            | string | E-mail do procurador.                                               |
| `form_procurador_numeroAPI`        | string | Número de registro API do procurador.                               |
| `form_procurador_numeroOAB`        | string | Número OAB do procurador.                                           |
| `form_procurador_uf`               | string | UF da OAB do procurador.                                            |
| `form_procurador_escritorio_nome`  | string | Nome do escritório do procurador.                                   |
| `form_procurador_escritorio_cnpj`  | string | CNPJ do escritório do procurador.                                   |
| `form_Anexos`                      | array  | Lista de anexos da petição (itens com `descricao` e `nomeArquivo`). |
| `textoPeticao`                     | string | Texto completo da petição (não indexável).                          |
| `textoParaIa`                      | string | Texto da petição anonimizado para IA.                               |
| `urlPdf`                           | string | URL do PDF original.                                                |
| `dataProcessamento`                | string | Data/hora de processamento (ISO 8601).                              |
| `processor`                        | string | Identificador do processador.                                       |

## Marcas > Petição > Recurso contra Indeferimento de Pedido de Registro de Marca
Fonte: [sectors/marcas/types/pet_recurso-indef/pet_extractor.js](sectors/marcas/types/pet_recurso-indef/pet_extractor.js) (campos extraídos) e [sectors/marcas/types/pet_recurso-indef/pet_schema.js](sectors/marcas/types/pet_recurso-indef/pet_schema.js) (schema)

| Campo                              | Tipo   | Descrição                                                           |
| ---------------------------------- | ------ | ------------------------------------------------------------------- |
| `categoria`                        | string | Categoria do documento (valor fixo: peticao).                       |
| `tipo`                             | string | Tipo específico do documento (recursoIndeferimentoPedidoRegistro).  |
| `subtipo`                          | string | Subtipo do documento (uso futuro).                                  |
| `confianca`                        | number | Confiança da classificação (0–1).                                   |
| `form_numeroPeticao`               | string | Número da petição (12 dígitos).                                     |
| `form_numeroProcesso`              | string | Número do processo (9 dígitos).                                     |
| `form_nossoNumero`                 | string | Nosso número (17 dígitos).                                          |
| `form_dataPeticao`                 | string | Data e hora da petição (DD/MM/YYYY HH:MM).                          |
| `form_requerente_nome`             | string | Nome ou Razão Social do requerente.                                 |
| `form_requerente_cpfCnpjNumINPI`   | string | CPF/CNPJ/Número INPI do requerente.                                 |
| `form_requerente_endereco`         | string | Endereço do requerente.                                             |
| `form_requerente_cidade`           | string | Cidade do requerente.                                               |
| `form_requerente_estado`           | string | Estado/UF do requerente (2 letras).                                 |
| `form_requerente_cep`              | string | CEP do requerente.                                                  |
| `form_requerente_pais`             | string | País do requerente.                                                 |
| `form_requerente_naturezaJuridica` | string | Natureza jurídica do requerente.                                    |
| `form_requerente_email`            | string | E-mail do requerente.                                               |
| `form_procurador_nome`             | string | Nome do procurador/advogado.                                        |
| `form_procurador_cpf`              | string | CPF do procurador.                                                  |
| `form_procurador_email`            | string | E-mail do procurador.                                               |
| `form_procurador_numeroAPI`        | string | Número de registro API do procurador.                               |
| `form_procurador_numeroOAB`        | string | Número OAB do procurador.                                           |
| `form_procurador_uf`               | string | UF da OAB do procurador.                                            |
| `form_procurador_escritorio_nome`  | string | Nome do escritório do procurador.                                   |
| `form_procurador_escritorio_cnpj`  | string | CNPJ do escritório do procurador.                                   |
| `form_TextoDaPetição`              | string | Texto principal da petição (argumentação e fundamentação).          |
| `form_Anexos`                      | array  | Lista de anexos da petição (itens com `descricao` e `nomeArquivo`). |
| `textoPeticao`                     | string | Texto completo da petição (não indexável).                          |
| `textoParaIa`                      | string | Texto da petição anonimizado para IA.                               |
| `urlPdf`                           | string | URL do PDF original.                                                |
| `dataProcessamento`                | string | Data/hora de processamento (ISO 8601).                              |

## Patentes > Documento Oficial > Recurso contra Indeferimento — Não Provido
Fonte: [sectors/patentes/types/doc_recurso-indef--naoProv/doc_extractor.js](sectors/patentes/types/doc_recurso-indef--naoProv/doc_extractor.js) (campos extraídos) e [sectors/patentes/types/doc_recurso-indef--naoProv/doc_schema.js](sectors/patentes/types/doc_recurso-indef--naoProv/doc_schema.js) (schema)

| Campo                          | Tipo   | Descrição                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------- |
| `categoria`                    | string | Categoria do documento oficial (valor padrão: documento_oficial). |
| `tipo`                         | string | Tipo específico do documento.                                     |
| `subtipo`                      | string | Subtipo do documento.                                             |
| `confianca`                    | number | Confiança da classificação (0–100).                               |
| `setor`                        | string | Setor do documento (valor padrão: patentes).                      |
| `form_numeroProcesso`          | string | Número do processo (BR + dígitos; pode conter sufixo “-d”).       |
| `form_numeroPct`               | string | Número PCT (se aplicável).                                        |
| `form_dataDeposito`            | string | Data de depósito (DD/MM/YYYY).                                    |
| `form_prioridadeUnionista`     | string | Prioridade unionista.                                             |
| `form_requerente_nome`         | string | Nome do requerente.                                               |
| `form_inventor_nome`           | string | Nome do inventor.                                                 |
| `form_titulo`                  | string | Título do pedido/patente.                                         |
| `textoAutomaticoEtapa1`        | string | Texto automático gerado para a etapa 1.                           |
| `textoAutomaticoEtapa2`        | string | Texto automático gerado para a etapa 2.                           |
| `dataDespacho`                 | string | Data do despacho.                                                 |
| `dataNotificacaoIndeferimento` | string | Data de notificação do indeferimento.                             |
| `nomeDecisao`                  | string | Nome da decisão.                                                  |
| `tipoDespacho`                 | string | Tipo de despacho (Recurso não provido).                           |
| `form_decisao`                 | string | Decisão registrada no documento.                                  |
| `decisao`                      | string | Decisão (indeferido_mantido).                                     |
| `textoParecer`                 | string | Texto do parecer.                                                 |
| `tecnico`                      | string | Técnico responsável.                                              |
| `artigosInvocados`             | array  | Lista de artigos invocados.                                       |
| `motivoIndeferimento`          | string | Motivo do indeferimento.                                          |
| `anterioridades`               | array  | Anterioridades citadas.                                           |
| `processosConflitantes`        | array  | Processos conflitantes citados.                                   |
| `textoParaIa`                  | string | Texto do parecer anonimizado para IA.                             |
| `textoCompleto`                | string | Texto completo do documento.                                      |
| `urlPdf`                       | string | URL do PDF.                                                       |
| `dataProcessamento`            | string | Data/hora do processamento.                                       |
| `processor`                    | string | Identificador do processador.                                     |

## Marcas > Documento Oficial > Recurso contra Indeferimento — Não Provido
Fonte: [sectors/marcas/types/doc_recurso-indef--naoProv/doc_extractor.js](sectors/marcas/types/doc_recurso-indef--naoProv/doc_extractor.js) (campos extraídos) e [sectors/marcas/types/doc_recurso-indef--naoProv/doc_schema.js](sectors/marcas/types/doc_recurso-indef--naoProv/doc_schema.js) (schema)

| Campo                                | Tipo   | Descrição                                                         |
| ------------------------------------ | ------ | ----------------------------------------------------------------- |
| `categoria`                          | string | Categoria do documento oficial (valor padrão: documento_oficial). |
| `tipo`                               | string | Tipo específico do documento.                                     |
| `subtipo`                            | string | Subtipo do documento.                                             |
| `confianca`                          | number | Confiança da classificação (0–100).                               |
| `form_numeroProcesso`                | string | Número do processo (9 dígitos).                                   |
| `form_dataDespacho`                  | string | Data do despacho (DD/MM/YYYY).                                    |
| `form_nomePeticao`                   | string | Nome da petição.                                                  |
| `form_numeroProtocolo`               | string | Número do protocolo.                                              |
| `form_dataApresentacao`              | string | Data de apresentação.                                             |
| `form_requerente_nome`               | string | Nome do requerente.                                               |
| `form_dataNotificacaoIndeferimento`  | string | Data de notificação do indeferimento.                             |
| `form_nomeDecisao`                   | string | Nome da decisão.                                                  |
| `form_dataParecer`                   | string | Data do parecer.                                                  |
| `form_numeroParecer`                 | string | Número do parecer.                                                |
| `textoAutomaticoEtapa1`              | string | Texto automático gerado para a etapa 1.                           |
| `textoAutomaticoEtapa2`              | string | Texto automático gerado para a etapa 2.                           |
| `textoParecer`                       | string | Texto do parecer.                                                 |
| `form_tecnico`                       | string | Técnico responsável.                                              |
| `form_marca`                         | string | Marca relacionada ao processo.                                    |
| `tipoDespacho`                       | string | Tipo de despacho (Recurso não provido).                           |
| `artigosInvocados`                   | array  | Lista de artigos invocados.                                       |
| `decisao`                            | string | Decisão (indeferido_mantido).                                     |
| `motivoIndeferimento`                | string | Motivo do indeferimento.                                          |
| `anterioridades`                     | array  | Anterioridades citadas.                                           |
| `processosConflitantes`              | array  | Processos conflitantes citados.                                   |
| `textoParaIa`                        | string | Texto do parecer anonimizado para IA.                             |
| `textoCompleto`                      | string | Texto completo do documento.                                      |
| `urlPdf`                             | string | URL do PDF.                                                       |
| `dataProcessamento`                  | string | Data/hora do processamento.                                       |
| `processor`                          | string | Identificador do processador.                                     |
