# Plantaobot

Demo de interface React para um assistente de captaÃ§Ã£o de plantÃµes mÃ©dicos com foco em:

- triagem automÃ¡tica de ofertas;
- modo manual por swipe;
- insights financeiros e operacionais;
- painel de configuraÃ§Ãµes e notificaÃ§Ãµes;
- chat de IA contextual.

## Estrutura do projeto

- `src/`: cÃ³digo-fonte principal da aplicaÃ§Ã£o React.
- `src/utils/index.js`: funÃ§Ãµes utilitÃ¡rias puras (inclui cÃ¡lculo de score).
- `.github/workflows/ci.yml`: pipeline de qualidade executada em pull requests.

```text
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ AIChat.jsx
â”‚   â”œâ”€â”€ InsightsPanel.jsx
â”‚   â”œâ”€â”€ NotifDrawer.jsx
â”‚   â”œâ”€â”€ Onboarding.jsx
â”‚   â”œâ”€â”€ ShiftModal.jsx
â”‚   â”œâ”€â”€ SwipeCard.jsx
â”‚   â”œâ”€â”€ tabs/
â”‚   â”‚   â”œâ”€â”€ CapturedTab.jsx
â”‚   â”‚   â”œâ”€â”€ Dashboard.jsx
â”‚   â”‚   â”œâ”€â”€ FeedTab.jsx
â”‚   â”‚   â”œâ”€â”€ InsightsTab.jsx
â”‚   â”‚   â”œâ”€â”€ SettingsTab.jsx
â”‚   â”‚   â””â”€â”€ SwipeTab.jsx
â”‚   â””â”€â”€ ui/
â”‚       â””â”€â”€ index.jsx
â”œâ”€â”€ constants/
â”‚   â””â”€â”€ colors.js
â”œâ”€â”€ data/
â”‚   â””â”€â”€ mockData.js
â”œâ”€â”€ hooks/
â”‚   â””â”€â”€ useLocalStorage.js
â””â”€â”€ utils/
    â””â”€â”€ index.js
```

1. Instale as dependÃªncias:

   ```bash
   npm install
   ```

2. Inicie o projeto:

   ```bash
   npm run dev
   ```

## Planejamento de evoluÃ§Ã£o

O roadmap de melhorias sugerido estÃ¡ em `PLANO_MELHORIAS.md`, com fases, backlog priorizado e indicadores de sucesso.

## Qualidade de cÃ³digo

O projeto utiliza ESLint + Prettier e testes com Vitest + React Testing Library.

- Verificar lint:

  ```bash
  npm run lint
  ```

- Corrigir lint automaticamente:

  ```bash
  npm run lint:fix
  ```

- Formatar cÃ³digo com Prettier:

  ```bash
  npm run format
  ```

- Executar testes:

  ```bash
  npm run test
  ```

## ContribuiÃ§Ã£o

1. Crie uma branch para sua mudanÃ§a.
2. Garanta que os comandos abaixo passem localmente:
   - `npm run lint`
   - `npm run test`
3. Abra um Pull Request.

Em PRs, a CI valida automaticamente lint e testes.

## Requisitos

- Node.js 18+
- npm 9+

## Deploy no GitHub Pages

O projeto já está preparado para deploy automático via GitHub Actions.


## GitHub Pages + Supabase (frontend esttico)

Para funcionar no GitHub Pages sem backend prprio de autenticao, configure o app para usar Supabase direto no cliente:

### Variveis necessrias (Actions Secrets)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Variveis opcionais

- `VITE_AUTH_REDIRECT_URL` (URL pblica final do Pages, se quiser forar redirect de email)
- `VITE_API_BASE_URL` (caso voc mantenha endpoints HTTP para monitor/capturas)

O workflow de deploy j publica com `VITE_AUTH_PROVIDER=supabase`.

### Configurao no Supabase

