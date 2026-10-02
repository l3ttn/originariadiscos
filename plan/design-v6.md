> **Leia antes (orquestrador, 2026-10-01).**
> - Neste repositório este redesign é a **v6**. A v5 foi o PR #6 (edição à venda + varejo BR). As marcas "v5.1/v5.2" abaixo são revisões deste documento, não versões do site.
> - **Decisão do dono pendente: a abertura (T8 SUSPENSA).** Em 2026-09-27 o dono pediu explicitamente um disco de vinil grande girando na tela antes de o site aparecer (está no ar desde o PR #4). A estratégia abaixo propõe apagar `js/intro.js` e trocar pelo "O" que gira no poema. **Até o dono escolher, vale o pedido dele:** manter a abertura em tela cheia, repaginada com a identidade nova (disco preto, selo vermelho), uma vez por sessão, sem som automático e respeitando `prefers-reduced-motion`. As duas opções estão no painel visual.
> - **Painel visual** (paleta, tipografia, componentes com dados reais, as duas opções de abertura): https://claude.ai/artifact/RA9phy9iH1Z17H5e5G3KRJ (privado do dono).
> - **Antes de despachar qualquer maker, aplique o "Apêndice A — teste de mesa"** no fim deste arquivo: vários critérios de aceite das tarefas T0–T4 passam hoje sem a tarefa feita ou reprovam trabalho certo nesta máquina.
> - Pesquisa verificada (106 referências, 145 afirmações com veredito), direções, julgamento e críticas: `plan/design-v6-pesquisa.json` e, fora do repo, `~/Documentos/originariadiscos-lacres/design-v6/`.
> - Este arquivo é servido publicamente pelo GitHub Pages (o deploy publica a raiz do repo). Não ponha segredo aqui.

# Originária Discos: estratégia de redesign v5, "Brasil Concreto"

Decisão de direção de arte de 01/10/2026. Todas as medições deste documento usaram o mesmo ambiente: Chrome 153.0.8010.52 headless, Node 22.22.2, processo Claude Code 2.1.281, repositório em `main` no commit `f9c5d9d` (merge do PR #6), árvore limpa e `npm test` com 192 de 192 testes passando.

**Revisão v5.1 (01/10/2026).** Esta revisão corrige as lacunas e as contradições com a pesquisa que o checker apontou. As medições novas rodaram no mesmo ambiente e estão em **Afirmações**:
- larguras dos versos por display;
- tamanho das 51 capas;
- arquivos da Fraunces;
- `home.json`;
- contrastes novos;
- estado do Actions e do Pages;
- instrumentos do T0 revisados.

**Revisão v5.2 (01/10/2026).** Esta revisão corrige as 24 lacunas e as 3 contradições com a pesquisa que o segundo checker apontou. O ambiente é o mesmo (processo Claude Code 2.1.281). As medições novas estão em **Afirmações**:
- tintas fixas dos objetos impressos (C9 a C11);
- larguras do nome do artista a 18 px (F13) e OFL das 6 famílias dos protótipos (F14);
- slugs de seção (D8), índice e `home.json` refeitos com o slug (D4, D7) e capas do leque (D9);
- estado do CSS, das tags og:\*, do filtro por seção, da ficha sem disco e do wordmark (R12 a R16);
- contador de movimento com a lista ampliada (M6, re-medido) e rolagem completa da home (M8).

Uma sugestão do checker não foi aplicada ao pé da letra, porque a medição a desmente. O `#C8231A` proposto como vermelho fixo dos objetos impressos passa no creme (4,94:1), mas dá 2,56:1 no papel Soul, 3,17 no Jazz e 3,44 no amarelo (C10). O valor fixo passa a ser `#761210`, que dá de 5,11 a 11,26. Além disso, o leque saiu do celular, e por isso a tira de Coleções foi redesenhada: com o nome mais longo, a linha única da v5.1 não cabia em largura nenhuma.

Convenções: **[J]** marca julgamento meu, não medição. **APOSTA** marca técnica que a pesquisa não verificou e que por isso só entra com fallback.

---

## Decisão

**A direção escolhida é a Brasil Concreto, em versão híbrida.**

A ideia é tratar a Originária como um selo brasileiro dos anos 60 que imprime lambe-lambe em 2026. Valem três regras:

- **Nas telas de compra (card, ficha, carrinho) manda a disciplina da Elenco:** papel creme, tinta preta, **um** vermelho e a capa como protagonista.
- **O hype fica na vitrine:** o hero é um poema concreto em texto (VINIL NOVO / LACRADO / ORIGINÁRIA), as coleções viram tiras de lambe em papel colorido, há um letreiro e uma parede de capas.
- **Cada cor tem um papel fixo em todas as páginas:** preto mexe no carrinho, verde abre o WhatsApp, vermelho é marca e estado.

### Por que esta direção

1. **É a única que diz a oferta com todas as letras e que ninguém de fora reproduz.** O H1 é a proposta de valor ("novo e lacrado") escrita como poema concreto, com Elenco e lambe da Gráfica Fidalga por trás. Funciona ao mesmo tempo como manifesto e como print de Instagram.
2. **O hype sai mais barato que o visual de hoje.** O poema em texto passa a ser o LCP da home, e com isso o `catalogo.json` e as capas do Discogs saem do caminho crítico. A home hoje mede 4,80 s com uma IMG como elemento LCP; a meta é ≤ 2,0 s com o H1 como LCP.
3. **A clareza de compra resiste ao hype.** A sinalização por cor não muda de página para página, e o card herdado do Acervo mostra sempre preço ou "SOB CONSULTA", a edição, o estado em texto e um botão que muda com o estado.
4. **Teve a maior soma dos juízes (24,4) e venceu 2 das 3 lentes.** Na lente em que perdeu (conversão), os pontos fracos foram corrigidos com enxertos do Acervo.

### Placar dos juízes

| Direção | Marca/hype | Viabilidade | Conversão | Soma | Resultado |
| --- | --- | --- | --- | --- | --- |
| **Brasil Concreto** | **8,0** | **8,5** | 7,9 | **24,4** | **Base** |
| Acervo OD (Arquivo Editorial) | 7,0 | 8,0 | **8,3** | 23,3 | Finalista do protótipo e doador do funil de compra |
| Lote Aberto (Clube Drop) | 7,5 | 7,0 | 7,2 | 21,7 | Doador de tipografia, dados e comanda |
| LACRADO (Objeto Tátil) | 6,0 | 5,5 | 6,4 | 17,9 | Doador de 3 detalhes |

### O que entra de cada direção

| Origem | O que entra | O que resolve |
| --- | --- | --- |
| Brasil Concreto (base) | Poema concreto como LCP; um vermelho como dono da marca; cores com papel fixo; tiras de lambe por seção; sistema de pontos ● a ●●●●; "O" de ORIGINÁRIA desenhado como disco (no wordmark e no favicon); carimbo ESGOTADO só na ficha; vista Parede; Tropicália isolada em "modo campanha" | Identidade e LCP |
| Acervo | Card que **sempre** mostra preço ou SOB CONSULTA, linha de edição, estado em texto e botão por estado; tabela "À venda × Original" com "● É esta que você recebe"; Coleções como lista-índice 02.1–02.7; grade de cards com réguas de 1 px; mono com mínimo de 13 px; barra de compra fixa; busca que casa código OD e catno; fallback de fonte por `local()` + `size-adjust`; nomes de View Transition por id | Conversão e legibilidade |
| Lote Aberto | Gabarito (Naipe Foundry, Rio) no texto e na interface; `indice.json` + `discos/<id>.json` gerados no Actions; comanda picotada "É isso que vai no seu WhatsApp" visível por padrão; busca tolerante a erro; destaque visível na 1ª dobra; `line-height` ≥ 0,9 nas maiúsculas acentuadas; `config.LOTE` com data que expira sozinha | Escala de dados e prova de transparência |
| LACRADO | Selo do vinil "ORIGINÁRIA DISCOS · INDÚSTRIA BRASILEIRA · 33⅓ RPM"; reflexo do plástico do lacre **só** na capa da ficha; "Não abriu? Copiar pedido"; mensagem agrupada em Quero/Solicito; nada de preload de fonte onde o LCP é imagem; nomes de VT só nos cards visíveis e só durante a transição | Signo brasileiro e rede de segurança do pedido |

### O que foi descartado e por quê

- **Lote Aberto como base.**
  - O hype dele é neo-brutalismo de drop (adesivo torto em todo card, sombra sólida em tudo, ticker amarelo), linguagem que já vira template.
  - Impõe o tema escuro contra `prefers-color-scheme` e pisca o tema porque lê o `localStorage` num módulo diferido.
  - As quatro bolinhas no wordmark imitam a assinatura da Elenco.
  - "Drop" soa falso com 51 de 51 discos esgotados.
  - No esgotado, só abre o WhatsApp direto, o que quebra o pedido de vários discos.
  - O cursor customizado não ajuda a comprar.
- **Acervo como base.**
  - "Acervo/museu" sugere disco usado e fora de venda, o que contradiz o "novo e lacrado".
  - Creme com Fraunces itálica e mono é o indie editorial saturado.
  - O LCP continua preso a uma capa do Discogs.
  - O sublinhado usado como ênfase imita link.
  - A chave do grão não funciona: custom property não entra em data URI.
- **LACRADO.**
  - É o estilo Teenage Engineering, gringo e saturado, e fica perto do visual "produto tech/Vercel" que o dono quer deixar.
  - A identidade depende de tilt e voo, que não aparecem num print e quase não funcionam no toque.
  - A Archivo de 2 eixos pesa 90 KB e traz risco de CLS.
  - O card esgotado vira um link mais uma tecla só de ícone.
  - São 15 dias de trabalho.
- **O que sai de dentro da própria vencedora:**
  - **Anton** ("fonte de thumbnail"): vira só controle no A/B.
  - **Jost**: x-height baixa.
  - **Seta ↘, ▪ e wordmark gigante no rodapé**: são 2 das 3 assinaturas da GOMA, loja brasileira do mesmo nicho. Fica só o letreiro.
  - **Sombra sólida**: só no CTA principal de cada página.
  - **`mix-blend-mode` no grão**: não foi medido.
  - **Rótulos de 11 px**: o mínimo passa a 13 px.
  - **Preço escondido no esgotado**: o preço fica sempre visível.
  - **Camada Tropicália**: a pesquisa só leu Rogério Duarte em texto. Fica adiada até alguém ver as capas reais.

### Fatos medidos que pesaram

| Fato (01/10/2026) | Valor |
| --- | --- |
| Discos esgotados e sem preço | 51 de 51, `preco: null` em todos |
| LCP da home ao vivo (Slow 4G, CPU 4×) | 4,80 s, elemento IMG, CLS 0 |
| LCP da ficha `disco.html?id=726944` | 2,44 s, elemento IMG, CLS 0,035 |
| `catalogo.json` baixado por todas as páginas | 49.491 B em gzip |
| Índice só com os campos de card e carrinho | 8.478 B em gzip (8.547 B com o `secaoSlug` do T4, D4) |
| Botão WhatsApp com texto branco | 1,98:1, o axe aponta `color-contrast` em 2 nós na home |
| Largura dos versos a 100 px (VINIL NOVO / LACRADO / ORIGINÁRIA) | Big Shoulders 412 / 331 / 413 · Archivo Cond 406 / 345 / 431 · Anton 399 / 330 / 407 · Roboto 900 549 (só VINIL NOVO) |
| Número de WhatsApp publicado | `5547900000000`, o placeholder: hoje todo CTA de produção abre um número falso |
| Commit de dados no Actions | Falha em toda execução (`cannot pull with rebase`, run 36933746919). O `continue-on-error` esconde a falha, e a main tem 0 commits "build automático" |
| As 51 capas do Discogs (HEAD) | De 31.695 a 210.431 B, mediana de 98.232 B, soma de 5,03 MB |
| Arquivos de desenvolvimento no Pages | `scripts/`, `tests/` e `CONTRATO.md` respondem 200 |
| Primeira vista da home ao vivo (n = 1) | 1.043.013 B no total, dos quais 121.244 B fora do `i.discogs.com`, e 9 capas |
| Rolagem completa da home ao vivo (n = 1, `--rolar`) | 1.829.049 B no total, 121.214 B fora do `i.discogs.com` e 18 capas (M8) |

---

## Identidade

### Paleta: claro (padrão)

Contrastes calculados com a fórmula WCAG 2.x (comandos em **Afirmações**).

| Token | Hex | Uso | Contraste |
| --- | --- | --- | --- |
| `--papel` | `#F4EFE6` | Fundo geral, creme de encarte | tinta 16,49:1 |
| `--superficie` | `#FFFFFF` | Card, input, bloco de compra, totalizador | tinta 18,88:1 |
| `--tinta` | `#111111` | Texto, bordas de controle (2 px), botão de carrinho, réguas | — |
| `--sobre-tinta` | `#F4EFE6` | Texto e ícone sobre botão em `--tinta` | 16,49 |
| `--tinta-suave` | `#58534B` | Texto secundário e mono. **Nos objetos impressos vale `#111`** (ver abaixo) | 6,66 papel · 7,63 superfície |
| `--vermelho` | `#C8231A` | Marca e estado: ponto da marca, código OD, "ESGOTADO", contador, ênfase. **Nos objetos impressos vale `#761210`** (C10) | 4,94 papel · 5,66 superfície · branco sobre ele 5,66 · papel sobre ele 4,94 |
| `--carimbo` | `#C8231A` **nos dois temas** | Carimbo ESGOTADO sobre `rgb(255 255 255/.92)` no palco | 4,97 (palco Brasil) a 5,44 (Jazz, Reggae). Com o `#FF5A47` do escuro daria 2,71 a 2,97: proibido |
| `--vermelho-cartaz` | `#A01A13` | Segunda tinta de cartaz, **só texto de 24 px ou mais** | 3,59 (pior caso, sobre soul) a 4,81 (sobre amarelo) |
| `--whatsapp` | `#25D366` | Só ações que abrem o WhatsApp, sempre com texto `--tinta` (e glifo `--tinta`, se o T11 liberar) | 9,52 · branco sobre verde 1,98 (proibido) · verde como texto 1,73 (proibido) |
| `--amarelo-lambe` | `#F6C324` | Faixa "Procurando um disco?", adesivo NOVO, pílula ENCOMENDA | tinta 11,46 |
| `--concreto` | `#CFC9BE` | Réguas tracejadas, skeleton (estático), desabilitado (decorativo) | tinta 11,47 |
| `--regua` | `#111111` | Réguas de 1 px da grade de cards | — |
| `--faixa` / `--faixa-texto` | `#111111` / `#F4EFE6` | Letreiro, rodapé e dock | 16,49 |
| `--vermelho-faixa` | `#FF5A47` | Acento sobre faixa preta (pontos, último verso do rodapé) | 6,12. O `#C8231A` sobre `#111` dá 3,34 e é proibido abaixo de 24 px |
| `--foco-cor` | `#111111`; contorno de 3 px, offset de 2 px | Foco visível | 16,49. Sobre faixa: `#F6C324`, 11,46 |

### Paleta: escuro (automático por `prefers-color-scheme`, como no v4)

Os tokens também são redefinidos em `:root[data-tema="escuro"]`, para protótipos e prints. E `:root[data-tema="claro"]` força o claro mesmo num celular em modo escuro. Sem isso, `?tema=claro` no comparador não funcionaria.

| Token | Hex | Contraste |
| --- | --- | --- |
| `--papel` | `#0F0E0D` | tinta 16,84 |
| `--superficie` | `#1A1918` | tinta 15,33 |
| `--tinta` | `#F4EFE6` | — |
| `--sobre-tinta` | `#0F0E0D` | 16,84 sobre o botão `--tinta` |
| `--tinta-suave` | `#ABA59B` | 7,89 papel · 7,18 superfície. **Não** vale para os objetos impressos (2,14 na comanda, 1,48 no amarelo, 1,37 no Jazz, C9) |
| `--regua` | `#7D776E` | 4,35 papel · 3,96 superfície |
| `--concreto` | `#45413B` | Decorativo (1,90 papel): régua tracejada, skeleton, desabilitado |
| `--vermelho` | `#FF5A47` | 6,25 papel · 5,69 superfície. O texto sobre ele é `#0F0E0D` (6,25); branco é proibido. **Não** vale para o carimbo, que fica em `--carimbo`, nem para os objetos impressos (2,69 na comanda, C9) |
| `--whatsapp` | `#25D366`, texto e glifo `#0F0E0D` | 9,72 |
| `--faixa` / `--faixa-texto` / `--vermelho-faixa` | `#1A1918` / `#F4EFE6` / `#FF5A47` | 15,33 · 5,69 |
| `--foco-cor` | contorno de 3 px `#F6C324` | 11,71 papel · 10,66 superfície. **Nunca** sobre objeto impresso (ver abaixo) |

Papéis de seção e amarelo **não mudam** no escuro, porque são objetos impressos. Isso vale para todas as tintas e para o foco sobre eles. O `#F6C324` dá 1,00:1 sobre o amarelo e de 1,01 a 1,34:1 sobre 6 dos 7 papéis. A borda `#F4EFE6` dá 1,44:1 sobre o amarelo. Por isso os objetos impressos fixam tintas próprias, que passam 4,5:1 sobre todos os papéis, o amarelo e o creme:

```css
:root{color-scheme:light dark; /* tokens claros */}
:root[data-tema="claro"]{color-scheme:light}
@media (prefers-color-scheme:dark){
  :root:not([data-tema="claro"]){color-scheme:dark; /* tokens escuros */}
}
:root[data-tema="escuro"]{color-scheme:dark; /* tokens escuros */}

/* Objetos impressos: papel, tintas e foco iguais nos dois temas (C6, C9, C10) */
.tira,.palco,.faixa-procurando,.comanda{
  --tinta:#111111;--tinta-suave:#111111;--vermelho:#761210;--foco-cor:#111111;
  --superficie:#FFFFFF;--papel:#F4EFE6;color:var(--tinta)}
.comanda{background:var(--papel)}
.tira[data-secao="brasil"],.palco[data-secao="brasil"]{
  --tinta-suave:#F4EFE6;--vermelho:#F4EFE6;color:#F4EFE6} /* texto 4,94; borda e foco #111 dão 3,34 */
.tira:focus-visible{outline-offset:-5px} /* contorno interno: fica sobre o papel, não sobre o fundo da página */
```

- **Por que `--tinta-suave` e `--vermelho` entram na regra.** Fora dela, o mono e o vermelho dos impressos seguiam o tema (C9):
  - no escuro, `#ABA59B` dava 2,14 sobre a comanda, 1,48 sobre o amarelo e 1,37 sobre o Jazz, e o carimbo "PEDIDO ABERTO" em `#FF5A47` dava 2,69 sobre a comanda;
  - no claro, o mono das tiras ("02.1", "10 DISCOS") em `#58534B` dava 4,27 sobre o Jazz e 1,35 sobre o papel do Brasil.
- **Valores fixos (C10).**
  - `#111` dá de 8,56 (Soul) a 18,88 (branco).
  - `#761210` dá 5,11 no Soul, 5,38 no Eletrônico, 5,99 no Hip Hop, 6,31 no Jazz, 6,74 no Reggae e no kraft, 6,84 no amarelo, 9,84 no creme e 11,26 no branco. A folga de 0,6 sobre 4,5 cobre o escurecimento do grão, que é de ~6% na média (opacidade .12 × alfa médio ~.5) [J].
  - O `#C8231A` não serve como valor fixo: dá 2,56 no Soul, 3,17 no Jazz e 3,44 no amarelo.
  - No Brasil, as duas tintas viram `#F4EFE6`: 4,94 sobre o papel e 7,22 sobre o ponto do meio-tom (C11).
- **Teste.** Esses pares, e os reprovados, entram no `tests/contraste.test.mjs`.

Os chips de seção ficam de fora de propósito. O chip inativo fica sobre `--papel` e segue o tema. O chip ativo do Brasil usa texto `#F4EFE6` fixo. `color-scheme` faz `select`, `textarea` e checkbox nativos seguirem o tema. No escuro, a sombra sólida do CTA principal passa a ser vermelha.

### Papéis de seção (a cor do lambe)

Os papéis de seção aparecem só em quatro lugares:
- nas tiras de Coleções;
- no palco da ficha;
- no selo do vinil em CSS;
- na bolinha de 12 px do chip de seção.

Nunca aparecem em botão, preço ou texto corrido.

- **Onde fica o mapa.** O mapa fica só no CSS e declara a **cor** da seção, não o papel: `[data-secao="jazz"]{--cor-secao:#9CC7EA}`. O papel vem de `[data-secao]{--papel-secao:var(--cor-secao)}`, e a bolinha do chip usa `--cor-secao` direto. Separar os dois é o que permite ao P2 trocar só o papel (ver **Como vamos visualizar**).
- **Slugs.** Os slugs são `brasil`, `jazz`, `soul-funk`, `hip-hop`, `reggae-dub`, `eletronico` e `rock-psicodelico` (D8).
  - **Função `slug()`.** Aplica NFD, tira os acentos, passa para minúsculas, e ` / ` e espaços viram `-`: `s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s*\/\s*|\s+/g,'-')`.
  - **Onde é gravado.** O build grava `secaoSlug` em cada disco do `indice.json` e em cada card do `home.json`, e grava `slug` em cada seção do `home.json`.
  - **O que vai na URL.** Em `?secao=` vai o slug (`catalogo.html?secao=soul-funk`), inclusive nos links das tiras.
  - **Links antigos.** O catálogo continua aceitando o nome, que é o formato dos links de hoje (`?secao=Soul%20%2F%20Funk`, gerado em `pagina-index.js:76`). Ele compara `slug(valor)` com `secaoSlug` e regrava a URL com o slug por `replaceState`. Hoje o `js/filtros.js` compara o valor cru, com `d.secao !== secao` (R14).

| Seção | Papel | Texto | Contraste |
| --- | --- | --- | --- |
| Brasil | `#C8231A` (veste a Elenco; meio-tom vermelho no palco) | `#F4EFE6` fixo (também no chip ativo, nos dois temas) | 4,94. Borda e foco `#111`: 3,34. `#0F0E0D` daria 3,41: proibido |
| Jazz | `#9CC7EA` | `#111111` | 10,58 |
| Soul / Funk | `#F39A45` | `#111111` | 8,56 |
| Hip Hop | `#F4A7C3` | `#111111` | 10,04 |
| Reggae / Dub | `#C9CF5E` (limão de papel, longe do `#25D366`) | `#111111` | 11,30 |
| Eletrônico | `#BBA9EE` | `#111111` | 9,01 |
| Rock / Psicodélico | `#D9C6A5` (kraft; a Tropicália fica para campanha) | `#111111` | 11,30 |

**Regras de sinalização, que nunca se misturam:**

1. **Preto mexe no carrinho:** "Adicionar ao carrinho", "+ Solicitar", stepper.
2. **Verde abre o WhatsApp e só isso:** sempre com texto `--tinta` (e glifo `--tinta`, se o T11 liberar). Sobre amarelo, leva borda de 2 px `#111` (verde sobre amarelo dá 1,20:1).
3. **Vermelho é marca e estado:** o ponto, o código OD, ESGOTADO e o contador. Nunca é botão.
4. **Papel colorido é vitrine:** nunca carrega ação de compra.

### Tipografia

| Papel | Família | Designer · licença | Arquivo no repo | Bytes (medido) | Carregamento |
| --- | --- | --- | --- | --- | --- |
| Display: poema, títulos de seção, artista (card e ficha), carimbo, cartazes, base do wordmark | **Big Shoulders 900**, `opsz` 72 | Patric King · SIL OFL 1.1 | `fonts/big-shoulders-900.woff2` + `fonts/OFL-bigshoulders.txt` | 13.712 | `@font-face` swap; `<link rel=preload>` **só no index** (tag literal no T7) |
| Texto e interface: corpo, botões, título do disco, preço, formulários | **Gabarito** variável (usar 400/500/600/700) | Naipe Foundry, Leandro Assis, Álvaro Franca, Felipe Casaprima · OFL 1.1 | `fonts/gabarito-var.woff2` + OFL | 34.320 | swap, sem preload |
| Ficha: código OD, linha técnica, letreiro, rótulos, recibo, comanda | **Courier Prime 400** | Alan Dague-Greene · OFL 1.1 | `fonts/courier-prime-400.woff2` + OFL | 11.192 | swap, sem preload |

- **Peso e origem.** O total é de 59.224 B (57,8 KiB), contra 48.432 B do Inter, que ainda vem com o CSS bloqueante do Google e 2 origens externas. Os arquivos saem de `fonts.gstatic.com` (subset latin, user agent Android) e são servidos como vêm.
- **Preload só no index [J].** Catálogo e carrinho também têm um H1 em display como LCP, mas medem 0,54 s e 0,48 s contra metas de 2,5 s e 2,0 s. Com `swap`, o texto pinta primeiro no fallback e não espera a fonte. No index, o poema é a primeira coisa vista e a troca de fonte num H1 de 88 mil px² se nota, então lá o preload se paga. Nas outras páginas ele só disputaria banda com o JSON e as capas. Quem chega pelo index já tem a fonte em cache.
- **A/B de display no protótipo.** As alternativas são Archivo `wdth 62 wght 800` (Omnibus-Type, OFL, 37.412 B) e Anton (12.004 B, controle).
  - **Onde ficam os arquivos.** Em `prototipos/fonts/`, junto com o OFL de cada família, e nunca em `fonts/` (ver T1).
  - **Os versos não medem igual entre as fontes.** A 100 px, LACRADO tem 330,7 px na Big Shoulders e 345,3 na Archivo; ORIGINÁRIA tem 413,3 contra 430,5.
  - **Por que cada display tem seus próprios k.** Com os k da Big Shoulders, esses dois versos da Archivo ocupariam 1,022 e 1,020 do contêiner, e o `overflow:clip` cortaria a última letra. Na Anton eles ficam entre 0,950 e 0,976. Por isso cada display tem seus próprios k (bloco abaixo), e trocar a display é trocar o `@font-face` **e** o bloco de k.
- **Glifos fora do subset latin.** O subset (`U+0000-00FF`, `U+2000-206F`, …) **não** tem →, ●, ▪, ↘, ▸, ✓ nem ⅓. Por isso a interface nunca usa esses glifos como texto:
  - ● é um span desenhado em CSS;
  - ▸ é um triângulo em CSS;
  - → e ✓ são SVG inline;
  - o separador é `·` (U+00B7).
- **Fallback da display (APOSTA).** O fallback vem de `local()` com `size-adjust` medido:

  ```css
  @font-face{font-family:"Display Fallback";src:local("Roboto Black"),local("Roboto"),local("Arial");size-adjust:73%}
  ```

  - **Largura.** Roboto 900 é 1,33–1,37× mais larga que a Big Shoulders. A 73%, com os k da Big Shoulders, ela ocupa de 0,953 a 0,983 do contêiner (medido pelo checker) e não corta.
  - **Se o `size-adjust` falhar.** O texto muda de largura dentro de uma linha de altura fixa, com `nowrap` e `overflow: clip`, sem deslocamento vertical.
  - **O que falta provar.** Ainda não se sabe como o `local()` casa no Android, onde a Roboto é variável e "Roboto Black" pode não existir. O T7 mede com a Big Shoulders bloqueada e a Roboto instalada, e o T18 confere num Android real.

**Escala fluida (Utopia, 360 → 1440 px):**

```css
:root{
  --f-display:"Big Shoulders","Display Fallback",Impact,sans-serif;
  --f-texto:"Gabarito",system-ui,Roboto,Arial,sans-serif;
  --f-mono:"Courier Prime",ui-monospace,"Courier New",monospace;
  --t-cartaz:clamp(2.75rem,1.667rem + 4.815vw,6rem);       /* 44→96 px, display, lh .9 */
  --t-disco:clamp(2.5rem,1.667rem + 3.704vw,5rem);         /* 40→80 px, artista na ficha */
  --t-titulo-ficha:clamp(1.5rem,1.25rem + 1.111vw,2.25rem);/* 24→36 px, Gabarito 600 */
  --t-card-artista:clamp(1.125rem,1rem + .556vw,1.5rem);   /* 18→24 px, display, lh 1, até 3 linhas */
  --t-titulo-card:1rem;        /* Gabarito 500, lh 1.25, 2 linhas */
  --t-corpo:clamp(1rem,.958rem + .185vw,1.125rem); /* Gabarito 400, lh 1.55, máx. 62ch */
  --t-ui:1.0625rem;            /* 17 px, Gabarito 700, botões em caixa normal */
  --t-preco-card:1.125rem; --t-preco-ficha:2rem; /* Gabarito 700 */
  --t-meta:.8125rem;           /* 13 px Courier Prime, caixa alta, +.02em: MÍNIMO absoluto */
  --card-pad:.75rem;           /* 12 px, padding interno do card (conta da largura em catalogo.html, item 9) */
}
/* Poema do hero: cada verso enche a largura. k = 0,98 ÷ (largura do verso em em), medida a 100 px (Afirmação F10) */
.hero__poema{container-type:inline-size}
.poema{font:900 1rem/1 var(--f-display);text-transform:uppercase;white-space:nowrap;overflow:hidden;overflow:clip;margin:0}
.poema span{font-size:calc(var(--k)*100cqi);line-height:.9}
.poema .v1{--k:.238} .poema .v2{--k:.296;color:var(--vermelho)} .poema .v3{--k:.237}                                   /* Big Shoulders */
[data-display="archivo"] .poema .v1{--k:.241} [data-display="archivo"] .poema .v2{--k:.283} [data-display="archivo"] .poema .v3{--k:.227}
[data-display="anton"] .poema .v1{--k:.245} [data-display="anton"] .poema .v2{--k:.297} [data-display="anton"] .poema .v3{--k:.240}
```

Regras da escala:

- **Os versos do poema** são `<span>` inline separados por `<br>`, nunca `display:block`, para o H1 inteiro ser **um** único candidato a LCP. A 358 px os versos ficam com 85, 106 e 85 px e somam cerca de 248 px de altura.
- **`text-wrap: balance`** em H2 e nos títulos.
- **`line-height` nunca abaixo de 0,9** com maiúscula acentuada.
- **Corpo e inputs com no mínimo 16 px**, para o iOS não dar zoom.

### Raio, borda, sombra e espaçamento

- **Raio 0 em tudo que é papel:** card, capa, botão, input, tira, folha de filtros, totalizador, comanda e dock. `999px` só em chips, pílulas e contador. `50%` só no vinil e nos pontos.
- **Bordas:**
  - controles com 2 px `--tinta`, o que cumpre o 3:1 de componente (nos objetos impressos, `#111` nos dois temas);
  - grade de cards desenhada por réguas de 1 px `--regua`, sem borda própria no card.
- **Sombra:** sólida, `4px 4px 0 var(--tinta)` (vermelha no escuro), **só no CTA principal de cada página**, inclusive o "Ver catálogo" do index.
  - No `:active` o botão desce `translate(2px,2px)` e a sombra cai para 2 px. Com reduced-motion, o botão não desce e a sombra troca sem transição.
  - Nada mais tem sombra. O header perde o vidro e o `backdrop-filter`.
- **Espaço:**
  - base de 8 px;
  - gutter de 16 px até 767 px, 24 px até 1279 px e 32 px acima;
  - distância entre seções `clamp(3rem,2rem + 4vw,6rem)`;
  - grade de 12 colunas com gap de 24 px a partir de 1024 px (coluna de 88 px num contêiner de 1320 px);
  - container de no máximo 1320 px.
- **`overflow: clip`** sempre vem precedido de `overflow:hidden` na mesma regra. O Safari abaixo da 16 não tem `clip`: sem o fallback, o poema e as tiras gerariam rolagem horizontal. A regra nunca vai num ancestral de elemento sticky.

### Textura

- **Grão.**
  - **O quê.** SVG `feTurbulence` em data URI (~0,4 KB), numa variante só, em `#111`. O grão só vai em objeto impresso, que é igual nos dois temas, e por isso a variante escura da v5.1 saiu. Valores: `type='fractalNoise'`, `baseFrequency='.65'`, `numOctaves='3'`, `stitchTiles='stitch'`, ladrilho de 182 px e opacidade .12 (os da ref. de grão da pesquisa).

    ```css
    .tira::after,.palco::after,.faixa-procurando::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
      opacity:var(--grao-opacidade,.12);
      background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='182' height='182'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .067 0 0 0 0 .067 0 0 0 0 .067 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E") 0 0/182px 182px}
    ```

  - **Onde.** Vai em `::after` **só** nas tiras de coleção, no palco da ficha e na faixa "Procurando".
  - **A comanda fica sem grão** [J]: ela é o sumário do art. 4º do Decreto 7.962 e mostra o Total, e ali a legibilidade vem antes.
  - **Empilhamento e toque.** O pseudo-elemento leva `pointer-events:none; z-index:0`, e o conteúdo do bloco `position:relative; z-index:1`. Assim o grão fica **atrás** do texto e dos controles e nunca intercepta um toque (inputs e botão da faixa, links das tiras, botão "Compartilhar" do palco).
  - **Limites.** É estático, sem `mix-blend-mode`, e nunca fica sobre capa, preço, controle ou grade de cards. Com `--grao-opacidade: 0` o grão desliga sem mexer no HTML.
- **Vinil em CSS.**
  - Sulcos: `repeating-radial-gradient(#111 0 1px, #1d1d1d 1px 3px)`.
  - Selo: 34% do disco, em `--papel-secao`.
  - Furo: 4% em `--papel`.
- **Selo da ficha.** O texto circular "ORIGINÁRIA DISCOS · INDÚSTRIA BRASILEIRA · 33⅓ RPM" é SVG inline com `textPath` em Courier Prime e `aria-hidden`. O ⅓ cai na fonte do sistema, o que é aceitável porque o selo é decorativo.
- **Reflexo do lacre, só na capa da ficha.** Um `::after` com `linear-gradient(115deg, transparent 40%, rgb(255 255 255/.28) 48%, rgb(255 255 255/.06) 52%, transparent 60%)`, largura de 250%, movido só por `transform`. No estado **fraco** (sem suporte ou com reduced-motion), ele fica parado em `translateX(-30%)` com `opacity:.5`, o que leva os picos a .14 e .03.
- **Meio-tom vermelho, só no palco dos discos da seção Brasil:**

  ```css
  .palco[data-secao="brasil"]::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(circle,#9A1B14 1.5px,transparent 1.6px) 0 0/8px 8px}
  ```

  - **Desenho.** Pontos de 3 px de diâmetro a cada 8 px (11% da área), num vermelho mais escuro que o papel `#C8231A`.
  - **Contraste.** O texto `#F4EFE6` dá 4,94 sobre o papel e 7,22 sobre o ponto (C11): o meio-tom só aumenta o contraste.
- **Carimbo ESGOTADO, só na ficha:** Big Shoulders em `--carimbo` (`#C8231A` nos dois temas), borda dupla de 3 px, `rotate(-6deg)`.
- **Adesivo NOVO, só com `novo:true`:** círculo de 48 px em amarelo, `rotate(-12deg)`.
- **Tiras de coleção:** rotação estática de ±0,6°, com `overflow:hidden; overflow:clip` na seção.

### Iconografia

- SVG inline num viewBox de 24 px, traço de 1,5 px, `currentColor` e `aria-hidden`.
- O conjunto é lupa, X, +, −, seta, check, compartilhar, menu e sacola. O "play" é um triângulo em CSS.
- **Glifo do WhatsApp:**
  - **Forma e tamanho.** Só o glifo oficial, sem alterar a forma, com 16–22 px.
  - **Cor.** A mesma do texto do botão verde: `--tinta`, que dá 9,52:1; branco daria 1,98, abaixo do 3:1 de que um identificador visual precisa (1.4.11).
- **Sempre dentro de botão verde, com texto visível**, com uma única exceção: o quadrado de 44×44 do header no celular, que tem só o glifo e `aria-label="Fale no WhatsApp"`.
- **APOSTA, com ramo negativo escrito.** A pesquisa refutou a ideia de que só o selo oficial "Conversar no WhatsApp" tem regra. Se o site usa o logo do WhatsApp, ele tem de ser o oficial, sem mudar cor nem forma (ref. 25). O glifo em `--tinta` é uma mudança de cor e só entra se a página de marca da Meta oferecer a versão monocromática escura.
  - **Evidência (pré-condição do T11).** Anexar ao PR o print da página de marca da Meta mostrando essa variante, ou a citação literal com URL e data.
  - **Se a Meta aceitar:** o glifo vai em `--tinta` em todos os botões verdes, como descrito nesta estratégia.
  - **Se não aceitar, ou se não houver evidência:** nenhum botão verde leva glifo.
    - Ficam só com texto o hero, o `.cta-solicitar`, a barra de compra, o CTA do carrinho (fixo ou não), a faixa "Procurando", o zero-resultados, a ficha não encontrada e o botão do header no desktop.
    - No header do celular, o quadrado de 44×44 vira o botão de texto "WhatsApp", e a lupa passa para a linha de navegação.
    - O glifo branco continua proibido (1,98).
- O WhatsApp nunca aparece no card nem fica mais proeminente que a marca Originária.

### Tom de voz

- **Primeira pessoa do dono, falando com "você".** O "eu" é a verdade de uma loja de uma pessoa só e já é a voz do v4 e do CONTRATO: "Eu encontro pra você".
- **Slogans de cartaz:**
  - "PROCURANDO UM DISCO? EU ENCONTRO.";
  - "NÃO TÁ AQUI? EU ENCONTRO.";
  - nunca "eu acho", que é ambíguo.
- **Vocabulário de balcão:** lacrado, prensagem, edição, Lado A, sob consulta, encomenda, solicitação.
- **Convenções de compra:**
  - o CTA literal do dono, "Esgotado? Solicite o seu aqui agora mesmo!", fica intocado;
  - "Carrinho" fica com esse nome (convenção do e-commerce), sem metáfora;
  - "Solicitar" sozinho sempre põe no carrinho. Se o botão abre o WhatsApp, o rótulo diz isso: "Solicitar no WhatsApp", "Pedir pelo WhatsApp".
- **Proibido:**
  - urgência sem dado real ("últimas unidades" sem estoque, contador falso);
  - letra de música no letreiro;
  - inglês de drop ("sold out", "drop");
  - promessa que o dono não confirmou (prazo de resposta e de envio vêm do `config.js`; sem valor, a frase some);
  - carimbo que afirma algo que não aconteceu (ver momento 6).

---

## Momentos-assinatura

### 1. Abertura: o "O" que gira (substitui o `intro.js` de 1,4–2,5 s)

- **O que acontece.** O primeiro paint já é o poema. O "O" de ORIGINÁRIA, no último verso do poema, é um disco preto com selo vermelho que dá uma volta (900 ms, `cubic-bezier(.2,.7,.2,1)`) depois do primeiro paint. Acontece uma vez por sessão (`sessionStorage['originaria.abertura']`). Tocar no disco repete a volta.
- **O wordmark não gira.** Ele é `<img src="img/logo.svg">` nas 4 páginas (R16), e o CSS e o JS da página não alcançam o interior de um SVG carregado por `<img>`. O "O" em forma de disco aparece nele, mas parado.
- **Técnica.**
  - O "O" continua no DOM com `color: transparent` e o nome acessível intacto.
  - O disco é um `::before` posicionado sobre ele, e a volta é um `@keyframes` de `rotate` em `transform`.
  - A classe `.girou` é posta por JS de cerca de 10 linhas.
  - Nada cobre conteúdo e o LCP não espera.
- **Fallback.** Sem JS, o disco fica parado, que é o estado-base do CSS.
- **Reduced-motion.** Não gira, nem no toque (`animation:none` no disco).

### 2. Disco saindo da capa (hover e foco no card, chegada na ficha)

- **O que acontece.**
  - **Card (só desktop, `(hover:hover) and (pointer:fine)`):** o vinil sai 18% de trás da capa em 240 ms `ease-out`. O foco por teclado faz o mesmo, mais o contorno de 3 px.
  - **Ficha:** depois de `img.decode()`, o vinil desliza de 0 a 24% (600 ms) e o reflexo do lacre atravessa a capa uma vez (600 ms). No desktop o reflexo repete no hover.
- **Técnica.** Só `transform`. No celular, o vinil do card nem é renderizado (`display:none` sob `(hover:none)`), o que poupa pintura. O palco tem `overflow:hidden; overflow:clip`.
- **Fallback.** O vinil já aparece na posição final e o reflexo fica parado e fraco.
- **Reduced-motion.** Posição final sem transição. O reflexo fica estático e fraco (`opacity:.5` em `translateX(-30%)`, ver **Textura**), e o lacre continua visível como desenho.

### 3. Adicionar ao carrinho ou solicitar

- **O que acontece.**
  - O botão vira "Adicionado" (check em SVG) por 1,5 s.
  - O contador do header pulsa (`scale` 1 → 1,3 → 1, 200 ms).
  - Um carimbo "NO CARRINHO · OD-051" (`.selo-carrinho`, `aria-hidden`) entra "batido" na base da tela: de `scale(1.3) rotate(-8deg)` para `scale(1) rotate(-3deg)` em 180 ms. Fica 1,5 s na tela, o mesmo tempo do "Adicionado", e sai com `opacity` em 160 ms `ease-in`, terminando em `display:none`.
  - Na primeira vez, a dock sobe (`translateY` de 110% a 0, 220 ms).
- **Onde o carimbo fica.**
  - **Posição.** `position:fixed`, centrado e sempre acima do que estiver fixo na base: `bottom: calc(max(12px, env(safe-area-inset-bottom)) + var(--base-fixa, 0px) + 12px)`.
  - **`--base-fixa`.** Vale 56 px quando a dock está visível e 64 px quando a barra de compra está visível: `body:has(.dock[data-visivel]){--base-fixa:56px}` e `body:has(.barra-compra[data-visivel]){--base-fixa:64px}`.
  - **Primeira vez.** O `data-visivel` da dock é posto antes do carimbo, então o carimbo já nasce acima da posição final da dock.
  - **Camada e toque.** `z-index:30` (dock e barra ficam em 20) e `pointer-events:none`. O carimbo fica por cima, mas nunca recebe o toque seguinte em "Revisar pedido" ou "Adicionar".
- **Técnica.** `@starting-style` mais `transition` em `transform`, `opacity` e `display`, com `transition-behavior: allow-discrete`. O `aria-live="polite"` que já existe continua.
- **Fallback.** Sem `@starting-style`, os elementos aparecem sem animação.
- **Reduced-motion.** Só `opacity` (120 ms na entrada, 160 ms na saída), sempre por `transition` e nunca por `@keyframes`, para o gate do T17 separar fade de movimento. O texto do botão e o anúncio por leitor de tela continuam iguais.

### 4. Card → ficha (transição entre páginas)

- **O que acontece.** A capa do card viaja e cresce até o palco da ficha em 320 ms, e o resto da página faz crossfade em 180 ms. O header só fica parado quando está na mesma posição nas duas páginas. Na volta, há só crossfade.
- **Técnica.**
  - `@view-transition{navigation:auto}` dentro de `@media (prefers-reduced-motion:no-preference)`, no CSS comum a todas as páginas.
  - **Header.** O nome `view-transition-name:cabecalho` só vai nas páginas sem letreiro, onde o header está em y = 0: ficha, carrinho e como-funciona (`body:not(:has(.letreiro)) header{view-transition-name:cabecalho}`). Em index e catálogo, o letreiro de 36 px fica acima. Na rolagem 0, o header iria de y = 36 para y = 0 e deslizaria, então ali ele entra no crossfade com o resto [J: o caso rolado, em que a posição coincidiria, não compensa um script].
  - **No clique do card:**
    - primeiro, tira `view-transition-name` de qualquer outro elemento que tenha `capa`: um card aberto antes em nova aba deixa o nome nele, e dois elementos com o mesmo nome abortam a transição;
    - depois, `img.style.viewTransitionName='capa'` e `sessionStorage['od.capa']=JSON.stringify({id,src})`;
    - na própria ficha, o clique num card de "Mais de" também tira o nome do `#capa` antes, pelo mesmo motivo.
  - **No `pageswap`:** tira todo nome `vt-*` que tenha sobrado de uma transição no documento (catálogo, item 12). O `capa` fica, porque é ele que faz o morph.
  - **Em `disco.html`:**
    - a capa já está no HTML, com o nome fixo no CSS (`#capa{view-transition-name:capa}`) e um script clássico inline logo depois dela:

    ```html
    <img id="capa" width="600" height="600" fetchpriority="high" alt="">
    <script>
    (function () {
      var id = new URLSearchParams(location.search).get('id'), img = document.getElementById('capa'), c = null;
      if (!id) return;
      try { c = JSON.parse(sessionStorage.getItem('od.capa')); sessionStorage.removeItem('od.capa'); } catch (e) {}
      // um fetch só: pagina-disco.js reaproveita window.__disco
      var p = window.__disco = fetch('data/discos/' + encodeURIComponent(id) + '.json')
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      if (c && String(c.id) === id) img.src = c.src;                     // veio do card: src na hora
      else p.then(function (d) { if (d && d.capa) img.src = d.capa; }); // link direto ou od.capa velho
    })();
    </script>
    ```

    - o link direto (Instagram), que é justamente o caso medido no gate de 2,3 s, não depende do `sessionStorage`: o script dispara ali mesmo o `fetch` do JSON do disco (≤ 3 KB gz) e preenche o `src` quando ele chega;
    - um `od.capa` velho, de outro disco, é descartado pela checagem de id;
    - `window.__disco` resolvendo `null` leva ao estado "Disco não encontrado" (disco.html, item 12);
    - `<link rel="preconnect" href="https://i.discogs.com">` está em `disco.html`, `index.html` e `catalogo.html`. Sem ele, a imagem do LCP viria de uma terceira origem, a frio, depois de um `fetch` de JSON;
    - `<link rel="expect" href="#capa" blocking="render">` no `<head>`;
    - `::view-transition-old(capa),::view-transition-new(capa){object-fit:cover}`.
  - O nome posto no card é limpo no `pageshow`, por causa do bfcache.
- **Suporte confirmado.** Chrome e Android 126+, Safari e iOS 18.2+ (85,97% global). O Firefox não tem; no Samsung Internet as fontes divergem.
- **Fallback.** Navegação normal. No 4G, o timeout de ~4 s pula a transição sem erro (ver Speculation Rules na **Stack**).
- **Reduced-motion.** `@view-transition{navigation:none}`.

### 5. Rolagem da home: o cartaz sendo colado

- **O que acontece.** Enquanto cada seção entra na tela, os números 01–04 deslizam de `translateX(12vw)` até o lugar e as tiras de Coleções giram de ±3° para ±0,6°, como cartaz sendo colado.
- **Técnica.**
  - Tudo dentro de `@supports (animation-timeline:view())` e `@media (prefers-reduced-motion:no-preference)`.
  - `animation-range: entry 0% cover 40%`, só `transform`.
  - **O estado-base do CSS é o estado final**, então quem não tem suporte nunca vê nada escondido.
  - `overflow:hidden; overflow:clip` nas seções, para não gerar rolagem horizontal.
- **Suporte confirmado.** Chrome e Android 115+, Safari 26+. O Firefox fica estático.
- **Reduced-motion.** Tudo estático.

### 6. Pedido aberto no WhatsApp

- **O que acontece.**
  - Ao tocar "Pedir pelo WhatsApp" (`#btn-pedir`), o link abre o WhatsApp na hora (`target=_blank`, sem `preventDefault`).
  - A comanda ganha o carimbo **"PEDIDO ABERTO NO WHATSAPP · 14:32"**, batido em 180 ms, em `--vermelho` da comanda (`#761210`, 9,84 sobre o creme, C10). O site só sabe que abriu o WhatsApp, não que a pessoa enviou; por isso o carimbo não diz "enviado".
  - Aparece o painel `role="status"`, com o texto "Abrimos o WhatsApp com seu pedido: é só tocar em enviar.", o botão "Não abriu? Copiar pedido" (`[data-copiar]`) e o link "Esvaziar carrinho" (`[data-esvaziar]`, com o `confirm` nativo de hoje).
  - **O carrinho fica como está** depois do clique, porque a pessoa pode não ter enviado, pode querer reabrir ou pode ajustar a observação. Só esvazia quando ela pede.
- **Técnica.** `@keyframes` em `transform` e `opacity` com uma iteração só, mais `navigator.clipboard.writeText(mensagem)`.
- **Fallback.** Sem Clipboard API (APOSTA), o botão seleciona o `<pre>` da comanda e diz "Texto selecionado: copie e cole no WhatsApp".
- **Reduced-motion.** O carimbo aparece parado (`animation:none`) e o status é o mesmo.

---

## Página a página

### Componentes globais

- **Letreiro (index e catálogo; sai da ficha, do carrinho e da como-funciona).**
  - **Faixa:** 36 px, fundo `--faixa`, Courier Prime 13 px em caixa alta, com separadores em bolinha CSS de 8 px em `--vermelho-faixa`.
  - **Texto:** "VINIL NOVO E LACRADO ● PEDIDO PELO WHATSAPP, SEM CADASTRO ● ATENDIMENTO HUMANO ● ESGOTOU? EU ENCONTRO ●". Entra também "LOTE #N CHEGA DD/MM", mas só quando `config.LOTE.chegada` é uma data futura real. Toda frase precisa ser confirmada pelo dono.
  - **Cópias e animação:**
    - o HTML traz **uma** cópia (`.letreiro__copia`) dentro de `.letreiro__trilho`;
    - o `js/letreiro.js` mede a cópia, clona até N = max(2, ⌈innerWidth ÷ largura da cópia⌉ + 1), marca as clonadas com `aria-hidden="true"`, grava `--n` e refaz no `resize`;
    - o trilho anda uma cópia por ciclo, com `translateX(calc(-100% / var(--n)))` em 40 s, `linear`, sem fim. A velocidade é a mesma das 2 cópias com −50%.
  - **Por que N cópias.** Medido: uma cópia tem 797 px em Courier Prime 13 px com +.02em, e ~830 px com as 4 bolinhas. Com só 2 cópias, toda tela acima de ~830 px (1024, 1280, 1440) via um vão vazio de até ~610 px no fim de cada ciclo.
  - **Sem JS.** A cópia única fica parada: a animação só liga com `.letreiro[data-pronto]`.
  - **Pausa.** Pausa com `:hover` e `:focus-within` e com um botão de 36×36 com `aria-pressed` e o rótulo "Pausar avisos" (WCAG 2.2.2). O botão de 36 px fica acima do mínimo de 24 px da WCAG 2.5.8.
  - **Com reduced-motion:**
    - não clona e fica com `animation:none`;
    - a faixa continua com **uma linha de 36 px**: a área do texto vira `overflow-x:auto`, com rolagem manual, `tabindex="0"`, `role="region"` e `aria-label="Avisos da loja"`;
    - quebrar em linhas, como na v5.1, dava ~830 px de texto em ~314 px úteis a 390 px, ou seja, 3 linhas (~73 px contra 36). Isso empurrava a capa visível na dobra de 390×664 de ~61 para ~24 px, abaixo dos 40 px exigidos [J: estimativa]. O T13 roda o aceite de dobra também com `--reduzido`.
- **Header sticky de 56 px**, com fundo `--papel` sólido e borda inferior de 2 px `--tinta`.
  - **Wordmark** em SVG, carregado por `<img src="img/logo.svg">`: ORIGINÁRIA em Big Shoulders 900 convertida em contorno, com o O em forma de disco, parado (momento 1). São **24 px de altura total do SVG, acento incluído**, o que dá ≈ 101 px de largura. É o mesmo desenho do favicon.
  - **À direita:**
    - lupa de 44×44, só no celular, que leva a `catalogo.html#busca`;
    - botão "Carrinho": fundo `--tinta`, texto `--sobre-tinta`, Gabarito 600 15 px, ícone de sacola e contador em círculo vermelho de 20 px (`[data-contador]`), com `aria-label="Carrinho, 3 itens"`;
    - quadrado verde de 44×44 com o glifo oficial do WhatsApp em `--tinta` e `aria-label="Fale no WhatsApp"`. No ramo negativo do T11, vira o botão de texto "WhatsApp" e a lupa passa para a linha de navegação (ver **Iconografia**).
  - **Abaixo de 380 px**, o texto "Carrinho" passa para `.so-leitor` (continua no DOM e no nome acessível) e o botão vira sacola mais contador em 44×44. A conta a 360 px: wordmark 101 + lupa 44 + carrinho 44 + WhatsApp 44 + 3 espaços de 8 = 257 px, contra 328 disponíveis. Com o texto visível, a soma ia a ~335–343 px.
  - **Celular:** a navegação fica numa linha rolável de 40 px abaixo do header (não sticky), em Courier 13 px: CATÁLOGO · COLEÇÕES · NOVIDADES · COMO FUNCIONA. O item atual leva um ponto vermelho e `aria-current`, sem sublinhado.
  - **Desktop (≥ 1024):** tudo numa linha, e o botão verde ganha o texto "WhatsApp".
- **Dock (index e catálogo), só com `quantidadeTotal > 0`.**
  - `position: fixed`, 12 px das laterais, a `max(12px, env(safe-area-inset-bottom))` da base, 56 px de altura, fundo `--faixa`, `z-index:20`, sem ocupar a largura toda (Baymard).
  - À esquerda, o resumo "Carrinho (3) · R$ 480,00", ou "· valores no WhatsApp" quando falta preço.
  - À direita, o botão **"Revisar pedido"**, com fundo `--faixa-texto` e texto `--faixa` (16,49), que leva a `carrinho.html#comanda`.
    - **Não é verde, porque não abre o WhatsApp.** O pedido sempre passa pela comanda, que é o sumário exigido pelo art. 4º do Decreto 7.962. É lá que ficam a Observação/CEP e a rede "Não abriu? Copiar pedido".
    - São 3 toques do card até o WhatsApp (adicionar, revisar, pedir), contra 2 antes. É o preço do sumário.
  - `body:has(.dock[data-visivel]){padding-bottom:88px}`.
- **Rodapé**, com fundo `--faixa`.
  - Um poema de saída próprio, no lugar do wordmark gigante da GOMA, em `--t-cartaz`: "DISCO NOVO / DISCO LACRADO / DISCO PEDIDO / DISCO ENTREGUE". A palavra DISCO fica numa coluna fixa e o último verso vai em `--vermelho-faixa`.
  - Colunas em mono:
    - LOJA: Como funciona · Pagamento · Prazos e frete · Trocas e arrependimento (7 dias). Todos levam a âncoras de `como-funciona.html` (T9b);
    - CONTATO: WhatsApp · Instagram @originariadiscos;
    - LEGAL `[data-legal]`: nome, CNPJ/CPF, endereço e e-mail, exigidos pelo Decreto 7.962. Os dados vêm de `config.IDENTIFICACAO_LEGAL`.
  - "Data provided by Discogs." com link sem `nofollow`, e o aviso de não afiliação com o texto literal dos API Terms. O lugar e a redação saem do T0b.
- **Preview de link (og:\*).** Hoje nenhuma página tem og:\* (R13), e `disco.html` é um arquivo só para todos os ids. Por isso o "Compartilhar" e os links do Instagram mostram no WhatsApp um preview genérico, sem capa nem título.
  - **Decisão da v5.2: preview de marca, igual em todas as páginas.** Todas levam `og:title`, `og:description` e `og:image` absoluto (`https://l3ttn.github.io/originariadiscos/img/og.png`, 1200×630). A imagem é feita a partir do poema (T11), sem capa do Discogs.
  - **O texto compartilhado leva o disco.** O "Compartilhar" da ficha manda "Artista – Título · OD-001 · <url>", então a mensagem identifica o disco mesmo com o preview genérico.
  - **Por que não `disco/<id>.html` com og:image por disco agora.** A og:image de um disco seria a capa do Discogs, que não é CC0. Isso depende das decisões 2 e 4 do T0b (capas e prints) e fica para o T23.

### index.html

**Celular.** A soma das alturas abaixo vale para as larguras de 390 e 412 px. A dobra é a **área visível real**, não a tela:
- 390×844 é o tamanho da tela do iPhone 12 a 15;
- com a barra de status e as barras do Safari, sobram ~664 px;
- no Chrome Android de 412 px sobram ~780 px.

| Bloco | Detalhe | Termina em (390 px) | Termina em (412 px) |
| --- | --- | --- | --- |
| Letreiro + header + navegação | 36 + 56 + 40 px (o letreiro fica com 36 px também com reduced-motion) | 132 px | 132 px |
| Kicker | Mono, estático: "LOJA DE DISCOS · NOVO E LACRADO · PEDIDO NO WHATSAPP" | ~174 px | ~174 px |
| H1 poema | `Vinil novo<br>lacrado<br>Originária`, em caixa alta por CSS; o verso 2 em vermelho e o "O" do verso 3 em forma de disco | ~422 px | ~438 px |
| Lead | Gabarito 17 px, largura total, 2 linhas: "Garimpado a dedo. Esgotou? Eu encontro o seu. Pedido pronto no WhatsApp." | ~489 px | ~505 px |
| CTAs (`.hero__ctas`) | Lado a lado, 52 px: "Ver catálogo" (`--tinta`, CTA principal com a sombra sólida da regra geral, `4px 4px 0 var(--tinta)`, vermelha no escuro) e "Pedir no WhatsApp" (verde, texto `--tinta`, borda de 2 px; glifo de 18 px se o T11 liberar) | ~557 px | ~573 px |
| Destaques da semana | Rótulo mono e fileira horizontal (scroll-snap é APOSTA; sem ele, rola livre) | capa começa em ~603 px | capa começa em ~619 px |
| 1ª capa | 58vw = 226 px (239 a 412), ou seja, 51 mil px² contra os 88 mil px² do H1. O H1 continua sendo o LCP | ~829 px | ~858 px |

**O que precisa caber na dobra real [J]:** o H1, os 2 CTAs e pelo menos 40 px da 1ª capa, a dica de que ali tem disco. A 390×664 aparecem ~61 px da capa; a 412×780, ~161 px. A capa **não** fica inteira na 1ª dobra de nenhum celular real. Os aceites do T13 rodam com `--tela=390x664` e `--tela=412x780`, com e sem `--reduzido`.

- **Destaques.** Cada item da fileira:
  - capa com borda de 2 px, `width/height=600`, `aspect-ratio:1` e `object-fit:cover`;
  - vinil atrás saindo 18%;
  - código OD numa caixa preta em mono, artista em display 24 px, título em Gabarito 600 16 px e a linha de estado.
  - Carregamento: as 2 primeiras capas `eager` **sem** `fetchpriority` (o LCP é texto), a 3ª `lazy`.
  - O 2º destaque aparece em 136 px à direita, como dica de rolagem. O espaço da fileira fica reservado no HTML, o que mantém o CLS em 0.
  - A fileira fecha com "Data provided by Discogs." (link sem `nofollow`; lugar e redação do T0b).
- **01 NOVIDADES.** O "01" sólido em vermelho, "NOVIDADES" vazada (`-webkit-text-stroke` 2 px dentro de `@supports`; sem suporte, sólida) e "Ver todas" à direita. A grade de cards com réguas tem 2, 3 e 4 colunas a partir de 0, 640 e 1024 px de container, com 12 cards. Fecha com "Data provided by Discogs.".
- **02 COLEÇÕES.** Lista-índice com **as 7 seções** ordenadas por contagem. Cada tira (`a.tira[data-secao]`, com `container-type:inline-size`):
  - é inteira um link para `catalogo.html?secao=<slug>`, com o papel da seção, grão e rotação de ±0,6°;
  - **tem duas linhas em todas as larguras:** em cima, "02.1" e "10 DISCOS" em mono 13 px; embaixo, o nome em display `clamp(2rem, 8cqi, 3.5rem)`, medido pela largura da própria tira. Fica com ~88 px de altura no celular e ~104 px no desktop [J];
  - **leque de 3 mini-capas de 56 px só a partir de 1024 px**, numa coluna à direita das duas linhas (~104 px de largura fechado). Abaixo de 1024 px, o `pagina-index.js` nem cria os `<img>` do leque: decide por `matchMedia('(min-width:1024px)')` e refaz no `change`. Assim o celular não baixa nenhuma capa por ele;
  - **as 3 capas do leque preferem as que já estão em Destaques e Novidades** (regra do build, no `home.json`). As URLs são assinadas e não redimensionam: cada mini-capa de 56 px custa a capa inteira de 600 px (mediana de 98 KB, W8). Pela regra da v5.1 eram 21 capas, 15 delas sem repetir nenhuma já mostrada; com a preferência, são 9 novas (D9);
  - **conta da largura** [J: proporção a partir dos 263 px de "ROCK / PSICODÉLICO" a 35,1 px, ou 7,49 em]:

    | Largura | Tira | Nome | Espaço útil para o nome |
    | --- | --- | --- | --- |
    | 360 px | 328 px | 240 px (a 32 px) | 296 px |
    | 1024 px, 2 colunas | ~476 px | 285 px (a 38,1 px) | 324 px, ao lado do leque de 104 px |
    | 1440 px | 648 px | 388 px | 496 px |

    A linha única da v5.1 ("02.1", nome, contagem e leque lado a lado) não cabia: a 480 px, o nome sozinho já tinha 323 px, e com o resto passava dos 448 px úteis;
  - a seção usa `overflow:hidden; overflow:clip`;
  - a partir de 1024 px, quando o leque aparece, a seção fecha com "Data provided by Discogs.".
  - Isso **muda o CONTRATO** (hoje são 4 seções) e precisa do OK do dono.
- **03 PROCURANDO UM DISCO?** Faixa de largura total em `--amarelo-lambe` (`.faixa-procurando`), com grão atrás do conteúdo e as tintas fixas de objeto impresso.
  - "PROCURANDO UM DISCO?" em display `#111` e "EU ENCONTRO." em `--vermelho-cartaz` (≥ 24 px).
  - Dois campos com rótulo visível, "Artista" e "Disco": 48 px, fonte de 16 px, borda de 2 px `#111` (11,46 sobre o amarelo).
  - Botão verde com borda de 2 px `#111`, que monta "Procuro: <artista> – <disco>" via `linkProcuraGenerica`.
- **04 COMO FUNCIONA.** Grade 2×2 (1 coluna abaixo de 360 px). Os passos são marcados por ● ●● ●●● ●●●● em vermelho, uma homenagem ao sistema de pontos da Elenco sem copiar o arranjo do logo:
  1. "Escolha o disco no catálogo."
  2. "Chame no WhatsApp: o pedido já vai pronto."
  3. "Eu encontro ou aviso quando chegar."
  4. "Combinamos frete pelo CEP e pagamento."

  Fecha com a linha mono "SEM CADASTRO · SEM CARTÃO NO SITE" e o link "Como funciona, pagamento e trocas" para `como-funciona.html`. Os 4 passos seguem o CONTRATO.
- **Rodapé e dock**, conforme os componentes globais.

**Desktop (≥ 1024).**
- Grade de 12 colunas: o poema ocupa as colunas 1–7 (calibrado por `cqi` no próprio contêiner) e os destaques empilham nas colunas 8–12 (1 grande e 2 menores). O H1, com cerca de 330 mil px², continua maior que qualquer capa.
- Novidades em 4 colunas; Coleções em 2 colunas de tiras, com leque. No hover ou foco, a tira endireita e o leque abre em 200 ms, para dentro da tira (ver **Movimento**).

**O que muda em relação ao v4.**
- A intro sai.
- O hero deixa de ser 3 cards injetados por JS depois do `catalogo.json` (LCP de 4,80 s com IMG) e passa a ser um poema de texto no HTML.
- Saem o Inter, o Google Fonts e o vidro do header.
- Coleções passa de 4 para 7.
- A faixa "Procurando" ganha 2 campos.
- O texto do botão verde passa de branco para tinta.
- O rodapé ganha o bloco legal e os links de política.
- A dock leva à comanda em vez de abrir o WhatsApp direto.

### catalogo.html

**Celular.**

1. **Letreiro e header.**
2. **Topo:** "CATÁLOGO" em `--t-cartaz` e a linha mono "51 DISCOS · 7 SEÇÕES · ATUALIZADO 01/10", com a data de `geradoEm`.
3. **Busca:**
   - campo de 56 px com borda de 2 px e placeholder em mono "artista, disco, selo ou OD-000", com o botão "Buscar" (`--tinta`) colado (Baymard);
   - **normalização:** NFD, sem acento, em minúsculas;
   - **precedência: código primeiro, texto depois.**
     - Primeiro, a consulta inteira é normalizada para código, sem espaços, hífens e pontos.
     - Se ela casar exatamente com algum código OD ou catno (da edição à venda ou do original), a busca devolve **só** esses discos e para. "OD-001", "od 001" e "OD001" dão só o OD-001. "33057-1" dá só o disco com esse catno.
     - Só se não casar segue a busca por texto. Sem essa regra, "33057-1" viraria os tokens "33057" e "1", e o "1" casaria por substring com quase todo disco;
   - **texto:** o hífen vira espaço e a busca quebra em tokens por espaço, e todo token precisa casar (E);
   - **erro de digitação:** só tokens **alfabéticos** com 5 letras ou mais toleram 1 erro de edição, comparados a cada palavra de artista, título e selo. Os outros casam por substring. "jorje ben" acha Jorge Ben: "jorje" tolera o erro e "ben" casa exato. "OD-001" nunca cai na tolerância, então não casa com OD-002 a OD-009 nem com OD-011.
4. **Chips de seção** (`.chips [data-secao]`, com o slug no atributo, botões com `aria-pressed`):
   - rolagem horizontal, 44 px, pílula com borda de 2 px `--tinta`, bolinha de 12 px em `--cor-secao` e Gabarito 600 15 px;
   - o chip ativo ganha o papel da seção, com texto `#111`; no Brasil, fundo vermelho com texto `#F4EFE6` fixo nos dois temas (4,94);
   - "Tudo" vem primeiro;
   - grava `?secao=<slug>` por `replaceState` e aceita o nome antigo na entrada (ver **Papéis de seção**).
5. **Barra sticky de 48 px abaixo do header:**
   - botão "Filtros (2)";
   - `<select>` "Ordenar: Mais novos / Preço ↑ / Preço ↓ / A–Z / Ano" (↑ e ↓ estão no subset). As opções de preço só aparecem quando pelo menos 2 discos têm preço, e os sem preço vão para o fim [J]. Hoje, com 51 preços nulos, elas não aparecem;
   - alternador "Grade | Parede" com `aria-pressed`, que grava `?vista=parede` por `replaceState`. Sem o parâmetro, a vista é a Grade.
6. **Filtros aplicados:** pílulas removíveis ("Jazz ×", "LP ×") e "Limpar tudo", mais o contador mono com `aria-live`: "23 DISCOS".
7. **Folha de filtros:** `<div popover id="folha-filtros">` ancorada na base da tela.
   - Altura máxima de 85vh, título "FILTROS" em display e X de 44 px.
   - Gênero, Formato e Status como checkboxes reais estilizados "[x] Jazz", em Courier 16 px, com linhas de 44 px. Cada marcação aplica o filtro na hora (grade atrás e `replaceState`).
   - Rodapé fixo da folha com "Ver 23 discos" (`--tinta`, contagem ao vivo), que fecha a folha, e "Limpar".
   - **Histórico:**
     - abrir faz `pushState`;
     - o `popstate` fecha a folha, então o Voltar do Android fecha;
     - o light dismiss do popover (toque fora ou Esc) e o "Ver N discos" fecham sem disparar `popstate`. Por isso, no evento `toggle` com `newState === 'closed'`, se o fechamento não veio do `popstate`, o script chama `history.back()`. Sem isso, a entrada de histórico ficaria órfã e o Voltar seguinte não faria nada visível;
     - **o filtro sobrevive ao fechamento.** Com a folha aberta, os filtros e o `?ate=` gravam por `replaceState` na entrada empurrada, e voltar leva à URL de antes de abrir. Por isso o `popstate` que fecha a folha, venha do Voltar ou do `back()`, regrava a URL do estado atual com `history.replaceState(history.state, '', urlDoEstado())`. Sem isso, escolher "Jazz" e tocar "Ver 7 discos" deixava a URL sem o filtro: recarregar, compartilhar ou voltar da ficha sem bfcache mostrava o catálogo inteiro.
   - Sem suporte a popover, o painel aparece em linha acima da grade.
8. **Grade de cards com réguas:** 2, 3, 4 e 5 colunas a partir de 0, 640, 1024 e 1280 px de container, com réguas de 1 px entre os cards.
9. **CARD** (`.card`, componente único, usado também na home e em "Mais de"):
   - **padding interno:** `--card-pad`, 12 px, em volta do texto;
   - **linha mono 13 px:** "OD-051" em vermelho à esquerda e "LP · 2020" à direita;
   - **capa 1:1:** `width/height=600`, `aspect-ratio:1`, `object-fit:cover` (as capas do Discogs medem 600×596/597);
     - 1ª linha `eager`, com `fetchpriority="high"` só na 1ª capa; o resto `lazy`;
     - ponto vermelho de 10 px no canto se estiver esgotado; adesivo NOVO se `novo`;
     - **a capa nunca fica cinza**;
   - **artista** (`.card__artista`): display em caixa alta, em `--t-card-artista` (18→24 px), `line-height:1`, com no máximo **3 linhas** (`line-clamp` é APOSTA; o fallback é `max-height:3em` com `overflow:hidden`):
     - largura útil a 360 px: (360 − 32 − 1 de régua) ÷ 2 − 2 × 12 = 139,5 px. A 390 px, 154,5 px;
     - medido a 18 px (F13): "ANTONIO CARLOS JOBIM" tem 159,1 px e não cabe numa linha em nenhuma das duas larguras; "ANTONIO CARLOS" tem 112 px e "ELIS REGINA &" tem 93,6 px. O nome mais longo do catálogo, "ELIS REGINA & ANTONIO CARLOS JOBIM" (34 caracteres), ocupa 3 linhas: ELIS REGINA & / ANTONIO CARLOS / JOBIM;
     - a v5.1 previa 2 linhas com 164 px úteis, conta que só valia com padding zero;
   - **título:** Gabarito 500 16 px, 2 linhas;
   - **edição:** mono 13 px `--tinta-suave`, "POLYSOM 2020 · LACRADO";
   - **preço:** "R$ 289,00" em Gabarito 700 18 px, ou "SOB CONSULTA" em mono. **Sempre visível, inclusive no esgotado**;
   - **estado em texto:**
     - esgotado: "ESGOTADO · SOLICITE" em vermelho, como texto e não pílula cheia, para 51 esgotados não virarem um mar vermelho;
     - encomenda: pílula amarela "SOB ENCOMENDA";
     - disponível: "DISPONÍVEL";
   - **botão de largura total, 44 px** (`button.card__add`, gancho do CONTRATO):
     - disponível: "Adicionar ao carrinho", fundo `--tinta`;
     - esgotado: "+ Solicitar", com contorno de 2 px;
     - encomenda: "+ Encomendar";
     - **sem logo do WhatsApp**;
   - capa e título levam à ficha; o botão é um alvo separado.
10. **Parede** (`?vista=parede`, `.parede`):
    - só capas, sem espaço entre elas, com 3, 6 e 8 colunas (0, 768 e 1280 px), ponto vermelho no esgotado e `aria-label="Artista – Título (Esgotado)"`;
    - **carrega no máximo 18 capas por vez:** renderiza 18 e acrescenta o próximo bloco de 18 quando um sentinela no fim entra na tela. Com 3 colunas de 130 px e o limiar de lazy-load do Chromium em 4G (1.250 px), renderizar tudo baixaria 40 capas ou mais ao abrir (~4 MB com a mediana medida). As URLs são assinadas e não dá para pedir um tamanho menor;
    - com a vista na URL, o `medir.mjs` consegue medi-la (aceite do T14);
    - é a vista feita para print, **se o T0b liberar** o uso de capas em print.
11. **Carregar mais:** botão de contorno e largura total, "Carregar mais 30 · 21 restantes". Grava `?ate=60` com `replaceState`, junto dos filtros, e restaura a rolagem no Voltar.
12. **Filtro, ordem e troca de vista:** `document.startViewTransition(render)`.
    - **Nomes `vt-<id>` só durante a transição.** O IntersectionObserver mantém a lista dos cards visíveis, mas o nome só é aplicado imediatamente antes de `startViewTransition` e é retirado em `transition.finished`. Fora da transição, nenhum card tem nome. Um nome que sobrasse entraria como grupo próprio no snapshot da transição entre páginas, e cada capa visível sairia por cima da página nova. O `pageswap` tira qualquer `vt-*` que tenha sobrado (momento 4).
    - O callback é síncrono, sobre o JSON já carregado, e dura 240 ms.
    - Guarda `if(!document.startViewTransition) render()`; com reduced-motion, chama `render()` direto.
13. **Zero resultados:** tira rosa "NÃO TÁ AQUI? EU ENCONTRO." e botão verde "Pedir “{busca}” no WhatsApp".
14. **Dock.**

**Desktop.** Os filtros viram uma coluna lateral fixa nas colunas 1–3 do grid (226 px a 1024, 312 px a 1320). A grade ocupa as colunas 4–12 (984 px a 1320, o que dá 3 colunas de card).

**O que muda em relação ao v4.**
- A paginação numerada vira "Carregar mais".
- As badges sobre a capa viram estado em texto mais um ponto vermelho.
- A busca passa a achar OD e catno e a tolerar erro de digitação.
- Os filtros viram folha com pílulas.
- A Parede é nova.
- O card perde o raio de 12 px e a sombra.
- Os dados passam de 49 KB gz para um índice de ~8,5 KB gz.
- `?secao=` passa a levar o slug, e o nome antigo continua aceito.

### disco.html

**Celular.**

1. **Trilha mono:** "CATÁLOGO / BRASIL / OD-001", com links.
2. **Palco** (`.palco[data-secao]`):
   - faixa de largura total no papel da seção, com grão atrás do conteúdo (e meio-tom vermelho na seção Brasil: pontos `#9A1B14` de 3 px a cada 8 px, ver **Textura**), padding 24/16 e `overflow:hidden; overflow:clip`;
   - capa a 80% da largura com borda de 2 px: `<img id="capa">` no HTML, sem `lazy`, com o script inline e o `rel=expect` do momento 4;
   - vinil em CSS saindo 24% pela direita, com o selo "INDÚSTRIA BRASILEIRA";
   - reflexo do lacre;
   - carimbo ESGOTADO (`.carimbo`) no canto inferior esquerdo, em `--carimbo` (`#C8231A` nos dois temas) sobre fundo `rgb(255 255 255/.92)`: 4,97 a 5,44:1. **Só aqui**;
   - botão "Compartilhar" de 44 px no canto: Web Share API; sem ela, o link `wa.me/?text=<url>` "Enviar no WhatsApp". O texto compartilhado é "Artista – Título · OD-001 · <url>" (ver **Preview de link**).
3. **Linha técnica em mono 13 px:** "OD-001 · LP · POLYSOM 2020 · 33057-1 · LACRADO".
4. **H1:** o artista em display `--t-disco`, caixa alta, com link para a busca, e o título em Gabarito 600 `--t-titulo-ficha`.
5. **Bloco de compra** (`.bloco-compra`): superfície, borda de 2 px, padding de 16 px.
   - **Preço sempre:** "R$ 289,00" em Gabarito 700 32 px, ou "SOB CONSULTA" em mono 18 px.
   - **Disponível:** a frase "Disponível · lacrado"; o CTA principal "Adicionar ao carrinho" (`--tinta`, 56 px, sombra) e o botão "Pedir só este no WhatsApp" (verde, 56 px, texto `--tinta`; glifo de 20 px se o T11 liberar).
   - **Esgotado:**
     - a frase "Esgotado: eu encomendo pra você. Prazo e valor confirmados no WhatsApp." Se o dono preencher `config.PRAZO_ENCOMENDA`, entra também "costuma levar X".
     - O CTA principal (`.cta-solicitar`) é verde, de 56 px, com o texto exato **"Esgotado? Solicite o seu aqui agora mesmo!"**, em Gabarito 700 17 px, sem caixa alta, com sombra `--tinta` e o glifo oficial (se o T11 liberar; senão, só texto).
     - Abaixo, o secundário "+ Incluir no carrinho" (contorno), com a legenda mono "JUNTA VÁRIAS SOLICITAÇÕES NUMA MENSAGEM SÓ".
   - **Encomenda:** "Sob encomenda? Solicite o seu aqui agora mesmo!", com a mesma lógica.
   - **Colado aos botões:**
     - "Envio pelos Correios para todo o Brasil · frete pelo CEP no WhatsApp · atendimento humano". Com `RESPOSTA_HORAS` preenchido, entra ", respondo em até X h";
     - a linha `[data-pagamento]` "Pagamento: {config.PAGAMENTO}, combinado no WhatsApp" (art. 2º do Decreto 7.962);
     - os links "Trocas e arrependimento (7 dias)" e "Prazos e frete", que levam a `como-funciona.html#trocas` e `#prazos`.
6. **Barra de compra fixa** (`.barra-compra`):
   - **Quando aparece.** Sempre que o bloco 5 **não** está na tela, antes ou depois dele, controlada por IntersectionObserver.
   - **Por quê.** Estimativa a 390 px: header 56 + navegação 40 + trilha + palco (24 + 312 + 24) + linha técnica + artista de 40 px (2 linhas em nomes longos) + título. O CTA começa por volta de 730 px, abaixo da área visível real (~664 px). Se a barra só aparecesse depois de rolar além do bloco 5, quem chega não veria nenhum CTA.
   - **Forma.** 12 px de margem, 64 px de altura, superfície com borda de 2 px, `z-index:20`.
   - **Conteúdo.** Mini-capa de 40 px, "OD-001", o preço ou "ESGOTADO" e o botão do estado: verde **"Solicitar no WhatsApp"**, ou `--tinta` "Adicionar ao carrinho". A 360 px, o código OD sai da barra e o estado fica [J].
   - **Espaço no fim da página.** `body:has(.barra-compra){padding-bottom:calc(88px + env(safe-area-inset-bottom))}`, ou seja, 64 de barra, 12 de margem e 12 de folga. Assim a barra nunca cobre o bloco legal do rodapé.
   - Entra e sai conforme **Movimento**.
   - Substitui a dock nesta página.
7. **"Por que eu gosto":** o campo `comentario`, que existe em 3 de 51 discos hoje, em Gabarito 500 22 px com aspas em display vermelho de 80 px. A seção some quando o campo é nulo.
8. **A edição:** duas fileiras de caixas (2×2 no celular, 4 em linha no desktop), com o valor em display 28 px e o rótulo em mono 13 px.
   - **"À venda · ● É esta que você recebe":** fundo superfície, borda sólida. ANO 2020 · SELO Polysom · PAÍS BR · CAT. 33057-1.
   - **"Original (referência)":** fundo transparente, borda tracejada de 2 px. 1976 · Philips · BR · 6349 187.
   - Fecha com "Você recebe a edição à venda; o original é referência histórica." e a atribuição "Data provided by Discogs.". A atribuição é um link sem `nofollow` para `edicaoVenda.discogsUrl`, e é o antigo "Ver no Discogs".
9. **Faixas** (`.faixas`):
   - **Agrupamento:** o lado sai de `pos` com `/^\d*([A-Z])/i`, e cada lado vira um grupo `[data-lado]` de "LADO A" a "LADO F". Sem letra, há um grupo só, "FAIXAS". Medido: 16 dos 51 discos são 2LP ou 3LP com lados de C a F. O 242785, um dos discos do carrinho de demonstração, usa `pos` "1A", com o dígito antes da letra;
   - **linhas de 48 px:** posição em mono vermelho, título em Gabarito, duração em mono à direita, régua tracejada `--concreto`.
10. **Ouvir:** cada vídeo vira a linha "▸ Ouvir, {faixa}", com o triângulo em CSS e sem miniatura. O iframe `youtube-nocookie` só carrega no clique, como hoje.
11. **"Mais de Brasil":** 4 cards da mesma seção, com os disponíveis primeiro quando o disco aberto está esgotado.
12. **Disco não encontrado** (`.nao-encontrado`). É o que acontece quando `window.__disco` resolve `null`. Isso ocorre com um id inexistente ou com um disco que o T2 marcou como `removido`, mas cujo link continua no Instagram. A v4 já mostra "Disco não encontrado" (`pagina-disco.js:44`, R15).
    - **O que sai da tela.** O script inline não preenche o `src`. O `pagina-disco.js` esconde o palco (`hidden`) e não cria a barra de compra nem o carimbo, então o `#capa` vazio de 600×600 nunca fica na tela.
    - **O que entra no lugar do bloco de compra.**
      - O `<title>` vira "Disco não encontrado | Originária Discos".
      - "Disco não encontrado" em display, seguido da frase "Esse disco saiu do catálogo ou o link está errado."
      - O botão verde "Pedir no WhatsApp", via `linkProcuraGenerica` com "Procuro o disco do link …?id=<id>".
      - 4 cards de "Novidades": sem o disco, a seção é desconhecida, então "Mais de" vira "Novidades".
    - **O `rel=expect` não atrapalha.** O `#capa` está no HTML, então a pintura só espera o parse. Vindo de um card com `od.capa` (índice velho em cache), a capa transiciona e o palco some em seguida [J: raro e aceitável].

**Dados.** A ficha lê `data/discos/<id>.json` (no máximo 3 KB gz; o maior hoje tem 2.694 B). Quem pede é o script inline, e o `pagina-disco.js` reaproveita a mesma promessa. O link direto que vem do Instagram deixa de baixar o catálogo inteiro. O "Mais de" usa o `indice.json`, que só é baixado quando a seção chega a uma tela de distância (ver **Dados por página**).

**Desktop.** O palco fica sticky nas colunas 1–6 (`top: 80px`) e as informações nas colunas 7–12. As faixas aparecem em colunas por disco: A | B, depois C | D, depois E | F.

**O que muda em relação ao v4.**
- A capa passa a existir no HTML, com meta de LCP de 2,44 s para ≤ 2,3 s, com e sem `od.capa`.
- O texto do CTA verde passa a ser tinta.
- Entram o carimbo, a tabela "À venda × Original", a barra fixa, o compartilhar, os lados de A a F, a linha de pagamento, o JSON por disco e o estado "Disco não encontrado" sem palco nem barra.

### carrinho.html

**Celular** (sem letreiro e sem dock).

1. "SEU CARRINHO" em display e a linha mono "3 DISCOS · 2 SOLICITAÇÕES".
2. **Itens**, separados por régua tracejada de 2 px `--concreto`:
   - mini-capa de 72 px com borda de 2 px;
   - "OD-001" em mono vermelho, artista em display 18 px, título em Gabarito 600 16 px, edição em mono 13 px;
   - pílula "SOLICITAÇÃO" (contorno vermelho) quando o item está esgotado ou sob encomenda;
   - stepper "− n +" com botões de 44×44 e borda de 2 px, limite de 1 a 9 como hoje;
   - subtotal em Gabarito 700, ou "a combinar";
   - "Remover" como link de texto.

   Abaixo da lista fica o link de texto "Esvaziar carrinho" (`[data-esvaziar]`, com o `confirm` nativo, como no CONTRATO).
3. **Totalizador:** superfície com borda de 2 px.
   - Linhas "Subtotal", "Frete: calculado pelo CEP no WhatsApp" e `[data-pagamento]` "Pagamento: {config.PAGAMENTO}".
   - TOTAL em Gabarito 700 28 px: "R$ 480,00", ou "R$ 480,00 + 2 a combinar" (via `formatarTotal`).
4. **Observação:** `<textarea>` de 4 linhas, borda de 2 px, 16 px, com o rótulo "Observação (CEP, preferências, prazo)".
5. **Comanda** (`#comanda.comanda`), visível por padrão:
   - legenda mono "É ISSO QUE VAI NO SEU WHATSAPP";
   - cartão em papel `#F4EFE6` **fixo nos dois temas** (objeto impresso, com as tintas fixas de **Identidade**), **sem grão**, com bordas picotadas (`mask` com `radial-gradient` é APOSTA; fallback em borda tracejada de 2 px);
   - `<pre>` em Courier 13 px com `pre-wrap`, contendo **o texto exato** de `mensagemPedido`, atualizado enquanto a pessoa digita a observação;
   - cumpre o sumário pedido pelo art. 4º do Decreto 7.962.
   - Formato novo da mensagem:

     ```
     Olá! Quero fazer um pedido na Originária Discos:

     Solicito (esgotados/encomenda):
     1. OD-001 · Jorge Ben – África Brasil (1976) · Vinil LP · Polysom 2020 · 33057-1 · Sob consulta
        discogs.com/release/15793439

     Total: …
     Frete: a combinar (CEP: ____)
     Observação: …

     Pode me passar disponibilidade, prazo e valor?
     ```

     Itens disponíveis entram num bloco "Quero (disponíveis):" antes deste.
6. **Faixa de confiança em mono:** "SEM CADASTRO · SEM CARTÃO NO SITE · ATENDIMENTO HUMANO".
7. **CTA "Pedir pelo WhatsApp"** (`#btn-pedir`, gancho do CONTRATO): verde, 60 px, Gabarito 700 18 px com texto `--tinta` (e glifo de 22 px, se o T11 liberar), sombra sólida e 16 px de respiro lateral.
   - **No celular**, uma cópia fixa (`.cta-fixo`, `z-index:20`) fica na base, com 12 px de margem, enquanto o CTA original está fora da tela. A entrada e a saída seguem **Movimento**.
   - **Espaço no fim da página.** `body:has(.cta-fixo){padding-bottom:calc(88px + env(safe-area-inset-bottom))}`, ou seja, 60 de botão, 12 de margem e 16 de folga, para não cobrir o bloco legal do rodapé.
8. **Depois do clique:** momento 6. O carrinho é mantido.
9. **Carrinho vazio:** tira rosa "CARRINHO VAZIO.", o botão "Ver catálogo" e o link "Procurando um disco? Peça no WhatsApp".

**Desktop.** Itens nas colunas 1–7; totalizador, observação, comanda e CTA nas colunas 8–12, em sticky.

**O que muda em relação ao v4.**
- A comanda fica visível.
- A mensagem ganha o código OD e os grupos Quero/Solicito.
- O CTA verde passa a ter texto tinta.
- Entram o "Copiar pedido" e a linha de pagamento.
- O preço ganha centavos, se o dono aprovar.

### como-funciona.html (nova, T9b)

Página estática, sem letreiro e sem dock, com o mesmo header e o mesmo rodapé. Tem uma seção por âncora:
- `#como-funciona`: os 4 passos;
- `#pagamento`: formas aceitas (`config.PAGAMENTO`). O art. 2º exige isso, e o concorrente brasileiro mostra Pix junto do preço;
- `#prazos`: Correios, frete pelo CEP e prazo (`config.PRAZOS_FRETE`);
- `#trocas`: arrependimento em 7 dias e como exercer pelo mesmo canal, como pede o art. 5º (`config.TROCAS`);
- `#identificacao`: os mesmos dados do rodapé.

Todo texto vem do `config.js` e é escrito pelo dono.

### Dados por página

| Página | Baixa no caminho crítico | Baixa depois do load | Para quê |
| --- | --- | --- | --- |
| index | `home.json` (≤ 4 KB gz) | `indice.json`, **só** com carrinho não vazio | Preço dos itens do carrinho na dock |
| catálogo | `indice.json` | — | Grade, busca, filtros e dock |
| disco | `discos/<id>.json`, pelo script inline (`window.__disco`) | `indice.json`, quando "Mais de" chega a uma tela de distância | "Mais de {seção}", ou "Novidades" no disco não encontrado |
| carrinho | `indice.json` | — | Itens, totais e comanda |
| como-funciona | nada | — | Texto estático |

Esquema do `home.json`, que somou 2.878 B em gzip -9 com os dados de hoje (afirmação D7):

```
{
  "geradoEm": "2026-10-01T…Z",
  "destaques":  [<card> × 3],    // os 3 com `destaque`; sem eles, os 3 mais recentes por adicionadoEm (CONTRATO)
  "novidades":  [<card> × 12],   // regra do CONTRATO: novo, depois adicionadoEm desc, depois ordem
  "secoes":     [{ "slug": "brasil", "nome": "Brasil", "contagem": 10, "capas": [url, url, url] } × 7]
                // por contagem desc; as 3 capas preferem as que já estão em destaques e novidades (D9)
}
<card> = { id, codigo, artista, titulo, ano, formatoTipo, formatoLabel, edicaoLinha, capa, status, preco, secao, secaoSlug, novo }
// edicaoLinha = "Polysom 2020" (selo + ano de edicaoVenda); null sem edicaoVenda
// slug/secaoSlug = slug(secao): NFD, sem acento, minúsculas, " / " e espaços viram "-" (D8)
```

---

## Stack

| Item | Licença | Peso | Como carrega | Suporte (veredito da pesquisa) | Fallback |
| --- | --- | --- | --- | --- | --- |
| HTML + CSS + ES modules atuais, sem build | — | JS próprio novo ≤ 6 KB gz por página; CSS de 5.128 B gz para ≤ 10 KB gz | Como hoje (`type=module`) | — | — |
| Big Shoulders 900 | OFL 1.1 | 13.712 B | Copiada para `fonts/` com o OFL.txt; preload só no index (tag literal no T7) | woff2 e fontes variáveis: 96,54%, **confirmado** | `Display Fallback` |
| Gabarito VF | OFL 1.1 | 34.320 B | `fonts/`, swap | **confirmado** | system-ui, Roboto, Arial |
| Courier Prime 400 | OFL 1.1 | 11.192 B | `fonts/`, swap | — | ui-monospace, Courier New |
| `size-adjust` no fallback | — | 0 | CSS | **APOSTA** (não verificado; o T7 mede com a fonte bloqueada) | Largura muda dentro da linha fixa; CLS medido no gate |
| Container queries, `cqi` e `:has()` | — | 0 | CSS | widely, **confirmado** | — |
| `overflow: clip` | — | 0 | CSS, sempre depois de `overflow:hidden` | **APOSTA**: sem veredito na pesquisa; o Safari abaixo da 16 não tem | `overflow:hidden` |
| `text-wrap: balance` | — | 0 | CSS | newly, 87,92%, **confirmado** | Quebra normal |
| `-webkit-text-stroke` (vazado) | — | 0 | CSS em `@supports` | 97,03%, só com o prefixo, **confirmado** | Número sólido |
| Popover + `@starting-style` + `allow-discrete` | — | ~30 linhas de JS (pushState, popstate com replaceState, toggle e contagem) | HTML e CSS | newly (2025-01 / 2024-08), **confirmado** | Painel em linha; aparece sem animar |
| View Transitions no mesmo documento | — | ~0,3 KB | Envolve o `render()` do catálogo; nomes `vt-*` só durante a transição | newly desde 2025-10-14, **confirmado** | `render()` direto |
| View Transitions entre páginas + `rel=expect` | — | ~0,6 KB | CSS + script inline em `disco.html` | limited: Chrome/Android 126+, Safari/iOS 18.2+, 85,97%; sem Firefox; Samsung diverge, **confirmado** | Navegação normal |
| Speculation Rules (prerender `moderate` do card para a ficha) | — | ~0,2 KB inline | T22, depois do T15 e com medição própria (dados gastos e transições que escapam do timeout de ~4 s) | **Refutado** na forma original. Na correção da pesquisa: prerender completo no Chrome/Android 109+ (desde o 105/103 com restrições), o que cobre ~80% do mobile no Brasil; Safari 26.2 só tem prefetch, atrás de flag, e nenhum prerender; Firefox não tem. O Chrome desliga com Save-Data, pouca memória ou economia de energia. A pesquisa de viabilidade recomenda usar para escapar do timeout da VT | Navegação normal |
| Animações guiadas por rolagem | — | 0 | CSS em `@supports` | limited: Chrome 115+, Safari 26+; sem Firefox, **confirmado** | Estático (estado-base = final) |
| Web Share API | — | ~0,3 KB | Ficha | 89,7%, **confirmado** | Link `wa.me/?text=` |
| IntersectionObserver | — | ~0,3 KB | Barra fixa, CTA fixo, lista de cards visíveis para a VT, sentinela da Parede, "Mais de" | widely (Baseline), **confirmado** (W9) | Barra sempre visível |
| Grão feTurbulence em data URI | — | ~0,4 KB | CSS (valores em **Textura**) | **APOSTA.** A pesquisa mediu outra configuração: overlay `fixed`, raster em CPU no Linux, emulando 412×915, e o número só serve para comparar variantes entre si. O `::after` por seção, que rola com o conteúdo, não foi medido, e a GPU no Android é **incerta**. O T18 mede num Android real com e sem `--grao-opacidade:0` | `--grao-opacidade: 0` |
| `scroll-snap`, `line-clamp`, `mask` radial | — | 0 | CSS | **APOSTA** | Rolagem livre; `max-height`; borda tracejada |
| Clipboard API | — | ~0,2 KB | Carrinho | **APOSTA** | Seleciona o `<pre>` |
| Dados gerados no Actions: `data/codigos.json` (persistente a partir do T3), `indice.json`, `home.json`, `discos/<id>.json` | — | Índice 8.547 B gz (com `secaoSlug`); `home.json` 2.878 B gz; maior disco 2.694 B gz | `fetch` do JSON certo em cada página (**Dados por página**) | — | O `catalogo.json` continua sendo gerado |
| Só para desenvolvimento: `scripts/{cdp,medir,avaliar,servir,contraste,prints}.mjs`, `scripts/larguras.html` + axe-core 4.13.0 | MPL-2.0 (axe) | Fica fora do artefato do Pages a partir do T3. Hoje `scripts/`, `tests/` e `CONTRATO.md` respondem 200, porque o upload usa `path: .` | O `avaliar.mjs` injeta o axe vindo do jsDelivr | — | — |

**Fora da stack**, nenhum dos itens abaixo é carregado:

| Item | Motivo |
| --- | --- |
| GSAP 3.15 | Licença proprietária "Standard 'no charge'" e 28–47 KB gz para o que o CSS nativo já faz |
| Lenis | Não suaviza o toque (confirmado), então não muda nada no Android |
| Motion | 46–51 KB gz sem bundler |
| three.js, OGL, Rive | 38–460 KB gz, e as capas do Discogs não mandam CORS (medido): sem textura WebGL nem canvas |
| Barba | @barba/core 2.10.3 é MIT, mas pesa 10 KB gz para a transição entre páginas, que o `@view-transition` nativo já faz com 0 KB. E intercepta a navegação, o que tira o site do modelo de páginas independentes que o bfcache e o link direto do Instagram esperam [J] |
| Basecoat / shadcn | É o próprio visual "Vercel" que se quer deixar |
| Fontshare | A proibição de subset, conversão e distribuição por repositório público vale só para as fontes "Closed Source" (ITF FFL v2.0); as "Open Source" seguem a OFL. Nenhuma delas foi comparada às escolhidas, e as três OFL do Google Fonts já resolvem os papéis [J] |
| Fonte Fidalga | Sem algarismos e sem licença no zip |
| `backdrop-filter`, `js/intro.js`, CDN do Google Fonts | Saem do site |

---

## Orçamento de performance e acessibilidade

### Linha de base

Medida em 01/10/2026 com `scripts/medir.mjs`, no perfil da pesquisa: Slow 4G (150 ms de RTT, 1,6 Mbps), CPU 4×, 412×915 @2,625, cache frio, contexto novo por execução, mediana de 3.

| Página | LCP | Elemento | CLS | Origens |
| --- | --- | --- | --- | --- |
| index (Pages) | 4,80 s | IMG | 0 | github.io, fonts.googleapis, fonts.gstatic, i.discogs |
| index (local, `servir.mjs`) | 4,71 s | IMG | 0 | idem |
| disco `?id=726944` (Pages / local) | 2,44 s / 2,39 s | IMG | 0,035 | + i.ytimg.com |
| catálogo (Pages) | 0,54 s | H1 | 0,002 | — |
| carrinho (local) | 0,48 s | H1 | 0,016 | — |
| axe wcag2a/aa, home ao vivo | `["color-contrast:2"]` | | | |

Primeira vista (n = 1, `medir.mjs` v5.1):
- home ao vivo: 1.043.013 B no total, 121.244 B fora do `i.discogs.com` (inclui 48 KB do Inter e ~52 KB do `catalogo.json`) e 9 capas;
- ficha ao vivo: 238.812 B fora do `i.discogs.com` (inclui o `catalogo.json` e as miniaturas do `i.ytimg.com`) e 1 capa.

Rolagem completa (n = 1, `medir.mjs --rolar` v5.2):
- home ao vivo: 1.829.049 B no total, 121.214 B fora do `i.discogs.com` e 18 capas (M8).

Ressalva sobre o catálogo: as capas da 1ª linha estão inteiras na tela (topo a 654 px em 390×844) e carregam, mas não viraram LCP. A causa não foi apurada [J]. O T0 precisa explicar isso antes de usar "elemento" como gate no catálogo.

### Metas

São gates de PR: medidos no `servir.mjs` local antes do merge e no Pages depois.

| Página | LCP | Elemento | CLS | Outros |
| --- | --- | --- | --- | --- |
| index | **≤ 2,0 s** | `H1` | ≤ 0,05 | Origens = {site, i.discogs.com} |
| catálogo | ≤ 2,5 s | — | ≤ 0,05 | Maior long task ao filtrar ≤ 100 ms com CPU 4× (proxy de INP ≤ 200 ms) |
| disco (link direto) | **≤ 2,3 s**, com e sem `od.capa` no `sessionStorage` | `IMG#capa` | ≤ 0,05 | — |
| carrinho | ≤ 2,0 s | — | ≤ 0,05 | — |

Regra de regressão: nenhum PR pode piorar em mais de 0,2 s o LCP de uma página que não era o alvo dele. A regra não vale para o crescimento do catálogo: o commit do build automático que só acrescenta discos não é PR de código. Quem segura o índice é o gate por disco e a paginação (abaixo).

### Bytes por página e primeira vista

- HTML ≤ 12 KB gz.
- CSS único ≤ 10 KB gz (hoje 5.128 B).
- Fontes: 59.224 B no total. No caminho crítico entra só a Big Shoulders (13.712 B, com preload) e só no index (motivo em **Tipografia**). Nenhuma página com LCP de imagem faz preload de fonte.
- JS: zero de terceiros; o JS próprio novo fica em ≤ 6 KB gz por página.
- Dados:
  - `home.json` ≤ 4 KB gz;
  - `indice.json` ≤ 10 KB gz com 51 discos (8.547 B medidos com o `secaoSlug`, D4) **e ≤ 200 B gz por disco** (hoje 167,6). Ele fica **fora** do `bytes_site`, que mede só o que não cresce com o catálogo, e o `medir.mjs` o reporta à parte em `bytes_indice`;
  - quando o índice passar de 40 KB gz (~240 discos com a taxa de hoje [J]), paginar o índice;
  - `discos/<id>.json` ≤ 3 KB gz.
  - **Por que o índice saiu do `bytes_site`.** O checker mediu 17.212 B em gzip -9 para HTML, CSS, JS e SVG do catálogo de hoje. Somando fontes (59.224), JS novo (≤ 6 KB), CSS até 10 KB e cabeçalhos, o catálogo v5 fica em ~87–97 KB sem o índice [J]. Com o índice dentro, ele já chegava perto de 95–105 KB com 51 discos e crescia ~8,5 KB a cada 50 discos. O gate quebraria muito antes da paginação.
- Imagens:
  - index: no máximo 2 capas `eager`, nenhuma com `fetchpriority`;
  - catálogo: 2 `eager`, só a 1ª com `high`;
  - ficha: 1 `eager` com `high`;
  - todo o resto `lazy`, com `width/height=600`, `aspect-ratio:1` e `object-fit:cover`;
  - o leque de Coleções não existe abaixo de 1024 px (index, 02 COLEÇÕES).
- **Primeira vista.** São os bytes transferidos (soma de `encodedDataLength`) desde a navegação até o load mais 2 s de rede parada, no perfil lento. É o mesmo ponto de corte do `ir()` do `cdp.mjs`. O `medir.mjs` devolve:
  - `bytes`: o total;
  - `bytes_site`: tudo menos `i.discogs.com` e `data/indice.json`;
  - `bytes_indice`: só o `data/indice.json`;
  - `capas`: pedidos a `i.discogs.com`.
- **Rolagem completa (`--rolar`).** Depois da primeira vista, a página desce meia tela a cada 400 ms até o fim. Em seguida espera mais 2 s de rede parada, e os mesmos campos passam a somar tudo.
- **Por que o orçamento antigo saiu.** O "≤ 350 KB" anterior estourava por construção. As 51 capas têm de 31.695 a 210.431 B, com mediana de 98.232 B (a pesquisa amostrou 8 e viu de 61 a 216 KB). Só as 2 capas `eager` do index podem passar de 400 KB. As URLs são assinadas e não dá para pedir um tamanho menor. Por isso o gate separa o que é nosso do que vem do Discogs:

| Página | `bytes_site` | `capas` | Total esperado com a mediana medida |
| --- | --- | --- | --- |
| index | ≤ 100 KB [J] (v4 ao vivo: 121.244 B) | ≤ 9 (v4 ao vivo: 9) | ~1,0 MB |
| index, rolagem completa (`--rolar`, 412 px) | ≤ 100 KB [J] | ≤ 15: 3 destaques + 12 novidades, sem leque (v4 ao vivo: 18, M8) | ~1,5 MB (v4 ao vivo: 1.829.049 B) |
| catálogo, Grade | ≤ 100 KB [J] | ≤ 10 [J: 2 colunas de cards de ~370 px dentro do limiar de 1.250 px] | ~1,1 MB |
| catálogo, Parede (`?vista=parede`) | ≤ 100 KB [J] | ≤ 18 (o bloco renderizado) | ~1,9 MB |
| disco | ≤ 100 KB [J] (v4 ao vivo: 238.812 B) | ≤ 5 | ~0,6 MB |
| carrinho | ≤ 100 KB [J] | ≤ nº de itens | — |

No desktop (≥ 1024 px), a rolagem completa da home soma as 9 capas novas do leque (D9): 24 capas, ~2,4 MB. O `medir.mjs` roda em 412 px e não mede esse caso [J].

Capas próprias em WebP de 300–600 px (8–19 KB cada, medido pela pesquisa) cortariam o total em ~85%. Só entram se o T0b decidir por fotos próprias.

### Movimento

- Só `transform` e `opacity`.
- No máximo 1 animação infinita visível, o letreiro, que tem pausa.
- Grão estático; skeleton estático em `--concreto` (o pulsar do v4 sai).
- Nada de `backdrop-filter`, vídeo, WebGL ou preloader.

| Movimento | Duração e easing | Estado estático (sem suporte ou com reduced-motion) |
| --- | --- | --- |
| Volta do "O" do poema (momento 1) | 900 ms `cubic-bezier(.2,.7,.2,1)`, 1× por sessão | Disco parado |
| Vinil do card no hover ou foco (desktop) | 240 ms `ease-out` | Posição final, sem transição |
| Vinil e reflexo da ficha | 600 ms + 600 ms | Vinil a 24%, reflexo parado e fraco (`opacity:.5` em `translateX(-30%)`) |
| Botão "Adicionado", contador, carimbo "NO CARRINHO" | Texto por 1,5 s; contador em 200 ms; carimbo entra em 180 ms, fica 1,5 s e sai em 160 ms `ease-in` | Texto troca; contador e carimbo só com `opacity` (120 ms na entrada, 160 ms na saída) |
| Dock (1ª vez) | 220 ms, `translateY` de 110% a 0 | `opacity` de 120 ms |
| Barra de compra (ficha) e CTA fixo (carrinho) | Entram em 200 ms `cubic-bezier(.2,.7,.2,1)` de `translateY(calc(100% + 12px))` a 0; saem em 160 ms `ease-in` | `opacity` de 120 ms |
| Folha de filtros | 200 ms `cubic-bezier(.2,.7,.2,1)`, `translateY` de 100% a 0 | `opacity` de 120 ms |
| Tira de Coleções no hover ou foco (desktop) | 200 ms `ease-out`: rotação de ±0,6° a 0, e as mini-capas do leque abrem para dentro da tira, com `translateX` de 0 a −24 px cada | Troca de estado sem transição |
| Rolagem da home (momento 5) | `animation-range: entry 0% cover 40%` | Estado final |
| Card → ficha (momento 4) | 320 ms na capa; 180 ms de crossfade | Navegação normal |
| Filtro, ordem e vista (VT no documento) | 240 ms | `render()` direto |
| Carimbo "PEDIDO ABERTO NO WHATSAPP" | 180 ms | Parado |
| Letreiro | 40 s por cópia, `linear`, infinito, com pausa | Parado, numa linha de 36 px com rolagem manual |

### Reduced-motion

Com `prefers-reduced-motion: reduce`:

- o letreiro para, não clona e continua numa linha de 36 px, com rolagem horizontal manual;
- `@view-transition{navigation:none}` e `startViewTransition` não é chamado;
- as animações guiadas por rolagem não se aplicam;
- vinil e reflexo ficam na posição final;
- carimbos, dock, barra de compra, CTA fixo do carrinho e folha de filtros entram só com `opacity` de 120 ms, **sempre por `transition`**, nunca por `@keyframes`;
- o `:active` do CTA principal não desce, e a sombra troca sem transição;
- a tira e o leque trocam de estado sem transição;
- o skeleton já é estático;
- o "O" não gira.

**Sem regra global.** O v4 tem `*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}` em `css/estilo.css`, linhas 1205–1213 (R12). Essa regra sai no T10. Com ela, o fade de 120 ms virava 0,01 ms e as animações continuavam disparando `animationstart`: é o `skeleton-pulsar` do M6. No lugar dela, cada componente desliga o próprio movimento com `animation:none` ou `transition-property:opacity` (bloco no T10).

**Gate.** O gate antigo, `getAnimations().filter(running)` depois de load + 2 s, era cego para as animações de duração única. A abertura (900 ms), o vinil e o reflexo (600 ms) já terminaram nesse ponto, e os momentos 3 e 6 nunca são disparados. Medido na home ao vivo com `--reduzido`: o gate antigo dá `0` (M4), mas o contador novo registra o `skeleton-pulsar` do v4 começando (M6).

O gate novo instala, pelo `antes` do `cdp.mjs` (`avaliar.mjs --movimento`), um contador de `animationstart` e `transitionrun`.
- **O que ele ignora.** `opacity`, `display`, `overlay`, `visibility` e as propriedades de cor: `color`, `background-color`, `border-*-color`, `outline-color`, `text-decoration-color`, `fill` e `stroke`. Fade, propriedade discreta e troca de cor não são movimento. Na v5.1 ele contava `visibility` e cor, e dava FAIL falso na barra de compra e no CTA fixo.
- **O que conta.** `transform`, `translate`, `box-shadow` e todo `@keyframes`. Sob reduce, nenhum componente transiciona esses.
- **Critério.** Com `--reduzido`, o contador precisa dar **zero eventos** nas 4 páginas depois de load + clique em "Adicionar" ou "+ Solicitar" + clique em "Pedir". Sem `--reduzido`, o mesmo roteiro precisa dar mais de zero, o que prova que o contador enxerga. Os comandos estão no T17.

### Contraste e acessibilidade

- **Contraste:**
  - texto normal ≥ 4,5:1;
  - texto de 24 px ou mais (ou 18,66 px em negrito) ≥ 3:1;
  - bordas de controle e foco ≥ 3:1.
- **Proibições:**
  - branco sobre verde (1,98), inclusive no glifo;
  - verde como texto (1,73);
  - `--vermelho-cartaz` abaixo de 24 px;
  - `#C8231A` sobre a faixa preta (3,34; usar `#FF5A47`);
  - `#C8231A` como texto pequeno sobre papel de seção ou amarelo (2,56 a 3,44; nos impressos vale `#761210`);
  - `#FF5A47` no carimbo (2,71 a 2,97 sobre o fundo `.92`) e na comanda (2,69);
  - `#ABA59B` e `#58534B` como texto sobre objeto impresso (1,35 a 4,27);
  - `#F6C324` como foco, ou `#F4EFE6` como borda, sobre objeto impresso (1,00 a 1,44);
  - `#0F0E0D`, que é `var(--papel)` no escuro, como texto sobre o vermelho do Brasil (3,41).
- **Gates de contraste:**
  - `tests/contraste.test.mjs` com as tabelas de **Identidade**, incluindo os pares proibidos como casos que têm de reprovar. Os pares novos são:
    - foco e borda `#111` sobre os 7 papéis e o amarelo;
    - `#111` e `#761210` como texto sobre os 6 papéis claros, o amarelo, o creme e o branco;
    - `#F4EFE6` sobre o papel do Brasil e sobre o ponto do meio-tom;
    - carimbo `#C8231A` sobre o fundo composto;
    - chip Brasil `#F4EFE6` sobre `#C8231A`;
    - glifo `#111` sobre o verde;
  - axe devolvendo `[]` nas páginas × 2 temas;
  - **o axe não testa foco nem contraste não textual**, por isso o T10 tem um aceite próprio, que foca cada controle dos objetos impressos com `--escuro` e compara `outline-color` e `border-color` com o fundo (≥ 3:1).
- **Alvos de toque:** ≥ 44×44. A exceção documentada é a pausa do letreiro, com 36×36, acima dos 24×24 da WCAG 2.5.8.
- **Foco visível:** 3 px em `--foco-cor`. Nos objetos impressos, ele é `#111` nos dois temas, com contorno interno na tira.
- **Tamanhos mínimos:** mono 13 px; corpo e inputs 16 px.
- **Rolagem horizontal:** nenhuma a 360 e a 390 px (`scrollWidth === innerWidth`). O letreiro com reduced-motion rola dentro de si mesmo e não conta.
- **Esgotado:** o estado sempre aparece em texto, nunca só por cor.

---

## Como vamos visualizar antes de implementar

**Finalistas.**
- **P1:** Brasil Concreto híbrida (esta estratégia).
- **P2:** Acervo com os enxertos de conversão. Venceu a lente de conversão e ficou a 1,1 ponto na soma.

A decisão é minha, mas o dono confirma com protótipo e com gente real antes de investir cerca de 10 dias na pele. O tronco comum (T2–T9b) não depende da escolha e roda em paralelo.

**P2, tokens e tipos equivalentes aos do P1.** O P2 usa os mesmos nomes de token, com outros valores. O CSS do P2 é o do P1 com este `:root` **e com as sobrescritas listadas logo abaixo da tabela**.

| Token | Claro | Escuro | Contraste |
| --- | --- | --- | --- |
| `--papel` | `#F3EEE3` | `#0F0E0D` | tinta 16,32 · 16,67 |
| `--superficie` | `#FFFFFF` | `#1A1918` | tinta 18,88 · 15,17 |
| `--tinta` / `--sobre-tinta` | `#111111` / `#F3EEE3` | `#F3EEE3` / `#0F0E0D` | 16,32 · 16,67 |
| `--tinta-suave` | `#58534B` | `#ABA59B` | 6,59 papel · 7,89 papel / 7,18 superfície |
| `--vermelho` (acento: marca e estado) | `#AD3A16` | `#F0855F`, texto sobre ele `#0F0E0D` | 5,35 papel · 6,19 superfície · papel sobre ele 5,35 / 7,55 papel · 6,88 superfície |
| `--carimbo` | `#AD3A16` nos dois temas | — | 6,08 sobre o fundo `.92` composto no papel de seção |
| `--amarelo-lambe` (faixa "Procurando", NOVO, ENCOMENDA) | `#E8D9B5` (kraft), fixo | — | tinta 13,51 · acento 4,43 (só ≥ 24 px) · verde 1,42, por isso a borda de 2 px `#111` é obrigatória |
| `--papel-secao` (as 7 seções) | `#E9E2D3`, fixo (pela sobrescrita 1) | — | tinta 14,64 · acento 4,80. A cor da seção fica só na bolinha |
| `--whatsapp` | `#25D366`, texto e glifo `#111111` | idem, texto `#0F0E0D` | 9,52 · 9,72 |
| `--faixa` / `--faixa-texto` / `--vermelho-faixa` | `#111111` / `#F3EEE3` / `#F0855F` | `#1A1918` / `#F3EEE3` / `#F0855F` | 16,32 · 7,40 / 15,17 · 6,88 |
| `--foco-cor` | `#111111` (16,32) | `#E8D9B5` (13,80 papel · 12,56 superfície) | Dentro dos impressos, `#111111` |
| `--regua`, `--concreto` | iguais aos do P1 | iguais aos do P1 | — |

**Regras do P1 que o P2 remove ou sobrescreve.** O mapa de seção do P1 é declarado no próprio elemento `[data-secao]` e vence qualquer valor do `:root`. Por isso o papel fixo do P2 não pode vir do `:root`:

1. **Papel de seção, sobrescrito.** `[data-secao]{--papel-secao:#E9E2D3}` substitui `[data-secao]{--papel-secao:var(--cor-secao)}`. O mapa `[data-secao="x"]{--cor-secao:…}` fica e pinta só a bolinha do chip.
2. **Cor de texto do Brasil, removida.** Saem `.tira[data-secao="brasil"],.palco[data-secao="brasil"]{--tinta-suave:#F4EFE6;--vermelho:#F4EFE6;color:#F4EFE6}` e a regra do chip ativo do Brasil com texto `#F4EFE6`. Sobre o kraft, `#F4EFE6` daria 1,13:1 (C11), e o axe reprovaria o gate do T1. No P2, o Brasil é kraft com texto `#111` (14,64).
3. **Meio-tom, removido.** Sai `.palco[data-secao="brasil"]::before`.
4. **Valores fixos dos objetos impressos, sobrescritos.** `--papel:#F3EEE3` e `--vermelho:#9A3313`, que dá 5,70 no papel de seção, 5,26 no kraft e 6,35 no papel (C11). O acento `#AD3A16` dá 4,43 no kraft e não serve para texto pequeno ali. `--tinta`, `--tinta-suave` e `--foco-cor` seguem em `#111`, e `--superficie` em `#FFFFFF`.
5. **Aceite que vale só no P1.** O do chip Brasil no T14 (`rgb(244, 239, 230)`). No P2, o esperado é `rgb(17, 17, 17)`.

| Papel | Família | Designer · licença | Arquivo | Bytes (medido) |
| --- | --- | --- | --- | --- |
| Display | Archivo `wdth 62 wght 800` (k do poema: os da Archivo) | Omnibus-Type · OFL | `prototipos/fonts/archivo-62-800.woff2` + `prototipos/fonts/OFL-archivo.txt` | 37.412 |
| Texto e interface | Fraunces `wght`, romana | Phaedra Charles e Flavia Zimbardi (Undercase Type) · OFL | `prototipos/fonts/fraunces-wght.woff2` + `prototipos/fonts/OFL-fraunces.txt` | 36.560 |
| Itálica (lead e "Por que eu gosto") | Fraunces `wght`, itálica, que é **outro arquivo** | idem | `prototipos/fonts/fraunces-italic-wght.woff2` | 45.624 |
| Mono | Courier Prime 400 | Alan Dague-Greene · OFL | o mesmo do P1, em `prototipos/fonts/` | 11.192 |

O P2 soma 130.788 B de fonte, 2,2× os 59.224 B do P1; sem a itálica, 85.164 B. O preload da Archivo é só no index. Se o P2 vencer, as fontes dele passam para `fonts/` no T7 da pele, com o aceite de bytes e de OFL refeito para as famílias dele.

**O que construir (T1).**

- **Páginas.** `prototipos/concreto/` e `prototipos/arquivo/`, cada uma com `index`, `catalogo`, `disco?id=726944` e `carrinho`. Todas as páginas de `prototipos/`, inclusive `comparar.html`, levam `<meta name="robots" content="noindex">`.
  - Usam **dados reais**: `../../data/catalogo.json` (ou o `indice.json` depois do T4) e as capas do Discogs, conforme a decisão do T0b.
  - Usam os CTAs reais, com o número do `config.js`. Por isso o **número real é pré-requisito do merge do T1**. No teste, a pessoa toca no CTA e não envia nada.
  - O carrinho de demonstração é semeado com `?demo=1`: discos 726944, 2968639 e 242785.
- **Fontes dos protótipos.** Ficam em `prototipos/fonts/`, nunca em `fonts/`.
  - **Conteúdo.** As 6 famílias usadas pelos protótipos: Big Shoulders, Gabarito, Courier Prime, Archivo, Anton e Fraunces. São 7 arquivos woff2, que somam 190.824 B.
  - **Licenças.** Cada família vai com seu `OFL-<família>.txt`, porque a OFL exige a licença junto de cada cópia publicada. O artefato do T3 copia `prototipos/` inteiro para o Pages.
  - **Por que fora de `fonts/`.** Assim o T1, que roda em paralelo ao tronco, não mexe nos aceites do T7 (`cat fonts/*.woff2 | wc -c → 59224` e exatamente 3 OFL em `fonts/`).
- **Parâmetros.** `?tema=claro|escuro` força `data-tema`. No P1, `?display=bigshoulders|archivo|anton` troca a fonte display e o bloco de k.
- **Comparador.** `prototipos/comparar.html` tem botões de página × tema e mostra P1 e P2 lado a lado: em cima, em iframes de 390×664 (a área visível real); embaixo, em 1440×900 reduzido a 50%.
- **Prints.** `scripts/prints.mjs` (sobre o `cdp.mjs`, com `Page.captureScreenshot`) gera 2 direções × 4 páginas × 2 telas (390×664 e 1440×900) × 2 temas, ou seja, 32 PNGs. Gera também 3 prints do index do P1, um por display, em `prototipos/prints/`. Inclui uma folha de contato `index.html` e o arquivo `medidas.json`, com a saída do `medir.mjs` para cada página de protótipo.
- **Publicação.** Um PR "protótipos" leva a pasta para o Pages: `https://l3ttn.github.io/originariadiscos/prototipos/comparar.html`. O dono abre **no próprio Android, em 4G de verdade**, que é o teste que importa. Depois da decisão, outro PR apaga `prototipos/`, fontes incluídas (é reversível).

**Critério de escolha, definido antes de ver os protótipos:**

1. **Gate técnico (eliminatório):** index com LCP ≤ 2,0 s (no P1, o elemento tem de ser `H1`), CLS ≤ 0,05 e axe `[]` nas 4 páginas × 2 temas. Vale para as duas direções, e o aceite do T1 mede as duas.
2. **Teste dos 5 segundos (eliminatório):**
   - **Quem.** **5 pessoas do público por direção, 10 no total**, cada uma **no próprio celular** (a dobra real, não a de 390×844).
   - **Uma direção por pessoa.** A 1ª recrutada vê o P1, a 2ª vê o P2, e assim por diante. Assim, nenhum teste é a segunda exposição de alguém, e o aprendizado na primeira direção não contamina a segunda.
   - **Como.** A pessoa vê a 1ª dobra da home da sua direção por 5 s e responde "O que essa loja vende? Como se compra?".
   - **Critério.** A direção passa com ≥ 4 de 5 citando vinil novo ou lacrado **e** WhatsApp.
3. **Teste do esgotado (eliminatório):**
   - **Quem e como.** As mesmas 5 pessoas de cada direção, na ficha do OD-001 da sua direção, respondem "Como você conseguiria este disco?".
   - **Critério.** A direção passa com ≥ 4 de 5 tocando num CTA verde (no bloco de compra ou na barra) em até 10 s.
   - **O que mais testa.** O risco "museu = não está à venda" do P2.
4. **Teste do print:** o dono olha os prints de 390×664 da home e da ficha e responde "eu postaria isso no story sem editar?" para cada um. Na mesma rodada escolhe a display: Big Shoulders, Archivo Cond ou Anton.
5. **Regra de decisão:** entre as direções que passam nos itens 1–3, o dono escolhe. Em empate, fica o P1, que tem a maior soma dos juízes. Se o P2 vencer, as tarefas T10–T17 trocam só tokens, tipografia e as sobrescritas listadas acima, pelas tabelas do P2. A estrutura, os componentes e o tronco continuam os mesmos.
6. **Sucesso do redesign (não eliminatório):** pedidos por semana contra a linha de base do T0c. Os gates técnicos e os testes com pessoas dizem se o site está certo; só a contagem de pedidos diz se ele vende mais.

**Custo:** P1 em 1,5 dia, P2 em 1 dia (reaproveita os componentes), comparador e prints em 0,5 dia. Total de 3,0 dias.

---

## Roteiro

**Estado de partida, medido em 01/10/2026:**
- `main` no commit `f9c5d9d`, árvore limpa, `npm test` com 192 de 192.
- O `config.js` tem o **número de WhatsApp placeholder** `5547900000000`, e ele **está no ar**: todo CTA de produção abre um número falso.
- O passo "Commita catálogo se mudou" falha em toda execução, como mostra o log da run 36933746919: `error: cannot pull with rebase: You have unstaged changes`. O build sempre suja a árvore, no mínimo pelo `geradoEm`, e o `git pull --rebase` roda antes do commit. O `continue-on-error` esconde a falha, e a main não tem nenhum commit "Atualiza catálogo (build automático)". Hoje o `adicionadoEm` de discos novos não persiste.
- O Pages publica a árvore de trabalho (`upload-pages-artifact` com `path: .`). Por isso `scripts/`, `tests/` e `CONTRATO.md` respondem 200, e um `curl` num arquivo gerado no build dá 200 mesmo sem commit.

**O que significa lançar.** Não existe lançamento separado do merge: o workflow publica a cada push na main e a cada 6 h pelo cron. **Lançar é dar merge na main.** Disso saem três regras:
- **Tronco (T0–T9b).** Cada tarefa vai direto para a main. Cada uma é segura sozinha: invisível ou uma melhora isolada.
- **Pele (T10–T17).** As tarefas abrem PR contra o branch de integração `v5-pele`, como foi feito com o `v5` no PR #6. O merge do `v5-pele` na main, no T18, é o lançamento da pele. Sem isso, o site ficaria meio v4, meio v5 por semanas.
- **Pendências do dono.** Toda pendência vira pré-requisito do merge (na main) da tarefa que a usa. Nas tarefas da pele, isso significa pré-requisito do T18.

**Regras do loop:**
- Cada tarefa em branch e worktree próprios (`wt new <tarefa>`).
- O critério de aceite abaixo é **lacrado antes de o maker existir**, e o checker roda o próprio comando antes do artefato.
- O maker não dá push. Todo PR vai para o dono, sem auto-merge, e `npm test` fica verde em todos.
- Toda tarefa da tabela **Mudanças no CONTRATO** só entra com OK escrito do dono no PR, e o aceite anexa `git diff <base> -- CONTRATO.md`. Uma tarefa que mude o CONTRATO.md sem estar na tabela é reprovada.
- O maker recebe no briefing a tabela de **Ganchos**. O aceite usa só seletores dela.
- T10–T17 tocam o mesmo `css/estilo.css`: rodar em sequência, com blocos marcados `/* == página: x == */`, ou fazer rebase a cada merge no `v5-pele`.

**Pendências do dono:**

| Pendência | Bloqueia o merge de | Por quê |
| --- | --- | --- |
| Número real do WhatsApp | T1, T3, T9 | Os protótipos e os testes usam o CTA real. A trava do T3 recusa todo deploy com o placeholder. O T9 mexe num CTA que já está no ar |
| Decisão escrita sobre os termos do Discogs (T0b) | T1, T4, T20, T23 | Capas em prints e dados republicados |
| `PAGAMENTO`, `PRAZOS_FRETE`, `TROCAS` | T9b | Arts. 2º e 5º do Decreto 7.962 |
| Identificação legal (nome, CNPJ ou CPF, endereço, e-mail) | T18 (rodapé do T11) | Art. 2º |
| Validação de pessoa física ou jurídica com contador ou advogado | T18 (rodapé do T11) | Como pessoa física, o art. 2º faria o rodapé publicar CPF e endereço residencial |
| Resposta automática de confirmação no WhatsApp Business ("Recebi seu pedido…") e o compromisso de responder em até 5 dias | T18 | Art. 4º III (confirmação imediata do recebimento: o site só sabe que abriu o WhatsApp, momento 6) e art. 4º V (resposta em até 5 dias) |
| Frases do letreiro | T18 (T11) | — |
| OK em "R$ 289,00" | T6 | — |
| OK nas 7 coleções e em cada mudança do CONTRATO | A tarefa correspondente da tabela abaixo | — |
| `RESPOSTA_HORAS` e `PRAZO_ENCOMENDA` | Nenhum | Sem valor, a frase some |
| Preço e disponibilidade em alguns discos (hoje são 51 de 51 esgotados) | Nenhum | Sem preço, a ordenação por preço não aparece |

**Mudanças no CONTRATO** (cada linha precisa de OK escrito do dono no PR):

| Tarefa | O que muda no CONTRATO.md |
| --- | --- |
| T0 | §Ganchos novo (tabela abaixo) |
| T0b | §Discogs novo: decisões de uso e lugar da atribuição |
| T2 | §catalogo.json: campo `codigo`; arquivo `data/codigos.json` |
| T3 | §Deploy: commit antes do pull, sem `continue-on-error`, artefato só com o site, trava do placeholder |
| T4 | §Módulos JS: `catalogo.js` lê `indice.json`, `home.json` e `discos/<id>.json`; sai o "fetch único de `catalogo.json`"; campos `secaoSlug` e `slug` |
| T5 | §WhatsApp e §Carrinho: mensagem literal (código OD, grupos Quero/Solicito, linha de frete) |
| T6 | Preço com centavos (`R$ 220` → `R$ 220,00`) |
| T7 | §Design v4: Inter e Google Fonts → 3 fontes OFL no repo |
| T8 | §abertura sai |
| T9b | Página `como-funciona.html`, links do rodapé, linha de pagamento, `PAGAMENTO`/`PRAZOS_FRETE`/`TROCAS` |
| T10 | §Design v4 vira §Design v5: tokens, raio 0, header sólido, tema forçável; a regra global de reduced-motion sai |
| T11 | Header (abaixo de 380 px, o texto "Carrinho" fica só para leitor de tela), letreiro, rodapé com bloco legal, preview de link (og:\* de site e `img/og.png`) |
| T12 | Texto do `button.card__add` por estado ("+ Solicitar", "+ Encomendar"); as badges viram estado em texto |
| T13 | Coleções de 4 para 7; faixa "Procurando" com 2 campos; o hero vira poema e os destaques vão para a fileira; a dock leva à comanda |
| T14 | `ordem` ∈ `novos\|preco\|preco-desc\|az\|ano` (sai `destaques`); `pagina` vira `ate`; `secao` passa a levar o slug (o nome continua aceito); entra `vista=parede`; a busca acha OD e catno e tolera erro |
| T15 | CTA do disponível ("Disponível! Peça o seu pelo WhatsApp" vira "Adicionar ao carrinho" + "Pedir só este no WhatsApp"); "Ver no Discogs" sai do bloco de compra e vira o link da atribuição; estado "Disco não encontrado" sem palco nem barra |
| T16 | Total "sob consulta (N itens sem preço)" vira "a combinar"; comanda visível; estado do carrinho depois do pedido. "Esvaziar carrinho" **fica** |
| T17 | §Design: transições entre páginas e movimento |

**Ganchos.** Esta tabela vai para o CONTRATO.md §Ganchos no T0 e é lacrada junto com os aceites. São os únicos seletores que os aceites usam.

| Seletor | Elemento | Aceites |
| --- | --- | --- |
| `.btn--whatsapp` | Todo botão ou link verde que abre o WhatsApp (o `svg` dentro dele, quando existe, é o glifo) | T9, T11, T13, T15 |
| `.letreiro`, `.letreiro__trilho`, `.letreiro__copia` | Faixa, trilho animado e cada cópia do texto (as clonadas com `aria-hidden`) | T11 |
| `.letreiro button[aria-pressed]` | Pausa do letreiro | T11 |
| `header`, `[data-contador]` | Header; contador do carrinho (CONTRATO) | T11, T17 |
| `footer [data-legal]`, `footer a[href*="como-funciona.html#"]` | Bloco legal; links de política | T9b, T11, T15, T16 |
| `.poema`, `.poema span` | H1 e seus versos | T1, T7 |
| `.hero__ctas` | Os 2 CTAs do hero | T13 |
| `.destaques img` | Capas dos destaques, em ordem | T13 |
| `.colecoes a.tira[data-secao]` | Uma tira por seção | T10, T13 |
| `.faixa-procurando` | Faixa 03, com os 2 campos e o botão | T10, T13 |
| `.dock` | Dock do index e do catálogo | T13 |
| `.selo-carrinho` | Carimbo "NO CARRINHO · OD-…" (momento 3) | T13 |
| `.card`, `.card__artista`, `button.card__add` | Card (CONTRATO); nome do artista; botão por estado (CONTRATO) | T12, T14, T17 |
| `.chips [data-secao]` | Chips de seção do catálogo (`aria-pressed`, slug no atributo) | T14 |
| `[popovertarget=folha-filtros]`, `#folha-filtros`, `#folha-filtros input[type=checkbox]` | Botão "Filtros", folha e seus checkboxes | T14 |
| `.parede`, `.parede img` | Vista Parede | T14 |
| `.palco[data-secao]`, `#capa`, `.carimbo` | Palco, capa e carimbo da ficha | T10, T15 |
| `.bloco-compra`, `.cta-solicitar` | Bloco de compra; link WhatsApp da ficha (CONTRATO) | T15, T17 |
| `.barra-compra` | Barra fixa da ficha | T15 |
| `.nao-encontrado` | Bloco da ficha quando o disco não existe | T15 |
| `.faixas [data-lado]` | Grupos de faixas por lado (`data-lado` de `A` a `F`, ou `faixas`) | T15 |
| `[data-pagamento]` | Linha de pagamento na ficha e no carrinho | T9b |
| `.comanda`, `.comanda pre` | Comanda e o texto exato da mensagem | T16 |
| `#btn-pedir`, `.cta-fixo` | "Pedir pelo WhatsApp" do carrinho (CONTRATO); sua cópia fixa no celular | T16, T17 |
| `[role=status] [data-copiar]`, `[data-esvaziar]` | "Não abriu? Copiar pedido"; "Esvaziar carrinho" | T16 |
| `.intro` | Abertura do v4 (tem de sumir) | T8 |

Sessão de verificação, na raiz do repo, depois do T0:

```bash
node scripts/servir.mjs 8080 &          # site local com gzip, como o Pages
L=http://127.0.0.1:8080
A(){ node scripts/avaliar.mjs "$@"; }   # avalia expressão JS numa página (390x844 por padrão; use --tela para a dobra real)
M(){ node scripts/medir.mjs "$@"; }     # LCP/CLS/origens/bytes no perfil Slow 4G + CPU 4x (--rolar: rolagem completa)
LS='--ls={"originaria.carrinho.v1":"{\"itens\":[{\"id\":726944,\"qtd\":1}],\"obs\":\"\"}"}'   # carrinho semeado
```

### T0. Instrumentos, lacrados antes de qualquer maker (orquestrador/checker, 0,5 dia)

- **Arquivos:**
  - `scripts/cdp.mjs`, `scripts/medir.mjs`, `scripts/avaliar.mjs`, `scripts/servir.mjs`, `scripts/contraste.mjs`;
  - `scripts/larguras.html`;
  - `tests/contraste.test.mjs`, com os pares de **Identidade** (inclusive os novos e os proibidos). O teste falha se algum par permitido ficar abaixo do mínimo do papel dele ou se algum proibido passar;
  - CONTRATO.md §Ganchos.
- **Aceite:**

```bash
M https://l3ttn.github.io/originariadiscos/ 3 | jq -c '[.elemento, .lcp_ms>4000 and .lcp_ms<5500, .capas>0, .bytes_site>0]'   # → ["IMG",true,true,true]
M https://l3ttn.github.io/originariadiscos/ 1 --rolar | jq -c '[.capas,.bytes>1500000]'                     # → [18,true]
A https://l3ttn.github.io/originariadiscos/ '' --axe                                                # → ["color-contrast:2"]
A https://l3ttn.github.io/originariadiscos/ '[...new Set(__mov.map(x=>x.split(":")[1]))]' --movimento --reduzido   # → ["skeleton-pulsar"]
node scripts/contraste.mjs '#C8231A' '#F4EFE6'                                                      # → 4.94
node scripts/contraste.mjs '#761210' '#F39A45'                                                      # → 5.11
npm test 2>&1 | grep '^# fail'                                                                      # → # fail 0
grep -c '^## Ganchos' CONTRATO.md                                                                   # → 1
```

<details><summary>Código dos instrumentos (testado em 01/10/2026 contra o site ao vivo, inclusive as linhas `// v5.1` e `// v5.2` das revisões)</summary>

```js
// scripts/cdp.mjs — Chrome headless + CDP sem dependências (Node 22). Base de medir.mjs e avaliar.mjs.
import { spawn } from 'node:child_process';
export async function abrirChrome() {
  const porta = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', `--remote-debugging-port=${porta}`,
    '--no-first-run', `--user-data-dir=/tmp/cdp-${porta}`, 'about:blank'], { stdio: 'ignore' });
  const z = (ms) => new Promise((r) => setTimeout(r, ms)); let v;
  for (let i = 0; i < 80 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json(); } catch { await z(100); } }
  const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map(); const eventos = [];
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else eventos.push(d); });
  const cmd = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  async function aba({ largura = 412, altura = 915, dpr = 2.625, reduzido = false, escuro = false, lento = false, antes = '', bloquear = [] } = {}) {
    const { result: { browserContextId: ctx } } = await cmd('Target.createBrowserContext', { disposeOnDetach: true });
    const { result: { targetId } } = await cmd('Target.createTarget', { url: 'about:blank', browserContextId: ctx });
    const { result: { sessionId: s } } = await cmd('Target.attachToTarget', { targetId, flatten: true });
    for (const m of ['Network.enable', 'Page.enable', 'Runtime.enable']) await cmd(m, {}, s);
    if (bloquear.length) await cmd('Network.setBlockedURLs', { urls: bloquear }, s); // v5.1
    await cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: dpr, mobile: largura < 800 }, s);
    await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduzido ? 'reduce' : 'no-preference' }, { name: 'prefers-color-scheme', value: escuro ? 'dark' : 'light' }] }, s);
    if (lento) { // perfil da pesquisa: Slow 4G (150 ms RTT, 1,6 Mbps), CPU 4x, cache frio
      await cmd('Network.setCacheDisabled', { cacheDisabled: true }, s);
      await cmd('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }, s);
      await cmd('Emulation.setCPUThrottlingRate', { rate: 4 }, s);
    }
    if (antes) await cmd('Page.addScriptToEvaluateOnNewDocument', { source: antes }, s);
    const fechar = async () => { await cmd('Target.closeTarget', { targetId }); await cmd('Target.disposeBrowserContext', { browserContextId: ctx }).catch(() => {}); };
    const marca = () => eventos.length; // v5.2
    async function ocioso(inicio, carregou = true) { // v5.2: espera (load, se pedido) + rede parada 2 s, teto 40 s; devolve os eventos desde `inicio`
      const t0 = Date.now(); const voo = new Set(); let marco = Date.now();
      for (let i = inicio; Date.now() - t0 < 40000; await z(100)) {
        for (; i < eventos.length; i++) { const e = eventos[i]; if (e.sessionId !== s) continue;
          if (e.method === 'Page.loadEventFired') carregou = true;
          if (e.method === 'Network.requestWillBeSent') { voo.add(e.params.requestId); marco = Date.now(); }
          if (e.method === 'Network.loadingFinished' || e.method === 'Network.loadingFailed') { voo.delete(e.params.requestId); marco = Date.now(); } }
        if (carregou && voo.size === 0 && Date.now() - marco > 2000) break;
      }
      return eventos.slice(inicio).filter((e) => e.sessionId === s);
    }
    async function ir(url) { const inicio = marca(); await cmd('Page.navigate', { url }, s); return ocioso(inicio, false); } // navega e espera load + rede parada 2 s
    const avaliar = async (expr) => { const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, s); return r.result.exceptionDetails ? { erro: r.result.exceptionDetails.exception?.description } : r.result.result.value; };
    return { ir, marca, ocioso, avaliar, fechar, cmd: (m, p) => cmd(m, p, s) };
  }
  return { aba, sair: () => { ws.close(); proc.kill(); } };
}
```

```js
// scripts/medir.mjs <url> [repeticoes=3] [--ss='{"chave":"valor"}'] [--bloquear=padrão,…] [--rolar]
// -> {lcp_ms, cls, elemento, origens, bytes, bytes_site, bytes_indice, capas} medianos; perfil Slow 4G + CPU 4x, 412x915 @2.625
import { abrirChrome } from './cdp.mjs';
const args = process.argv.slice(2); const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3); // v5.1
const [url, n = 3] = args.filter((a) => !a.startsWith('--')); // v5.1
const ss = flag('ss'); const bloquear = flag('bloquear')?.split(',') ?? []; const rolar = args.includes('--rolar'); // v5.1 / v5.2
const obs = `window.__m={lcp:0,el:'',cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries()){__m.lcp=e.startTime;const x=e.element;__m.el=x?x.tagName+(x.id?'#'+x.id:''):'?'}}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)__m.cls+=e.value}).observe({type:'layout-shift',buffered:true});`
  + (ss ? `try{for(const [k,v] of Object.entries(${ss}))sessionStorage.setItem(k,v)}catch(e){}` : ''); // v5.1: sessionStorage semeado antes dos scripts da página
const desce = `(async()=>{for(let y=0;y<=document.documentElement.scrollHeight;y+=innerHeight/2){scrollTo(0,y);await new Promise(r=>setTimeout(r,400))}})()`; // v5.2
const c = await abrirChrome(); const res = []; const origens = new Set();
for (let k = 0; k < Number(n); k++) {
  const a = await c.aba({ lento: true, antes: obs, bloquear }); const ev = await a.ir(url); const m = await a.avaliar('window.__m'); // LCP/CLS lidos antes de rolar
  if (rolar) { const i = a.marca(); await a.avaliar(desce); ev.push(...(await a.ocioso(i))); } // v5.2: "rolagem completa" = desce meia tela a cada 400 ms até o fim + rede parada 2 s
  const host = new Map(); const caminho = new Map();
  ev.filter((e) => e.method === 'Network.requestWillBeSent').forEach((e) => { try { const u = new URL(e.params.request.url); origens.add(u.host); host.set(e.params.requestId, u.host); caminho.set(e.params.requestId, u.pathname); } catch {} });
  const b = { total: 0, site: 0, indice: 0, capas: 0 }; // v5.1: "primeira vista" = bytes até o load + 2 s de rede parada (o corte do ir())
  for (const e of ev) if (e.method === 'Network.loadingFinished') { const id = e.params.requestId, h = host.get(id), x = e.params.encodedDataLength; b.total += x;
    if (h === 'i.discogs.com') b.capas++; else if (/\/data\/indice\.json$/.test(caminho.get(id) || '')) b.indice += x; else b.site += x; } // v5.2: o índice tem gate próprio
  res.push({ ...m, ...b }); await a.fechar();
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(JSON.stringify({ url, lcp_ms: Math.round(med(res.map((r) => r.lcp))), cls: +med(res.map((r) => r.cls)).toFixed(3),
  elemento: [...new Set(res.map((r) => r.el))].join('|'), runs: res.map((r) => Math.round(r.lcp)), origens: [...origens].filter(Boolean).sort(),
  bytes: med(res.map((r) => r.total)), bytes_site: med(res.map((r) => r.site)), bytes_indice: med(res.map((r) => r.indice)), capas: med(res.map((r) => r.capas)) })); // v5.1 / v5.2
c.sair();
```

