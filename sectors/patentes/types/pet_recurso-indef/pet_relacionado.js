/**
 * sectors/marcas/types/recurso-indef/relacionado.js
 * 
 * Metadados sobre o tipo de petição e tipos de documentos relacionados
 */

export const TIPO_PETICAO = {
  id: 'recursoIndeferimentoPedidoRegistro',
  categoria: 'peticao',
  abreviacao: 'recurso-indef',
  nomeLongo: 'Recurso contra Indeferimento de Pedido de Registro de Marca',
  descricao: 'Petição de recurso administrativo contra decisão de indeferimento',
  artigos: ['Art. 124, inc. XIX da Lei de Propriedade Industrial'],
  
  // Documentos oficiais relacionados que podem seguir
  documentosRelacionados: [
    {
      id: 'recursoIndeferimentoNaoProvido',
      abreviacao: 'recurso-indef--naoProv',
      descricao: 'Despacho: Recurso não provido'
    },
    {
      id: 'recursoIndeferimentoProvido',
      abreviacao: 'recurso-indef--provido',
      descricao: 'Despacho: Recurso provido'
    },
    {
      id: 'recursoIndeferimentoProvidoParcial',
      abreviacao: 'recurso-indef--provParcial',
      descricao: 'Despacho: Recurso provido parcialmente'
    }
  ]
};

export const TIPOS_DOCUMENTOS_RELACIONADOS = [
  'recursoIndeferimentoNaoProvido',
  'recursoIndeferimentoProvido',
  'recursoIndeferimentoProvidoParcial'
];
