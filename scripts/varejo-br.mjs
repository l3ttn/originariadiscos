// Preços de varejo brasileiro (v5). Lê data/catalogo.json e data/lojas-br.json, respeita
// robots.txt de cada loja (grupo "*", Crawl-delay, caminhos proibidos), lê o sitemap de cada
// uma (plataforma Loja Integrada: índice -> sub-sitemaps de produto -> URLs de produto),
// casa cada disco do catálogo pelo slug da URL e lê preço/disponibilidade da página do
// produto. Escreve data/precos-varejo.json.
// Ver CONTRATO.md — seção "Varejo brasileiro (v5)".
//
// Uso: node scripts/varejo-br.mjs

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { escreverJsonAtomic, lerJsonSeExistir } from './build-catalogo.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const CATALOGO_JSON = path.join(DATA_DIR, 'catalogo.json');
const LOJAS_JSON = path.join(DATA_DIR, 'lojas-br.json');
const PRECOS_VAREJO_JSON = path.join(DATA_DIR, 'precos-varejo.json');

const USER_AGENT = 'OriginariaDiscos-precos/1.0 (+https://l3ttn.github.io/originariadiscos/)';
const TIMEOUT_MS = 20000;
const PACING_MINIMO_MS = 3000;
const MAX_TENTATIVAS = 2; // 429/503: espera 60s, 2 tentativas, depois desiste daquela URL
const ESPERA_RETENTATIVA_MS = 60000;
const SITEMAP_CACHE_FRESCURA_MS = 24 * 60 * 60 * 1000; // 24h
const PRODUTO_CACHE_FRESCURA_MS = 6 * 60 * 60 * 1000; // 6h
const MAX_CANDIDATAS_POR_DISCO = 3;
const STOPWORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'the', 'and', 'vol', 'e']);
const TERMOS_EXCLUIDOS = new Set([
  'cd', 'box', 'kit', 'usado', 'seminovo', 'semi', 'k7', 'fita', 'dvd', 'cassete', 'compacto', 'bluray',
]);

// ---------------------------------------------------------------------------
// Funções puras (exportadas para teste — não fazem I/O nem rede)
// ---------------------------------------------------------------------------

