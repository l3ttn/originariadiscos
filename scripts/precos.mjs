// Preços de referência (v4 / v4.1 / v5). Lê data/catalogo.json, consulta o Discogs
// Marketplace (sem token: stats/lowest_price; com token: sugestão por condição), a reedição
// em vinil mais recente e oficial de cada master (a loja vende novo/lacrado, não a prensagem
// de colecionador — escolha compartilhada com build-catalogo.mjs via discogs-versoes.mjs),
// e cruza com data/precos-observados.csv (preços vistos manualmente pelo dono) e, se existir,
// data/precos-varejo.json (lojas brasileiras, gerado por scripts/varejo-br.mjs).
// Escreve data/precos.json e data/precos-relatorio.md.
// Ver CONTRATO.md — seções "Preços de referência (v4)", "Preços (v4.1)", "Edição à venda
// (v5)" e "Varejo brasileiro (v5)".
//
// Uso: node scripts/precos.mjs [--propor [--margem=1.00]]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chamarDiscogs, escreverJsonAtomic, lerJsonSeExistir, parseLinha, obterContadorChamadas } from './build-catalogo.mjs';
import { filtrarVersoesOficiais, escolherCandidatasReedicao, obterVersoesReedicao } from './discogs-versoes.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DISCOS_TXT = path.join(ROOT_DIR, 'discos.txt');
const DISCOS_PROPOSTOS_TXT = path.join(ROOT_DIR, 'discos.propostos.txt');
const CATALOGO_JSON = path.join(DATA_DIR, 'catalogo.json');
const PRECOS_OBSERVADOS_CSV = path.join(DATA_DIR, 'precos-observados.csv');
const PRECOS_VAREJO_JSON = path.join(DATA_DIR, 'precos-varejo.json');
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
 * Garante que a versão de `disco.edicaoVenda` entra primeiro nas candidatas de reedição
 * (dedup por id) — CONTRATO.md "Edição à venda (v5)": "esse id entra primeiro na lista de
 * candidatas de reedição". Sem edicaoVenda, devolve as candidatas automáticas sem alteração.
 */
export function priorizarEdicaoVenda(candidatas, edicaoVenda) {
  const lista = Array.isArray(candidatas) ? candidatas : [];
  if (!edicaoVenda?.id) return lista;
  const resto = lista.filter((c) => c?.id !== edicaoVenda.id);
  const pseudoCandidata = {
    id: edicaoVenda.id,
    released: edicaoVenda.ano != null ? String(edicaoVenda.ano) : '',
    country: edicaoVenda.pais ?? null,
    label: edicaoVenda.selo ?? null,
    catno: edicaoVenda.catno ?? null,
  };
  return [pseudoCandidata, ...resto];
}

/** "2020", "2020-05-12" → 2020; sem 4 dígitos no início → null. */
export function anoDeReleased(released) {
  const m = /^(\d{4})/.exec(String(released ?? ''));
  return m ? Number(m[1]) : null;
}

/**
 * menorAnuncioBRL da reedição a usar como referência. Com `preferirId` (CONTRATO.md "Edição
 * à venda (v5)": id de `edicaoVenda`) e essa reedição tendo exemplar à venda, usa o preço
 * dela; senão (ou sem `preferirId`) cai no menor menorAnuncioBRL entre as com exemplar à
 * venda. Nenhuma com anúncio → null.
 */
export function calcularReedicaoBRL(reedicoes, preferirId) {
  const lista = Array.isArray(reedicoes) ? reedicoes : [];
  if (preferirId != null) {
    const preferida = lista.find((r) => r?.id === preferirId);
    if (preferida && typeof preferida.menorAnuncioBRL === 'number' && Number.isFinite(preferida.menorAnuncioBRL)) {
      return preferida.menorAnuncioBRL;
    }
  }
  const valores = lista.map((r) => r?.menorAnuncioBRL).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return valores.length > 0 ? Math.min(...valores) : null;
}

/** Reedição a mostrar no relatório: a que tem anúncio (= a de calcularReedicaoBRL), senão a mais recente. */
export function reedicaoPrincipal(reedicoes) {
  if (!Array.isArray(reedicoes) || reedicoes.length === 0) return null;
  const comAnuncio = reedicoes.find((r) => typeof r.menorAnuncioBRL === 'number' && Number.isFinite(r.menorAnuncioBRL));
  return comAnuncio || reedicoes[0];
}

