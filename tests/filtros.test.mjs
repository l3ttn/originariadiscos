import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { filtrar, buscar, ordenar, paginar, lerEstado, escreverEstado } from '../js/filtros.js';

function disco(overrides = {}) {
  return {
    id: 1,
    artista: 'Artista',
    titulo: 'Título',
    ano: 2000,
    selo: 'Selo',
    secao: 'Brasil',
    generos: ['Funk / Soul'],
    formatoTipo: 'LP',
    status: 'esgotado',
    destaque: false,
    novo: false,
    adicionadoEm: '2026-01-01T00:00:00.000Z',
    ordem: 1,
    ...overrides,
  };
}

const catalogo = [
  disco({ id: 1, artista: 'Jorge Ben', titulo: 'África Brasil', secao: 'Brasil', generos: ['Jazz', 'Funk / Soul'], formatoTipo: 'LP', status: 'esgotado', destaque: true, novo: false, ano: 1976, adicionadoEm: '2026-01-03T00:00:00.000Z', ordem: 1 }),
  disco({ id: 2, artista: 'Arthur Verocai', titulo: 'Arthur Verocai', secao: 'Brasil', generos: ['Jazz'], formatoTipo: 'LP', status: 'disponivel', destaque: true, novo: false, ano: 1972, adicionadoEm: '2026-01-02T00:00:00.000Z', ordem: 2 }),
  disco({ id: 3, artista: 'MF DOOM & Madlib', titulo: 'Madvillainy', secao: 'Hip Hop', generos: ['Hip Hop'], formatoTipo: '2LP', status: 'encomenda', destaque: false, novo: true, ano: 2004, adicionadoEm: '2026-01-05T00:00:00.000Z', ordem: 3 }),
];

describe('filtrar', () => {
  test('por secao', () => {
    const r = filtrar(catalogo, { secao: 'Brasil' });
    assert.deepEqual(r.map((d) => d.id), [1, 2]);
  });

  test('por genero', () => {
    const r = filtrar(catalogo, { genero: 'Hip Hop' });
    assert.deepEqual(r.map((d) => d.id), [3]);
  });

  test('por formato', () => {
    const r = filtrar(catalogo, { formato: '2LP' });
    assert.deepEqual(r.map((d) => d.id), [3]);
  });

  test('por status', () => {
    const r = filtrar(catalogo, { status: 'disponivel' });
    assert.deepEqual(r.map((d) => d.id), [2]);
  });

  test('sem filtros devolve tudo', () => {
    assert.equal(filtrar(catalogo, {}).length, 3);
  });

  test('combina múltiplos filtros', () => {
    const r = filtrar(catalogo, { secao: 'Brasil', status: 'disponivel' });
    assert.deepEqual(r.map((d) => d.id), [2]);
  });
});

describe('buscar', () => {
  test('sem acento acha título acentuado', () => {
    const r = buscar(catalogo, 'africa');
    assert.deepEqual(r.map((d) => d.id), [1]);
  });

  test('busca por artista', () => {
    const r = buscar(catalogo, 'verocai');
    assert.deepEqual(r.map((d) => d.id), [2]);
  });

  test('sem termo devolve tudo', () => {
    assert.equal(buscar(catalogo, '').length, 3);
  });

  test('sem resultado devolve vazio', () => {
    assert.equal(buscar(catalogo, 'zzzz').length, 0);
  });
});

describe('ordenar', () => {
  test('az por artista', () => {
    const r = ordenar(catalogo, 'az');
    assert.deepEqual(r.map((d) => d.id), [2, 1, 3]); // Arthur, Jorge, MF DOOM
  });

  test('ano — mais recente primeiro', () => {
    const r = ordenar(catalogo, 'ano');
    assert.deepEqual(r.map((d) => d.id), [3, 1, 2]); // 2004, 1976, 1972
  });

  test('novos — novo primeiro, depois adicionadoEm desc', () => {
    const r = ordenar(catalogo, 'novos');
    assert.deepEqual(r.map((d) => d.id), [3, 1, 2]);
  });

  test('destaques — destaque primeiro, depois novo, depois ordem (padrão)', () => {
    const r = ordenar(catalogo, 'destaques');
    assert.deepEqual(r.map((d) => d.id), [1, 2, 3]);
  });

  test('critério ausente cai no padrão destaques', () => {
    assert.deepEqual(ordenar(catalogo).map((d) => d.id), [1, 2, 3]);
  });

  test('não muta o array original', () => {
    const copia = [...catalogo];
    ordenar(catalogo, 'az');
    assert.deepEqual(catalogo, copia);
  });
});

describe('paginar', () => {
  test('30 por página, uma página só quando há poucos itens', () => {
    const r = paginar(catalogo, 1, 30);
    assert.equal(r.itens.length, 3);
    assert.equal(r.totalPaginas, 1);
    assert.equal(r.paginaAtual, 1);
    assert.equal(r.total, 3);
  });

  test('divide corretamente com mais de 30 itens', () => {
    const muitos = Array.from({ length: 65 }, (_, i) => disco({ id: i + 1, ordem: i + 1 }));
    const p1 = paginar(muitos, 1, 30);
    assert.equal(p1.itens.length, 30);
    assert.equal(p1.totalPaginas, 3);

    const p3 = paginar(muitos, 3, 30);
    assert.equal(p3.itens.length, 5);
    assert.equal(p3.paginaAtual, 3);
  });

  test('página fora do intervalo é grampeada', () => {
    const r = paginar(catalogo, 99, 30);
    assert.equal(r.paginaAtual, 1);
  });

  test('lista vazia não quebra', () => {
    const r = paginar([], 1, 30);
    assert.equal(r.itens.length, 0);
    assert.equal(r.totalPaginas, 1);
    assert.equal(r.total, 0);
  });
});

describe('estado da URL', () => {
  test('lerEstado com params vazios usa padrões', () => {
    const estado = lerEstado(new URLSearchParams(''));
    assert.deepEqual(estado, { secao: '', genero: '', formato: '', status: '', q: '', ordem: 'destaques', pagina: 1 });
  });

  test('lerEstado lê secao e q', () => {
    const estado = lerEstado(new URLSearchParams('secao=Brasil&q=verocai'));
    assert.equal(estado.secao, 'Brasil');
    assert.equal(estado.q, 'verocai');
  });

  test('ordem inválida cai no padrão', () => {
    const estado = lerEstado(new URLSearchParams('ordem=inventado'));
    assert.equal(estado.ordem, 'destaques');
  });

  test('escreverEstado omite valores padrão', () => {
    const params = escreverEstado({ secao: '', genero: '', formato: '', status: '', q: '', ordem: 'destaques', pagina: 1 });
    assert.equal(params.toString(), '');
  });

  test('escreverEstado mantém valores não padrão', () => {
    const params = escreverEstado({ secao: 'Brasil', q: 'verocai', ordem: 'az', pagina: 2 });
    assert.equal(params.get('secao'), 'Brasil');
    assert.equal(params.get('q'), 'verocai');
    assert.equal(params.get('ordem'), 'az');
    assert.equal(params.get('pagina'), '2');
  });

  test('ida e volta preserva o estado', () => {
    const original = { secao: 'Hip Hop', genero: 'Jazz', formato: 'LP', status: 'disponivel', q: 'busca', ordem: 'ano', pagina: 3 };
    const params = escreverEstado(original);
    const relido = lerEstado(params);
    assert.deepEqual(relido, original);
  });
});
