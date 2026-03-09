# PEX 2

Sistema web academico para cadastro e acompanhamento de rebanho. A interface principal foi reorganizada para funcionar como uma central unica de registro e consulta de vacas, bois, bezerros, bezerras, novilhas e garrotes.

## Fluxo atual

- Cadastro e listagem na mesma tela.
- Uso de `json-server` em `http://localhost:3000/animals` quando a aplicacao roda localmente.
- Fallback automatico para `localStorage` quando a API nao estiver disponivel.
- Funcionamento preservado na Vercel por meio desse fallback local no navegador.

## Executar localmente

Instale as dependencias:

```bash
npm install
```

Suba o frontend:

```bash
npm start
```

Suba o `json-server` em outro terminal:

```bash
npm run api
```

Frontend: `http://localhost:4200`

API mock: `http://localhost:3000/animals`

## Dados iniciais

Os dados iniciais do `json-server` ficam em `db.json`.

## Build

```bash
npm run build
```

## Vercel

`json-server` nao roda dentro do deploy estatico da Vercel. Por isso, esta implementacao usa:

- `json-server` para desenvolvimento local
- `localStorage` como fallback automatico em producao

Se voce quiser consumir uma API externa em producao, exponha `window.__PEX_API_URL__` apontando para um backend compativel com os endpoints do `json-server`.
