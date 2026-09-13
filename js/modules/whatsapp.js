/**
 * Monta a mensagem do pedido e a URL do WhatsApp (wa.me).
 */

import { LOJA } from '../data/config.js';
import { formatarBRL, formatarKm, gerarCodigoPedido } from './formato.js';

const LIMITE_CARACTERES_MENSAGEM = 1800;

/**
 * @param {object} pedido
 * @param {Array<{nome: string, quantidade: number, precoUnitario: number, observacao: string}>} pedido.itens
 * @param {number} pedido.subtotal
 * @param {{ foraDeArea: boolean, valor?: number, km?: number, bairro?: string }} pedido.frete
 * @param {object} pedido.cliente
 * @param {string} pedido.cliente.nome
 * @param {string} pedido.cliente.telefone
 * @param {string} pedido.cliente.rua
 * @param {string} [pedido.cliente.complemento]
 * @param {string} pedido.pagamento
 * @param {number} [pedido.trocoPara]
 * @param {string} [pedido.observacaoGeral]
 * @param {boolean} [compacto] gera uma versão sem alinhamento decorativo, para mensagens longas
 * @returns {string}
 */
export function montarMensagem(pedido, compacto = false) {
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR');
  const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const linhasItens = pedido.itens.map((item) => {
    const linha = compacto
      ? `${item.quantidade}x ${item.nome} - ${formatarBRL(item.precoUnitario * item.quantidade)}`
      : `${item.quantidade}x ${item.nome} .... ${formatarBRL(item.precoUnitario * item.quantidade)}`;
    return item.observacao ? `${linha}\n   obs: ${item.observacao}` : linha;
  });

  const total = pedido.subtotal + (pedido.frete.foraDeArea ? 0 : pedido.frete.valor);

  const partes = [
    `*${LOJA.nome.toUpperCase()}*`,
    `Pedido #${gerarCodigoPedido()} — ${dataFormatada} às ${horaFormatada}`,
    '',
    '*ITENS*',
    ...linhasItens,
    '',
    `Subtotal: ${formatarBRL(pedido.subtotal)}`,
  ];

  if (pedido.frete.foraDeArea) {
    partes.push('Entrega: fora da área calculada automaticamente — combinar com a loja');
  } else {
    const localizacao = pedido.frete.bairro
      ? `${pedido.frete.bairro}, ~${formatarKm(pedido.frete.km)}`
      : `~${formatarKm(pedido.frete.km)}`;
    partes.push(`Entrega (${localizacao}): ${formatarBRL(pedido.frete.valor)}`);
  }

  partes.push(`*TOTAL: ${formatarBRL(pedido.frete.foraDeArea ? pedido.subtotal : total)}*`, '');

  partes.push(
    '*ENTREGA*',
    `Nome: ${pedido.cliente.nome}`,
    `Tel: ${pedido.cliente.telefone}`,
    `Endereço: ${pedido.cliente.rua}${pedido.cliente.bairro ? `, ${pedido.cliente.bairro}` : ''}`
  );
  if (pedido.cliente.complemento) {
    partes.push(`Referência: ${pedido.cliente.complemento}`);
  }
  partes.push('');

  const linhaPagamento =
    pedido.pagamento === 'Dinheiro' && pedido.trocoPara
      ? `Dinheiro — troco para ${formatarBRL(pedido.trocoPara * 100)} (levar ${formatarBRL(pedido.trocoPara * 100 - total)})`
      : pedido.pagamento;
  partes.push('*PAGAMENTO*', linhaPagamento);

  if (pedido.observacaoGeral) {
    partes.push('', `*OBSERVAÇÕES*: ${pedido.observacaoGeral}`);
  }

  return partes.join('\n');
}

/**
 * Monta a mensagem final, compactando automaticamente se ela ultrapassar
 * o limite prático de caracteres de uma URL de WhatsApp.
 * @param {object} pedido ver `montarMensagem`
 * @returns {{ mensagem: string, excedeuLimite: boolean }}
 */
export function montarMensagemComLimite(pedido) {
  const mensagemCompleta = montarMensagem(pedido, false);
  if (mensagemCompleta.length <= LIMITE_CARACTERES_MENSAGEM) {
    return { mensagem: mensagemCompleta, excedeuLimite: false };
  }
  const mensagemCompacta = montarMensagem(pedido, true);
  return {
    mensagem: mensagemCompacta,
    excedeuLimite: mensagemCompacta.length > LIMITE_CARACTERES_MENSAGEM,
  };
}

/**
 * @param {string} mensagem
 * @returns {string} URL pronta para abrir o WhatsApp com a mensagem preenchida
 */
export function montarUrlWhatsapp(mensagem) {
  return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
