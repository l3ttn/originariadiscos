import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { montarLink, linkAviseMe, linkEncontrePraMim, linkProcuraGenerica } from '../js/whatsapp.js';
import { WHATSAPP } from '../js/config.js';

// Disco no formato da fixture data/catalogo.json (Jorge Ben – África Brasil).
const discoComCorEAno = {
  artista: 'Jorge Ben',
  titulo: 'África Brasil',
  ano: 1976,
  selo: 'Philips',
  catno: '6349 187',
  formatoLabel: 'Vinil LP',
  cor: 'Red',
  discogsUrl: 'https://www.discogs.com/release/726944-Jorge-Ben-África-Brasil',
};

const discoSemCorSemAno = {
  artista: 'Arthur Verocai',
  titulo: 'Arthur Verocai',
  ano: null,
  selo: 'Continental',
  catno: 'SLP-10.079',
  formatoLabel: 'Vinil 2LP',
  cor: null,
  discogsUrl: 'https://www.discogs.com/release/2968639-Arthur-Verocai-Arthur-Verocai',
};

function textoDoLink(href) {
  return decodeURIComponent(new URL(href).searchParams.get('text'));
}

describe('montarLink', () => {
  test('usa o número de js/config.js, nunca hardcoded', () => {
    const href = montarLink('oi');
    assert.equal(href, `https://wa.me/${WHATSAPP}?text=oi`);
    assert.equal(WHATSAPP, '5547900000000');
  });
});

for (const [nome, gerar] of [
  ['linkAviseMe', linkAviseMe],
  ['linkEncontrePraMim', linkEncontrePraMim],
]) {
  describe(nome, () => {
    test('com cor e ano: href e conteúdo decodificado corretos', () => {
      const href = gerar(discoComCorEAno);
      assert.ok(href.startsWith(`https://wa.me/${WHATSAPP}?text=`));
      const texto = textoDoLink(href);
      assert.ok(texto.includes('Jorge Ben'));
      assert.ok(texto.includes('África Brasil'));
      assert.ok(texto.includes('1976'));
      assert.ok(texto.includes('Vinil LP'));
      assert.ok(texto.includes('Red'));
      assert.ok(texto.includes('Philips'));
      assert.ok(texto.includes('6349 187'));
      assert.ok(texto.includes(discoComCorEAno.discogsUrl));
    });

    test('sem cor e sem ano: omite os dois, sem deixar buracos estranhos', () => {
      const href = gerar(discoSemCorSemAno);
      const texto = textoDoLink(href);
      assert.ok(texto.includes('Arthur Verocai'));
      assert.ok(!texto.includes('()')); // ano ausente não deixa parênteses vazios
      assert.ok(!texto.includes(' · null'));
      assert.ok(!/·\s*·/.test(texto)); // cor ausente não deixa "·" duplicado
      assert.ok(texto.includes('Vinil 2LP'));
      assert.ok(texto.includes('Continental'));
      assert.ok(texto.includes(discoSemCorSemAno.discogsUrl));
    });
  });
}

describe('linkProcuraGenerica', () => {
  test('com termo de busca', () => {
    const href = linkProcuraGenerica('verocai');
    assert.ok(href.startsWith(`https://wa.me/${WHATSAPP}?text=`));
    const texto = textoDoLink(href);
    assert.ok(texto.includes('verocai'));
  });

  test('sem termo de busca (procura genérica do header/faixa)', () => {
    const href = linkProcuraGenerica();
    const texto = textoDoLink(href);
    assert.ok(texto.includes('Artista / título:'));
  });
});
