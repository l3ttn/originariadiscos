// Abertura com vinil: um disco girando some assim que o catálogo chegar (ou
// no teto de tempo, se a rede falhar). Uma vez por sessão; nada disto roda
// com prefers-reduced-motion, nem quando sessionStorage já marcou a visita.
import { catalogoPronto } from './catalogo.js';

const CHAVE_SESSAO = 'originaria.intro';
const TEMPO_MINIMO = 1400;
const TEMPO_MAXIMO = 2500;
const DURACAO_FADE = 300;

function reduzirMovimento() {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function jaMostrouNaSessao() {
  try {
    return window.sessionStorage.getItem(CHAVE_SESSAO) === '1';
  } catch {
    // Sessão privada ou storage bloqueado: melhor mostrar de novo do que quebrar.
    return false;
  }
}

function marcarMostradaNaSessao() {
  try {
    window.sessionStorage.setItem(CHAVE_SESSAO, '1');
  } catch {
    /* sem storage disponível: segue sem marcar */
  }
}

/** Clique de agulha + chiado curto, sintetizado — nunca autoplay. */
function tocarAgulha() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const duracao = 0.4;
    const amostras = Math.max(1, Math.floor(ctx.sampleRate * duracao));
    const buffer = ctx.createBuffer(1, amostras, ctx.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < amostras; i += 1) dados[i] = Math.random() * 2 - 1;

    const fonte = ctx.createBufferSource();
    fonte.buffer = buffer;

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 2200;
    filtro.Q.value = 0.6;

    const ganho = ctx.createGain();
    ganho.gain.setValueAtTime(0.001, ctx.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracao);

    fonte.connect(filtro).connect(ganho).connect(ctx.destination);
    fonte.start();
    fonte.stop(ctx.currentTime + duracao);
    fonte.addEventListener('ended', () => ctx.close().catch(() => {}));
  } catch {
    /* Web Audio indisponível: sem som, sem quebra */
  }
}

function criarOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'intro';
  overlay.setAttribute('aria-hidden', 'true');

  const disco = document.createElement('div');
  disco.className = 'intro__disco';

  const vinil = document.createElement('div');
  vinil.className = 'intro__vinil';

  const selo = document.createElement('div');
  selo.className = 'intro__selo';
  selo.textContent = 'Originária Discos';
  vinil.appendChild(selo);

  const furo = document.createElement('div');
  furo.className = 'intro__furo';
  vinil.appendChild(furo);

  disco.appendChild(vinil);

  const braco = document.createElement('div');
  braco.className = 'intro__braco';
  const cabecote = document.createElement('div');
  cabecote.className = 'intro__cabecote';
  braco.appendChild(cabecote);
  disco.appendChild(braco);

  overlay.appendChild(disco);

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'intro__botao-agulha';
  botao.tabIndex = -1; // overlay é aria-hidden: nada aqui prende foco de teclado
  botao.setAttribute('aria-label', 'Tocar som de agulha no vinil');
  botao.textContent = 'Tocar agulha';
  botao.addEventListener('click', tocarAgulha);
  overlay.appendChild(botao);

  return overlay;
}

function iniciarIntro() {
  if (reduzirMovimento() || jaMostrouNaSessao()) return;
  marcarMostradaNaSessao();

  const overlay = criarOverlay();
  document.body.insertBefore(overlay, document.body.firstChild);
  document.body.classList.add('intro-ativa');

  let jaSaiu = false;
  function sair() {
    if (jaSaiu) return;
    jaSaiu = true;
    overlay.classList.add('intro--saindo');
    setTimeout(() => {
      document.body.classList.remove('intro-ativa');
      overlay.remove();
    }, DURACAO_FADE);
  }

  const tempoMinimo = new Promise((resolve) => setTimeout(resolve, TEMPO_MINIMO));
  Promise.all([tempoMinimo, catalogoPronto]).then(sair);
  setTimeout(sair, TEMPO_MAXIMO); // teto absoluto: falha de rede não prende a tela
}

if (document.body) {
  iniciarIntro();
} else {
  document.addEventListener('DOMContentLoaded', iniciarIntro, { once: true });
}
