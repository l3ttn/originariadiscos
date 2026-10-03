import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseLinha,
  prepararLinhas,
  normalizarTexto,
  derivarFormatoTipo,
  derivarCor,
  derivarEdicao,
  derivarArtista,
  casarResultadoBusca,
  filtrarCandidatosQueCasam,
  listaFormato,
  pontuarCandidato,
  escolherMelhorCandidato,
  derivarEdicaoVendaAutomatica,
  derivarEdicaoVendaFixada,
  resolverIdEdicaoFixada,
  descricoesVinilString,
  chamarDiscogs,
  obterEdicaoVenda,
  atribuirCodigos,
  obterContadorChamadas,
} from '../scripts/build-catalogo.mjs';

// --- parseLinha -------------------------------------------------------

test('parseLinha: "Artista – Título" simples usa status padrão esgotado', () => {
  const r = parseLinha('Jorge Ben – África Brasil', 'Brasil');
  assert.equal(r.ok, true);
  assert.equal(r.tipo, 'texto');
  assert.equal(r.artista, 'Jorge Ben');
  assert.equal(r.titulo, 'África Brasil');
  assert.equal(r.opts.status, 'esgotado');
  assert.equal(r.opts.secao, 'Brasil');
  assert.equal(r.opts.destaque, false);
  assert.equal(r.opts.novo, false);
  assert.equal(r.opts.preco, null);
});

test('parseLinha: separador hífen simples e flags/campos combinados', () => {
  const r = parseLinha('Tim Maia - Racional Vol. 1 | destaque | novo | preco=180 | status=disponivel | secao=Raro | nota=capa com defeito', 'Brasil');
  assert.equal(r.ok, true);
  assert.equal(r.artista, 'Tim Maia');
  assert.equal(r.titulo, 'Racional Vol. 1');
  assert.equal(r.opts.destaque, true);
  assert.equal(r.opts.novo, true);
  assert.equal(r.opts.preco, 180);
  assert.equal(r.opts.status, 'disponivel');
  assert.equal(r.opts.secao, 'Raro');
  assert.equal(r.opts.nota, 'capa com defeito');
});

test('parseLinha: URL de release do Discogs', () => {
  const r = parseLinha('https://www.discogs.com/release/726944-Jorge-Ben-Africa-Brasil | status=disponivel | preco=220', 'Brasil');
  assert.equal(r.ok, true);
  assert.equal(r.tipo, 'release');
  assert.equal(r.id, 726944);
  assert.equal(r.opts.status, 'disponivel');
  assert.equal(r.opts.preco, 220);
});

test('parseLinha: URL de master do Discogs', () => {
  const r = parseLinha('https://www.discogs.com/master/112296 | novo', 'Brasil');
  assert.equal(r.ok, true);
  assert.equal(r.tipo, 'master');
  assert.equal(r.id, 112296);
  assert.equal(r.opts.novo, true);
});

test('parseLinha: sem separador artista–título é linha inválida, não lança', () => {
  const r = parseLinha('Só um texto sem separador válido', 'Brasil');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /separador/);
});

test('parseLinha: status inválido é rejeitado com motivo', () => {
  const r = parseLinha('Artista – Título | status=reservado', null);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /status/);
});

test('parseLinha: sem seção ativa cai em "Outros"', () => {
  const r = parseLinha('Artista – Título', null);
  assert.equal(r.ok, true);
  assert.equal(r.opts.secao, 'Outros');
});

test('prepararLinhas: ordem é 1-based por linha de disco, ignorando comentários/seções/vazias', () => {
  const conteudo = [
    '# comentário',
    '',
    '## Brasil',
    'Jorge Ben – África Brasil',
    'Tim Maia – Racional Vol. 1',
    '',
    '## Jazz',
    'Miles Davis – Kind of Blue',
  ].join('\n');
  const linhas = prepararLinhas(conteudo);
  assert.equal(linhas.length, 3);
  assert.equal(linhas[0].ordem, 1);
  assert.equal(linhas[0].opts.secao, 'Brasil');
  assert.equal(linhas[1].ordem, 2);
  assert.equal(linhas[2].ordem, 3);
  assert.equal(linhas[2].opts.secao, 'Jazz');
});

