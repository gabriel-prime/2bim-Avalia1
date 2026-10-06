// parte2.js
// A mesma figura chegando por caminhos diferentes. A cardioide, o triângulo de
// Sierpiński e a razão áurea aparecem cada um por três ou quatro construções
// que não têm nada em comum entre si.

import { TAU, BORDA, DESTAQUE, SUAVE, preparar, centrar, traco, controle, mdc, matiz, montar } from "./comum.js";

const PHI = (1 + Math.sqrt(5)) / 2;

// Envoltória da tabuada, girada para começar no topo como no desenho original.
function envoltoria(k, t, R) {
  const f = ((k - 1) * Math.PI) / 2;
  return [
    (R * (k * Math.cos(t) + Math.cos(k * t + f))) / (k + 1),
    (R * (k * Math.sin(t) + Math.sin(k * t + f))) / (k + 1),
  ];
}

/* 1.1 Tabuada k = 2 */
function tabuada2() {
  const { ctx, w, h } = preparar("c-tab");
  const R = centrar(ctx, w, h);
  const N = 240;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
  ctx.strokeStyle = BORDA; ctx.lineWidth = 1; ctx.stroke();
  const p = (i) => { const a = (TAU * i) / N - Math.PI / 2; return [R * Math.cos(a), R * Math.sin(a)]; };
  ctx.globalAlpha = 0.7; ctx.lineWidth = 0.9;
  for (let i = 0; i < N; i++) {
    const j = (2 * i) % N; if (i === j) continue;
    const a = p(i), b = p(j);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = matiz(i, N); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const pts = [];
  for (let s = 0; s <= 900; s++) pts.push(envoltoria(2, (TAU * s) / 900 - Math.PI / 2, R));
  traco(ctx, pts, DESTAQUE, 2.2, true);
}

/* 1.2 Cáustica da xícara */
const ca = { raios: controle("k-raios", "k-raios-v"), par: controle("k-par"), env: controle("k-env"), cap: document.getElementById("k-cap") };

function caustica() {
  const { ctx, w, h } = preparar("c-caustica");
  const R = centrar(ctx, w, h);
  const n = ca.raios.valor();
  const paralelo = ca.par.ligado();
  const k = paralelo ? 3 : 2;
  const P = (ang) => [R * Math.cos(ang), R * Math.sin(ang)];

  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
  ctx.strokeStyle = BORDA; ctx.lineWidth = 1.4; ctx.stroke();

  for (let i = 1; i <= n; i++) {
    const th = (TAU * i) / (n + 1);
    const cor = matiz(i, n);
    const B = P(th);
    ctx.globalAlpha = 0.3; ctx.lineWidth = 0.7; ctx.strokeStyle = cor;
    ctx.beginPath();
    if (paralelo) ctx.moveTo(-R * 1.02, B[1]); else ctx.moveTo(R, 0);
    ctx.lineTo(B[0], B[1]); ctx.stroke();
    const C = P(k * th);
    ctx.globalAlpha = 0.85; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (!paralelo) { ctx.beginPath(); ctx.arc(R, 0, 4, 0, TAU); ctx.fillStyle = "#e6edf3"; ctx.fill(); }

  if (ca.env.ligado()) {
    const pts = [];
    for (let s = 0; s <= 900; s++) {
      const t = (TAU * s) / 900;
      pts.push([
        (R * (k * Math.cos(t) + Math.cos(k * t))) / (k + 1),
        (R * (k * Math.sin(t) + Math.sin(k * t))) / (k + 1),
      ]);
    }
    traco(ctx, pts, DESTAQUE, 2.4, true);
  }
  ca.cap.textContent = paralelo
    ? "Raios paralelos. A corda refletida vai de θ a 3θ — nefroide, a tabuada k = 3."
    : "Fonte pontual na borda. A corda refletida vai de θ a 2θ — cardioide, a tabuada k = 2.";
}

/* 1.3 Círculo rolando */
const ro = { t: controle("r-t", "r-t-v", (v) => v + "%"), cir: controle("r-cir") };

function rolante() {
  const { ctx, w, h } = preparar("c-rolante");
  const base = centrar(ctx, w, h);
  const R = base * 0.42, r = R;
  const tmax = TAU * (ro.t.valor() / 100);

  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
  ctx.strokeStyle = BORDA; ctx.lineWidth = 1.2; ctx.stroke();

  const traj = (t) => [
    (R + r) * Math.cos(t) - r * Math.cos(((R + r) / r) * t),
    (R + r) * Math.sin(t) - r * Math.sin(((R + r) / r) * t),
  ];

  const completo = [];
  for (let s = 0; s <= 900; s++) completo.push(traj((TAU * s) / 900));
  ctx.globalAlpha = 0.22; traco(ctx, completo, SUAVE, 1.4, true); ctx.globalAlpha = 1;

  const passos = Math.max(2, Math.round((900 * ro.t.valor()) / 100));
  const feito = [];
  for (let s = 0; s <= passos; s++) feito.push(traj((tmax * s) / passos));
  for (let i = 1; i < feito.length; i++) {
    ctx.beginPath();
    ctx.moveTo(feito[i - 1][0], feito[i - 1][1]);
    ctx.lineTo(feito[i][0], feito[i][1]);
    ctx.strokeStyle = matiz(i, 900); ctx.lineWidth = 2.4; ctx.stroke();
  }

  if (ro.cir.ligado() && tmax > 0) {
    const cx = (R + r) * Math.cos(tmax), cy = (R + r) * Math.sin(tmax);
    ctx.strokeStyle = BORDA; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    const p = traj(tmax);
    ctx.strokeStyle = SUAVE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
    ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, TAU); ctx.fillStyle = DESTAQUE; ctx.fill();
  }
}

/* 1.4 Mandelbrot */
const mb = { env: controle("mb-env") };

function mandelbrot() {
  const { ctx, w, h } = preparar("c-mandel", 16 / 10);
  const px = Math.min(w, 720) | 0, py = Math.round((px * h) / w);
  const img = ctx.createImageData(px, py);
  const x0 = -2.15, x1 = 0.75, y0 = -1.12, y1 = 1.12;
  for (let j = 0; j < py; j++) {
    const ci = y0 + ((y1 - y0) * j) / py;
    for (let i = 0; i < px; i++) {
      const cr = x0 + ((x1 - x0) * i) / px;
      let zr = 0, zi = 0, n = 0;
      while (zr * zr + zi * zi <= 4 && n < 90) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; n++; }
      const o = (j * px + i) * 4;
      if (n === 90) { img.data[o] = 13; img.data[o + 1] = 17; img.data[o + 2] = 23; }
      else {
        const t = n / 90;
        img.data[o] = 40 + 60 * t;
        img.data[o + 1] = 90 + 130 * t;
        img.data[o + 2] = 160 + 90 * t;
      }
      img.data[o + 3] = 255;
    }
  }
  const tmp = document.createElement("canvas");
  tmp.width = px; tmp.height = py;
  tmp.getContext("2d").putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0, w, h);

  if (mb.env.ligado()) {
    const mx = (c) => ((c - x0) / (x1 - x0)) * w;
    const my = (c) => ((c - y0) / (y1 - y0)) * h;
    const pts = [];
    for (let s = 0; s <= 900; s++) {
      const th = (TAU * s) / 900;
      pts.push([mx(Math.cos(th) / 2 - Math.cos(2 * th) / 4), my(Math.sin(th) / 2 - Math.sin(2 * th) / 4)]);
    }
    traco(ctx, pts, DESTAQUE, 2.2, true);
  }
}

