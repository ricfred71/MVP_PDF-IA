# Copilot Instructions

## Objetivo do repositorio
- MVP de processamento e analise de PDFs com modulo de IA.
- Priorizar resultados consistentes, desempenho e manutencao simples.

## Linguagens e padroes
- JavaScript (ES2020), HTML, CSS.
- UI e textos em pt-BR; nomes de funcoes e variaveis em ingles.
- Evite novas dependencias sem justificar ganho claro.

## Estrutura relevante

- App e entrada: /app.js, /index.html
- Processamento de PDF: /pdfProcessor.js
- UI: /ui
- Core e utils: /core, /utils
- Scripts e libs: /scripts, /lib


## Documentacao
- Toda documentacao deve ser salva em /Auxiliar.
- Nome do arquivo deve incluir o nome da pasta de origem.
- Se houver pastas repetidas, use o caminho para desambiguar, unindo pastas com "_".
- Exemplo: conteudo de /patentes/types/RESUMO.md deve ser salvo como patentes_types_RESUMO.md.
- Atualize o arquivo indice.md com a lista dos arquivos em /Auxiliar, com itens linkados.

## Preferencias de codigo
- Priorize funcoes puras e nomes descritivos.
- Evite acoplamento entre UI e processamento.
- Favor modularidade pequena em vez de arquivos enormes.
- Comentarios apenas em trechos nao obvios.

## Validacao rapida
- Mudou UI? Verificar telas principais do fluxo.
- Mudou processamento? Testar com PDFs pequenos e grandes.
- Mudou IA? Validar entradas e saidas do pipeline.

## Restricoes
- Nao introduzir telemetria ou chamadas externas sem aprovacao.
- Nao alterar manifest.json sem avisar.
