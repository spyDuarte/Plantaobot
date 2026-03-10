# Deploy no Vercel (setup mínimo e seguro)

Este guia assume **deploy do frontend (Vite SPA)** no Vercel, reutilizando o que já existe no repositório:

- **Não existe** `vercel.json` atualmente.
- Build padrão já definido em `package.json`: `npm run build`.
- O backend BFF continua separado (ex.: Render), via `VITE_API_BASE_URL`.

## 1) Detectar configuração existente (já validada)

Antes do deploy, confirme no repositório:

- `vercel.json`: ausente (setup automático do Vercel)
- Build command: `vite build` (`npm run build`)
- Output directory: `dist`
- Framework: Vite (detecção automática)

Comandos úteis:

```bash
[ -f vercel.json ] && cat vercel.json || echo "no vercel.json"
npm run build
```

## 2) Preparar projeto no Vercel

1. Crie/importe o projeto no dashboard da Vercel apontando para este repositório.
2. Em **Build & Output Settings**, mantenha o mínimo:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Não** adicione `vercel.json` a menos que seja necessário depois.

## 3) Definir variáveis de ambiente no Vercel

Configure por ambiente (Production/Preview) no painel da Vercel.

### Obrigatórias para operação básica

- `VITE_AUTH_PROVIDER` (`supabase` ou `bff`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Obrigatória quando usar backend/BFF externo

- `VITE_API_BASE_URL` (ex.: `https://seu-backend.onrender.com/api`)

### Opcionais (somente se seu fluxo usar)

- `VITE_AUTH_REDIRECT_URL`
- `VITE_DATA_PROVIDER`
- `VITE_MONITOR_POLL_MS`
- `VITE_UI_V2`
- `VITE_ANTHROPIC_API_KEY` (evite no frontend; prefira backend)

## 4) Deploy via CLI (opcional)

```bash
npm i -g vercel
vercel login
vercel link
vercel pull --yes --environment=production
vercel build
vercel deploy --prebuilt --prod
```

## 5) Checklist pós-deploy (smoke test)

1. Abra a URL de produção.
2. Hard refresh (sem cache) e confira se o app carrega sem tela branca.
3. Verifique rotas/telas-chave:
   - Home/App shell
   - Login/signup (se auth habilitado)
   - Feed/dashboard
4. Abra DevTools e valide:
   - Sem erro de variáveis ausentes (`VITE_*`)
   - Chamadas API indo para `VITE_API_BASE_URL` quando aplicável
5. Se usar Supabase Auth:
   - Confirme `Site URL` e redirects no Supabase para o domínio Vercel.

## 6) Notas de segurança

- Nunca publicar chaves de servidor (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc.) no frontend Vercel.
- Segredos sensíveis ficam apenas no backend.
- `VITE_*` é público no bundle final.
