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

## Configuração de `VITE_BASE_PATH`

O projeto lê a base de publicação via variável de ambiente `VITE_BASE_PATH` no `vite.config.js`.

- **Fallback padrão:** quando `VITE_BASE_PATH` não é definida (ou está vazia), a base usada é `'/'`, ideal para desenvolvimento local.
- A base é normalizada automaticamente para começar e terminar com `/`.

### Exemplos

**Desenvolvimento local (root):**

```bash
npm run dev
```

ou explicitamente:

```bash
VITE_BASE_PATH=/ npm run dev
```

**Build para GitHub Pages (`/Plantaobot/`):**

```bash
VITE_BASE_PATH=/Plantaobot/ npm run build
```

**Build para subpath em servidor (`/apps/plantaobot/`):**

```bash
VITE_BASE_PATH=/apps/plantaobot/ npm run build
```

> Dica: também é possível definir em arquivo `.env.production`:
>
> ```env
> VITE_BASE_PATH=/Plantaobot/
> ```

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
