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
