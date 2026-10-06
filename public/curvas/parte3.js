// parte3.js
// Universalidade e seus limites: epiciclos que desenham qualquer coisa, uma
// curva que preenche o quadrado, um teorema rígido demais e um padrão que
// ninguém demonstrou.

import { TAU, BORDA, DESTAQUE, SUAVE, preparar, centrar, traco, controle, matiz, montar } from "./comum.js";

/* 1. Epiciclos de Fourier */

const M = 512;

const formas = {
  quadrado(t) {
    const u = (t * 4) % 4;
    if (u < 1) return [-1 + 2 * u, -1];
    if (u < 2) return [1, -1 + 2 * (u - 1)];
    if (u < 3) return [1 - 2 * (u - 2), 1];
    return [-1, 1 - 2 * (u - 3)];
  },
  estrela(t) {
    const u = t * 10, k = Math.floor(u), f = u - k;
    const pt = (i) => {
      const a = (TAU * i) / 10 - Math.PI / 2;
      const r = i % 2 === 0 ? 1 : 0.42;
      return [r * Math.cos(a), r * Math.sin(a)];
    };
    const a = pt(k % 10), b = pt((k + 1) % 10);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  },
  coracao(t) {
    const a = TAU * t;
    return [
      (16 * Math.pow(Math.sin(a), 3)) / 17,
      -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17,
    ];
  },
};

const cache = {};

// Transformada discreta: devolve os coeficientes ordenados por magnitude.
function coeficientes(nome) {
  if (cache[nome]) return cache[nome];
  const f = formas[nome];
  const re = new Float64Array(M), im = new Float64Array(M);
  for (let m = 0; m < M; m++) { const p = f(m / M); re[m] = p[0]; im[m] = p[1]; }
  const termos = [];
  for (let k = -M / 2; k < M / 2; k++) {
    let cr = 0, ci = 0;
    for (let m = 0; m < M; m++) {
      const a = (-TAU * k * m) / M, c = Math.cos(a), s = Math.sin(a);
      cr += re[m] * c - im[m] * s;
      ci += re[m] * s + im[m] * c;
    }
    termos.push({ k, re: cr / M, im: ci / M, mag: Math.hypot(cr, ci) / M });
  }
  termos.sort((a, b) => b.mag - a.mag);
  cache[nome] = termos;
  return termos;
}

const fo = {
  forma: controle("fo-forma"),
  n: controle("fo-n", "fo-n-v"),
  t: controle("fo-t", "fo-t-v", (v) => v + "%"),
  cir: controle("fo-cir"),
  cap: document.getElementById("fo-cap"),
};

