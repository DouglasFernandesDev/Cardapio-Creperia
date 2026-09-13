/**
 * Formulário de checkout: validação, resolução do frete (bairro ou GPS),
 * troco, e envio do pedido para o WhatsApp.
 */

import { BAIRROS, PAGAMENTOS, LOJA } from '../data/config.js';
import { obterItens, obterSubtotal, limpar } from './carrinho.js';
import { resolverFretePorBairro, obterFretePorLocalizacao, resolverFrete } from './frete.js';
import { formatarBRL, formatarKm } from './formato.js';
import { montarMensagemComLimite, montarUrlWhatsapp } from './whatsapp.js';
import { mostrarToast } from './ui.js';

/** Estado do frete resolvido no momento (bairro ou GPS), usado no envio. */
let freteAtual = { foraDeArea: true };

/**
 * @param {object} elementos referências aos elementos do formulário de checkout
 * @param {HTMLFormElement} elementos.formulario
 * @param {HTMLSelectElement} elementos.selectBairro
 * @param {HTMLButtonElement} elementos.botaoLocalizacao
 * @param {HTMLElement} elementos.resultadoFrete
 * @param {HTMLSelectElement} elementos.selectPagamento
 * @param {HTMLElement} elementos.campoTrocoContainer
 * @param {HTMLInputElement} elementos.campoTroco
 * @param {HTMLElement} elementos.resumoTotal
 */
export function inicializarCheckout(elementos) {
  preencherBairros(elementos.selectBairro);
  preencherPagamentos(elementos.selectPagamento);

  elementos.selectBairro.addEventListener('change', () => {
    if (!elementos.selectBairro.value) return;
    freteAtual = resolverFretePorBairro(elementos.selectBairro.value);
    exibirResultadoFrete(elementos);
  });

  elementos.botaoLocalizacao.addEventListener('click', async () => {
    elementos.botaoLocalizacao.disabled = true;
    elementos.botaoLocalizacao.textContent = 'Localizando...';
    try {
      const { km, bairroSugerido } = await obterFretePorLocalizacao();
      freteAtual = { ...resolverFrete(km) };
      if (bairroSugerido) {
        elementos.selectBairro.value = bairroSugerido;
        freteAtual.bairro = bairroSugerido;
      }
      exibirResultadoFrete(elementos);
      mostrarToast('Localização usada para estimar o frete.');
    } catch (erro) {
      mostrarToast(erro.message, { tipo: 'erro' });
    } finally {
      elementos.botaoLocalizacao.disabled = false;
      elementos.botaoLocalizacao.textContent = 'Usar minha localização';
    }
  });

  elementos.selectPagamento.addEventListener('change', () => {
    const ehDinheiro = elementos.selectPagamento.value === 'Dinheiro';
    elementos.campoTrocoContainer.hidden = !ehDinheiro;
    if (!ehDinheiro) elementos.campoTroco.value = '';
  });

  elementos.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    enviarPedido(elementos);
  });
}

function preencherBairros(selectBairro) {
  const opcaoPadrao = document.createElement('option');
  opcaoPadrao.value = '';
  opcaoPadrao.textContent = 'Selecione seu bairro';
  selectBairro.appendChild(opcaoPadrao);

  for (const bairro of BAIRROS) {
    const opcao = document.createElement('option');
    opcao.value = bairro.nome;
    opcao.textContent = bairro.nome;
    selectBairro.appendChild(opcao);
  }
}

function preencherPagamentos(selectPagamento) {
  const opcaoPadrao = document.createElement('option');
  opcaoPadrao.value = '';
  opcaoPadrao.textContent = 'Selecione a forma de pagamento';
  selectPagamento.appendChild(opcaoPadrao);

  for (const forma of PAGAMENTOS) {
    const opcao = document.createElement('option');
    opcao.value = forma;
    opcao.textContent = forma;
    selectPagamento.appendChild(opcao);
  }
}

