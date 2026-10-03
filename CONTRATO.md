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
| `codigo` | string | `OD-001`…, vem de `data/codigos.json` (ver a seção nova "Código OD (T2)") |

## Pipeline `scripts/build-catalogo.mjs`

1. Parse de `discos.txt`.
2. Resolução, sequencial, com pausa de **2600 ms** entre chamadas:
   - `release` → id direto.
   - `master` → `GET /masters/{id}` → `main_release`; se esse release não tiver `formats[].name === "Vinyl"` → `GET /masters/{id}/versions?format=Vinyl&per_page=1` → 1º id.
   - texto → consulta `data/resolvidos.json` (chave = linha normalizada) primeiro. Senão `GET /database/search?artist=&release_title=&type=master&format=Vinyl&per_page=5`. Percorre os 5: **primeiro resultado cujo `title` normalizado termina com `" - " + tituloNorm` e contém `artistaNorm`** vence (títulos do Discogs vêm como `Doom* And Madlib - Madvillain - Madvillainy`, com créditos e `*`). Nenhum casou → usa o 1º e grava `VERIFICAR: <linha> → <url>` em `data/pendentes.txt`. Zero resultados → repete com `type=release`; ainda zero → `SEM RESULTADO: <linha>`, pula.
   - Normalização: NFD sem diacríticos, minúsculas, remove `*`, remove ` (n)`, colapsa espaços.
3. `GET /releases/{id}` com cache em `data/cache/{id}.json` (`_fetchedAt`); refetch só se > 6 h. Flag `--force` ignora o cache. Flag `--sem-rede`: `chamarDiscogs` falha na hora para qualquer chamada (sem `fetch`, sem contar chamada), com mensagem contendo "sem rede" — serve para refazer o catálogo e os códigos em segundos usando só o cache e a tolerância do item 5, sem bater no Discogs.
4. Headers: `User-Agent: OriginariaDiscos/1.0 (+https://l3ttn.github.io/originariadiscos/)`; se `process.env.DISCOGS_TOKEN` existir, `Authorization: Discogs token=<token>`. HTTP 429 → espera `Retry-After` (ou 60 s), até 3 tentativas. Toda chamada com timeout (AbortController, 20 s).
5. Tolerância: falha por disco → reaproveita a entrada do `data/catalogo.json` anterior se existir, senão pula e reporta. Escreve JSON via arquivo temporário + rename. `exit 1` **só** se o resultado tiver 0 discos — ou, antes de qualquer escrita em `data/`: se `data/codigos.json` existir e for inválido, ou se algum disco do `data/catalogo.json` anterior que já tem `codigo` não achar o **mesmo** `id` com o **mesmo** `codigo` no mapa lido (removido ou não) — entrada que desapareceu, código trocado, arquivo ausente ou vazio contam como não achar (ver "Código OD (T2)") —, ou se `data/catalogo.json` existir, não for JSON (ex.: marcadores de conflito do `git pull --autostash`) e o mapa de códigos estiver ausente ou vazio; em qualquer um desses casos o build não escreve nada. Com o mapa presente, catalogo.json ilegível só desliga o reaproveitamento desta execução.
6. `data/resolvidos.json`: `{ "<linha normalizada>": { "id": 726944, "adicionadoEm": "..." } }`. Chave por URL também (`release:726944`).
7. Última linha do stdout, sempre que o build termina (inclusive com 0 discos): `OK <n> · pendentes <p> · chamadas <c> · <tempo>`; nos abortos do item 5 não há linha `OK` — o motivo vai para o stderr.

## Código OD (T2) — `data/codigos.json`

O código acompanha o **release** do Discogs que a linha resolve; mudar opções da linha (`status`,
`preco`, `secao`, `nota`, `edicao=` ou as flags) não mexe no código; reescrever a linha pode
apontar outro release, e aí o disco ganha código novo e o antigo fica `removido`.

