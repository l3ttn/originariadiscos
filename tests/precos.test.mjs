import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCsvObservados,
  observadosParaId,
  mediana,
  extrairSugestoes,
  extrairEstatisticasMercado,
  valorSugestaoSeBRL,
  calcularReferenciaBRL,
  arredondarMultiplo5,
  precoProposto,
  linhaRelatorio,
  gerarRelatorioMd,
} from '../scripts/precos.mjs';

// --- parseCsvObservados ----------------------------------------------------

test('parseCsvObservados: linha válida é parseada, cabeçalho e exemplos comentados são ignorados', () => {
  const conteudo = [
    'id,preco,fonte,data,link',
    '# 726944,180,Grupo WhatsApp,2026-09-20,https://exemplo.com',
    '',
    '242785,220,Loja Vinil Rio,2026-09-15,https://loja.exemplo.com/madvillainy',
  ].join('\n');
  const { porId, avisos } = parseCsvObservados(conteudo);
  assert.equal(avisos.length, 0);
  assert.equal(porId.has(726944), false); // linha comentada não entra
  assert.deepEqual(porId.get(242785), [
    { preco: 220, fonte: 'Loja Vinil Rio', data: '2026-09-15', link: 'https://loja.exemplo.com/madvillainy' },
  ]);
});

test('parseCsvObservados: id inválido e preco inválido geram aviso e são ignorados', () => {
  const conteudo = [
    'id,preco,fonte,data,link',
    'abc,220,Fonte,2026-09-15,',
    '242785,-10,Fonte,2026-09-15,',
    '242785,0,Fonte,2026-09-15,',
  ].join('\n');
  const { porId, avisos } = parseCsvObservados(conteudo);
  assert.equal(porId.size, 0);
  assert.equal(avisos.length, 3);
  assert.match(avisos[0], /id inválido/);
  assert.match(avisos[1], /preco inválido/);
  assert.match(avisos[2], /preco inválido/);
});

test('parseCsvObservados: acumula várias observações para o mesmo id', () => {
  const conteudo = ['id,preco,fonte,data,link', '726944,180,A,2026-09-01,', '726944,190,B,2026-09-10,'].join('\n');
  const { porId } = parseCsvObservados(conteudo);
  assert.equal(porId.get(726944).length, 2);
});

// --- observadosParaId -------------------------------------------------------

test('observadosParaId: id que não existe no CSV (ou no catálogo) devolve lista vazia', () => {
  const { porId } = parseCsvObservados('id,preco,fonte,data,link\n726944,180,A,2026-09-01,');
  assert.deepEqual(observadosParaId(porId, 999999), []);
  assert.equal(observadosParaId(porId, 726944).length, 1);
});

// --- mediana -----------------------------------------------------------------

test('mediana: 1 fonte devolve o próprio valor', () => {
  assert.equal(mediana([150]), 150);
});

test('mediana: 2 fontes devolve a média das duas', () => {
  assert.equal(mediana([150, 200]), 175);
});

test('mediana: 3 fontes devolve o valor do meio', () => {
  assert.equal(mediana([300, 150, 200]), 200);
});

test('mediana: lista vazia devolve null', () => {
  assert.equal(mediana([]), null);
});

// --- extrairEstatisticasMercado / extrairSugestoes (resposta simulada, sem rede) --

test('extrairEstatisticasMercado: extrai lowest_price.value e num_for_sale', () => {
  const r = extrairEstatisticasMercado({ num_for_sale: 36, lowest_price: { value: 150.0, currency: 'BRL' }, blocked_from_sale: false });
  assert.equal(r.menorAnuncioBRL, 150);
  assert.equal(r.aVenda, 36);
});

test('extrairEstatisticasMercado: sem exemplares à venda, lowest_price null', () => {
  const r = extrairEstatisticasMercado({ num_for_sale: 0, lowest_price: null });
  assert.equal(r.menorAnuncioBRL, null);
  assert.equal(r.aVenda, 0);
});

test('extrairSugestoes: resposta simulada com token — extrai Mint e Near Mint', () => {
  const r = extrairSugestoes({
    'Mint (M)': { currency: 'BRL', value: 220 },
    'Near Mint (NM or M-)': { currency: 'BRL', value: 180 },
  });
  assert.deepEqual(r.sugestaoMint, { currency: 'BRL', value: 220 });
  assert.deepEqual(r.sugestaoNM, { currency: 'BRL', value: 180 });
  assert.equal(r.moeda, 'BRL');
  assert.equal(r.moedaDiferente, false);
});

test('extrairSugestoes: moeda diferente de BRL marca moedaDiferente', () => {
  const r = extrairSugestoes({ 'Mint (M)': { currency: 'USD', value: 12.3 } });
  assert.equal(r.moeda, 'USD');
  assert.equal(r.moedaDiferente, true);
});

