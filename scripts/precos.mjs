// Preços de referência (v4). Lê data/catalogo.json, consulta o Discogs Marketplace
// (sem token: stats/lowest_price; com token: sugestão por condição) e cruza com
// data/precos-observados.csv (preços vistos manualmente pelo dono).
// Escreve data/precos.json e data/precos-relatorio.md.
// Ver CONTRATO.md — seção "Preços de referência (v4) — scripts/precos.mjs".
//
// Uso: node scripts/precos.mjs [--propor [--margem=1.00]]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chamarDiscogs, escreverJsonAtomic, lerJsonSeExistir, parseLinha } from './build-catalogo.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DISCOS_TXT = path.join(ROOT_DIR, 'discos.txt');
const DISCOS_PROPOSTOS_TXT = path.join(ROOT_DIR, 'discos.propostos.txt');
const CATALOGO_JSON = path.join(DATA_DIR, 'catalogo.json');
const PRECOS_OBSERVADOS_CSV = path.join(DATA_DIR, 'precos-observados.csv');
const PRECOS_JSON = path.join(DATA_DIR, 'precos.json');
const PRECOS_RELATORIO_MD = path.join(DATA_DIR, 'precos-relatorio.md');

const CACHE_FRESCURA_MS = 6 * 60 * 60 * 1000; // 6h — mesmo teto do cache de release do pipeline

// ---------------------------------------------------------------------------
// Funções puras (exportadas para teste — não fazem I/O nem rede)
// ---------------------------------------------------------------------------

/** Divide uma linha de CSV respeitando aspas duplas (campo pode conter vírgula). */
export function dividirLinhaCsv(linha) {
  const campos = [];
  let atual = '';
  let entreAspas = false;
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i += 1;
        } else {
          entreAspas = false;
        }
      } else {
        atual += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === ',') {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

/**
 * Parse de data/precos-observados.csv. Linhas em branco e começadas com "#" (inclusive os 2
 * exemplos do cabeçalho do arquivo) são ignoradas; a 1ª linha não comentada é o cabeçalho.
 * Linha com id ou preco inválido é ignorada e entra em `avisos`, sem interromper o parse.
 * Devolve { porId: Map<number, {preco, fonte, data, link}[]>, avisos: string[] }.
 */
export function parseCsvObservados(conteudo) {
  const porId = new Map();
  const avisos = [];
  let cabecalhoVisto = false;
  for (const bruta of String(conteudo ?? '').split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha || linha.startsWith('#')) continue;
    if (!cabecalhoVisto) {
      cabecalhoVisto = true;
      continue;
    }
    const [idTxt, precoTxt, fonte, data, link] = dividirLinhaCsv(linha);
    const id = Number(idTxt);
    const preco = Number(precoTxt);
    if (!Number.isInteger(id) || id <= 0) {
      avisos.push(`id inválido: ${linha}`);
      continue;
    }
    if (!Number.isFinite(preco) || preco <= 0) {
      avisos.push(`preco inválido: ${linha}`);
      continue;
    }
    const entrada = { preco: Math.round(preco), fonte: fonte || '', data: data || '', link: link || null };
    if (!porId.has(id)) porId.set(id, []);
    porId.get(id).push(entrada);
  }
  return { porId, avisos };
}

/** Observações de um id; id sem nenhuma linha (inclusive id que não existe no catálogo) → []. */
export function observadosParaId(porId, id) {
  return porId.get(id) || [];
}

/** Mediana de uma lista de números; ímpar → valor do meio, par → média dos 2 do meio. */
export function mediana(valores) {
  const nums = (Array.isArray(valores) ? valores : [])
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .slice()
    .sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const meio = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return nums[meio];
  return (nums[meio - 1] + nums[meio]) / 2;
}

/** { "Mint (M)": {currency,value}, ... } → sugestaoMint/sugestaoNM/moeda/moedaDiferente. */
export function extrairSugestoes(dadosCondicoes) {
  if (!dadosCondicoes || typeof dadosCondicoes !== 'object') {
    return { sugestaoMint: null, sugestaoNM: null, moeda: null, moedaDiferente: false };
  }
  const sugestaoMint = dadosCondicoes['Mint (M)'] ?? null;
  const sugestaoNM = dadosCondicoes['Near Mint (NM or M-)'] ?? null;
  const moeda = sugestaoMint?.currency ?? sugestaoNM?.currency ?? null;
  const moedaDiferente = moeda !== null && moeda !== 'BRL';
  return { sugestaoMint, sugestaoNM, moeda, moedaDiferente };
}

