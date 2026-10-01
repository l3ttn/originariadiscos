import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  adicionar,
  remover,
  definirQtd,
  total,
  formatarPreco,
  formatarSubtotal,
  formatarTotal,
  mensagemPedido,
} from '../js/carrinho.js';

const catalogoPath = fileURLToPath(new URL('../data/catalogo.json', import.meta.url));
const catalogo = JSON.parse(readFileSync(catalogoPath, 'utf8')).discos;

// Três discos reais do catálogo (data/catalogo.json), todos sem preço lá.
const JORGE_BEN_ID = 726944;
const ARTHUR_VEROCAI_ID = 2968639;
const MADVILLAINY_ID = 242785;

function disco(id) {
  return catalogo.find((d) => d.id === id);
}

// Clone do catálogo de teste do contrato: 726944 com preco=220, 2968639 sem
// preço, 242785 com preco=180. Os preços são injetados só no teste, nunca em
// data/catalogo.json. edicaoVenda forçado a null em todos: este fixture cobre
// o cenário "sem edição" (texto esperado usa selo/catno da prensagem), e não
// pode depender de o catálogo real ainda não ter o campo — quando o pipeline
// passar a gravar edicaoVenda nos discos reais, o teste continua cobrindo o
// caso que ele diz cobrir.
function catalogoComPrecosDoContrato() {
  return catalogo.map((d) => {
    if (d.id === JORGE_BEN_ID) return { ...d, preco: 220, edicaoVenda: null };
    if (d.id === MADVILLAINY_ID) return { ...d, preco: 180, edicaoVenda: null };
    return { ...d, edicaoVenda: null };
  });
}

// Clone do catálogo real forçando edicaoVenda: null — usado pelos testes que
// esperam o texto "sem edição" (selo/catno da prensagem) e não têm por que
// depender de o catálogo real ter ou não o campo.
function catalogoSemEdicao() {
  return catalogo.map((d) => ({ ...d, edicaoVenda: null }));
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

describe('formatarPreco', () => {
  test('sem separador de milhar', () => {
    assert.equal(formatarPreco(220), 'R$ 220');
  });

  test('com separador de milhar', () => {
    assert.equal(formatarPreco(1250), 'R$ 1.250');
  });
});

describe('formatarSubtotal (página do carrinho)', () => {
  test('com preço, qtd 1: só o preço', () => {
    assert.equal(formatarSubtotal(220, 1), 'R$ 220');
  });

  test('com preço, qtd > 1: qtd × preço = subtotal', () => {
    assert.equal(formatarSubtotal(220, 2), '2 × R$ 220 = R$ 440');
  });

  test('sem preço: Sob consulta, com qualquer qtd', () => {
    assert.equal(formatarSubtotal(null, 1), 'Sob consulta');
    assert.equal(formatarSubtotal(null, 3), 'Sob consulta');
  });
});

describe('total', () => {
  test('sem preço: valor 0 e itensSemPreco conta os itens', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, ARTHUR_VEROCAI_ID);
    const resultado = total(estado, catalogo);
    assert.equal(resultado.valor, 0);
    assert.equal(resultado.itensComPreco, 0);
    assert.equal(resultado.itensSemPreco, 2);
  });

  test('com preço: soma preco * qtd, itensSemPreco 0', () => {
    const catalogoComPreco = catalogo.map((d) =>
      d.id === JORGE_BEN_ID ? { ...d, preco: 220 } : d
    );
    let estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 2
    const resultado = total(estado, catalogoComPreco);
    assert.equal(resultado.valor, 440);
    assert.equal(resultado.itensComPreco, 1);
    assert.equal(resultado.itensSemPreco, 0);
  });

  test('misto: soma só os com preço, conta os dois grupos', () => {
    const catalogoTeste = catalogoComPrecosDoContrato();
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID);
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 2, preco 220
    estado = adicionar(estado, ARTHUR_VEROCAI_ID); // qtd 1, sem preço
    estado = adicionar(estado, MADVILLAINY_ID); // qtd 1, preco 180
    const resultado = total(estado, catalogoTeste);
    assert.equal(resultado.valor, 620);
    assert.equal(resultado.itensComPreco, 2);
    assert.equal(resultado.itensSemPreco, 1);
  });

  test('item de id inexistente no catálogo é ignorado', () => {
    const estado = adicionar({ itens: [], obs: '' }, 999999);
    const resultado = total(estado, catalogo);
    assert.equal(resultado.valor, 0);
    assert.equal(resultado.itensComPreco, 0);
    assert.equal(resultado.itensSemPreco, 0);
  });
});

describe('formatarTotal — as três formas', () => {
  test('todos com preço: "Total: R$ 660"', () => {
    assert.equal(
      formatarTotal({ valor: 660, itensComPreco: 3, itensSemPreco: 0 }),
      'Total: R$ 660'
    );
  });

  test('misto: "Total: R$ 620 + 1 item sob consulta" (singular e plural)', () => {
    assert.equal(
      formatarTotal({ valor: 620, itensComPreco: 2, itensSemPreco: 1 }),
      'Total: R$ 620 + 1 item sob consulta'
    );
    assert.equal(
      formatarTotal({ valor: 620, itensComPreco: 2, itensSemPreco: 2 }),
      'Total: R$ 620 + 2 itens sob consulta'
    );
  });

  test('nenhum com preço: "Total: sob consulta (N itens sem preço)" (como hoje)', () => {
    assert.equal(
      formatarTotal({ valor: 0, itensComPreco: 0, itensSemPreco: 2 }),
      'Total: sob consulta (2 itens sem preço)'
    );
    assert.equal(
      formatarTotal({ valor: 0, itensComPreco: 0, itensSemPreco: 1 }),
      'Total: sob consulta (1 item sem preço)'
    );
  });
});

