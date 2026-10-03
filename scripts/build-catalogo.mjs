// Pipeline do catálogo. Lê discos.txt, resolve cada linha no Discogs e escreve
// data/catalogo.json, data/codigos.json, data/resolvidos.json e data/pendentes.txt.
// Ver CONTRATO.md — seções "discos.txt", "data/catalogo.json", "Código OD (T2)" e "Pipeline".
//
// Uso: node scripts/build-catalogo.mjs [--force] [--sem-rede]

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { filtrarVersoesOficiais, escolherCandidatasReedicao, obterVersoesReedicao } from './discogs-versoes.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const DISCOS_TXT = path.join(ROOT_DIR, 'discos.txt');
const CATALOGO_JSON = path.join(DATA_DIR, 'catalogo.json');
const RESOLVIDOS_JSON = path.join(DATA_DIR, 'resolvidos.json');
const PENDENTES_TXT = path.join(DATA_DIR, 'pendentes.txt');
const CODIGOS_JSON = path.join(DATA_DIR, 'codigos.json');

// Cauda comum das mensagens de aborto relacionadas ao código OD (T2/R3.3/R4.1): "restaure
// data/codigos.json" sozinho não resolve quando é o catalogo.json que está na frente do
// mapa (medido) — por isso cita os 4 arquivos; e `git restore <arquivo>` simples falha com
// "path ... is unmerged" justamente no conflito do `git pull --autostash` que motivou a
// R3.4 (medido) — por isso `--source=HEAD --staged --worktree`, que funciona nesse caso. Se
// a restauração não bastar, aponta para o histórico do mapa commitado.
const RESTAURA_CODIGOS =
  'restaure com: git restore --source=HEAD --staged --worktree data/catalogo.json data/resolvidos.json data/pendentes.txt data/codigos.json ' +
  '(se continuar, o mapa commitado está danificado: git log -- data/codigos.json)';

const USER_AGENT = 'OriginariaDiscos/1.0 (+https://l3ttn.github.io/originariadiscos/)';
const PACING_MS = 2600;
const TIMEOUT_MS = 20000;
const CACHE_FRESCURA_MS = 6 * 60 * 60 * 1000; // 6h
const MAX_TENTATIVAS_429 = 3;
const ESPERA_5XX_MS = 5000;

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
/**
 * "Álbum" pelas descriptions: tem 'Album' ou 'LP' explícito. Discogs tagueia disco de
 * house/eletrônico como "12", 33 ⅓ RPM, Album" — 12"/10"/7" com Album/LP junto é álbum,
 * não compacto; só sem esse tag é que o tamanho decide.
 */
function ehAlbumOuLP(descricoesLower) {
  return descricoesLower.includes('album') || descricoesLower.includes('lp');
}

