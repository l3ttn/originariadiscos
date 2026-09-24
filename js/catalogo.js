// Acesso ao catálogo: um único fetch de data/catalogo.json, memoizado.
// Funciona com 0, 3 ou 60+ discos — nada aqui assume uma quantidade.

let _promessa = null;

function carregar() {
  if (!_promessa) {
    _promessa = fetch('data/catalogo.json')
      .then((resp) => {
        if (!resp.ok) throw new Error(`Falha ao carregar catálogo: HTTP ${resp.status}`);
        return resp.json();
      })
      .then((dados) => (Array.isArray(dados.discos) ? dados.discos : []));
  }
  return _promessa;
}

/** Todos os discos do catálogo. */
export async function todos() {
  return carregar();
}

/** Um disco pelo id (aceita string ou number). Retorna null se não existir. */
export async function porId(id) {
  const alvo = Number(id);
  if (Number.isNaN(alvo)) return null;
  const discos = await carregar();
  return discos.find((d) => d.id === alvo) || null;
}

/**
 * Até n discos em destaque (padrão 3). Se houver menos que n marcados
 * `destaque: true`, completa com os mais recentes por `adicionadoEm`.
 */
export async function destaques(n = 3) {
  const discos = await carregar();
  const marcados = discos.filter((d) => d.destaque);
  if (marcados.length >= n) return marcados.slice(0, n);

  const usados = new Set(marcados.map((d) => d.id));
  const recentes = [...discos]
    .filter((d) => !usados.has(d.id))
    .sort((a, b) => new Date(b.adicionadoEm).getTime() - new Date(a.adicionadoEm).getTime());

  return [...marcados, ...recentes].slice(0, n);
}

/** Até n discos recém-adicionados: `novo` primeiro, depois adicionadoEm desc, depois ordem. */
export async function novidades(n = 12) {
  const discos = await carregar();
  return [...discos]
    .sort((a, b) => {
      if (a.novo !== b.novo) return a.novo ? -1 : 1;
      const diff = new Date(b.adicionadoEm).getTime() - new Date(a.adicionadoEm).getTime();
      if (diff !== 0) return diff;
      return a.ordem - b.ordem;
    })
    .slice(0, n);
}

/**
 * As seções com mais discos (até 4), cada uma com nome, quantidade e a capa
 * do disco de menor `ordem` naquela seção.
 */
export async function secoes() {
  const discos = await carregar();
  const porOrdem = [...discos].sort((a, b) => a.ordem - b.ordem);

  const quantidade = new Map();
  const capa = new Map();
  for (const d of porOrdem) {
    quantidade.set(d.secao, (quantidade.get(d.secao) || 0) + 1);
    if (!capa.has(d.secao)) capa.set(d.secao, d.capa);
  }

  return [...quantidade.entries()]
    .map(([nome, total]) => ({ nome, quantidade: total, capa: capa.get(nome) || null }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 4);
}
