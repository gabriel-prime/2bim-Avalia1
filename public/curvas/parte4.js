// parte4.js
// Ruído dentro de uma regra. Em todos os casos a regra carrega a forma e o
// acaso só preenche os graus de liberdade que ela deixou livres.

import { TAU, BORDA, DESTAQUE, SUAVE, preparar, centrar, controle, aleatorio, matiz, montar } from "./comum.js";

/* 1. Atrator de Clifford */

const cl = {
  a: controle("cl-a", "cl-a-v", (v) => (v / 100).toFixed(2).replace("-", "−")),
  b: controle("cl-b", "cl-b-v", (v) => (v / 100).toFixed(2).replace("-", "−")),
  c: controle("cl-c", "cl-c-v", (v) => (v / 100).toFixed(2).replace("-", "−")),
  d: controle("cl-d", "cl-d-v", (v) => (v / 100).toFixed(2).replace("-", "−")),
};

function clifford() {
  const { ctx, w, h } = preparar("c-clifford");
  const a = cl.a.valor() / 100, b = cl.b.valor() / 100;
  const c = cl.c.valor() / 100, d = cl.d.valor() / 100;
  const px = Math.min(w, 700) | 0, py = px;
  const dens = new Float32Array(px * py);
  const lim = 1 + Math.max(Math.abs(c), Math.abs(d)) + 0.1;
  let x = 0.1, y = 0.1, maxd = 0;

  for (let i = 0; i < 300000; i++) {
    const nx = Math.sin(a * y) + c * Math.cos(a * x);
    const ny = Math.sin(b * x) + d * Math.cos(b * y);
    x = nx; y = ny;
    if (i < 200) continue;
    const i2 = (((x + lim) / (2 * lim)) * px) | 0;
    const j2 = (((y + lim) / (2 * lim)) * py) | 0;
    if (i2 >= 0 && j2 >= 0 && i2 < px && j2 < py) {
      const k = j2 * px + i2;
      dens[k]++;
      if (dens[k] > maxd) maxd = dens[k];
    }
  }

  // O brilho é um histograma de visitas: é a medida invariante, não a trajetória.
  const img = ctx.createImageData(px, py);
  const lmax = Math.log(1 + maxd);
  for (let k = 0; k < px * py; k++) {
    const v = dens[k], o = k * 4;
    if (v === 0) { img.data[o] = 13; img.data[o + 1] = 17; img.data[o + 2] = 23; }
    else {
      const t = Math.log(1 + v) / lmax;
      img.data[o] = 30 + 130 * Math.pow(t, 1.4);
      img.data[o + 1] = 70 + 160 * Math.pow(t, 0.9);
      img.data[o + 2] = 120 + 130 * Math.pow(t, 0.5);
    }
    img.data[o + 3] = 255;
  }
  const tmp = document.createElement("canvas");
  tmp.width = px; tmp.height = py;
  tmp.getContext("2d").putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0, w, h);
}

/* 2. Passeio aleatório */

const pa = {
  n: controle("pa-n", "pa-n-v"),
  k: controle("pa-k", "pa-k-v"),
  s: controle("pa-s", "pa-s-v"),
  env: controle("pa-env"),
  cap: document.getElementById("pa-cap"),
};