/** { num_for_sale, lowest_price: {value,currency}|null } → menorAnuncioBRL/aVenda. */
export function extrairEstatisticasMercado(dadosStats) {
  if (!dadosStats || typeof dadosStats !== 'object') return { menorAnuncioBRL: null, aVenda: null };
  const aVenda = Number.isFinite(dadosStats.num_for_sale) ? dadosStats.num_for_sale : null;
  const menorAnuncioBRL =
    dadosStats.lowest_price && typeof dadosStats.lowest_price.value === 'number'
      ? dadosStats.lowest_price.value
      : null;
  return { menorAnuncioBRL, aVenda };
}

/** sugestaoMint só entra na mediana se a moeda da conta for BRL — moeda diferente exclui. */
export function valorSugestaoSeBRL(sugestaoMint, moeda) {
  if (!sugestaoMint || moeda !== 'BRL') return null;
  return typeof sugestaoMint.value === 'number' ? sugestaoMint.value : null;
}

/**
 * referenciaBRL = mediana(sugestaoMintBRL?, menorAnuncioBRL?, observadosPrecos...), arredondada
 * para inteiro; base = lista das fontes que entraram. Nenhuma fonte → { null, [] }.
 */
export function calcularReferenciaBRL({ sugestaoMintBRL, menorAnuncioBRL, observadosPrecos }) {
  const valores = [];
  const base = [];
  if (typeof sugestaoMintBRL === 'number' && Number.isFinite(sugestaoMintBRL)) {
    valores.push(sugestaoMintBRL);
    base.push('discogs-sugestao');
  }
  if (typeof menorAnuncioBRL === 'number' && Number.isFinite(menorAnuncioBRL)) {
    valores.push(menorAnuncioBRL);
    base.push('discogs-menor');
  }
  const observados = (Array.isArray(observadosPrecos) ? observadosPrecos : []).filter(
    (v) => typeof v === 'number' && Number.isFinite(v),
  );
  if (observados.length > 0) {
    valores.push(...observados);
    base.push('observado');
  }
  if (valores.length === 0) return { referenciaBRL: null, base: [] };
  return { referenciaBRL: Math.round(mediana(valores)), base };
}

/** Arredonda para o múltiplo de 5 mais próximo. */
export function arredondarMultiplo5(valor) {
  return Math.round(valor / 5) * 5;
}

/** referenciaBRL × margem, arredondado para múltiplo de 5; sem referência → null. */
export function precoProposto(referenciaBRL, margem = 1.0) {
  if (referenciaBRL == null || !Number.isFinite(referenciaBRL)) return null;
  const m = Number.isFinite(margem) ? margem : 1.0;
  return arredondarMultiplo5(referenciaBRL * m);
}

function formatarReais(valor) {
  return `R$ ${Math.round(valor)}`;
}

/** Uma linha da tabela de data/precos-relatorio.md para um disco + seu registro de preços. */
export function linhaRelatorio(disco, info) {
  const nome = `${disco.artista} – ${disco.titulo}`;
  const registro = info || {};
  const aVenda = registro.aVenda != null ? String(registro.aVenda) : '—';
  const menor = registro.menorAnuncioBRL != null ? formatarReais(registro.menorAnuncioBRL) : '—';
  const sugestaoM =
    registro.sugestaoMint && typeof registro.sugestaoMint.value === 'number'
      ? `${registro.sugestaoMint.value} ${registro.sugestaoMint.currency}`
      : '—';
  const observados =
    Array.isArray(registro.observados) && registro.observados.length > 0
      ? registro.observados.map((o) => formatarReais(o.preco)).join(', ')
      : '—';
  const referencia = registro.referenciaBRL != null ? formatarReais(registro.referenciaBRL) : '—';
  const atual = disco.preco != null ? formatarReais(disco.preco) : 'Sob consulta';
  return `| ${disco.ordem} | ${nome} | ${aVenda} | ${menor} | ${sugestaoM} | ${observados} | ${referencia} | ${atual} |`;
}