// --- normalizarTexto ---------------------------------------------------

test('normalizarTexto: remove diacríticos, "*", sufixo " (n)" e colapsa espaços', () => {
  assert.equal(normalizarTexto('África Brasil'), 'africa brasil');
  assert.equal(normalizarTexto('Doom*'), 'doom');
  assert.equal(normalizarTexto('Continental (3)'), 'continental');
  assert.equal(normalizarTexto('  Múltiplos   Espaços  '), 'multiplos espacos');
});

// --- derivarFormatoTipo / derivarCor / derivarEdicao a partir de formats[] ---

test('derivarFormatoTipo: LP simples (sem descriptions de tamanho/box, qty=1)', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['LP', 'Album', 'Stereo'] }];
  assert.equal(derivarFormatoTipo(formats), 'LP');
});

test('derivarFormatoTipo: qty > 1 vira NLP', () => {
  const formats = [{ name: 'Vinyl', qty: '2', text: '', descriptions: ['LP', 'Album'] }];
  assert.equal(derivarFormatoTipo(formats), '2LP');
});

test('derivarFormatoTipo: 12" sem Album/LP junto é mesmo compacto', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['12"', 'Maxi-Single'] }];
  assert.equal(derivarFormatoTipo(formats), '12"');
});

test('derivarFormatoTipo: 12" COM Album junto é álbum, não compacto (casa como house/eletrônico no Discogs)', () => {
  const formats = [{ name: 'Vinyl', qty: '2', text: '', descriptions: ['12"', '33 ⅓ RPM', 'Album'] }];
  assert.equal(derivarFormatoTipo(formats), '2LP');
});

test('derivarFormatoTipo: 7" com LP junto (raro, mas a regra é a mesma) vira LP, não 7"', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['7"', 'LP'] }];
  assert.equal(derivarFormatoTipo(formats), 'LP');
});

test('derivarFormatoTipo: Box Set vira Box', () => {
  const formats = [{ name: 'Vinyl', qty: '3', text: '', descriptions: ['Box Set', 'Compilation'] }];
  assert.equal(derivarFormatoTipo(formats), 'Box');
});

test('derivarFormatoTipo: sem item Vinyl retorna null', () => {
  assert.equal(derivarFormatoTipo([{ name: 'CD' }]), null);
});

test('derivarCor: casa cor em text e em descriptions, sem duplicar', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: 'Red Vinyl', descriptions: ['LP', 'Red', 'Album'] }];
  assert.equal(derivarCor(formats), 'Red Vinyl, Red');
});

test('derivarCor: nada casa retorna null', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['LP', 'Album', 'Gatefold'] }];
  assert.equal(derivarCor(formats), null);
});

test('derivarEdicao: exclui cor e formatos base, mantém o resto unido por ", "', () => {
  const formats = [{
    name: 'Vinyl',
    qty: '2',
    text: '',
    descriptions: ['LP', 'Album', 'Stereo', 'Red', 'Reissue', 'Gatefold', '180g'],
  }];
  assert.equal(derivarEdicao(formats), 'Reissue, Gatefold, 180g');
});

test('derivarEdicao: só formatos base e cor resulta em null', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['LP', 'Album', 'Mono', 'Black'] }];
  assert.equal(derivarEdicao(formats), null);
});

// --- derivarArtista ------------------------------------------------------

test('derivarArtista: junta nomes por " & " removendo "*" e sufixo " (n)"', () => {
  const artists = [{ name: 'MF DOOM' }, { name: 'Madlib' }, { name: 'Madvillain' }];
  assert.equal(derivarArtista(artists), 'MF DOOM & Madlib & Madvillain');
  assert.equal(derivarArtista([{ name: 'Doom*' }]), 'Doom');
  assert.equal(derivarArtista([{ name: 'Continental (3)' }]), 'Continental');
});

