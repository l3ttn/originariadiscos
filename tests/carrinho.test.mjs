import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  adicionar,
  remover,
  definirQtd,
  total,
  mensagemPedido,
} from '../js/carrinho.js';

const catalogoPath = fileURLToPath(new URL('../data/catalogo.json', import.meta.url));
const catalogo = JSON.parse(readFileSync(catalogoPath, 'utf8')).discos;

// Dois discos reais do catálogo, ambos sem preço (data/catalogo.json).
const JORGE_BEN_ID = 726944;
const ARTHUR_VEROCAI_ID = 2968639;

function disco(id) {
  return catalogo.find((d) => d.id === id);
}

describe('adicionar', () => {
  test('disco novo entra com qtd 1', () => {
    const estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    assert.deepEqual(estado.itens, [{ id: JORGE_BEN_ID, qtd: 1 }]);
  });

  test('disco repetido soma 1 na qtd existente', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, JORGE_BEN_ID);
    assert.deepEqual(estado.itens, [{ id: JORGE_BEN_ID, qtd: 2 }]);
  });

  test('não muda o estado original (imutável)', () => {
    const original = { itens: [], obs: '' };
    adicionar(original, JORGE_BEN_ID);
    assert.deepEqual(original.itens, []);
  });
});

describe('remover', () => {
  test('remove só o item pedido, mantém os outros', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, ARTHUR_VEROCAI_ID);
    estado = remover(estado, JORGE_BEN_ID);
    assert.deepEqual(estado.itens, [{ id: ARTHUR_VEROCAI_ID, qtd: 1 }]);
  });
});

describe('definirQtd', () => {
  test('fixa a quantidade pedida, dentro do intervalo', () => {
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    estado = definirQtd(estado, JORGE_BEN_ID, 5);
    assert.equal(estado.itens[0].qtd, 5);
  });

  test('limite inferior: nunca abaixo de 1', () => {
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    estado = definirQtd(estado, JORGE_BEN_ID, 0);
    assert.equal(estado.itens[0].qtd, 1);
    estado = definirQtd(estado, JORGE_BEN_ID, -3);
    assert.equal(estado.itens[0].qtd, 1);
  });

  test('limite superior: nunca acima de 9', () => {
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    estado = definirQtd(estado, JORGE_BEN_ID, 9);
    assert.equal(estado.itens[0].qtd, 9);
    estado = definirQtd(estado, JORGE_BEN_ID, 20);
    assert.equal(estado.itens[0].qtd, 9);
  });
});

describe('total', () => {
  test('sem preço: valor 0 e temSemPreco conta os itens', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, ARTHUR_VEROCAI_ID);
    const resultado = total(estado, catalogo);
    assert.equal(resultado.valor, 0);
    assert.equal(resultado.temSemPreco, 2);
  });

  test('com preço: soma preco * qtd, temSemPreco 0', () => {
    const catalogoComPreco = catalogo.map((d) =>
      d.id === JORGE_BEN_ID ? { ...d, preco: 220 } : d
    );
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 2
    const resultado = total(estado, catalogoComPreco);
    assert.equal(resultado.valor, 440);
    assert.equal(resultado.temSemPreco, 0);
  });

  test('item de id inexistente no catálogo é ignorado', () => {
    const estado = adicionar({ itens: [], obs: '' }, 999999);
    const resultado = total(estado, catalogo);
    assert.equal(resultado.valor, 0);
    assert.equal(resultado.temSemPreco, 0);
  });
});

describe('mensagemPedido', () => {
  test('bate literalmente com o modelo do contrato: 2 discos reais sem preço', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 1
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 2
    estado = adicionar(estado, ARTHUR_VEROCAI_ID); // qtd 1

    const msg = mensagemPedido(estado, catalogo, 'Originária Discos');
    const linhas = msg.split('\n');

    assert.equal(linhas[0], 'Olá! Quero fazer um pedido na Originária Discos:');
    assert.equal(
      linhas[2],
      '1. Jorge Ben – África Brasil (1976) · Vinil LP · Philips 6349 187 · 2 un.'
    );
    assert.equal(linhas[3], '   discogs.com/release/726944');
    assert.ok(msg.includes('Total: sob consulta (2 itens sem preço)'));
    assert.equal(linhas[linhas.length - 1], 'Pode me passar disponibilidade, prazo e valor?');
  });

  test('item de id inexistente no catálogo é ignorado, não quebra a mensagem', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, 999999);

    const msg = mensagemPedido(estado, catalogo, 'Originária Discos');
    assert.ok(!msg.includes('999999'));
    assert.ok(msg.includes('Jorge Ben'));
  });

  test('observação só aparece quando não vazia', () => {
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    const semObs = mensagemPedido(estado, catalogo, 'Originária Discos');
    assert.ok(!semObs.includes('Observação:'));

    estado = { ...estado, obs: 'Embalar com cuidado' };
    const comObs = mensagemPedido(estado, catalogo, 'Originária Discos');
    assert.ok(comObs.includes('Observação: Embalar com cuidado'));
  });

  test('sanidade dos discos usados na fixture (mesmos dados de data/catalogo.json)', () => {
    assert.equal(disco(JORGE_BEN_ID).preco, null);
    assert.equal(disco(ARTHUR_VEROCAI_ID).preco, null);
  });
});