function exibirResultadoFrete(elementos) {
  if (freteAtual.foraDeArea) {
    elementos.resultadoFrete.textContent =
      'Esse endereço parece estar fora da nossa área de entrega automática. Você ainda pode enviar o pedido e combinar o frete direto com a loja.';
    elementos.resultadoFrete.className = 'checkout__resultado-frete checkout__resultado-frete--aviso';
  } else {
    const distancia =
      freteAtual.km !== undefined
        ? ` (~${formatarKm(freteAtual.km)}, distância aproximada em linha reta)`
        : '';
    elementos.resultadoFrete.textContent = `Frete estimado: ${formatarBRL(freteAtual.valor)}${distancia}`;
    elementos.resultadoFrete.className = 'checkout__resultado-frete';
  }
  atualizarResumoTotal(elementos);
}

function atualizarResumoTotal(elementos) {
  const subtotal = obterSubtotal();
  const total = subtotal + (freteAtual.foraDeArea ? 0 : freteAtual.valor);
  elementos.resumoTotal.textContent = `Total: ${formatarBRL(total)}`;
}

/** Reexibe o resumo de total (chamado externamente quando o carrinho muda). */
export function atualizarTotalCheckout(elementos) {
  atualizarResumoTotal(elementos);
}

function enviarPedido(elementos) {
  const itens = obterItens();
  if (itens.length === 0) {
    mostrarToast('Seu carrinho está vazio.', { tipo: 'erro' });
    return;
  }

  const dados = new FormData(elementos.formulario);
  const nome = String(dados.get('nome') ?? '').trim();
  const telefone = String(dados.get('telefone') ?? '').trim();
  const rua = String(dados.get('rua') ?? '').trim();
  const complemento = String(dados.get('complemento') ?? '').trim();
  const pagamento = String(dados.get('pagamento') ?? '');
  const trocoParaTexto = String(dados.get('troco') ?? '').trim();
  const observacaoGeral = String(dados.get('observacaoGeral') ?? '').trim();
  const bairro = elementos.selectBairro.value;

  if (!elementos.formulario.reportValidity()) {
    return;
  }
  if (!bairro) {
    mostrarToast('Selecione o bairro de entrega.', { tipo: 'erro' });
    elementos.selectBairro.focus();
    return;
  }

  const subtotal = obterSubtotal();
  const totalSemTroco = subtotal + (freteAtual.foraDeArea ? 0 : freteAtual.valor);

  let trocoPara;
  if (pagamento === 'Dinheiro' && trocoParaTexto) {
    trocoPara = Number(trocoParaTexto.replace(',', '.'));
    if (Number.isNaN(trocoPara) || trocoPara * 100 < totalSemTroco) {
      mostrarToast('O valor para troco precisa ser maior ou igual ao total do pedido.', { tipo: 'erro' });
      elementos.campoTroco.focus();
      return;
    }
  }

  const pedido = {
    itens,
    subtotal,
    frete: { ...freteAtual, bairro },
    cliente: { nome, telefone, rua, complemento, bairro },
    pagamento,
    trocoPara,
    observacaoGeral,
  };

  const { mensagem, excedeuLimite } = montarMensagemComLimite(pedido);
  if (excedeuLimite) {
    mostrarToast('Pedido muito grande para uma única mensagem. Considere dividir em dois pedidos.', {
      tipo: 'erro',
    });
  }

  const url = montarUrlWhatsapp(mensagem);
  // Precisa ser síncrono dentro do clique — senão o bloqueador de pop-up
  // do iOS/Safari impede a abertura da aba do WhatsApp.
  window.open(url, '_blank', 'noopener');

  mostrarToast(`Pedido enviado! Se quiser, confirme o envio no WhatsApp com a ${LOJA.nome}.`);
  elementos.formulario.closest('dialog')?.close();
  ofertarLimpezaDoCarrinho();

  elementos.formulario.reset();
  elementos.campoTrocoContainer.hidden = true;
  freteAtual = { foraDeArea: true };
  elementos.resultadoFrete.textContent = '';
  atualizarResumoTotal(elementos);
}

function ofertarLimpezaDoCarrinho() {
  // O carrinho só é limpo se o cliente confirmar que o pedido foi enviado de
  // fato — evita perder o carrinho de quem voltou sem concluir o envio.
  const confirmarLimpeza = window.confirm('Pedido enviado para o WhatsApp! Deseja limpar o carrinho agora?');
  if (confirmarLimpeza) limpar();
}
