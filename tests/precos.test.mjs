import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCsvObservados,
  observadosParaId,
  mediana,
  extrairSugestoes,
  extrairEstatisticasMercado,
  valorSugestaoSeBRL,
  priorizarEdicaoVenda,
  anoDeReleased,
  calcularReedicaoBRL,
  reedicaoPrincipal,
  calcularReferenciaBRL,
  ofertasVarejoDisponiveis,
  formatarColunaVarejo,
  recalcularComObservados,
  arredondarMultiplo5,
  precoProposto,
  linhaRelatorio,
  gerarRelatorioMd,
} from '../scripts/precos.mjs';
import { versaoEhOficial, filtrarVersoesOficiais, escolherCandidatasReedicao } from '../scripts/discogs-versoes.mjs';

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
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, reedicaoBRL: null, menorAnuncioOriginalBRL: null, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, null);
  assert.deepEqual(r.base, []);
});

test('calcularReferenciaBRL: sem reedição, cai pro original + observado (mediana de 2)', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, reedicaoBRL: null, menorAnuncioOriginalBRL: 150, observadosPrecos: [180] });
  assert.equal(r.referenciaBRL, 165); // mediana(150,180) = 165
  assert.deepEqual(r.base, ['discogs-original', 'observado']);
});

test('calcularReferenciaBRL: moedaDiferente exclui a sugestão da mediana (sugestaoMintBRL null)', () => {
  // Sugestão em USD: o chamador já resolve para null antes de passar aqui.
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, reedicaoBRL: null, menorAnuncioOriginalBRL: 150, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, 150);
  assert.deepEqual(r.base, ['discogs-original']);
});

test('calcularReferenciaBRL: as 3 fontes juntas (sugestão BRL + original + observado, sem reedição)', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: 220, reedicaoBRL: null, menorAnuncioOriginalBRL: 150, observadosPrecos: [180] });
  assert.equal(r.referenciaBRL, 180); // mediana(220,150,180) = 180
  assert.deepEqual(r.base, ['discogs-sugestao', 'discogs-original', 'observado']);
});

test('calcularReferenciaBRL: com reedição, prefere reedicaoBRL e IGNORA o original (mesmo tendo os dois)', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, reedicaoBRL: 230, menorAnuncioOriginalBRL: 10400, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, 230); // nunca entra a referência de colecionador (10400) na mediana
  assert.deepEqual(r.base, ['discogs-reedicao']);
});

// --- varejo brasileiro (v5): entra na mediana e na coluna do relatório ------

test('calcularReferenciaBRL: ofertas de varejo BR entram na mediana e a base ganha "varejo-br"', () => {
  const r = calcularReferenciaBRL({
    sugestaoMintBRL: null,
    reedicaoBRL: 230,
    menorAnuncioOriginalBRL: null,
    observadosPrecos: [],
    varejoPrecos: [200, 220],
  });
  assert.equal(r.referenciaBRL, 220); // mediana([200, 220, 230]) = 220
  assert.deepEqual(r.base, ['discogs-reedicao', 'varejo-br']);
});

test('calcularReferenciaBRL: sem data/precos-varejo.json (varejoPrecos ausente), nada muda', () => {
  const r = calcularReferenciaBRL({ sugestaoMintBRL: null, reedicaoBRL: 230, menorAnuncioOriginalBRL: null, observadosPrecos: [] });
  assert.equal(r.referenciaBRL, 230);
  assert.deepEqual(r.base, ['discogs-reedicao']);
});

test('ofertasVarejoDisponiveis: filtra só disponivel === true com preco numérico', () => {
  const ofertas = [
    { loja: 'HipMusic', preco: 220, disponivel: true },
    { loja: 'Rua6', preco: 999, disponivel: false },
    { loja: 'Buzina', preco: null, disponivel: true },
  ];
  assert.deepEqual(
    ofertasVarejoDisponiveis(ofertas).map((o) => o.loja),
    ['HipMusic'],
  );
  assert.deepEqual(ofertasVarejoDisponiveis(undefined), []);
});

test('formatarColunaVarejo: "<n> · <menor>–<maior>"; sem oferta → "—"', () => {
  assert.equal(formatarColunaVarejo([{ preco: 220 }, { preco: 199 }, { preco: 240 }]), '3 · R$ 199–R$ 240');
  assert.equal(formatarColunaVarejo([]), '—');
  assert.equal(formatarColunaVarejo(undefined), '—');
});

