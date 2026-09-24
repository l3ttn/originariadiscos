// Lógica da home: header/footer dinâmicos, hero de destaques, Novidades e Coleções.
import { INSTAGRAM } from './config.js';
import { linkProcuraGenerica } from './whatsapp.js';
import { destaques, novidades, secoes } from './catalogo.js';
import { criarCard } from './card.js';

function ligarCabecalhoRodape() {
  const linkProcura = linkProcuraGenerica();
  for (const id of ['whatsapp-header', 'whatsapp-footer', 'whatsapp-faixa']) {
    const elLink = document.getElementById(id);
    if (elLink) elLink.href = linkProcura;
  }
  const instagram = document.getElementById('instagram-footer');
  if (instagram) {
    instagram.href = `https://instagram.com/${INSTAGRAM}`;
    instagram.textContent = `Instagram @${INSTAGRAM}`;
  }
}

function renderEstadoVazio(container, mensagem) {
  container.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'estado-vazio';
  const p = document.createElement('p');
  p.textContent = mensagem;
  div.appendChild(p);
  container.appendChild(div);
}

async function renderHero() {
  const container = document.getElementById('hero-destaques');
  if (!container) return;
  const itens = await destaques(3);
  if (itens.length === 0) {
    renderEstadoVazio(container, 'Catálogo em atualização — volte em breve.');
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid-cards';
  for (const disco of itens) grid.appendChild(criarCard(disco));
  container.innerHTML = '';
  container.appendChild(grid);
}

async function renderNovidades() {
  const container = document.getElementById('novidades-grid');
  if (!container) return;
  const itens = await novidades(12);
  if (itens.length === 0) {
    renderEstadoVazio(container, 'Nenhuma novidade por aqui ainda.');
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid-cards';
  for (const disco of itens) grid.appendChild(criarCard(disco));
  container.innerHTML = '';
  container.appendChild(grid);
}

async function renderColecoes() {
  const container = document.getElementById('colecoes-grid');
  if (!container) return;
  const itens = await secoes();
  if (itens.length === 0) {
    renderEstadoVazio(container, 'As coleções aparecem assim que houver discos cadastrados.');
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid-colecoes';
  for (const s of itens) {
    const a = document.createElement('a');
    a.className = 'colecao';
    a.href = `catalogo.html?secao=${encodeURIComponent(s.nome)}`;

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = '';
    img.src = s.capa || 'img/capa-placeholder.svg';
    img.addEventListener('error', () => {
      img.src = 'img/capa-placeholder.svg';
    }, { once: true });
    a.appendChild(img);

    const rotulo = document.createElement('div');
    rotulo.className = 'colecao__rotulo';
    const nome = document.createElement('span');
    nome.className = 'colecao__nome';
    nome.textContent = s.nome;
    const contagem = document.createElement('span');
    contagem.className = 'colecao__contagem';
    contagem.textContent = `${s.quantidade} ${s.quantidade === 1 ? 'disco' : 'discos'}`;
    rotulo.appendChild(nome);
    rotulo.appendChild(contagem);
    a.appendChild(rotulo);

    grid.appendChild(a);
  }
  container.innerHTML = '';
  container.appendChild(grid);
}

ligarCabecalhoRodape();
renderHero();
renderNovidades();
renderColecoes();
