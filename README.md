# Plantaobot

Demo de interface React para um assistente de captação de plantões médicos com foco em:

- triagem automática de ofertas;
- modo manual por swipe;
- insights financeiros e operacionais;
- painel de configurações e notificações;
- chat de IA contextual.

## Estrutura do projeto

A aplicação está organizada em múltiplos módulos dentro de `src/`.

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

## Fluxo de execução

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Rode em desenvolvimento:

   ```bash
   npm run dev
   ```

3. Gere build de produção:

   ```bash
   npm run build
   ```

4. Faça preview local da build:

   ```bash
   npm run preview
   ```

## Convenções

- **Nomenclatura de arquivos**:
  - Componentes React em `PascalCase` (ex.: `SwipeCard.jsx`).
  - Hooks em `camelCase` iniciando com `use` (ex.: `useLocalStorage.js`).
  - Utilitários, constantes e dados em `camelCase`/nomes descritivos (ex.: `mockData.js`, `colors.js`).
- **Idioma da UI**: priorizar textos em português (pt-BR), mantendo consistência de vocabulário para contexto médico.
- **Estilo de componentes**: manter componentes funcionais, foco em responsabilidade única por arquivo e composição por pastas (`tabs`, `ui`) quando fizer sentido.

## Requisitos

- Node.js 18+
- npm 9+

## Qualidade

No estado atual, o projeto não possui comandos de lint/test configurados em `package.json`.

Quando esses scripts forem introduzidos, esta seção deve ser atualizada com comandos como:

```bash
npm run lint
npm test
```
