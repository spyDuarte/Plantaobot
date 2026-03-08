# Fluxo de Autenticação - Plantaobot

## Estratégias

O projeto suporta dois modos de autenticação governados pela variável de ambiente `VITE_AUTH_PROVIDER`.

### 1. BFF Mode (Padrão e Recomendado para Produção)
Quando `VITE_AUTH_PROVIDER=bff` (ou `VITE_AUTH_ENABLED=true` com BFF backend via `.env`):
- O frontend envia as requisições de autenticação (login, signup, etc.) diretamente para o backend Node.js (`/api/auth/*`).
- O backend interage com o provedor de identidade (Supabase Auth).
- Se bem sucedido, o backend define cookies seguros (`HttpOnly`, `Secure`, `SameSite`) no navegador do cliente contendo os tokens (Access e Refresh) e um header com token CSRF contra abusos maliciosos do browser.
- Todas as requisições subsequentes ao backend incluem esses cookies automaticamente. O frontend *não* manipula tokens JWT localmente.
- O fechamento da aba expira as sessões (conforme config de sessão do cookie), e chamadas desautorizadas no `apiClient.js` (401) disparam relogin automático (evento `pb-auth-unauthorized`).

### 2. Supabase Direct Mode (Alternativo)
Quando `VITE_AUTH_PROVIDER=supabase` (usado primariamente em deploys puramente estáticos ou protótipos em GitHub Pages):
- O frontend interage diretamente com a API do Supabase usando a SDK `@supabase/supabase-js`.
- Os tokens são armazenados e gerenciados pelo SDK do Supabase (geralmente em `localStorage`).
- Útil para testar UI sem levantar o backend Node localmente.
- O fluxo de redirect (magic link, reset de senha) exige configurações estritas de URL no painel do Supabase.

## Arquitetura de Validação Frontend
A classe `ApiError` em `src/services/apiClient.js` lida com as repostas 401, 403 e 500 do BFF.
O orquestrador `src/App.jsx` engloba todo o roteamento, gerindo 4 estados:
1. `loading`: Verificando sessão via `/api/auth/me`.
2. `unauthenticated`: Interface de login, esqueci a senha, e cadastro.
3. `unverified`: Sessão estabelecida mas email não confirmado, aguardando validação de link/PIN.
4. `authenticated`: Renderiza o sistema completo (o `AppMain.jsx`).