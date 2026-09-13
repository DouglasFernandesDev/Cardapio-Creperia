/**
 * Cardápio da Sagrado Creperia, transcrito do flyer oficial (imagens/cardapio.jpeg).
 * Preços em centavos (inteiros) para evitar erro de ponto flutuante nas somas;
 * a formatação em reais acontece apenas na camada de exibição (ver formato.js).
 */

export const CATEGORIAS = [
  {
    id: 'crepes-salgados',
    nome: 'Crepes Salgados',
    itens: [
      {
        id: 'napolitano',
        nome: 'Napolitano',
        descricao: 'Mussarela, presunto, tomate e orégano.',
        preco: 1990,
      },
      {
        id: 'frangolito',
        nome: 'Frangolito',
        descricao: 'Frango, mussarela, catupiry, milho, tomate e orégano.',
        preco: 2490,
      },
      {
        id: 'bahiano',
        nome: 'Bahiano',
        descricao: 'Frango, bacon, mussarela, presunto, tomate e orégano.',
        preco: 2490,
      },
      {
        id: 'frango-especial',
        nome: 'Frango Especial',
        descricao: 'Frango, mussarela, catupiry, cebola roxa, tomate e orégano.',
        preco: 2690,
      },
      {
        id: 'carne-seca',
        nome: 'Carne Seca',
        descricao: 'Carne seca, mussarela, catupiry, tomate e orégano.',
        preco: 2990,
      },
      {
        id: 'camarao-moda-da-casa',
        nome: 'Camarão à Moda da Casa',
        descricao: 'Camarão, mussarela, cream cheese e alho poró.',
        preco: 2990,
        destaque: true,
      },
      {
        id: 'camarao',
        nome: 'Camarão',
        descricao: 'Camarão, mussarela ou catupiry.',
        preco: 2790,
      },
    ],
  },
  {
    id: 'crepes-doces',
    nome: 'Crepes Doces',
    itens: [
      {
        id: 'morango-nutella',
        nome: 'Morango Nutella',
        descricao: 'Morango fresco com Nutella.',
        preco: 2590,
      },
      {
        id: 'morango-chocolate',
        nome: 'Morango Chocolate',
        descricao: 'Morango fresco com chocolate.',
        preco: 2490,
      },
      {
        id: 'doce-de-leite-com-banana',
        nome: 'Doce de Leite com Banana',
        descricao: 'Doce de leite cremoso com banana.',
        preco: 2490,
      },
      {
        id: 'banana-com-nutella',
        nome: 'Banana com Nutella',
        descricao: 'Banana com Nutella.',
        preco: 2590,
      },
    ],
  },
  {
    id: 'bebidas',
    nome: 'Bebidas',
    itens: [
      {
        id: 'refrigerante-2l',
        nome: 'Refrigerante 2L',
        descricao: '',
        preco: 1200,
      },
      {
        id: 'refrigerante-lata',
        nome: 'Refrigerante Lata',
        descricao: '',
        preco: 600,
      },
      {
        id: 'guaravita',
        nome: 'Guaravita',
        descricao: '',
        preco: 300,
      },
    ],
  },
];

/** Índice plano id → item, usado para validar o carrinho salvo no localStorage. */
export const ITENS_POR_ID = new Map(
  CATEGORIAS.flatMap((categoria) => categoria.itens.map((item) => [item.id, item]))
);
