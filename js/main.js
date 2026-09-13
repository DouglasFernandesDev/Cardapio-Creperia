/**
 * Ponto de entrada da aplicação: liga dados, estado e DOM.
 * Módulos de `modules/` não tocam no DOM diretamente (exceto ui.js/menu.js,
 * que recebem os elementos como parâmetro) — quem orquestra é este arquivo.
 */

import { LOJA, HORARIOS } from './data/config.js';
import {
  carregar,
  assinar,
  obterItens,
  obterQuantidadeTotal,
  obterSubtotal,
  alterarQuantidade,
  removerLinha,
} from './modules/carrinho.js';
import { renderizarCardapio, ativarBusca } from './modules/menu.js';
import { inicializarCheckout, atualizarTotalCheckout } from './modules/checkout.js';
import { ligarDialog } from './modules/ui.js';
import { estaAberto, proximaAbertura } from './modules/horario.js';
import { formatarBRL } from './modules/formato.js';
import { montarUrlWhatsapp } from './modules/whatsapp.js';

const elementos = {
  navCategorias: document.getElementById('lista-categorias'),
  listaCardapio: document.getElementById('lista-cardapio'),
  campoBusca: document.getElementById('campo-busca'),
  statusLoja: document.getElementById('status-loja'),

  dialogCarrinho: document.getElementById('dialog-carrinho'),
  botaoAbrirCarrinho: document.getElementById('botao-abrir-carrinho'),
  botaoFecharCarrinho: document.getElementById('botao-fechar-carrinho'),
  contadorCarrinho: document.getElementById('contador-carrinho'),
  listaItensCarrinho: document.getElementById('lista-itens-carrinho'),
  carrinhoVazio: document.getElementById('carrinho-vazio'),
  carrinhoSubtotal: document.getElementById('carrinho-subtotal'),
  botaoFinalizar: document.getElementById('botao-finalizar'),

  dialogCheckout: document.getElementById('dialog-checkout'),
  botaoFecharCheckout: document.getElementById('botao-fechar-checkout'),
  formularioCheckout: document.getElementById('formulario-checkout'),
  selectBairro: document.getElementById('select-bairro'),
  botaoLocalizacao: document.getElementById('botao-localizacao'),
  resultadoFrete: document.getElementById('resultado-frete'),
  selectPagamento: document.getElementById('select-pagamento'),
  campoTrocoContainer: document.getElementById('campo-troco-container'),
  campoTroco: document.getElementById('campo-troco'),
  resumoTotal: document.getElementById('checkout-resumo-total'),

  listaHorariosRodape: document.getElementById('lista-horarios-rodape'),
  anoRodape: document.getElementById('ano-rodape'),
};

const MENSAGEM_CONTATO = 'Olá! Vim pelo cardápio digital da Sagrado Creperia e queria tirar uma dúvida.';
for (const link of document.querySelectorAll('[data-link-whatsapp]')) {
  link.href = montarUrlWhatsapp(MENSAGEM_CONTATO);
}

// --- Cardápio ---
carregar();
renderizarCardapio(elementos.navCategorias, elementos.listaCardapio);
ativarBusca(elementos.campoBusca, elementos.listaCardapio);

// --- Carrinho e checkout (dialogs nativos: focus trap e Esc já vêm do navegador) ---
ligarDialog(elementos.dialogCarrinho, elementos.botaoAbrirCarrinho, elementos.botaoFecharCarrinho);
ligarDialog(elementos.dialogCheckout, null, elementos.botaoFecharCheckout);

elementos.botaoFinalizar.addEventListener('click', () => {
  elementos.dialogCarrinho.close();
  elementos.dialogCheckout.showModal();
});

inicializarCheckout({
  formulario: elementos.formularioCheckout,
  selectBairro: elementos.selectBairro,
  botaoLocalizacao: elementos.botaoLocalizacao,
  resultadoFrete: elementos.resultadoFrete,
  selectPagamento: elementos.selectPagamento,
  campoTrocoContainer: elementos.campoTrocoContainer,
  campoTroco: elementos.campoTroco,
  resumoTotal: elementos.resumoTotal,
});

