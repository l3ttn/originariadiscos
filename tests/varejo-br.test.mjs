import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseRobotsTxt,
  caminhoCasaPadrao,
  permiteCaminho,
  caminhoDaUrl,
  intervaloDoHost,
  requisitarRespeitandoRobots,
  extrairLocs,
  filtrarSubSitemapsDeProduto,
  extrairPreco,
  extrairDisponivel,
  extrairNomeProduto,
  slugDaUrl,
  slugCasaDisco,
  escolherUrlsCandidatas,
  casaTituloEArtista,
  dedupUrls,
  dedupOfertasPorUrl,
} from '../scripts/varejo-br.mjs';

const ROBOTS_LOJA_INTEGRADA = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /buscar',
  'Disallow: /api/*',
  'Disallow: /*fq=*',
  'Disallow: /conta/*',
  'Disallow: /carrinho/*',
  'Disallow: /static/*',
  'Disallow: /store/*',
  'Crawl-delay: 10',
].join('\n');

// --- robots.txt --------------------------------------------------------------------------

test('parseRobotsTxt: lê Crawl-delay do grupo "*"', () => {
  const parsed = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  assert.equal(parsed.crawlDelay, 10);
  assert.equal(parsed.regras.length, 8);
});

test('permiteCaminho: /buscar?q=x é proibido (Disallow: /buscar vence Allow: /)', () => {
  const parsed = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  assert.equal(permiteCaminho(parsed, '/buscar?q=x'), false);
});

test('permiteCaminho: página de produto é permitida (só casa com Allow: /)', () => {
  const parsed = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  assert.equal(permiteCaminho(parsed, '/lp-jorge-ben-africa-brasil-vinil-polysom-lacrado-hm-2025-12-10-15-10-29'), true);
});

test('permiteCaminho: /api/pedidos é proibido (Disallow: /api/*)', () => {
  const parsed = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  assert.equal(permiteCaminho(parsed, '/api/pedidos'), false);
});

test('permiteCaminho: /produto?fq=cor:preto é proibido (Disallow: /*fq=*)', () => {
  const parsed = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  assert.equal(permiteCaminho(parsed, '/produto?fq=cor:preto'), false);
});

test('caminhoCasaPadrao: "$" ancora o fim da URL', () => {
  assert.equal(caminhoCasaPadrao('/produto.html', '/produto.html$'), true);
  assert.equal(caminhoCasaPadrao('/produto.html.bak', '/produto.html$'), false);
});

test('caminhoDaUrl / intervaloDoHost: path+query, e max(Crawl-delay, 3s)', () => {
  assert.equal(caminhoDaUrl('https://loja.example.com/buscar?q=x'), '/buscar?q=x');
  assert.equal(intervaloDoHost(10), 10000);
  assert.equal(intervaloDoHost(null), 3000);
  assert.equal(intervaloDoHost(1), 3000); // 1s de Crawl-delay não baixa do mínimo de 3s
});

// --- agendador: nunca chama fetch para URL proibida; respeita o intervalo ------------------

test('requisitarRespeitandoRobots: nunca chama o fetch injetado para URL proibida pelo robots', async () => {
  const robots = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  let chamouFetch = false;
  const log = [];
  const resultado = await requisitarRespeitandoRobots({
    url: 'https://loja.example.com/buscar?q=madvillainy',
    robots,
    estadoHost: {},
    intervaloMs: 10000,
    fetchFn: async () => {
      chamouFetch = true;
      return 'nunca deveria chegar aqui';
    },
    dormir: async () => {},
    agora: () => 0,
    log,
  });
  assert.equal(chamouFetch, false);
  assert.equal(resultado.bloqueada, true);
  assert.equal(resultado.dados, null);
  assert.equal(log.length, 1);
  assert.equal(log[0].bloqueada, true);
});

