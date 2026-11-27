# URL Shorter

Encurtador de links simples feito com **Node.js** e **Express**, usando **SQLite** como banco de dados.

## Funcionalidades

- Encurtar uma URL (gera um código de 6 caracteres)
- Redirecionar do link curto para a URL original
- Expiração opcional do link (em dias)
- Contagem de cliques e consulta de status

## Tecnologias

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [nanoid](https://github.com/ai/nanoid)

## Pré-requisitos

Você precisa ter o **Node.js** instalado (versão LTS recomendada, 20 ou superior). Ele já inclui o `npm`.

Para conferir se está instalado, rode no terminal:

```bash
node -v
npm -v
```

Se aparecer um número de versão nos dois, está tudo certo. Caso contrário, baixe em https://nodejs.org/.

## Como rodar

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/daryoandrade-art/url-shorter.git
   cd url-shorter
   ```

2. Instale as dependências (isso cria a pasta `node_modules`):

   ```bash
   npm install
   ```

3. Inicie o servidor:

   ```bash
   npm start
   ```

   Para desenvolvimento, com reinício automático a cada alteração no código:

   ```bash
   npm run dev
   ```

O servidor sobe em `http://localhost:3000`. O arquivo do banco (`database.sqlite`) é criado automaticamente na primeira execução.

Para usar outra porta, defina a variável `PORT`:

```bash
PORT=4000 npm start
```

## Como usar

### Encurtar uma URL

`POST /shorten`

Corpo (JSON):

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `url` | texto | sim | URL completa, começando com `http://` ou `https://` |
| `expiresInDays` | número | não | Quantidade de dias até o link expirar |

Exemplo:

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com", "expiresInDays": 7}'
```

> No **PowerShell** (Windows), use:
>
> ```powershell
> Invoke-RestMethod -Method Post -Uri http://localhost:3000/shorten `
>   -ContentType "application/json" `
>   -Body '{"url": "https://www.google.com", "expiresInDays": 7}'
> ```

Resposta (`201 Created`):

```json
{
  "shortCode": "aB3dE_",
  "shortUrl": "http://localhost:3000/aB3dE_",
  "originalUrl": "https://www.google.com",
  "expiresAt": "2026-12-03T12:00:00.000Z"
}
```

### Acessar o link curto

`GET /:code`

Abra o `shortUrl` no navegador (ou use `curl -i http://localhost:3000/aB3dE_`) e você será redirecionado para a URL original.

| Status | Significado |
|---|---|
| `302` | Redirecionado com sucesso |
| `404` | Código não encontrado |
| `410` | Link expirado |

### Ver estatísticas

`GET /status/:code`

```bash
curl http://localhost:3000/status/aB3dE_
```

Resposta:

```json
{
  "shortCode": "aB3dE_",
  "originalUrl": "https://www.google.com",
  "createdAt": "2026-11-26 12:00:00",
  "expiresAt": "2026-12-03T12:00:00.000Z",
  "totalClicks": 3,
  "recentClicks": [
    { "clicked_at": "2026-11-26 12:05:00", "user_agent": "Mozilla/5.0 ..." }
  ]
}
```

## Estrutura do projeto

```
url-shorter/
├── src/
│   ├── controllers/
│   │   └── url.controller.js   # lógica de encurtar, redirecionar e status
│   ├── database/
│   │   └── db.js               # conexão e criação das tabelas (SQLite)
│   ├── routes/
│   │   └── urlRoutes.js        # definição das rotas
│   └── server.js               # ponto de entrada da aplicação
├── package.json
└── README.md
```

## Possíveis melhorias

- Testes automatizados
- Limite de requisições (rate limiting)
- Proteção do endpoint de status
- Alias personalizado para o link curto

## Licença

ISC
