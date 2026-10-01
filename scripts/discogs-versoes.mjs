// Escolha de reedição a partir de /masters/{id}/versions — compartilhado pelo pipeline
// (scripts/build-catalogo.mjs, campo `edicaoVenda`) e pelos preços de referência
// (scripts/precos.mjs, campo `reedicoes`/`reedicaoBRL`).
// Ver CONTRATO.md — seções "Preços (v4.1)" e "Edição à venda (v5)".

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chamarDiscogs, escreverJsonAtomic, lerJsonSeExistir, listaFormato } from './build-catalogo.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(SCRIPT_DIR, '..');
const CACHE_DIR = path.join(ROOT_DIR, 'data', 'cache');

const CACHE_FRESCURA_MS = 6 * 60 * 60 * 1000; // 6h — mesmo teto do cache de release do pipeline
const FORMATOS_REEDICAO_EXCLUIDOS = new Set(['unofficial release', 'test pressing', 'promo']);

/** Uma versão (item de /masters/{id}/versions) é oficial se `format` não contém bootleg/promo/teste. */
export function versaoEhOficial(versao) {
  const formatos = listaFormato(versao?.format).map((f) => f.toLowerCase());
  return !formatos.some((f) => FORMATOS_REEDICAO_EXCLUIDOS.has(f));
}

/** Filtra fora Unofficial Release / Test Pressing / Promo (ex.: bootleg de 2024, id 31257475). */
export function filtrarVersoesOficiais(versoes) {
  return (Array.isArray(versoes) ? versoes : []).filter(versaoEhOficial);
}

/**
 * Candidatas de reedição a partir de versões já oficiais e ordenadas por `released` desc (a
 * API garante essa ordem via sort=released&sort_order=desc — a função não reordena, só
 * escolhe): a mais recente com country === "Brazil" e a mais recente no geral, sem repetir
 * id (no máximo 2). Lista vazia → [] (nenhuma reedição; usa só a original).
 */
export function escolherCandidatasReedicao(versoesOficiaisOrdenadas) {
  const lista = Array.isArray(versoesOficiaisOrdenadas) ? versoesOficiaisOrdenadas : [];
  if (lista.length === 0) return [];
  const maisRecenteGeral = lista[0];
  const maisRecenteBrasil = lista.find((v) => v?.country === 'Brazil') || null;
  const candidatas = [];
  if (maisRecenteBrasil) candidatas.push(maisRecenteBrasil);
  if (maisRecenteGeral && (!maisRecenteBrasil || maisRecenteGeral.id !== maisRecenteBrasil.id)) {
    candidatas.push(maisRecenteGeral);
  }
  return candidatas.slice(0, 2);
}

/** Versões (Vinyl) do master, com cache de 6h em data/cache/versoes-{masterId}.json. */
export async function obterVersoesReedicao(masterId) {
  const caminho = path.join(CACHE_DIR, `versoes-${masterId}.json`);
  const cache = await lerJsonSeExistir(caminho);
  if (cache && cache._fetchedAt) {
    const idade = Date.now() - new Date(cache._fetchedAt).getTime();
    if (Number.isFinite(idade) && idade < CACHE_FRESCURA_MS) {
      return Array.isArray(cache.versions) ? cache.versions : [];
    }
  }
  const dados = await chamarDiscogs(
    `https://api.discogs.com/masters/${masterId}/versions?format=Vinyl&sort=released&sort_order=desc&per_page=10`,
    `masters/${masterId}/versions(reedicao)`,
  );
  const versions = Array.isArray(dados.versions) ? dados.versions : [];
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await escreverJsonAtomic(caminho, { _fetchedAt: new Date().toISOString(), versions });
  return versions;
}
