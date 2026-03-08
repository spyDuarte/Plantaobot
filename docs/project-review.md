# Diagnóstico Técnico e Plano de Melhorias - Plantaobot

## Visão Geral

O **Plantaobot** é uma plataforma SaaS B2B focada na captação de plantões médicos de forma automatizada e manual. O projeto possui um front-end em React + Vite e um backend Express (operando também como BFF - Backend for Frontend para algumas rotas de autenticação e API).

Atualmente, o projeto apresenta um protótipo funcional bem estruturado, mas que precisa de um refinamento de design (UI/UX) para refletir o aspecto premium de um SaaS B2B, além de refatorações de código e de componentes grandes (como `AppMain.jsx`) para melhorar a modularidade e a sustentabilidade a longo prazo.

## 1. Diagnóstico Técnico

### 1.1 Arquitetura Atual
- **Frontend:** React 18, Vite. Utiliza um estado distribuído de forma mista (alguns estados locais grandes em componentes como `AppMain.jsx`, que atua como orquestrador).
- **Estilos:** O projeto adota CSS-in-JS misturado com um arquivo `styles/index.js` global e definições estáticas. A interface tenta simular um "Glassmorphism" que, embora moderno, não se adequa bem a um SaaS B2B que demanda alta legibilidade, contrastes claros e um visual mais formal.
- **Backend:** Node.js com Express e integrações diretas ao Supabase, cobrindo rotas operacionais.
- **Autenticação:** O sistema suporta dois modos (via Supabase no cliente ou BFF). O gerenciamento de cookies httpOnly no BFF é o formato recomendado para produção por segurança.

### 1.2 Gargalos e Dívidas Técnicas Identificadas
- **Design System Confuso (UI/UX):** Cores neon, elementos "glass", animações excessivas (como confetes e "Orbs") que prejudicam a percepção de uma ferramenta profissional (B2B).
- **Componentes Gigantes:** `AppMain.jsx` possui mais de 800 linhas, acumulando lógicas de rotas (tabs), controle de modais, notificações, onboarding e a integração com hooks complexos de monitoramento e de manipulação de turnos.
- **Acessibilidade Limitada:** Em alguns pontos do front-end o foco e o contraste podem ser otimizados (embora existam atributos aria já implementados).
- **Acoplamento:** Alguns hooks de dados ainda se comunicam excessivamente com o local storage, misturando lógica de cache com a de persistência no backend.

### 1.3 Oportunidades de Melhoria
- **Redesign UI/UX B2B:** Simplificar paleta de cores para um tom "limpo" (cinzas, brancos, azuis e estados de cor de ação primária bem definidos), eliminando efeitos visuais supérfluos (orbs, reflexos desnecessários) e melhorando a hierarquia tipográfica.
- **Refatoração Estrutural:** Migrar a gestão das tabs e layout principal para uma estrutura de rotas mais declarativa, dividindo o `AppMain.jsx` em pequenos componentes orquestradores.
- **Fortalecimento do BFF:** Padronizar as chamadas API a partir do client para usarem os contratos definidos nos services, com um fallback robusto e tratamento de erro centralizado.

---

## 2. Plano de Execução e Melhorias

O plano a seguir descreve a ordem das tarefas que serão realizadas durante esta intervenção, focando nas prioridades dadas pelo usuário (Redesign e desacoplamento).

### Passo 1: Redesign UI/UX - "B2B Premium" (Prioridade Máxima)
- [x] Analisar a paleta de cores atual (`src/constants/colors.js`).
- [ ] Refatorar `colors.js` para tons sóbrios: fundos brancos/cinza claro, textos escuros de alto contraste, e acentos em azul corporativo (Primary).
- [ ] Atualizar `styles/index.js` removendo "glass effects", sombras difusas pesadas, ajustando bordas, raios (border-radius) e transições sutis.
- [ ] Adaptar primitivas (`components/ui/primitives.jsx` e `components/ui/index.jsx`) para seguir este novo padrão visual limpo.
- [ ] Remover ou silenciar animações que não agreguem valor operacional (ex: Confetti, BgOrbs).

### Passo 2: Refatoração do Frontend e Desacoplamento
- [ ] Simplificar `AppMain.jsx`, extraindo lógicas pesadas para hooks ou dividindo a responsabilidade do layout principal.
- [ ] Assegurar que os componentes das Tabs (`Dashboard.jsx`, `FeedTab.jsx`, etc.) recebam apenas as `props` estritamente necessárias ou que consumam os contextos/hooks de domínio apropriados.

### Passo 3: Revisão da Camada de API e Integração
- [ ] Validar se os serviços (`services/monitoringApi.js`, `services/growthApi.js`, etc.) tratam erros de forma padronizada (`ApiError`).
- [ ] Documentar o fluxo de autenticação (BFF vs Supabase).

### Passo 4: Documentação Final e Validação
- [ ] Gerar documentação complementar solicitada (Arquitetura, Frontend, Backend, Setup).
- [ ] Executar pipeline de validação (Lint, Prettier, Tests, Build) garantindo que as mudanças não introduziram regressões.

---

Este documento serve como o diagnóstico inicial para guiar a execução das mudanças. As próximas etapas serão dedicadas ao ajuste direto do código-fonte com foco no Redesign B2B.