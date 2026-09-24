// Lógica de carrinho.html: lista, quantidade, observação, total e o link
// "Pedir pelo WhatsApp" com a mensagem do pedido inteiro.
import { INSTAGRAM } from './config.js';
import { linkProcuraGenerica, linkPedido } from './whatsapp.js';
import { todos } from './catalogo.js';
import {
  carregar,
  salvar,
  remover,
  definirQtd,
  total,
  formatarTotal,
  atualizarContadorHeader,
} from './carrinho.js';

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
  atualizarContadorHeader();
  document.addEventListener('carrinho:mudou', atualizarContadorHeader);
}

function el(tag, className, texto) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (texto != null) node.textContent = texto;
  return node;
}

function criarBotao(className, texto, onClick, ariaLabel) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = className;
  if (ariaLabel) botao.setAttribute('aria-label', ariaLabel);
  botao.textContent = texto;
  botao.addEventListener('click', onClick);
  return botao;
}

function renderVazio(container) {
  container.innerHTML = '';
  const div = el('div', 'estado-vazio');
  div.appendChild(el('p', null, 'Seu carrinho está vazio'));
  const a = document.createElement('a');
  a.className = 'btn btn--primary';
  a.href = 'catalogo.html';
  a.textContent = 'Ver catálogo';
  div.appendChild(a);
  container.appendChild(div);
}

function renderItem(item, disco, { onQtd, onRemover }) {
  const row = el('div', 'carrinho-item');
  row.dataset.id = String(disco.id);

  const img = document.createElement('img');
  img.className = 'carrinho-item__capa';
  img.loading = 'lazy';
  img.alt = `Capa de ${disco.artista} – ${disco.titulo}`;
  img.src = disco.capa || 'img/capa-placeholder.svg';
  img.addEventListener('error', () => {
    img.src = 'img/capa-placeholder.svg';
  }, { once: true });
  row.appendChild(img);

  const info = el('div', 'carrinho-item__info');
  info.appendChild(el('p', 'carrinho-item__artista', disco.artista));
  info.appendChild(el('p', 'carrinho-item__titulo', `${disco.titulo} – ${disco.formatoLabel}`));
  const selo = `${disco.selo || ''}${disco.catno ? ` ${disco.catno}` : ''}`.trim();
  if (selo) info.appendChild(el('p', 'carrinho-item__meta', selo));
  info.appendChild(el('p', 'carrinho-item__preco', disco.preco != null ? `R$ ${disco.preco}` : 'Sob consulta'));
  row.appendChild(info);

  const qtdWrap = el('div', 'carrinho-item__qtd');
  const btnMenos = criarBotao('carrinho-item__menos', '−', () => onQtd(item.qtd - 1), 'Diminuir quantidade');
  const spanQtd = el('span', 'carrinho-item__qtd-valor', String(item.qtd));
  const btnMais = criarBotao('carrinho-item__mais', '+', () => onQtd(item.qtd + 1), 'Aumentar quantidade');

  qtdWrap.appendChild(btnMenos);
  qtdWrap.appendChild(spanQtd);
  qtdWrap.appendChild(btnMais);
  row.appendChild(qtdWrap);

  const btnRemover = criarBotao('btn btn--ghost carrinho-item__remover', 'Remover', onRemover);
  row.appendChild(btnRemover);

  return row;
}

async function main() {
  ligarCabecalhoRodape();
  const container = document.getElementById('carrinho-root');
  if (!container) return;

  const catalogo = await todos();
  let estado = carregar();

  // Item cujo id não existe mais no catálogo é descartado silenciosamente.
  const idsValidos = new Set(catalogo.map((d) => d.id));
  const itensValidos = estado.itens.filter((it) => idsValidos.has(it.id));
  if (itensValidos.length !== estado.itens.length) {
    estado = { ...estado, itens: itensValidos };
    salvar(estado);
  }

  function persistir(novoEstado) {
    estado = novoEstado;
    salvar(estado);
    render();
  }

  function render() {
    container.innerHTML = '';

    if (estado.itens.length === 0) {
      renderVazio(container);
      return;
    }

    const lista = el('div', 'carrinho-lista');
    for (const item of estado.itens) {
      const disco = catalogo.find((d) => d.id === item.id);
      if (!disco) continue;
      lista.appendChild(
        renderItem(item, disco, {
          onQtd: (novaQtd) => persistir(definirQtd(estado, disco.id, novaQtd)),
          onRemover: () => persistir(remover(estado, disco.id)),
        })
      );
    }
    container.appendChild(lista);

    const obsWrap = el('div', 'campo carrinho-obs');
    const label = document.createElement('label');
    label.setAttribute('for', 'carrinho-obs');
    label.textContent = 'Observação (opcional)';
    const textarea = document.createElement('textarea');
    textarea.id = 'carrinho-obs';
    textarea.rows = 3;
    textarea.value = estado.obs || '';
    textarea.addEventListener('input', () => {
      estado = { ...estado, obs: textarea.value };
      salvar(estado);
      btnPedir.href = linkPedido(estado, catalogo);
    });
    obsWrap.appendChild(label);
    obsWrap.appendChild(textarea);
    container.appendChild(obsWrap);

    container.appendChild(el('p', 'carrinho-total', formatarTotal(total(estado, catalogo))));

    const acoes = el('div', 'carrinho-acoes');

    const btnPedir = document.createElement('a');
    btnPedir.id = 'btn-pedir';
    btnPedir.className = 'btn btn--whatsapp btn--bloco';
    btnPedir.target = '_blank';
    btnPedir.rel = 'noopener';
    btnPedir.textContent = 'Pedir pelo WhatsApp';
    btnPedir.href = linkPedido(estado, catalogo);
    acoes.appendChild(btnPedir);

    const btnEsvaziar = criarBotao('btn btn--ghost btn--bloco', 'Esvaziar carrinho', () => {
      if (window.confirm('Esvaziar o carrinho?')) {
        persistir({ itens: [], obs: '' });
      }
    });
    acoes.appendChild(btnEsvaziar);

    container.appendChild(acoes);
  }

  render();
}

main();