test('requisitarRespeitandoRobots: respeita o intervalo entre chamadas ao mesmo host (relógio injetado)', async () => {
  const robots = parseRobotsTxt(ROBOTS_LOJA_INTEGRADA);
  let relogio = 0;
  const esperas = [];
  const estadoHost = {};
  const dormir = async (ms) => {
    esperas.push(ms);
    relogio += ms;
  };
  const agora = () => relogio;
  const fetchFn = async () => 'ok';

  await requisitarRespeitandoRobots({
    url: 'https://loja.example.com/disco-a-lp-vinil',
    robots,
    estadoHost,
    intervaloMs: 10000,
    fetchFn,
    dormir,
    agora,
    log: [],
  });
  assert.equal(esperas.length, 0); // 1ª chamada do host: nada para esperar

  relogio += 100; // só 100ms depois, bem menos que o intervalo de 10s
  await requisitarRespeitandoRobots({
    url: 'https://loja.example.com/disco-b-lp-vinil',
    robots,
    estadoHost,
    intervaloMs: 10000,
    fetchFn,
    dormir,
    agora,
    log: [],
  });
  assert.equal(esperas.length, 1);
  assert.ok(esperas[0] >= 9900 && esperas[0] <= 10000, `esperou ${esperas[0]}ms, esperava ~9900ms`);
});

// --- sitemap ---------------------------------------------------------------------------------