```js
// scripts/avaliar.mjs <url> '<expressão JS>' [--tela=390x844] [--reduzido] [--escuro] [--lento] [--ls='{"chave":"valor"}'] [--movimento] [--bloquear=padrão,…] [--axe]
// Imprime o valor (JSON) da expressão depois de load + rede parada. --axe: devolve as violações WCAG 2 A/AA do axe-core 4.13.0.
// --movimento (v5.1): antes de qualquer script, registra em window.__mov cada animationstart e transitionrun que não seja fade,
// propriedade discreta ou troca de cor (lista ampliada na v5.2: visibility e as propriedades de cor).
import { abrirChrome } from './cdp.mjs';
const args = process.argv.slice(2); const flag = (k) => args.find((a) => a.startsWith(`--${k}`));
const [url, exprArg] = args.filter((a) => !a.startsWith('--'));
const [largura, altura] = (flag('tela')?.split('=')[1] || '390x844').split('x').map(Number);
const ls = flag('ls') ? JSON.parse(flag('ls').slice(5)) : null;
const mov = `window.__mov=[];const __fade=['opacity','display','overlay','visibility','color','background-color','border-color','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','text-decoration-color','fill','stroke'];for(const t of ['animationstart','transitionrun'])addEventListener(t,(e)=>{if(!__fade.includes(e.propertyName))__mov.push(t+':'+(e.animationName||e.propertyName)+':'+(e.target.id||e.target.getAttribute?.('class')||e.target.nodeName))},true);`; // v5.1, lista ampliada na v5.2
const antes = (ls ? `try{for(const [k,v] of Object.entries(${JSON.stringify(ls)}))localStorage.setItem(k,v)}catch(e){}` : '') + (flag('movimento') ? mov : ''); // v5.1
const bloquear = flag('bloquear')?.split('=')[1]?.split(',') ?? []; // v5.1
const axe = `new Promise((ok,erro)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js';s.onload=()=>axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>ok(r.violations.map(v=>v.id+':'+v.nodes.length)),erro);s.onerror=erro;document.head.append(s)})`;
const c = await abrirChrome();
const a = await c.aba({ largura, altura, dpr: 3, reduzido: !!flag('reduzido'), escuro: !!flag('escuro'), lento: !!flag('lento'), antes, bloquear });
await a.ir(url); console.log(JSON.stringify(await a.avaliar(flag('axe') ? axe : exprArg))); await a.fechar(); c.sair();
```

```js
// scripts/servir.mjs [porta=8080] — estático com gzip, como o GitHub Pages (max-age=600). Só para medir; fica fora do artefato do Pages.
import http from 'node:http'; import { readFile } from 'node:fs/promises'; import { gzipSync } from 'node:zlib'; import path from 'node:path';
const raiz = path.resolve(process.env.RAIZ || '.'); const porta = Number(process.argv[2] || 8080);
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain' };
http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const arq = path.join(raiz, p); if (!arq.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try {
    let corpo = await readFile(arq); const tipo = tipos[path.extname(arq)] || 'application/octet-stream';
    const h = { 'content-type': tipo, 'cache-control': 'max-age=600', 'access-control-allow-origin': '*' };
    if (/text|json|svg|javascript/.test(tipo) && /gzip/.test(req.headers['accept-encoding'] || '')) { corpo = gzipSync(corpo); h['content-encoding'] = 'gzip'; }
    res.writeHead(200, h).end(corpo);
  } catch { res.writeHead(404).end('404'); }
}).listen(porta, '127.0.0.1', () => console.log(`servindo ${raiz} em http://127.0.0.1:${porta}/`));
```

```js
// scripts/contraste.mjs '#C8231A' '#F4EFE6' -> 4.94  (WCAG 2.x)
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
if (process.argv[3]) console.log(razao(process.argv[2], process.argv[3]).toFixed(2));
```

```html
<!-- scripts/larguras.html — larguras dos versos do poema a 100 px por display (Afirmação F10).
     google-chrome --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "file://$PWD/scripts/larguras.html" -->