function fourier() {
  const { ctx, w, h } = preparar("c-fourier");
  const R = centrar(ctx, w, h) * 0.76;
  const nome = fo.forma.texto(), N = fo.n.valor(), tt = fo.t.valor() / 100;
  const termos = coeficientes(nome).slice(0, N);

  const alvo = [];
  for (let s = 0; s <= 400; s++) { const p = formas[nome](s / 400); alvo.push([p[0] * R, p[1] * R]); }
  traco(ctx, alvo, "rgba(139,148,158,.4)", 1.6, true);

  const soma = (t) => {
    let x = 0, y = 0;
    for (const c of termos) {
      const a = TAU * c.k * t, cs = Math.cos(a), sn = Math.sin(a);
      x += c.re * cs - c.im * sn;
      y += c.re * sn + c.im * cs;
    }
    return [x * R, y * R];
  };

  const tracado = [];
  for (let s = 0; s <= 900; s++) tracado.push(soma(s / 900));
  for (let i = 1; i < tracado.length; i++) {
    ctx.beginPath();
    ctx.moveTo(tracado[i - 1][0], tracado[i - 1][1]);
    ctx.lineTo(tracado[i][0], tracado[i][1]);
    ctx.strokeStyle = matiz(i, tracado.length);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (fo.cir.ligado()) {
    let x = 0, y = 0;
    const ordenado = termos.slice().sort((a, b) => Math.abs(a.k) - Math.abs(b.k));
    ctx.lineWidth = 1;
    for (const c of ordenado) {
      const a = TAU * c.k * tt, cs = Math.cos(a), sn = Math.sin(a);
      const dx = (c.re * cs - c.im * sn) * R, dy = (c.re * sn + c.im * cs) * R;
      if (c.mag * R > 1.2) {
        ctx.beginPath(); ctx.arc(x, y, c.mag * R, 0, TAU);
        ctx.strokeStyle = "rgba(139,148,158,.28)"; ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy);
      ctx.strokeStyle = "rgba(230,237,243,.7)"; ctx.stroke();
      x += dx; y += dy;
    }
    ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fillStyle = DESTAQUE; ctx.fill();
  }

  fo.cap.textContent = `${N} ${N === 1 ? "braço" : "braços"}. Cinza: o alvo. Colorido: o que a cadeia traça.`;
}

/* 2. Curva de Hilbert */

const hi = { n: controle("hi-n", "hi-n-v"), cap: document.getElementById("hi-cap") };

function hilbert(ordem) {
  let pts = [[0, 0]];
  for (let o = 1; o <= ordem; o++) {
    const lado = Math.pow(2, o - 1);
    const a = pts.map(([x, y]) => [y, x]);
    const b = pts.map(([x, y]) => [x, y + lado]);
    const c = pts.map(([x, y]) => [x + lado, y + lado]);
    const d = pts.map(([x, y]) => [2 * lado - 1 - y, lado - 1 - x]);
    pts = a.concat(b, c, d);
  }
  return pts;
}

function desenhaHilbert() {
  const { ctx, w, h } = preparar("c-hilbert");
  const o = hi.n.valor();
  const pts = hilbert(o);
  const lado = Math.pow(2, o);
  const marg = 22;
  const esc = (Math.min(w, h) - 2 * marg) / (lado - 1 || 1);
  ctx.lineWidth = Math.max(0.8, (18 / lado));
  for (let i = 1; i < pts.length; i++) {
    ctx.beginPath();
    ctx.moveTo(marg + pts[i - 1][0] * esc, marg + pts[i - 1][1] * esc);
    ctx.lineTo(marg + pts[i][0] * esc, marg + pts[i][1] * esc);
    ctx.strokeStyle = matiz(i, pts.length);
    ctx.stroke();
  }
  hi.cap.textContent = `Ordem ${o}: ${pts.length} pontos, ${pts.length - 1} segmentos. No limite, a curva passa por todos os pontos do quadrado.`;
}

/* 3. Porisma de Poncelet */

const po = {
  n: controle("po-n", "po-n-v"),
  r: controle("po-r", "po-r-v", (v) => (v / 100).toFixed(2)),
  t: controle("po-t", "po-t-v", (v) => v + "°"),
  tod: controle("po-tod"),
  cap: document.getElementById("po-cap"),
};

// Da posição atual, traça a tangente ao círculo interno e devolve o próximo
// vértice sobre o círculo externo.
function proximoVertice(P, R, C, r) {
  const vx = C[0] - P[0], vy = C[1] - P[1], L = Math.hypot(vx, vy);
  const alfa = Math.asin(Math.min(1, r / L));
  const base = Math.atan2(vy, vx) + alfa;
  const dx = Math.cos(base), dy = Math.sin(base);
  const b = 2 * (P[0] * dx + P[1] * dy);
  const c = P[0] * P[0] + P[1] * P[1] - R * R;
  const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * c))) / 2;
  return [P[0] + t * dx, P[1] + t * dy];
}

