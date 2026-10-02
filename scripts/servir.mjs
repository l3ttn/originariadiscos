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