`atribuirCodigos(discos, mapa)` (função pura, exportada de `scripts/build-catalogo.mjs`, seção
"Funções puras" — sem I/O, sem rede, sem `Date`):

- **Entrada `discos`:** array de entradas do catálogo (cada uma com pelo menos `id` number,
  `adicionadoEm` string ISO, `ordem` number). **Entrada `mapa`:** o conteúdo de
  `data/codigos.json` já parseado, ou `null`/`undefined` quando o arquivo não existe (`[]`
  vale o mesmo).
- **Saída:** `{ discos, mapa }`, objetos **novos** — não altera nenhuma das entradas (nem
  ordena o array recebido).
  - `discos`: mesmo tamanho e **mesma ordem** da entrada; cada item é uma cópia com o campo
    `codigo` (string) e nada mais muda. Um `codigo` que já venha no item de entrada (ex.:
    entrada reaproveitada do catálogo anterior) é **ignorado**: vale o mapa.
  - `mapa`: o novo conteúdo de `data/codigos.json`.
- **Regras:**
  1. Disco cujo `id` já está no mapa fica com o código do mapa — mesmo que `adicionadoEm` ou
     `ordem` tenham mudado — e perde o `removido`, se tinha.
  2. Disco que não está no mapa ganha código novo. Os novos são numerados pela ordem de
     `adicionadoEm` crescente, desempate por `ordem` crescente, a partir de **(maior número
     que já existe no mapa, contando os removidos) + 1**; mapa vazio começa em 1.
  3. Formato: `"OD-" + String(n).padStart(3, "0")` → `OD-001` … `OD-999`, `OD-1000`.
  4. **Nunca** derivar o código do campo `ordem` (ele só desempata `adicionadoEm` igual).
  5. Entrada do mapa cujo `id` não está entre os `discos` desta chamada continua no mapa com
     `"removido": true`. Nada sai do mapa, nunca. Número de removido nunca é reaproveitado.
     Se o disco voltar, recupera o mesmo código (regra 1).
  6. `id` repetido em `discos` (mesmo release em duas linhas) → um código só para os dois,
     numerado pela ocorrência **mais antiga** entre as repetidas (menor `adicionadoEm`,
     desempate menor `ordem`) — não pela primeira do array.
  7. Idempotente: chamar de novo com `(saida.discos, saida.mapa)` devolve um `mapa` igual,
     byte a byte em `JSON.stringify`.
  8. `mapa` que não seja `null`/`undefined`/array, ou com item sem `id` inteiro, sem `codigo`
     casando `/^OD-\d{3,}$/`, com `id` repetido ou com número de código repetido → **lança
     `Error`** (jamais renumera em silêncio).

Formato de `data/codigos.json` (ilustração compacta; o arquivo de verdade sai no formato de
`JSON.stringify(dados, null, 2)` + `\n`):

```json
[ {"id": 726944, "codigo": "OD-001"}, {"id": 170032, "codigo": "OD-002"}, …, {"id": 6401859, "codigo": "OD-051", "removido": true} ]
```

- Array em ordem crescente do número do código; cada item tem só `id`, `codigo` e, quando
  removido, `"removido": true` (ativo = **sem** a chave, nunca `false`).
- **Chaves de cada item nesta ordem: `id`, `codigo`, `removido`** (o arquivo é comparado byte
  a byte).
- Escrito com `escreverJsonAtomic` (o mesmo de `catalogo.json`).

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