describe('finais de linha do item na mensagem — os quatro casos', () => {
  const discoTeste = {
    id: 1,
    artista: 'Artista Teste',
    titulo: 'Título Teste',
    ano: null,
    formatoLabel: 'Vinil LP',
    selo: 'Selo',
    catno: 'CAT-001',
    discogsUrl: 'https://example.com/1',
  };

  function linhaItem(preco, qtd) {
    const catalogoTeste = [{ ...discoTeste, preco }];
    let estado = adicionar({ itens: [], obs: '' }, 1);
    estado = definirQtd(estado, 1, qtd);
    const msg = mensagemPedido(estado, catalogoTeste, 'Loja');
    return msg.split('\n')[2];
  }

  test('com preço, qtd 1 → "· R$ 220"', () => {
    assert.ok(linhaItem(220, 1).endsWith('· R$ 220'));
  });

  test('com preço, qtd > 1 → "· 2 un. × R$ 220 = R$ 440"', () => {
    assert.ok(linhaItem(220, 2).endsWith('· 2 un. × R$ 220 = R$ 440'));
  });

  test('sem preço, qtd 1 → "· Sob consulta"', () => {
    assert.ok(linhaItem(null, 1).endsWith('· Sob consulta'));
  });

  test('sem preço, qtd > 1 → "· 2 un. · Sob consulta"', () => {
    assert.ok(linhaItem(null, 2).endsWith('· 2 un. · Sob consulta'));
  });
});

describe('mensagemPedido', () => {
  test('sem preço (como antes do v3): item vira "Sob consulta", total "sob consulta"', () => {
    let estado = { itens: [], obs: '' };
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 1
    estado = adicionar(estado, JORGE_BEN_ID); // qtd 2
    estado = adicionar(estado, ARTHUR_VEROCAI_ID); // qtd 1

    const msg = mensagemPedido(estado, catalogoSemEdicao(), 'Originária Discos');
    const linhas = msg.split('\n');

    assert.equal(linhas[0], 'Olá! Quero fazer um pedido na Originária Discos:');
    assert.equal(
      linhas[2],
      '1. Jorge Ben – África Brasil (1976) · Vinil LP · Philips 6349 187 · 2 un. · Sob consulta'
    );
    assert.equal(linhas[3], '   discogs.com/release/726944');
    assert.ok(msg.includes('Total: sob consulta (2 itens sem preço)'));
    assert.equal(linhas[linhas.length - 1], 'Pode me passar disponibilidade, prazo e valor?');
  });

  test('bate literalmente com o modelo v3 do contrato: 3 discos reais, preços injetados no teste', () => {
    const catalogoTeste = catalogoComPrecosDoContrato();
    const estado = {
      itens: [
        { id: JORGE_BEN_ID, qtd: 2 },
        { id: ARTHUR_VEROCAI_ID, qtd: 1 },
        { id: MADVILLAINY_ID, qtd: 1 },
      ],
      obs: '',
    };

    const msg = mensagemPedido(estado, catalogoTeste, 'Originária Discos');

    const esperado = [
      'Olá! Quero fazer um pedido na Originária Discos:',
      '',
      '1. Jorge Ben – África Brasil (1976) · Vinil LP · Philips 6349 187 · 2 un. × R$ 220 = R$ 440',
      '   discogs.com/release/726944',
      '2. Arthur Verocai – Arthur Verocai (1972) · Vinil LP · Continental SLP-10.079 · Sob consulta',
      '   discogs.com/release/2968639',
      '3. MF DOOM & Madlib & Madvillain – Madvillainy (2004) · Vinil 2LP · Stones Throw Records STH2065 · R$ 180',
      '   discogs.com/release/242785',
      '',
      'Total: R$ 620 + 1 item sob consulta',
      '',
      'Pode me passar disponibilidade, prazo e valor?',
    ].join('\n');

    assert.equal(msg, esperado);
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
    assert.equal(disco(MADVILLAINY_ID).preco, null);
  });

  test('com edicaoVenda: trecho de selo/ano/catno da edição e link do release dela (v5)', () => {
    const catalogoTeste = catalogo.map((d) =>
      d.id === JORGE_BEN_ID
        ? {
            ...d,
            preco: 220,
            edicaoVenda: { id: 15793439, ano: 2020, pais: 'Brazil', selo: 'Polysom', catno: '33057-1' },
          }
        : d
    );
    const estado = adicionar({ itens: [], obs: '' }, JORGE_BEN_ID);
    const comQtd2 = definirQtd(estado, JORGE_BEN_ID, 2);

    const msg = mensagemPedido(comQtd2, catalogoTeste, 'Originária Discos');
    const linhas = msg.split('\n');

    assert.equal(
      linhas[2],
      '1. Jorge Ben – África Brasil (1976) · Vinil LP · Polysom 2020 · 33057-1 · 2 un. × R$ 220 = R$ 440'
    );
    assert.equal(linhas[3], '   discogs.com/release/15793439');
  });
});
