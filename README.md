# Desenho Assinado

Página que recebe um número inteiro entre 1 e 100 e devolve uma figura em SVG,
assinada com o e-mail da conta Google usada no login.

A figura é a tabuada modular no círculo: 240 pontos igualmente espaçados numa
circunferência, com cada ponto `i` ligado ao ponto `(k * i) mod 240`, em que
`k = número + 1`. O número 1 produz uma cardioide, o 2 uma nefroide, e cada
valor gera uma figura diferente.

## O que mudou em relação à versão inicial

Na versão inicial tudo acontecia no navegador e qualquer pessoa assinava com
qualquer e-mail: bastava digitá-lo. Agora o desenho é gerado no servidor e a
assinatura é o e-mail da conta Google autenticada, obtido do `id_token`
verificado pela própria função — nunca de um dado enviado pelo formulário.

O campo de e-mail não existe mais. A função `gerarDesenho` saiu de `public/` e
foi para `lib/`, de modo que o site publicado não serve esse código.

## Estrutura

```
public/
  index.html              formulário com o número e o botão de login do Google
  style.css               aparência da página
  script.js               envia número e token com fetch e exibe a resposta
lib/
  desenho.js              gerarDesenho, sem alterações no desenho
functions/
  api/desenho.js          Pages Function que implementa o contrato
evidencias/
  exemplo.svg             desenho gerado pelo site publicado
```

## Contrato da API

| Item | Exigência |
|---|---|
| Rota | `POST /api/desenho` |
| Corpo | `{"numero": 42}` |
| Cabeçalho | `Authorization: Bearer <id_token>` |
| 200 | SVG com `Content-Type: image/svg+xml`, assinado com o e-mail do token |
| 400 | Corpo ausente, JSON inválido, `numero` ausente, não inteiro ou fora de 1 a 100 |
| 401 | Token ausente, inválido, expirado, com `aud` diferente do Client ID ou e-mail não verificado |
| 405 | Qualquer método diferente de `POST` |

As verificações seguem a ordem método (405), corpo (400), token (401).

O token é conferido em `https://oauth2.googleapis.com/tokeninfo`. Só é aceito
com status 200, `aud` igual ao Client ID e `email_verified` verdadeiro.

## Publicação no Cloudflare Pages

Framework preset `None`, Build command vazio, Build output directory `public`.

O Client ID fica na variável de ambiente `GOOGLE_CLIENT_ID`, configurada no
painel do projeto. O Client ID é público e também aparece em
`public/index.html`, no botão do Google Identity Services.

## Identificação

Nome: Gabriel Fortunato
RA: 2025207264
URL: https://desenho-assinado-gabriel.pages.dev
