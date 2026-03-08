# Setup e Desenvolvimento - Plantaobot

## Pré-Requisitos

1. Node.js `v18+` (ou superior)
2. NPM `v9+` (gerenciador de pacotes)
3. Banco de Dados / Auth: Supabase (URL + Chaves) configurados no `.env`.

## Instalação

```bash
git clone <repo_url>
cd plantaobot
npm install
```

## Configuração Local (.env)

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` ajustando o `VITE_AUTH_PROVIDER` e as credenciais do Supabase:

### Para o Frontend com BFF:
```env
VITE_AUTH_PROVIDER=bff
VITE_API_BASE_URL=http://localhost:8080/api

SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

COOKIE_SECRET=secreta-desenvolvimento
APP_BASE_URL=http://localhost:5173
```

## Execução

### Frontend
```bash
npm run dev
```
Inicia a SPA (React/Vite) em `http://localhost:5173`.

### Backend
```bash
npm run dev:backend
```
Inicia o servidor Node.js/Express em `http://localhost:8080` com *hot-reload*.

## Pipeline de Qualidade e Scripts Úteis

Este projeto requer que o código seja mantido com alta qualidade antes de ser commitado para a branch principal.

1. **Linting:** Valida o código utilizando ESLint (`npm run lint`). Para consertar erros automaticamente, use `npm run lint:fix`.
2. **Formatação:** Formata o projeto de acordo com as regras do Prettier (`npm run format`).
3. **Testes do Frontend:** Executa testes Vitest e React Testing Library (`npm run test`).
4. **Testes do Backend:** Executa suítes de teste de integração (HTTP) com o backend (`npm run test:backend`).
5. **Build:** Compila a SPA para produção (`npm run build`). Para visualizar o build, rode `npm run preview`.

Sempre certifique-se de que todos os scripts acima rodem com sucesso (`Exit code 0`) antes de gerar Pull Requests. O arquivo `.github/workflows` também valida a pipeline.