// --- casarResultadoBusca --------------------------------------------------

test('casarResultadoBusca: casa título com créditos/asterisco antes do separador " - "', () => {
  const resultados = [
    { id: 111, title: 'Various - Some Compilation' },
    { id: 242785, title: 'Doom* And Madlib - Madvillain - Madvillainy' },
  ];
  const match = casarResultadoBusca(resultados, normalizarTexto('Madvillain'), normalizarTexto('Madvillainy'));
  assert.ok(match);
  assert.equal(match.id, 242785);
});

test('casarResultadoBusca: primeiro resultado não é necessariamente o vencedor', () => {
  const resultados = [
    { id: 1, title: 'Madvillain - Madvillainy (Demos)' },
    { id: 2, title: 'Madvillain - Madvillainy (Instrumentals)' },
    { id: 3, title: 'Doom* And Madlib - Madvillain - Madvillainy' },
  ];
  const match = casarResultadoBusca(resultados, normalizarTexto('Madvillain'), normalizarTexto('Madvillainy'));
  assert.equal(match.id, 3);
});

test('casarResultadoBusca: nenhum casa retorna null', () => {
  const resultados = [{ id: 1, title: 'Outra Coisa - Totalmente Diferente' }];
  const match = casarResultadoBusca(resultados, normalizarTexto('Madvillain'), normalizarTexto('Madvillainy'));
  assert.equal(match, null);
});

// --- listaFormato / pontuarCandidato / escolherMelhorCandidato -----------

test('listaFormato: aceita array (busca) e string "LP, Album" (versions)', () => {
  assert.deepEqual(listaFormato(['Vinyl', 'LP', 'Album']), ['Vinyl', 'LP', 'Album']);
  assert.deepEqual(listaFormato('LP, Album, Test Pressing'), ['LP', 'Album', 'Test Pressing']);
  assert.deepEqual(listaFormato(undefined), []);
});

test('pontuarCandidato: +3 Album, +1 LP, soma', () => {
  assert.equal(pontuarCandidato({ format: ['Vinyl', 'LP', 'Album', 'Stereo'] }), 4);
});

test('pontuarCandidato: -4 Compilation e -2 tamanho pequeno', () => {
  assert.equal(pontuarCandidato({ format: ['Vinyl', 'LP', 'Compilation'] }), -3);
  assert.equal(pontuarCandidato({ format: ['Vinyl', '7"', 'Single'] }), -6);
});

test('escolherMelhorCandidato: caso real de A Love Supreme — Compilation 1991 perde pra Album 1965', () => {
  const candidatos = [
    { id: 1121130, format: ['Vinyl', 'LP', 'Compilation'], year: 1991 },
    { id: 32287, format: ['Vinyl', 'LP', 'Album', 'Stereo'], year: 1965 },
  ];
  const { candidato, pontos } = escolherMelhorCandidato(candidatos);
  assert.equal(candidato.id, 32287);
  assert.equal(pontos, 4);
});

test('escolherMelhorCandidato: empate de pontuação vai para o de menor year', () => {
  const candidatos = [
    { id: 1, format: ['Vinyl', 'LP', 'Album'], year: 2015 },
    { id: 2, format: ['Vinyl', 'LP', 'Album'], year: 1975 },
  ];
  const { candidato } = escolherMelhorCandidato(candidatos);
  assert.equal(candidato.id, 2);
});

test('escolherMelhorCandidato: sem pontuação > 0 ainda assim escolhe o melhor disponível', () => {
  const candidatos = [
    { id: 1, format: ['Vinyl', '7"', 'Single'], year: 1980 },
    { id: 2, format: ['Vinyl', '12"', 'EP'], year: 1980 },
  ];
  const { candidato, pontos } = escolherMelhorCandidato(candidatos);
  assert.equal(candidato.id, 1); // -6 empata em tamanho negativo, mas -6 > -6... desempate por year igual mantém o 1º
  assert.ok(pontos <= 0);
});

