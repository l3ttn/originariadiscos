// Lógica de catalogo.html: filtros, busca, ordenação e paginação, tudo
// refletido na URL. Funciona igual com 0, 3 ou 60+ discos.
import { INSTAGRAM } from './config.js';
import { linkProcuraGenerica } from './whatsapp.js';
import { todos } from './catalogo.js';
import { criarCard } from './card.js';
import { filtrar, buscar, ordenar, paginar, lerEstado, escreverEstado } from './filtros.js';
import { atualizarContadorHeader } from './carrinho.js';

const ROTULOS_STATUS = {
  disponivel: 'Disponível',
  encomenda: 'Sob encomenda',
  esgotado: 'Esgotado',
};

const ROTULOS_ORDEM = {
  destaques: 'Destaques',
  az: 'A–Z',
  ano: 'Ano',
  novos: 'Novidades',
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
  atualizarContadorHeader();
  document.addEventListener('carrinho:mudou', atualizarContadorHeader);
}

function preencherSelect(select, valores, rotulos = {}, valorAtual = '') {
  select.innerHTML = '';
  const optTodos = document.createElement('option');
  optTodos.value = '';
  optTodos.textContent = 'Todos';
  select.appendChild(optTodos);
  for (const v of valores) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = rotulos[v] || v;
    select.appendChild(opt);
  }
  select.value = valorAtual;
}

function valoresUnicos(discos, campo) {
  return [...new Set(discos.map((d) => d[campo]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
  );
}

function generosUnicos(discos) {
  const set = new Set();
  for (const d of discos) for (const g of d.generos || []) set.add(g);
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

async function main() {
  ligarCabecalhoRodape();

  const discos = await todos();
  const params = new URLSearchParams(window.location.search);
  let estado = lerEstado(params);

  const formBusca = document.getElementById('campo-busca');
  const selSecao = document.getElementById('campo-secao');
  const selGenero = document.getElementById('campo-genero');
  const selFormato = document.getElementById('campo-formato');
  const selStatus = document.getElementById('campo-status');
  const selOrdem = document.getElementById('campo-ordem');
  const grid = document.getElementById('grid-catalogo');
  const infoResultado = document.getElementById('resultado-info');
  const paginacao = document.getElementById('paginacao');
  const btnAnterior = document.getElementById('pagina-anterior');
  const btnProxima = document.getElementById('pagina-proxima');
  const infoPagina = document.getElementById('pagina-info');

  formBusca.value = estado.q;
  preencherSelect(selSecao, valoresUnicos(discos, 'secao'), {}, estado.secao);
  preencherSelect(selGenero, generosUnicos(discos), {}, estado.genero);
  preencherSelect(selFormato, valoresUnicos(discos, 'formatoTipo'), {}, estado.formato);
  preencherSelect(selStatus, ['disponivel', 'encomenda', 'esgotado'], ROTULOS_STATUS, estado.status);
  preencherSelect(selOrdem, ['destaques', 'az', 'ano', 'novos'], ROTULOS_ORDEM, estado.ordem);
  selOrdem.querySelector('option[value=""]').remove();
  if (!estado.ordem) selOrdem.value = 'destaques';

  function renderEstadoVazio() {
    grid.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'estado-vazio';
    const p = document.createElement('p');
    p.textContent = 'Nenhum disco encontrado com esses filtros.';
    div.appendChild(p);
    const a = document.createElement('a');
    a.className = 'btn btn--whatsapp';
    a.target = '_blank';
    a.rel = 'noopener';
    a.href = linkProcuraGenerica(estado.q);
    a.textContent = 'Encontre pra mim';
    div.appendChild(a);
    grid.appendChild(div);
  }

  function render() {
    let resultado = filtrar(discos, estado);
    resultado = buscar(resultado, estado.q);
    resultado = ordenar(resultado, estado.ordem);
    const pagina = paginar(resultado, estado.pagina, 30);
    estado.pagina = pagina.paginaAtual;

    if (pagina.total === 0) {
      renderEstadoVazio();
      infoResultado.textContent = 'Nenhum disco encontrado.';
      paginacao.hidden = true;
      return;
    }

    const fragmento = document.createElement('div');
    fragmento.className = 'grid-cards';
    for (const disco of pagina.itens) fragmento.appendChild(criarCard(disco));
    grid.innerHTML = '';
    grid.appendChild(fragmento);

    infoResultado.textContent = `${pagina.total} ${pagina.total === 1 ? 'disco encontrado' : 'discos encontrados'}`;

    if (pagina.totalPaginas > 1) {
      paginacao.hidden = false;
      infoPagina.textContent = `Página ${pagina.paginaAtual} de ${pagina.totalPaginas}`;
      btnAnterior.disabled = pagina.paginaAtual <= 1;
      btnProxima.disabled = pagina.paginaAtual >= pagina.totalPaginas;
    } else {
      paginacao.hidden = true;
    }
  }

  function atualizarUrl() {
    const novosParams = escreverEstado(estado);
    const query = novosParams.toString();
    const novaUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', novaUrl);
  }

  function aoMudarFiltro() {
    estado = {
      ...estado,
      q: formBusca.value,
      secao: selSecao.value,
      genero: selGenero.value,
      formato: selFormato.value,
      status: selStatus.value,
      ordem: selOrdem.value,
      pagina: 1,
    };
    atualizarUrl();
    render();
  }

  let temporizadorBusca = null;
  formBusca.addEventListener('input', () => {
    clearTimeout(temporizadorBusca);
    temporizadorBusca = setTimeout(aoMudarFiltro, 250);
  });
  for (const sel of [selSecao, selGenero, selFormato, selStatus, selOrdem]) {
    sel.addEventListener('change', aoMudarFiltro);
  }

  btnAnterior.addEventListener('click', () => {
    estado = { ...estado, pagina: Math.max(1, estado.pagina - 1) };
    atualizarUrl();
    render();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  btnProxima.addEventListener('click', () => {
    estado = { ...estado, pagina: estado.pagina + 1 };
    atualizarUrl();
    render();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  render();
}

main();
