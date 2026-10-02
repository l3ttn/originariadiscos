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
