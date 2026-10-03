# Originária Discos

Vitrine de vinil novo/lacrado. Sem carrinho: cada disco leva ao WhatsApp e o atendimento é 1:1.
Os dados dos discos vêm do Discogs (`scripts/build-catalogo.mjs` lê `discos.txt` e gera `data/catalogo.json`).

## Como adicionar um disco (3 passos)

1. Abra `discos.txt` e adicione uma linha na seção certa (ou crie uma nova com `## Nome da Seção`):
   `Artista – Título` (ou cole a URL do release/master do Discogs). Depois de `|` dá pra
   marcar `destaque`, `novo`, `status=disponivel|encomenda|esgotado`, `preco=180`,
   `secao=Nome` e `nota=comentário curto`.
2. Rode `git pull --rebase` antes de editar, depois dê commit e `git push` só do `discos.txt`
   (se o push for recusado porque o Actions commitou nesse meio-tempo, rode `git pull --rebase`
   de novo e repita o push). O GitHub Actions gera o catálogo a partir dele, commita o `data/`
   sozinho ("Atualiza catálogo (build automático)") e publica o site em poucos minutos. Não
   precisa rodar nada no computador.
3. Confira `data/pendentes.txt` depois do build: uma linha que não foi encontrada no Discogs,
   ou que o script não teve certeza de qual prensagem é a certa (`VERIFICAR: ...`), aparece
   ali — não quebra o site, mas vale checar. `npm run catalogo` continua servindo para ver o
   resultado no computador antes do push, mas não commite o `data/` gerado: quem commita é o
   Actions, e commit dos dois lados dá conflito. Depois de olhar, desfaça com
   `git restore data/catalogo.json data/resolvidos.json data/pendentes.txt` (senão o
   próximo `git pull --rebase` recusa).

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

## Como precificar (4 passos)

1. Rode `npm run varejo` antes de `npm run precos` (≈ 10–20 min, por causa do intervalo de
   10 s que as lojas pedem) para gerar `data/precos-varejo.json` com ofertas de lojas
   brasileiras de vinil novo. Sem esse arquivo, `npm run precos` roda igual, só sem a coluna
   de varejo BR no relatório.
2. Rode `npm run precos` (usa `data/catalogo.json`; rode `git pull --rebase` antes para pegar
   o catálogo que o Actions gerou). O script consulta o Discogs Marketplace disco a disco — sem
   `DISCOGS_TOKEN` já traz o menor anúncio à venda em BRL; com um token em
   `Settings → Developers` no discogs.com (`export DISCOGS_TOKEN=...` antes de rodar), também
   traz a sugestão de preço por condição (Mint, Near Mint) na moeda da sua conta.
3. Leia `data/precos-relatorio.md`: uma linha por disco com à venda, menor anúncio, sugestão,
   preços observados manualmente (`data/precos-observados.csv`) e a referência (mediana das
   fontes disponíveis) ao lado do preço atual em `discos.txt`.
4. Rode `npm run precos -- --propor` (aceita `--margem=1.10` etc., padrão `1.00`) para gerar
   `discos.propostos.txt` — cópia de `discos.txt` com `preco=` preenchido (referência × margem,
   arredondado para múltiplo de 5) só nas linhas que ainda não tinham preço. Copie pra
   `discos.txt` as linhas que você aprovar; `discos.propostos.txt` nunca é commitado nem lido
   pelo site.

Preços observados manualmente (grupos de WhatsApp, lojas) entram em
`data/precos-observados.csv` (`id,preco,fonte,data,link`, `id` = release id do Discogs).

Para fixar a edição que você vende, acrescente `| edicao=<link do release no Discogs>` na
linha do disco.

Como a loja vende novo/lacrado, a referência **não** usa o preço da prensagem original de
colecionador — ela busca a reedição em vinil oficial mais recente de cada disco (a mais nova do
Brasil e a mais nova no geral) e usa o menor anúncio dela; a prensagem original só entra na
conta se nenhuma reedição tiver exemplar à venda. O relatório mostra as duas colunas lado a
lado (`original` e `reedição`) para o dono comparar.

## Trocar WhatsApp / logo / Instagram

- **WhatsApp, Instagram, nome da loja e URL do site**: `js/config.js`.
- **Logo**: `img/logo.svg` (o header cai para o nome em texto se o arquivo não existir).
- **Cores e tipografia**: os tokens em `css/estilo.css`, bloco `:root`
  (`--cor-fundo`, `--cor-texto`, `--cor-acento`, `--fonte`).

## Secret opcional

O workflow de build/deploy usa o secret `DISCOGS_TOKEN` (Settings → Secrets → Actions) se ele
existir, só para aumentar o limite de chamadas à API do Discogs — sem ele o pipeline funciona
do mesmo jeito, só que mais devagar. O cron (`schedule: '0 */6 * * *'`) para sozinho se não
houver nenhum `push` em `main` há mais de 60 dias (os commits automáticos do catálogo não
contam), pra não gastar minutos de Actions num repositório abandonado; um `workflow_dispatch`
manual sempre funciona, e qualquer `push` reativa o cron.
