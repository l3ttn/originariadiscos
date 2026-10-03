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