test('extrairLocs: lê todos os <loc> de um XML de sitemap', () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://www.hipmusic.com.br/sitemap/product-1.xml</loc></url>
    <url><loc>https://www.hipmusic.com.br/sitemap/product-2.xml</loc></url>
  </urlset>`;
  assert.deepEqual(extrairLocs(xml), [
    'https://www.hipmusic.com.br/sitemap/product-1.xml',
    'https://www.hipmusic.com.br/sitemap/product-2.xml',
  ]);
});

test('filtrarSubSitemapsDeProduto: só mantém locs de .../sitemap/product-N.xml', () => {
  const locs = [
    'https://www.hipmusic.com.br/sitemap/product-1.xml',
    'https://www.hipmusic.com.br/sitemap/category-1.xml',
    'https://www.hipmusic.com.br/sitemap/page-1.xml',
  ];
  assert.deepEqual(filtrarSubSitemapsDeProduto(locs), ['https://www.hipmusic.com.br/sitemap/product-1.xml']);
});

// --- casamento de slug -------------------------------------------------------------------

const JORGE_BEN_AFRICA_BRASIL = { artista: 'Jorge Ben', titulo: 'África Brasil' };

test('slugCasaDisco: aceita o slug real medido da HipMusic', () => {
  const slug = 'lp-jorge-ben-africa-brasil-vinil-polysom-lacrado-hm-2025-12-10-15-10-29';
  assert.equal(slugCasaDisco(JORGE_BEN_AFRICA_BRASIL, slug), true);
});

test('slugCasaDisco: rejeita box set mesmo citando o artista (termo excluído "box")', () => {
  const disco = { artista: 'Jorge Ben', titulo: 'Jorge, Alô Alô' };
  const slug = 'box-5-cds-jorge-ben-jor-alo-alo-novo-lacrado-hm';
  assert.equal(slugCasaDisco(disco, slug), false);
});

test('slugCasaDisco: rejeita kit mesmo quando título e artista casam (termo excluído "kit")', () => {
  const slug = 'kit-disco-de-vinil-lp-jorge-ben-a-tabua-da-esmeralda-africa-brasil';
  assert.equal(slugCasaDisco(JORGE_BEN_AFRICA_BRASIL, slug), false);
});

test('slugCasaDisco: rejeita quando falta "lp"/"vinil" no slug', () => {
  const slug = 'jorge-ben-africa-brasil-novo-lacrado';
  assert.equal(slugCasaDisco(JORGE_BEN_AFRICA_BRASIL, slug), false);
});

test('slugCasaDisco: rejeita quando falta um token do título', () => {
  const slug = 'lp-jorge-ben-africa-vinil-lacrado'; // falta "brasil"
  assert.equal(slugCasaDisco(JORGE_BEN_AFRICA_BRASIL, slug), false);
});

test('escolherUrlsCandidatas: casa, ordena por menos tokens extras e limita a 3', () => {
  const urls = [
    'https://loja.example.com/lp-jorge-ben-africa-brasil-vinil-polysom-lacrado-hm-2025-12-10-15-10-29',
    'https://loja.example.com/lp-jorge-ben-africa-brasil-vinil',
    'https://loja.example.com/cd-jorge-ben-africa-brasil', // excluído (cd, sem lp/vinil)
    'https://loja.example.com/lp-outro-disco-qualquer-vinil',
  ];
  const candidatas = escolherUrlsCandidatas(urls, JORGE_BEN_AFRICA_BRASIL, 3);
  assert.deepEqual(candidatas, [
    'https://loja.example.com/lp-jorge-ben-africa-brasil-vinil',
    'https://loja.example.com/lp-jorge-ben-africa-brasil-vinil-polysom-lacrado-hm-2025-12-10-15-10-29',
  ]);
});

test('slugDaUrl: pega o último segmento do path', () => {
  assert.equal(slugDaUrl('https://www.hipmusic.com.br/lp-jorge-ben-africa-brasil'), 'lp-jorge-ben-africa-brasil');
});

// --- página do produto ------------------------------------------------------------------

const HTML_PRODUTO = `
<html><head>
<meta property="og:title" content="LP Jorge Ben - África Brasil - Vinil - Polysom - Lacrado">
<meta property="product:price:amount" content="220.00">
</head><body>
<span itemprop="price" content="220.00"></span>
<link itemprop="availability" href="http://schema.org/InStock">
<h1>LP Jorge Ben - África Brasil - Vinil - Polysom - Lacrado</h1>
</body></html>`;

test('extrairPreco: lê itemprop="price" content="220.00"', () => {
  assert.equal(extrairPreco(HTML_PRODUTO), 220);
});

test('extrairPreco: cai para product:price:amount quando não há itemprop="price"', () => {
  const html = '<meta property="product:price:amount" content="180.00">';
  assert.equal(extrairPreco(html), 180);
});

test('extrairPreco: sem nenhum dos dois marcadores devolve null', () => {
  assert.equal(extrairPreco('<p>sem preço aqui</p>'), null);
});

test('extrairDisponivel: true com schema.org/InStock, false sem', () => {
  assert.equal(extrairDisponivel(HTML_PRODUTO), true);
  assert.equal(extrairDisponivel('<p>sem disponibilidade</p>'), false);
});

test('extrairNomeProduto: prefere og:title, cai para <h1>', () => {
  assert.equal(extrairNomeProduto(HTML_PRODUTO), 'LP Jorge Ben - África Brasil - Vinil - Polysom - Lacrado');
  assert.equal(extrairNomeProduto('<h1>Só o H1</h1>'), 'Só o H1');
  assert.equal(extrairNomeProduto('<p>nada</p>'), null);
});

// --- dedup (sitemaps na prática repetem <loc>; medido na HipMusic: 2607 de 8442 duplicados) --

test('dedupUrls: remove repetidas preservando a 1ª ocorrência e a ordem', () => {
  const urls = ['https://a.example.com/x', 'https://a.example.com/y', 'https://a.example.com/x'];
  assert.deepEqual(dedupUrls(urls), ['https://a.example.com/x', 'https://a.example.com/y']);
});

test('dedupOfertasPorUrl: 2 ofertas iguais (mesma url) da mesma URL vista 2x no sitemap colapsam em 1', () => {
  const oferta = { loja: 'HipMusic', nome: 'LP Jorge Ben - África Brasil', preco: 220, url: 'https://hipmusic.com.br/x', disponivel: true };
  const outraLoja = { loja: 'Vinil Discos', nome: 'Disco de Vinil Jorge Ben África Brasil', preco: 206.82, url: 'https://vinildiscos.com.br/y', disponivel: true };
  assert.deepEqual(dedupOfertasPorUrl([oferta, { ...oferta }, outraLoja]), [oferta, outraLoja]);
});

test('casaTituloEArtista: nome extraído da página precisa casar título+artista', () => {
  const nome = extrairNomeProduto(HTML_PRODUTO);
  assert.equal(casaTituloEArtista(JORGE_BEN_AFRICA_BRASIL, nome), true);
  assert.equal(casaTituloEArtista({ artista: 'Outro Artista', titulo: 'Outro Título' }, nome), false);
});
