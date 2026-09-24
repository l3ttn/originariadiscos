// Funções puras de filtragem, busca, ordenação, paginação e estado da URL
// para catalogo.html. Nada aqui toca o DOM — por isso é testável com
// `node --test` sem navegador.

function normalizar(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Aplica os filtros de seção, gênero, formato e status. Campo ausente/vazio não filtra. */
export function filtrar(discos, filtros = {}) {
  const { secao, genero, formato, status } = filtros;
  return discos.filter((d) => {
    if (secao && d.secao !== secao) return false;
    if (genero && !(d.generos || []).includes(genero)) return false;
    if (formato && d.formatoTipo !== formato) return false;
    if (status && d.status !== status) return false;
    return true;
  });
}

/** Busca sem acento sobre artista + título + selo. Query vazia devolve tudo. */
export function buscar(discos, q) {
  const termo = normalizar(q);
  if (!termo) return discos;
  return discos.filter((d) => {
    const alvo = normalizar(`${d.artista} ${d.titulo} ${d.selo}`);
    return alvo.includes(termo);
  });
}

function porDestaques(a, b) {
  if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
  if (a.novo !== b.novo) return a.novo ? -1 : 1;
  return a.ordem - b.ordem;
}

function porNovos(a, b) {
  if (a.novo !== b.novo) return a.novo ? -1 : 1;
  const diff = new Date(b.adicionadoEm).getTime() - new Date(a.adicionadoEm).getTime();
  if (diff !== 0) return diff;
  return a.ordem - b.ordem;
}

function porAz(a, b) {
  return (
    a.artista.localeCompare(b.artista, 'pt-BR', { sensitivity: 'base' }) ||
    a.titulo.localeCompare(b.titulo, 'pt-BR', { sensitivity: 'base' })
  );
}

function porAno(a, b) {
  if (a.ano == null && b.ano == null) return 0;
  if (a.ano == null) return 1;
  if (b.ano == null) return -1;
  return b.ano - a.ano;
}

const CRITERIOS = { az: porAz, ano: porAno, novos: porNovos, destaques: porDestaques };

/** Ordena por 'destaques' (padrão), 'az', 'ano' ou 'novos'. Não muta a entrada. */
export function ordenar(discos, criterio = 'destaques') {
  const comparador = CRITERIOS[criterio] || porDestaques;
  return [...discos].sort(comparador);
}

/** Divide em páginas de `porPagina` itens (padrão 30). Página fora do intervalo é grampeada. */
export function paginar(discos, pagina = 1, porPagina = 30) {
  const total = discos.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaAtual = Math.min(Math.max(1, Number(pagina) || 1), totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  return {
    itens: discos.slice(inicio, inicio + porPagina),
    paginaAtual,
    totalPaginas,
    total,
  };
}

const ORDENS_VALIDAS = new Set(Object.keys(CRITERIOS));

/** Lê o estado de filtros/busca/ordenação/página a partir de um URLSearchParams. */
export function lerEstado(params) {
  const ordem = params.get('ordem');
  return {
    secao: params.get('secao') || '',
    genero: params.get('genero') || '',
    formato: params.get('formato') || '',
    status: params.get('status') || '',
    q: params.get('q') || '',
    ordem: ORDENS_VALIDAS.has(ordem) ? ordem : 'destaques',
    pagina: Math.max(1, Number(params.get('pagina')) || 1),
  };
}

/** Serializa o estado de volta para URLSearchParams, omitindo valores padrão. */
export function escreverEstado(estado = {}) {
  const params = new URLSearchParams();
  for (const chave of ['secao', 'genero', 'formato', 'status', 'q']) {
    if (estado[chave]) params.set(chave, estado[chave]);
  }
  if (estado.ordem && estado.ordem !== 'destaques') params.set('ordem', estado.ordem);
  if (estado.pagina && Number(estado.pagina) > 1) params.set('pagina', String(estado.pagina));
  return params;
}