`on: push (main) · schedule '0 */6 * * *' · workflow_dispatch`. `permissions: contents: write, pages: write, id-token: write`. `concurrency: { group: pages, cancel-in-progress: false }`. Passos: `actions/checkout@v4` com `fetch-depth: 0` (histórico inteiro, precisa pra trava de atividade achar o último commit que não é do bot, lendo o log até o fim em vez de parar no primeiro — não quebra sob `pipefail`) → `actions/setup-node@v4` (node 22) → `node scripts/build-catalogo.mjs` (env `DISCOGS_TOKEN: ${{ secrets.DISCOGS_TOKEN }}`) → commit de `data/`: lista só o que este build mexeu (`git add --intent-to-add data/` + `git diff --name-only -- data`), e se a lista não for vazia, até 3 tentativas de `git fetch origin "$GITHUB_REF_NAME"` + se `discos.txt`, `scripts/` **ou `data/codigos.json`** mudaram entre o commit de onde este build saiu e a ponta buscada, não commita e publica a ponta da main como está (site e dados juntos: `git checkout -q --force FETCH_HEAD`; a execução mais nova, ou o próximo cron, commita os dados — `data/codigos.json` é estado: duas execuções resolvendo discos novos diferentes a partir do mesmo commit calculariam o mesmo código para discos diferentes) + `git reset FETCH_HEAD` (índice na ponta atual, árvore com os dados recém-gerados) + `git add` só dos arquivos da lista + commit **só se mudou ignorando a linha `geradoEm` em relação à ponta** + `git push origin "HEAD:$GITHUB_REF_NAME"` (sem rebase; push recusado por a main ter andado → repete o fetch/reset/commit); sem `continue-on-error`, falha fica visível; `data/` é do bot → monta `_site/` com só o que vai ao ar (`index.html catalogo.html disco.html carrinho.html como-funciona.html .nojekyll css js img fonts data prototipos`, cada um só se existir) e remove `_site/data/cache` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3` (`path: _site`) → `actions/deploy-pages@v4`. Limitação conhecida: uma execução não barrada publica o site (html, css, js) do próprio checkout; um re-run manual de uma execução antiga publica o site antigo até a próxima execução.

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

## Preço por item (v3)

O cliente precisa ver exatamente o que está levando: preço unitário, quantidade e subtotal por disco, e o total depois. Preço vem de `preco=NNN` em `discos.txt` (inteiro em reais); sem preço → "Sob consulta". Formatação pt-BR sem centavos e com separador de milhar: `R$ 220`, `R$ 1.250` (`formatarPreco(n)` em `js/carrinho.js`, exportada).

- **Página do carrinho**, por item: preço unitário (`R$ 220` ou `Sob consulta`), controle − / + e subtotal (`2 × R$ 220 = R$ 440`; com qtd 1 só `R$ 220`; sem preço `Sob consulta`). Linha de total abaixo da lista, nas três formas: todos com preço → `Total: R$ 660`; misto → `Total: R$ 620 + 1 item sob consulta` (`+ 2 itens sob consulta`); nenhum com preço → `Total: sob consulta (2 itens sem preço)` (como hoje).
- **Mensagem do pedido** (`mensagemPedido`), fim da linha de cada item: com preço e qtd 1 → `· R$ 220`; com preço e qtd > 1 → `· 2 un. × R$ 220 = R$ 440`; sem preço e qtd 1 → `· Sob consulta`; sem preço e qtd > 1 → `· 2 un. · Sob consulta`. Linha `Total:` com as mesmas três formas da página. Exemplo literal (726944 com `preco=220` e qtd 2; 2968639 sem preço; 242785 com `preco=180`):

```
Olá! Quero fazer um pedido na Originária Discos:

1. Jorge Ben – África Brasil (1976) · Vinil LP · Philips 6349 187 · 2 un. × R$ 220 = R$ 440
   discogs.com/release/726944
2. Arthur Verocai – Arthur Verocai (1972) · Vinil LP · Continental SLP-10.079 · Sob consulta
   discogs.com/release/2968639
3. MF DOOM & Madlib & Madvillain – Madvillainy (2004) · Vinil 2LP · Stones Throw Records STH2065 · R$ 180
   discogs.com/release/242785

Total: R$ 620 + 1 item sob consulta

