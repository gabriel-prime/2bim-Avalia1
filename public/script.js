// script.js
// Esta página não sabe desenhar. Ela envia o número e o id_token à rota
// /api/desenho e exibe o SVG que o servidor devolve. Nenhum código de geração
// do desenho é servido aqui.

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const identidade = document.getElementById("identidade");
const login = document.getElementById("login");

let idToken = "";
let svgAtual = "";

// O Google Identity Services chama esta função pelo nome após o login.
window.aoEntrar = (resposta) => {
  idToken = resposta.credential;
  identidade.textContent = `Entrou como ${emailDoToken(idToken) ?? "conta Google"}.`;
  identidade.hidden = false;
  login.hidden = true;
  mensagem.textContent = "";
};

// Lê o e-mail do token apenas para mostrar na tela. Quem decide a assinatura é
// o servidor, que verifica o token junto ao Google.
function emailDoToken(token) {
  try {
    const parte = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(parte)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json).email ?? null;
  } catch {
    return null;
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  const numero = Number(campoNumero.value);

  let resposta;
  try {
    resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ numero }),
    });
  } catch {
    mensagem.textContent = "Não foi possível falar com o servidor. Tente novamente.";
    return;
  }

  if (resposta.status === 400) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    area.innerHTML = "";
    botaoBaixar.hidden = true;
    return;
  }

  if (resposta.status === 401) {
    mensagem.textContent = "Entre com sua conta Google para assinar o desenho.";
    area.innerHTML = "";
    botaoBaixar.hidden = true;
    login.hidden = false;
    identidade.hidden = true;
    idToken = "";
    return;
  }

  if (!resposta.ok) {
    mensagem.textContent = `O servidor respondeu ${resposta.status}. Tente novamente.`;
    return;
  }

  svgAtual = await resposta.text();
  area.innerHTML = svgAtual;
  botaoBaixar.hidden = false;
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
