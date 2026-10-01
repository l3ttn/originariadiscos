// Carrinho (v3) — pedido com vários discos pelo WhatsApp, sem pagamento,
// com preço unitário e subtotal por item.
// Funções puras e testáveis (adicionar, remover, definirQtd, total,
// mensagemPedido, quantidadeTotal, formatarPreco, formatarSubtotal,
// formatarTotal) + camada de I/O (carregar, salvar, atualizarContadorHeader)
// que toca localStorage/DOM.

const CHAVE = 'originaria.carrinho.v1';
const QTD_MIN = 1;
const QTD_MAX = 9;

function clampQtd(qtd) {
  return Math.min(QTD_MAX, Math.max(QTD_MIN, Math.trunc(qtd)));
}

/** Novo estado com o disco `id` adicionado: se já existe, soma 1 (até 9); senão, entra com qtd 1. */
export function adicionar(estado, id) {
  const idx = estado.itens.findIndex((it) => it.id === id);
  if (idx === -1) {
    return { ...estado, itens: [...estado.itens, { id, qtd: 1 }] };
  }
  const itens = estado.itens.slice();
  itens[idx] = { ...itens[idx], qtd: clampQtd(itens[idx].qtd + 1) };
  return { ...estado, itens };
}

/** Novo estado sem o item `id`. */
export function remover(estado, id) {
  return { ...estado, itens: estado.itens.filter((it) => it.id !== id) };
}

/** Novo estado com a quantidade do item `id` fixada em `qtd`, sempre entre 1 e 9. */
export function definirQtd(estado, id, qtd) {
  const q = clampQtd(qtd);
  return {
    ...estado,
    itens: estado.itens.map((it) => (it.id === id ? { ...it, qtd: q } : it)),
  };
}

/** `R$ 220`, `R$ 1.250` — pt-BR, sem centavos, com separador de milhar. */
export function formatarPreco(preco) {
  return `R$ ${preco.toLocaleString('pt-BR')}`;
}

/**
 * Soma o carrinho contra o catálogo: `valor` = total em reais dos itens com
 * preço conhecido; `itensComPreco`/`itensSemPreco` = quantos itens (linhas,
 * não unidades) têm ou não preço. Item cujo id não existe mais no catálogo
 * é ignorado aqui.
 */
export function total(estado, catalogo) {
  let valor = 0;
  let itensComPreco = 0;
  let itensSemPreco = 0;
  for (const item of estado.itens) {
    const disco = catalogo.find((d) => d.id === item.id);
    if (!disco) continue;
    if (disco.preco == null) {
      itensSemPreco += 1;
    } else {
      itensComPreco += 1;
      valor += disco.preco * item.qtd;
    }
  }
  return { valor, itensComPreco, itensSemPreco };
}

/** Soma das quantidades de todos os itens — usada no contador do header. */
export function quantidadeTotal(estado) {
  return estado.itens.reduce((acc, it) => acc + it.qtd, 0);
}

/**
 * Trecho "selo catno" da linha do item (mensagem do pedido e CTA do
 * WhatsApp): sem `edicaoVenda`, selo e catno da prensagem, como hoje
 * (`{selo} {catno}`); com `edicaoVenda`, selo/ano/catno da edição que a loja
 * vende — o que o cliente vai receber (`{selo} {ano} · {catno}`).
 */
export function trechoEdicao(disco) {
  const ev = disco.edicaoVenda;
  if (!ev) return `${disco.selo} ${disco.catno}`;
  return `${ev.selo} ${ev.ano} · ${ev.catno}`;
}

/** Id de release do Discogs da linha: da `edicaoVenda` quando houver, senão da prensagem. */
export function releaseIdLinha(disco) {
  return disco.edicaoVenda ? disco.edicaoVenda.id : disco.id;
}

/** URL completa do Discogs para o CTA: da `edicaoVenda` quando houver, senão da prensagem. */
export function discogsUrlLinha(disco) {
  return disco.edicaoVenda ? disco.edicaoVenda.discogsUrl : disco.discogsUrl;
}

/**
 * `qtd × preço = resultado`, com sufixo opcional depois da quantidade
 * (` un.` na mensagem do pedido; nada no subtotal da página do carrinho).
 */
