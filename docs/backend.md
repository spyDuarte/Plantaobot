# Backend For Frontend (BFF) - Plantaobot

## Estrutura do Backend

O Node.js backend (Express) em `backend/` opera primordialmente como um Backend for Frontend para simplificar, centralizar e tornar mais segura a aplicação Plantaobot B2B. Ele abstrai a comunicação com o WhatsApp Baileys e Supabase Auth e DB, injetando segurança de cookies e tokens em requisições Frontend via Proxy-like behavior, atuando na orquestração dos "monitoramentos" de plantão.

```text
backend/
├── server.js          # Entrypoint Node (porta 8080)
├── app.js             # Express (Configurações, rotas de API unificadas, Middlewares, Rate Limiting, CORS)
├── errors.js          # Definições das classes de erros operacionais HTTP (BadRequest, Auth, ServerError, etc)
├── security.js        # Middleware e lógicas contra CSRF, XSS (Configuração Cookie SameSite, etc)
├── validation.js      # Rotinas baseadas em joi/zod-like (input validation das requests REST)
├── services/          # Camada de lógica pesada (Integrações com DB e provedores)
├── sql/               # Migrações/DDLs
└── test/              # Testes unitários vitest e integrações E2E (auth.integration.test.js)
```

## Características Técnicas de Segurança e Autenticação
1. **Cookies HttpOnly:** Toda sessão do app é gerada via `POST /api/auth/login` contra o Supabase, mas no frontend do `plantaobot`, o armazenamento ocorre em cookie pelo Backend e nunca por LocalStorage `setItem(token)`, previnindo XSS attacks.
2. **CSRF (Cross-Site Request Forgery):** A comunicação interage exigindo um cabeçalho `X-CSRF-Token` emitido pelo endpoint base (`/auth/me` ou via payload autenticado). O middleware em `security.js` valida todo verbo `POST`, `PUT` ou `DELETE`.
3. **Validação de Inputs:** Para evitar injeções ou malformações na fila de processamento do robô de triagem, toda entrada é validada na camada de rotas (`validation.js`) antes de atingir os controllers ou `services/`.
4. **Monitoramento/State:** Os verbos `/api/monitor/start` disparam instâncias do bot via provedores de mensageria amarrados a "Session IDs" em concorrência, atualizando o frontend reativamente.

## Desenvolvimento
- **Comandos:** `npm run dev:backend` assiste mudanças e reinicia automaticamente no servidor via `--watch` do node `v18+`.
- **Testes:** `npm run test:backend` executa o suite de integração simulando um usuário que realiza fluxos longos de API, autenticação e WhatsApp mocking (E2E), garantindo contratos saudáveis com o front-end `useShifts` e `useMonitoring`.
- **Rotas principais:** Prefixo `/api/*`. As rotas lidam com autenticação (`/auth/*`), monitoramento do bot (`/monitor/*`), interações na tela de swipe (`/captures`, `/rejections`), parametrizações globais (`/preferences`, `/groups`), e integrações de mensageria (`/whatsapp/*`).