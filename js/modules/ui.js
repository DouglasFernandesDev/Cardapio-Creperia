/**
 * Utilitários de interface reutilizáveis.
 *
 * O carrinho e o checkout usam o elemento nativo <dialog> (showModal/close):
 * o navegador já prende o foco dentro dele, fecha com Esc e devolve o foco
 * ao elemento que abriu — não é preciso reimplementar isso manualmente.
 */

/**
 * Liga um <dialog> a um botão que o abre e a um botão que o fecha, e fecha
 * automaticamente ao clicar no ::backdrop.
 *
 * Um clique no ::backdrop é reportado com `evento.target === dialog` (o próprio
 * elemento <dialog>, já que o backdrop não tem nó próprio) — esse é o teste
 * correto. Usar `closest()` a partir do alvo do clique é frágil aqui: se o
 * clique disparar uma re-renderização síncrona que desmonta o elemento clicado
 * (como o stepper de quantidade do carrinho, que troca a lista via
 * `replaceChildren`), o nó já está desanexado da árvore quando o evento termina
 * de borbulhar até o dialog, e `closest()` falha — fechando o painel por engano.
 * @param {HTMLDialogElement} dialog
 * @param {HTMLElement | null} botaoAbrir
 * @param {HTMLElement | null} botaoFechar
 */
export function ligarDialog(dialog, botaoAbrir, botaoFechar) {
  botaoAbrir?.addEventListener('click', () => dialog.showModal());
  botaoFechar?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (evento) => {
    if (evento.target === dialog) dialog.close();
  });
}

let contadorToast = 0;

/**
 * Exibe uma mensagem temporária e acessível (aria-live) no canto da tela.
 * @param {string} mensagem
 * @param {{ tipo?: 'info' | 'erro', duracaoMs?: number }} [opcoes]
 */
export function mostrarToast(mensagem, { tipo = 'info', duracaoMs = 4000 } = {}) {
  let regiao = document.getElementById('regiao-toast');
  if (!regiao) {
    regiao = document.createElement('div');
    regiao.id = 'regiao-toast';
    regiao.className = 'regiao-toast';
    regiao.setAttribute('aria-live', 'polite');
    regiao.setAttribute('role', 'status');
    document.body.appendChild(regiao);
  }

  const toast = document.createElement('p');
  toast.className = `toast toast--${tipo}`;
  toast.id = `toast-${(contadorToast += 1)}`;
  toast.textContent = mensagem;
  regiao.appendChild(toast);

  setTimeout(() => toast.remove(), duracaoMs);
}
