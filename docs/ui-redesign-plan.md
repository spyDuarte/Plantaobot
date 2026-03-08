# Plano de Redesign UI/UX Plantaobot

## 1. Visão Geral

O objetivo deste documento é definir as diretrizes arquiteturais e estéticas para a reforma da interface gráfica do **Plantaobot**, transformando-o de um projeto com aparência de protótipo em um produto de software B2B (SaaS) premium, confiável e profissional, focado na área médica.

## 2. Direção de Design (Design Language)

A nova linguagem visual focará em:

- **SaaS Premium/B2B:** Interface voltada para produtividade, clareza e confiabilidade.
- **Minimalismo Funcional:** Menos gradientes intensos, sem fundos complexos (`BgOrbs`), sombras pesadas ou bordas exageradas.
- **Uso Otimizado do Espaço:** Maior respiro entre os elementos (whitespace) sem perder a densidade informacional necessária.
- **Acessibilidade e Contraste:** Cores adequadas e legibilidade superior.

## 3. Tokens de Design (Design System)

### 3.1 Cores (Palette)

- **Background (App):** Cinza ultra-claro (`#f9fafb` ou `#f4f4f5`) para contrastar com os cards.
- **Surface (Cards/Containers):** Branco puro (`#ffffff`).
- **Texto Principal:** Cinza escuro ardósia/chumbo (`#0f172a` ou `#1e293b`).
- **Texto Secundário/Muted:** Cinza médio (`#64748b`).
- **Bordas:** Cinza claro sutil (`#e2e8f0`).
- **Cores Semânticas:**
  - **Primary (Ação principal):** Azul escuro corporativo (`#0f172a` ou um azul mais vibrante mas contido como `#2563eb`).
  - **Success (Captura/Bot On):** Verde bandeira calmo (`#10b981` ou `#059669`).
  - **Warning (Alerta/Bot Off):** Laranja/Âmbar escuro (`#d97706`).
  - **Error (Rejeitado):** Vermelho tijolo (`#dc2626`).
  - **Info:** Azul claro (`#3b82f6`).

### 3.2 Tipografia

- **Fonte Principal:** `Inter`, `Roboto` ou sistema (`system-ui, -apple-system`). Substituir fontes muito estilizadas se não agregarem clareza.
- **Pesos:** 400 (Regular) para texto base, 500 (Medium) para labels/botões, 600 (Semibold) ou 700 (Bold) para títulos e valores monetários.
- **Tamanhos Base:** `14px` corpo, `12px` labels secundários, `18-24px` títulos.

### 3.3 Espaçamentos e Radii

- **Border Radius:** Reduzir para dar um aspecto mais sério. Em vez de `18px`, usar `6px` a `8px` (`--pb-radius-sm` e `--pb-radius-md`).
- **Sombras:** Sombras muito mais sutis, estilo card moderno (ex: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`).

## 4. Reestruturação de Componentes e Layouts

### 4.1 AppShell (Layout Base)

- **Desktop:** Navegação lateral (`sidebar`) limpa, fundo branco, links com hover suave (fundo cinza muito claro), indicando a aba ativa com texto escuro e peso maior. Remover cabeçalhos flutuantes (`pb-topbar` com bordas), usar um cabeçalho mais integrado ao topo.
- **Mobile:** Bottom navigation padronizada, ícones consistentes.

### 4.2 Dashboard (`Dashboard.jsx`)

- Remover dependência de avatares com fundos gradientes complexos.
- Os KPIs (Cards de estatísticas) devem ser retangulares, com títulos em caixa alta (tamanho menor, cor muted) e os números grandes em destaque.

### 4.3 Experiência de Swipe (`SwipeCard.jsx` e `SwipeTab.jsx`)

- **Remover a interação complexa de arrastar (drag) e rotação.**
- Substituir por um layout de **Card Estático ou em Pilha Limpa**, com botões explícitos e largos: `[X Recusar]` e `[V Aceitar]`. Isso reduz falhas de UX, melhora a acessibilidade e passa mais profissionalismo.
- Remover fundos `GlassCard`.

### 4.4 Listagens (`CapturedTab.jsx`)

- Cards de plantões capturados/rejeitados sem bordas espessas coloridas de forma gritante. Utilizar indicadores mais discretos (ex: um pequeno dot colorido ou badge com texto semântico).
- Melhorar alinhamento de valores e datas para leitura rápida (scanning).

### 4.5 Configurações (`SettingsTab.jsx`)

- Apresentar os toggles e sliders com aparência de controles nativos limpos.
- Agrupar sessões logicamente com subtítulos bem delineados e linhas divisórias.

### 4.6 Autenticação (`App.jsx`)

- Substituir o fundo com animações espaciais (`BgOrbs`) por um fundo sólido claro ou gradiente linear extremamente suave.
- Apresentar os inputs empilhados com bordas limpas, botões de ação ocupando 100% da largura.

## 5. Implementação Técnica

- Nenhuma dependência externa pesada deve ser adicionada a não ser que estritamente necessário (o projeto já usa React e Vite). O CSS plain existente em `src/styles/index.js` será refatorado e higienizado.
- O comportamento lógico (estados do React, hooks, chamadas de API) **deve ser preservado integralmente**.
