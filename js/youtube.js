// Helpers puros para a seção "Ouvir" de disco.html.
// Sem chamada de rede: usa o ytId já resolvido em data/catalogo.json.

/** URL da thumbnail estática (sem carregar o player). */
export function thumbUrl(ytId) {
  return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
}

/** URL do embed nocookie, autoplay — usada só depois do clique no thumb. */
export function embedUrl(ytId) {
  return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`;
}

/** Remove vídeos duplicados (mesmo ytId) preservando a primeira ocorrência. */
export function dedupeVideos(videos = []) {
  const vistos = new Set();
  const resultado = [];
  for (const v of videos) {
    if (!v || !v.ytId || vistos.has(v.ytId)) continue;
    vistos.add(v.ytId);
    resultado.push(v);
  }
  return resultado;
}
