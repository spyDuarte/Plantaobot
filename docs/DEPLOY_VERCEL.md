# Deploy do Frontend no Vercel

Este guia descreve como publicar o frontend do PlantãoBot no Vercel, mantendo o backend no Render.

## Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Backend já publicado no Render (ver `DEPLOY_BACKEND_RENDER.md`)
- Acesso de admin ao repositório no GitHub

---

## 1. Conectar o repositório ao Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e faça login
2. Clique em **"Import Git Repository"** e selecione `spyDuarte/Plantaobot`
3. O Vercel detecta automaticamente o framework Vite graças ao `vercel.json`
4. **Não clique em Deploy ainda** — configure as variáveis de ambiente primeiro (passo 3)

---

## 2. Obter os IDs do projeto para o GitHub Actions

Após importar o projeto no Vercel:

### VERCEL_TOKEN
1. Acesse [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Clique em **"Create"**, dê um nome (ex: `github-actions`) e copie o token

### VERCEL_ORG_ID
1. Acesse [vercel.com/account](https://vercel.com/account) (conta pessoal) **ou** as configurações do seu time
2. Copie o valor de **"ID"** exibido em "General"

### VERCEL_PROJECT_ID
1. No dashboard do Vercel, abra o projeto PlantãoBot
2. Acesse **Settings → General**
3. Copie o valor de **"Project ID"**

---

## 3. Configurar variáveis de ambiente no Vercel

No dashboard do Vercel, acesse **Settings → Environment Variables** e adicione:

| Variável | Valor | Ambiente |
|---|---|---|
| `VITE_BASE_PATH` | `/` | Production, Preview, Development |
| `VITE_AUTH_PROVIDER` | `bff` | Production, Preview |
| `VITE_DATA_PROVIDER` | `bff` | Production, Preview |
| `VITE_API_BASE_URL` | URL do backend no Render (ex: `https://plantaobot-api.onrender.com`) | Production, Preview |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase | Production, Preview |
| `VITE_AUTH_REDIRECT_URL` | URL do frontend no Vercel (ex: `https://plantaobot.vercel.app`) | Production |
| `VITE_ANTHROPIC_API_KEY` | Chave da API Anthropic (opcional) | Production, Preview |

---

## 4. Configurar os secrets no GitHub

Vá em **GitHub → Settings → Secrets and variables → Actions** e adicione:

- `VERCEL_TOKEN` — token obtido no passo 2
- `VERCEL_ORG_ID` — ID da organização/conta obtido no passo 2
- `VERCEL_PROJECT_ID` — ID do projeto obtido no passo 2
- Todos os `VITE_*` listados na tabela acima

> Os secrets do GitHub são usados pelo workflow `.github/workflows/deploy-vercel.yml`
> para fazer o build e o deploy automaticamente a cada push em `main`/`master`.

---

## 5. Primeiro deploy

Após configurar tudo:

```bash
git push origin main
```

O workflow `deploy-vercel.yml` será disparado automaticamente. Acompanhe em:
**GitHub → Actions → Deploy to Vercel**

Ou faça o deploy diretamente pelo dashboard do Vercel clicando em **"Deploy"**.

---

## Configuração de CORS no backend (Render)

Adicione a URL do Vercel na variável `CORS_ALLOWED_ORIGINS` do backend no Render:

```
CORS_ALLOWED_ORIGINS=https://plantaobot.vercel.app,https://seu-dominio-customizado.com
```

---

## Domínio customizado (opcional)

1. No Vercel, acesse **Settings → Domains**
2. Adicione seu domínio e siga as instruções de DNS
3. Atualize `VITE_AUTH_REDIRECT_URL` e `CORS_ALLOWED_ORIGINS` no Render com o novo domínio

---

## Comparativo: GitHub Pages vs Vercel

| Aspecto | GitHub Pages | Vercel |
|---|---|---|
| Trigger | Push em `main`/`master` | Push em qualquer branch (preview) + `main` (prod) |
| Base path | `/<repo-name>/` (projeto) ou `/` (user site) | Sempre `/` |
| SPA routing | `public/404.html` redireciona para `/?p=` | `rewrites` no `vercel.json` |
| Preview deploys | Não | Sim (por PR/branch) |
| Domínio padrão | `<user>.github.io/<repo>` | `<projeto>.vercel.app` |

Ambos os deploys podem coexistir e são ativados independentemente.