// --- versaoEhOficial / filtrarVersoesOficiais --------------------------------

test('versaoEhOficial: exclui Unofficial Release, Test Pressing e Promo', () => {
  assert.equal(versaoEhOficial({ format: 'LP, Album, Reissue, Unofficial Release' }), false);
  assert.equal(versaoEhOficial({ format: 'LP, Album, Reissue, Test Pressing, Stereo' }), false);
  assert.equal(versaoEhOficial({ format: 'LP, Promo' }), false);
  assert.equal(versaoEhOficial({ format: 'LP, Album, Club Edition, Reissue, Stereo' }), true);
});

test('filtrarVersoesOficiais: caso real do master 112296 (África Brasil) — exclui o bootleg 2024', () => {
  const versoes = [
    { id: 31257475, released: '2024', country: 'Europe', label: 'Future Shock (4)', catno: 'FS4485', format: 'LP, Album, Reissue, Unofficial Release' },
    { id: 15793439, released: '2020', country: 'Brazil', label: 'Polysom', catno: '33057-1', format: 'LP, Album, Limited Edition, Reissue, Repress' },
    { id: 18574192, released: '2019', country: 'US', label: 'Universal Music Special Markets', catno: 'B0028558-01', format: 'LP, Album, Reissue, Test Pressing, Stereo' },
  ];
  const oficiais = filtrarVersoesOficiais(versoes);
  assert.deepEqual(oficiais.map((v) => v.id), [15793439]);
});

// --- escolherCandidatasReedicao -----------------------------------------------

test('escolherCandidatasReedicao: mesma versão é a mais recente do Brasil e no geral → 1 candidata só (dedup)', () => {
  const oficiais = [
    { id: 15793439, released: '2020', country: 'Brazil' },
    { id: 13855128, released: '2019', country: 'US' },
  ];
  const candidatas = escolherCandidatasReedicao(oficiais);
  assert.equal(candidatas.length, 1);
  assert.equal(candidatas[0].id, 15793439);
});

test('escolherCandidatasReedicao: Brasil e geral são versões diferentes → as 2, Brasil primeiro', () => {
  const oficiais = [
    { id: 999, released: '2024', country: 'Germany' },
    { id: 111, released: '2020', country: 'Brazil' },
  ];
  const candidatas = escolherCandidatasReedicao(oficiais);
  assert.deepEqual(candidatas.map((c) => c.id), [111, 999]);
});

test('escolherCandidatasReedicao: sem versão nenhuma (ou sem masterId) → []', () => {
  assert.deepEqual(escolherCandidatasReedicao([]), []);
});

test('escolherCandidatasReedicao: sem nenhuma versão do Brasil → só a mais recente geral', () => {
  const oficiais = [{ id: 1, released: '2022', country: 'UK' }, { id: 2, released: '2018', country: 'US' }];
  assert.deepEqual(escolherCandidatasReedicao(oficiais).map((c) => c.id), [1]);
});

// --- priorizarEdicaoVenda (v5): edicaoVenda entra primeiro nas candidatas ----

test('priorizarEdicaoVenda: edicaoVenda que já estava nas candidatas vai para o primeiro lugar (dedup)', () => {
  const candidatas = [
    { id: 111, released: '2020', country: 'Brazil' },
    { id: 999, released: '2024', country: 'Germany' },
  ];
  const edicaoVenda = { id: 999, ano: 2024, pais: 'Germany', selo: 'Music On Vinyl', catno: 'MOVLP1' };
  const resultado = priorizarEdicaoVenda(candidatas, edicaoVenda);
  assert.deepEqual(resultado.map((c) => c.id), [999, 111]); // 999 vai pro primeiro, sem duplicar
});

test('priorizarEdicaoVenda: edicaoVenda fixada pelo dono, ausente das candidatas automáticas, entra como 1ª', () => {
  const candidatas = [{ id: 111, released: '2020', country: 'Brazil' }];
  const edicaoVenda = { id: 777, ano: 2018, pais: 'US', selo: 'Universal', catno: 'UNI-1' };
  const resultado = priorizarEdicaoVenda(candidatas, edicaoVenda);
  assert.deepEqual(resultado.map((c) => c.id), [777, 111]);
});