/* 2.1 Jogo do caos */
const xo = { n: controle("x-n", "x-n-v") };

function jogoDoCaos() {
  const { ctx, w, h } = preparar("c-caos");
  const R = centrar(ctx, w, h);
  const V = [0, 1, 2].map((i) => { const a = (TAU * i) / 3 - Math.PI / 2; return [R * Math.cos(a), R * Math.sin(a)]; });
  let p = [0, 0];
  for (let i = 0; i < 20; i++) { const v = V[(Math.random() * 3) | 0]; p = [(p[0] + v[0]) / 2, (p[1] + v[1]) / 2]; }
  const N = xo.n.valor();
  const cores = ["hsla(150 85% 62% / .75)", "hsla(280 85% 68% / .75)", "hsla(35 85% 62% / .75)"];
  for (let i = 0; i < N; i++) {
    const k = (Math.random() * 3) | 0, v = V[k];
    p = [(p[0] + v[0]) / 2, (p[1] + v[1]) / 2];
    ctx.fillStyle = cores[k];
    ctx.fillRect(p[0], p[1], 1.1, 1.1);
  }
}

/* 2.2 Regra 90 */
const rg = { n: controle("g-n", "g-n-v") };

function regra90() {
  const { ctx, w, h } = preparar("c-regra", 16 / 10);
  const G = rg.n.valor(), L = 2 * G + 1;
  const cel = Math.min(w / L, h / G);
  const offx = (w - cel * L) / 2;
  let linha = new Uint8Array(L);
  linha[G] = 1;
  for (let g = 0; g < G; g++) {
    for (let i = 0; i < L; i++) {
      if (linha[i]) {
        ctx.fillStyle = `hsl(${Math.round(210 - 160 * (g / G))} 85% 62%)`;
        ctx.fillRect(offx + i * cel, g * cel, Math.max(cel, 1), Math.max(cel, 1));
      }
    }
    const nova = new Uint8Array(L);
    for (let i = 0; i < L; i++) nova[i] = (linha[i - 1] || 0) ^ (linha[i + 1] || 0);
    linha = nova;
  }
}