/**
 * referenciaBRL = mediana(sugestaoMintBRL?, reedicaoBRL ?? menorAnuncioOriginalBRL?,
 * observados..., varejo...), arredondada para inteiro; base = lista das fontes que entraram.
 * A original só entra se NÃO houver reedição com anúncio (reedicaoBRL null). `varejoPrecos`
 * (CONTRATO.md "Varejo brasileiro (v5)": ofertas `disponivel: true` de data/precos-varejo.json)
 * entra com base `"varejo-br"`. Nenhuma fonte → { null, [] }.
 */
export function calcularReferenciaBRL({
  sugestaoMintBRL,
  reedicaoBRL,
  menorAnuncioOriginalBRL,
  observadosPrecos,
  varejoPrecos,
}) {
  const valores = [];
  const base = [];
  if (typeof sugestaoMintBRL === 'number' && Number.isFinite(sugestaoMintBRL)) {
    valores.push(sugestaoMintBRL);
    base.push('discogs-sugestao');
  }
  if (typeof reedicaoBRL === 'number' && Number.isFinite(reedicaoBRL)) {
    valores.push(reedicaoBRL);
    base.push('discogs-reedicao');
  } else if (typeof menorAnuncioOriginalBRL === 'number' && Number.isFinite(menorAnuncioOriginalBRL)) {
    valores.push(menorAnuncioOriginalBRL);
    base.push('discogs-original');
  }
  const observados = (Array.isArray(observadosPrecos) ? observadosPrecos : []).filter(
    (v) => typeof v === 'number' && Number.isFinite(v),
  );
  if (observados.length > 0) {
    valores.push(...observados);
    base.push('observado');
  }
  const varejo = (Array.isArray(varejoPrecos) ? varejoPrecos : []).filter(
    (v) => typeof v === 'number' && Number.isFinite(v),
  );
  if (varejo.length > 0) {
    valores.push(...varejo);
    base.push('varejo-br');
  }
  if (valores.length === 0) return { referenciaBRL: null, base: [] };
  return { referenciaBRL: Math.round(mediana(valores)), base };
}

/** Ofertas de varejo brasileiro (data/precos-varejo.json) com `disponivel === true` e `preco` numérico. */
export function ofertasVarejoDisponiveis(ofertas) {
  return (Array.isArray(ofertas) ? ofertas : []).filter(
    (o) => o?.disponivel === true && typeof o?.preco === 'number' && Number.isFinite(o.preco),
  );
}

/** Coluna "varejo BR (n · menor–maior)" do relatório; sem oferta disponível → "—". */
export function formatarColunaVarejo(ofertasDisponiveis) {
  const lista = Array.isArray(ofertasDisponiveis) ? ofertasDisponiveis : [];
  if (lista.length === 0) return '—';
  const precos = lista.map((o) => o.preco);
  return `${lista.length} · ${formatarReais(Math.min(...precos))}–${formatarReais(Math.max(...precos))}`;
}

/**
 * Recalcula observados/referenciaBRL/base de um registro já existente (vindo de data/precos.json
 * em cache) a partir de novas linhas do CSV — usado por `--propor` quando reaproveita o cache de
 * rede (< 6h) mas a planilha de preços observados pode ter mudado nesse meio-tempo. Não refaz
 * nenhuma chamada de rede: reusa menorAnuncioBRL/reedicaoBRL/sugestaoMint já cacheados.
 */
