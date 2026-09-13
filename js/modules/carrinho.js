/**
 * Estado do carrinho de compras.
 *
 * Cada linha é identificada por `itemId + observacao`, para que o mesmo
 * produto pedido com observações diferentes (ex.: "sem cebola" vs. sem
 * observação) apareça em linhas separadas.
 *
 * Persistência em localStorage é best-effort: se falhar (modo privado,
 * armazenamento cheio) o carrinho continua funcionando apenas em memória.
 * Ao carregar, cada linha salva é revalidada contra o cardápio atual —
 * um item removido ou com preço alterado é descartado/atualizado, nunca
 * confiado cegamente.
 */

import { ITENS_POR_ID } from '../data/cardapio.js';

const CHAVE_STORAGE = 'sagrado-creperia:carrinho';

/** @type {Array<{chave: string, itemId: string, nome: string, precoUnitario: number, quantidade: number, observacao: string}>} */
let linhas = [];

/** @type {Set<() => void>} */
const assinantes = new Set();

function notificar() {
  salvar();
  for (const ouvinte of assinantes) ouvinte();
}

function chaveLinha(itemId, observacao) {
  return `${itemId}::${observacao.trim().toLowerCase()}`;
}

function salvar() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(linhas));
  } catch {
    // Armazenamento indisponível (modo privado, cota excedida etc.) — segue só em memória.
  }
}

/**
 * Carrega o carrinho salvo, revalidando cada linha contra o cardápio atual.
 * Deve ser chamado uma vez, na inicialização da aplicação.
 */
export function carregar() {
  let bruto;
  try {
    bruto = localStorage.getItem(CHAVE_STORAGE);
  } catch {
    bruto = null;
  }
  if (!bruto) return;

  let salvo;
  try {
    salvo = JSON.parse(bruto);
  } catch {
    return;
  }
  if (!Array.isArray(salvo)) return;

  linhas = salvo
    .filter((linha) => linha && typeof linha.itemId === 'string' && ITENS_POR_ID.has(linha.itemId))
    .map((linha) => {
      const itemAtual = ITENS_POR_ID.get(linha.itemId);
      const quantidade = Number.isInteger(linha.quantidade) && linha.quantidade > 0 ? linha.quantidade : 1;
      const observacao = typeof linha.observacao === 'string' ? linha.observacao : '';
      return {
        chave: chaveLinha(linha.itemId, observacao),
        itemId: linha.itemId,
        nome: itemAtual.nome,
        precoUnitario: itemAtual.preco, // sempre o preço atual, nunca o salvo
        quantidade,
        observacao,
      };
    });
}

/**
 * Inscreve um ouvinte para mudanças no carrinho. Retorna uma função de cancelamento.
 * @param {() => void} ouvinte
 * @returns {() => void}
 */
export function assinar(ouvinte) {
  assinantes.add(ouvinte);
  return () => assinantes.delete(ouvinte);
}

/**
 * Adiciona um item ao carrinho (ou soma a quantidade se a mesma combinação
 * item+observação já existir).
 * @param {string} itemId
 * @param {number} quantidade
 * @param {string} [observacao]
 */
export function adicionar(itemId, quantidade = 1, observacao = '') {
  const item = ITENS_POR_ID.get(itemId);
  if (!item || quantidade < 1) return;

  const chave = chaveLinha(itemId, observacao);
  const existente = linhas.find((linha) => linha.chave === chave);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    linhas.push({
      chave,
      itemId,
      nome: item.nome,
      precoUnitario: item.preco,
      quantidade,
      observacao: observacao.trim(),
    });
  }
  notificar();
}

/**
 * Altera a quantidade de uma linha. Quantidade <= 0 remove a linha.
 * @param {string} chave
 * @param {number} quantidade
 */
export function alterarQuantidade(chave, quantidade) {
  if (quantidade <= 0) {
    removerLinha(chave);
    return;
  }
  const linha = linhas.find((l) => l.chave === chave);
  if (linha) {
    linha.quantidade = quantidade;
    notificar();
  }
}

/**
 * Atualiza a observação de uma linha existente.
 * @param {string} chave
 * @param {string} observacao
 */
export function definirObservacao(chave, observacao) {
  const linha = linhas.find((l) => l.chave === chave);
  if (linha) {
    linha.observacao = observacao.trim();
    notificar();
  }
}

/**
 * Remove uma linha do carrinho.
 * @param {string} chave
 */
export function removerLinha(chave) {
  const tamanhoAnterior = linhas.length;
  linhas = linhas.filter((linha) => linha.chave !== chave);
  if (linhas.length !== tamanhoAnterior) notificar();
}

/** Esvazia o carrinho. */
export function limpar() {
  if (linhas.length === 0) return;
  linhas = [];
  notificar();
}

/** @returns {Array<object>} cópia rasa das linhas do carrinho */
export function obterItens() {
  return linhas.map((linha) => ({ ...linha }));
}

/** @returns {number} quantidade total de unidades no carrinho */
export function obterQuantidadeTotal() {
  return linhas.reduce((total, linha) => total + linha.quantidade, 0);
}

/** @returns {number} subtotal em centavos */
export function obterSubtotal() {
  return linhas.reduce((total, linha) => total + linha.precoUnitario * linha.quantidade, 0);
}