/* 2.3 Pascal módulo 2 */
const pa = { n: controle("p-n", "p-n-v"), cap: document.getElementById("p-cap") };

function pascal() {
  const { ctx, w, h } = preparar("c-pascal", 16 / 10);
  const N = pa.n.valor();
  const cel = Math.min(w / (2 * N), h / N);
  const offx = w / 2;
  let impares = 0;
  for (let n = 0; n < N; n++) {
    for (let k = 0; k <= n; k++) {
      // Teorema de Lucas: C(n,k) é ímpar exatamente quando (k AND n) == k.
      if ((k & n) === k) {
        impares++;
        ctx.fillStyle = `hsl(${Math.round(210 - 160 * (n / N))} 85% 62%)`;
        ctx.fillRect(offx + (2 * k - n) * cel, n * cel, Math.max(2 * cel, 1), Math.max(cel, 1));
      }
    }
  }
  const total = (N * (N + 1)) / 2;
  pa.cap.textContent = `${impares} binomiais ímpares em ${total} — ${((100 * impares) / total).toFixed(1)}%. A densidade tende a zero.`;
}

/* 3.1 Penrose */
const pe = { n: controle("pe-n", "pe-n-v"), cap: document.getElementById("pe-cap") };

function penrose() {
  const { ctx, w, h } = preparar("c-penrose");
  const R = centrar(ctx, w, h) * 1.02;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const div = (a, s) => [a[0] / s, a[1] / s];

  let tris = [];
  for (let i = 0; i < 10; i++) {
    let B = [Math.cos(((2 * i - 1) * Math.PI) / 10) * R, Math.sin(((2 * i - 1) * Math.PI) / 10) * R];
    let C = [Math.cos(((2 * i + 1) * Math.PI) / 10) * R, Math.sin(((2 * i + 1) * Math.PI) / 10) * R];
    if (i % 2 === 0) { const t = B; B = C; C = t; }
    tris.push([0, [0, 0], B, C]);
  }
  for (let g = 0; g < pe.n.valor(); g++) {
    const saida = [];
    for (const [t, A, B, C] of tris) {
      if (t === 0) {
        const P = add(A, div(sub(B, A), PHI));
        saida.push([0, C, P, B], [1, P, C, A]);
      } else {
        const Q = add(B, div(sub(A, B), PHI));
        const S = add(B, div(sub(C, B), PHI));
        saida.push([1, S, C, A], [1, Q, S, B], [0, S, Q, A]);
      }
    }
    tris = saida;
  }

  let gordos = 0, finos = 0;
  for (const [t, A, B, C] of tris) {
    if (t === 0) gordos++; else finos++;
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
    ctx.fillStyle = t === 0 ? "hsl(205 70% 50%)" : "hsl(265 55% 56%)";
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(13,17,23,.55)";
  ctx.lineWidth = Math.max(0.4, 1.6 - pe.n.valor() * 0.18);
  for (const [, A, B, C] of tris) {
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath(); ctx.stroke();
  }
  const razao = gordos ? finos / gordos : 0;
  pe.cap.textContent = `${gordos} gordos, ${finos} finos — finos/gordos = ${razao.toFixed(6)}. φ = ${PHI.toFixed(6)}.`;
}

/* 3.2 Círculos de Ford */
const fo = { q: controle("fo-q", "fo-q-v"), phi: controle("fo-phi"), cap: document.getElementById("fo-cap") };

function ford() {
  const { ctx, w, h } = preparar("c-ford", 16 / 10);
  const Q = fo.q.valor();
  const marg = 24, esc = w - 2 * marg, base = h - 26;
  const X = (v) => marg + v * esc;
  const Y = (v) => base - v * esc;

  ctx.strokeStyle = BORDA; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(marg, base); ctx.lineTo(w - marg, base); ctx.stroke();

  for (let q = 1; q <= Q; q++) {
    for (let p = 0; p <= q; p++) {
      if (mdc(p, q) !== 1) continue;
      const r = 1 / (2 * q * q), rp = r * esc;
      if (rp < 0.6) continue;
      const hu = Math.round(215 - 150 * ((q - 1) / Q));
      ctx.beginPath(); ctx.arc(X(p / q), Y(r), rp, 0, TAU);
      ctx.fillStyle = `hsla(${hu} 80% 60% / .45)`; ctx.fill();
      ctx.strokeStyle = `hsl(${hu} 80% 68%)`; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  if (fo.phi.ligado()) {
    const alvo = 1 / PHI;
    ctx.strokeStyle = "#ff7b72"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(X(alvo), base); ctx.lineTo(X(alvo), 10); ctx.stroke();
    let a = 1, b = 1, melhor = "1/1";
    while (b <= Q) { const t = a + b; a = b; b = t; if (b <= Q) melhor = a + "/" + b; }
    fo.cap.textContent = `Vertical em 1/φ ≈ ${alvo.toFixed(6)}. Melhor convergente com denominador ≤ ${Q}: ${melhor}. Os círculos que ela resvala são sempre de Fibonacci.`;
  } else {
    fo.cap.textContent = `Todos os racionais com denominador até ${Q}. Círculos tangentes são vizinhos de Farey.`;
  }
}

/* 3.3 Espiral áurea */
const es = { n: controle("es-n", "es-n-v"), ret: controle("es-ret") };

function espiral() {
  const { ctx, w, h } = preparar("c-espiral", 16 / 10);
  const N = es.n.valor();
  const esc = Math.min((w - 48) / PHI, h - 48);
  ctx.translate((w - PHI * esc) / 2, (h - esc) / 2);

  let x = 0, y = 0, cw = PHI * esc, ch = esc, dir = 0;
  for (let i = 0; i < N; i++) {
    const s = Math.min(cw, ch);
    if (s < 1) break;
    let c, a0, a1, sq;
    if (dir === 0) { c = [x + s, y + s]; a0 = Math.PI; a1 = 1.5 * Math.PI; sq = [x, y]; }
    else if (dir === 1) { c = [x, y + s]; a0 = 1.5 * Math.PI; a1 = 2 * Math.PI; sq = [x, y]; }
    else if (dir === 2) { c = [x + cw - s, y]; a0 = 0; a1 = 0.5 * Math.PI; sq = [x + cw - s, y]; }
    else { c = [x + s, y + ch - s]; a0 = 0.5 * Math.PI; a1 = Math.PI; sq = [x, y + ch - s]; }

    if (es.ret.ligado()) {
      ctx.strokeStyle = "rgba(139,148,158,.4)"; ctx.lineWidth = 1;
      ctx.strokeRect(sq[0], sq[1], s, s);
    }
    ctx.beginPath(); ctx.arc(c[0], c[1], s, a0, a1);
    ctx.strokeStyle = matiz(i, N); ctx.lineWidth = 2.6; ctx.stroke();

    if (dir === 0) { x += s; cw -= s; }
    else if (dir === 1) { y += s; ch -= s; }
    else if (dir === 2) { cw -= s; }
    else { ch -= s; }
    dir = (dir + 1) % 4;
  }
}

montar([
  { desenhar: tabuada2, controles: [] },
  { desenhar: caustica, controles: ["k-raios", "k-par", "k-env"], saidas: [ca.raios] },
  { desenhar: rolante, controles: ["r-t", "r-cir"], saidas: [ro.t] },
  { desenhar: mandelbrot, controles: ["mb-env"] },
  { desenhar: jogoDoCaos, controles: ["x-n"], saidas: [xo.n] },
  { desenhar: regra90, controles: ["g-n"], saidas: [rg.n] },
  { desenhar: pascal, controles: ["p-n"], saidas: [pa.n] },
  { desenhar: penrose, controles: ["pe-n"], saidas: [pe.n] },
  { desenhar: ford, controles: ["fo-q", "fo-phi"], saidas: [fo.q] },
  { desenhar: espiral, controles: ["es-n", "es-ret"], saidas: [es.n] },
]);