/** Monta o markdown completo do relatório a partir do catálogo (ordenado por `ordem`) e dos registros. */
export function gerarRelatorioMd(discosCatalogo, discosPorId, geradoEm) {
  const linhas = [
    '| ordem | artista – título | à venda | menor anúncio (BRL) | sugestão M | observados | referência | preço atual |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  const ordenados = [...discosCatalogo].sort((a, b) => a.ordem - b.ordem);
  let comReferencia = 0;
  for (const disco of ordenados) {
    const info = discosPorId[String(disco.id)];
    if (info && info.referenciaBRL != null) comReferencia += 1;
    linhas.push(linhaRelatorio(disco, info));
  }
  const semReferencia = ordenados.length - comReferencia;
  linhas.push('');
  linhas.push(
    `Gerado em ${geradoEm} · ${comReferencia} disco(s) com referência de preço · ${semReferencia} sem referência.`,
  );
  return `${linhas.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// I/O e rede
// ---------------------------------------------------------------------------

let chamadasContador = 0;

async function chamarComContagem(url, contexto) {
  chamadasContador += 1;
  return chamarDiscogs(url, contexto);
}

async function obterEstatisticasMercado(id) {
  const dados = await chamarComContagem(
    `https://api.discogs.com/marketplace/stats/${id}?curr_abbr=BRL`,
    `marketplace/stats/${id}`,
  );
  return extrairEstatisticasMercado(dados);
}

async function obterSugestoes(id) {
  const dados = await chamarComContagem(
    `https://api.discogs.com/marketplace/price_suggestions/${id}`,
    `price_suggestions/${id}`,
  );
  return extrairSugestoes(dados);
}

async function lerArquivoTextoSeExistir(caminho) {
  try {
    return await fs.readFile(caminho, 'utf8');
  } catch {
    return null;
  }
}

function precosEstaoFrescos(consultadoEm) {
  const t = new Date(consultadoEm ?? '').getTime();
  return Number.isFinite(t) && Date.now() - t < CACHE_FRESCURA_MS;
}

async function processarDisco(disco, observadosPorId, temToken) {
  let menorAnuncioBRL = null;
  let aVenda = null;
  try {
    ({ menorAnuncioBRL, aVenda } = await obterEstatisticasMercado(disco.id));
  } catch (err) {
    console.error(`aviso: falha em marketplace/stats/${disco.id}: ${err.message}`);
  }

  let sugestaoMint = null;
  let sugestaoNM = null;
  let moeda = null;
  let moedaDiferente = false;
  if (temToken) {
    try {
      ({ sugestaoMint, sugestaoNM, moeda, moedaDiferente } = await obterSugestoes(disco.id));
    } catch (err) {
      console.error(`aviso: falha em price_suggestions/${disco.id}: ${err.message}`);
    }
  }

  const observados = observadosParaId(observadosPorId, disco.id).map(({ preco, fonte, data }) => ({
    preco,
    fonte,
    data,
  }));

  const sugestaoMintBRL = valorSugestaoSeBRL(sugestaoMint, moeda);
  const { referenciaBRL, base } = calcularReferenciaBRL({
    sugestaoMintBRL,
    menorAnuncioBRL,
    observadosPrecos: observados.map((o) => o.preco),
  });

  return {
    menorAnuncioBRL,
    aVenda,
    sugestaoMint,
    sugestaoNM,
    moeda,
    moedaDiferente,
    observados,
    referenciaBRL,
    base,
  };
}

