# Frontend B2B - Plantaobot

## Estrutura do Frontend

O frontend é um projeto React 18 e Vite 6, voltado para operações clínicas médicas via B2B SaaS.

A arquitetura do front foi construída para separar claramente UI, Lógica de Negócios e Serviços de Integração, com foco em estabilidade e um "look & feel" limpo.

```text
src/
├── components/          # Componentes visuais
│   ├── layout/          # Layout base (AppShell)
│   ├── tabs/            # Componentes conteudistas por aba do app
│   └── ui/              # Design System base (Card, Button, Tabs, ToastViewport, etc)
├── config/              # Feature flags
├── constants/           # Cores do Design System SaaS B2B, constantes de estilo
├── data/                # Dados mockados e utilitários
├── hooks/               # Regras de negócio extraídas do AppMain.jsx (useShifts, useMonitoring, useLocalStorage)
├── models/              # Fábricas e definições de dados para a UI
├── services/            # Camada de comunicação com o Backend (apiClient.js, authApi.js, etc)
├── styles/              # Global CSS injetado e variáveis root CSS baseadas no constants/colors.js
├── utils/               # Funções de utilidade gerais (growthTracking, authValidation)
├── App.jsx              # Root e Auth Gate
└── AppMain.jsx          # Orquestrador das abas pós-login
```

## UI B2B Premium
A interface adota um layout de Dashboard Padrão (`AppShell.jsx`): sidebar lateral desktop, topbar com ações rápidas e barra de navegação inferior mobile.

As primitivas de UI (`src/components/ui/primitives.jsx`) foram modeladas utilizando padrões inspirados no TailwindCSS, evitando "Glassmorphism" excessivo em favor de:
1. **Backgrounds sólidos e limpos:** Fundo `surface1` (#ffffff) e borders `borderStrong` e `border`.
2. **Sombras sutis e elevadas:** Redução drástica das box-shadows. Usos em foco (`focus-visible`) recebem outlines nítidos.
3. **Botões sólidos:** Variante `primary` com feedback visual imediato (`hover` e `active`) com cores consistentes para SaaS (azul principal `primary`, vermelho `danger`).
4. **Toast e Notificações:** Sistema enxuto de feedback interativo ancorado à API de notificação base (`ToastViewport`).

## Gerenciamento de Estado
- Não utilizamos Redux ou Zustand. O estado da sessão de autenticação é tratado na raiz (`App.jsx`).
- O estado de negócio pesado da aplicação (lista de turnos, estado do robô, status do grupo, pendências) é tratado em `AppMain.jsx` acoplado via Custom Hooks (`useShifts.js` e `useMonitoring.js`), propagando callbacks puras para os componentes filhos (`tabs/`). Isso mantém os componentes de folha extremamente testáveis e burros em relação a API.

## Padrões de Código e Lint
Todos os arquivos seguem convenção em `.js` ou `.jsx`. Prettier é responsável pela formatação obrigatória (`npm run format`), o ESLint pelas restrições (`npm run lint`), com base forte em `eslint-plugin-react-hooks`. O repositório está testado por `vitest` em `npm run test`.