test('priorizarEdicaoVenda: sem edicaoVenda devolve as candidatas automáticas sem alteração', () => {
  const candidatas = [{ id: 111, released: '2020', country: 'Brazil' }];
  assert.deepEqual(priorizarEdicaoVenda(candidatas, null), candidatas);
});

// --- anoDeReleased / calcularReedicaoBRL / reedicaoPrincipal ------------------

test('anoDeReleased: extrai o ano de "2020" ou "2020-05-12"; sem 4 dígitos → null', () => {
  assert.equal(anoDeReleased('2020'), 2020);
  assert.equal(anoDeReleased('2020-05-12'), 2020);
  assert.equal(anoDeReleased(''), null);
  assert.equal(anoDeReleased(undefined), null);
});

test('calcularReedicaoBRL: menor valor entre as reedições com exemplares à venda', () => {
  const reedicoes = [
    { id: 1, menorAnuncioBRL: 230 },
    { id: 2, menorAnuncioBRL: 180 },
    { id: 3, menorAnuncioBRL: null }, // sem exemplares à venda, não entra
  ];
  assert.equal(calcularReedicaoBRL(reedicoes), 180);
});

test('calcularReedicaoBRL: nenhuma reedição com anúncio → null', () => {
  assert.equal(calcularReedicaoBRL([{ id: 1, menorAnuncioBRL: null }]), null);
  assert.equal(calcularReedicaoBRL([]), null);
});

// --- calcularReedicaoBRL com preferirId (v5: edicaoVenda.id) -----------------

test('calcularReedicaoBRL: com preferirId e a edicaoVenda tendo anúncio, usa o preço dela (não o menor geral)', () => {
  const reedicoes = [
    { id: 15793439, menorAnuncioBRL: 300 }, // edicaoVenda — mais cara, mas é a que a loja vende
    { id: 999, menorAnuncioBRL: 150 }, // mais barata, mas não é a edicaoVenda
  ];
  assert.equal(calcularReedicaoBRL(reedicoes, 15793439), 300);
});

test('calcularReedicaoBRL: com preferirId mas a edicaoVenda sem anúncio, cai no menor entre as demais', () => {
  const reedicoes = [
    { id: 15793439, menorAnuncioBRL: null }, // edicaoVenda sem exemplar à venda
    { id: 999, menorAnuncioBRL: 150 },
  ];
  assert.equal(calcularReedicaoBRL(reedicoes, 15793439), 150);
});

test('calcularReedicaoBRL: sem preferirId continua igual (menor geral)', () => {
  const reedicoes = [{ id: 1, menorAnuncioBRL: 230 }, { id: 2, menorAnuncioBRL: 180 }];
  assert.equal(calcularReedicaoBRL(reedicoes), 180);
});

test('reedicaoPrincipal: prefere a que tem anúncio; sem nenhuma com anúncio, usa a mais recente (primeira)', () => {
  const comAnuncio = [{ id: 1, menorAnuncioBRL: null }, { id: 2, menorAnuncioBRL: 230 }];
  assert.equal(reedicaoPrincipal(comAnuncio).id, 2);
  const semAnuncio = [{ id: 1, menorAnuncioBRL: null }, { id: 2, menorAnuncioBRL: null }];
  assert.equal(reedicaoPrincipal(semAnuncio).id, 1);
  assert.equal(reedicaoPrincipal([]), null);
});

// --- recalcularComObservados (recálculo do --propor sem rede) ----------------

test('recalcularComObservados: nova linha no CSV muda referenciaBRL sem tocar nos campos de rede', () => {
  const registroCacheado = {
    menorAnuncioBRL: 10400,
    aVenda: 3,
    sugestaoMint: null,
    sugestaoNM: null,
    moeda: null,
    moedaDiferente: false,
    reedicoes: [{ id: 15793439, ano: 2020, pais: 'Brazil', selo: 'Polysom', catno: '33057-1', aVenda: 30, menorAnuncioBRL: 230 }],
    reedicaoBRL: 230,
    observados: [],
    referenciaBRL: 230,
    base: ['discogs-reedicao'],
  };
  const atualizado = recalcularComObservados(registroCacheado, [{ preco: 250, fonte: 'Loja X', data: '2026-09-27', link: null }]);
  assert.equal(atualizado.referenciaBRL, 240); // mediana(230, 250)
  assert.deepEqual(atualizado.base, ['discogs-reedicao', 'observado']);
  assert.deepEqual(atualizado.observados, [{ preco: 250, fonte: 'Loja X', data: '2026-09-27' }]);
  // campos vindos de rede continuam intactos
  assert.equal(atualizado.menorAnuncioBRL, 10400);
  assert.equal(atualizado.reedicaoBRL, 230);
});

