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

test('derivarFormatoTipo: descriptions com 12" tem prioridade sobre qty', () => {
  const formats = [{ name: 'Vinyl', qty: '1', text: '', descriptions: ['12"', 'Maxi-Single'] }];
  assert.equal(derivarFormatoTipo(formats), '12"');
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
