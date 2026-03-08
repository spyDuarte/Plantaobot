# Arquitetura do Sistema - Plantaobot

## Visão Geral
O Plantaobot é arquitetado como um sistema SaaS B2B moderno com separação clara de responsabilidades: Front-end React atuando como SPA (Single Page Application) servido via Vite, comunicando-se com um Backend Node/Express que atua como BFF (Backend-For-Frontend).

A aplicação realiza monitoramento, scoring e triagem (aceite ou rejeite) de plantões médicos oriundos de grupos de WhatsApp.

## Componentes Principais

### Frontend (SPA)
- **Framework:** React 18, Vite 6.
- **Padrão de UI:** Design System customizado (focado em acessibilidade B2B SaaS, cores sóbrias, layout "AppShell" responsivo).
- **Gerenciamento de Estado:** Hooks nativos do React acoplados a uma custom hook architecture (`useShifts`, `useMonitoring`) e armazenamento persistente via `useLocalStorage` em sincronia posterior com a API para cache otimista.
- **Roteamento Interno:** Através de um estado simples de `activeTab` orquestrado em `AppMain.jsx` e renderizado via `AppShell.jsx`.

### BFF / Backend (Node + Express)
- **Responsabilidade:** Proxy de requisições, orquestração das regras de negócio pesadas (bot de monitoramento), comunicação direta com provedor de mensageria (WhatsApp/Baileys) e banco de dados via Supabase.
- **Autenticação:** Baseada primordialmente em tokens do Supabase envelopados via Cookies `httpOnly` para evitar ataques XSS, gerando segurança enterprise out-of-the-box para o Frontend. A emissão e validação do token CSRF garante mitigação a ataques do tipo Cross-Site Request Forgery em chamadas mutantes.
- **Tratamento de Erros:** Respostas padronizadas encapsulando retornos reais, consumidas no cliente pela classe `ApiError`.

## Fluxo de Autenticação e Autorização (Modo BFF)
1. O Front-end solicita login com credenciais pelo serviço `authApi.js`.
2. O Express autentica contra o Supabase Auth.
3. Se válido, injeta tokens no request de resposta usando cookies com as flags `httpOnly`, `Secure` e `SameSite`.
4. Chamadas subsequentes (como a `monitoringApi.js`) vão para o BFF e incluem os cookies implicitamente pelo navegador.
5. Se uma requisição para a API retorna 401, o `apiClient.js` despacha um evento de `pb-auth-unauthorized` fazendo o front redirecionar de forma unificada.

## Decisões Arquiteturais e de Redesign
A versão atual foca em um desacoplamento entre UI (Primitivas `components/ui/`) e a lógica de negócios pesada (`AppMain.jsx` delegando para hooks). O design original baseado em Glassmorphism foi refatorado para seguir guias sólidas de UI SaaS B2B (fundo `slate`, texto de alto contraste `slate-900`, cores semânticas padrão do Tailwind como Primary Blue, Success Green e Danger Red, bordas limpas e sombras discretas).