function criarLinhaCarrinho(item) {
  const li = document.createElement('li');
  li.className = 'linha-carrinho';

  const info = document.createElement('div');
  info.className = 'linha-carrinho__info';

  const nome = document.createElement('p');
  nome.className = 'linha-carrinho__nome';
  nome.textContent = item.nome;
  info.appendChild(nome);

  if (item.observacao) {
    const obs = document.createElement('p');
    obs.className = 'linha-carrinho__obs';
    obs.textContent = `Obs: ${item.observacao}`;
    info.appendChild(obs);
  }

  const preco = document.createElement('p');
  preco.className = 'linha-carrinho__preco';
  preco.textContent = formatarBRL(item.precoUnitario * item.quantidade);
  info.appendChild(preco);
  li.appendChild(info);

  const controles = document.createElement('div');
  controles.className = 'stepper';

  const botaoMenos = document.createElement('button');
  botaoMenos.type = 'button';
  botaoMenos.className = 'stepper__botao';
  botaoMenos.textContent = '−';
  botaoMenos.setAttribute('aria-label', `Diminuir quantidade de ${item.nome}`);
  botaoMenos.addEventListener('click', () => alterarQuantidade(item.chave, item.quantidade - 1));

  const quantidade = document.createElement('span');
  quantidade.className = 'stepper__quantidade';
  quantidade.textContent = String(item.quantidade);

  const botaoMais = document.createElement('button');
  botaoMais.type = 'button';
  botaoMais.className = 'stepper__botao';
  botaoMais.textContent = '+';
  botaoMais.setAttribute('aria-label', `Aumentar quantidade de ${item.nome}`);
  botaoMais.addEventListener('click', () => alterarQuantidade(item.chave, item.quantidade + 1));

  controles.append(botaoMenos, quantidade, botaoMais);
  li.appendChild(controles);

  const botaoRemover = document.createElement('button');
  botaoRemover.type = 'button';
  botaoRemover.className = 'linha-carrinho__remover';
  botaoRemover.textContent = 'Remover';
  botaoRemover.setAttribute('aria-label', `Remover ${item.nome} do carrinho`);
  botaoRemover.addEventListener('click', () => removerLinha(item.chave));
  li.appendChild(botaoRemover);

  return li;
}

function renderizarCarrinho() {
  const itens = obterItens();
  const quantidadeTotal = obterQuantidadeTotal();

  elementos.contadorCarrinho.textContent = String(quantidadeTotal);
  elementos.contadorCarrinho.hidden = quantidadeTotal === 0;
  elementos.botaoFinalizar.disabled = itens.length === 0;
  elementos.carrinhoVazio.hidden = itens.length > 0;
  elementos.listaItensCarrinho.hidden = itens.length === 0;

  elementos.listaItensCarrinho.replaceChildren(...itens.map(criarLinhaCarrinho));
  elementos.carrinhoSubtotal.textContent = `Subtotal: ${formatarBRL(obterSubtotal())}`;
  atualizarTotalCheckout({ resumoTotal: elementos.resumoTotal });
}

assinar(renderizarCarrinho);
renderizarCarrinho();

// --- Status de funcionamento ---
function atualizarStatusLoja() {
  const aberto = estaAberto();
  elementos.statusLoja.textContent = aberto ? 'Aberto agora' : proximaAbertura() ?? 'Fechado no momento';
  elementos.statusLoja.classList.toggle('status--aberto', aberto);
  elementos.statusLoja.classList.toggle('status--fechado', !aberto);
}
atualizarStatusLoja();
setInterval(atualizarStatusLoja, 60_000);

// --- Horários no rodapé ---
const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
if (elementos.listaHorariosRodape) {
  const linhas = Object.entries(HORARIOS)
    .filter(([, turnos]) => turnos.length > 0)
    .map(([dia, turnos]) => {
      const li = document.createElement('li');
      const horariosTexto = turnos.map((turno) => `${turno.abre} às ${turno.fecha}`).join(', ');
      li.textContent = `${NOMES_DIAS[Number(dia)]}: ${horariosTexto}`;
      return li;
    });
  elementos.listaHorariosRodape.replaceChildren(...linhas);
}

if (elementos.anoRodape) {
  elementos.anoRodape.textContent = String(new Date().getFullYear());
}

document.title = `${LOJA.nome} — Cardápio Digital`;
