/**
 * Funções puras de formatação, reutilizadas em toda a aplicação.
 */

const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor em centavos (inteiro) como moeda brasileira.
 * @param {number} centavos
 * @returns {string} ex.: "R$ 24,90"
 */
export function formatarBRL(centavos) {
  return FORMATADOR_BRL.format(centavos / 100);
}

/**
 * Formata uma distância em km com uma casa decimal.
 * @param {number} km
 * @returns {string} ex.: "2,5 km"
 */
export function formatarKm(km) {
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/**
 * Converte um texto em um slug simples (usado para ids previsíveis).
 * @param {string} texto
 * @returns {string}
 */
export function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Gera um código curto de pedido, só para referência visual (não é um id único garantido).
 * @returns {string} ex.: "A1B2"
 */
export function gerarCodigoPedido() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}