async function gerarPrecos(catalogo) {
  const csvConteudo = await lerArquivoTextoSeExistir(PRECOS_OBSERVADOS_CSV);
  const { porId: observadosPorId, avisos } = parseCsvObservados(csvConteudo);
  for (const aviso of avisos) console.error(`aviso csv precos-observados: ${aviso}`);

  const temToken = Boolean(process.env.DISCOGS_TOKEN);
  const discosPorId = {};
  for (const disco of catalogo.discos) {
    discosPorId[String(disco.id)] = await processarDisco(disco, observadosPorId, temToken);
  }

  const consultadoEm = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await escreverJsonAtomic(PRECOS_JSON, { consultadoEm, discos: discosPorId });
  await fs.writeFile(PRECOS_RELATORIO_MD, gerarRelatorioMd(catalogo.discos, discosPorId, consultadoEm), 'utf8');

  return { consultadoEm, discos: discosPorId };
}

async function gerarPropostos(dadosPrecos, catalogo, margem) {
  const catalogoPorOrdem = new Map();
  for (const disco of catalogo.discos) catalogoPorOrdem.set(disco.ordem, disco);

  const conteudo = await fs.readFile(DISCOS_TXT, 'utf8');
  const linhasBrutas = conteudo.split(/\r?\n/);
  let secaoAtual = null;
  let ordem = 0;
  const saida = [];

  for (const bruta of linhasBrutas) {
    const linha = bruta.trim();
    if (!linha) {
      saida.push(bruta);
      continue;
    }
    if (linha.startsWith('##')) {
      secaoAtual = linha.replace(/^#+\s*/, '').trim();
      saida.push(bruta);
      continue;
    }
    if (linha.startsWith('#')) {
      saida.push(bruta);
      continue;
    }
    ordem += 1;
    const parsed = parseLinha(bruta, secaoAtual);
    if (!parsed.ok || parsed.opts.preco !== null) {
      saida.push(bruta);
      continue;
    }
    const discoCatalogo = catalogoPorOrdem.get(ordem);
    const registro = discoCatalogo ? dadosPrecos.discos[String(discoCatalogo.id)] : null;
    const referenciaBRL = registro?.referenciaBRL ?? null;
    if (referenciaBRL == null) {
      saida.push(bruta);
      continue;
    }
    const proposto = precoProposto(referenciaBRL, margem);
    saida.push(`${bruta.replace(/\s+$/, '')} | preco=${proposto}`);
  }

  // `saida` tem um elemento por posição de `linhasBrutas` (inclusive o "" final que o
  // split(/\r?\n/) produz quando o arquivo termina em \n) — juntar com "\n" reconstrói
  // exatamente a mesma contagem de linhas do arquivo original, sem "\n" extra no fim.
  await fs.writeFile(DISCOS_PROPOSTOS_TXT, saida.join('\n'), 'utf8');
}

function formatarTempo(ms) {
  const totalS = Math.round(ms / 1000);
  const m = Math.floor(totalS / 60);
  const s = totalS % 60;
  return m > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${s}s`;
}

async function main() {
  const inicio = Date.now();
  const proporFlag = process.argv.includes('--propor');
  const margemArg = process.argv.find((a) => a.startsWith('--margem='));
  const margemParsed = margemArg ? Number(margemArg.slice('--margem='.length)) : 1.0;
  const margem = Number.isFinite(margemParsed) ? margemParsed : 1.0;

  const catalogo = await lerJsonSeExistir(CATALOGO_JSON);
  if (!catalogo || !Array.isArray(catalogo.discos)) {
    console.error('data/catalogo.json ausente ou inválido — rode "npm run catalogo" primeiro.');
    process.exit(1);
  }

  let dadosPrecos = null;
  let reaproveitouCache = false;

  if (proporFlag) {
    const existente = await lerJsonSeExistir(PRECOS_JSON);
    if (existente && precosEstaoFrescos(existente.consultadoEm)) {
      dadosPrecos = existente;
      reaproveitouCache = true;
    }
  }

  if (!reaproveitouCache) {
    dadosPrecos = await gerarPrecos(catalogo);
  }

  if (proporFlag) {
    await gerarPropostos(dadosPrecos, catalogo, margem);
  }

  const n = catalogo.discos.length;
  const comReferencia = Object.values(dadosPrecos.discos).filter((d) => d.referenciaBRL != null).length;
  const tempo = formatarTempo(Date.now() - inicio);
  console.log(`OK ${n} discos · com referência ${comReferencia} · chamadas ${chamadasContador} · ${tempo}`);
}

const ehModuloPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ehModuloPrincipal) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