function passeio() {
  const { ctx, w, h } = preparar("c-passeio");
  centrar(ctx, w, h);
  const N = pa.n.valor(), K = pa.k.valor();
  const r = aleatorio(pa.s.valor() * 97 + 5);
  const esc = (Math.min(w, h) * 0.42) / (2.6 * Math.sqrt(N));
  let somaR2 = 0;

  for (let c = 0; c < K; c++) {
    let x = 0, y = 0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < N; i++) {
      const d = (r() * 4) | 0;
      if (d === 0) x++; else if (d === 1) x--; else if (d === 2) y++; else y--;
      ctx.lineTo(x * esc, y * esc);
    }
    ctx.strokeStyle = `hsla(${Math.round((360 * c) / K)} 85% 62% / .72)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x * esc, y * esc, 4, 0, TAU);
    ctx.fillStyle = matiz(c, K);
    ctx.fill();
    somaR2 += x * x + y * y;
  }

  if (pa.env.ligado()) {
    ctx.beginPath();
    ctx.arc(0, 0, Math.sqrt(N) * esc, 0, TAU);
    ctx.strokeStyle = DESTAQUE;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const rms = Math.sqrt(somaR2 / K);
  pa.cap.textContent = `${K} caminhos de ${N} passos · distância quadrática média ${rms.toFixed(1)} · √n = ${Math.sqrt(N).toFixed(1)}`;
}

/* 3. Agregação limitada por difusão */

const dl = { n: controle("dl-n", "dl-n-v"), s: controle("dl-s", "dl-s-v"), cap: document.getElementById("dl-cap") };

function agregacao() {
  const { ctx, w, h } = preparar("c-dla");
  const G = 241, c0 = 120;
  const grade = new Int32Array(G * G);
  const r = aleatorio(dl.s.valor() * 131 + 17);
  grade[c0 * G + c0] = 1;
  let maxR = 1, n = 1;
  const marcos = [];
  const N = dl.n.valor();

  for (let p = 0; p < N; p++) {
    const lanc = Math.min(maxR + 4, c0 - 3);
    const morte = Math.min(lanc * 2 + 6, c0 - 1);
    let ang = r() * TAU;
    let x = Math.round(c0 + lanc * Math.cos(ang));
    let y = Math.round(c0 + lanc * Math.sin(ang));
    let passos = 0, grudou = false;

    while (passos++ < 60000) {
      const d = (r() * 4) | 0;
      if (d === 0) x++; else if (d === 1) x--; else if (d === 2) y++; else y--;
      const dr = Math.hypot(x - c0, y - c0);
      if (dr > morte || x < 1 || y < 1 || x >= G - 1 || y >= G - 1) {
        ang = r() * TAU;
        x = Math.round(c0 + lanc * Math.cos(ang));
        y = Math.round(c0 + lanc * Math.sin(ang));
        continue;
      }
      if (grade[y * G + x - 1] || grade[y * G + x + 1] || grade[(y - 1) * G + x] || grade[(y + 1) * G + x]) {
        grade[y * G + x] = ++n;
        if (dr > maxR) maxR = dr;
        grudou = true;
        break;
      }
    }
    if (n % 400 === 0) marcos.push([Math.log(maxR), Math.log(n)]);
    if (!grudou || maxR > c0 - 8) break;
  }

  const cel = Math.min(w, h) / G;
  for (let j = 0; j < G; j++) {
    for (let i = 0; i < G; i++) {
      const v = grade[j * G + i];
      if (v) {
        ctx.fillStyle = `hsl(${Math.round(215 - 180 * (v / n))} 85% 62%)`;
        ctx.fillRect(i * cel, j * cel, Math.max(cel, 1), Math.max(cel, 1));
      }
    }
  }

  // Ajuste de massa contra raio: log n = D log R + b.
  const k = marcos.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const [X, Y] of marcos) { sx += X; sy += Y; sxy += X * Y; sxx += X * X; }
  const D = k > 2 ? (k * sxy - sx * sy) / (k * sxx - sx * sx) : NaN;
  dl.cap.textContent = `${n} partículas · raio ${maxR.toFixed(0)} células · D medido ${isFinite(D) ? D.toFixed(2) : "—"} (assintótico ≈ 1,71; aglomerado pequeno demais).`;
}

/* 4. Voronoi */

const vo = { n: controle("vo-n", "vo-n-v"), s: controle("vo-s", "vo-s-v"), bor: controle("vo-bor"), cap: document.getElementById("vo-cap") };

function voronoi() {
  const { ctx, w, h } = preparar("c-voronoi", 16 / 10);
  const N = vo.n.valor();
  const r = aleatorio(vo.s.valor() * 211 + 3);
  const S = [];
  for (let i = 0; i < N; i++) S.push([r(), r()]);

  const px = Math.min(w, 480) | 0, py = Math.round((px * h) / w);
  const dono = new Int32Array(px * py);
  const img = ctx.createImageData(px, py);

  for (let j = 0; j < py; j++) {
    for (let i = 0; i < px; i++) {
      const x = i / px, y = j / py;
      let melhor = 0, bd = Infinity;
      for (let k = 0; k < N; k++) {
        const dx = x - S[k][0], dy = y - S[k][1], d = dx * dx + dy * dy;
        if (d < bd) { bd = d; melhor = k; }
      }
      dono[j * px + i] = melhor;
      const o = (j * px + i) * 4;
      const hu = (melhor * 137.5) % 360;
      const l = 0.48, s2 = 0.55;
      const cc = (1 - Math.abs(2 * l - 1)) * s2, hp = hu / 60;
      const xx = cc * (1 - Math.abs((hp % 2) - 1));
      let rr = 0, gg = 0, bb = 0;
      if (hp < 1) { rr = cc; gg = xx; } else if (hp < 2) { rr = xx; gg = cc; }
      else if (hp < 3) { gg = cc; bb = xx; } else if (hp < 4) { gg = xx; bb = cc; }
      else if (hp < 5) { rr = xx; bb = cc; } else { rr = cc; bb = xx; }
      const m = l - cc / 2;
      img.data[o] = (rr + m) * 255;
      img.data[o + 1] = (gg + m) * 255;
      img.data[o + 2] = (bb + m) * 255;
      img.data[o + 3] = 255;
    }
  }

  if (vo.bor.ligado()) {
    for (let j = 0; j < py; j++) {
      for (let i = 0; i < px; i++) {
        const a = dono[j * px + i];
        const dif = (i < px - 1 && dono[j * px + i + 1] !== a) || (j < py - 1 && dono[(j + 1) * px + i] !== a);
        if (dif) { const o = (j * px + i) * 4; img.data[o] = 13; img.data[o + 1] = 17; img.data[o + 2] = 23; }
      }
    }
  }

  const tmp = document.createElement("canvas");
  tmp.width = px; tmp.height = py;
  tmp.getContext("2d").putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, 0, 0, w, h);

  // Média de lados, descartando as células que tocam a borda da imagem.
  const naBorda = new Set();
  for (let i = 0; i < px; i++) { naBorda.add(dono[i]); naBorda.add(dono[(py - 1) * px + i]); }
  for (let j = 0; j < py; j++) { naBorda.add(dono[j * px]); naBorda.add(dono[j * px + px - 1]); }
  const pares = new Set();
  for (let j = 0; j < py; j++) for (let i = 0; i < px - 1; i++) {
    const a = dono[j * px + i], b = dono[j * px + i + 1];
    if (a !== b) pares.add(Math.min(a, b) + "," + Math.max(a, b));
  }
  for (let j = 0; j < py - 1; j++) for (let i = 0; i < px; i++) {
    const a = dono[j * px + i], b = dono[(j + 1) * px + i];
    if (a !== b) pares.add(Math.min(a, b) + "," + Math.max(a, b));
  }
  const grau = {};
  for (const p of pares) {
    const [a, b] = p.split(",").map(Number);
    if (!naBorda.has(a)) grau[a] = (grau[a] || 0) + 1;
    if (!naBorda.has(b)) grau[b] = (grau[b] || 0) + 1;
  }
  const vs = Object.values(grau);
  const med = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
  vo.cap.textContent = `${N} sementes · ${vs.length} células internas · média de lados ${med.toFixed(3)} (Euler prevê 6).`;
}

/* 5. Azulejos de Truchet */

const tr = { n: controle("tr-n", "tr-n-v"), s: controle("tr-s", "tr-s-v"), cor: controle("tr-cor") };

function truchet() {
  const { ctx, w, h } = preparar("c-truchet", 16 / 10);
  const N = tr.n.valor();
  const r = aleatorio(tr.s.valor() * 313 + 29);
  const cel = w / N;
  const cols = Math.ceil(w / cel), linhas = Math.ceil(h / cel);

  ctx.lineWidth = Math.max(1.4, cel * 0.13);
  for (let j = 0; j < linhas; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * cel, y = j * cel;
      ctx.strokeStyle = tr.cor.ligado()
        ? `hsl(${Math.round((((i * 7 + j * 11) * 23) % 360))} 75% 62%)`
        : DESTAQUE;
      if (r() < 0.5) {
        ctx.beginPath(); ctx.arc(x, y, cel / 2, 0, Math.PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + cel, y + cel, cel / 2, Math.PI, 1.5 * Math.PI); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x + cel, y, cel / 2, Math.PI / 2, Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y + cel, cel / 2, 1.5 * Math.PI, TAU); ctx.stroke();
      }
    }
  }
}

montar([
  { desenhar: clifford, controles: ["cl-a", "cl-b", "cl-c", "cl-d"], saidas: [cl.a, cl.b, cl.c, cl.d] },
  { desenhar: passeio, controles: ["pa-n", "pa-k", "pa-s", "pa-env"], saidas: [pa.n, pa.k, pa.s] },
  { desenhar: agregacao, controles: ["dl-n", "dl-s"], saidas: [dl.n, dl.s] },
  { desenhar: voronoi, controles: ["vo-n", "vo-s", "vo-bor"], saidas: [vo.n, vo.s] },
  { desenhar: truchet, controles: ["tr-n", "tr-s", "tr-cor"], saidas: [tr.n, tr.s] },
]);