export function derivarFormatoTipo(formats) {
  const vinil = encontrarFormatoVinil(formats);
  if (!vinil) return null;
  const descricoes = Array.isArray(vinil.descriptions) ? vinil.descriptions : [];
  const descricoesLower = descricoes.map((d) => String(d).toLowerCase());
  if (descricoesLower.includes('box set')) return 'Box';
  if (!ehAlbumOuLP(descricoesLower)) {
    if (descricoes.includes('7"')) return '7"';
    if (descricoes.includes('10"')) return '10"';
    if (descricoes.includes('12"')) return '12"';
  }
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

/** descrições do 1º formato Vinyl unidas por ", "; sem formato Vinyl ou sem descriptions → null. */
export function descricoesVinilString(formats) {
  const vinil = encontrarFormatoVinil(formats);
  if (!vinil) return null;
  const descricoes = Array.isArray(vinil.descriptions) ? vinil.descriptions.map(String) : [];
  return descricoes.length ? descricoes.join(', ') : null;
}

/**
 * edicaoVenda automático (CONTRATO.md "Edição à venda (v5)") a partir de TODAS as versões em
 * vinil do master (ordenadas por released desc, como a API devolve em
 * /masters/{id}/versions): filtra fora Unofficial Release/Test Pressing/Promo e escolhe a
 * mesma regra de `precos.mjs` (v4.1) — a mais recente com country "Brazil", senão a mais
 * recente oficial no geral. Sem versão oficial alguma → null.
 */
export function derivarEdicaoVendaAutomatica(versoesBrutas) {
  const escolhida = escolherCandidatasReedicao(filtrarVersoesOficiais(versoesBrutas))[0] || null;
  if (!escolhida) return null;
  return {
    id: escolhida.id,
    ano: Number(String(escolhida.released ?? '').slice(0, 4)) || null,
    pais: escolhida.country || null,
    selo: escolhida.label ? removerSufixoNumerico(escolhida.label) : null,
    catno: escolhida.catno || null,
    formato: escolhida.format || null,
    discogsUrl: `https://www.discogs.com/release/${escolhida.id}`,
    fixadaPeloDono: false,
  };
}

/** edicaoVenda fixada pelo dono (`| edicao=`) a partir do release completo (GET /releases/{id}). */
export function derivarEdicaoVendaFixada(release) {
  if (!release) return null;
  return {
    id: release.id,
    ano: release.year && release.year !== 0 ? release.year : null,
    pais: release.country || null,
    selo: release.labels?.[0]?.name ? limparNomeSelo(release.labels[0].name) : null,
    catno: release.labels?.[0]?.catno || null,
    formato: descricoesVinilString(release.formats),
    discogsUrl: release.uri,
    fixadaPeloDono: true,
  };
}

/** `edicao=<URL ou id>` → release id; sem casar URL de release nem id numérico válido → null. */
export function resolverIdEdicaoFixada(valor) {
  if (!valor) return null;
  const releaseMatch = RELEASE_URL_RE.exec(valor);
  if (releaseMatch) return Number(releaseMatch[1]);
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
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
    edicao: null,
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
    } else if (chave === 'edicao') {
      opts.edicao = valor;
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
 * Regra de casamento do resultado de busca: título normalizado termina com
 * " - " + tituloNorm e contém artistaNorm. Devolve TODOS os candidatos que
 * casam (não só o primeiro) — o desempate entre eles é trabalho de
 * escolherMelhorCandidato, porque títulos iguais podem apontar para edições
 * bem diferentes (álbum original vs. compacto, vs. compilação).
 */
export function filtrarCandidatosQueCasam(resultados, artistaNorm, tituloNorm) {
  if (!Array.isArray(resultados)) return [];
  return resultados.filter((r) => {
    const tituloResultadoNorm = normalizarTexto(r?.title ?? '');
    return tituloResultadoNorm.endsWith(` - ${tituloNorm}`) && tituloResultadoNorm.includes(artistaNorm);
  });
}

/**
 * Regra de casamento do resultado de busca: entre os candidatos cujo título
 * casa, o de melhor pontuação (derivarPontuacaoFormato). Mantido para
 * compatibilidade — devolve só o candidato escolhido, sem a pontuação.
 */
export function casarResultadoBusca(resultados, artistaNorm, tituloNorm) {
  const candidatos = filtrarCandidatosQueCasam(resultados, artistaNorm, tituloNorm);
  if (candidatos.length === 0) return null;
  return escolherMelhorCandidato(candidatos).candidato;
}

/** `format` vem como array (busca) ou string "LP, Album" (versions) — normaliza pros dois casos. */
export function listaFormato(formatoField) {
  if (Array.isArray(formatoField)) return formatoField.map((f) => String(f));
  if (typeof formatoField === 'string') return formatoField.split(',').map((f) => f.trim()).filter(Boolean);
  return [];
}

const TERMOS_NEGATIVOS = new Set(['compilation', 'unofficial release', 'promo', 'single', 'ep', 'mixed', 'transcription']);
const TAMANHOS_PEQUENOS = new Set(['7"', '10"', '12"']);

/**
 * Pontua um candidato de busca pelo campo `format`: +3 'Album', +1 'LP',
 * −4 Compilation/Unofficial Release/Promo/Single/EP/Mixed/Transcription,
 * −2 se for 7"/10"/12". Maior pontuação = mais parecido com o álbum original.
 */
export function pontuarCandidato(candidato) {
  const formatos = listaFormato(candidato?.format);
  const formatosLower = formatos.map((f) => f.toLowerCase());
  let pontos = 0;
  if (formatosLower.includes('album')) pontos += 3;
  if (formatosLower.includes('lp')) pontos += 1;
  if (formatosLower.some((f) => TERMOS_NEGATIVOS.has(f))) pontos -= 4;
  if (formatos.some((f) => TAMANHOS_PEQUENOS.has(f))) pontos -= 2;
  return pontos;
}

/**
 * Escolhe o candidato de maior pontuação (derivarPontuacaoFormato); empate
 * vai para o de menor `year` (a edição original). Devolve { candidato, pontos }.
 */
export function escolherMelhorCandidato(candidatos) {
  if (!Array.isArray(candidatos) || candidatos.length === 0) {
    return { candidato: null, pontos: -Infinity };
  }
  let melhor = candidatos[0];
  let melhorPontos = pontuarCandidato(melhor);
  for (const c of candidatos.slice(1)) {
    const pontos = pontuarCandidato(c);
    if (pontos > melhorPontos) {
      melhor = c;
      melhorPontos = pontos;
      continue;
    }
    if (pontos === melhorPontos) {
      const anoMelhor = Number(melhor?.year);
      const anoCandidato = Number(c?.year);
      if (Number.isFinite(anoCandidato) && (!Number.isFinite(anoMelhor) || anoCandidato < anoMelhor)) {
        melhor = c;
        melhorPontos = pontos;
      }
    }
  }
  return { candidato: melhor, pontos: melhorPontos };
}

const CODIGO_RE = /^OD-\d{3,}$/;

function formatarCodigoOd(n) {
  return `OD-${String(n).padStart(3, '0')}`;
}

function numeroDoCodigoOd(codigo) {
  return Number(codigo.slice(3));
}

/**
 * Valida `data/codigos.json` já parseado (null/undefined/`[]` contam como mapa vazio).
 * Lança Error (nunca renumera em silêncio — CONTRATO.md "Código OD (T2)") quando: não é
 * null/undefined/array; algum item não tem `id` inteiro; algum `codigo` não casa
 * `/^OD-\d{3,}$/`; há `id` repetido; há número de código repetido (mesmo com paddings
 * diferentes, ex. "OD-001" e "OD-0001").
 */
function validarMapaCodigos(mapa) {
  if (mapa === null || mapa === undefined) return [];
  if (!Array.isArray(mapa)) {
    throw new Error('data/codigos.json inválido: esperava um array (ou null/undefined), recebi outra coisa');
  }
  const idsVistos = new Set();
  const numerosVistos = new Set();
  for (const item of mapa) {
    if (!item || !Number.isInteger(item.id)) {
      throw new Error(`data/codigos.json inválido: item sem id inteiro (${JSON.stringify(item)})`);
    }
    if (typeof item.codigo !== 'string' || !CODIGO_RE.test(item.codigo)) {
      throw new Error(`data/codigos.json inválido: codigo inválido para id ${item.id} (${JSON.stringify(item.codigo)})`);
    }
    if (idsVistos.has(item.id)) {
      throw new Error(`data/codigos.json inválido: id repetido ${item.id}`);
    }
    idsVistos.add(item.id);
    const numero = numeroDoCodigoOd(item.codigo);
    if (numerosVistos.has(numero)) {
      throw new Error(`data/codigos.json inválido: número de código repetido ${numero} (id ${item.id})`);
    }
    numerosVistos.add(numero);
  }
  return mapa;
}

/**
 * Código OD estável (CONTRATO.md "Código OD (T2)") — função pura, sem I/O/rede/Date.
 *
 * `discos`: entradas do catálogo (cada uma com `id` number, `adicionadoEm` string ISO,
 * `ordem` number). `mapa`: conteúdo de data/codigos.json já parseado, ou null/undefined
 * quando o arquivo não existe (`[]` vale o mesmo). Devolve `{ discos, mapa }` — objetos
 * novos, mesma ordem/tamanho de `discos` de entrada (nunca ordena nem muta a entrada).
 *
 * Regras (CONTRATO.md): id já no mapa → código do mapa (perde `removido`); id novo →
 * número novo, por `adicionadoEm` asc (desempate `ordem` asc), a partir de
 * (maior número do mapa, incluindo removidos) + 1; id do mapa que não está em `discos`
 * desta chamada fica `removido: true` (nunca sai do mapa, número nunca reaproveitado);
 * id repetido em `discos` recebe um único código, numerado pela ocorrência mais antiga
 * (menor `adicionadoEm`, desempate menor `ordem`) entre as linhas repetidas — não pela
 * posição no array; idempotente.
 */
export function atribuirCodigos(discos, mapa) {
  const mapaValidado = validarMapaCodigos(mapa);

  const codigoPorId = new Map();
  let maiorNumero = 0;
  for (const item of mapaValidado) {
    codigoPorId.set(item.id, item.codigo);
    const numero = numeroDoCodigoOd(item.codigo);
    if (numero > maiorNumero) maiorNumero = numero;
  }

  const idsAtivos = new Set();
  // id repetido em `discos` → a ocorrência mais antiga (menor adicionadoEm, desempate menor
  // ordem) representa o id na numeração de código novo, não a 1ª do array (R2.1).
  const candidatoNovoPorId = new Map();
  for (const disco of discos) {
    idsAtivos.add(disco.id);
    if (codigoPorId.has(disco.id)) continue;
    const atual = candidatoNovoPorId.get(disco.id);
    const vence =
      !atual ||
      disco.adicionadoEm < atual.adicionadoEm ||
      (disco.adicionadoEm === atual.adicionadoEm && disco.ordem < atual.ordem);
    if (vence) {
      candidatoNovoPorId.set(disco.id, { id: disco.id, adicionadoEm: disco.adicionadoEm, ordem: disco.ordem });
    }
  }
  const semCodigoEmOrdem = Array.from(candidatoNovoPorId.values());
  semCodigoEmOrdem.sort((a, b) => {
    if (a.adicionadoEm < b.adicionadoEm) return -1;
    if (a.adicionadoEm > b.adicionadoEm) return 1;
    return a.ordem - b.ordem;
  });

  let proximoNumero = maiorNumero + 1;
  for (const item of semCodigoEmOrdem) {
    codigoPorId.set(item.id, formatarCodigoOd(proximoNumero));
    proximoNumero += 1;
  }

  const discosComCodigo = discos.map((disco) => ({ ...disco, codigo: codigoPorId.get(disco.id) }));

  const mapaOut = [];
  for (const item of mapaValidado) {
    mapaOut.push(
      idsAtivos.has(item.id)
        ? { id: item.id, codigo: item.codigo }
        : { id: item.id, codigo: item.codigo, removido: true },
    );
  }
  for (const item of semCodigoEmOrdem) {
    mapaOut.push({ id: item.id, codigo: codigoPorId.get(item.id) });
  }
  mapaOut.sort((a, b) => numeroDoCodigoOd(a.codigo) - numeroDoCodigoOd(b.codigo));

  return { discos: discosComCodigo, mapa: mapaOut };
}

// ---------------------------------------------------------------------------
// I/O e rede (não exportadas / não testadas por unidade)
// ---------------------------------------------------------------------------

class PendenteError extends Error {}

let contadorChamadas = 0;
let ultimaChamadaEm = 0;
// Default de `semRede` em chamarDiscogs: `main()` lê a flag --sem-rede do argv e atribui
// aqui antes de qualquer chamada; testes ignoram esta variável passando `semRede` explícito.
let semRedeFlag = false;

/**
 * Total de chamadas HTTP de verdade feitas via `chamarDiscogs` nesta execução (não conta
 * cache hits) — único contador, incrementado dentro de `chamarDiscogs` independente de quem
 * chama (este módulo, discogs-versoes.mjs ou precos.mjs), já que todos passam por aqui.
 */
export function obterContadorChamadas() {
  return contadorChamadas;
}

function dormir(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function espacarChamada(dormirImpl) {
  const agora = Date.now();
  const espera = ultimaChamadaEm + PACING_MS - agora;
  if (espera > 0) await dormirImpl(espera);
  ultimaChamadaEm = Date.now();
}

/**
 * `fetchImpl`/`dormirImpl` são injetáveis para teste (sem rede, sem esperar de verdade);
 * com os valores padrão (`fetch`/`dormir` de verdade) o comportamento é o de produção.
 * Retry: até MAX_TENTATIVAS_429 tentativas no total, tanto em 429 (espera `Retry-After`, ou
 * 60s sem o header) quanto em 5xx (espera fixa de `ESPERA_5XX_MS`, 5s) — qualquer outro erro
 * HTTP ou timeout não tenta de novo.
 *
 * `semRede` (T2, flag --sem-rede do build): quando truthy, falha na hora — sem chamar
 * `fetchImpl`, sem contar em `contadorChamadas` e sem esperar nada — com um erro cuja
 * mensagem contém "sem rede". Default = `semRedeFlag`, que `main()` ajusta a partir do
 * argv; testes podem passar `semRede: true` direto, sem tocar em `process.argv`.
 */
export async function chamarDiscogs(url, contexto, { fetchImpl = fetch, dormirImpl = dormir, semRede = semRedeFlag } = {}) {
  if (semRede) {
    throw new Error(`sem rede: ${contexto}`);
  }
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_429; tentativa += 1) {
    await espacarChamada(dormirImpl);
    const headers = { 'User-Agent': USER_AGENT };
    if (process.env.DISCOGS_TOKEN) {
      headers.Authorization = `Discogs token=${process.env.DISCOGS_TOKEN}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    contadorChamadas += 1;
    try {
      const resp = await fetchImpl(url, { headers, signal: controller.signal });
      if (resp.status === 429) {
        const retryAfter = Number(resp.headers.get('retry-after'));
        const esperaMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 60000;
        if (tentativa < MAX_TENTATIVAS_429) {
          await dormirImpl(esperaMs);
          continue;
        }
        throw new Error(`429 persistente em ${contexto}`);
      }
      if (resp.status >= 500 && resp.status <= 599) {
        if (tentativa < MAX_TENTATIVAS_429) {
          await dormirImpl(ESPERA_5XX_MS);
          continue;
        }
        throw new Error(`HTTP ${resp.status} persistente em ${contexto}`);
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

export async function escreverJsonAtomic(caminho, dados) {
  const tmp = `${caminho}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, `${JSON.stringify(dados, null, 2)}\n`, 'utf8');
  await fs.rename(tmp, caminho);
}

export async function lerJsonSeExistir(caminho) {
  try {
    const raw = await fs.readFile(caminho, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Lê `data/codigos.json` distinguindo "arquivo não existe" (ENOENT → null, semente legítima)
 * de "existe mas não é JSON válido" (lança — ao contrário de `lerJsonSeExistir`, que engoliria
 * o erro e faria o mapa sumir, abrindo a porta para renumeração em silêncio).
 */
async function lerMapaCodigos() {
  let raw;
  try {
    raw = await fs.readFile(CODIGOS_JSON, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`data/codigos.json inválido (não é JSON): ${err.message} — ${RESTAURA_CODIGOS}`);
  }
}

/**
 * Lê `data/catalogo.json` distinguindo "não existe" (ENOENT → null, build nunca rodou) de
 * "existe mas não é JSON válido" (ex.: marcadores de conflito deixados por `git pull
 * --autostash`) — devolve `{ invalido: true, erro }` em vez de lançar direto, porque
 * `main()` só aborta nesse caso quando o mapa de códigos também está ausente/vazio (R3.4);
 * com o mapa presente os códigos vêm dele e o catálogo corrompido não precisa travar o
 * build (só perde, nesta rodada, a tolerância de reaproveitar entradas por disco).
 */
async function lerCatalogoAnterior() {
  let raw;
  try {
    raw = await fs.readFile(CATALOGO_JSON, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (erro) {
    return { invalido: true, erro };
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

/**
 * edicaoVenda do disco (CONTRATO.md "Edição à venda (v5)"): `opts.edicao` (fixada pelo
 * dono) tem prioridade; sem ela, a escolha automática pela reedição do master (cache de 6h
 * em data/cache/versoes-{masterId}.json, via discogs-versoes.mjs).
 *
 * "Sem versão oficial", sem masterId ou sem `opts.edicao` válida são resultados LEGÍTIMOS →
 * null. Falha de rede/HTTP (em `GET /releases/{id}` da edição fixada, ou em
 * `/masters/{id}/versions` da automática, mesmo depois dos retries de `chamarDiscogs`) NÃO é
 * o mesmo que "não existe": mantém a `edicaoVenda` que o disco já tinha em
 * data/catalogo.json (`anterior`), avisando no stderr — do contrário um 500 passageiro (sem
 * cache, como no Actions a cada 6h) trocaria a edição mostrada na ficha até a próxima rodada
 * com sorte. Mesma tolerância que a seção "Pipeline" já aplica ao disco inteiro.
 *
 * `deps.obterReleaseImpl`/`deps.obterVersoesReedicaoImpl` são injetáveis para teste (default:
 * `obterRelease`/`obterVersoesReedicao` de verdade).
 */
export async function obterEdicaoVenda(opts, masterId, force, anterior, deps = {}) {
  const { obterReleaseImpl = obterRelease, obterVersoesReedicaoImpl = obterVersoesReedicao } = deps;
  const edicaoVendaAnterior = anterior?.edicaoVenda ?? null;
  if (opts.edicao) {
    const idFixado = resolverIdEdicaoFixada(opts.edicao);
    if (idFixado) {
      try {
        const releaseFixado = await obterReleaseImpl(idFixado, force);
        return derivarEdicaoVendaFixada(releaseFixado);
      } catch (err) {
        console.error(
          `aviso: falha ao buscar edicao=${opts.edicao} (release ${idFixado}): ${err.message} — mantendo edicaoVenda anterior`,
        );
        return edicaoVendaAnterior;
      }
    }
    console.error(`aviso: edicao=${opts.edicao} não é URL de release nem id válido`);
  }
  if (!masterId) return null;
  try {
    const versoes = await obterVersoesReedicaoImpl(masterId);
    return derivarEdicaoVendaAutomatica(versoes);
  } catch (err) {
    console.error(`aviso: falha em masters/${masterId}/versions (edicaoVenda): ${err.message} — mantendo edicaoVenda anterior`);
    return edicaoVendaAnterior;
  }
}

async function buscarDiscogs(artista, titulo, tipo) {
  const params = new URLSearchParams({
    artist: artista,
    release_title: titulo,
    type: tipo,
    format: 'Vinyl',
    per_page: '10',
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
    per_page: '10',
  });
  const data = await chamarDiscogs(
    `https://api.discogs.com/database/search?${params.toString()}`,
    `search livre ${tipo} "${artista} ${titulo}"`,
  );
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Tenta, em ordem: type=master (artist+release_title) → type=release (idem) → busca
 * livre (q=) com type=master. Cada tentativa roda se a anterior não achou um candidato
 * de confiança (pontos > 0) — resultado bruto vazio OU nenhum título casou OU o melhor
 * candidato que casou tem pontuação <= 0 não fecham a busca sozinhos: guarda o melhor
 * visto até agora e tenta a próxima tentativa, na esperança de achar algo melhor (ex.:
 * a busca livre acha o álbum quando artist+release_title só acha bootleg/compacto).
 * Só para de vez quando acha algo com pontos > 0, ou depois de esgotar as 3 tentativas
 * (aí usa o melhor visto, com `verificar: true`; sem nada em nenhuma, `erro: true`).
 *
 * O `tipo` devolvido diz de qual busca veio o id vencedor — quando é "master", o id
 * devolvido pela API de busca é um master id (não um release id) e precisa passar por
 * /masters/{id} → main_release antes de virar um GET /releases/{id} válido.
 */
async function buscarEResolverTexto(artista, titulo) {
  const artistaNorm = normalizarTexto(artista);
  const tituloNorm = normalizarTexto(titulo);
  const tentativas = [
    { tipo: 'master', buscar: () => buscarDiscogs(artista, titulo, 'master') },
    { tipo: 'release', buscar: () => buscarDiscogs(artista, titulo, 'release') },
    { tipo: 'master', buscar: () => buscarDiscogsLivre(artista, titulo, 'master') },
  ];
  let melhorAteAgora = null; // { id, tipo, pontos, url } de menor confiança, caso nada bata pontos > 0
  for (const tentativa of tentativas) {
    const resultados = await tentativa.buscar();
    if (resultados.length === 0) continue;
    const candidatos = filtrarCandidatosQueCasam(resultados, artistaNorm, tituloNorm);
    if (candidatos.length === 0) {
      if (!melhorAteAgora) {
        const escolhido = resultados[0];
        melhorAteAgora = {
          id: escolhido.id,
          tipo: tentativa.tipo,
          pontos: -Infinity,
          url: escolhido.resource_url || escolhido.uri || '',
        };
      }
      continue;
    }
    const { candidato, pontos } = escolherMelhorCandidato(candidatos);
    if (pontos > 0) {
      return { id: candidato.id, tipo: tentativa.tipo, verificar: false, url: candidato.resource_url || candidato.uri || '' };
    }
    if (!melhorAteAgora || pontos > melhorAteAgora.pontos) {
      melhorAteAgora = { id: candidato.id, tipo: tentativa.tipo, pontos, url: candidato.resource_url || candidato.uri || '' };
    }
  }
  if (melhorAteAgora) {
    return { id: melhorAteAgora.id, tipo: melhorAteAgora.tipo, verificar: true, url: melhorAteAgora.url };
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

/** descriptions do formato Vinyl de um release já buscado, pra pontuar com pontuarCandidato. */
function formatoComoLista(release) {
  const vinil = encontrarFormatoVinil(release?.formats);
  if (!vinil) return [];
  return Array.isArray(vinil.descriptions) ? vinil.descriptions.map(String) : [];
}

/**
 * O release resolvido é um compacto/EP em vez de álbum? Regra: tem descrição
 * Single/EP, OU tem 7"/10"/12" SEM 'Album'/'LP' junto (com Album/LP junto, tamanho não
 * importa — é o álbum prensado em 12", igual A Love Supreme ou Silentintroduction).
 */
function releaseEhFormatoPequeno(release) {
  const vinil = encontrarFormatoVinil(release?.formats);
  if (!vinil) return false; // sem Vinyl algum é tratado à parte (ver chamador)
  const descricoes = Array.isArray(vinil.descriptions) ? vinil.descriptions.map(String) : [];
  const descricoesLower = descricoes.map((d) => d.toLowerCase());
  if (descricoesLower.includes('single') || descricoesLower.includes('ep')) return true;
  if (ehAlbumOuLP(descricoesLower)) return false;
  return descricoes.some((d) => TAMANHOS_PEQUENOS.has(d));
}

/**
 * Para linhas resolvidas via master: garante que o release final é um álbum em Vinyl.
 * Dois fallbacks em /masters/{id}/versions:
 *  - sem formato Vinyl algum (ou o GET do main_release falhou, ex. 404) → format=Vinyl,
 *    pega a 1ª versão; sem nenhuma → PendenteError (linha não entra no catálogo).
 *  - tem Vinyl mas é 7"/10"/12"/Single/EP → format=LP, pega a 1ª versão cujo `format`
 *    contenha "LP" ou "Album"; sem nenhuma, mantém o que tem e sinaliza VERIFICAR
 *    (não lança — o disco entra no catálogo do jeito que achou).
 */
async function garantirVinil(masterId, id, force) {
  let release = null;
  try {
    release = await obterRelease(id, force);
  } catch {
    release = null; // cai para o fallback de versions abaixo
  }
  const temVinil = Boolean(release) && Array.isArray(release.formats) && release.formats.some((f) => f?.name === 'Vinyl');

  if (!temVinil) {
    const versoes = await chamarDiscogs(
      `https://api.discogs.com/masters/${masterId}/versions?format=Vinyl&per_page=1`,
      `masters/${masterId}/versions(Vinyl)`,
    );
    const primeira = versoes.versions?.[0];
    if (!primeira) {
      throw new PendenteError(`SEM RESULTADO (master ${masterId}: main_release inválido e sem versão em vinil)`);
    }
    const releaseFinal = await obterRelease(primeira.id, force);
    return { id: primeira.id, release: releaseFinal, motivoVerificar: null };
  }

  if (releaseEhFormatoPequeno(release)) {
    // format=LP como filtro de servidor exclui versão só tagueada "Album" (sem o
    // token "LP" junto) — busca as versões em Vinyl sem esse filtro e pontua
    // client-side com a mesma regra de pontuarCandidato, só troca se achar algo
    // estritamente melhor que o que já tem.
    const versoes = await chamarDiscogs(
      `https://api.discogs.com/masters/${masterId}/versions?format=Vinyl&per_page=20`,
      `masters/${masterId}/versions(Vinyl,todas)`,
    );
    const candidatas = Array.isArray(versoes.versions) ? versoes.versions : [];
    const pontosAtual = pontuarCandidato({ format: formatoComoLista(release) });
    let melhorVersao = null;
    let melhorPontos = pontosAtual;
    for (const v of candidatas) {
      const pontos = pontuarCandidato({ format: v?.format });
      if (pontos > melhorPontos) {
        melhorVersao = v;
        melhorPontos = pontos;
      }
    }
    if (melhorVersao) {
      const releaseFinal = await obterRelease(melhorVersao.id, force);
      return { id: melhorVersao.id, release: releaseFinal, motivoVerificar: null };
    }
    return {
      id,
      release,
      motivoVerificar: `main_release do master ${masterId} é 7"/10"/12"/Single/EP e não achei versão melhor em /masters/${masterId}/versions`,
    };
  }

  return { id, release, motivoVerificar: null };
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
  semRedeFlag = process.argv.includes('--sem-rede');

  // Lê e valida data/codigos.json antes de qualquer outra coisa (CONTRATO.md "Código OD
  // (T2)"): arquivo ausente (ENOENT) → null (semente legítima); existe mas não é JSON, ou
  // o mapa é estruturalmente inválido → lança aqui, antes de qualquer escrita em data/, e
  // main().catch adiante faz o processo sair com 1 sem mexer em nada.
  const mapaLido = await lerMapaCodigos();
  try {
    atribuirCodigos([], mapaLido); // só valida a estrutura do mapa; não usa a saída aqui
  } catch (err) {
    // atribuirCodigos (função pura) não muda: continua lançando sem RESTAURA_CODIGOS, que é
    // vocabulário de main()/pipeline, não dela. main() acrescenta a cauda ao relançar (R4.2).
    throw new Error(`${err.message} — ${RESTAURA_CODIGOS}`);
  }

  const catalogoAnterior = await lerCatalogoAnterior();

  // R3.4: catalogo.json existe mas não é JSON (ex.: marcadores de conflito do `git pull
  // --autostash`) + mapa ausente/vazio → não dá pra saber se o catálogo perdido já tinha
  // código, e seguir em frente renumeraria do zero em silêncio (medido: catálogo com
  // "<<<<<<<" na 1ª linha + codigos.json apagado + 1 disco novo no cache deu "OK 1" com o
  // disco novo virando OD-001). Com o mapa presente, os códigos vêm dele e isso não importa.
  const mapaAusenteOuVazio = !mapaLido || mapaLido.length === 0;
  if (catalogoAnterior?.invalido && mapaAusenteOuVazio) {
    throw new Error(
      `data/catalogo.json inválido (não é JSON): ${catalogoAnterior.erro.message} — ${RESTAURA_CODIGOS}`,
    );
  }
  const catalogoAnteriorUsavel = catalogoAnterior?.invalido ? null : catalogoAnterior;

  // Guarda geral (R2.2 — inclui o caso "mapa ausente/vazio" como um caso particular): todo
  // disco do catalogo.json anterior que já tinha `codigo` precisa achar o MESMO id com o
  // MESMO codigo no mapa lido (removido ou não) — senão algum código mudou de disco sem
  // passar por atribuirCodigos (mapa editado à mão, restaurado errado, ou apagado) e
  // renumerar agora trocaria o código que o site já mostra para aquele disco.
  const codigoNoMapaPorId = new Map((mapaLido ?? []).map((item) => [item.id, item.codigo]));
  for (const d of catalogoAnteriorUsavel?.discos ?? []) {
    if (!d || !d.codigo) continue;
    const codigoNoMapa = codigoNoMapaPorId.get(d.id);
    if (codigoNoMapa !== d.codigo) {
      throw new Error(
        `data/codigos.json não bate com data/catalogo.json: disco id ${d.id} tem codigo ${d.codigo} ` +
          `no catálogo anterior, mas o mapa lido tem ${codigoNoMapa === undefined ? 'nenhuma entrada para esse id' : codigoNoMapa} — ${RESTAURA_CODIGOS}`,
      );
    }
  }

  const conteudo = await fs.readFile(DISCOS_TXT, 'utf8');
  const linhas = prepararLinhas(conteudo);

  const resolvidos = (await lerJsonSeExistir(RESOLVIDOS_JSON)) || {};
  const catalogoAnteriorPorId = new Map();
  for (const d of catalogoAnteriorUsavel?.discos ?? []) {
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
    let motivoVerificar = null;
    try {
      if (precisaValidarVinil) {
        const garantido = await garantirVinil(masterId, id, force);
        id = garantido.id;
        release = garantido.release;
        motivoVerificar = garantido.motivoVerificar;
      } else {
        release = await obterRelease(id, force);
      }
    } catch (err) {
      const anterior = catalogoAnteriorPorId.get(id);
      if (anterior) {
        const adicionadoEm = resolvidos[chave]?.adicionadoEm ?? anterior.adicionadoEm ?? new Date().toISOString();
        discosFinal.push({
          ...anterior,
          edicaoVenda: anterior.edicaoVenda ?? null,
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
    entrada.edicaoVenda = await obterEdicaoVenda(linha.opts, entrada.masterId, force, catalogoAnteriorPorId.get(id));
    resolvidos[chave] = { id, adicionadoEm };
    discosFinal.push(entrada);
    if (verificarInfo) pendentesLinhas.push(verificarInfo);
    if (motivoVerificar) pendentesLinhas.push(`VERIFICAR: ${linha.bruta} → ${motivoVerificar}`);
  }

  const { discos: discosComCodigo, mapa: mapaFinal } = atribuirCodigos(discosFinal, mapaLido);

  await fs.mkdir(DATA_DIR, { recursive: true });
  await escreverJsonAtomic(RESOLVIDOS_JSON, resolvidos);
  await escreverJsonAtomic(CODIGOS_JSON, mapaFinal);
  await escreverJsonAtomic(CATALOGO_JSON, {
    geradoEm: new Date().toISOString(),
    fonte: 'Discogs',
    discos: discosComCodigo,
  });
  await fs.writeFile(PENDENTES_TXT, pendentesLinhas.length ? `${pendentesLinhas.join('\n')}\n` : '', 'utf8');

  const tempo = formatarTempo(Date.now() - inicio);
  console.log(`OK ${discosComCodigo.length} · pendentes ${pendentesLinhas.length} · chamadas ${contadorChamadas} · ${tempo}`);

  if (discosComCodigo.length === 0) {
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
