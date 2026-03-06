# Plantaobot

Aplicação React + Vite para apoio à captação de plantões médicos, com painel operacional, triagem de ofertas e integração com Supabase.

## Visão geral

O projeto oferece:

- Feed de ofertas com priorização por score.
- Modo manual (swipe) para aceite/rejeição rápida.
- Dashboard com indicadores financeiros e operacionais.
- Configurações de monitoramento, grupos e preferências.
- Chat contextual com suporte opcional a IA.
- Fluxo de autenticação com dois modos:
  - **Supabase direto no frontend** (`VITE_AUTH_PROVIDER=supabase`)
  - **BFF (backend em Express + cookies httpOnly)** (`VITE_AUTH_PROVIDER=bff`)

## Stack

- Frontend: React 18, Vite 6
- Backend: Node.js + Express 5
- Auth/Dados: Supabase
- Qualidade: ESLint, Prettier, Vitest, Testing Library

## Estrutura do projeto

```text
.
├── backend/                    # API BFF (auth + endpoints operacionais)
│   ├── app.js
│   ├── server.js
│   ├── services/
│   ├── sql/
│   └── test/
├── docs/                       # Documentação complementar
├── src/                        # Aplicação React
│   ├── components/
│   ├── constants/
│   ├── data/
│   ├── hooks/
│   └── utils/
├── .env.example
└── README.md
```

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
npm install
```

## Executando localmente

### 1) Frontend

```bash
npm run dev
```

### 2) Backend (opcional, modo BFF)

```bash
npm run dev:backend
```

Por padrão, o backend sobe em `http://localhost:8080` e o frontend em `http://localhost:5173`.

## Scripts úteis

- `npm run dev` — inicia frontend em modo desenvolvimento.
- `npm run build` — gera build de produção do frontend.
- `npm run preview` — serve localmente o build de produção.
- `npm run lint` — valida ESLint.
- `npm run lint:fix` — corrige lint automaticamente.
- `npm run format` — formata com Prettier.
- `npm run test` — executa testes do frontend.
- `npm run dev:backend` — inicia backend com watch.
- `npm run start:backend` — inicia backend sem watch.
- `npm run test:backend` — executa testes do backend.

## Configuração de ambiente

Copie `.env.example` para `.env` e ajuste conforme o modo escolhido.

### Variáveis de frontend

- `VITE_AUTH_PROVIDER` (`supabase` | `bff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (default: `/api`)
- `VITE_MONITOR_POLL_MS` (default: `10000`)
- `VITE_AUTH_REDIRECT_URL` (opcional)
- `VITE_ANTHROPIC_API_KEY` (opcional)

### Variáveis de backend (modo BFF)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `COOKIE_SECRET`
- `COOKIE_DOMAIN`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `CORS_ALLOWED_ORIGINS`

## Endpoints esperados para operações

Quando a aplicação está integrada ao backend/BFF, os principais endpoints utilizados são:

- `GET /monitor/status`
- `POST /monitor/start`
- `POST /monitor/stop`
- `GET /monitor/feed`
- `GET /captures`
- `POST /captures`
- `DELETE /captures`
- `GET /rejections`
- `POST /rejections`
- `DELETE /rejections`
- `GET /preferences`
- `PUT /preferences`
- `GET /groups`
- `PUT /groups`
- `DELETE /history` (opcional)
- `POST /events` (opcional)

## Deploy no GitHub Pages

Para deploy estático no GitHub Pages, use preferencialmente:

- `VITE_AUTH_PROVIDER=supabase`

Secrets recomendados no GitHub Actions:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_URL` (opcional)
- `VITE_API_BASE_URL` (opcional)

No Supabase (**Authentication → URL Configuration**):

- Configure `Site URL` com a URL final do Pages.
- Adicione URLs de redirecionamento necessárias (incluindo caminho do repositório, quando aplicável).

## Documentação complementar

- `PLANO_MELHORIAS.md` — roadmap de evolução.
- `EXECUTION_ORDER.md` — sequência de execução.
- `docs/DEPLOY_BACKEND_RENDER.md` — guia de deploy do backend.
- `docs/CHECKLIST_REGRESSAO.md` — checklist de validação.

## Contribuição

1. Crie uma branch para sua mudança.
2. Rode os checks localmente:
   - `npm run lint`
   - `npm run test`
   - `npm run test:backend`
3. Abra um Pull Request.

A CI do repositório valida lint e testes automaticamente.