Pode me passar disponibilidade, prazo e valor?
```

- `total(estado, catalogo)` passa a devolver `{ valor, itensComPreco, itensSemPreco }`; `formatarTotal` gera a linha nas três formas. Card e ficha continuam mostrando `R$ 220` / `Sob consulta`.
- Testes em `tests/carrinho.test.mjs`: os quatro finais de linha, as três formas de total, `formatarPreco(1250) === 'R$ 1.250'`, e a mensagem literal acima (catálogo de teste = os 3 discos reais com os preços injetados no teste, não no `data/catalogo.json`).

## Design v4 — visual atual (referência Vercel) e abertura com vinil

Objetivo: o site parecer um produto atual e leve, no padrão dos sites que a Vercel publica (vercel.com, seus templates de e-commerce): fundo quase branco (`#fafafa`) com texto quase preto (`#111`), bordas finas `#eaeaea`, cantos 12 px, sombras discretas, tipografia geométrica de alto contraste (`Inter`/`Geist` via Google Fonts como melhoria progressiva, fallback `system-ui`), muito respiro, header fixo com vidro (`backdrop-filter: blur(12px)` + fundo translúcido), hover que eleva o card 2 px e escurece a borda, transições de 150–200 ms, **modo escuro** automático por `prefers-color-scheme` com tokens invertidos (`#000`/`#ededed`/`#333`). Capa continua sendo a estrela: proporção 1:1, `object-fit: cover`, `loading="lazy"`, `decoding="async"`. Skeleton (blocos cinza pulsando) enquanto `data/catalogo.json` não chegou, em vez de "Carregando...". Botões: primário preto sólido (branco no escuro), secundário com borda; o botão WhatsApp mantém o verde `#25D366` como único acento colorido além do laranja da marca (`--cor-acento`, que fica só em badges e preço). Tudo em tokens no `:root` de `css/estilo.css`, com o bloco `@media (prefers-color-scheme: dark)` redefinindo.

**Abertura (intro)** em todas as páginas, arquivo `js/intro.js` + markup `<div class="intro" aria-hidden="true">` no início do `<body>`:
- Um disco de vinil grande (min(70vw, 420px)) desenhado em CSS/SVG inline: disco preto com ranhuras (gradiente radial repetido), selo central laranja com o texto "Originária Discos", furo central; braço do toca-discos (linha + cabeçote) que desce sobre o disco nos primeiros 500 ms; o disco gira (`rotate` 33 rpm ≈ 1,8 s por volta, `animation-timing-function: linear`).
- Duração: some com fade de 300 ms quando **as duas** condições valerem: passaram 1 400 ms **e** o catálogo carregou (`catalogo.js` expõe uma Promise `catalogoPronto`); teto absoluto de 2 500 ms mesmo sem catálogo (falha de rede não pode prender a tela). `body` recebe `intro-ativa` durante a intro (`overflow: hidden`) e a classe sai junto com o overlay; o overlay é **removido do DOM** ao final.
- Só uma vez por sessão: `sessionStorage['originaria.intro'] = '1'` (try/catch); na segunda página da mesma aba, sem intro. Com `prefers-reduced-motion: reduce`, sem intro nenhuma. Com JS desligado, o overlay não existe (é o JS que o cria, não o HTML).
- Som: navegador bloqueia áudio sem gesto do usuário, então **não** há som automático. Fica um botão discreto no overlay, "tocar agulha", que só quando clicado toca um "clique de agulha + chiado" curto sintetizado com Web Audio (ruído filtrado, 400 ms), sem arquivo de áudio.
- Acessibilidade: overlay `aria-hidden`, botão com `aria-label`, foco não fica preso.

**Não muda**: estrutura das páginas, ids/classes usados pelos módulos (`.card`, `button.card__add`, `[data-contador]`, `#btn-pedir`, `.cta-solicitar`, `[data-id]`), textos, mensagens do WhatsApp, `js/config.js`, testes existentes continuam verdes (ajustar só se o markup do card mudar de forma equivalente).

