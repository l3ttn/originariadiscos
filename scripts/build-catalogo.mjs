// Pipeline do catálogo. Lê discos.txt, resolve cada linha no Discogs e escreve
// data/catalogo.json, data/resolvidos.json e data/pendentes.txt.
// Ver CONTRATO.md — seções "discos.txt", "data/catalogo.json" e "Pipeline".
//
// Uso: node scripts/build-catalogo.mjs [--force]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const DISCOS_TXT = path.join(ROOT_DIR, 'discos.txt');
const CATALOGO_JSON = path.join(DATA_DIR, 'catalogo.json');
const RESOLVIDOS_JSON = path.join(DATA_DIR, 'resolvidos.json');
const PENDENTES_TXT = path.join(DATA_DIR, 'pendentes.txt');

const USER_AGENT = 'OriginariaDiscos/1.0 (+https://l3ttn.github.io/originariadiscos/)';
const PACING_MS = 2600;
const TIMEOUT_MS = 20000;
const CACHE_FRESCURA_MS = 6 * 60 * 60 * 1000; // 6h
const MAX_TENTATIVAS_429 = 3;

const STATUS_VALIDOS = ['esgotado', 'disponivel', 'encomenda'];
const SEPARADOR_RE = / (–|-|—) /;
const RELEASE_URL_RE = /discogs\.com\/release\/(\d+)/i;
const MASTER_URL_RE = /discogs\.com\/master\/(\d+)/i;
const CORES_RE = /colou?r|clear|splatter|marbled|transparent|white|red|blue|green|yellow|pink|purple|gold|silver|orange|black/i;
const FORMATOS_BASE = new Set(['lp', 'album', 'stereo', 'mono', 'vinyl']);

// ---------------------------------------------------------------------------
// Funções puras (exportadas para teste — não fazem I/O nem rede)
// ---------------------------------------------------------------------------

