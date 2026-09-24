# Originária Discos

Vitrine de vinil novo/lacrado. Sem carrinho: cada disco leva ao WhatsApp e o atendimento é 1:1.
Os dados dos discos vêm do Discogs (`scripts/build-catalogo.mjs` lê `discos.txt` e gera `data/catalogo.json`).

## Como adicionar um disco (3 passos)

1. Abra `discos.txt` e adicione uma linha na seção certa (ou crie uma nova com `## Nome da Seção`):
   `Artista – Título` (ou cole a URL do release/master do Discogs). Depois de `|` dá pra
   marcar `destaque`, `novo`, `status=disponivel|encomenda|esgotado`, `preco=180`,
   `secao=Nome` e `nota=comentário curto`.
2. Rode `npm run catalogo` localmente (ou apenas dê `git push` — o cron do GitHub Actions
   também gera o catálogo sozinho a cada 6h). Confira `data/pendentes.txt`: uma linha que
   não foi encontrada no Discogs, ou que o script não teve certeza de qual prensagem é a
   certa (`VERIFICAR: ...`), aparece ali — não quebra o site, mas vale checar.
3. Dê commit e push em `data/catalogo.json`, `data/resolvidos.json` e `discos.txt`. O deploy
   no GitHub Pages acontece sozinho a cada push em `main`.

## Rodar local

```
npm run catalogo   # gera data/catalogo.json a partir de discos.txt (chama a API do Discogs)
npm run dev        # sobe o site em http://localhost:8080
npm test           # roda os testes (node --test)
npm run lint       # checa a sintaxe dos .js/.mjs
```

`npm run catalogo` demora alguns minutos (o script espera ~2,6s entre chamadas para respeitar
o limite de taxa do Discogs). Rode `npm run catalogo -- --force` para ignorar o cache de
releases em `data/cache/` e buscar tudo de novo.

## Trocar WhatsApp / logo / Instagram

- **WhatsApp, Instagram, nome da loja e URL do site**: `js/config.js`.
- **Logo**: `img/logo.svg` (o header cai para o nome em texto se o arquivo não existir).
- **Cores e tipografia**: os tokens em `css/estilo.css`, bloco `:root`
  (`--cor-fundo`, `--cor-texto`, `--cor-acento`, `--fonte`).

## Secret opcional

O workflow de build/deploy usa o secret `DISCOGS_TOKEN` (Settings → Secrets → Actions) se ele
existir, só para aumentar o limite de chamadas à API do Discogs — sem ele o pipeline funciona
do mesmo jeito, só que mais devagar. O cron (`schedule: '0 */6 * * *'`) para sozinho se não
houver nenhum `push` em `main` há mais de 60 dias, pra não gastar minutos de Actions num
repositório abandonado; um `workflow_dispatch` manual sempre funciona, e qualquer `push`
reativa o cron.