Medição observável: em 360 px sem scroll horizontal; zero erro de console; `header` com `backdrop-filter`; overlay `.intro` existe logo após o load e **não existe** 3 s depois; `sessionStorage['originaria.intro'] === '1'` após a intro; com `prefers-reduced-motion: reduce` emulado, `.intro` nunca é criado; com `prefers-color-scheme: dark` emulado, `getComputedStyle(body).backgroundColor` é escuro (`rgb(0, 0, 0)`); todas as contagens anteriores (15 cards no index, 30 no catálogo, 4 links WhatsApp na ficha) iguais.

## Preços de referência (v4) — `scripts/precos.mjs`

Objetivo: o dono precificar com base no mercado real, disco a disco, sem inventar. Fontes, em ordem de confiança:

1. **Discogs Marketplace, sem token** — `GET https://api.discogs.com/marketplace/stats/{id}?curr_abbr=BRL` (medido em 2026-09-27: responde `num_for_sale` e `lowest_price.value` em BRL para a prensagem exata; ex. 726944 → 36 à venda, menor R$ 150,00). Mesmo pacing (2,6 s), User-Agent, timeout e retry do `build-catalogo.mjs` (reaproveite as funções; se estiverem presas ao `main()`, exporte).
2. **Discogs sugestão por condição, com token** — `GET /marketplace/price_suggestions/{id}` com `Authorization: Discogs token=…` (só se `DISCOGS_TOKEN` existir; sem token, pula em silêncio e registra `sugestao: null`). Devolve `{ "Mint (M)": {currency, value}, "Near Mint (NM or M-)": {...}, ... }` na moeda da conta do dono. Guardar `moeda` e os valores de `Mint (M)` e `Near Mint (NM or M-)`; se a moeda não for `BRL`, guardar mesmo assim e marcar `moedaDiferente: true` (não converter).
3. **Preços observados manualmente** — `data/precos-observados.csv` (o dono preenche com o que vê em grupos de WhatsApp e lojas brasileiras), cabeçalho `id,preco,fonte,data,link` (`id` = release id do Discogs, `preco` inteiro em reais, `fonte` texto livre, `data` AAAA-MM-DD, `link` opcional). Linha inválida → ignorada com aviso.

Saída `data/precos.json`: `{ consultadoEm, discos: { "<id>": { menorAnuncioBRL, aVenda, sugestaoMint, sugestaoNM, moeda, moedaDiferente, observados: [{preco, fonte, data}], referenciaBRL, base } } }`. `referenciaBRL` = mediana dos valores em BRL disponíveis entre `sugestaoMint` (se BRL), `menorAnuncioBRL` e os `observados`; `base` = lista das fontes que entraram (ex. `["discogs-menor", "observado"]`); nenhuma fonte → `referenciaBRL: null`. Arredondar a referência para inteiro.

Relatório `data/precos-relatorio.md` (gerado): tabela `ordem | artista – título | à venda | menor anúncio (BRL) | sugestão M | observados | referência | preço atual em discos.txt`, ordenada por `ordem`, mais um rodapé com data, quantos discos têm referência e quantos não têm. É esse arquivo que o dono lê para decidir.

Flag `--propor [--margem=1.00]`: escreve `discos.propostos.txt` = cópia de `discos.txt` em que cada linha **sem** `preco=` e **com** referência ganha `| preco=<referência × margem, arredondado para múltiplo de 5>`. Nunca sobrescreve `discos.txt`. Linhas que já têm `preco=` não mudam.

`package.json`: `"precos": "node scripts/precos.mjs"`. README: seção "Como precificar" em 3 passos (rodar, ler o relatório, copiar as linhas do `discos.propostos.txt` que aprovar — ou criar o token do Discogs em Settings → Developers para ter a sugestão por condição). Workflow do Actions **não** muda nesta rodada (o dono roda local quando for precificar).