<!doctype html><meta charset=utf-8><style>
@font-face{font-family:BS;src:url(https://fonts.gstatic.com/s/bigshoulders/v4/qFdk35CPh40oITJ69S3GFqy5-BQAcbz7z7beObof__ytqyTi33thrko94eTNB9k0DFVQtQ.woff2)}
@font-face{font-family:AR;src:url(https://fonts.gstatic.com/s/archivo/v25/k3kPo8UDI-1M0wlSV9XA35FckqWY8Q-2trydOxKsv4Rn.woff2)}
@font-face{font-family:AN;src:url(https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8CSKlv.woff2)}
span{font-size:100px;white-space:nowrap;text-transform:uppercase}
</style><div id=o></div><script>
const v=['VINIL NOVO','LACRADO','ORIGINÁRIA'],f={BS:'900',AR:'800',AN:'400'};
(async()=>{for(const k in f)await document.fonts.load(f[k]+' 100px '+k);const r={};
for(const k in f)r[k]=v.map(t=>{const s=document.createElement('span');Object.assign(s.style,{fontFamily:k,fontWeight:f[k]});if(k==='AR')s.style.fontVariationSettings="'wdth' 62";s.textContent=t;document.body.append(s);const w=s.getBoundingClientRect().width;s.remove();return +w.toFixed(1)});
o.textContent=JSON.stringify(r)})()</script>
```

</details>

### T0b. Termos do Discogs, decididos por escrito (0,25 dia + decisão do dono; antes do T1)

- **O que faz.** Lê os API Terms of Use (versão de 27/05/2025, já lida pela pesquisa) e leva ao dono 4 decisões. Elas ficam no CONTRATO.md §Discogs, com o OK escrito do dono no PR:
  1. **Uso.** Os termos proíbem usar a API ou o conteúdo "to drive traffic to other non-Discogs websites". Uma loja que usa dados do Discogs para vender está nessa zona [J]. A decisão é entre aceitar o risco, reduzir o uso aos dados CC0 (títulos, faixas, créditos, datas, formato, códigos) ou trocar a fonte.
  2. **Capas.** Não são CC0. A decisão é entre o hotlink de `i.discogs.com` (como hoje), fotos próprias ou um misto. As fotos próprias também resolveriam o peso: WebP de 300–600 px tem 8–19 KB.
  3. **Defasagem e cache.** O dado não pode ter mais de 6 h nem ficar em cache além do necessário. O cron de 6 h e o cache de 6 h do build já casam com isso. Mas o cron para depois de 60 dias sem push, e o `indice.json` e o `discos/<id>.json` republicam o dado. A decisão é manter o cron vivo ou aceitar o risco.
  4. **Prints e posts.** A Parede "para print", o T20 e o og:image por disco do T23 usam capas. A decisão é entre pode, não pode, ou só com foto própria.
- **Atribuição.** Define onde ela entra em cada página:
  - "Data provided by Discogs." com link sem `nofollow`, sempre junto do dado:
    - na linha da edição na ficha;
    - no rodapé da grade no catálogo;
    - na home, no fim de cada bloco que mostra dado ou capa do Discogs: Destaques, 01 Novidades e, a partir de 1024 px, 02 Coleções com o leque;
    - no rodapé de todas as páginas;
  - o aviso de não afiliação no rodapé, com o texto literal copiado dos termos.
- **Bloqueia:** T1 (protótipos e prints usam capas), T4 (republica o dado), T20 e T23.
- **Aceite:**

```bash
grep -c '^## Discogs' CONTRATO.md                  # → 1
grep -c 'Data provided by Discogs' CONTRATO.md     # → ≥1
# + link do comentário do dono no PR com o OK nas 4 decisões
```

### T0c. Linha de base de conversão (dono; 0 dia de desenvolvimento)

- **O que conta:** pedidos por semana que chegam pelo site, ou seja, conversas que começam com a mensagem pronta do site ("Olá! Quero fazer um pedido na Originária Discos" ou "Olá! Vi que este disco está esgotado…"). Depois do T5, conta pelo código OD.
- **Quando:**
  - antes: durante 2 a 4 semanas, a partir de quando o número real estiver no ar (antes disso o site não gera pedido nenhum, porque o placeholder abre um número falso), de preferência antes do T10. A janela fecha antes do merge do `v5-pele` (T18), que é quando a pele vai ao ar;
  - depois: de novo por 2 a 4 semanas depois do T18.
- **Onde: `docs/linha-de-base.csv`, no repositório**, uma linha por semana, com o cabeçalho `semana,pedidos,discos,origem_instagram,origem_busca,origem_outra,fase`.
  - `semana` é a segunda-feira em ISO (`2026-10-05`), e `fase` vale `antes` ou `depois`.
  - O repositório é público, por isso o arquivo tem só contagens, sem nome, telefone ou texto de mensagem de cliente.
  - O artefato do Pages (T3) não copia `docs/`.
- **Ressalva:** com volume baixo, a comparação é indício, não prova [J].
- **Opcional, fora do escopo:** um contador de cliques em `wa.me` sem cookie. Ele exige um serviço de terceiro, acrescenta uma origem (quebra o gate de origens do index) e precisa de decisão do dono.
- **Aceite:** o merge do T18 exige ≥ 2 semanas de linha de base registradas:

```bash
awk -F, 'NR>1 && $7=="antes"' docs/linha-de-base.csv | wc -l     # → ≥2
```

### T1. Protótipos P1 e P2, comparador e prints (3,0 dias; depende do T0b; número real é pré-requisito do merge)

- **Arquivos:** `prototipos/{concreto,arquivo}/*.html|css|js`, `prototipos/comparar.html`, `prototipos/fonts/*.woff2` + `prototipos/fonts/OFL-*.txt` (6 famílias), `scripts/prints.mjs`.
- **Aceite:**

```bash
ls prototipos/prints/*.png | wc -l                                                          # → 35
grep -L 'name="robots" content="noindex"' prototipos/*.html prototipos/*/*.html | wc -l      # → 0 (inclui comparar.html)
cat prototipos/fonts/*.woff2 | wc -c                                                        # → 190824 (F1–F5 e F11)
ls prototipos/fonts/OFL-*.txt | wc -l                                                       # → 6
for f in bigshoulders gabarito courierprime archivo anton fraunces; do grep -c 'SIL OPEN FONT LICENSE Version 1.1' prototipos/fonts/OFL-$f.txt; done | tr '\n' ' '   # → 1 1 1 1 1 1 (F14)
for d in concreto arquivo; do M "$L/prototipos/$d/index.html" 3 | jq -c '[.lcp_ms<=2000,.cls<=0.05]'; done | sort -u   # → [true,true]
M "$L/prototipos/concreto/index.html" 3 | jq -c '.elemento'                                 # → "H1"
for d in concreto arquivo; do for p in index.html catalogo.html "disco.html?id=726944" carrinho.html; do for t in claro escuro; do
  A "$L/prototipos/$d/$p$([ "${p#*\?}" != "$p" ] && echo '&' || echo '?')tema=$t" '' --axe; done; done; done | sort -u   # → []
# k por display: nenhum verso passa da borda do poema (span inline tem scrollWidth 0, por isso a medida é pelo retângulo; exige os 3 versos)
for f in bigshoulders archivo anton; do for t in 360x740 390x664 1440x900; do
  A "$L/prototipos/concreto/index.html?display=$f" '(()=>{const p=document.querySelector(".poema").getBoundingClientRect(),s=[...document.querySelectorAll(".poema span")];return s.length===3&&s.every(x=>x.getBoundingClientRect().right<=p.right+0.5)})()' --tela=$t; done; done | sort -u   # → true
grep -c 5547900000000 js/config.js                                                          # → 0
```

### Tronco comum (independe da direção; em paralelo com o T1; merge direto na main)

**T2. Código OD estável (0,5 dia; depende do T3).**
- **Arquivos:** `scripts/build-catalogo.mjs` (nova função exportada `atribuirCodigos(discos, mapa)`), `data/codigos.json` (novo), `tests/pipeline.test.mjs`.
- **Regra:**
  - o código segue a ordem de `adicionadoEm`, com desempate por `ordem`;
  - formato `OD-001`, com 3 dígitos e zero à esquerda (depois do 999 vem `OD-1000`);
  - o mapa id→código é persistido e nunca reaproveita nem renumera. Isso só se sustenta com o commit do workflow funcionando, por isso o T2 depende do T3;
  - disco removido do `discos.txt` fica no mapa como `removido`;
  - **nunca** derivar o código do campo `ordem`.
- **Aceite:**

```bash
node -p 'const d=require("./data/catalogo.json").discos;[new Set(d.map(x=>x.codigo)).size,d.every(x=>/^OD-\d{3,}$/.test(x.codigo)),d.find(x=>x.id===726944).codigo].join(" ")'  # → 51 true OD-001
node --test --test-name-pattern='código OD' tests/pipeline.test.mjs 2>&1 | grep '^# fail'   # → # fail 0 (teste do checker: remover 1 disco não muda os códigos restantes)
```

**T3. Workflow comita os dados de verdade e só publica o site (0,5 dia; número real é pré-requisito do merge).**
- **Arquivo:** `.github/workflows/build-deploy.yml`.
- **Faz:**

```yaml
      - name: Recusa o número de WhatsApp placeholder
        run: |
          if grep -q '5547900000000' js/config.js; then
            echo "::error::js/config.js ainda tem o WHATSAPP placeholder"; exit 1
          fi

      - name: Commita dados se mudaram
        if: steps.atividade.outputs.continuar == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add --intent-to-add data/            # arquivos novos entram na comparação
          if git diff -I '"geradoEm"' --quiet -- data; then
            echo "Dados sem mudança de conteúdo (fora de geradoEm) — não commita."
          else
            git add data/
            git commit -m "Atualiza catálogo (build automático)"
            git pull --rebase --autostash         # depois do commit: nada sujo no caminho
            git push
          fi

      - name: Monta o artefato só com o site
        if: steps.atividade.outputs.continuar == 'true'
        run: |
          mkdir _site
          for f in index.html catalogo.html disco.html carrinho.html como-funciona.html .nojekyll css js img fonts data prototipos; do
            if [ -e "$f" ]; then cp -r "$f" _site/; fi
          done
          rm -rf _site/data/cache
      # e o "Upload artifact do Pages" passa a usar path: _site
```

- **Por que mudou.**
  - O `pull --rebase` antes do commit falhava sempre, porque o build deixa a árvore suja.
  - O `continue-on-error` escondia a falha. O passo novo não tem `continue-on-error`, então uma falha aparece.
  - O aceite antigo (`curl` em `data/codigos.json` → 200) dava PASS falso, porque o Pages publicava a árvore de trabalho, com ou sem commit.
- **Aceite:**

```bash
grep -c '^ *continue-on-error:' .github/workflows/build-deploy.yml                              # → 0 (hoje dá 1; ancorado no início da linha, para comentário não contar)
awk '/git commit/{c=NR} /git pull/{p=NR} END{print (c>0 && p>c)}' .github/workflows/build-deploy.yml   # → 1 (commit antes do pull)
grep -c "grep -q '5547900000000' js/config.js" .github/workflows/build-deploy.yml                # → 1
grep -c 'path: _site' .github/workflows/build-deploy.yml                                          # → 1
# depois do merge e do T2, numa execução que muda data/ (um disco novo no discos.txt, ou workflow_dispatch logo depois do T2):
gh api 'repos/l3ttn/originariadiscos/commits?path=data/codigos.json' --jq '.[0].commit.author.name'   # → github-actions[bot]
gh run view <id-da-execução> --repo l3ttn/originariadiscos --log | grep -c 'cannot pull with rebase'   # → 0
curl -s -o /dev/null -w '%{http_code}' https://l3ttn.github.io/originariadiscos/scripts/build-catalogo.mjs   # → 404
```

**T4. Dados divididos (1 dia; depende do T0b).**
- **Arquivos:** `scripts/build-catalogo.mjs`, `js/catalogo.js`, `tests/pipeline.test.mjs`. No `catalogo.js`:
  - `porId` lê `discos/<id>.json`, reaproveitando `window.__disco` quando existe;
  - `todos` lê o `indice.json`;
  - `destaques`, `novidades` e `secoes` leem o `home.json`.

  O `catalogo.json` continua sendo gerado para os scripts de preço.
- **Campos do índice:** id, codigo, artista, titulo, ano, selo, catno, pais, formatoTipo, formatoLabel, cor, edicao, generos, capa, status, preco, secao, **secaoSlug**, destaque, novo, adicionadoEm, ordem e edicaoVenda (só id, ano, selo, catno e pais).
- **Esquema do `home.json`:** o de **Dados por página**. As 3 capas de cada seção preferem as que já estão em destaques e novidades (D9).
- **Aceite:**

```bash
[ $(gzip -9c data/indice.json | wc -c) -le 10240 ] && echo ok    # → ok
[ $(( $(gzip -9c data/indice.json | wc -c) / $(node -p 'require("./data/indice.json").discos.length') )) -le 200 ] && echo ok   # → ok (≤ 200 B gz por disco; hoje 167)
[ $(gzip -9c data/home.json | wc -c) -le 4096 ] && echo ok       # → ok
node -p 'const h=require("./data/home.json");[h.destaques.length,h.novidades.length,h.secoes.length,h.secoes.every(s=>s.capas.length===3)].join(" ")'   # → 3 12 7 true
node -p '[...new Set(require("./data/indice.json").discos.map(d=>d.secaoSlug))].sort().join(" ")'   # → brasil eletronico hip-hop jazz reggae-dub rock-psicodelico soul-funk
ls data/discos/*.json | wc -l                                     # → 51
grep -c 'data/catalogo.json' js/*.js | awk -F: '{s+=$2} END{print s}'   # → 0
M "$L/disco.html?id=726944" 3 | jq '.lcp_ms<=2300'                # → true (era 2388 local)
```

**T5. Mensagem do WhatsApp com código e grupos (0,5 dia; muda o CONTRATO).**
- **Arquivos:** `js/carrinho.js` (`mensagemPedido`), `js/whatsapp.js` (`linkSolicitar` começa por "OD-001 · "), `tests/carrinho.test.mjs`, `tests/whatsapp.test.mjs`, CONTRATO.md (mensagem literal). Depende do T2.
- **Aceite:**

```bash
node --input-type=module -e "import {mensagemPedido} from './js/carrinho.js'; import fs from 'node:fs'; const c=JSON.parse(fs.readFileSync('data/catalogo.json','utf8')).discos; console.log(mensagemPedido({itens:[{id:726944,qtd:1}],obs:''},c,'Originária Discos'))" \
 | grep -cE '^1\. OD-001 · Jorge Ben – África Brasil \(1976\)|^Solicito \(esgotados/encomenda\):|^Frete: a combinar \(CEP: ____\)'   # → 3
```

**T6. Preço com centavos, `Intl` pt-BR (0,25 dia; muda o CONTRATO, precisa de OK).**
- **Arquivos:** `js/carrinho.js` (`formatarPreco` passa a usar `Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})`), testes, CONTRATO.md.
- **Aceite:**

```bash
node --input-type=module -e "import {formatarPreco} from './js/carrinho.js'; console.log(formatarPreco(1250).replace(/\u00a0/g,' '))"   # → R$ 1.250,00
```

**T7. Fontes no repo, Google Fonts fora, preconnect do Discogs dentro (0,75 dia; muda o CONTRATO).**
- **Arquivos:**
  - `fonts/*.woff2`, `fonts/OFL-*.txt` (só as 3 da stack; as dos protótipos ficam em `prototipos/fonts/`);
  - `css/estilo.css` (`@font-face` e fallbacks);
  - as 4 páginas HTML. Saem os `preconnect` e o `<link>` do Google; entra `<link rel="preconnect" href="https://i.discogs.com">` em index, catálogo e disco.
- **Preload, só no index, com a tag literal:**

  ```html
  <link rel="preload" href="fonts/big-shoulders-900.woff2" as="font" type="font/woff2" crossorigin>
  ```

  Sem `as="font"`, `type` e `crossorigin`, o preload não é aproveitado e a fonte baixa duas vezes, ou seja, mais 13.712 B num orçamento apertado.
- **Fallback da display.** Medido com a Big Shoulders bloqueada (`Network.setBlockedURLs`) e com a Roboto instalada no ambiente de medição, pelo pacote Roboto da distribuição (a máquina de hoje só tem Liberation). Mede também sem a Roboto.
- **Aceite:**

```bash
grep -l 'fonts.googleapis\|fonts.gstatic' *.html css/*.css | wc -l   # → 0
cat fonts/*.woff2 | wc -c                                            # → 59224
ls fonts/OFL-*.txt | wc -l                                           # → 3
grep -c 'rel="preload"' index.html catalogo.html disco.html carrinho.html   # → index.html:1 e as outras :0
grep -cF '<link rel="preload" href="fonts/big-shoulders-900.woff2" as="font" type="font/woff2" crossorigin>' index.html   # → 1
A "$L/" '[performance.getEntriesByType("resource").filter(e=>e.name.endsWith("big-shoulders-900.woff2")).length,[...document.fonts].some(f=>f.family.includes("Big Shoulders")&&f.status==="loaded")]'   # → [1,true] (1 requisição, e a fonte foi de fato usada)
grep -c 'rel="preconnect" href="https://i.discogs.com"' index.html catalogo.html disco.html   # → 1 em cada
M "$L/" 3 | jq -c '[.origens, .cls<=0.05]'                           # → [["127.0.0.1:8080","i.discogs.com"],true]
fc-list | grep -ci 'roboto'                                          # → ≥1 (pré-condição da linha seguinte)
M "$L/" 3 --bloquear='*big-shoulders*' | jq -c '.cls<=0.05'          # → true
for t in 360x740 390x664; do A "$L/" '(()=>{const p=document.querySelector(".poema").getBoundingClientRect(),s=[...document.querySelectorAll(".poema span")];return s.length===3&&s.every(x=>x.getBoundingClientRect().right<=p.right+0.5)})()' --bloquear='*big-shoulders*' --tela=$t; done | sort -u   # → true
```

(As duas últimas linhas valem a partir do T13, quando o poema existe. No T7 rodam contra o protótipo `prototipos/concreto/index.html`.)

**T8. Sai a abertura `intro.js` (0,25 dia; atualiza o CONTRATO §abertura).**
- **Arquivos:** `js/intro.js` (apagado), as 4 páginas HTML, `js/catalogo.js` (`catalogoPronto` vira opcional).
- **Aceite:**

```bash
test -e js/intro.js; echo $?                     # → 1
grep -l 'intro.js' *.html | wc -l                # → 0
A "$L/" 'document.querySelector(".intro")===null'   # → true
```

**T9. Botão WhatsApp passa no AA (0,1 dia; vale já no v4; número real é pré-requisito do merge).**
- **Arquivo:** `css/estilo.css`.
- **Aceite:**

```bash
A "$L/" 'getComputedStyle(document.querySelector(".btn--whatsapp")).color'   # → "rgb(17, 17, 17)"
A "$L/" '' --axe                                                             # → []
grep -c 5547900000000 js/config.js                                           # → 0
```

**T9b. Páginas de política e pagamento (0,5 dia; texto do dono; muda o CONTRATO).**
- **Arquivos:**
  - `como-funciona.html` (seções `#como-funciona`, `#pagamento`, `#prazos`, `#trocas`, `#identificacao`);
  - `js/config.js` (`PAGAMENTO`, `PRAZOS_FRETE`, `TROCAS`, todos com texto do dono);
  - `css/estilo.css`;
  - o rodapé das 4 páginas (links);
  - a linha `[data-pagamento]` na ficha e no carrinho.
- **Bloqueia:** o merge exige `PAGAMENTO`, `PRAZOS_FRETE` e `TROCAS` preenchidos (merge = ar).
- **Aceite:**

```bash
curl -s -o /dev/null -w '%{http_code}' "$L/como-funciona.html"                         # → 200
A "$L/como-funciona.html" '["como-funciona","pagamento","prazos","trocas","identificacao"].every(i=>document.getElementById(i))'   # → true
for p in "" catalogo.html "disco.html?id=726944" carrinho.html; do A "$L/$p" '["#trocas","#prazos","#pagamento"].every(h=>document.querySelector(`footer a[href$="como-funciona.html${h}"]`))'; done | sort -u   # → true
A "$L/disco.html?id=726944" 'document.querySelector("[data-pagamento]").textContent.trim().length>0'   # → true
```

### Pele da direção escolhida (P1 descrito; depois da escolha do dono; PRs contra `v5-pele`)

**T10. Tokens claro e escuro, tema forçável, base, foco, raio 0, header sólido, grão por token, reduced-motion por componente (1 dia).**
- **Arquivo:** `css/estilo.css`, com os seletores de tema, a regra dos objetos impressos de **Identidade** (com `--tinta-suave` e `--vermelho` fixos), o grão com os valores de **Textura** e `pointer-events:none; z-index:0`, e o mapa `--cor-secao` com `[data-secao]{--papel-secao:var(--cor-secao)}`.
- **Reduced-motion sem regra global.** Apagar o bloco `*,*::before,*::after{animation-duration:0.01ms!important;…transition-duration:0.01ms!important}` (linhas 1205–1213, R12). No lugar, cada componente desliga o próprio movimento. Os nomes de classe que não estão em **Ganchos** são do maker:

  ```css
  @media (prefers-reduced-motion:reduce){
    .letreiro__trilho,.poema__o::before,.palco__lacre::after,.carimbo-pedido{animation:none}
    .selo-carrinho,.dock,.barra-compra,.cta-fixo,#folha-filtros{transition-property:opacity,display,overlay;transition-duration:120ms}
    .card__vinil,.palco__vinil,.tira,.tira .leque img{transition:none}
    .cta-principal,.cta-principal:active{transition:none;transform:none}
  }
  ```

- **Aceite:**

```bash
grep -c backdrop-filter css/estilo.css                                    # → 0
grep -c '0.01ms' css/estilo.css                                           # → 0 (a regra global do v4 saiu)
A "$L/" 'getComputedStyle(document.body).backgroundColor'                 # → "rgb(244, 239, 230)"
A "$L/" 'getComputedStyle(document.body).backgroundColor' --escuro        # → "rgb(15, 14, 13)"
A "$L/" '(document.documentElement.dataset.tema="claro",getComputedStyle(document.body).backgroundColor)' --escuro   # → "rgb(244, 239, 230)"
A "$L/" 'getComputedStyle(document.documentElement).colorScheme' --escuro # → "dark"
for p in "" catalogo.html "disco.html?id=726944" carrinho.html; do A "$L/$p" '' --axe; A "$L/$p" '' --axe --escuro; done | sort -u   # → []
[ $(gzip -9c css/estilo.css | wc -c) -le 10240 ] && echo ok              # → ok
node --test tests/contraste.test.mjs 2>&1 | grep '^# fail'               # → # fail 0
# Foco e bordas nos objetos impressos (o axe não testa): foca cada controle e compara com o fundo real (≥ 3:1)
FOCO='(()=>{const L=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]},R=(a,b)=>{const[x,y]=[L(a),L(b)].sort((p,q)=>q-p);return(x+.05)/(y+.05)},F=e=>{for(;e;e=e.parentElement){const b=getComputedStyle(e).backgroundColor;if(b!=="rgba(0, 0, 0, 0)")return b}return getComputedStyle(document.body).backgroundColor};let m=99;for(const e of document.querySelectorAll(".tira,.faixa-procurando :is(a,button,input),.palco :is(a,button)")){e.focus();const s=getComputedStyle(e);if(s.outlineStyle==="none"){m=0;break}const fp=F(e.parentElement);m=Math.min(m,R(s.outlineColor,parseFloat(s.outlineOffset)<0?F(e):fp));if(parseFloat(s.borderTopWidth)>0)m=Math.min(m,R(s.borderTopColor,fp))}return m>=3&&m<99})()'
for p in "" "disco.html?id=726944"; do A "$L/$p" "$FOCO" --escuro; A "$L/$p" "$FOCO"; done | sort -u   # → true (vale a partir do T13/T15, quando tiras, faixa e palco existem)
```

**T11. Header, letreiro, navegação, rodapé, wordmark, favicon e preview de link (1,5 dia).**
- **Arquivos:**
  - as 5 páginas HTML (inclusive `como-funciona.html`), `css/estilo.css`;
  - `img/logo.svg` (24 px de altura total, acento incluído), `img/favicon.svg`, `img/og.png` (1200×630, feito a partir do poema por `scripts/prints.mjs`, sem capa do Discogs);
  - `js/letreiro.js` (≤ 25 linhas: clonagem, `--n`, `resize`, pausa);
  - `js/config.js` (`IDENTIFICACAO_LEGAL`, `LOTE`).
- **Pré-condição:** anexar ao PR a evidência da página de marca da Meta, ou seja, o print da variante monocromática escura do glifo, ou a citação literal com URL e data. Com evidência, vale o glifo em `--tinta`; sem ela, vale o ramo negativo de **Iconografia** (nenhum botão verde com glifo).
- **Aceite:**

```bash
A "$L/" '!!document.querySelector(".letreiro button[aria-pressed]") && document.querySelectorAll(".letreiro [aria-hidden=true]").length>=1'   # → true
A "$L/" 'getComputedStyle(document.querySelector(".letreiro__trilho")).animationName' --reduzido   # → "none"
A "$L/" 'Math.round(document.querySelector(".letreiro").getBoundingClientRect().height)' --reduzido --tela=390x664   # → 36 (uma linha, com rolagem manual)
# sem vão: o trilho cobre a tela mais uma cópia. O "≥ 2 × innerWidth" proposto reprovaria a fórmula certa a 1440 (3 × 830 = 2490 < 2880)
for t in 1440x900 1024x768 390x664; do A "$L/" '(()=>{const t=document.querySelector(".letreiro__trilho"),c=t.querySelector(".letreiro__copia");return t.getBoundingClientRect().width>=innerWidth+c.getBoundingClientRect().width})()' --tela=$t; done | sort -u   # → true
A "$L/" 'document.querySelectorAll(".letreiro__copia:not([aria-hidden])").length' --tela=1440x900   # → 1
A "$L/" 'document.documentElement.scrollWidth' --tela=360x740                                      # → 360
A "$L/" '(()=>{const h=document.querySelector("header");return h.scrollWidth<=h.clientWidth})()' --tela=360x740   # → true
A "$L/" 'getComputedStyle(document.querySelector("header .btn--whatsapp")).color'                  # → "rgb(17, 17, 17)"
A "$L/" '!!document.querySelector("footer [data-legal]")'                                          # → true
# ramo do glifo: com a evidência da Meta, todo .btn--whatsapp tem 1 svg; sem ela, nenhum. [0,1] reprova
A "$L/" '[...new Set([...document.querySelectorAll(".btn--whatsapp")].map(b=>b.querySelectorAll("svg").length))]'   # → [1] ou [0], conforme a evidência anexada
for p in index.html catalogo.html disco.html carrinho.html como-funciona.html; do grep -c 'property="og:image" content="https://l3ttn.github.io/originariadiscos/img/og.png"' $p; done | sort -u   # → 1
file img/og.png | grep -c '1200 x 630'                                                             # → 1
```

**T12. Card e grade com réguas (1 dia; muda o CONTRATO).**
- **Arquivos:** `js/card.js`, `css/estilo.css` (com `--card-pad` de 12 px e o artista em até 3 linhas).
- **Aceite** (todas as expressões exigem os 30 cards da 1ª carga, para não passarem com a página vazia):

```bash
A "$L/catalogo.html" '(c=>c.length===30&&c.every(x=>/OD-\d{3}/.test(x.textContent)&&/(R\$|sob consulta)/i.test(x.textContent)))([...document.querySelectorAll(".card")])'   # → true
A "$L/catalogo.html" '[document.querySelectorAll(".card").length,document.querySelectorAll(".card [class*=whatsapp]").length]'   # → [30,0]
A "$L/catalogo.html" '(i=>i.length>=2&&i.slice(0,2).every(x=>x.loading==="eager"))([...document.querySelectorAll(".card img")])'   # → true
A "$L/catalogo.html" '(b=>b.length===30&&Math.min(...b.map(x=>x.getBoundingClientRect().height))>=44)([...document.querySelectorAll("button.card__add")])'   # → true
for t in 360x740 390x664; do A "$L/catalogo.html?q=jobim" '(()=>{const a=[...document.querySelectorAll(".card__artista")];return a.length>0&&a.every(e=>e.scrollHeight<=e.clientHeight+1)})()' --tela=$t; done | sort -u   # → true (nome mais longo sem truncar, em 3 linhas)
```

**T13. Home (1,5 dia; Coleções de 4 para 7, faixa e dock mudam o CONTRATO).**
- **Arquivos:** `index.html` (poema estático, seções 01–04), `js/pagina-index.js` (leque só a partir de 1024 px), `js/catalogo.js` (`secoes` sem o `slice(0, 4)`), `js/dock.js`, `css/estilo.css`.
- **Aceite:**

```bash
M "$L/" 3 | jq -c '[.elemento,.lcp_ms<=2000,.cls<=0.05,.bytes_site<=102400,.capas<=9]'      # → ["H1",true,true,true,true]
M "$L/" 1 --rolar | jq -c '[.capas<=15,.bytes_site<=102400]'                                # → [true,true] (rolagem completa a 412 px, sem leque)
for t in 390x664 412x780; do for r in "" --reduzido; do A "$L/" '(()=>{const c=document.querySelector(".hero__ctas").getBoundingClientRect(),i=document.querySelector(".destaques img").getBoundingClientRect();return c.bottom<=innerHeight&&innerHeight-i.top>=40})()' --tela=$t $r; done; done | sort -u   # → true (H1 e CTAs inteiros, ≥ 40 px da 1ª capa na dobra real, com e sem reduced-motion)
A "$L/" 'document.querySelectorAll(".colecoes a.tira").length'                              # → 7
A "$L/" 'document.documentElement.scrollWidth'                                              # → 390
for t in 360x740 1024x768 1440x900; do A "$L/" '(t=>t.length===7&&t.every(e=>e.scrollWidth<=e.clientWidth))([...document.querySelectorAll(".colecoes a.tira")])' --tela=$t; done | sort -u   # → true
A "$L/" '(l=>l.length>=10&&l.every(e=>{e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect(),x=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===x||e.contains(x)}))([...document.querySelectorAll(".faixa-procurando :is(input,button,a),.colecoes a.tira")])'   # → true (o grão não intercepta toque)
A "$L/" '!!document.querySelector(".dock a[href*=carrinho]")&&!document.querySelector(".dock .btn--whatsapp")' "$LS"   # → true (a dock leva à comanda)
# carimbo "NO CARRINHO": visível, acima da dock e sem receber toque; "Revisar pedido" continua tocável
A "$L/" '(async()=>{document.querySelector("button.card__add").click();await new Promise(r=>setTimeout(r,400));const s=document.querySelector(".selo-carrinho"),d=document.querySelector(".dock a[href*=carrinho]");if(!s||!d)return "faltou";const r=d.getBoundingClientRect(),x=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return [s.getClientRects().length>0,getComputedStyle(s).pointerEvents,d===x||d.contains(x),s.getBoundingClientRect().bottom<=r.top]})()'   # → [true,"none",true,true]
```

**T14. Catálogo (1,75 dia; muda o CONTRATO).**
- **Arquivos:** `catalogo.html`, `js/pagina-catalogo.js` (slug na URL, `?vista=parede`, histórico da folha, nomes de VT só durante a transição), `js/filtros.js` (busca tolerante, OD e catno com precedência, comparação por `secaoSlug`), `tests/filtros.test.mjs`, `css/estilo.css`.
- **Testes novos em `tests/filtros.test.mjs`:**
  - "OD-001" → exatamente 1 resultado;
  - "od 001" → o mesmo;
  - "jorje ben" → 726944;
  - "33057-1" → exatamente 1 resultado, 726944 (a precedência do código impede o token "1" de casar por substring);
  - nenhum código OD casa por tolerância;
  - filtro por seção com `soul-funk` e com `Soul / Funk` → os mesmos 7 discos.
- **Aceite:**

```bash
node --input-type=module -e "import {buscar} from './js/filtros.js'; import fs from 'node:fs'; const d=JSON.parse(fs.readFileSync('data/catalogo.json','utf8')).discos; console.log(['jorje ben','OD-001','od 001','33057-1'].map(q=>buscar(d,q).map(x=>x.id).join()).join(' '))"   # → 726944 726944 726944 726944
node --test tests/filtros.test.mjs 2>&1 | grep '^# fail'                                    # → # fail 0
A "$L/catalogo.html" '(async()=>{document.querySelector("[popovertarget=folha-filtros]").click();await new Promise(r=>setTimeout(r,300));history.back();await new Promise(r=>setTimeout(r,500));return document.querySelector("#folha-filtros").matches(":popover-open")})()'   # → false
# light dismiss: fechar sem Voltar devolve o histórico ao estado de antes de abrir.
# history.length não serve: back() não o diminui (a entrada da frente continua). hidePopover() dispara o mesmo `toggle` que o Esc e o toque fora; o Esc real fica no T18.
A "$L/catalogo.html" '(async()=>{const z=t=>new Promise(r=>setTimeout(r,t));const s0=JSON.stringify(history.state),i0=navigation.currentEntry.index;document.querySelector("[popovertarget=folha-filtros]").click();await z(300);const abriu=navigation.currentEntry.index===i0+1;document.querySelector("#folha-filtros").hidePopover();await z(500);return [abriu,JSON.stringify(history.state)===s0,navigation.currentEntry.index===i0]})()'   # → [true,true,true]
# filtro escolhido com a folha aberta sobrevive ao fechamento, pelo light dismiss e pelo Voltar
for fim in 'document.querySelector("#folha-filtros").hidePopover()' 'history.back()'; do
  A "$L/catalogo.html" "(async()=>{const z=t=>new Promise(r=>setTimeout(r,t));const q0=location.search;document.querySelector('[popovertarget=folha-filtros]').click();await z(300);document.querySelector('#folha-filtros input[type=checkbox]').click();await z(300);const q1=location.search;$fim;await z(500);return [q1!==q0,location.search===q1]})()"; done | sort -u   # → [true,true]
A "$L/catalogo.html?ate=60" 'document.querySelectorAll(".card").length'                     # → 51
# slug na URL, com o nome antigo aceito e regravado como slug
for q in soul-funk 'Soul%20%2F%20Funk'; do A "$L/catalogo.html?secao=$q" '[document.querySelectorAll(".card").length,location.search]'; done | sort -u   # → [7,"?secao=soul-funk"]
A "$L/catalogo.html?secao=Brasil" 'getComputedStyle(document.querySelector(".chips [data-secao=brasil][aria-pressed=true]")).color' --escuro   # → "rgb(244, 239, 230)" (P1; no P2, "rgb(17, 17, 17)")
A "$L/catalogo.html" '(async()=>{let m=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>m=Math.max(m,e.duration))).observe({type:"longtask"});document.querySelector(".chips [data-secao=jazz]").click();await new Promise(r=>setTimeout(r,1500));return m<=100})()' --lento   # → true
# depois da transição do filtro, nenhum card fica com nome de VT
A "$L/catalogo.html" '(async()=>{document.querySelector(".chips [data-secao=jazz]").click();await new Promise(r=>setTimeout(r,800));return [...document.querySelectorAll(".card, .card *")].filter(e=>getComputedStyle(e).viewTransitionName!=="none").length})()'   # → 0
M "$L/catalogo.html" 3 | jq -c '[.bytes_site<=102400,.capas<=10]'                           # → [true,true]
A "$L/catalogo.html?vista=parede" 'document.querySelectorAll(".parede img").length'          # → 18
M "$L/catalogo.html?vista=parede" 3 | jq -c '[.capas<=18,.bytes_site<=102400]'              # → [true,true]
```

**T15. Ficha do disco (2,0 dias; muda o CONTRATO).**
- **Arquivos:**
  - `disco.html` (`img#capa`, script inline, `rel=expect`);
  - `js/pagina-disco.js` (reaproveita `window.__disco`, faixas por lado, barra fixa, estado `.nao-encontrado`);
  - `js/card.js` (grava `od.capa` no clique, tira `capa` de qualquer outro elemento antes, tira o nome do `#capa` na própria ficha);
  - `js/config.js` (`PRAZO_ENCOMENDA`, `RESPOSTA_HORAS`);
  - `css/estilo.css` (`#capa{view-transition-name:capa}`, meio-tom, `padding-bottom` com a barra).
- **Aceite:**

```bash
grep -c 'rel="expect" href="#capa"' disco.html                                               # → 1
grep -cE '#capa\s*\{\s*view-transition-name:\s*capa' css/estilo.css                          # → 1
A "$L/disco.html?id=726944" 'getComputedStyle(document.querySelector(".cta-solicitar")).color'   # → "rgb(17, 17, 17)"
A "$L/disco.html?id=726944" 'document.querySelector(".cta-solicitar").textContent.trim()'    # → "Esgotado? Solicite o seu aqui agora mesmo!"
A "$L/disco.html?id=726944" 'document.body.textContent.includes("É esta que você recebe")'   # → true
A "$L/disco.html?id=726944" 'getComputedStyle(document.querySelector(".carimbo")).color' --escuro   # → "rgb(200, 35, 26)"
SS=$(node -p 'JSON.stringify({"od.capa":JSON.stringify({id:726944,src:require("./data/catalogo.json").discos.find(x=>x.id===726944).capa})})')
M "$L/disco.html?id=726944" 3 | jq -c '[.elemento,.lcp_ms<=2300,.cls<=0.05]'                 # → ["IMG#capa",true,true]  (link direto, sem od.capa)
M "$L/disco.html?id=726944" 3 --ss="$SS" | jq -c '[.elemento,.lcp_ms<=2300,.cls<=0.05]'     # → ["IMG#capa",true,true]  (vindo do card)
A "$L/disco.html?id=726944" '(()=>{const v=s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.height>0&&r.top<innerHeight&&r.bottom>0&&getComputedStyle(e).visibility!=="hidden"};return v(".cta-solicitar")||v(".barra-compra")})()' --tela=390x664   # → true (CTA à vista na chegada)
A "$L/disco.html?id=726944" 'document.querySelector(".barra-compra .btn--whatsapp").textContent.trim()'   # → "Solicitar no WhatsApp"
for id in 7383499 242785; do A "$L/disco.html?id=$id" '[...document.querySelectorAll(".faixas [data-lado]")].map(e=>e.dataset.lado).join("")'; done   # → "ABCDEF" e "ABCD"
A "$L/disco.html?id=726944" '(l=>l.length>=1&&l.every(e=>{e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect(),x=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===x||e.contains(x)}))([...document.querySelectorAll(".palco :is(a,button)")])'   # → true
M "$L/disco.html?id=726944" 3 | jq -c '[.bytes_site<=102400,.capas<=5]'                     # → [true,true]
# a barra fixa não cobre o bloco legal no fim da página (pré-condição: a barra está visível ali)
LIVRE='(async(f)=>{scrollTo(0,document.documentElement.scrollHeight);await new Promise(r=>setTimeout(r,800));const b=document.querySelector(f),e=document.querySelector("footer [data-legal]"),r=e.getBoundingClientRect();let ok=true;for(let y=r.top+2;y<r.bottom-1;y+=8){if(!e.contains(document.elementFromPoint(r.x+r.width/2,y)))ok=false}return [!!b&&b.getClientRects().length>0,r.bottom<=innerHeight,ok]})'
A "$L/disco.html?id=726944" "$LIVRE(\".barra-compra\")" --tela=390x664                     # → [true,true,true]
# disco não encontrado (pré-condição: o id 1 não existe)
node -p 'require("./data/catalogo.json").discos.some(x=>x.id===1)'                         # → false
A "$L/disco.html?id=1" '(()=>{const v=s=>{const e=document.querySelector(s);return !!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=="hidden"};return [v(".palco"),v(".barra-compra"),v(".nao-encontrado .btn--whatsapp"),document.querySelectorAll(".nao-encontrado .card").length,document.body.textContent.includes("Disco não encontrado")]})()'   # → [false,false,true,4,true]
```

**T16. Carrinho com comanda (1 dia; muda o CONTRATO).**
- **Arquivos:** `carrinho.html`, `js/pagina-carrinho.js`, `css/estilo.css`.
- **Aceite** (a variável `LIVRE` é a do T15):

```bash
A "$L/carrinho.html" 'document.querySelector(".comanda pre").textContent.includes("1. OD-001 · Jorge Ben")' "$LS"   # → true
A "$L/carrinho.html" '(()=>{document.querySelector("#btn-pedir").click();return [!!document.querySelector("[role=status] [data-copiar]"),/PEDIDO ABERTO NO WHATSAPP/.test(document.querySelector(".comanda").textContent),JSON.parse(localStorage["originaria.carrinho.v1"]).itens.length]})()' "$LS"   # → [true,true,1]
A "$L/carrinho.html" 'getComputedStyle(document.querySelector(".comanda")).backgroundColor' --escuro "$LS"   # → "rgb(244, 239, 230)"
A "$L/carrinho.html" '!!document.querySelector("[data-esvaziar]")' "$LS"                    # → true
A "$L/carrinho.html" "$LIVRE(\".cta-fixo\")" --tela=390x664 "$LS"                          # → [true,true,true] (o CTA fixo não cobre o bloco legal)
```

**T17. Movimento: transição entre páginas, rolagem e auditoria de reduced-motion (1 dia).**
- **Arquivo:** `css/estilo.css`.
- **Aceite:**

```bash
grep -A3 'prefers-reduced-motion: *no-preference' css/estilo.css | grep -c '@view-transition'   # → ≥1
A "$L/" 'getComputedStyle(document.querySelector("header")).viewTransitionName'            # → "none" (página com letreiro)
A "$L/carrinho.html" 'getComputedStyle(document.querySelector("header")).viewTransitionName'   # → "cabecalho"
# reduced-motion: load + clique em "Adicionar"/"+ Solicitar" + clique em "Pedir", contando todo animationstart/transitionrun que não seja fade, propriedade discreta ou cor
CLICA='(async()=>{const z=t=>new Promise(r=>setTimeout(r,t));for(const s of ["button.card__add",".bloco-compra button","#btn-pedir"]){const e=document.querySelector(s);if(e){e.click();await z(800)}}return __mov})()'
for p in "" catalogo.html "disco.html?id=726944" carrinho.html; do A "$L/$p" "$CLICA" --reduzido --movimento "$LS"; done | sort -u   # → []
for p in "" catalogo.html; do A "$L/$p" "$CLICA" --movimento "$LS" | jq 'length>0'; done | sort -u   # → true (o contador enxerga movimento quando ele existe)
```

**T18. QA e lançamento da pele: merge do `v5-pele` na main (1 dia).**
- **Pré-condições:** pendências do T11 e do Decreto resolvidas (identificação legal, validação PF/PJ, resposta automática de confirmação, frases do letreiro) e ≥ 2 semanas de linha de base em `docs/linha-de-base.csv` (aceite do T0c).
- **Aceite automático:** depois do merge, rodar `M` e `A --axe` contra `https://l3ttn.github.io/originariadiscos/` com as mesmas metas, os mesmos gates de bytes e capas e axe `[]` nas 5 páginas (inclusive `como-funciona.html`) × 2 temas.
- **Aceite manual, com print como evidência:**
  - Android real com "Remover animações" ligado;
  - Android real com a Big Shoulders bloqueada pelo DevTools remoto: o `local()` casa? O poema cabe?
  - Android real rolando a home e a ficha com e sem `--grao-opacidade:0` (painel Performance), que é a APOSTA do grão;
  - Android real: abrir a folha de filtros, marcar um filtro, fechar com toque fora e depois apertar Voltar. O filtro tem de continuar na URL, e a página tem de sair do catálogo, e não ficar parada;
  - iPhone real, para testar a View Transition e a dobra de 664 px;
  - Samsung Internet, onde as fontes de suporte divergem;
  - colar o link de uma ficha no WhatsApp: o preview mostra a imagem de marca (`img/og.png`);
  - teste com 5 pessoas: "como você compra este disco?".
- **Depois:** 2 a 4 semanas de contagem de pedidos (T0c, `fase` = `depois`), comparadas com a linha de base.

**Depois:**
- T19: `LOTE` no letreiro e chip "LOTE #N" no catálogo, só com data real.
- T20: kit de posts 1080×1350 com os tokens do site, só com o que o T0b liberar (capas ou fotos próprias).
- T21: modo campanha Tropicália, depois de ver as capas de Rogério Duarte.
- T22: Speculation Rules (prerender `moderate` do card para a ficha). A pesquisa refutou a afirmação original. Na forma corrigida: prerender no Chrome/Android 109+; Safari 26.2 só com prefetch, atrás de flag; Firefox sem suporte. A pesquisa de viabilidade recomenda. Entra com medição própria de dados gastos e de quantas transições escapam do timeout de ~4 s.
- T23: preview por disco. O Actions geraria `disco/<id>.html` estático, com `og:title` e `og:image` do disco e redirecionamento para `disco.html?id=<id>`. Só entra se o T0b liberar capa do Discogs em preview e post (decisões 2 e 4), ou com fotos próprias.

**Esforço.** São 19,85 dias-tarefa, ou cerca de 4 semanas de calendário, contando a revisão do dono e a janela da linha de base [J]:

| Bloco | Tarefas | Dias |
| --- | --- | --- |
| Instrumentos e termos | T0, T0b | 0,75 |
| Linha de base (dono) | T0c | 0 |
| Protótipos | T1 | 3,0 |
| Tronco comum | T2–T9, T9b | 4,35 |
| Pele | T10–T17 | 10,75 |
| QA e lançamento | T18 | 1 |
| **Total** | | **19,85** |

A diferença para os 16,6 da v5 tem três origens:
- **T1 corrigido**, de 2,5 para 3,0, que é a soma do próprio detalhe.
- **Tarefas novas e maiores na v5.1.** Entram o T0b e o T9b. T3, T7, T11, T15 e T17 crescem com a trava, o fallback, a clonagem, o link direto e o contador.
- **Acréscimo de 0,75 dia na v5.2.**
  - T11: og:\* e ramo do glifo.
  - T14: slug, Parede na URL e histórico da folha.
  - T15: estado de erro e reserva de espaço.

Os protótipos custam 3,0 dias e evitam refazer a pele, que custa 10,75.

---

## Afirmações

Todas foram executadas em 01/10/2026, na raiz do repositório e com as definições abaixo. As linhas M* exigem os scripts do T0.

```bash
cd /home/l3ttn/Documentos/originariadiscos
UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
G=https://fonts.gstatic.com/s; O=https://raw.githubusercontent.com/google/fonts/main/ofl
kb(){ curl -s -A "$UA" "$1" | wc -c; }
cr(){ node -e 'const L=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};const[a,b]=[L(process.argv[1]),L(process.argv[2])].sort((x,y)=>y-x);console.log(((a+.05)/(b+.05)).toFixed(2))' "$1" "$2"; }
CAPA=$(node -p 'require("./data/catalogo.json").discos[0].capa')
```

| id | afirmação | comando que verifica | valor esperado |
| --- | --- | --- | --- |
| F1 | Big Shoulders 900 opsz 72, woff2 latin | `kb $G/bigshoulders/v4/qFdk35CPh40oITJ69S3GFqy5-BQAcbz7z7beObof__ytqyTi33thrko94eTNB9k0DFVQtQ.woff2` | `13712` |
| F2 | Gabarito VF latin | `kb $G/gabarito/v9/QGYtz_0dZAGKJJ4t3HtoW4XGnfBI.woff2` | `34320` |
| F3 | Courier Prime 400 latin | `kb $G/courierprime/v11/u-450q2lgwslOqpF_6gQ8kELawFpWs39pvk.woff2` | `11192` |
| F4 | Archivo wdth 62 / 800 (A/B e P2) | `kb $G/archivo/v25/k3kPo8UDI-1M0wlSV9XA35FckqWY8Q-2trydOxKsv4Rn.woff2` | `37412` |
| F5 | Anton (controle do A/B) | `kb $G/anton/v27/1Ptgg87LROyAm3Kz-C8CSKlv.woff2` | `12004` |
| F6 | As 3 fontes da stack são OFL | `for f in bigshoulders gabarito courierprime; do curl -s $O/$f/METADATA.pb \| grep -c '^license: "OFL"'; done \| tr '\n' ' '` | `1 1 1` |
| F7 | OFL.txt publicado para as 3 | `for f in bigshoulders gabarito courierprime; do curl -s -o /dev/null -w '%{http_code} ' $O/$f/OFL.txt; done` | `200 200 200` |
| F8 | Gabarito tem designers brasileiros | `curl -s $O/gabarito/METADATA.pb \| grep -c 'Naipe Foundry, Leandro Assis'` | `1` |
| F9 | O subset latin não tem → (U+2192) | `curl -s -A "$UA" 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&display=swap' \| awk '/\/\* latin \*\//{f=1} f&&/unicode-range/{print;exit}' \| grep -c 'U+2192'` | `0` |
| F10 | Larguras dos versos a 100 px (Big Shoulders 900, Archivo 62/800, Anton), base dos k por display | `google-chrome --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "file://$PWD/scripts/larguras.html" 2>/dev/null \| grep -o '{"BS[^<]*'` | `{"BS":[411.9,330.7,413.3],"AR":[405.5,345.3,430.5],"AN":[399.2,329.8,407.3]}` |
| F11 | Fraunces wght latin, romana e itálica (P2) | `echo $(kb $G/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c7qv8oRcTn.woff2) $(kb $G/fraunces/v38/6NUs8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnbB-gzTK0K1ChJdt9vIVYX9G37lvd9mv0iQublWII.woff2)` | `36560 45624` |
| F12 | Fraunces é OFL | `curl -s $O/fraunces/METADATA.pb \| grep -c '^license: "OFL"'` | `1` |
| F13 | Larguras do artista no card a 18 px (Big Shoulders 900): "ANTONIO CARLOS JOBIM", "ANTONIO CARLOS", "ELIS REGINA &" | bloco F13 abaixo da tabela | `[159.1,112,93.6]` |
| F14 | OFL.txt das 6 famílias dos protótipos (com o cabeçalho da licença) | `for f in bigshoulders gabarito courierprime archivo anton fraunces; do curl -s $O/$f/OFL.txt \| grep -c 'SIL OPEN FONT LICENSE Version 1.1'; done \| tr '\n' ' '` | `1 1 1 1 1 1` |
| C1 | Contrastes do tema claro (tinta/papel, suave/papel, vermelho/papel, tinta/verde, branco/verde) | `echo $(cr '#111111' '#F4EFE6') $(cr '#58534B' '#F4EFE6') $(cr '#C8231A' '#F4EFE6') $(cr '#111111' '#25D366') $(cr '#FFFFFF' '#25D366')` | `16.49 6.66 4.94 9.52 1.98` |
| C2 | Contrastes do tema escuro (tinta/papel, suave/superfície, papel/vermelho, régua/superfície) | `echo $(cr '#F4EFE6' '#0F0E0D') $(cr '#ABA59B' '#1A1918') $(cr '#0F0E0D' '#FF5A47') $(cr '#7D776E' '#1A1918')` | `16.84 7.18 6.25 3.96` |
| C3 | Vermelho-cartaz no pior papel; vermelho sobre a faixa preta; vermelho-faixa | `echo $(cr '#A01A13' '#F39A45') $(cr '#C8231A' '#111111') $(cr '#FF5A47' '#111111')` | `3.59 3.34 6.12` |
| C4 | Papéis de seção com texto `#111` (Jazz, Soul, Hip Hop, Reggae, Eletrônico, Kraft) | `echo $(cr '#111111' '#9CC7EA') $(cr '#111111' '#F39A45') $(cr '#111111' '#F4A7C3') $(cr '#111111' '#C9CF5E') $(cr '#111111' '#BBA9EE') $(cr '#111111' '#D9C6A5')` | `10.58 8.56 10.04 11.30 9.01 11.30` |
| C5 | O problema no escuro: foco `#F6C324` sobre amarelo, Jazz, Reggae e Brasil; borda `#F4EFE6` e verde sobre amarelo | `echo $(cr '#F6C324' '#F6C324') $(cr '#F6C324' '#9CC7EA') $(cr '#F6C324' '#C9CF5E') $(cr '#F6C324' '#C8231A') $(cr '#F4EFE6' '#F6C324') $(cr '#25D366' '#F6C324')` | `1.00 1.08 1.01 3.44 1.44 1.20` |
| C6 | A correção: `#111` como foco e borda no amarelo e no Brasil; texto do chip Brasil (`#F4EFE6` e o `#0F0E0D` proibido); glifo `#111` no verde | `echo $(cr '#111111' '#F6C324') $(cr '#111111' '#C8231A') $(cr '#F4EFE6' '#C8231A') $(cr '#0F0E0D' '#C8231A') $(cr '#111111' '#25D366')` | `11.46 3.34 4.94 3.41 9.52` |
| C7 | Carimbo sobre `rgb(255 255 255/.92)` composto no palco Brasil (`#FBEDED`) e Jazz (`#F7FBFD`); o `#FF5A47` proibido | `echo $(cr '#C8231A' '#FBEDED') $(cr '#C8231A' '#F7FBFD') $(cr '#FF5A47' '#FBEDED')` | `4.97 5.44 2.71` |
| C8 | Tokens do P2 (tinta/papel, acento/papel, acento/kraft, tinta/papel de seção, acento escuro/papel e superfície, foco escuro/superfície) | `echo $(cr '#111111' '#F3EEE3') $(cr '#AD3A16' '#F3EEE3') $(cr '#AD3A16' '#E8D9B5') $(cr '#111111' '#E9E2D3') $(cr '#F0855F' '#0F0E0D') $(cr '#F0855F' '#1A1918') $(cr '#E8D9B5' '#1A1918')` | `16.32 5.35 4.43 14.64 7.55 6.88 12.56` |
| C9 | O furo dos impressos antes da v5.2: `#ABA59B` sobre comanda, amarelo e Jazz; `#FF5A47` sobre a comanda; `#58534B` sobre Jazz e Brasil | `echo $(cr '#ABA59B' '#F4EFE6') $(cr '#ABA59B' '#F6C324') $(cr '#ABA59B' '#9CC7EA') $(cr '#FF5A47' '#F4EFE6') $(cr '#58534B' '#9CC7EA') $(cr '#58534B' '#C8231A')` | `2.14 1.48 1.37 2.69 4.27 1.35` |
| C10 | `#761210`, vermelho fixo dos impressos, sobre Soul, Jazz, Hip Hop, Reggae, Eletrônico, kraft, amarelo, creme e branco; e o `#C8231A` sugerido, sobre Soul, Jazz e amarelo | `echo $(for p in F39A45 9CC7EA F4A7C3 C9CF5E BBA9EE D9C6A5 F6C324 F4EFE6 FFFFFF; do cr '#761210' "#$p"; done) $(for p in F39A45 9CC7EA F6C324; do cr '#C8231A' "#$p"; done)` | `5.11 6.31 5.99 6.74 5.38 6.74 6.84 9.84 11.26 2.56 3.17 3.44` |
| C11 | `#F4EFE6` sobre o ponto do meio-tom; vermelho fixo do P2 (`#9A3313`) sobre papel de seção, kraft e papel; `#F4EFE6` sobre o papel de seção do P2; acento do P2 sobre o kraft | `echo $(cr '#F4EFE6' '#9A1B14') $(cr '#9A3313' '#E9E2D3') $(cr '#9A3313' '#E8D9B5') $(cr '#9A3313' '#F3EEE3') $(cr '#F4EFE6' '#E9E2D3') $(cr '#AD3A16' '#E8D9B5')` | `7.22 5.70 5.26 6.35 1.13 4.43` |
| D1 | 51 discos, todos esgotados e sem preço | `node -p 'const d=require("./data/catalogo.json").discos;[d.length,d.filter(x=>x.status==="esgotado").length,d.filter(x=>x.preco==null).length].join(" ")'` | `51 51 51` |
| D2 | `adicionadoEm` é único e o primeiro disco é 726944 (OD-001); maior artista e maior título; seções; comentários | `node -p 'const d=require("./data/catalogo.json").discos;[new Set(d.map(x=>x.adicionadoEm)).size,[...d].sort((a,b)=>a.adicionadoEm.localeCompare(b.adicionadoEm)\|\|a.ordem-b.ordem)[0].id,Math.max(...d.map(x=>x.artista.length)),Math.max(...d.map(x=>x.titulo.length)),new Set(d.map(x=>x.secao)).size,d.filter(x=>x.comentario).length].join(" ")'` | `51 726944 34 32 7 3` |
| D3 | `catalogo.json` em gzip -9 | `gzip -9c data/catalogo.json \| wc -c` | `49491` |
| D4 | Índice enxuto (campos do T4, com `secaoSlug`) em gzip -9; sem o `secaoSlug` dava 8478 | `node -e 'const S=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s*\/\s*\|\s+/g,"-");const d=require("./data/catalogo.json").discos;const p=x=>({id:x.id,artista:x.artista,titulo:x.titulo,ano:x.ano,selo:x.selo,catno:x.catno,pais:x.pais,formatoTipo:x.formatoTipo,formatoLabel:x.formatoLabel,cor:x.cor,edicao:x.edicao,generos:x.generos,capa:x.capa,status:x.status,preco:x.preco,secao:x.secao,secaoSlug:S(x.secao),destaque:x.destaque,novo:x.novo,adicionadoEm:x.adicionadoEm,ordem:x.ordem,edicaoVenda:x.edicaoVenda&&{id:x.edicaoVenda.id,ano:x.edicaoVenda.ano,selo:x.edicaoVenda.selo,catno:x.edicaoVenda.catno,pais:x.edicaoVenda.pais}});process.stdout.write(JSON.stringify({discos:d.map(p)}))' \| gzip -9 \| wc -c` | `8547` |
| D5 | Maior disco isolado em gzip -9 | `node -e 'const d=require("./data/catalogo.json").discos;process.stdout.write(JSON.stringify(d.reduce((a,b)=>JSON.stringify(b).length>JSON.stringify(a).length?b:a)))' \| gzip -9 \| wc -c` | `2694` |
| D6 | 16 discos têm lados de C a F; lados de 7383499 (3LP) e de 242785 (`pos` "1A") | `node -p 'const d=require("./data/catalogo.json").discos;const l=p=>((p\|\|"").match(/^\d*([A-Z])/i)\|\|[])[1];const s=id=>[...new Set(d.find(x=>x.id===id).faixas.map(t=>l(t.pos)))].join("");[d.filter(x=>x.faixas.some(t=>/[C-F]/i.test(l(t.pos)\|\|""))).length,s(7383499),s(242785)].join(" ")'` | `16 ABCDEF ABCD` |
| D7 | `home.json` com o esquema de **Dados por página** (slug, `secaoSlug` e capas do leque com preferência), em gzip -9 | bloco D7 abaixo da tabela | `2878` |
| D8 | Slugs das 7 seções, na ordem em que aparecem nos dados | `node -p 'const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s*\/\s*\|\s+/g,"-");[...new Set(require("./data/catalogo.json").discos.map(x=>slug(x.secao)))].join(" ")'` | `brasil jazz soul-funk hip-hop reggae-dub eletronico rock-psicodelico` |
| D9 | Capas únicas em destaques + novidades; capas do leque que não repetem nenhuma delas, pela regra antiga e com a preferência | bloco D9 abaixo da tabela | `15 15 9` |
| R1 | Google Fonts e `intro.js` presentes nas 4 páginas (meta pós-T7/T8: `0 0`) | `echo $(grep -l 'fonts.googleapis.com' *.html \| wc -l) $(grep -l 'js/intro.js' *.html \| wc -l)` | `4 4` |
| R2 | Card cria toda capa com `lazy` | `grep -c "img.loading = 'lazy'" js/card.js` | `1` |
| R3 | Botão WhatsApp com texto branco (meta pós-T9: `0`) | `grep -A2 '^\.btn--whatsapp {' css/estilo.css \| grep -c '#ffffff'` | `1` |
| R4 | Workflow adiciona só 3 arquivos e o commit tem `continue-on-error` | `echo $(grep -c 'git add data/catalogo.json data/resolvidos.json data/pendentes.txt' .github/workflows/build-deploy.yml) $(grep -c 'continue-on-error: true' .github/workflows/build-deploy.yml)` | `1 1` |
| R5 | Vidro no header; CSS em gzip (meta: `0` e ≤ 10240) | `echo $(grep -c backdrop-filter css/estilo.css) $(gzip -9c css/estilo.css \| wc -c)` | `2 5128` |
| R6 | Coleções limitadas a 4 | `grep -c 'slice(0, 4)' js/catalogo.js` | `1` |
| R7 | Preço sem centavos hoje; chave do carrinho | `echo $(grep -c "toLocaleString('pt-BR')" js/carrinho.js) $(grep -c "originaria.carrinho.v1" js/carrinho.js)` | `1 1` |
| R8 | Testes atuais | `npm test 2>&1 \| grep -E '^# (pass\|fail)' \| tr '\n' ' '` | `# pass 192 # fail 0` |
| R9 | O número placeholder está no ar | `curl -s https://l3ttn.github.io/originariadiscos/js/config.js \| grep -c 5547900000000` | `1` |
| R10 | Arquivos de desenvolvimento publicados no Pages | `for p in scripts/build-catalogo.mjs tests/filtros.test.mjs CONTRATO.md; do curl -s -o /dev/null -w '%{http_code} ' https://l3ttn.github.io/originariadiscos/$p; done` | `200 200 200` |
| R11 | O commit do workflow falha e nunca chegou à main | `echo $(gh run view 36933746919 --repo l3ttn/originariadiscos --log \| grep -c 'cannot pull with rebase') $(git log origin/main --oneline --grep='build automático' \| wc -l)` | `1 0` |
| R12 | A regra global de reduced-motion do v4 existe (meta pós-T10: `0 0`) | `echo $(grep -c 'animation-duration: 0.01ms !important' css/estilo.css) $(grep -c 'transition-duration: 0.01ms !important' css/estilo.css)` | `1 1` |
| R13 | Nenhuma página tem og:\* hoje | `grep -l 'property="og:' *.html \| wc -l` | `0` |
| R14 | O filtro compara o nome cru da seção, e as tiras de hoje linkam pelo nome | `echo $(grep -c 'd.secao !== secao' js/filtros.js) $(grep -cF 'secao=${encodeURIComponent(s.nome)}' js/pagina-index.js)` | `1 1` |
| R15 | A ficha do v4 já tem o estado "Disco não encontrado" | `grep -c "'Disco não encontrado'" js/pagina-disco.js` | `1` |
| R16 | O wordmark é `<img>` nas 4 páginas | `grep -l '<img src="img/logo.svg"' *.html \| wc -l` | `4` |
| W1 | Capa do Discogs sem CORS | `curl -sI -A "$UA" -H 'Origin: https://l3ttn.github.io' "$CAPA" \| grep -ci '^access-control-allow-origin'` | `0` |
| W2 | Capa do OD-001 é JPEG de 85 KB | `curl -sI -A "$UA" "$CAPA" \| grep -iE '^content-(type\|length)' \| tr -d '\r' \| tr '\n' ' '` | `content-type: image/jpeg content-length: 85278` |
| W3 | VT entre páginas: Firefox 144 parcial, Samsung 30 não, iOS 18.2 sim, 85,97% | `curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/cross-document-view-transitions.json \| jq -r '[.stats.firefox["144"],.stats.samsung["30"],.stats.ios_saf["18.2"],.usage_perc_y]\|@tsv'` | `a #2  n  y  85.97` |
| W4 | Baseline (view-transitions, popover, starting-style, text-wrap-balance, cross-document, scroll-driven, container-queries, has) | `for f in view-transitions popover starting-style text-wrap-balance cross-document-view-transitions scroll-driven-animations container-queries has; do curl -s https://api.webstatus.dev/v1/features/$f \| jq -r .baseline.status; done \| tr '\n' ' '` | `newly newly newly newly limited limited widely widely` |
| W5 | Web Share e `-webkit-text-stroke` (uso global) | `echo $(curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/web-share.json \| jq -r .usage_perc_y) $(curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/text-stroke.json \| jq -r '.usage_perc_y+.usage_perc_a')` | `89.7 97.03` |
| W6 | GSAP não tem licença OSI | `curl -s https://cdn.jsdelivr.net/npm/gsap@3.15.0/package.json \| jq -r .license` | `Standard 'no charge' license: https://gsap.com/standard-license.` |
| W7 | axe-core fixado e sua licença | `curl -s https://cdn.jsdelivr.net/npm/axe-core@4.13.0/package.json \| jq -r '.version+" "+.license'` | `4.13.0 MPL-2.0` |
| W8 | As 51 capas: mínimo, mediana e máximo de content-length (51 HEAD, 0,4 s entre pedidos; a pesquisa viu 429 depois de ~100 em 1 min) | `node -p 'require("./data/catalogo.json").discos.map(x=>x.capa).join("\n")' \| while read u; do curl -sI -A "$UA" "$u" \| tr -d '\r' \| awk -F': ' 'tolower($1)=="content-length"{print $2}'; sleep 0.4; done \| sort -n \| awk '{a[NR]=$1} END{print a[1],a[26],a[51]}'` | `31695 98232 210431` |
| W9 | IntersectionObserver é Baseline widely | `curl -s https://api.webstatus.dev/v1/features/intersection-observer \| jq -r .baseline.status` | `widely` |
| M1 | LCP da home ao vivo é IMG, acima de 4 s, com 4 origens | `node scripts/medir.mjs https://l3ttn.github.io/originariadiscos/ 3 \| jq -c '[.elemento,.lcp_ms>4000,(.origens\|length)]'` | `["IMG",true,4]` |
| M2 | Ficha ao vivo: IMG, entre 2,0 e 2,9 s, com CLS acima de 0,02 | `node scripts/medir.mjs 'https://l3ttn.github.io/originariadiscos/disco.html?id=726944' 3 \| jq -c '[.elemento,(.lcp_ms>2000 and .lcp_ms<2900),.cls>0.02]'` | `["IMG",true,true]` |
| M3 | Violações do axe na home ao vivo | `node scripts/avaliar.mjs https://l3ttn.github.io/originariadiscos/ '' --axe` | `["color-contrast:2"]` |
| M4 | Reduced-motion pelo gate antigo: nenhuma animação rodando na home ao vivo depois de load + 2 s | `node scripts/avaliar.mjs https://l3ttn.github.io/originariadiscos/ 'document.getAnimations().filter(a=>a.playState==="running").length' --reduzido` | `0` |
| M5 | Carrinho semeado por `--ls` renderiza o item | `node scripts/avaliar.mjs https://l3ttn.github.io/originariadiscos/carrinho.html 'document.body.textContent.includes("África Brasil")' --ls='{"originaria.carrinho.v1":"{\"itens\":[{\"id\":726944,\"qtd\":1}],\"obs\":\"\"}"}'` | `true` |
| M6 | O contador novo pega o que o M4 não vê: com `--reduzido`, o skeleton do v4 começa a pulsar (re-medido com a lista ampliada da v5.2) | `node scripts/avaliar.mjs https://l3ttn.github.io/originariadiscos/ '[...new Set(__mov.map(x=>x.split(":")[1]))]' --movimento --reduzido` | `["skeleton-pulsar"]` |
| M7 | Primeira vista da home ao vivo: 9 capas e mais de 100 KB fora do Discogs | `node scripts/medir.mjs https://l3ttn.github.io/originariadiscos/ 1 \| jq -c '[.capas,.bytes_site>100000,.bytes>900000]'` | `[9,true,true]` |
| M8 | Rolagem completa da home ao vivo: 18 capas, mais de 1,5 MB no total e menos de 130 KB fora do Discogs (medido: 1.829.049 B e 121.214 B) | `node scripts/medir.mjs https://l3ttn.github.io/originariadiscos/ 1 --rolar \| jq -c '[.capas,.bytes>1500000,.bytes_site<130000]'` | `[18,true,true]` |

Bloco D7 (esquema de **Dados por página**, com `geradoEm` fixo para o tamanho ser reproduzível):

```bash
node -e 'const S=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s*\/\s*|\s+/g,"-");const d=require("./data/catalogo.json").discos;const o=[...d].sort((a,b)=>a.adicionadoEm.localeCompare(b.adicionadoEm)||a.ordem-b.ordem);const C=new Map(o.map((x,i)=>[x.id,"OD-"+String(i+1).padStart(3,"0")]));const k=x=>({id:x.id,codigo:C.get(x.id),artista:x.artista,titulo:x.titulo,ano:x.ano,formatoTipo:x.formatoTipo,formatoLabel:x.formatoLabel,edicaoLinha:x.edicaoVenda?[x.edicaoVenda.selo,x.edicaoVenda.ano].filter(Boolean).join(" "):null,capa:x.capa,status:x.status,preco:x.preco,secao:x.secao,secaoSlug:S(x.secao),novo:!!x.novo});const r=[...d].sort((a,b)=>b.adicionadoEm.localeCompare(a.adicionadoEm));const ds=d.filter(x=>x.destaque);const D=(ds.length?ds:r).slice(0,3),N=[...d].sort((a,b)=>(b.novo?1:0)-(a.novo?1:0)||b.adicionadoEm.localeCompare(a.adicionadoEm)||a.ordem-b.ordem).slice(0,12);const v=new Set([...D,...N].map(x=>x.capa));const g={};for(const x of d)(g[x.secao]??=[]).push(x);process.stdout.write(JSON.stringify({geradoEm:"2026-10-01T00:00:00.000Z",destaques:D.map(k),novidades:N.map(k),secoes:Object.entries(g).sort((a,b)=>b[1].length-a[1].length).map(([n,xs])=>({slug:S(n),nome:n,contagem:xs.length,capas:[...xs].sort((a,b)=>v.has(b.capa)-v.has(a.capa)).slice(0,3).map(x=>x.capa)}))}))' | gzip -9 | wc -c   # → 2878
```

Bloco D9 (capas do leque):

```bash
node -e 'const d=require("./data/catalogo.json").discos;const r=[...d].sort((a,b)=>b.adicionadoEm.localeCompare(a.adicionadoEm));const ds=d.filter(x=>x.destaque);const v=new Set([...(ds.length?ds:r).slice(0,3),...[...d].sort((a,b)=>(b.novo?1:0)-(a.novo?1:0)||b.adicionadoEm.localeCompare(a.adicionadoEm)||a.ordem-b.ordem).slice(0,12)].map(x=>x.capa));const g={};for(const x of d)(g[x.secao]??=[]).push(x);const A=new Set(),B=new Set();for(const xs of Object.values(g)){xs.slice(0,3).forEach(x=>A.add(x.capa));[...xs].sort((a,b)=>v.has(b.capa)-v.has(a.capa)).slice(0,3).forEach(x=>B.add(x.capa))}const f=s=>[...s].filter(c=>!v.has(c)).length;console.log(v.size,f(A),f(B))'   # → 15 15 9
```

Bloco F13 (larguras do artista no card a 18 px):

```bash
T=$(mktemp -d); cat > $T/l.html <<'EOF'
<!doctype html><meta charset=utf-8><style>@font-face{font-family:BS;src:url(https://fonts.gstatic.com/s/bigshoulders/v4/qFdk35CPh40oITJ69S3GFqy5-BQAcbz7z7beObof__ytqyTi33thrko94eTNB9k0DFVQtQ.woff2)}span{font:900 18px BS;white-space:nowrap;text-transform:uppercase}</style><div id=o></div><script>
const v=['ANTONIO CARLOS JOBIM','ANTONIO CARLOS','ELIS REGINA &'];(async()=>{await document.fonts.load('900 18px BS');o.textContent=JSON.stringify(v.map(t=>{const s=document.createElement('span');s.textContent=t;document.body.append(s);const w=s.getBoundingClientRect().width;s.remove();return +w.toFixed(1)}))})()</script>
EOF
google-chrome --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "file://$T/l.html" 2>/dev/null | grep -o '\[[0-9.,]*\]'   # → [159.1,112,93.6]
```

---

## Referências

URLs conferidas em 01/10/2026. A marca * indica bloqueio a curl (403 ou 400): a página abre no Chrome headless com o título esperado.

| # | Referência | URL | O que levar |
| --- | --- | --- | --- |
| 1 | ISMO: Cesar Villela e a Bossa Gráfica da Elenco | https://www.ismo.mov/cesar-villela-e-a-bossa-grafica-da-elenco/ | P&B de alto contraste e um vermelho; coleção como sistema; pontos como linguagem, sem copiar as 4 bolinhas ao lado do logo |
| 2 | Concretismo na poesia de Augusto de Campos (ARS/SciELO) | https://www.scielo.br/j/ars/a/hz8sNQ9wLYqBxxJwqdMK3Gs/?lang=pt | Palavra como forma e grade "como escala musical": o poema do hero e o do rodapé |
| 3 | Lambe-lambe da Gráfica Fidalga (webdoc)* | https://lambelambewebdoc.wordpress.com/a-grafica-fidalga/ | Só tipo, duas tintas, papel colorido: as tiras de coleção e a faixa "Procurando" |
| 4 | Três Selos Rocinante | https://www.tresselosrocinante.com/ | Grade de especificações (À venda × Original), Lado A e Lado B, meio-tom vermelho |
| 5 | Numero Group | https://numerogroup.com/ | Código de catálogo em caixa (OD-001), título vazado, vinil saindo da capa |
| 6 | GOMA | https://g-o-m-a.com/ | Só o letreiro com pausa e o esgotado com a capa intacta. Linha ↘▪ e wordmark gigante ficam com eles |
| 7 | Rough Trade | https://www.roughtrade.com/ | Botão de largura total que muda com o estado; filtro e ordenação como dois botões |
| 8 | Beats in Space (records) | https://www.beatsinspace.net/records | Parede de capas; dock inferior fixa |
| 9 | Vinyl Me, Please | https://vinylmeplease.com/ | Código do disco dentro da mensagem; canal de mensagem como marca |
| 10 | Noize Record Club | https://www.noizerecordclub.com.br/ | Numeração e urgência só com data real (`LOTE`) |
| 11 | Plastic | https://myplastic.app | Vinil vazando pela borda; JS sem framework respeitando reduced-motion |
| 12 | Paul Kalkbrenner | https://www.paulkalkbrenner.net/ | Objeto dentro da palavra (o "O" em forma de disco) e nenhum preloader |
| 13 | Visual (Archives) Society | https://visualsociety.ch/ | Filtros como checkbox de texto "[x] Jazz" |
| 14 | Made in Quebrada Discos | https://www.madeinquebradadiscos.com.br/ | Régua do comprador brasileiro: "lacrado", R$ com vírgula, Pix e frete visíveis, que o visual não pode esconder |
| 15 | Baymard: produtos esgotados | https://baymard.com/blog/handling-out-of-stock-products | Esgotado vira encomenda com prazo maior e alternativas logo abaixo |
| 16 | Baymard: lista e filtros | https://baymard.com/blog/current-state-product-list-and-filtering | Pílulas de filtros aplicados acima da grade |
| 17 | Baymard: 35 boas práticas (#791, #957) | https://baymard.com/blog/ecommerce-ux-best-practices | CTA fixo com respiro e sem largura total; hero sem carrossel automático |
| 18 | NN/g: bottom sheets | https://www.nngroup.com/articles/bottom-sheet/ | X visível e o Voltar fecha a folha |
| 19 | Chrome for Developers: VT entre documentos | https://developer.chrome.com/docs/web-platform/view-transitions/cross-document | Opt-in, `pageswap`/`pagereveal`, `blocking=render` com parcimônia, timeout de ~4 s |
| 20 | Chrome for Developers: VT no mesmo documento | https://developer.chrome.com/docs/web-platform/view-transitions/same-document | Dados antes da transição; callback síncrono |
| 21 | web.dev: Optimize LCP | https://web.dev/articles/optimize-lcp | Elemento LCP descoberto no HTML, `fetchpriority`, nunca `lazy` no LCP |
| 22 | WCAG 2.2.2 Pause, Stop, Hide* | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html | Pausa obrigatória no letreiro |
| 23 | Utopia | https://utopia.fyi/ | Escala fluida com `clamp()` sem breakpoints de fonte |
| 24 | Decreto 7.962/2013 (o DNS local falhou; a pesquisa leu a página por IP forçado) | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm | Identificação legal no rodapé, formas de pagamento, sumário antes do envio (a comanda), confirmação imediata do recebimento e resposta em até 5 dias (art. 4º III e V), arrependimento em 7 dias |
| 25 | Meta: WhatsApp brand guidelines* | https://www.meta.com/en-us/brand/resources/whatsapp/whatsapp-brand/ | Glifo oficial sem alteração de cor ou forma (a versão escura é conferida no T11; sem evidência, os botões ficam sem glifo), grafia "WhatsApp", nunca mais proeminente que a marca da loja |
| 26 | Discogs: API Terms of Use (27/05/2025; lidos pela pesquisa no Chrome headless)* | https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use | Defasagem máxima de 6 h, nada de cache além do necessário, proibição de "drive traffic to other non-Discogs websites", "Data provided by Discogs." junto do dado com link sem `nofollow`, aviso de não afiliação, capas fora do CC0 (T0b) |

---

## Apêndice A — teste de mesa das tarefas iniciais (2026-10-01, obrigatório antes de despachar)

Teste adversarial feito por um agente independente sobre o repo em `f9c5d9d`, só com comandos read-only e simulações em cópia. **Veredito: executáveis com ajustes.** Os arquivos, funções e seletores que as tarefas citam existem. As 14 afirmações locais conferidas (R1, R4, R6, R8, D1–D5, D7–D9, C1, C10) bateram, e as fontes F1–F5 e F11 conferiram por `curl -sI`. O problema está nos critérios de aceite.

### A.1 Critérios que passam hoje, sem a tarefa feita (inúteis como aceite)

| tarefa | problema | evidência | correção |
| --- | --- | --- | --- |
| T0 | `npm test \| grep '^# fail'` já dá `# fail 0` e não prova que `tests/contraste.test.mjs` existe | `test -e tests/contraste.test.mjs` → rc=1 | `node --test tests/contraste.test.mjs` com `# tests ≥ N` (N lacrado) e `# fail 0`, mais uma mutação: marcar um par proibido como permitido tem de dar `fail ≥ 1` |
| T0b | `grep -c 'Data provided by Discogs' CONTRATO.md` já dá 2 | linhas 11 e 136 do CONTRATO | contar só dentro da seção: `awk '/^## Discogs/{f=1;next}/^## /{f=0}f' CONTRATO.md \| grep -c 'Data provided by Discogs'` |
| T1 | o grep do `noindex` dá 0 sem arquivo nenhum | `grep -L … prototipos/*.html` → "No such file" e `0` | somar `find prototipos -name '*.html' \| wc -l` ≥ 10 |
| T2 | o "teste do checker" já passa e roda o arquivo do próprio maker | `node --test --test-name-pattern='código OD' tests/pipeline.test.mjs` → `# pass 1` | teste lacrado pelo checker, fora da worktree, importando `atribuirCodigos`, com `# pass ≥ 4` |
| T4 | gates de tamanho passam com arquivo ausente (vira 0) | `[ $(gzip -9c data/indice.json \| wc -c) -le 10240 ] && echo ok` → `ok` | prefixar `test -s data/indice.json &&` (idem `home.json`) |

### A.2 Critérios que reprovam trabalho certo nesta máquina

| onde | problema | correção |
| --- | --- | --- |
| todo aceite com `ls … \| wc -l` (T1 prints/OFL, T4 `data/discos`) | `ls` é alias de `eza --icons` no shell do Bash tool: `ls js/*.js \| wc -l` → erro e `0` | `find … \| wc -l` ou `command ls` |
| todo aceite com as funções `M`, `A`, `L`, `LS` | função/variável não sobrevive entre chamadas do Bash tool | `scripts/sessao.sh` com as definições, usado com `source` em cada linha, ou `node scripts/medir.mjs` com a URL literal |
| T4 | contar `data/catalogo.json` pega comentário (`js/youtube.js:2`) | contar só `fetch(` com `catalogo.json` |
| T1 | `.poema span` com `length===3` conta o span do "O" se o maker usar `<span>` (o texto pede `::before`, linha ~1618) | `.poema > span` |
| T1 | o aceite fixa `OFL-courierprime.txt`, mas a tabela só diz "+ OFL" para Gabarito, Courier Prime e Anton | pôr os 6 nomes de arquivo OFL no briefing |

### A.3 Critérios cegos ao erro que deveriam pegar

| tarefa | problema | correção |
| --- | --- | --- |
| T3 | o `awk` dá PASS se sobrar o `git pull` antigo antes do commit (a falha que o T3 corrige) | `awk '/git pull/&&!p{p=NR}/git commit/&&!c{c=NR}END{print(c>0&&p>c)}'` |
| T3 | `gh api …?path=data/codigos.json` pós-merge dá falso negativo logo depois do T2 (o mapa não renumera, o bot não commita) | aceitar só o caminho "disco novo", ou checar no log da execução `Atualiza catálogo (build automático)` |
| T2 | o aceite não pega "código derivado de `ordem`": 726944 é OD-001 nas duas ordens, mas 44 de 51 posições diferem | lacrar agora o mapa completo id→código pela ordem de `adicionadoEm` e comparar os 51 |

### A.4 Lacunas de escopo e de ordem

1. **Número real do WhatsApp sem dono.** Trocar `js/config.js` quebra `tests/whatsapp.test.mjs:46` (fixa `'5547900000000'`). Criar micro-tarefa **T0d**: o dono informa o número; `config.js` muda; o teste passa a afirmar `!== '5547900000000'` e `/^55\d{10,11}$/`. T1, T3 e T9 dependem dela.
2. **T4 depende do T2** (o índice usa `codigo`), não só do T0b. **T2 depende do T3** e o T3 espera o número do dono: dividir o T3 em **T3a** (commit do Actions + artefato; sem dependência) e **T3b** (trava do placeholder; depende da T0d).
3. **T0 mistura instrumentos com §Ganchos do CONTRATO** (que exige OK do dono). Separar: instrumentos em commit próprio na `main` antes de qualquer maker (e lacrados: sha256 em `~/Documentos/originariadiscos-lacres/`), §Ganchos junto com o T0b. O checker roda a cópia lacrada ou exige `git diff main -- scripts/{cdp,medir,avaliar,servir,contraste}.mjs` vazio.
4. **T2/T4 precisam do build inteiro no Discogs** (cache vazio e gitignored, 2,6 s por chamada; a rebusca muda o `catalogo.json` e os números medidos). Criar passo sem rede (`--sem-rede` ou `scripts/derivar.mjs` a partir do `catalogo.json`) e decidir se os dados gerados entram no PR.
5. **Regressão na home v4 sem aceite que pegue (T4).** `js/pagina-index.js:81,94` lê `s.capa`/`s.quantidade`; o `home.json` traz `capas`/`contagem` e 7 seções; `js/intro.js:4` importa `catalogoPronto`. Manter `secoes()` no formato v4 (`nome`, `quantidade`, `capa`, até 4) até o T13 e `catalogoPronto` exportado enquanto a abertura existir. Aceite: `[document.querySelectorAll("#colecoes-grid a.colecao").length, document.getElementById("colecoes-grid").innerText.includes("undefined")]` → `[4,false]`.
6. **D4 subestima o índice**: sem o campo `codigo` dá 8.547 B gz; com ele, **8.721 B gz** (171 B por disco). Os gates continuam passando.