function poncelet() {
  const { ctx, w, h } = preparar("c-poncelet");
  const esc = centrar(ctx, w, h);
  const n = po.n.valor(), rr = po.r.valor() / 100;

  // Condição exata: Chapple–Euler para n = 3, Fuss para n = 4.
  let d;
  if (n === 3) {
    d = Math.sqrt(Math.max(0, 1 - 2 * rr));
  } else {
    let lo = 0, hi2 = 0.999;
    for (let i = 0; i < 60; i++) {
      const meio = (lo + hi2) / 2;
      const val = 1 / Math.pow(1 - meio, 2) + 1 / Math.pow(1 + meio, 2);
      if (val < 1 / (rr * rr)) lo = meio; else hi2 = meio;
    }
    d = (lo + hi2) / 2;
  }

  const C = [d * esc, 0], R = esc, r = rr * esc;
  ctx.strokeStyle = BORDA; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(C[0], C[1], r, 0, TAU); ctx.stroke();

  const inicios = po.tod.ligado() ? [0, 40, 80, 120, 160, 200, 240, 280, 320] : [po.t.valor()];
  let pior = 0;
  inicios.forEach((grau, idx) => {
    const th = (grau * Math.PI) / 180;
    let P = [R * Math.cos(th), R * Math.sin(th)];
    const inicio = P, vs = [P];
    for (let i = 0; i < n; i++) { P = proximoVertice(P, R, C, r); vs.push(P); }
    pior = Math.max(pior, Math.hypot(P[0] - inicio[0], P[1] - inicio[1]) / esc);
    ctx.globalAlpha = po.tod.ligado() ? 0.62 : 1;
    traco(ctx, vs, matiz(idx, inicios.length), 2.2, false);
    ctx.globalAlpha = 1;
    if (!po.tod.ligado()) {
      for (const v of vs.slice(0, n)) {
        ctx.beginPath(); ctx.arc(v[0], v[1], 4, 0, TAU);
        ctx.fillStyle = DESTAQUE; ctx.fill();
      }
    }
  });

  const nome = n === 3 ? "Chapple–Euler" : "Fuss";
  po.cap.textContent = `${n === 3 ? "Triângulo" : "Quadrilátero"} · d = ${d.toFixed(4)} pela condição de ${nome} · erro de fechamento ${pior.toExponential(1)}.`;
}

/* 4. Espiral de Ulam */

const ul = { n: controle("ul-n", "ul-n-v"), um41: controle("ul-41"), eu: controle("ul-eu"), cap: document.getElementById("ul-cap") };

function crivo(N) {
  const comp = new Uint8Array(N + 1);
  comp[0] = comp[1] = 1;
  for (let i = 2; i * i <= N; i++) if (!comp[i]) for (let j = i * i; j <= N; j += i) comp[j] = 1;
  return comp;
}

function ulam() {
  const { ctx, w, h } = preparar("c-ulam");
  const N = ul.n.valor(), base = ul.um41.ligado() ? 41 : 1;
  const comp = crivo(N + base);
  const lado = Math.ceil(Math.sqrt(N));
  const cel = Math.min(w, h) / lado;
  const ox = w / 2, oy = h / 2;

  const euler = new Set();
  if (ul.eu.ligado()) for (let i = 0; i * i + i + 41 <= N + base; i++) euler.add(i * i + i + 41);

  let x = 0, y = 0, dx = 1, dy = 0, passo = 1, dados = 0, giros = 0;
  for (let i = 0; i < N; i++) {
    const v = i + base;
    if (!comp[v]) {
      const px = ox + x * cel, py = oy - y * cel;
      if (ul.eu.ligado() && euler.has(v)) {
        ctx.fillStyle = "#ff7b72";
        ctx.fillRect(px - cel, py - cel, cel * 2.2, cel * 2.2);
      } else {
        ctx.fillStyle = DESTAQUE;
        ctx.fillRect(px, py, Math.max(cel, 1), Math.max(cel, 1));
      }
    }
    x += dx; y += dy; dados++;
    if (dados === passo) { dados = 0; const t = dx; dx = -dy; dy = t; giros++; if (giros % 2 === 0) passo++; }
  }
  ul.cap.textContent = ul.um41.ligado()
    ? "Começando em 41: o polinômio de Euler n² + n + 41 ocupa uma diagonal inteira, em vermelho."
    : "Começando em 1. As diagonais continuam lá — só que nenhuma é tão limpa quanto a de 41.";
}

montar([
  { desenhar: fourier, controles: ["fo-forma", "fo-n", "fo-t", "fo-cir"], saidas: [fo.n, fo.t] },
  { desenhar: desenhaHilbert, controles: ["hi-n"], saidas: [hi.n] },
  { desenhar: poncelet, controles: ["po-n", "po-r", "po-t", "po-tod"], saidas: [po.n, po.r, po.t] },
  { desenhar: ulam, controles: ["ul-n", "ul-41", "ul-eu"], saidas: [ul.n] },
]);