Testes `tests/precos.test.mjs` (funções puras exportadas, sem rede): parse do CSV (linha válida, inválida, id inexistente), mediana com 1/2/3 fontes, `referenciaBRL` null sem fontes, `moedaDiferente` exclui a sugestão da mediana, arredondamento para múltiplo de 5 com margem, e a linha do relatório para um disco de exemplo.

Medição observável: `node scripts/precos.mjs` termina com `OK <n> discos · com referência <r> · chamadas <c> · <tempo>`; `data/precos.json` válido com uma chave por disco do catálogo; para 4 ids fixos (726944, 242785, 6401859, 6276183) `menorAnuncioBRL` bate com um `curl` independente feito no mesmo momento (tolerância: igual) e `aVenda` bate ±2; `--propor` gera `discos.propostos.txt` com o mesmo número de linhas de `discos.txt` e `preco=` só nas linhas que não tinham.

### Preços (v4.1) — referência pela reedição, não pela prensagem original

A loja vende **novo/lacrado**; a prensagem original (release principal do master) dá preço de colecionador (medido: Clube da Esquina 1972 → R$ 10.400). A referência tem de vir da **reedição em vinil mais recente e oficial**.

- Para cada disco com `masterId`: `GET /masters/{masterId}/versions?format=Vinyl&sort=released&sort_order=desc&per_page=10` (medido em 2026-09-27: devolve `versions[]` com `id, released, country, label, catno, format, title`). **Excluir** versões cujo `format` contenha `Unofficial Release`, `Test Pressing` ou `Promo` (a mais recente de África Brasil é um bootleg de 2024). Candidatas: a mais recente com `country === "Brazil"` e a mais recente no geral (deduplicar; no máximo 2). Sem `masterId` ou sem candidatas → só a original.
- Para cada candidata: `GET /marketplace/stats/{id}?curr_abbr=BRL`. Guardar em `precos.json`: `reedicoes: [{ id, ano, pais, selo, catno, aVenda, menorAnuncioBRL }]` e `reedicaoBRL` = menor `menorAnuncioBRL` entre as candidatas com exemplares à venda (null se nenhuma).
- `referenciaBRL` passa a ser: mediana de {`reedicaoBRL`, `sugestaoMint` (se BRL), `observados`} — a **original entra só se não houver reedição com anúncio** (`base` registra `"discogs-reedicao"` ou `"discogs-original"`). O relatório ganha as colunas `reedição (ano · selo · país)` e `menor anúncio reedição (BRL)`, e a coluna antiga vira `original (BRL)`.
- Orçamento: 1 chamada de versões + até 2 de stats por disco, além da original → ≈ 200 chamadas ≈ 9 min sem token (com `DISCOGS_TOKEN`, 60/min). Cache das versões em `data/cache/versoes-{masterId}.json` (6 h) para não repetir.
- Testes: filtro de oficiais (exclui `Unofficial Release`/`Test Pressing`/`Promo`), escolha das candidatas (Brasil mais recente + geral mais recente, dedup), `reedicaoBRL` = menor entre as com anúncio, `referenciaBRL` preferindo reedição, e a linha do relatório com as colunas novas.

## Edição à venda (v5) — a ficha e a mensagem citam a reedição que a loja vende

A loja vende **novo/lacrado**, mas a ficha mostra a prensagem original (ex. Philips 1976) enquanto o preço de referência vem da reedição (Polysom 2020). O cliente tem de ver a edição que vai receber; a original vira informação secundária.

**Pipeline (`scripts/build-catalogo.mjs`)** — novo campo por disco:

```
edicaoVenda: { id, ano, pais, selo, catno, formato, discogsUrl, fixadaPeloDono } | null
```

