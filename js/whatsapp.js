// Monta links wa.me. O número nunca é hardcoded aqui — vem de js/config.js.
import { WHATSAPP, NOME_LOJA } from './config.js';
import { mensagemPedido } from './carrinho.js';

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

/** CTA único da ficha: mensagem varia conforme o status do disco. */
export function linkSolicitar(disco) {
  const linha1 =
    disco.status === 'disponivel'
      ? 'Olá! Quero este disco:'
      : 'Olá! Vi que este disco está esgotado no site e quero solicitar o meu:';
  const msg =
    `${linha1}\n\n` +
    `${linhaAnoTitulo(disco)}\n${linhaFormato(disco)}\nDiscogs: ${disco.discogsUrl}\n\n` +
    `Pode me passar disponibilidade, prazo e valor?`;
  return montarLink(msg);
}

/** Procura genérica (sem disco específico) — usada no header, na faixa do index e no zero-resultados. */
export function linkProcuraGenerica(q = '') {
  const msg =
    `Olá! Estou procurando um disco que não encontrei no site da Originária Discos:\n\n` +
    `Artista / título: ${q}\nEdição ou prensagem (se souber): \n\nVocê consegue pra mim?`;
  return montarLink(msg);
}

/** Link "Pedir pelo WhatsApp" do carrinho, com a mensagem inteira do pedido. */
export function linkPedido(estado, catalogo) {
  return montarLink(mensagemPedido(estado, catalogo, NOME_LOJA));
}
