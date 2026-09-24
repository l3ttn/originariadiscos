// Card de disco — usado no hero, em Novidades e em catalogo.html.
// Constrói DOM diretamente (sem innerHTML) para não precisar escapar texto.

const ROTULOS_STATUS = {
  disponivel: 'Disponível',
  encomenda: 'Sob encomenda',
  esgotado: 'Esgotado',
};

function el(tag, className, texto) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto != null) node.textContent = texto;
  return node;
}

/** Cria o elemento <a class="card"> para um disco. */
export function criarCard(disco) {
  const a = el('a', 'card');
  a.href = `disco.html?id=${disco.id}`;

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

  a.appendChild(capaWrap);

  const corpo = el('div', 'card__corpo');
  corpo.appendChild(el('p', 'card__artista', disco.artista));
  corpo.appendChild(el('p', 'card__titulo', `${disco.titulo} – ${disco.formatoLabel}`));
  corpo.appendChild(el('p', 'card__preco', disco.preco != null ? `R$ ${disco.preco}` : 'Sob consulta'));
  a.appendChild(corpo);

  return a;
}