test('filtrarCandidatosQueCasam: devolve todos os que casam, não só o primeiro', () => {
  const resultados = [
    { id: 1, title: 'Alice Coltrane & Pharoah Sanders - Journey In Satchidananda' },
    { id: 2, title: 'Alice Coltrane - Journey In Satchidananda' },
    { id: 3, title: 'Outra Coisa - Totalmente Diferente' },
  ];
  const candidatos = filtrarCandidatosQueCasam(resultados, normalizarTexto('Alice Coltrane'), normalizarTexto('Journey In Satchidananda'));
  assert.equal(candidatos.length, 2);
  assert.deepEqual(candidatos.map((c) => c.id), [1, 2]);
});

// --- edicaoVenda (v5) — CONTRATO.md "Edição à venda (v5)" -------------------

test('parseLinha: campo edicao= fica em opts.edicao (URL ou id de release)', () => {
  const r1 = parseLinha('Jorge Ben – África Brasil | edicao=https://www.discogs.com/release/15793439', 'Brasil');
  assert.equal(r1.ok, true);
  assert.equal(r1.opts.edicao, 'https://www.discogs.com/release/15793439');
  const r2 = parseLinha('Jorge Ben – África Brasil', 'Brasil');
  assert.equal(r2.opts.edicao, null);
});

test('resolverIdEdicaoFixada: aceita URL de release ou id numérico; outra coisa → null', () => {
  assert.equal(resolverIdEdicaoFixada('https://www.discogs.com/release/15793439-Jorge-Ben-Africa-Brasil'), 15793439);
  assert.equal(resolverIdEdicaoFixada('15793439'), 15793439);
  assert.equal(resolverIdEdicaoFixada('abc'), null);
  assert.equal(resolverIdEdicaoFixada(null), null);
});

test('derivarEdicaoVendaAutomatica: a partir de um versions[] de fixture com bootleg — exclui o bootleg e escolhe a reedição Brasil mais recente (caso real: master 112296, África Brasil)', () => {
  const versoesBrutas = [
    { id: 31257475, released: '2024', country: 'Europe', label: 'Future Shock (4)', catno: 'FS4485', format: 'LP, Album, Reissue, Unofficial Release' }, // bootleg — tem de ser excluído
    { id: 15793439, released: '2020', country: 'Brazil', label: 'Polysom', catno: '33057-1', format: 'LP, Album, Limited Edition, Reissue, Repress' },
    { id: 18574192, released: '2019', country: 'US', label: 'Universal Music Special Markets (2)', catno: 'B0028558-01', format: 'LP, Album, Reissue, Stereo' },
  ];
  const edicaoVenda = derivarEdicaoVendaAutomatica(versoesBrutas);
  assert.deepEqual(edicaoVenda, {
    id: 15793439,
    ano: 2020,
    pais: 'Brazil',
    selo: 'Polysom',
    catno: '33057-1',
    formato: 'LP, Album, Limited Edition, Reissue, Repress',
    discogsUrl: 'https://www.discogs.com/release/15793439',
    fixadaPeloDono: false,
  });
});

test('derivarEdicaoVendaAutomatica: só o bootleg (sem versão oficial) → null', () => {
  const versoesBrutas = [
    { id: 31257475, released: '2024', country: 'Europe', label: 'Future Shock', catno: 'FS4485', format: 'LP, Album, Reissue, Unofficial Release' },
  ];
  assert.equal(derivarEdicaoVendaAutomatica(versoesBrutas), null);
});

test('derivarEdicaoVendaAutomatica: sem versões (master sem reedição) → null', () => {
  assert.equal(derivarEdicaoVendaAutomatica([]), null);
});

