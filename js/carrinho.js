// Carrinho (v2) — pedido com vários discos pelo WhatsApp, sem pagamento.
// Funções puras e testáveis (adicionar, remover, definirQtd, total,
// mensagemPedido, quantidadeTotal, formatarTotal) + camada de I/O
// (carregar, salvar, atualizarContadorHeader) que toca localStorage/DOM.

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

/**
 * Soma o carrinho contra o catálogo: `valor` = total em reais dos itens com
 * preço conhecido; `temSemPreco` = quantos itens (linhas, não unidades) não
 * têm preço. Item cujo id não existe mais no catálogo é ignorado aqui.
 */
export function total(estado, catalogo) {
  let valor = 0;
  let temSemPreco = 0;
  for (const item of estado.itens) {
    const disco = catalogo.find((d) => d.id === item.id);
    if (!disco) continue;
    if (disco.preco == null) {
      temSemPreco += 1;
    } else {
      valor += disco.preco * item.qtd;
    }
  }
  return { valor, temSemPreco };
}

/** Soma das quantidades de todos os itens — usada no contador do header. */
export function quantidadeTotal(estado) {
  return estado.itens.reduce((acc, it) => acc + it.qtd, 0);
}

/** A linha "Total: ..." — usada tanto na mensagem do WhatsApp quanto na página do carrinho. */
export function formatarTotal({ valor, temSemPreco }) {
  if (temSemPreco > 0) {
    return `Total: sob consulta (${temSemPreco} ${temSemPreco === 1 ? 'item' : 'itens'} sem preço)`;
  }
  return `Total: R$ ${valor}`;
}

/** Mensagem completa do pedido, pronta para `encodeURIComponent` (linkPedido, em whatsapp.js). */
export function mensagemPedido(estado, catalogo, nomeLoja) {
  const itensValidos = estado.itens
    .map((item) => ({ item, disco: catalogo.find((d) => d.id === item.id) }))
    .filter(({ disco }) => disco);

  const linhas = [`Olá! Quero fazer um pedido na ${nomeLoja}:`, ''];

  itensValidos.forEach(({ item, disco }, i) => {
    const ano = disco.ano ? ` (${disco.ano})` : '';
    const qtdSuffix = item.qtd > 1 ? ` · ${item.qtd} un.` : '';
    linhas.push(
      `${i + 1}. ${disco.artista} – ${disco.titulo}${ano} · ${disco.formatoLabel} · ${disco.selo} ${disco.catno}${qtdSuffix}`
    );
    linhas.push(`   discogs.com/release/${disco.id}`);
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
