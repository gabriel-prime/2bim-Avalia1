// functions/api/desenho.js
// Pages Function que gera o desenho no servidor.
//
// O e-mail da assinatura vem do id_token verificado junto ao Google, nunca de
// um dado enviado pelo formulário. gerarDesenho mora em lib/, fora de public/,
// de modo que o site publicado não serve esse código.

import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

const TOKENINFO = "https://oauth2.googleapis.com/tokeninfo";

function erro(status, mensagem) {
  return new Response(JSON.stringify({ erro: mensagem }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Lê o Bearer do cabeçalho Authorization.
function extrairToken(request) {
  const cabecalho = request.headers.get("Authorization") || "";
  const partes = cabecalho.split(" ");
  if (partes.length !== 2 || partes[0].toLowerCase() !== "bearer") return null;
  const token = partes[1].trim();
  return token.length > 0 ? token : null;
}

// Confirma a identidade com o Google. O token só é aceito se a resposta tiver
// status 200, se aud for exatamente o nosso Client ID e se o e-mail estiver
// verificado. Devolve o e-mail ou null.
async function emailDoToken(token, clientId) {
  const resposta = await fetch(`${TOKENINFO}?id_token=${encodeURIComponent(token)}`, {
    headers: { Accept: "application/json" },
  });
  if (resposta.status !== 200) return null;

  let dados;
  try {
    dados = await resposta.json();
  } catch {
    return null;
  }

  if (!dados || dados.aud !== clientId) return null;
  // O tokeninfo devolve email_verified como a string "true".
  if (dados.email_verified !== "true" && dados.email_verified !== true) return null;
  if (typeof dados.email !== "string" || dados.email.length === 0) return null;

  return dados.email;
}

export async function onRequest({ request, env }) {
  // 1. método
  if (request.method !== "POST") {
    const resposta = erro(405, "Use POST.");
    resposta.headers.set("Allow", "POST");
    return resposta;
  }

  // 2. corpo
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return erro(400, "Corpo ausente ou JSON inválido.");
  }
  if (corpo === null || typeof corpo !== "object" || Array.isArray(corpo)) {
    return erro(400, "O corpo deve ser um objeto JSON.");
  }
  const numero = corpo.numero;
  if (!numeroValido(numero)) {
    return erro(400, "O número deve ser um inteiro entre 1 e 100.");
  }

  // 3. token
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return erro(500, "Servidor sem GOOGLE_CLIENT_ID configurado.");

  const token = extrairToken(request);
  if (!token) return erro(401, "Entre com sua conta Google para assinar o desenho.");

  const email = await emailDoToken(token, clientId);
  if (!email) return erro(401, "Token inválido, expirado ou com e-mail não verificado.");

  return new Response(gerarDesenho(numero, email), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