test('derivarEdicaoVendaFixada: a partir de um release de fixture (edicao= fixado pelo dono)', () => {
  const releaseFixture = {
    id: 999,
    year: 2018,
    country: 'Germany',
    labels: [{ name: 'Music On Vinyl (2)', catno: 'MOVLP123' }],
    formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP', 'Album', 'Reissue', '180g'] }],
    uri: 'https://www.discogs.com/release/999-Fixture',
  };
  assert.deepEqual(derivarEdicaoVendaFixada(releaseFixture), {
    id: 999,
    ano: 2018,
    pais: 'Germany',
    selo: 'Music On Vinyl', // sufixo " (2)" removido
    catno: 'MOVLP123',
    formato: 'LP, Album, Reissue, 180g',
    discogsUrl: 'https://www.discogs.com/release/999-Fixture',
    fixadaPeloDono: true,
  });
});

test('derivarEdicaoVendaFixada: sem release (falha ao buscar) → null', () => {
  assert.equal(derivarEdicaoVendaFixada(null), null);
});

test('descricoesVinilString: descrições do 1º formato Vinyl unidas por ", "; sem Vinyl → null', () => {
  assert.equal(descricoesVinilString([{ name: 'Vinyl', descriptions: ['LP', 'Album', 'Reissue'] }]), 'LP, Album, Reissue');
  assert.equal(descricoesVinilString([{ name: 'CD' }]), null);
});

// --- chamarDiscogs: retry em 5xx (além do 429 já existente) ------------------
// Caso real medido em 2026-10-01: GET masters/8554/versions devolveu HTTP 500 (não 429), e a
// mesma URL respondeu 200 minutos depois — por isso 5xx também precisa de retry.

function respostaFalsa(status, corpo) {
  return { status, ok: status >= 200 && status < 300, headers: { get: () => null }, json: async () => corpo };
}

test('chamarDiscogs: 500, 500, 200 — tenta de novo em 5xx e tem sucesso na 3ª tentativa', async () => {
  const respostas = [respostaFalsa(500), respostaFalsa(500), respostaFalsa(200, { versions: [] })];
  let chamadas = 0;
  const fetchFalso = async () => respostas[chamadas++];
  const esperas = [];
  const dormirFalso = async (ms) => {
    esperas.push(ms);
  };
  const dados = await chamarDiscogs('https://api.discogs.com/masters/8554/versions', 'masters/8554/versions(teste)', {
    fetchImpl: fetchFalso,
    dormirImpl: dormirFalso,
  });
  assert.deepEqual(dados, { versions: [] });
  assert.equal(chamadas, 3);
  // 2 esperas de 5s (depois da 1ª e da 2ª tentativa, ambas 500); as demais entradas de
  // `esperas` são o espaçamento normal entre chamadas (PACING_MS), não a espera do retry.
  assert.deepEqual(esperas.filter((ms) => ms === 5000), [5000, 5000]);
});

test('chamarDiscogs: 500 nas 3 tentativas — erro com mensagem clara (não trava à toa, como o 429)', async () => {
  const fetchFalso = async () => respostaFalsa(500);
  const dormirFalso = async () => {};
  await assert.rejects(
    () =>
      chamarDiscogs('https://api.discogs.com/masters/8554/versions', 'masters/8554/versions(teste persistente)', {
        fetchImpl: fetchFalso,
        dormirImpl: dormirFalso,
      }),
    /HTTP 500 persistente em masters\/8554\/versions\(teste persistente\)/,
  );
});

// --- obterEdicaoVenda: falha de rede/HTTP não é "sem versão oficial" --------
// Caso real medido em 2026-10-01: masters/8554/versions falhou (HTTP 500) e o build gravou
// `edicaoVenda: null` por cima da edição que o disco já tinha — o Actions roda sem cache a
// cada 6h, então um 500 passageiro trocaria a ficha pela prensagem original até a próxima
// rodada com sorte. CONTRATO.md "Pipeline": falha por disco reaproveita a entrada anterior.

