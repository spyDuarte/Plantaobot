# Plantaobot

Demo de interface React para um assistente de captação de plantões médicos com foco em:

- triagem automática de ofertas;
- modo manual por swipe;
- insights financeiros e operacionais;
- painel de configurações e notificações;
- chat de IA contextual.

## Estrutura do repositório

- `src/main.jsx`: ponto de entrada da aplicação (renderiza `src/App.jsx`).
- `src/App.jsx`: shell principal da UI.
- `src/components/*`: componentes React em `PascalCase`.
- `src/hooks/useLocalStorage.js`: hook customizado em `camelCase` com prefixo `use`.

## Como usar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o projeto:

   ```bash
   npm run dev
   ```

3. Para gerar build de produção:

   ```bash
   npm run build
   ```

## Requisitos

- Node.js 18+
- npm 9+

## Observações

- Os dados de plantões, grupos e notificações são mockados para fins de demonstração.
