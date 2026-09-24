// Monta links wa.me. O número nunca é hardcoded aqui — vem de js/config.js.
import { WHATSAPP } from './config.js';

/** Link wa.me com a mensagem já codificada. */
export function montarLink(msg) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function linhaFormato(disco) {
  const cor = disco.cor ? ` · ${disco.cor}` : '';
  return `${disco.formatoLabel}${cor} · ${disco.selo} ${disco.catno}`;
}

function linhaAnoTitulo(disco) {
  const ano = disco.ano ? ` (${disco.ano})` : '';
  return `${disco.artista} – ${disco.titulo}${ano}`;
}

/** "Avise-me quando chegar", para um disco específico. */
export function linkAviseMe(disco) {
  const msg =
    `Olá! Quero ser avisado(a) quando este disco chegar na Originária Discos:\n\n` +
    `${linhaAnoTitulo(disco)}\n${linhaFormato(disco)}\nDiscogs: ${disco.discogsUrl}\n\n` +
    `Meu nome: `;
  return montarLink(msg);
}

/** "Encontre pra mim", para um disco específico. */
export function linkEncontrePraMim(disco) {
  const msg =
    `Olá! Quero que você encontre este disco pra mim:\n\n` +
    `${linhaAnoTitulo(disco)}\n${linhaFormato(disco)}\nDiscogs: ${disco.discogsUrl}\n\n` +
    `Pode me passar prazo e valor?`;
  return montarLink(msg);
}

/** Procura genérica (sem disco específico) — usada no header, na faixa do index e no zero-resultados. */
export function linkProcuraGenerica(q = '') {
  const msg =
    `Olá! Estou procurando um disco que não encontrei no site da Originária Discos:\n\n` +
    `Artista / título: ${q}\nEdição ou prensagem (se souber): \n\nVocê consegue pra mim?`;
  return montarLink(msg);
}
