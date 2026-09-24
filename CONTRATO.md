# Contrato — Originária Discos

Fonte única de verdade para quem implementa o pipeline (`scripts/`) e o site (`*.html`, `css/`, `js/`).
Site estático, sem framework, sem build. Raiz do repo = site publicado em
`https://l3ttn.github.io/originariadiscos/` (GitHub Pages de projeto → **subpath**).

## Regras transversais

- **Nunca** `href="/..."` nem `src="/..."`. Tudo relativo: `disco.html?id=726944`, `css/estilo.css`, `data/catalogo.json`.
- Header e footer são **estáticos** em cada HTML (3 cópias). O footer contém, em texto puro:
  `Data provided by Discogs` (link para https://www.discogs.com) e `Não afiliado ao Discogs`.
- Listagem e página inicial **não** chamam `api.discogs.com` no carregamento. Só `data/catalogo.json` e imagens de `i.discogs.com`.
- Configuração da loja só em `js/config.js` (`NOME_LOJA`, `WHATSAPP`, `INSTAGRAM`, `SITE_URL`).
- pt-BR em toda a interface. Preço em `R$`.
- Zero dependências npm. Node 22 (fetch nativo). ES modules (`type="module"` no HTML, `.mjs` no script).

## `discos.txt` — lista editável pelo dono

`|` separa campos, `#` comenta, `## Nome` abre uma seção que vale para as linhas seguintes.

```
## Brasil
Jorge Ben – África Brasil | destaque
Tim Maia – Racional Vol. 1 | nota=Prensagem 180g, capa dupla
https://www.discogs.com/release/726944-Jorge-Ben-Africa-Brasil | status=disponivel | preco=220
https://www.discogs.com/master/112296 | novo
```

- 1º campo: `Artista – Título` (o **primeiro** ` – `, ` - ` ou ` — ` com espaços dos dois lados separa artista de título) **ou** URL Discogs de release (`/release/{id}`, prensagem exata) ou master (`/master/{id}`, o script escolhe a principal em vinil).
- Opcionais: `status=esgotado|disponivel|encomenda` (padrão **esgotado**), `preco=NNN` (inteiro em reais; ausente → "Sob consulta"), `secao=Nome` (sobrescreve o `##`), `nota=texto` (comentário do dono, estilo Hard Wax), flags soltas `destaque`, `novo`.
- Linha inválida ou não resolvida **nunca** quebra o build: vai para `data/pendentes.txt` com o motivo.

## `data/catalogo.json`

```json
{ "geradoEm": "2026-09-24T14:00:00.000Z", "fonte": "Discogs", "discos": [ ... ] }
```

Cada item de `discos`:

| campo | tipo | origem / regra |
| --- | --- | --- |
| `id` | number | release id do Discogs |
| `masterId` | number \| null | `master_id` |
| `artista` | string | `artists[].name` unidos por " & "; remover sufixo ` (n)` e `*` (ex.: `Continental (3)` → `Continental`, `Doom*` → `Doom`) |
| `titulo` | string | `title` |
| `ano` | number \| null | `year` (0 → null) |
| `pais` | string \| null | `country` |
| `selo` | string | `labels[0].name` sem sufixo ` (n)` |
| `catno` | string | `labels[0].catno` |
| `formatoTipo` | `"LP"`\|`"2LP"`\|`"3LP"`\|`"7\""`\|`"10\""`\|`"12\""`\|`"Box"` | 1º item de `formats[]` com `name === "Vinyl"`. Se `descriptions` contém `7"`/`10"`/`12"` → esse; contém `Box Set` → `Box`; senão `LP`, e se `Number(qty) > 1` → `${qty}LP` |
| `formatoLabel` | string | `"Vinil " + formatoTipo` (ex.: `Vinil 2LP`) |
| `cor` | string \| null | `formats[].text` **e** `descriptions[]` que casem `/colou?r|clear|splatter|marbled|transparent|white|red|blue|green|yellow|pink|purple|gold|silver|orange|black/i`, sem duplicar, unidos por ", ". Nada casou → null |
| `edicao` | string \| null | `descriptions[]` e `text` que **não** são cor nem formato base (`LP`, `Album`, `Stereo`, `Mono`, `Vinyl`): ex. `Reissue`, `Remastered`, `Limited Edition`, `180g`, `Gatefold`, `Compilation`. Unidos por ", "; vazio → null |
| `generos` | string[] | `genres` |
| `estilos` | string[] | `styles` |
| `capa` | string \| null | `images[]` com `type === "primary"`, senão `images[0]`; campo `uri`. Sem imagem → null |
| `faixas` | `{pos, titulo, dur}[]` | `tracklist[]` → `position`, `title`, `duration` (só itens com `type_ === "track"`) |
| `videos` | `{ytId, titulo}[]` | `videos[].uri` → id via `/(?:v=|youtu\.be\/)([\w-]{11})/`; ignorar sem match |
| `notas` | string \| null | `notes` |
| `discogsUrl` | string | `uri` |
| `status` | `"esgotado"`\|`"disponivel"`\|`"encomenda"` | do dono, padrão `esgotado` |
| `preco` | number \| null | do dono |
| `secao` | string | do dono (`##` ou `secao=`); sem seção → `"Outros"` |
| `destaque` | boolean | do dono |
| `novo` | boolean | do dono |
| `comentario` | string \| null | `nota=` do dono |
| `adicionadoEm` | string ISO | primeira vez que a linha foi resolvida (persistido em `data/resolvidos.json`) |
| `ordem` | number | posição da linha em `discos.txt` (1-based) |

## Pipeline `scripts/build-catalogo.mjs`

1. Parse de `discos.txt`.
2. Resolução, sequencial, com pausa de **2600 ms** entre chamadas:
   - `release` → id direto.
   - `master` → `GET /masters/{id}` → `main_release`; se esse release não tiver `formats[].name === "Vinyl"` → `GET /masters/{id}/versions?format=Vinyl&per_page=1` → 1º id.
   - texto → consulta `data/resolvidos.json` (chave = linha normalizada) primeiro. Senão `GET /database/search?artist=&release_title=&type=master&format=Vinyl&per_page=5`. Percorre os 5: **primeiro resultado cujo `title` normalizado termina com `" - " + tituloNorm` e contém `artistaNorm`** vence (títulos do Discogs vêm como `Doom* And Madlib - Madvillain - Madvillainy`, com créditos e `*`). Nenhum casou → usa o 1º e grava `VERIFICAR: <linha> → <url>` em `data/pendentes.txt`. Zero resultados → repete com `type=release`; ainda zero → `SEM RESULTADO: <linha>`, pula.
   - Normalização: NFD sem diacríticos, minúsculas, remove `*`, remove ` (n)`, colapsa espaços.
3. `GET /releases/{id}` com cache em `data/cache/{id}.json` (`_fetchedAt`); refetch só se > 6 h. Flag `--force` ignora o cache.
4. Headers: `User-Agent: OriginariaDiscos/1.0 (+https://l3ttn.github.io/originariadiscos/)`; se `process.env.DISCOGS_TOKEN` existir, `Authorization: Discogs token=<token>`. HTTP 429 → espera `Retry-After` (ou 60 s), até 3 tentativas. Toda chamada com timeout (AbortController, 20 s).
5. Tolerância: falha por disco → reaproveita a entrada do `data/catalogo.json` anterior se existir, senão pula e reporta. Escreve JSON via arquivo temporário + rename. `exit 1` **só** se o resultado tiver 0 discos.
6. `data/resolvidos.json`: `{ "<linha normalizada>": { "id": 726944, "adicionadoEm": "..." } }`. Chave por URL também (`release:726944`).
7. Última linha do stdout, sempre: `OK <n> · pendentes <p> · chamadas <c> · <tempo>`.

## Páginas

- **index.html** — header (logo texto/`img/logo.svg` · Catálogo · Coleções · Novidades · Como funciona · botão WhatsApp); hero com 3 `destaque` (fallback: 3 mais recentes por `adicionadoEm`) + CTA "Ver catálogo"; **Novidades** = 12 (`novo` primeiro, depois `adicionadoEm` desc, depois `ordem`); **Coleções** = as 4 `secao` com mais discos (capa do 1º + contagem → `catalogo.html?secao=Brasil`); faixa "Procurando um disco que não está aqui? Fale comigo" (link WhatsApp procura genérica); `#como-funciona` com 4 passos (1. escolha o disco · 2. chame no WhatsApp · 3. eu encontro ou aviso quando chegar · 4. combinamos envio); footer (Instagram, WhatsApp, atribuição Discogs).
- **catalogo.html** — params: `secao`, `genero`, `formato` (valor de `formatoTipo`), `status`, `q`, `ordem` ∈ `destaques|az|ano|novos` (padrão `destaques` = destaque primeiro, depois novo, depois ordem), `pagina` (30 por página). Estado vive na URL (`history.replaceState`). Busca sem acento sobre artista+título+selo. Zero resultados → mensagem + CTA "Encontre pra mim" com `q` na mensagem.
- **disco.html?id=…** — capa grande, artista, título, selo + catno, `formatoLabel` · cor · edição, país/ano, tags de gênero/estilo (linkam para `catalogo.html?genero=`), tracklist, "Ouvir" (vídeos YouTube: só thumb `https://i.ytimg.com/vi/{id}/hqdefault.jpg` + botão; clique → iframe `https://www.youtube-nocookie.com/embed/{id}?autoplay=1`), badge de status, **2 CTAs WhatsApp**, comentário do dono se houver, link "Ver no Discogs". `id` ausente/inexistente → "Disco não encontrado" + CTA procura genérica. `<title>` = `Artista – Título | Originária Discos`.
- Card (`js/card.js`): `<a class="card" href="disco.html?id=…">` com `<img loading="lazy" alt="Capa de …">` + `onerror` → placeholder SVG inline; badge (`Esgotado` / `Disponível` / `Sob encomenda`; `Novo` como badge extra); artista; `Título – Vinil LP`; preço `R$ 220` ou `Sob consulta`.
- Badges: `esgotado` cinza, `disponivel` verde, `encomenda` âmbar, `novo` preto.
- Mobile-first: 360 px sem scroll horizontal; grid 2 colunas no celular, 4 no desktop. Tokens em `css/estilo.css :root` (`--cor-fundo`, `--cor-texto`, `--cor-acento`, `--fonte`), para trocar quando vier a identidade. Capa é a estrela: fundo claro/creme, tipografia forte.

## WhatsApp (`js/whatsapp.js`)

`montarLink(msg) = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg)`; todo link `target="_blank" rel="noopener"`. `\n` real no texto. Em `{ · cor}` o trecho só entra se `cor` existir; `(ano)` só se `ano`.

- **Avise-me** — `Olá! Quero ser avisado(a) quando este disco chegar na Originária Discos:\n\n{artista} – {titulo} ({ano})\n{formatoLabel}{ · cor} · {selo} {catno}\nDiscogs: {discogsUrl}\n\nMeu nome: `
- **Encontre pra mim** — `Olá! Quero que você encontre este disco pra mim:\n\n{artista} – {titulo} ({ano})\n{formatoLabel}{ · cor} · {selo} {catno}\nDiscogs: {discogsUrl}\n\nPode me passar prazo e valor?`
- **Procura genérica** — `Olá! Estou procurando um disco que não encontrei no site da Originária Discos:\n\nArtista / título: {q}\nEdição ou prensagem (se souber): \n\nVocê consegue pra mim?` (`{q}` vazio quando não há busca).

## Módulos JS (site)

`js/config.js` (já existe) · `js/catalogo.js` (fetch único de `data/catalogo.json`, memoizado; `porId`, `novidades(n)`, `destaques(n)`, `secoes()`) · `js/filtros.js` (funções **puras**: `filtrar`, `ordenar`, `buscar`, `paginar`, `lerEstado(URLSearchParams)`, `escreverEstado`) · `js/card.js` · `js/whatsapp.js` · `js/youtube.js` · `js/pagina-index.js`, `js/pagina-catalogo.js`, `js/pagina-disco.js`. Testes em `tests/*.test.mjs` com `node --test` para `filtros.js` e `whatsapp.js`.

## Deploy `.github/workflows/build-deploy.yml`

`on: push (main) · schedule '0 */6 * * *' · workflow_dispatch`. `permissions: contents: write, pages: write, id-token: write`. `concurrency: { group: pages, cancel-in-progress: false }`. Passos: `actions/checkout@v4` → `actions/setup-node@v4` (node 22) → `node scripts/build-catalogo.mjs` (env `DISCOGS_TOKEN: ${{ secrets.DISCOGS_TOKEN }}`) → commit de `data/catalogo.json data/resolvidos.json data/pendentes.txt` **só se mudou ignorando a linha `geradoEm`** (`git diff -I '"geradoEm"' --quiet -- data || commit+push`, com `git pull --rebase` antes; `continue-on-error: true`) → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3` (`path: .`) → `actions/deploy-pages@v4`.

## Carrinho (v2) — pedido com vários discos pelo WhatsApp

Sem pagamento. O carrinho vive em `localStorage` (chave `originaria.carrinho.v1`, JSON `{ itens: [{ id, qtd }], obs }`) e o pedido inteiro vai na mensagem do WhatsApp.

- **`js/carrinho.js`**: funções **puras** e testáveis (`adicionar(estado, id)`, `remover(estado, id)`, `definirQtd(estado, id, qtd)` com qtd entre 1 e 9, `total(estado, catalogo)` → `{ valor, temSemPreco }`, `mensagemPedido(estado, catalogo, nomeLoja)`), mais a camada de I/O (`carregar()`, `salvar(estado)`, ambos com try/catch: localStorage indisponível → carrinho vazio em memória). Evento `CustomEvent('carrinho:mudou')` no `document` a cada salvar.
- **Botão nos cards** (`js/card.js`): o card deixa de ser um `<a>` inteiro; vira `<article class="card">` com `<a>` na capa e no título e um `<button class="card__add" type="button" data-id="…">Adicionar ao carrinho</button>` fora do link. Clique: adiciona, mostra toast "Adicionado ao carrinho" (2 s, `aria-live="polite"`), atualiza o contador do header. Não navega.
- **Ficha** (`disco.html`): botão primário "Adicionar ao carrinho" e, abaixo, **um único** link WhatsApp (`.cta-solicitar`, `target="_blank" rel="noopener"`) no lugar dos dois CTAs antigos ("Avise-me quando chegar" e "Encontre pra mim" saem de todas as páginas). Texto por status: `esgotado` → `Esgotado? Solicite o seu aqui agora mesmo!`; `encomenda` → `Sob encomenda? Solicite o seu aqui agora mesmo!`; `disponivel` → `Disponível! Peça o seu pelo WhatsApp`. Mensagem `linkSolicitar(disco)`: primeira linha `Olá! Vi que este disco está esgotado no site e quero solicitar o meu:` (esgotado/encomenda) ou `Olá! Quero este disco:` (disponivel), depois `\n\n{artista} – {titulo} ({ano})\n{formatoLabel}{ · cor} · {selo} {catno}\nDiscogs: {discogsUrl}\n\nPode me passar disponibilidade, prazo e valor?`. `linkProcura` (busca genérica) continua no index e na busca sem resultado.
- **Header** (nos 4 HTML): link `carrinho.html` com texto "Carrinho" e `<span class="header__contador" data-contador>0</span>`; o contador soma as quantidades e se atualiza no carregamento e no evento `carrinho:mudou`.
- **`carrinho.html` + `js/pagina-carrinho.js`**: lista dos itens (capa 64px, artista, `Título – Vinil LP`, selo · catno, preço `R$ 220` ou `Sob consulta`, controle de quantidade − / +, botão "Remover"); `<textarea>` "Observação (opcional)" persistida no estado; linha de total: `Total: R$ 440` ou `Total: sob consulta (N item(ns) sem preço)`; botão primário `<a id="btn-pedir" target="_blank" rel="noopener">Pedir pelo WhatsApp</a>` cujo `href` é regenerado a cada mudança; botão "Esvaziar carrinho" (confirm nativo); carrinho vazio → texto "Seu carrinho está vazio" + link "Ver catálogo". Item cujo `id` não existe mais no catálogo é descartado silenciosamente ao carregar.
- **Mensagem** (`mensagemPedido`, também exposta por `js/whatsapp.js` como `linkPedido(estado, catalogo)`), com `\n` real:

```
Olá! Quero fazer um pedido na Originária Discos:

1. Jorge Ben – África Brasil (1976) · Vinil LP · Philips 6349 187 · 2 un.
   discogs.com/release/726944
2. Arthur Verocai – Arthur Verocai (1972) · Vinil LP · Continental SLP-10.079 · 1 un.
   discogs.com/release/2968639

Total: R$ 440            ← ou "Total: sob consulta (1 item sem preço)"
Observação: {obs}        ← linha só se obs não vazia

Pode me passar disponibilidade, prazo e valor?
```

  `(ano)` só se houver; `· N un.` só se `qtd > 1`; a linha do Discogs é `discogs.com/release/{id}` (sem slug, mais curta no WhatsApp); preço formatado `R$ 220` sem centavos; itens na ordem em que foram adicionados.
- **Regras**: zero deps, ES modules, `WHATSAPP` só de `js/config.js`; tudo relativo (subpath do Pages); textos pt-BR; mobile 360 px sem scroll horizontal; `carrinho.html` tem o mesmo header/footer estático dos outros (com "Data provided by Discogs").
- **Testes** `tests/carrinho.test.mjs`: adicionar (novo → qtd 1; repetido → qtd 2), remover, definirQtd com limites 1–9, total com e sem preço, mensagem com 2 itens (bate com o modelo acima, literalmente), item de id inexistente ignorado.