const EDICAO_VENDA_ANTERIOR = {
  id: 15793439,
  ano: 2020,
  pais: 'Brazil',
  selo: 'Polysom',
  catno: '33057-1',
  formato: 'LP, Album, Limited Edition, Reissue, Repress',
  discogsUrl: 'https://www.discogs.com/release/15793439',
  fixadaPeloDono: false,
};

test('obterEdicaoVenda: anterior com edição + versões falhando (mesmo após retries) → mantém a anterior', async () => {
  const anterior = { id: 726944, edicaoVenda: EDICAO_VENDA_ANTERIOR };
  const obterVersoesReedicaoImpl = async () => {
    throw new Error('HTTP 500 persistente em masters/112296/versions(reedicao)');
  };
  const resultado = await obterEdicaoVenda({ edicao: null }, 112296, false, anterior, { obterVersoesReedicaoImpl });
  assert.deepEqual(resultado, EDICAO_VENDA_ANTERIOR);
});

test('obterEdicaoVenda: anterior com edição + versões OK mas sem versão oficial → null (resultado legítimo, não mantém a anterior)', async () => {
  const anterior = { id: 726944, edicaoVenda: EDICAO_VENDA_ANTERIOR };
  const versoesSoBootleg = [
    { id: 31257475, released: '2024', country: 'Europe', label: 'Future Shock', catno: 'FS4485', format: 'LP, Album, Reissue, Unofficial Release' },
  ];
  const obterVersoesReedicaoImpl = async () => versoesSoBootleg;
  const resultado = await obterEdicaoVenda({ edicao: null }, 112296, false, anterior, { obterVersoesReedicaoImpl });
  assert.equal(resultado, null);
});

test('obterEdicaoVenda: sem anterior (disco novo) + falha → null (não tem o que manter)', async () => {
  const obterVersoesReedicaoImpl = async () => {
    throw new Error('HTTP 500 persistente em masters/999/versions(reedicao)');
  };
  const resultado = await obterEdicaoVenda({ edicao: null }, 999, false, undefined, { obterVersoesReedicaoImpl });
  assert.equal(resultado, null);
});

test('obterEdicaoVenda: edicao= fixada falhando no GET /releases/{id} → mesma regra, mantém a anterior', async () => {
  const anterior = { id: 726944, edicaoVenda: EDICAO_VENDA_ANTERIOR };
  const obterReleaseImpl = async () => {
    throw new Error('HTTP 500 persistente em releases/15793439');
  };
  const resultado = await obterEdicaoVenda(
    { edicao: 'https://www.discogs.com/release/15793439' },
    112296,
    false,
    anterior,
    { obterReleaseImpl },
  );
  assert.deepEqual(resultado, EDICAO_VENDA_ANTERIOR);
});

// --- atribuirCodigos (T2 — código OD estável) -------------------------------
// CONTRATO.md "Código OD (T2) — data/codigos.json".

function disco(id, adicionadoEm, ordem, extra = {}) {
  return { id, adicionadoEm, ordem, ...extra };
}

test('código OD: semente (mapa null) numera pela ordem de adicionadoEm, desempate por ordem — não pela posição no array nem pelo campo ordem isolado', () => {
  const a = disco(10, '2026-01-03', 5);
  const b = disco(20, '2026-01-01', 2);
  const c = disco(30, '2026-01-01', 1);
  const d = disco(40, '2026-01-02', 1);
  const { discos, mapa } = atribuirCodigos([a, b, c, d], null);

  // mesma ordem/tamanho da entrada
  assert.deepEqual(discos.map((x) => x.id), [10, 20, 30, 40]);
  const codigoPorId = new Map(discos.map((x) => [x.id, x.codigo]));
  assert.equal(codigoPorId.get(30), 'OD-001'); // 2026-01-01, ordem 1
  assert.equal(codigoPorId.get(20), 'OD-002'); // 2026-01-01, ordem 2
  assert.equal(codigoPorId.get(40), 'OD-003'); // 2026-01-02
  assert.equal(codigoPorId.get(10), 'OD-004'); // 2026-01-03

  assert.deepEqual(mapa, [
    { id: 30, codigo: 'OD-001' },
    { id: 20, codigo: 'OD-002' },
    { id: 40, codigo: 'OD-003' },
    { id: 10, codigo: 'OD-004' },
  ]);
  // entrada não foi mutada nem ordenada
  assert.deepEqual([a.id, b.id, c.id, d.id], [10, 20, 30, 40]);
  assert.equal(a.codigo, undefined);
});