export function recalcularComObservados(registro, observadosDoDisco) {
  const observados = (Array.isArray(observadosDoDisco) ? observadosDoDisco : []).map(({ preco, fonte, data }) => ({
    preco,
    fonte,
    data,
  }));
  const sugestaoMintBRL = valorSugestaoSeBRL(registro.sugestaoMint, registro.moeda);
  const varejoPrecos = ofertasVarejoDisponiveis(registro.varejoOfertas).map((o) => o.preco);
  const { referenciaBRL, base } = calcularReferenciaBRL({
    sugestaoMintBRL,
    reedicaoBRL: registro.reedicaoBRL,
    menorAnuncioOriginalBRL: registro.menorAnuncioBRL,
    observadosPrecos: observados.map((o) => o.preco),
    varejoPrecos,
  });
  return { ...registro, observados, referenciaBRL, base };
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
  const original = registro.menorAnuncioBRL != null ? formatarReais(registro.menorAnuncioBRL) : '—';
  const reedicaoRef = reedicaoPrincipal(registro.reedicoes);
  const reedicaoTxt = reedicaoRef
    ? `${reedicaoRef.ano ?? '—'} · ${reedicaoRef.selo ?? '—'} · ${reedicaoRef.pais ?? '—'}`
    : '—';
  const reedicaoAnuncio = registro.reedicaoBRL != null ? formatarReais(registro.reedicaoBRL) : '—';
  const sugestaoM =
    registro.sugestaoMint && typeof registro.sugestaoMint.value === 'number'
      ? `${registro.sugestaoMint.value} ${registro.sugestaoMint.currency}`
      : '—';
  const observados =
    Array.isArray(registro.observados) && registro.observados.length > 0
      ? registro.observados.map((o) => formatarReais(o.preco)).join(', ')
      : '—';
  const varejoTxt = formatarColunaVarejo(registro.varejoOfertas);
  const referencia = registro.referenciaBRL != null ? formatarReais(registro.referenciaBRL) : '—';
  const atual = disco.preco != null ? formatarReais(disco.preco) : 'Sob consulta';
  return `| ${disco.ordem} | ${nome} | ${aVenda} | ${original} | ${reedicaoTxt} | ${reedicaoAnuncio} | ${sugestaoM} | ${observados} | ${varejoTxt} | ${referencia} | ${atual} |`;
}

