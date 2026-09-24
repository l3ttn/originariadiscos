// Lógica de disco.html?id=... — ficha completa, ou "Disco não encontrado".
import { NOME_LOJA, INSTAGRAM } from './config.js';
import { linkAviseMe, linkEncontrePraMim, linkProcuraGenerica } from './whatsapp.js';
import { porId } from './catalogo.js';
import { thumbUrl, embedUrl, dedupeVideos } from './youtube.js';

const ROTULOS_STATUS = {
  disponivel: 'Disponível',
  encomenda: 'Sob encomenda',
  esgotado: 'Esgotado',
};

function ligarCabecalhoRodape() {
  const linkProcura = linkProcuraGenerica();
  for (const id of ['whatsapp-header', 'whatsapp-footer']) {
    const elLink = document.getElementById(id);
    if (elLink) elLink.href = linkProcura;
  }
  const instagram = document.getElementById('instagram-footer');
  if (instagram) {
    instagram.href = `https://instagram.com/${INSTAGRAM}`;
    instagram.textContent = `Instagram @${INSTAGRAM}`;
  }
}

function el(tag, className, texto) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto != null) node.textContent = texto;
  return node;
}

function renderNaoEncontrado(container) {
  document.title = `Disco não encontrado | ${NOME_LOJA}`;
  container.innerHTML = '';
  const div = el('div', 'estado-vazio');
  div.appendChild(el('h1', null, 'Disco não encontrado'));
  div.appendChild(el('p', null, 'Esse disco não existe no catálogo ou foi removido.'));
  const a = document.createElement('a');
  a.className = 'btn btn--whatsapp';
  a.target = '_blank';
  a.rel = 'noopener';
  a.href = linkProcuraGenerica();
  a.textContent = 'Encontre pra mim';
  div.appendChild(a);
  container.appendChild(div);
}

function renderTags(disco) {
  const ul = el('ul', 'ficha__tags');
  const valores = [...(disco.generos || []), ...(disco.estilos || [])];
  for (const valor of valores) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `catalogo.html?genero=${encodeURIComponent(valor)}`;
    a.textContent = valor;
    li.appendChild(a);
    ul.appendChild(li);
  }
  return ul;
}

function renderTracklist(disco) {
  const ul = el('ul', 'tracklist');
  for (const faixa of disco.faixas || []) {
    const li = document.createElement('li');
    li.appendChild(el('span', 'tracklist__pos', faixa.pos));
    li.appendChild(el('span', 'tracklist__titulo', faixa.titulo));
    li.appendChild(el('span', 'tracklist__dur', faixa.dur || ''));
    ul.appendChild(li);
  }
  return ul;
}

function renderVideos(disco) {
  const videos = dedupeVideos(disco.videos);
  if (videos.length === 0) return null;

  const wrap = el('div', null);
  wrap.appendChild(el('h2', null, 'Ouvir'));
  const grid = el('div', 'grid-videos');

  for (const video of videos) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'video';

    const thumbWrap = el('div', 'video__thumb-wrap');
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = `Assistir: ${video.titulo}`;
    img.src = thumbUrl(video.ytId);
    thumbWrap.appendChild(img);
    thumbWrap.appendChild(el('span', 'video__play', '▶'));
    botao.appendChild(thumbWrap);
    botao.appendChild(el('span', 'video__titulo', video.titulo));

    botao.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.className = 'video__frame';
      iframe.src = embedUrl(video.ytId);
      iframe.title = video.titulo;
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      botao.replaceWith(iframe);
    });

    grid.appendChild(botao);
  }

  wrap.appendChild(grid);
  return wrap;
}

function renderFicha(container, disco) {
  document.title = `${disco.artista} – ${disco.titulo} | ${NOME_LOJA}`;
  container.innerHTML = '';

  const ficha = el('div', 'ficha');

  const capa = el('div', 'ficha__capa');
  const img = document.createElement('img');
  img.alt = `Capa de ${disco.artista} – ${disco.titulo}`;
  img.src = disco.capa || 'img/capa-placeholder.svg';
  img.addEventListener('error', () => {
    img.src = 'img/capa-placeholder.svg';
  }, { once: true });
  capa.appendChild(img);
  ficha.appendChild(capa);

  const info = el('div', null);

  const cabecalho = el('div', 'ficha__cabecalho');
  cabecalho.appendChild(el('span', `badge badge--${disco.status}`, ROTULOS_STATUS[disco.status] || disco.status));
  if (disco.novo) cabecalho.appendChild(el('span', 'badge badge--novo', 'Novo'));
  info.appendChild(cabecalho);

  info.appendChild(el('p', 'ficha__artista', disco.artista));
  info.appendChild(el('h1', null, disco.titulo));

  const selo = `${disco.selo || ''}${disco.catno ? ` ${disco.catno}` : ''}`.trim();
  if (selo) info.appendChild(el('p', 'ficha__meta', selo));

  const detalhes = [disco.formatoLabel, disco.cor, disco.edicao].filter(Boolean).join(' · ');
  if (detalhes) info.appendChild(el('p', 'ficha__meta', detalhes));

  const paisAno = [disco.pais, disco.ano].filter(Boolean).join(' · ');
  if (paisAno) info.appendChild(el('p', 'ficha__meta', paisAno));

  info.appendChild(renderTags(disco));

  info.appendChild(el('p', 'ficha__preco', disco.preco != null ? `R$ ${disco.preco}` : 'Sob consulta'));

  const ctas = el('div', 'ficha__ctas');
  const ctaAviseMe = document.createElement('a');
  ctaAviseMe.className = 'btn btn--whatsapp';
  ctaAviseMe.target = '_blank';
  ctaAviseMe.rel = 'noopener';
  ctaAviseMe.href = linkAviseMe(disco);
  ctaAviseMe.textContent = 'Avise-me quando chegar';
  ctas.appendChild(ctaAviseMe);

  const ctaEncontre = document.createElement('a');
  ctaEncontre.className = 'btn btn--primary';
  ctaEncontre.target = '_blank';
  ctaEncontre.rel = 'noopener';
  ctaEncontre.href = linkEncontrePraMim(disco);
  ctaEncontre.textContent = 'Encontre pra mim';
  ctas.appendChild(ctaEncontre);

  info.appendChild(ctas);

  if (disco.comentario) {
    info.appendChild(el('p', 'ficha__comentario', disco.comentario));
  }

  const linkDiscogs = document.createElement('a');
  linkDiscogs.className = 'ficha__discogs';
  linkDiscogs.href = disco.discogsUrl;
  linkDiscogs.target = '_blank';
  linkDiscogs.rel = 'noopener';
  linkDiscogs.textContent = 'Ver no Discogs';
  info.appendChild(linkDiscogs);

  ficha.appendChild(info);
  container.appendChild(ficha);

  if ((disco.faixas || []).length > 0) {
    container.appendChild(el('h2', null, 'Faixas'));
    container.appendChild(renderTracklist(disco));
  }

  const videos = renderVideos(disco);
  if (videos) container.appendChild(videos);
}

async function main() {
  ligarCabecalhoRodape();
  const container = document.getElementById('disco-root');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const disco = id ? await porId(id) : null;

  if (!disco) {
    renderNaoEncontrado(container);
    return;
  }
  renderFicha(container, disco);
}

main();
