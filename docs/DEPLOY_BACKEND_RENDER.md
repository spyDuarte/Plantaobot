# Deploy do Backend no Render (Supabase Auth + BFF)

Este guia publica `backend/server.js` no Render para servir `/api`.

## 1) Criar serviço no Render

1. Acesse o Render e escolha **New + -> Blueprint**.
2. Aponte para este repositório (o arquivo `render.yaml` já está pronto).
3. Confirme a criação do serviço `plantaobot-api`.

## 2) Variáveis obrigatórias

Configure no serviço do Render:

- `APP_BASE_URL`: URL pública do frontend (ex: `https://app.seudominio.com`)
- `CORS_ALLOWED_ORIGINS`: origens permitidas, separadas por vírgula (ex: `https://app.seudominio.com`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COOKIE_SECRET` (já pode ser gerado automaticamente)
- `COOKIE_DOMAIN`:
  - use vazio para host-only cookie (recomendado quando frontend chama sempre a mesma API host)
  - use `.seudominio.com` somente se precisar escopo amplo
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`

## 3) Frontend (GitHub Pages) apontando para a API

No GitHub, configure o secret de Actions:

- `VITE_API_BASE_URL=https://<seu-backend-render>/api`

O workflow de Pages já consome esse secret.

## 4) Domínio e cookies (importante)

Para sessão por cookie funcionar de forma estável em navegadores modernos:

- Recomendado: frontend e API no mesmo site registrável
  - Exemplo: `app.seudominio.com` (frontend) e `api.seudominio.com` (backend)
- Evite depender de `*.github.io` + `*.onrender.com` em produção para auth por cookie.

Se você precisar operar em cross-site estrito, use:

- `COOKIE_SAME_SITE=none`
- `COOKIE_SECURE=true`

## 5) Healthcheck

Após deploy, valide:

- `GET https://<seu-backend-render>/api/health` -> `{ "ok": true, ... }`

## 6) Banco Supabase

Antes do primeiro uso, execute o SQL:

- `backend/sql/001_auth_and_operational_schema.sql`

Isso cria `profiles`, `preferences`, `groups`, `captures`, `rejections`, `monitor_sessions` e `events`.
