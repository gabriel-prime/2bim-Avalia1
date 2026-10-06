// comum.js
// Utilidades compartilhadas pelas páginas de demonstração. Só APIs do navegador,
// nenhuma dependência externa — a mesma regra do resto do projeto.

export const TAU = Math.PI * 2;
export const FUNDO = "#0d1117";
export const BORDA = "#30363d";
export const DESTAQUE = "#58a6ff";
export const SUAVE = "#8b949e";

// Ajusta o canvas à densidade da tela e devolve o contexto já escalado.
export function preparar(id, proporcao) {
  const cv = document.getElementById(id);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cv.clientWidth || 700);
  const h = Math.round(w / (proporcao || 1));
  cv.width = w * dpr;
  cv.height = h * dpr;
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = FUNDO;
  ctx.fillRect(0, 0, w, h);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  return { ctx, w, h };
}

export function centrar(ctx, w, h) {
  ctx.translate(w / 2, h / 2);
  return Math.min(w, h) * 0.43;
}

export function traco(ctx, pontos, cor, largura, fechar) {
  if (pontos.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pontos[0][0], pontos[0][1]);
  for (let i = 1; i < pontos.length; i++) ctx.lineTo(pontos[i][0], pontos[i][1]);
  if (fechar) ctx.closePath();
  ctx.strokeStyle = cor;
  ctx.lineWidth = largura;
  ctx.stroke();
}

// Liga um controle ao seu rótulo de valor. Devolve leitores já prontos.
export function controle(id, saida, formata) {
  const el = document.getElementById(id);
  const out = saida ? document.getElementById(saida) : null;
  const mostrar = () => {
    if (out) out.textContent = formata ? formata(Number(el.value)) : el.value;
  };
  mostrar();
  return {
    el,
    mostrar,
    valor: () => Number(el.value),
    ligado: () => el.checked,
    texto: () => el.value,
  };
}

// Gerador pseudoaleatório com semente, para que a mesma figura se repita.
export function aleatorio(semente) {
  let a = semente * 1831565813 + 0x6d2b79f5;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mdc(a, b) {
  return b === 0 ? a : mdc(b, a % b);
}

export function matiz(i, total) {
  return `hsl(${Math.round((360 * i) / total)} 85% 62%)`;
}

// Registra os controles de cada desenho e faz o primeiro traçado.
export function montar(desenhos) {
  for (const { desenhar, controles, saidas } of desenhos) {
    for (const id of controles) {
      const el = document.getElementById(id);
      const evento = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evento, () => {
        if (saidas) for (const s of saidas) s.mostrar();
        desenhar();
      });
    }
  }
  const todos = () => {
    for (const { desenhar } of desenhos) desenhar();
  };
  todos();
  let espera = null;
  window.addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(todos, 200);
  });
}