test('recalcularComObservados: CSV sem linha pro disco volta a depender só do que já tinha', () => {
  const registroCacheado = {
    menorAnuncioBRL: null,
    sugestaoMint: null,
    moeda: null,
    reedicoes: [],
    reedicaoBRL: null,
    observados: [{ preco: 200, fonte: 'antiga', data: '2026-09-01' }],
    referenciaBRL: 200,
    base: ['observado'],
  };
  const atualizado = recalcularComObservados(registroCacheado, []);
  assert.equal(atualizado.referenciaBRL, null);
  assert.deepEqual(atualizado.base, []);
  assert.deepEqual(atualizado.observados, []);
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

test('linhaRelatorio: disco com reedição (caso real: Jorge Ben, master 112296)', () => {
  const disco = { ordem: 1, artista: 'Jorge Ben', titulo: 'África Brasil', preco: null };
  const info = {
    aVenda: 36,
    menorAnuncioBRL: 150, // original — vira colecionador, não entra na referência
    reedicoes: [{ id: 15793439, ano: 2020, pais: 'Brazil', selo: 'Polysom', catno: '33057-1', aVenda: 30, menorAnuncioBRL: 230 }],
    reedicaoBRL: 230,
    sugestaoMint: null,
    observados: [],
    referenciaBRL: 230,
  };
  const linha = linhaRelatorio(disco, info);
  assert.equal(
    linha,
    '| 1 | Jorge Ben – África Brasil | 36 | R$ 150 | 2020 · Polysom · Brazil | R$ 230 | — | — | — | R$ 230 | Sob consulta |',
  );
});

test('linhaRelatorio: disco sem nenhuma fonte (sem reedição também) usa "—" e "Sob consulta"', () => {
  const disco = { ordem: 2, artista: 'X', titulo: 'Y', preco: null };
  const linha = linhaRelatorio(disco, null);
  assert.equal(linha, '| 2 | X – Y | — | — | — | — | — | — | — | — | Sob consulta |');
});

test('linhaRelatorio: coluna varejo BR mostra n e faixa de preço quando há ofertas disponíveis', () => {
  const disco = { ordem: 3, artista: 'Jorge Ben', titulo: 'África Brasil', preco: null };
  const info = {
    aVenda: 36,
    menorAnuncioBRL: 150,
    reedicoes: [],
    reedicaoBRL: null,
    sugestaoMint: null,
    observados: [],
    varejoOfertas: [
      { loja: 'HipMusic', preco: 220, disponivel: true },
      { loja: 'Vinil Discos', preco: 199, disponivel: true },
    ],
    referenciaBRL: 210,
  };
  const linha = linhaRelatorio(disco, info);
  assert.match(linha, /\| 2 · R\$ 199–R\$ 220 \|/);
});

test('gerarRelatorioMd: conta discos com e sem referência no rodapé e traz as colunas novas', () => {
  const discos = [
    { ordem: 1, id: 1, artista: 'A', titulo: 'A1', preco: 100 },
    { ordem: 2, id: 2, artista: 'B', titulo: 'B1', preco: null },
  ];
  const discosPorId = {
    1: { referenciaBRL: 150, aVenda: 1, menorAnuncioBRL: 150, reedicoes: [], reedicaoBRL: null, sugestaoMint: null, observados: [] },
    2: { referenciaBRL: null, aVenda: null, menorAnuncioBRL: null, reedicoes: [], reedicaoBRL: null, sugestaoMint: null, observados: [] },
  };
  const md = gerarRelatorioMd(discos, discosPorId, '2026-09-27T00:00:00.000Z');
  assert.match(md, /reedição \(ano · selo · país\)/);
  assert.match(md, /menor anúncio reedição \(BRL\)/);
  assert.match(md, /original \(BRL\)/);
  assert.match(md, /varejo BR \(n · menor–maior\)/);
  const linhasTabela = md.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ordem') && !l.startsWith('| ---'));
  assert.equal(linhasTabela.length, 2);
  assert.match(md, /1 disco\(s\) com referência de preço · 1 sem referência/);
});
