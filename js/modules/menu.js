/**
 * Renderiza a navegação de categorias e os cards de produto, e liga a busca.
 */

import { CATEGORIAS } from '../data/cardapio.js';
import { formatarBRL, slugify } from './formato.js';
import { adicionar } from './carrinho.js';
import { mostrarToast } from './ui.js';

/**
 * @param {HTMLElement} navCategorias
 * @param {HTMLElement} listaCardapio
 */
export function renderizarCardapio(navCategorias, listaCardapio) {
  const fragmentoNav = document.createDocumentFragment();
  const fragmentoLista = document.createDocumentFragment();

  for (const categoria of CATEGORIAS) {
    const idSecao = `categoria-${slugify(categoria.id)}`;

    const linkNav = document.createElement('a');
    linkNav.href = `#${idSecao}`;
    linkNav.className = 'categorias__link';
    linkNav.textContent = categoria.nome;
    fragmentoNav.appendChild(linkNav);

    const secao = document.createElement('section');
    secao.id = idSecao;
    secao.className = 'secao-categoria';
    secao.setAttribute('aria-labelledby', `${idSecao}-titulo`);

    const titulo = document.createElement('h2');
    titulo.id = `${idSecao}-titulo`;
    titulo.className = 'secao-categoria__titulo';
    titulo.textContent = categoria.nome;
    secao.appendChild(titulo);

    const grade = document.createElement('div');
    grade.className = 'grade-produtos';
    for (const item of categoria.itens) {
      grade.appendChild(criarCardProduto(item));
    }
    secao.appendChild(grade);

    fragmentoLista.appendChild(secao);
  }

  navCategorias.appendChild(fragmentoNav);
  listaCardapio.appendChild(fragmentoLista);
}

function criarCardProduto(item) {
  const artigo = document.createElement('article');
  artigo.className = 'card-produto';
  artigo.dataset.nomeBusca = slugify(`${item.nome} ${item.descricao}`);

  const cabecalho = document.createElement('div');
  cabecalho.className = 'card-produto__cabecalho';

  const nome = document.createElement('h3');
  nome.className = 'card-produto__nome';
  nome.textContent = item.nome;
  cabecalho.appendChild(nome);

  if (item.destaque) {
    const selo = document.createElement('span');
    selo.className = 'card-produto__selo';
    selo.textContent = 'Especial da casa';
    cabecalho.appendChild(selo);
  }
  artigo.appendChild(cabecalho);

  if (item.descricao) {
    const descricao = document.createElement('p');
    descricao.className = 'card-produto__descricao';
    descricao.textContent = item.descricao;
    artigo.appendChild(descricao);
  }

  const preco = document.createElement('p');
  preco.className = 'card-produto__preco';
  preco.textContent = formatarBRL(item.preco);
  artigo.appendChild(preco);

  const idObservacao = `obs-${item.id}`;
  const campoObservacao = document.createElement('input');
  campoObservacao.type = 'text';
  campoObservacao.id = idObservacao;
  campoObservacao.className = 'card-produto__observacao';
  campoObservacao.placeholder = 'Observação (opcional): sem cebola, bem passado...';
  campoObservacao.maxLength = 140;

  const rotuloObservacao = document.createElement('label');
  rotuloObservacao.htmlFor = idObservacao;
  rotuloObservacao.className = 'sr-only';
  rotuloObservacao.textContent = `Observação para ${item.nome}`;

  artigo.append(rotuloObservacao, campoObservacao);

  const botaoAdicionar = document.createElement('button');
  botaoAdicionar.type = 'button';
  botaoAdicionar.className = 'botao botao--dourado card-produto__adicionar';
  botaoAdicionar.textContent = 'Adicionar ao carrinho';
  botaoAdicionar.addEventListener('click', () => {
    adicionar(item.id, 1, campoObservacao.value);
    campoObservacao.value = '';
    mostrarToast(`${item.nome} adicionado ao carrinho.`);
  });
  artigo.appendChild(botaoAdicionar);

  return artigo;
}

/**
 * Liga um campo de busca à lista de cards já renderizada, filtrando por
 * nome e descrição (comparação normalizada, sem acento).
 * @param {HTMLInputElement} campoBusca
 * @param {HTMLElement} listaCardapio
 */
export function ativarBusca(campoBusca, listaCardapio) {
  campoBusca.addEventListener('input', () => {
    const termo = slugify(campoBusca.value);
    const cards = listaCardapio.querySelectorAll('.card-produto');
    const secoes = listaCardapio.querySelectorAll('.secao-categoria');

    for (const card of cards) {
      const corresponde = termo === '' || card.dataset.nomeBusca.includes(termo);
      card.hidden = !corresponde;
    }
    for (const secao of secoes) {
      const algumVisivel = Array.from(secao.querySelectorAll('.card-produto')).some((card) => !card.hidden);
      secao.hidden = !algumVisivel;
    }
  });
}