test('código OD: mapa vazio ([]) começa em 1, igual a null', () => {
  const { mapa } = atribuirCodigos([disco(1, '2026-01-01', 1)], []);
  assert.deepEqual(mapa, [{ id: 1, codigo: 'OD-001' }]);
});

test('código OD: codigo que já vem na entrada é ignorado — vale o mapa', () => {
  const mapaAnterior = [{ id: 1, codigo: 'OD-001' }];
  const entradaComCodigoErrado = disco(1, '2026-01-01', 1, { codigo: 'OD-999' });
  const { discos } = atribuirCodigos([entradaComCodigoErrado], mapaAnterior);
  assert.equal(discos[0].codigo, 'OD-001');
});

test('código OD: remover um disco não muda o código dos outros e marca removido no mapa', () => {
  const mapaAnterior = [
    { id: 1, codigo: 'OD-001' },
    { id: 2, codigo: 'OD-002' },
    { id: 3, codigo: 'OD-003' },
  ];
  const atuais = [disco(1, '2026-01-01', 1), disco(3, '2026-01-03', 1)]; // id 2 saiu
  const { discos, mapa } = atribuirCodigos(atuais, mapaAnterior);
  assert.equal(discos.find((d) => d.id === 1).codigo, 'OD-001');
  assert.equal(discos.find((d) => d.id === 3).codigo, 'OD-003');
  assert.deepEqual(mapa, [
    { id: 1, codigo: 'OD-001' },
    { id: 2, codigo: 'OD-002', removido: true },
    { id: 3, codigo: 'OD-003' },
  ]);
});

test('código OD: disco novo depois de remover o de maior código pula o número dele (não reaproveita)', () => {
  const mapaAnterior = [
    { id: 1, codigo: 'OD-001' },
    { id: 2, codigo: 'OD-002' },
    { id: 3, codigo: 'OD-003' }, // maior número; vai ser removido
  ];
  const passo1 = atribuirCodigos([disco(1, '2026-01-01', 1), disco(2, '2026-01-02', 1)], mapaAnterior);
  assert.ok(passo1.mapa.find((m) => m.id === 3).removido);

  const passo2 = atribuirCodigos(
    [...passo1.discos, disco(4, '2026-01-04', 1)], // disco novo, id nunca visto
    passo1.mapa,
  );
  const novo = passo2.discos.find((d) => d.id === 4);
  assert.equal(novo.codigo, 'OD-004'); // pula o OD-003 do removido, não reaproveita
});

test('código OD: disco que volta recupera o mesmo código e perde o removido', () => {
  const mapaComRemovido = [
    { id: 1, codigo: 'OD-001' },
    { id: 2, codigo: 'OD-002', removido: true },
  ];
  const { discos, mapa } = atribuirCodigos(
    [disco(1, '2026-01-01', 1), disco(2, '2026-02-01', 9)], // id 2 voltou, com outro adicionadoEm/ordem
    mapaComRemovido,
  );
  assert.equal(discos.find((d) => d.id === 2).codigo, 'OD-002');
  const entradaMapa2 = mapa.find((m) => m.id === 2);
  assert.equal(entradaMapa2.removido, undefined);
  assert.deepEqual(entradaMapa2, { id: 2, codigo: 'OD-002' });
});