/** NFD sem diacríticos, minúsculas (igual à normalização de build-catalogo.mjs). */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Todos os tokens alfanuméricos de um texto (slug ou texto livre), sem filtro de tamanho. */
export function todosTokens(texto) {
  return normalizarTexto(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Tokens com >= 3 letras, sem as stopwords do contrato (de, do, da, dos, das, the, and, vol, e). */
export function tokensSignificativos(texto) {
  return todosTokens(texto).filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export function tituloTokens(disco) {
  return tokensSignificativos(disco?.titulo ?? '');
}

export function artistaTokens(disco) {
  return tokensSignificativos(disco?.artista ?? '');
}

/** true se algum token (slug ou nome) é um dos termos que excluem o produto (cd, box, kit, …). */
export function slugExcluido(texto) {
  return todosTokens(texto).some((t) => TERMOS_EXCLUIDOS.has(t));
}

/** true se o texto (slug) contém o token "lp" ou "vinil". */
export function contemLpOuVinil(texto) {
  const tokens = todosTokens(texto);
  return tokens.includes('lp') || tokens.includes('vinil');
}

/**
 * Todos os tokens do título (>=3 letras) presentes no texto, e ao menos um token do artista
 * (>=3 letras) presente. Usada tanto para casar o slug da URL quanto o nome da página do
 * produto ("o nome tem de passar no mesmo casamento" — CONTRATO.md).
 */
export function casaTituloEArtista(disco, texto) {
  const tokensTexto = new Set(tokensSignificativos(texto));
  const tTokens = tituloTokens(disco);
  if (tTokens.length === 0 || !tTokens.every((t) => tokensTexto.has(t))) return false;
  const aTokens = artistaTokens(disco);
  if (aTokens.length > 0 && !aTokens.some((t) => tokensTexto.has(t))) return false;
  return true;
}

/** Regra de casamento do slug: sem termo excluído, com "lp"/"vinil", título+artista casam. */
export function slugCasaDisco(disco, slug) {
  if (slugExcluido(slug)) return false;
  if (!contemLpOuVinil(slug)) return false;
  return casaTituloEArtista(disco, slug);
}

/** Último segmento não vazio do path da URL (o slug, nas lojas Loja Integrada). */
export function slugDaUrl(url) {
  try {
    const partes = new URL(url).pathname.split('/').filter(Boolean);
    return partes[partes.length - 1] || '';
  } catch {
    return '';
  }
}

/** Quantos tokens do slug não são do título, do artista, nem "lp"/"vinil" (desempate). */
export function contarTokensExtras(disco, slug) {
  const essenciais = new Set([...tituloTokens(disco), ...artistaTokens(disco), 'lp', 'vinil']);
  return todosTokens(slug).filter((t) => !essenciais.has(t)).length;
}

/** Até `max` URLs cujo slug casa com o disco, as de menos tokens extras primeiro. */
export function escolherUrlsCandidatas(urls, disco, max = MAX_CANDIDATAS_POR_DISCO) {
  const candidatas = (Array.isArray(urls) ? urls : [])
    .map((url) => ({ url, slug: slugDaUrl(url) }))
    .filter(({ slug }) => slugCasaDisco(disco, slug))
    .map((c) => ({ ...c, extras: contarTokensExtras(disco, c.slug) }))
    .sort((a, b) => a.extras - b.extras || a.url.localeCompare(b.url));
  return candidatas.slice(0, max).map((c) => c.url);
}

/** URLs sem repetição, preservando a 1ª ocorrência (sitemaps na prática repetem <loc>). */
export function dedupUrls(urls) {
  return [...new Set(Array.isArray(urls) ? urls : [])];
}

/** Ofertas sem repetição por `url`, preservando a 1ª ocorrência (mesma URL vista 2x no sitemap
 * → mesma oferta 2x, sem isso). */
export function dedupOfertasPorUrl(ofertas) {
  const vistas = new Set();
  const unicas = [];
  for (const oferta of Array.isArray(ofertas) ? ofertas : []) {
    if (vistas.has(oferta.url)) continue;
    vistas.add(oferta.url);
    unicas.push(oferta);
  }
  return unicas;
}

// --- robots.txt --------------------------------------------------------------------------

/**
 * Parse de robots.txt: devolve as regras (Allow/Disallow) e o Crawl-delay do grupo "*"
 * (user-agent exato "*"). Grupos são delimitados pela sequência padrão: uma ou mais linhas
 * User-agent seguidas de regras; uma nova linha User-agent depois de já ter visto regra abre
 * um grupo novo. Sem grupo "*" → sem regras (tudo permitido) e crawlDelay null.
 */
export function parseRobotsTxt(texto) {
  const grupos = [];
  let atual = null;
  for (const bruta of String(texto ?? '').split(/\r?\n/)) {
    const linha = bruta.replace(/#.*$/, '').trim();
    if (!linha) continue;
    const idx = linha.indexOf(':');
    if (idx === -1) continue;
    const campo = linha.slice(0, idx).trim().toLowerCase();
    const valor = linha.slice(idx + 1).trim();
    if (campo === 'user-agent') {
      if (!atual || atual.iniciouRegra) {
        atual = { agentes: [], regras: [], crawlDelay: null, iniciouRegra: false };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
    } else if (campo === 'allow' || campo === 'disallow') {
      if (!atual) {
        atual = { agentes: ['*'], regras: [], crawlDelay: null, iniciouRegra: false };
        grupos.push(atual);
      }
      atual.regras.push({ tipo: campo, padrao: valor });
      atual.iniciouRegra = true;
    } else if (campo === 'crawl-delay') {
      if (atual) {
        atual.crawlDelay = Number(valor);
        atual.iniciouRegra = true;
      }
    }
  }
  const grupoEstrela = grupos.find((g) => g.agentes.includes('*'));
  if (!grupoEstrela) return { regras: [], crawlDelay: null };
  return {
    regras: grupoEstrela.regras,
    crawlDelay: Number.isFinite(grupoEstrela.crawlDelay) ? grupoEstrela.crawlDelay : null,
  };
}

/** Padrão de robots.txt ("*" = qualquer sequência, "$" = fim da URL) → testa contra o caminho. */
export function caminhoCasaPadrao(caminho, padrao) {
  if (!padrao) return false; // Disallow/Allow vazio não casa com nada (= sem restrição)
  let p = padrao;
  let ancoraFim = false;
  if (p.endsWith('$')) {
    ancoraFim = true;
    p = p.slice(0, -1);
  }
  const escapado = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const re = new RegExp(`^${escapado}${ancoraFim ? '$' : ''}`);
  return re.test(caminho);
}

/**
 * Permissão de um caminho segundo as regras do grupo "*": entre as regras que casam, a de
 * padrão mais longo vence; empate de tamanho → Allow vence (convenção usual de robots.txt).
 * Nenhuma regra casa → permitido.
 */
export function permiteCaminho(parsed, caminho) {
  const regras = (parsed?.regras || []).filter((r) => caminhoCasaPadrao(caminho, r.padrao));
  if (regras.length === 0) return true;
  let melhor = regras[0];
  for (const r of regras.slice(1)) {
    if (r.padrao.length > melhor.padrao.length) melhor = r;
    else if (r.padrao.length === melhor.padrao.length && r.tipo === 'allow') melhor = r;
  }
  return melhor.tipo === 'allow';
}

// --- sitemap -------------------------------------------------------------------------------

/** Todo conteúdo de <loc>...</loc> de um XML de sitemap. */
export function extrairLocs(xml) {
  return [...String(xml ?? '').matchAll(/<loc>([^<]*)<\/loc>/gi)].map((m) => m[1].trim()).filter(Boolean);
}

/** Sub-sitemaps de produto, dentre os <loc> de um índice (ex.: .../sitemap/product-3.xml). */
export function filtrarSubSitemapsDeProduto(locs) {
  return (Array.isArray(locs) ? locs : []).filter((url) => /\/sitemap\/product/i.test(url));
}

// --- página do produto ----------------------------------------------------------------------

function extrairTag(html, condicaoRegex) {
  const m = condicaoRegex.exec(String(html ?? ''));
  return m ? m[0] : null;
}

function extrairAtributo(tag, atributo) {
  if (!tag) return null;
  const m = new RegExp(`${atributo}=["']([^"']*)["']`, 'i').exec(tag);
  return m ? m[1] : null;
}

/** itemprop="price" content="220.00", ou product:price:amount; null se não achar. */
export function extrairPreco(html) {
  const tagPrice = extrairTag(html, /<[^>]*itemprop=["']price["'][^>]*>/i);
  const viaPrice = extrairAtributo(tagPrice, 'content');
  const viaAmount = viaPrice ?? extrairAtributo(extrairTag(html, /<meta[^>]*property=["']product:price:amount["'][^>]*>/i), 'content');
  if (viaAmount == null) return null;
  const n = Number(String(viaAmount).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** true se a página citar disponibilidade schema.org/InStock. */
export function extrairDisponivel(html) {
  return /schema\.org\/InStock/i.test(String(html ?? ''));
}

/** og:title, senão o texto do primeiro <h1>; null se nenhum existir. */
export function extrairNomeProduto(html) {
  const viaOg = extrairAtributo(extrairTag(html, /<meta[^>]*property=["']og:title["'][^>]*>/i), 'content');
  if (viaOg) return viaOg;
  const h1 = /<h1[^>]*>([^<]*)<\/h1>/i.exec(String(html ?? ''));
  return h1 ? h1[1].trim() : null;
}

// --- agendador por host (testável com fetch/relógio injetados) -----------------------------

/** Caminho (path + query) de uma URL, para testar contra as regras do robots.txt. */
export function caminhoDaUrl(url) {
  const u = new URL(url);
  return u.pathname + u.search;
}

/** max(Crawl-delay, 3s) em ms — intervalo mínimo entre duas chamadas ao mesmo host. */
export function intervaloDoHost(crawlDelay) {
  const cdMs = Number.isFinite(crawlDelay) ? crawlDelay * 1000 : 0;
  return Math.max(cdMs, PACING_MINIMO_MS);
}

/**
 * Checa o robots.txt; se proibido, NUNCA chama `fetchFn` (devolve { bloqueada: true } e
 * registra em `log`). Se permitido, espera o intervalo do host (relógio injetável via
 * `agora`/`dormir`, só avançado por esta função — é o que os testes usam para provar o
 * espaçamento) e só então chama `fetchFn(url)`.
 */
export async function requisitarRespeitandoRobots({
  url,
  robots,
  estadoHost,
  intervaloMs,
  fetchFn,
  dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  agora = Date.now,
  log,
}) {
  const caminho = caminhoDaUrl(url);
  if (!permiteCaminho(robots, caminho)) {
    log?.push({ url, caminho, bloqueada: true });
    return { bloqueada: true, dados: null };
  }
  const espera = estadoHost.ultima == null ? 0 : estadoHost.ultima + intervaloMs - agora();
  if (espera > 0) await dormir(espera);
  estadoHost.ultima = agora();
  const dados = await fetchFn(url);
  log?.push({ url, caminho, bloqueada: false });
  return { bloqueada: false, dados };
}

function formatarTempo(ms) {
  const totalS = Math.round(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${s}s`;
}

function categorizarCaminho(caminho) {
  if (caminho === '/robots.txt') return 'robots.txt';
  if (caminho.startsWith('/sitemap.xml')) return 'sitemap-indice';
  if (/\/sitemap\//i.test(caminho)) return 'sitemap-produto';
  if (caminho.startsWith('/buscar')) return 'buscar';
  if (caminho.startsWith('/api/')) return 'api';
  return 'pagina-produto';
}

// ---------------------------------------------------------------------------
// I/O e rede
// ---------------------------------------------------------------------------

async function dormirReal(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** GET com User-Agent honesto, timeout de 20s e retry de 429/503 (60s, até 2 tentativas). */
async function buscarTexto(url) {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal });
      if (resp.status === 429 || resp.status === 503) {
        if (tentativa < MAX_TENTATIVAS) {
          await dormirReal(ESPERA_RETENTATIVA_MS);
          continue;
        }
        return null;
      }
      if (!resp.ok) return null;
      return await resp.text();
    } catch {
      if (tentativa < MAX_TENTATIVAS) continue;
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function obterRobots(base, log) {
  const texto = await buscarTexto(`${base}/robots.txt`);
  log.push({ url: `${base}/robots.txt`, caminho: '/robots.txt', bloqueada: false });
  return parseRobotsTxt(texto || '');
}

/** URLs de todos os produtos do sitemap (índice -> sub-sitemaps de produto -> URLs), com
 * cache de 24h em data/cache/sitemap-{host}.json. */
async function obterUrlsDoSitemap(base, robots, estadoHost, intervaloMs, log) {
  const host = new URL(base).host;
  const caminhoCache = path.join(CACHE_DIR, `sitemap-${host}.json`);
  const cache = await lerJsonSeExistir(caminhoCache);
  if (cache && cache._fetchedAt && Date.now() - new Date(cache._fetchedAt).getTime() < SITEMAP_CACHE_FRESCURA_MS) {
    // dedup mesmo no cache: sitemaps já vistos na prática listam o mesmo produto em mais de
    // um sub-sitemap (medido: HipMusic, 2607 de 8442 <loc> duplicados).
    return dedupUrls(cache.urls || []);
  }

  const { dados: xmlIndice } = await requisitarRespeitandoRobots({
    url: `${base}/sitemap.xml`,
    robots,
    estadoHost,
    intervaloMs,
    fetchFn: buscarTexto,
    log,
  });
  const subSitemaps = filtrarSubSitemapsDeProduto(extrairLocs(xmlIndice));

  const urls = [];
  for (const subUrl of subSitemaps) {
    const { dados: xmlSub } = await requisitarRespeitandoRobots({
      url: subUrl,
      robots,
      estadoHost,
      intervaloMs,
      fetchFn: buscarTexto,
      log,
    });
    urls.push(...extrairLocs(xmlSub));
  }

  const urlsUnicas = dedupUrls(urls);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await escreverJsonAtomic(caminhoCache, { _fetchedAt: new Date().toISOString(), urls: urlsUnicas });
  return urlsUnicas;
}

function hashSimples(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** HTML da página do produto, com cache de 6h em data/cache/produto-{hash}.json. */
async function obterHtmlProduto(url, robots, estadoHost, intervaloMs, log) {
  const caminhoCache = path.join(CACHE_DIR, `produto-${hashSimples(url)}.json`);
  const cache = await lerJsonSeExistir(caminhoCache);
  if (cache && cache._fetchedAt && Date.now() - new Date(cache._fetchedAt).getTime() < PRODUTO_CACHE_FRESCURA_MS) {
    return { html: cache.html, bloqueada: false };
  }
  const { dados: html, bloqueada } = await requisitarRespeitandoRobots({
    url,
    robots,
    estadoHost,
    intervaloMs,
    fetchFn: buscarTexto,
    log,
  });
  if (!bloqueada && html != null) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await escreverJsonAtomic(caminhoCache, { _fetchedAt: new Date().toISOString(), html });
  }
  return { html, bloqueada };
}

async function processarLoja(loja, discosCatalogo) {
  const log = [];
  const estadoHost = {};
  const robots = await obterRobots(loja.base, log);
  const intervaloMs = intervaloDoHost(robots.crawlDelay);

  const urlsSitemap = await obterUrlsDoSitemap(loja.base, robots, estadoHost, intervaloMs, log);
  const produtosNoSitemap = urlsSitemap.length;

  const ofertasPorId = {};
  for (const disco of discosCatalogo) {
    const candidatas = escolherUrlsCandidatas(urlsSitemap, disco);
    const ofertas = [];
    for (const url of candidatas) {
      const { html, bloqueada } = await obterHtmlProduto(url, robots, estadoHost, intervaloMs, log);
      if (bloqueada) continue;
      if (!html) continue;
      const nome = extrairNomeProduto(html);
      if (!nome || !casaTituloEArtista(disco, nome)) continue;
      const preco = extrairPreco(html);
      if (preco == null) continue;
      ofertas.push({ loja: loja.nome, nome, preco, url, disponivel: extrairDisponivel(html) });
    }
    const ofertasUnicas = dedupOfertasPorUrl(ofertas);
    if (ofertasUnicas.length > 0) ofertasPorId[disco.id] = ofertasUnicas;
  }

  return {
    resumo: {
      nome: loja.nome,
      base: loja.base,
      produtosNoSitemap,
      requisicoes: log.filter((e) => !e.bloqueada).length,
      bloqueadasPorRobots: log.filter((e) => e.bloqueada).length,
    },
    ofertasPorId,
    log,
  };
}

async function gerarPrecosVarejo(catalogo, lojas) {
  const resultadosLojas = await Promise.all(lojas.map((loja) => processarLoja(loja, catalogo.discos)));

  const discos = {};
  for (const disco of catalogo.discos) discos[String(disco.id)] = [];
  for (const resultado of resultadosLojas) {
    for (const [id, ofertas] of Object.entries(resultado.ofertasPorId)) {
      discos[id].push(...ofertas);
    }
  }

  const logCompleto = resultadosLojas.flatMap((r) => r.log);
  const consultadoEm = new Date().toISOString();
  const dados = { consultadoEm, lojas: resultadosLojas.map((r) => r.resumo), discos };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await escreverJsonAtomic(PRECOS_VAREJO_JSON, dados);
  return { dados, logCompleto };
}

async function main() {
  const inicio = Date.now();

  const catalogo = await lerJsonSeExistir(CATALOGO_JSON);
  if (!catalogo || !Array.isArray(catalogo.discos)) {
    console.error('data/catalogo.json ausente ou inválido — rode "npm run catalogo" primeiro.');
    process.exit(1);
  }
  const lojas = await lerJsonSeExistir(LOJAS_JSON);
  if (!Array.isArray(lojas) || lojas.length === 0) {
    console.error('data/lojas-br.json ausente ou vazio.');
    process.exit(1);
  }

  const { dados, logCompleto } = await gerarPrecosVarejo(catalogo, lojas);

  const contagemPorPadrao = new Map();
  for (const entrada of logCompleto) {
    const padrao = categorizarCaminho(entrada.caminho);
    contagemPorPadrao.set(padrao, (contagemPorPadrao.get(padrao) || 0) + 1);
  }
  console.log('URLs requisitadas por padrão de caminho:');
  for (const [padrao, n] of [...contagemPorPadrao.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${padrao}: ${n}`);
  }

  const n = catalogo.discos.length;
  const ofertasPorDisco = Object.values(dados.discos);
  const comOferta = ofertasPorDisco.filter((o) => o.length > 0).length;
  const totalOfertas = ofertasPorDisco.reduce((acc, o) => acc + o.length, 0);
  const requisicoes = dados.lojas.reduce((acc, l) => acc + l.requisicoes, 0);
  const tempo = formatarTempo(Date.now() - inicio);
  console.log(`OK ${n} discos · com oferta BR ${comOferta} · ofertas ${totalOfertas} · requisições ${requisicoes} · ${tempo}`);
}

const ehModuloPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ehModuloPrincipal) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