function formatarMultiplicacao(preco, qtd, sufixoQtd = '') {
  return `${qtd}${sufixoQtd} × ${formatarPreco(preco)} = ${formatarPreco(preco * qtd)}`;
}

/**
 * Subtotal de uma linha (preço unitário × quantidade), usado na página do
 * carrinho: `2 × R$ 220 = R$ 440` (qtd > 1), `R$ 220` (qtd 1), `Sob consulta`
 * (sem preço).
 */
export function formatarSubtotal(preco, qtd) {
  if (preco == null) return 'Sob consulta';
  if (qtd > 1) return formatarMultiplicacao(preco, qtd);
  return formatarPreco(preco);
}

/**
 * Final de linha de um item na mensagem do pedido: `· R$ 220` (preço, qtd 1),
 * `· 2 un. × R$ 220 = R$ 440` (preço, qtd > 1), `· Sob consulta` (sem preço,
 * qtd 1), `· 2 un. · Sob consulta` (sem preço, qtd > 1) — o `·` é acrescentado
 * por quem chama.
 */
function finalLinhaItem(preco, qtd) {
  if (preco == null) {
    return qtd > 1 ? `${qtd} un. · Sob consulta` : 'Sob consulta';
  }
  if (qtd > 1) return formatarMultiplicacao(preco, qtd, ' un.');
  return formatarPreco(preco);
}

/** A linha "Total: ..." — usada tanto na mensagem do WhatsApp quanto na página do carrinho. */
export function formatarTotal({ valor, itensComPreco, itensSemPreco }) {
  if (itensSemPreco === 0) {
    return `Total: ${formatarPreco(valor)}`;
  }
  const rotuloItens = itensSemPreco === 1 ? 'item' : 'itens';
  if (itensComPreco === 0) {
    return `Total: sob consulta (${itensSemPreco} ${rotuloItens} sem preço)`;
  }
  return `Total: ${formatarPreco(valor)} + ${itensSemPreco} ${rotuloItens} sob consulta`;
}

/** Mensagem completa do pedido, pronta para `encodeURIComponent` (linkPedido, em whatsapp.js). */
export function mensagemPedido(estado, catalogo, nomeLoja) {
  const itensValidos = estado.itens
    .map((item) => ({ item, disco: catalogo.find((d) => d.id === item.id) }))
    .filter(({ disco }) => disco);

  const linhas = [`Olá! Quero fazer um pedido na ${nomeLoja}:`, ''];

  itensValidos.forEach(({ item, disco }, i) => {
    const ano = disco.ano ? ` (${disco.ano})` : '';
    linhas.push(
      `${i + 1}. ${disco.artista} – ${disco.titulo}${ano} · ${disco.formatoLabel} · ${trechoEdicao(disco)} · ${finalLinhaItem(disco.preco, item.qtd)}`
    );
    linhas.push(`   discogs.com/release/${releaseIdLinha(disco)}`);
  });

  linhas.push('');
  linhas.push(formatarTotal(total(estado, catalogo)));
  if (estado.obs) linhas.push(`Observação: ${estado.obs}`);

  linhas.push('');
  linhas.push('Pode me passar disponibilidade, prazo e valor?');

  return linhas.join('\n');
}

/** Lê o carrinho do localStorage. localStorage indisponível ou corrompido → carrinho vazio em memória. */
export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { itens: [], obs: '' };
    const dados = JSON.parse(bruto);
    return {
      itens: Array.isArray(dados.itens) ? dados.itens : [],
      obs: typeof dados.obs === 'string' ? dados.obs : '',
    };
  } catch {
    return { itens: [], obs: '' };
  }
}

/** Persiste o carrinho e sempre dispara `carrinho:mudou` no document, mesmo se o storage falhar. */
export function salvar(estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // localStorage indisponível (modo privado, quota etc.): segue só em memória.
  }
  document.dispatchEvent(new CustomEvent('carrinho:mudou'));
}

/** Atualiza todo `[data-contador]` da página com a soma de quantidades do carrinho salvo. */
export function atualizarContadorHeader() {
  const qtd = quantidadeTotal(carregar());
  document.querySelectorAll('[data-contador]').forEach((elemento) => {
    elemento.textContent = String(qtd);
  });
}