test('código OD: id repetido em discos (mesmo release em duas linhas) recebe um único código', () => {
  const linha1 = disco(5, '2026-01-01', 1);
  const linha2 = disco(5, '2026-01-01', 2);
  const { discos, mapa } = atribuirCodigos([linha1, linha2], null);
  assert.equal(discos[0].codigo, 'OD-001');
  assert.equal(discos[1].codigo, 'OD-001');
  assert.deepEqual(mapa, [{ id: 5, codigo: 'OD-001' }]); // uma entrada só no mapa, não duplicada
});

test('código OD: idempotente — chamar de novo com (discos, mapa) da saída devolve o mesmo mapa byte a byte', () => {
  const mapaAnterior = [
    { id: 1, codigo: 'OD-001' },
    { id: 9, codigo: 'OD-002', removido: true },
  ];
  const entrada = [disco(1, '2026-01-01', 1), disco(2, '2026-02-01', 1)];
  const saida1 = atribuirCodigos(entrada, mapaAnterior);
  const saida2 = atribuirCodigos(saida1.discos, saida1.mapa);
  assert.equal(JSON.stringify(saida2.mapa), JSON.stringify(saida1.mapa));
  assert.equal(JSON.stringify(saida2.discos), JSON.stringify(saida1.discos));
});

test('código OD: OD-1000 — mapa com maior número 999 gera o próximo com 4 dígitos', () => {
  const mapaAnterior = [{ id: 1, codigo: 'OD-999' }];
  const { discos, mapa } = atribuirCodigos([disco(1, '2026-01-01', 1), disco(2, '2026-01-02', 1)], mapaAnterior);
  assert.equal(discos.find((d) => d.id === 2).codigo, 'OD-1000');
  assert.deepEqual(mapa, [
    { id: 1, codigo: 'OD-999' },
    { id: 2, codigo: 'OD-1000' },
  ]);
});

test('código OD: mapa que não é array/null/undefined lança Error', () => {
  assert.throws(() => atribuirCodigos([], { 1: 'OD-001' }), Error);
});

test('código OD: item do mapa sem id inteiro lança Error', () => {
  assert.throws(() => atribuirCodigos([], [{ id: '1', codigo: 'OD-001' }]), Error);
  assert.throws(() => atribuirCodigos([], [{ id: 1.5, codigo: 'OD-001' }]), Error);
  assert.throws(() => atribuirCodigos([], [{ codigo: 'OD-001' }]), Error);
});

test('código OD: item do mapa com codigo que não casa /^OD-\\d{3,}$/ lança Error', () => {
  assert.throws(() => atribuirCodigos([], [{ id: 1, codigo: 'OD-01' }]), Error);
  assert.throws(() => atribuirCodigos([], [{ id: 1, codigo: 'XX-001' }]), Error);
  assert.throws(() => atribuirCodigos([], [{ id: 1, codigo: 1 }]), Error);
});

test('código OD: id repetido no mapa lança Error', () => {
  assert.throws(
    () => atribuirCodigos([], [{ id: 1, codigo: 'OD-001' }, { id: 1, codigo: 'OD-002' }]),
    Error,
  );
});

test('código OD: número de código repetido no mapa lança Error, mesmo com padding diferente', () => {
  assert.throws(
    () => atribuirCodigos([], [{ id: 1, codigo: 'OD-001' }, { id: 2, codigo: 'OD-0001' }]),
    Error,
  );
});

// --- chamarDiscogs com { semRede: true } (T2 — flag --sem-rede) -------------

test('código OD / --sem-rede: chamarDiscogs com semRede:true lança sem chamar fetchImpl e sem mudar obterContadorChamadas()', async () => {
  let chamadasFetch = 0;
  const fetchQueConta = async () => {
    chamadasFetch += 1;
    throw new Error('não deveria ter sido chamado');
  };
  const antes = obterContadorChamadas();
  await assert.rejects(
    () => chamarDiscogs('https://api.discogs.com/releases/1', 'teste sem rede', { fetchImpl: fetchQueConta, semRede: true }),
    /sem rede/,
  );
  assert.equal(chamadasFetch, 0);
  assert.equal(obterContadorChamadas(), antes);
});