- Escolha automática = **a mesma regra** de `precos.mjs` (v4.1): `GET /masters/{masterId}/versions?format=Vinyl&sort=released&sort_order=desc&per_page=10`, excluir `Unofficial Release`/`Test Pressing`/`Promo`; preferir a mais recente com `country === "Brazil"`, senão a mais recente oficial. As funções de escolha saem de `precos.mjs` para um módulo compartilhado `scripts/discogs-versoes.mjs`, importado pelos dois (sem duplicar), e o cache `data/cache/versoes-{masterId}.json` é o mesmo.
- Campos vêm do item de `versions[]`: `id`, `ano = Number(released.slice(0,4)) || null`, `pais = country`, `selo = label` (sem sufixo ` (n)`), `catno`, `formato = format` (string), `discogsUrl = "https://www.discogs.com/release/" + id`, `fixadaPeloDono = false`. Sem `masterId` ou sem versão oficial → `null`.
- **Fixar pelo dono:** em `discos.txt`, `| edicao=<URL ou id de release do Discogs>` → `GET /releases/{id}` e os campos vêm de lá (`ano = year`, `pais = country`, `selo`/`catno` = `labels[0]`, `formato` = descrições do 1º formato Vinyl unidas por ", "), `fixadaPeloDono = true`. Documentar a opção no cabeçalho de comentários de `discos.txt`.
- Os demais campos do disco (capa, faixas, vídeos, gêneros, `id`) **não mudam**: continuam da prensagem resolvida hoje. O `id` do disco é estável (carrinho e preços dependem dele).

**Preços (`scripts/precos.mjs`)**: se o disco tiver `edicaoVenda`, esse id entra **primeiro** na lista de candidatas de reedição (dedup); `reedicaoBRL` usa a `edicaoVenda` quando ela tiver exemplar à venda, senão o menor entre as demais candidatas com anúncio.

**Site (`js/`)**:
- Ficha (`disco.html`): abaixo do título, linha **"Edição à venda: {selo} · {país} · {ano} · {catno}"** e, quando `edicaoVenda.id !== id`, linha secundária menor **"Lançamento original: {selo original} · {país original} · {ano original}"**. Sem `edicaoVenda`: exatamente como hoje. "Ver no Discogs" aponta para `edicaoVenda.discogsUrl` quando existir.
- Mensagens do WhatsApp (`linkSolicitar` e `mensagemPedido`): no trecho de selo, com `edicaoVenda` → `· {selo} {ano} · {catno}` e o link do Discogs da linha vira `discogs.com/release/{edicaoVenda.id}`; sem `edicaoVenda` → igual a hoje (`· {selo} {catno}`, link da prensagem). O `(ano)` depois do título continua sendo o ano original. Exemplo literal, item do pedido para 726944 com `edicaoVenda = {id: 15793439, ano: 2020, pais: "Brazil", selo: "Polysom", catno: "33057-1"}`, `preco 220`, `qtd 2`:

```
1. Jorge Ben – África Brasil (1976) · Vinil LP · Polysom 2020 · 33057-1 · 2 un. × R$ 220 = R$ 440
   discogs.com/release/15793439
```

- **Rodapé no modo escuro**: hoje fica cinza-claro (faixa clara destoando do fundo preto). O rodapé tem fundo escuro nos dois esquemas (como `.colecao`), com borda superior fina e texto claro; contraste do texto ≥ 4.5:1.

## Varejo brasileiro (v5) — `scripts/varejo-br.mjs`

Preços de lojas brasileiras de vinil, para entrar na referência junto com o Discogs. **Medido em 2026-10-01**: 4 lojas de vinil novo rodam na plataforma Loja Integrada (HipMusic, Vinil Discos, Rua6 Underground, Buzina Discos); o `robots.txt` delas permite `/` e o sitemap, **proíbe `/buscar` e `/api/*`** e pede `Crawl-delay: 10`; `fetch` do Node com User-Agent honesto recebe 200 no sitemap e na página do produto; a página do produto traz `itemprop="price" content="220.00"` e `schema.org/InStock` (ex. HipMusic, África Brasil Polysom lacrado, R$ 220). Mercado Livre (página montada por JS), Amazon (503), Magalu (403) e Americanas (API de busca não devolve vinil) ficam de fora.

