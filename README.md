# Plantaobot

Demo de interface React para um assistente de captação de plantões médicos com foco em:

- triagem automática de ofertas;
- modo manual por swipe;
- insights financeiros e operacionais;
- painel de configurações e notificações;
- chat de IA contextual.

## Estrutura do projeto

- `src/`: código-fonte principal da aplicação React.
- `src/utils/index.js`: funções utilitárias puras (inclui cálculo de score).
- `.github/workflows/ci.yml`: pipeline de qualidade executada em pull requests.

```text
src/
├── components/
│   ├── AIChat.jsx
│   ├── InsightsPanel.jsx
│   ├── NotifDrawer.jsx
│   ├── Onboarding.jsx
│   ├── ShiftModal.jsx
│   ├── SwipeCard.jsx
│   ├── tabs/
│   │   ├── CapturedTab.jsx
│   │   ├── Dashboard.jsx
│   │   ├── FeedTab.jsx
│   │   ├── InsightsTab.jsx
│   │   ├── SettingsTab.jsx
│   │   └── SwipeTab.jsx
│   └── ui/
│       └── index.jsx
├── constants/
│   └── colors.js
├── data/
│   └── mockData.js
├── hooks/
│   └── useLocalStorage.js
└── utils/
    └── index.js
```

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o projeto:

   ```bash
   npm run dev
   ```

## Qualidade de código

O projeto utiliza ESLint + Prettier e testes com Vitest + React Testing Library.

- Verificar lint:

  ```bash
  npm run lint
  ```

- Corrigir lint automaticamente:

  ```bash
  npm run lint:fix
  ```

- Formatar código com Prettier:

  ```bash
  npm run format
  ```

- Executar testes:

  ```bash
  npm run test
  ```

## Contribuição

1. Crie uma branch para sua mudança.
2. Garanta que os comandos abaixo passem localmente:
   - `npm run lint`
   - `npm run test`
3. Abra um Pull Request.

Em PRs, a CI valida automaticamente lint e testes.

## Requisitos

- Node.js 18+
- npm 9+
