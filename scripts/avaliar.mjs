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