- **Lojas** em `data/lojas-br.json`: `[{ "nome": "HipMusic", "base": "https://www.hipmusic.com.br", "plataforma": "lojaintegrada" }, … Vinil Discos (https://www.vinildiscos.com.br), Rua6 Underground (https://www.rua6underground.com.br), Buzina Discos (https://www.buzinadiscos.com.br)]`. Adicionar loja = uma linha.
- **Regras de educação, não negociáveis:** User-Agent `OriginariaDiscos-precos/1.0 (+https://l3ttn.github.io/originariadiscos/)` (sem imitar navegador); ler e obedecer `robots.txt` de cada host (grupo `*`, `Allow`/`Disallow` com `*` e `$`, a regra mais longa vence, `Crawl-delay`); **nunca** requisitar caminho proibido; intervalo por host = `max(Crawl-delay, 3 s)`; hosts diferentes podem andar em paralelo, mesmo host em série; timeout 20 s; 429/503 → espera 60 s, 2 tentativas, depois desiste daquela URL.
- **Fluxo Loja Integrada:** `sitemap.xml` (índice) → sub-sitemaps de produto → lista de URLs (cache 24 h em `data/cache/sitemap-{host}.json`). Para cada disco do catálogo, casar pelo **slug** da URL: todos os tokens do título com ≥ 3 letras (normalizados sem acento, minúsculos, fora `de, do, da, dos, das, the, and, vol, e`) presentes no slug, ≥ 1 token do artista com ≥ 3 letras presente, e `lp` ou `vinil` no slug; **excluir** slugs com `cd, box, kit, usado, seminovo, semi, k7, fita, dvd, cassete, compacto, bluray`. No máximo 3 URLs por loja por disco (as de menos tokens extras). Página do produto (cache 6 h em `data/cache/produto-{hash}.json`): preço de `itemprop="price"` ou `product:price:amount`, disponibilidade `schema.org/InStock`, nome de `og:title` ou `<h1>`; o nome tem de passar no mesmo casamento.
- **Saída** `data/precos-varejo.json`: `{ consultadoEm, lojas: [{ nome, base, produtosNoSitemap, requisicoes, bloqueadasPorRobots }], discos: { "<id>": [{ loja, nome, preco, url, disponivel }] } }` com uma chave por disco do catálogo (`[]` quando nada). Última linha do stdout: `OK <n> discos · com oferta BR <k> · ofertas <o> · requisições <r> · <tempo>`.
- **Na referência (`precos.mjs`)**: se `data/precos-varejo.json` existir, cada oferta `disponivel: true` do disco entra na mediana; `base` ganha `"varejo-br"`; relatório ganha a coluna `varejo BR (n · menor–maior)`. Sem o arquivo, nada muda.
- `package.json`: `"varejo": "node scripts/varejo-br.mjs"`. README, seção "Como precificar": rodar `npm run varejo` antes de `npm run precos` (≈ 10–20 min, por causa do intervalo de 10 s que as lojas pedem) e a frase "Para fixar a edição que você vende, acrescente `| edicao=<link do release no Discogs>` na linha do disco."
- Testes `tests/varejo-br.test.mjs` (sem rede): parser de robots (`/buscar?q=x` proibido, página de produto permitida, `/*fq=*` proibido, `Crawl-delay` lido), casamento de slug (aceita `lp-jorge-ben-africa-brasil-vinil-polysom-lacrado-hm-2025-12-10-15-10-29`; rejeita `box-5-cds-jorge-ben-jor-alo-alo-novo-lacrado-hm` e `kit-disco-de-vinil-lp-jorge-ben-a-tabua-da-esmeralda-africa-brasil`), extração de preço/disponibilidade de um trecho de HTML de fixture, agendador que **nunca** chama o `fetch` injetado para URL proibida e respeita o intervalo com relógio injetado.
