# Plantaobot

Demo de interface React para um assistente de captação de plantões médicos com foco em:

- triagem automática de ofertas;
- modo manual por swipe;
- insights financeiros e operacionais;
- painel de configurações e notificações;
- chat de IA contextual.

## Estrutura do repositório

- `plantaobot_6.jsx`: componente principal da aplicação (single-file UI).

## Como usar

1. Crie um projeto React (ex.: Vite) ou abra o seu projeto existente.
2. Copie `plantaobot_6.jsx` para `src/App.jsx`.
3. Instale a dependência de gráficos:

   ```bash
   npm install recharts
   ```

4. Inicie o projeto:

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
- React 18+
- `recharts`

## Observações

- O componente injeta estilos globais internamente via `<style>{CSS}</style>`.
- Os dados de plantões, grupos e notificações são mockados no próprio arquivo para fins de demonstração.