Em **Authentication -> URL Configuration**:
- `Site URL`: URL final do seu GitHub Pages
- `Redirect URLs`: inclua tambm a URL do projeto/repo (ex.: `/Plantaobot/`)

Com isso, login/cadastro/recuperao passam a funcionar direto no Supabase no ambiente esttico.

## Sistema de Cadastro/Login (Supabase direto ou Supabase + BFF)

O repositrio suporta dois modos de autenticao:
- `VITE_AUTH_PROVIDER=supabase` (recomendado para GitHub Pages, sem backend auth prprio);
- `VITE_AUTH_PROVIDER=bff` (usa backend em `backend/` com cookies httpOnly).
3. Aguarde o workflow `Deploy to GitHub Pages` finalizar.

A URL ficará em:

- `https://<seu-usuario>.github.io/<nome-do-repositorio>/` (Project Page)
- `https://<seu-usuario>.github.io/` (User/Org Page, quando o repo termina com `.github.io`)

### Deploy local (simulação do Pages)

```bash
npm install
npm run build
npm run preview
```

Opcional para forçar `base` manualmente:

```bash
# PowerShell
$env:VITE_BASE_PATH='/MeuRepo/'
npm run build
```

## Funcionalidades reais (sem simulação)

A aplicação agora usa **integração real via API HTTP** para monitoramento e captura.

### Variáveis de ambiente

- `VITE_API_BASE_URL` (default: `/api`)
- `VITE_MONITOR_POLL_MS` (default: `10000`)
- `VITE_ANTHROPIC_API_KEY` (opcional, para chat IA)

### Endpoints esperados no backend

- `GET /monitor/status`
- `POST /monitor/start`
- `POST /monitor/stop`
- `GET /monitor/feed`
- `GET /captures`
- `POST /captures`
- `DELETE /captures` (fallback para limpeza)
- `GET /rejections`
- `POST /rejections`
- `DELETE /rejections` (fallback para limpeza)
- `GET /preferences`
- `PUT /preferences`
- `GET /groups`
- `PUT /groups`
- `DELETE /history` (opcional; se não existir, usa fallback por `captures/rejections`)
- `POST /events` (opcional; telemetria de crescimento para compartilhamentos/convites)

Se a API estiver indisponível, o app exibe erro operacional em vez de iniciar uma simulação local.

## Sistema de Cadastro/Login (Supabase + BFF)

O repositÃ³rio agora inclui um backend prÃ³prio em `backend/` para autenticaÃ§Ã£o com sessÃ£o via cookies httpOnly.

### Rodando localmente

1. Suba o backend:

```bash
npm run dev:backend
```

2. Em outro terminal, suba o frontend:

```bash
npm run dev
```

O Vite proxy encaminha `/api` para `http://localhost:8080` (configurÃ¡vel por `VITE_BACKEND_ORIGIN`).

### VariÃ¡veis de ambiente do backend

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `COOKIE_SECRET`
- `COOKIE_DOMAIN`
- `COOKIE_SECURE`

### Contratos de auth

- `POST /api/auth/signup` `{ name, email, password }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/resend-verification` `{ email }`
- `POST /api/auth/forgot-password` `{ email }`
- `POST /api/auth/confirm` `{ token_hash, type }`
- `POST /api/auth/reset-password` `{ newPassword }`
- `POST /api/auth/bootstrap-import` `{ prefs, groups, captured, rejected }`

### Schema mÃ­nimo no Supabase

Use `backend/sql/001_auth_and_operational_schema.sql` para criar as tabelas mÃ­nimas (`profiles`, `preferences`, `groups`, `captures`, `rejections`, `monitor_sessions`, `events`).

## Deploy do Backend (Render)

Para publicar o BFF `/api` com Supabase Auth, siga o guia:

- `docs/DEPLOY_BACKEND_RENDER.md`

Arquivo de blueprint jÃ¡ incluÃ­do no repo:

- `render.yaml`
