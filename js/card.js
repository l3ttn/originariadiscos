// Card de disco — usado no hero, em Novidades e em catalogo.html.
// Constrói DOM diretamente (sem innerHTML) para não precisar escapar texto.
import { carregar, salvar, adicionar } from './carrinho.js';

const ROTULOS_STATUS = {
  disponivel: 'Disponível',
  encomenda: 'Sob encomenda',
  esgotado: 'Esgotado',
};

let toastTimer = null;

function mostrarToast(texto) {
  let toast = document.getElementById('toast-carrinho');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-carrinho';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = texto;
  toast.classList.add('toast--visivel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visivel');
  }, 2000);
}

/** Adiciona o disco `id` ao carrinho, persiste, avisa por toast e atualiza o(s) contador(es) do header. */
export function adicionarAoCarrinho(id) {
  salvar(adicionar(carregar(), id));
  mostrarToast('Adicionado ao carrinho');
}

function el(tag, className, texto) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto != null) node.textContent = texto;
  return node;
}

/** Cria o elemento <article class="card"> para um disco. */
export function criarCard(disco) {
  const article = el('article', 'card');

  const linkCapa = document.createElement('a');
  linkCapa.className = 'card__capa-link';
  linkCapa.href = `disco.html?id=${disco.id}`;

  const capaWrap = el('div', 'card__capa-wrap');
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = `Capa de ${disco.artista} – ${disco.titulo}`;
  img.src = disco.capa || 'img/capa-placeholder.svg';
  img.addEventListener('error', () => {
    img.src = 'img/capa-placeholder.svg';
  }, { once: true });
  capaWrap.appendChild(img);

  const badges = el('div', 'card__badges');
  const statusBadge = el('span', `badge badge--${disco.status}`, ROTULOS_STATUS[disco.status] || disco.status);
  badges.appendChild(statusBadge);
  if (disco.novo) badges.appendChild(el('span', 'badge badge--novo', 'Novo'));
  capaWrap.appendChild(badges);

  linkCapa.appendChild(capaWrap);
  article.appendChild(linkCapa);

  const corpo = el('div', 'card__corpo');
  corpo.appendChild(el('p', 'card__artista', disco.artista));

  const linkTitulo = document.createElement('a');
  linkTitulo.className = 'card__titulo';
  linkTitulo.href = `disco.html?id=${disco.id}`;
  linkTitulo.textContent = `${disco.titulo} – ${disco.formatoLabel}`;
  corpo.appendChild(linkTitulo);

  corpo.appendChild(el('p', 'card__preco', disco.preco != null ? `R$ ${disco.preco}` : 'Sob consulta'));

  const botaoAdd = document.createElement('button');
  botaoAdd.type = 'button';
  botaoAdd.className = 'card__add';
  botaoAdd.dataset.id = String(disco.id);
  botaoAdd.textContent = 'Adicionar ao carrinho';
  botaoAdd.addEventListener('click', () => adicionarAoCarrinho(disco.id));
  corpo.appendChild(botaoAdd);

  article.appendChild(corpo);

  return article;
}