test('extrairSugestoes: sem token (mensagem de erro da API) devolve tudo null', () => {
  const r = extrairSugestoes({ message: 'You must authenticate to access this resource.' });
  assert.equal(r.sugestaoMint, null);
  assert.equal(r.moeda, null);
  assert.equal(r.moedaDiferente, false);
});

// --- valorSugestaoSeBRL / calcularReferenciaBRL ------------------------------

test('valorSugestaoSeBRL: moeda BRL devolve o valor', () => {
  assert.equal(valorSugestaoSeBRL({ value: 220, currency: 'BRL' }, 'BRL'), 220);
});

test('valorSugestaoSeBRL: moeda diferente devolve null', () => {
  assert.equal(valorSugestaoSeBRL({ value: 12.3, currency: 'USD' }, 'USD'), null);
});

test('calcularReferenciaBRL: nenhuma fonte devolve referenciaBRL null e base vazia', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, menorAnuncioBRL: null, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, null);
  assert.deepEqual(r.base, []);
});

test('calcularReferenciaBRL: menor anúncio + observado, mediana de 2 e base com as 2 fontes', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, menorAnuncioBRL: 150, observadosPrecos: [180] });
  assert.equal(r.referenciaBRL, 165); // mediana(150,180) = 165
  assert.deepEqual(r.base, ['discogs-menor', 'observado']);
});

test('calcularReferenciaBRL: moedaDiferente exclui a sugestão da mediana (sugestaoMintBRL null)', () => {
  // Sugestão em USD: o chamador já resolve para null antes de passar aqui.
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, menorAnuncioBRL: 150, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, 150);
  assert.deepEqual(r.base, ['discogs-menor']);
});

test('calcularReferenciaBRL: as 3 fontes juntas (sugestão BRL + menor + observado)', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: 220, menorAnuncioBRL: 150, observadosPrecos: [180] });
  assert.equal(r.referenciaBRL, 180); // mediana(220,150,180) = 180
  assert.deepEqual(r.base, ['discogs-sugestao', 'discogs-menor', 'observado']);
});

// --- arredondamento / proposta -----------------------------------------------

test('arredondarMultiplo5: arredonda para o múltiplo de 5 mais próximo', () => {
  assert.equal(arredondarMultiplo5(182), 180);
  assert.equal(arredondarMultiplo5(183), 185);
  assert.equal(arredondarMultiplo5(150), 150);
});

test('precoProposto: referência × margem, arredondado para múltiplo de 5', () => {
  assert.equal(precoProposto(180, 1.1), 200); // 198 -> 200
  assert.equal(precoProposto(150, 1.0), 150);
  assert.equal(precoProposto(null, 1.0), null);
});

// --- linhaRelatorio / gerarRelatorioMd ---------------------------------------

test('linhaRelatorio: linha da tabela para um disco de exemplo', () => {
  const disco = { ordem: 1, artista: 'Jorge Ben', titulo: 'África Brasil', preco: 220 };
  const info = {
    aVenda: 36,
    menorAnuncioBRL: 150,
    sugestaoMint: { value: 220, currency: 'BRL' },
    observados: [{ preco: 180, fonte: 'A', data: '2026-09-01' }],
    referenciaBRL: 185,
  };
  const linha = linhaRelatorio(disco, info);
  assert.equal(
    linha,
    '| 1 | Jorge Ben – África Brasil | 36 | R$ 150 | 220 BRL | R$ 180 | R$ 185 | R$ 220 |',
  );
});

test('linhaRelatorio: disco sem nenhuma fonte usa "—" e "Sob consulta"', () => {
  const disco = { ordem: 2, artista: 'X', titulo: 'Y', preco: null };
  const linha = linhaRelatorio(disco, null);
  assert.equal(linha, '| 2 | X – Y | — | — | — | — | — | Sob consulta |');
});

test('gerarRelatorioMd: conta discos com e sem referência no rodapé', () => {
  const discos = [
    { ordem: 1, id: 1, artista: 'A', titulo: 'A1', preco: 100 },
    { ordem: 2, id: 2, artista: 'B', titulo: 'B1', preco: null },
  ];
  const discosPorId = {
    1: { referenciaBRL: 150, aVenda: 1, menorAnuncioBRL: 150, sugestaoMint: null, observados: [] },
    2: { referenciaBRL: null, aVenda: null, menorAnuncioBRL: null, sugestaoMint: null, observados: [] },
  };
  const md = gerarRelatorioMd(discos, discosPorId, '2026-09-27T00:00:00.000Z');
  const linhasTabela = md.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ordem') && !l.startsWith('| ---'));
  assert.equal(linhasTabela.length, 2);
  assert.match(md, /1 disco\(s\) com referência de preço · 1 sem referência/);
});
