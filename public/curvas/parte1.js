// parte1.js
// Envoltórias, roulettes e aritmética modular. Cada desenho usa só retas ou
// pontos; as curvas que aparecem nunca são traçadas diretamente.

import { TAU, BORDA, DESTAQUE, preparar, centrar, traco, controle, mdc, matiz, montar } from "./comum.js";

/* 1. Tabuada modular no círculo */

const tab = {
  k: controle("t-k", "t-k-v"),
  n: controle("t-n", "t-n-v"),
  env: controle("t-env"),
  cap: document.getElementById("t-cap"),
};

function tabuada() {
  const { ctx, w, h } = preparar("c-tabuada");
  const R = centrar(ctx, w, h);
  const k = tab.k.valor();
  const N = tab.n.valor();

  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.strokeStyle = BORDA;
  ctx.lineWidth = 1;
  ctx.stroke();

  const ponto = (i) => {
    const a = (TAU * i) / N - Math.PI / 2;
    return [R * Math.cos(a), R * Math.sin(a)];
  };

  ctx.globalAlpha = 0.72;
  ctx.lineWidth = N > 260 ? 0.6 : 0.9;
  for (let i = 0; i < N; i++) {
    const j = (k * i) % N;
    if (i === j) continue;
    const a = ponto(i);
    const b = ponto(j);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = matiz(i, N);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (tab.env.ligado()) {
    const f = ((k - 1) * Math.PI) / 2;
    const pts = [];
    for (let s = 0; s <= 1200; s++) {
      const t = (TAU * s) / 1200 - Math.PI / 2;
      pts.push([
        (R * (k * Math.cos(t) + Math.cos(k * t + f))) / (k + 1),
        (R * (k * Math.sin(t) + Math.sin(k * t + f))) / (k + 1),
      ]);
    }
    traco(ctx, pts, DESTAQUE, 2.2, true);
  }

  const nome = k === 2 ? "cardioide" : k === 3 ? "nefroide" : `epicicloide de ${k - 1} cúspides`;
  tab.cap.textContent = `k = ${k} → ${nome}. O número de cúspides é sempre k − 1.`;
}

/* 2. A escada que escorrega (astroide) */

const ast = { n: controle("a-n", "a-n-v"), env: controle("a-env") };

function astroide() {
  const { ctx, w, h } = preparar("c-astroide");
  const R = centrar(ctx, w, h);
  const n = ast.n.valor();
  const L = R * 0.95;

  ctx.strokeStyle = BORDA;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-L, 0);
  ctx.lineTo(L, 0);
  ctx.moveTo(0, -L);
  ctx.lineTo(0, L);
  ctx.stroke();

  ctx.globalAlpha = 0.68;
  for (let i = 0; i < n; i++) {
    const t = (TAU * i) / n;
    ctx.beginPath();
    ctx.moveTo(L * Math.cos(t), 0);
    ctx.lineTo(0, L * Math.sin(t));
    ctx.strokeStyle = matiz(i, n);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (ast.env.ligado()) {
    const pts = [];
    for (let s = 0; s <= 800; s++) {
      const t = (TAU * s) / 800;
      pts.push([L * Math.pow(Math.cos(t), 3), L * Math.pow(Math.sin(t), 3)]);
    }
    traco(ctx, pts, DESTAQUE, 2.2, true);
  }
}

/* 3. Hipotrocoide (Spirograph) */

const spi = { r: controle("s-r", "s-r-v"), d: controle("s-d", "s-d-v"), cir: controle("s-cir"), cap: document.getElementById("s-cap") };

function hipotrocoide() {
  const { ctx, w, h } = preparar("c-spiro");
  const raio = centrar(ctx, w, h);
  const Rg = 100;
  const r = spi.r.valor();
  const d = spi.d.valor();
  const esc = raio / (Rg - r + d + 4);

  if (spi.cir.ligado()) {
    ctx.strokeStyle = BORDA;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, Rg * esc, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc((Rg - r) * esc, 0, r * esc, 0, TAU);
    ctx.stroke();
  }

  const g = mdc(Rg, r);
  const voltas = r / g;
  const passos = Math.max(2000, Math.round(voltas * 600));
  const k = (Rg - r) / r;
  const pts = [];
  for (let s = 0; s <= passos; s++) {
    const t = (TAU * voltas * s) / passos;
    pts.push([
      esc * ((Rg - r) * Math.cos(t) + d * Math.cos(k * t)),
      esc * ((Rg - r) * Math.sin(t) - d * Math.sin(k * t)),
    ]);
  }

  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.9;
  for (let i = 1; i < pts.length; i++) {
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
    ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = matiz(i, pts.length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  spi.cap.textContent = `R = 100, r = ${r}, d = ${d}. R/r = ${Rg / g}/${r / g} → ${r / g} voltas, ${Rg / g} pétalas.`;
}

/* 4. Rosa de Maurer */

const mau = { n: controle("m-n", "m-n-v"), d: controle("m-d", "m-d-v"), rosa: controle("m-rosa") };

function maurer() {
  const { ctx, w, h } = preparar("c-maurer");
  const R = centrar(ctx, w, h);
  const n = mau.n.valor();
  const d = mau.d.valor();
  const grau = Math.PI / 180;

  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.85;
  let ant = null;
  for (let j = 0; j <= 360; j++) {
    const k = j * d * grau;
    const rr = R * Math.sin(n * k);
    const p = [rr * Math.cos(k), rr * Math.sin(k)];
    if (ant) {
      ctx.beginPath();
      ctx.moveTo(ant[0], ant[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.strokeStyle = matiz(j, 360);
      ctx.stroke();
    }
    ant = p;
  }
  ctx.globalAlpha = 1;

  if (mau.rosa.ligado()) {
    const pts = [];
    for (let s = 0; s <= 2000; s++) {
      const k = (TAU * s) / 2000;
      const rr = R * Math.sin(n * k);
      pts.push([rr * Math.cos(k), rr * Math.sin(k)]);
    }
    traco(ctx, pts, DESTAQUE, 2, false);
  }
}

/* 5. Lissajous */

const lis = {
  a: controle("l-a", "l-a-v"),
  b: controle("l-b", "l-b-v"),
  p: controle("l-p", "l-p-v", (v) => (v / 100).toFixed(2)),
  amort: controle("l-amort"),
  cap: document.getElementById("l-cap"),
};

function lissajous() {
  const { ctx, w, h } = preparar("c-liss");
  const R = centrar(ctx, w, h);
  const a = lis.a.valor();
  const b = lis.b.valor();
  const delta = lis.p.valor() / 100;
  const amortecer = lis.amort.ligado();
  const g = mdc(a, b);
  const voltas = amortecer ? 14 : b / g;
  const passos = 4200;

  const pts = [];
  for (let s = 0; s <= passos; s++) {
    const t = (TAU * voltas * s) / passos;
    const k = amortecer ? Math.exp(-0.09 * t) : 1;
    pts.push([R * k * Math.sin(a * t + delta), -R * k * Math.sin(b * t)]);
  }

  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.92;
  for (let i = 1; i < pts.length; i++) {
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
    ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = matiz(i, pts.length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  lis.cap.textContent = amortecer
    ? `a : b = ${a / g} : ${b / g}, com amortecimento — é o harmonógrafo.`
    : `a : b = ${a / g} : ${b / g}. Toca ${a / g} vezes a borda vertical e ${b / g} a horizontal.`;
}

/* 6. Filotaxia */

const fil = {
  a: controle("f-a", "f-a-v", (v) => (v / 1000).toFixed(3) + "°"),
  n: controle("f-n", "f-n-v"),
  cap: document.getElementById("f-cap"),
};

function filotaxia() {
  const { ctx, w, h } = preparar("c-filo");
  const R = centrar(ctx, w, h);
  const ang = (fil.a.valor() / 1000) * (Math.PI / 180);
  const N = fil.n.valor();
  const c = R / Math.sqrt(N);

  for (let i = 1; i <= N; i++) {
    const t = i * ang;
    const rr = c * Math.sqrt(i);
    ctx.beginPath();
    ctx.arc(rr * Math.cos(t), rr * Math.sin(t), Math.max(1.3, R / 150), 0, TAU);
    ctx.fillStyle = matiz(i, N);
    ctx.fill();
  }

  const graus = fil.a.valor() / 1000;
  const dist = Math.abs(graus - 137.50776);
  fil.cap.textContent =
    dist < 0.02
      ? `${graus.toFixed(3)}° — o ângulo áureo. Nenhum raio é desperdiçado.`
      : `${graus.toFixed(3)}°, a ${dist.toFixed(3)}° do áureo. Repare nos braços vazios.`;
}

montar([
  { desenhar: tabuada, controles: ["t-k", "t-n", "t-env"], saidas: [tab.k, tab.n] },
  { desenhar: astroide, controles: ["a-n", "a-env"], saidas: [ast.n] },
  { desenhar: hipotrocoide, controles: ["s-r", "s-d", "s-cir"], saidas: [spi.r, spi.d] },
  { desenhar: maurer, controles: ["m-n", "m-d", "m-rosa"], saidas: [mau.n, mau.d] },
  { desenhar: lissajous, controles: ["l-a", "l-b", "l-p", "l-amort"], saidas: [lis.a, lis.b, lis.p] },
  { desenhar: filotaxia, controles: ["f-a", "f-n"], saidas: [fil.a, fil.n] },
]);