/** NFD sem diacríticos, minúsculas, remove "*", remove sufixo " (n)", colapsa espaços. */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\*/g, '')
    .replace(/\s\(\d+\)/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove o sufixo " (n)" (desambiguação do Discogs) de um nome, preservando o resto. */
export function removerSufixoNumerico(nome) {
  return String(nome ?? '').replace(/\s\(\d+\)\s*$/, '').trim();
}

/** artists[].name unidos por " & ", sem "*" e sem sufixo " (n)". */
export function derivarArtista(artists) {
  if (!Array.isArray(artists) || artists.length === 0) return '';
  return artists
    .map((a) => removerSufixoNumerico(String(a?.name ?? '').replace(/\*/g, '')))
    .filter((nome) => nome.length > 0)
    .join(' & ');
}

/** labels[0].name sem sufixo " (n)". */
export function limparNomeSelo(nome) {
  return removerSufixoNumerico(nome);
}

/** Primeiro item de formats[] com name === "Vinyl", ou null. */
export function encontrarFormatoVinil(formats) {
  if (!Array.isArray(formats)) return null;
  return formats.find((f) => f && f.name === 'Vinyl') || null;
}

/** formatoTipo a partir de formats[] (regra do CONTRATO.md). */
export function derivarFormatoTipo(formats) {
  const vinil = encontrarFormatoVinil(formats);
  if (!vinil) return null;
  const descricoes = Array.isArray(vinil.descriptions) ? vinil.descriptions : [];
  if (descricoes.includes('7"')) return '7"';
  if (descricoes.includes('10"')) return '10"';
  if (descricoes.includes('12"')) return '12"';
  if (descricoes.includes('Box Set')) return 'Box';
  const qty = Number(vinil.qty);
  if (Number.isFinite(qty) && qty > 1) return `${qty}LP`;
  return 'LP';
}

// Ordem de varredura segue a redação do CONTRATO.md: cor é "text e descriptions[]"
// (text primeiro); edicao é "descriptions[] e text" (descriptions primeiro).
function candidatosCor(vinil) {
  const lista = [];
  if (vinil?.text) lista.push(vinil.text);
  if (Array.isArray(vinil?.descriptions)) lista.push(...vinil.descriptions);
  return lista;
}

function candidatosEdicao(vinil) {
  const lista = [];
  if (Array.isArray(vinil?.descriptions)) lista.push(...vinil.descriptions);
  if (vinil?.text) lista.push(vinil.text);
  return lista;
}

/** cor a partir de formats[].text/descriptions[] que casem a regex de cor. */
export function derivarCor(formats) {
  const vinil = encontrarFormatoVinil(formats);
  if (!vinil) return null;
  const achados = [];
  for (const c of candidatosCor(vinil)) {
    if (CORES_RE.test(c) && !achados.includes(c)) achados.push(c);
  }
  return achados.length ? achados.join(', ') : null;
}

/** edicao: descriptions[]/text que não são cor nem formato base. */
export function derivarEdicao(formats) {
  const vinil = encontrarFormatoVinil(formats);
  if (!vinil) return null;
  const achados = [];
  for (const c of candidatosEdicao(vinil)) {
    if (CORES_RE.test(c)) continue;
    if (FORMATOS_BASE.has(String(c).toLowerCase())) continue;
    if (!achados.includes(c)) achados.push(c);
  }
  return achados.length ? achados.join(', ') : null;
}

/** capa: images[] type === "primary", senão images[0]; campo uri. */
export function derivarCapa(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const primaria = images.find((img) => img && img.type === 'primary');
  const escolhida = primaria || images[0];
  return escolhida?.uri ?? null;
}

/** faixas: tracklist[] com type_ === "track" → {pos, titulo, dur}. */
export function derivarFaixas(tracklist) {
  if (!Array.isArray(tracklist)) return [];
  return tracklist
    .filter((t) => t && t.type_ === 'track')
    .map((t) => ({ pos: t.position ?? '', titulo: t.title ?? '', dur: t.duration ?? '' }));
}

/** videos: videos[].uri → {ytId, titulo}; ignora sem match de id do YouTube. */
export function derivarVideos(videos) {
  if (!Array.isArray(videos)) return [];
  const out = [];
  for (const v of videos) {
    const m = /(?:v=|youtu\.be\/)([\w-]{11})/.exec(v?.uri ?? '');
    if (m) out.push({ ytId: m[1], titulo: v?.title ?? null });
  }
  return out;
}

/**
 * Parse de uma linha de discos.txt.
 * Retorna { ok: true, tipo: 'release'|'master'|'texto', ... , opts, bruta }
 * ou { ok: false, motivo, bruta } para linha inválida (nunca lança).
 */
export function parseLinha(linhaCrua, secaoAtual) {
  const bruta = linhaCrua.trim();
  const partes = bruta.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
  const principal = partes[0];
  if (!principal) {
    return { ok: false, motivo: 'linha vazia', bruta };
  }

  const opts = {
    status: 'esgotado',
    preco: null,
    secao: secaoAtual || null,
    nota: null,
    destaque: false,
    novo: false,
  };

  for (const campo of partes.slice(1)) {
    const igual = campo.indexOf('=');
    if (igual === -1) {
      if (campo === 'destaque') { opts.destaque = true; continue; }
      if (campo === 'novo') { opts.novo = true; continue; }
      return { ok: false, motivo: `flag desconhecida: ${campo}`, bruta };
    }
    const chave = campo.slice(0, igual).trim();
    const valor = campo.slice(igual + 1).trim();
    if (chave === 'status') {
      if (!STATUS_VALIDOS.includes(valor)) {
        return { ok: false, motivo: `status inválido: ${valor}`, bruta };
      }
      opts.status = valor;
    } else if (chave === 'preco') {
      const n = Number(valor);
      if (!Number.isFinite(n) || n < 0) {
        return { ok: false, motivo: `preco inválido: ${valor}`, bruta };
      }
      opts.preco = Math.round(n);
    } else if (chave === 'secao') {
      opts.secao = valor;
    } else if (chave === 'nota') {
      opts.nota = valor;
    } else {
      return { ok: false, motivo: `campo desconhecido: ${chave}`, bruta };
    }
  }
  if (!opts.secao) opts.secao = 'Outros';

  const releaseMatch = RELEASE_URL_RE.exec(principal);
  if (releaseMatch) {
    return { ok: true, tipo: 'release', id: Number(releaseMatch[1]), opts, bruta };
  }
  const masterMatch = MASTER_URL_RE.exec(principal);
  if (masterMatch) {
    return { ok: true, tipo: 'master', id: Number(masterMatch[1]), opts, bruta };
  }
  if (/^https?:\/\//i.test(principal)) {
    return { ok: false, motivo: `URL Discogs não reconhecida: ${principal}`, bruta };
  }

  const sep = SEPARADOR_RE.exec(principal);
  if (!sep) {
    return { ok: false, motivo: `sem separador artista–título: ${principal}`, bruta };
  }
  const artista = principal.slice(0, sep.index).trim();
  const titulo = principal.slice(sep.index + sep[0].length).trim();
  if (!artista || !titulo) {
    return { ok: false, motivo: `artista ou título vazio: ${principal}`, bruta };
  }
  return { ok: true, tipo: 'texto', artista, titulo, opts, bruta };
}

/**
 * Percorre discos.txt inteiro, mantendo seção corrente e o contador `ordem`
 * (1-based, um incremento por linha de disco — válida ou não).
 */
export function prepararLinhas(conteudo) {
  const linhas = [];
  let secaoAtual = null;
  let ordem = 0;
  for (const bruta of String(conteudo).split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;
    if (linha.startsWith('##')) {
      secaoAtual = linha.replace(/^#+\s*/, '').trim();
      continue;
    }
    if (linha.startsWith('#')) continue;
    ordem += 1;
    const parsed = parseLinha(bruta, secaoAtual);
    linhas.push({ ...parsed, ordem });
  }
  return linhas;
}

/**
 * Regra de casamento do resultado de busca: o primeiro resultado cujo título
 * normalizado termina com " - " + tituloNorm e contém artistaNorm.
 */
export function casarResultadoBusca(resultados, artistaNorm, tituloNorm) {
  if (!Array.isArray(resultados)) return null;
  for (const r of resultados) {
    const tituloResultadoNorm = normalizarTexto(r?.title ?? '');
    if (tituloResultadoNorm.endsWith(` - ${tituloNorm}`) && tituloResultadoNorm.includes(artistaNorm)) {
      return r;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// I/O e rede (não exportadas / não testadas por unidade)
// ---------------------------------------------------------------------------

class PendenteError extends Error {}

let contadorChamadas = 0;
let ultimaChamadaEm = 0;

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function espacarChamada() {
  const agora = Date.now();
  const espera = ultimaChamadaEm + PACING_MS - agora;
  if (espera > 0) await dormir(espera);
  ultimaChamadaEm = Date.now();
}

async function chamarDiscogs(url, contexto) {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_429; tentativa += 1) {
    await espacarChamada();
    const headers = { 'User-Agent': USER_AGENT };
    if (process.env.DISCOGS_TOKEN) {
      headers.Authorization = `Discogs token=${process.env.DISCOGS_TOKEN}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    contadorChamadas += 1;
    try {
      const resp = await fetch(url, { headers, signal: controller.signal });
      if (resp.status === 429) {
        const retryAfter = Number(resp.headers.get('retry-after'));
        const esperaMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 60000;
        if (tentativa < MAX_TENTATIVAS_429) {
          await dormir(esperaMs);
          continue;
        }
        throw new Error(`429 persistente em ${contexto}`);
      }
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} em ${contexto}`);
      }
      return await resp.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`timeout (${TIMEOUT_MS}ms) em ${contexto}`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`falha em ${contexto}`);
}

async function escreverJsonAtomic(caminho, dados) {
  const tmp = `${caminho}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, `${JSON.stringify(dados, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, caminho);
}

async function lerJsonSeExistir(caminho) {
  try {
    const raw = await fs.readFile(caminho, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function obterRelease(id, force) {
  const caminho = path.join(CACHE_DIR, `${id}.json`);
  if (!force) {
    const cache = await lerJsonSeExistir(caminho);
    if (cache && cache._fetchedAt) {
      const idade = Date.now() - new Date(cache._fetchedAt).getTime();
      if (Number.isFinite(idade) && idade < CACHE_FRESCURA_MS) {
        return cache;
      }
    }
  }
  const data = await chamarDiscogs(`https://api.discogs.com/releases/${id}`, `releases/${id}`);
  data._fetchedAt = new Date().toISOString();
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await escreverJsonAtomic(caminho, data);
  return data;
}

async function buscarDiscogs(artista, titulo, tipo) {
  const params = new URLSearchParams({
    artist: artista,
    release_title: titulo,
    type: tipo,
    format: 'Vinyl',
    per_page: '5',
  });
  const data = await chamarDiscogs(
    `https://api.discogs.com/database/search?${params.toString()}`,
    `search ${tipo} "${artista} - ${titulo}"`,
  );
  return Array.isArray(data.results) ? data.results : [];
}

/** Busca livre (campo `q`), usada só depois que artist+release_title não achou nada. */
async function buscarDiscogsLivre(artista, titulo, tipo) {
  const params = new URLSearchParams({
    q: `${artista} ${titulo}`,
    type: tipo,
    format: 'Vinyl',
    per_page: '5',
  });
  const data = await chamarDiscogs(
    `https://api.discogs.com/database/search?${params.toString()}`,
    `search livre ${tipo} "${artista} ${titulo}"`,
  );
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Tenta, em ordem: type=master (artist+release_title) → type=release (idem) → busca
 * livre (q=) com type=master. Cada tentativa só roda se a anterior deu ZERO resultados
 * (não "sem casamento" — nesse caso já usa o 1º + VERIFICAR e para). Aplica a regra de
 * casamento em cada uma. O `tipo` devolvido diz de qual busca veio o id vencedor —
 * quando é "master", o id devolvido pela API de busca é um master id (não um release
 * id) e precisa passar por /masters/{id} → main_release antes de virar um
 * GET /releases/{id} válido.
 */
async function buscarEResolverTexto(artista, titulo) {
  const artistaNorm = normalizarTexto(artista);
  const tituloNorm = normalizarTexto(titulo);
  const tentativas = [
    { tipo: 'master', buscar: () => buscarDiscogs(artista, titulo, 'master') },
    { tipo: 'release', buscar: () => buscarDiscogs(artista, titulo, 'release') },
    { tipo: 'master', buscar: () => buscarDiscogsLivre(artista, titulo, 'master') },
  ];
  for (const tentativa of tentativas) {
    const resultados = await tentativa.buscar();
    if (resultados.length === 0) continue;
    const match = casarResultadoBusca(resultados, artistaNorm, tituloNorm);
    const escolhido = match || resultados[0];
    return {
      id: escolhido.id,
      tipo: tentativa.tipo,
      verificar: !match,
      url: escolhido.resource_url || escolhido.uri || '',
    };
  }
  return { erro: true };
}

/** GET /masters/{id} → main_release, ou lança PendenteError se o master não tiver um. */
async function resolverMainRelease(masterId) {
  const masterData = await chamarDiscogs(`https://api.discogs.com/masters/${masterId}`, `masters/${masterId}`);
  if (!masterData.main_release) {
    throw new PendenteError(`SEM RESULTADO (master ${masterId} sem main_release)`);
  }
  return masterData.main_release;
}

/** Resolve o id do release para a linha (sem buscar o release completo). */
async function resolverId(linha, resolvidos) {
  if (linha.tipo === 'release') {
    return { chave: `release:${linha.id}`, id: linha.id, verificarInfo: null };
  }
  if (linha.tipo === 'master') {
    const chave = `master:${linha.id}`;
    const cache = resolvidos[chave];
    if (cache) return { chave, id: cache.id, verificarInfo: null };
    const mainRelease = await resolverMainRelease(linha.id);
    return { chave, id: mainRelease, verificarInfo: null, masterId: linha.id, precisaValidarVinil: true };
  }
  // texto
  const artistaNorm = normalizarTexto(linha.artista);
  const tituloNorm = normalizarTexto(linha.titulo);
  const chave = `${artistaNorm} - ${tituloNorm}`;
  const cache = resolvidos[chave];
  if (cache) return { chave, id: cache.id, verificarInfo: null };
  const r = await buscarEResolverTexto(linha.artista, linha.titulo);
  if (r.erro) throw new PendenteError(`SEM RESULTADO: ${linha.bruta}`);
  const verificarInfo = r.verificar ? `VERIFICAR: ${linha.bruta} → ${r.url}` : null;
  if (r.tipo === 'master') {
    const mainRelease = await resolverMainRelease(r.id);
    return { chave, id: mainRelease, verificarInfo, masterId: r.id, precisaValidarVinil: true };
  }
  return { chave, id: r.id, verificarInfo };
}

/**
 * Para linhas resolvidas via master: garante que o release final tem formato Vinyl,
 * com /masters/{id}/versions?format=Vinyl como fallback — tanto quando main_release
 * não tem formato Vinyl quanto quando o GET desse release falha (ex.: 404, main_release
 * inválido/orfão).
 */
async function garantirVinil(masterId, id, force) {
  let release = null;
  try {
    release = await obterRelease(id, force);
  } catch {
    release = null; // cai para o fallback de versions abaixo
  }
  const temVinil = Boolean(release) && Array.isArray(release.formats) && release.formats.some((f) => f?.name === 'Vinyl');
  if (temVinil) return { id, release };
  const versoes = await chamarDiscogs(
    `https://api.discogs.com/masters/${masterId}/versions?format=Vinyl&per_page=1`,
    `masters/${masterId}/versions`,
  );
  const primeira = versoes.versions?.[0];
  if (!primeira) {
    throw new PendenteError(`SEM RESULTADO (master ${masterId}: main_release inválido e sem versão em vinil)`);
  }
  const releaseFinal = await obterRelease(primeira.id, force);
  return { id: primeira.id, release: releaseFinal };
}

function construirEntrada(release, id, opts, ordem, adicionadoEm) {
  const formatoTipo = derivarFormatoTipo(release.formats);
  return {
    id,
    masterId: release.master_id ?? null,
    artista: derivarArtista(release.artists),
    titulo: release.title ?? '',
    ano: release.year && release.year !== 0 ? release.year : null,
    pais: release.country || null,
    selo: release.labels?.[0]?.name ? limparNomeSelo(release.labels[0].name) : null,
    catno: release.labels?.[0]?.catno || null,
    formatoTipo,
    formatoLabel: formatoTipo ? `Vinil ${formatoTipo}` : null,
    cor: derivarCor(release.formats),
    edicao: derivarEdicao(release.formats),
    generos: Array.isArray(release.genres) ? release.genres : [],
    estilos: Array.isArray(release.styles) ? release.styles : [],
    capa: derivarCapa(release.images),
    faixas: derivarFaixas(release.tracklist),
    videos: derivarVideos(release.videos),
    notas: release.notes || null,
    discogsUrl: release.uri,
    status: opts.status,
    preco: opts.preco,
    secao: opts.secao,
    destaque: opts.destaque,
    novo: opts.novo,
    comentario: opts.nota || null,
    adicionadoEm,
    ordem,
  };
}

function formatarTempo(ms) {
  const totalS = Math.round(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${s}s`;
}

async function main() {
  const inicio = Date.now();
  const force = process.argv.includes('--force');

  const conteudo = await fs.readFile(DISCOS_TXT, 'utf8');
  const linhas = prepararLinhas(conteudo);

  const resolvidos = (await lerJsonSeExistir(RESOLVIDOS_JSON)) || {};
  const catalogoAnterior = await lerJsonSeExistir(CATALOGO_JSON);
  const catalogoAnteriorPorId = new Map();
  for (const d of catalogoAnterior?.discos ?? []) {
    catalogoAnteriorPorId.set(d.id, d);
  }

  const discosFinal = [];
  const pendentesLinhas = [];

  for (const linha of linhas) {
    if (!linha.ok) {
      pendentesLinhas.push(`INVALIDA: ${linha.bruta} (${linha.motivo})`);
      continue;
    }

    let id;
    let chave;
    let verificarInfo = null;
    let masterId = null;
    let precisaValidarVinil = false;
    try {
      const resolvido = await resolverId(linha, resolvidos);
      ({ id, chave, verificarInfo } = resolvido);
      masterId = resolvido.masterId ?? null;
      precisaValidarVinil = Boolean(resolvido.precisaValidarVinil);
    } catch (err) {
      pendentesLinhas.push(err instanceof PendenteError ? err.message : `ERRO AO RESOLVER: ${linha.bruta} (${err.message})`);
      continue;
    }

    let release;
    try {
      if (precisaValidarVinil) {
        const garantido = await garantirVinil(masterId, id, force);
        id = garantido.id;
        release = garantido.release;
      } else {
        release = await obterRelease(id, force);
      }
    } catch (err) {
      const anterior = catalogoAnteriorPorId.get(id);
      if (anterior) {
        const adicionadoEm = resolvidos[chave]?.adicionadoEm ?? anterior.adicionadoEm ?? new Date().toISOString();
        discosFinal.push({
          ...anterior,
          status: linha.opts.status,
          preco: linha.opts.preco,
          secao: linha.opts.secao,
          destaque: linha.opts.destaque,
          novo: linha.opts.novo,
          comentario: linha.opts.nota || null,
          adicionadoEm,
          ordem: linha.ordem,
        });
        resolvidos[chave] = { id, adicionadoEm };
        pendentesLinhas.push(
          err instanceof PendenteError
            ? err.message
            : `REAPROVEITADO (erro ao buscar release ${id}): ${linha.bruta} (${err.message})`,
        );
      } else {
        pendentesLinhas.push(
          err instanceof PendenteError ? err.message : `ERRO AO BUSCAR: ${linha.bruta} (${err.message})`,
        );
      }
      continue;
    }

    const adicionadoEm = resolvidos[chave]?.adicionadoEm ?? new Date().toISOString();
    const entrada = construirEntrada(release, id, linha.opts, linha.ordem, adicionadoEm);
    if (!entrada.formatoTipo) {
      // Nunca entra no catálogo sem formato Vinyl (formatoLabel ficaria null). Não
      // grava em resolvidos.json — assim a próxima execução tenta resolver de novo.
      pendentesLinhas.push(`SEM RESULTADO (release ${id} sem formato Vinyl): ${linha.bruta}`);
      continue;
    }
    resolvidos[chave] = { id, adicionadoEm };
    discosFinal.push(entrada);
    if (verificarInfo) pendentesLinhas.push(verificarInfo);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await escreverJsonAtomic(RESOLVIDOS_JSON, resolvidos);
  await escreverJsonAtomic(CATALOGO_JSON, {
    geradoEm: new Date().toISOString(),
    fonte: 'Discogs',
    discos: discosFinal,
  });
  await fs.writeFile(PENDENTES_TXT, pendentesLinhas.length ? `${pendentesLinhas.join('\n')}\n` : '', 'utf8');

  const tempo = formatarTempo(Date.now() - inicio);
  console.log(`OK ${discosFinal.length} · pendentes ${pendentesLinhas.length} · chamadas ${contadorChamadas} · ${tempo}`);

  if (discosFinal.length === 0) {
    process.exit(1);
  }
}

const ehModuloPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ehModuloPrincipal) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