/** Monta o markdown completo do relatório a partir do catálogo (ordenado por `ordem`) e dos registros. */
export function gerarRelatorioMd(discosCatalogo, discosPorId, geradoEm) {
  const linhas = [
    '| ordem | artista – título | à venda | original (BRL) | reedição (ano · selo · país) | menor anúncio reedição (BRL) | sugestão M | observados | varejo BR (n · menor–maior) | referência | preço atual |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
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

// Contador de chamadas: `obterContadorChamadas()` (build-catalogo.mjs) é o único — incrementa
// dentro de `chamarDiscogs`, então já conta as chamadas feitas por aqui e por
// discogs-versoes.mjs (obterVersoesReedicao), sem precisar de um contador local duplicado.

async function obterEstatisticasMercado(id) {
  const dados = await chamarDiscogs(
    `https://api.discogs.com/marketplace/stats/${id}?curr_abbr=BRL`,
    `marketplace/stats/${id}`,
  );
  return extrairEstatisticasMercado(dados);
}

async function obterSugestoes(id) {
  const dados = await chamarDiscogs(
    `https://api.discogs.com/marketplace/price_suggestions/${id}`,
    `price_suggestions/${id}`,
  );
  return extrairSugestoes(dados);
}

/**
 * reedicoes[] de um disco (id, ano, país, selo, catno, à venda, menor anúncio) via candidatas
 * (`escolherCandidatasReedicao`/`filtrarVersoesOficiais`, de discogs-versoes.mjs). Com
 * `edicaoVenda`, o id dela entra primeiro (CONTRATO.md "Edição à venda (v5)").
 */
async function obterReedicoes(masterId, edicaoVenda) {
  if (!masterId) return [];
  let versoesBrutas;
  try {
    versoesBrutas = await obterVersoesReedicao(masterId);
  } catch (err) {
    console.error(`aviso: falha em masters/${masterId}/versions: ${err.message}`);
    return [];
  }
  const candidatas = priorizarEdicaoVenda(escolherCandidatasReedicao(filtrarVersoesOficiais(versoesBrutas)), edicaoVenda);
  const reedicoes = [];
  for (const candidata of candidatas) {
    let stats = { menorAnuncioBRL: null, aVenda: null };
    try {
      stats = await obterEstatisticasMercado(candidata.id);
    } catch (err) {
      console.error(`aviso: falha em marketplace/stats/${candidata.id} (reedição): ${err.message}`);
    }
    reedicoes.push({
      id: candidata.id,
      ano: anoDeReleased(candidata.released),
      pais: candidata.country || null,
      selo: candidata.label || null,
      catno: candidata.catno || null,
      aVenda: stats.aVenda,
      menorAnuncioBRL: stats.menorAnuncioBRL,
    });
  }
  return reedicoes;
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

async function processarDisco(disco, observadosPorId, temToken, varejoOfertasPorId) {
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

  const reedicoes = await obterReedicoes(disco.masterId, disco.edicaoVenda);
  const reedicaoBRL = calcularReedicaoBRL(reedicoes, disco.edicaoVenda?.id ?? null);

  const observados = observadosParaId(observadosPorId, disco.id).map(({ preco, fonte, data }) => ({
    preco,
    fonte,
    data,
  }));

  const varejoOfertas = ofertasVarejoDisponiveis(varejoOfertasPorId?.[String(disco.id)]);

  const sugestaoMintBRL = valorSugestaoSeBRL(sugestaoMint, moeda);
  const { referenciaBRL, base } = calcularReferenciaBRL({
    sugestaoMintBRL,
    reedicaoBRL,
    menorAnuncioOriginalBRL: menorAnuncioBRL,
    observadosPrecos: observados.map((o) => o.preco),
    varejoPrecos: varejoOfertas.map((o) => o.preco),
  });

  return {
    menorAnuncioBRL,
    aVenda,
    sugestaoMint,
    sugestaoNM,
    moeda,
    moedaDiferente,
    reedicoes,
    reedicaoBRL,
    observados,
    varejoOfertas,
    referenciaBRL,
    base,
  };
}

/** `data/precos-varejo.json` (gerado por scripts/varejo-br.mjs), se existir; senão `{}`. */
async function lerVarejoSeExistir() {
  const dados = await lerJsonSeExistir(PRECOS_VAREJO_JSON);
  return dados && typeof dados.discos === 'object' && dados.discos !== null ? dados.discos : {};
}

async function gerarPrecos(catalogo) {
  const csvConteudo = await lerArquivoTextoSeExistir(PRECOS_OBSERVADOS_CSV);
  const { porId: observadosPorId, avisos } = parseCsvObservados(csvConteudo);
  for (const aviso of avisos) console.error(`aviso csv precos-observados: ${aviso}`);

  const varejoOfertasPorId = await lerVarejoSeExistir();

  const temToken = Boolean(process.env.DISCOGS_TOKEN);
  const discosPorId = {};
  for (const disco of catalogo.discos) {
    discosPorId[String(disco.id)] = await processarDisco(disco, observadosPorId, temToken, varejoOfertasPorId);
  }

  const consultadoEm = new Date().toISOString();
  await fs.mkdir(DATA_DIR, { recursive: true });
  await escreverJsonAtomic(PRECOS_JSON, { consultadoEm, discos: discosPorId });
  await fs.writeFile(PRECOS_RELATORIO_MD, gerarRelatorioMd(catalogo.discos, discosPorId, consultadoEm), 'utf8');

  return { consultadoEm, discos: discosPorId };
}

/**
 * Caminho sem rede do `--propor` (precos.json com < 6h): relê data/precos-observados.csv e
 * recalcula observados/referenciaBRL/base de cada disco a partir dos valores já cacheados
 * (menorAnuncioBRL, reedicaoBRL, sugestaoMint) — sem repetir nenhuma chamada de rede. Regrava
 * precos.json (mantendo o `consultadoEm` original, que reflete quando os dados de rede foram
 * de fato buscados) e precos-relatorio.md.
 */
async function recalcularTudoComCsv(existente, catalogo) {
  const csvConteudo = await lerArquivoTextoSeExistir(PRECOS_OBSERVADOS_CSV);
  const { porId: observadosPorId, avisos } = parseCsvObservados(csvConteudo);
  for (const aviso of avisos) console.error(`aviso csv precos-observados: ${aviso}`);

  const discosAtualizados = {};
  for (const [idStr, registro] of Object.entries(existente.discos || {})) {
    const observadosDoDisco = observadosParaId(observadosPorId, Number(idStr));
    discosAtualizados[idStr] = recalcularComObservados(registro, observadosDoDisco);
  }

  const dadosAtualizados = { consultadoEm: existente.consultadoEm, discos: discosAtualizados };
  await escreverJsonAtomic(PRECOS_JSON, dadosAtualizados);
  await fs.writeFile(
    PRECOS_RELATORIO_MD,
    gerarRelatorioMd(catalogo.discos, discosAtualizados, dadosAtualizados.consultadoEm),
    'utf8',
  );
  return dadosAtualizados;
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
      dadosPrecos = await recalcularTudoComCsv(existente, catalogo);
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
  console.log(`OK ${n} discos · com referência ${comReferencia} · chamadas ${obterContadorChamadas()} · ${tempo}`);
}

const ehModuloPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (ehModuloPrincipal) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
