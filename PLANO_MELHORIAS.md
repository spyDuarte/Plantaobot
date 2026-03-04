# Plano de melhorias — Plantaobot

## Objetivo
Evoluir o protótipo atual para uma base mais confiável, testável e pronta para integração real com backend, sem perder a agilidade de entrega de UI.

## Diagnóstico rápido do estado atual
- A aplicação já está modularizada por tabs e componentes (`src/components`, `src/components/tabs`), mas a orquestração principal ainda concentra muitas responsabilidades no `App.jsx`.
- Existem testes unitários para utilitários (`src/utils/index.test.js`), porém faltam testes de fluxo dos componentes principais (captura, swipe, exportação e configurações).
- Há persistência parcial em `localStorage` (nome, tela, capturas, grupos, preferências), mas outros estados críticos ainda vivem apenas em memória.
- O fluxo é atualmente baseado em dados mockados (`src/data/mockData.js`), o que facilita demo, mas limita evolução para cenários reais.

## Princípios para priorização
1. **Confiabilidade primeiro**: reduzir risco de regressão em fluxos críticos.
2. **Base para escalar depois**: preparar arquitetura para backend sem reescrever tudo.
3. **Entrega incremental**: dividir mudanças em PRs pequenos, reversíveis e testáveis.

## Roadmap proposto (6 semanas)

### Fase 1 (Semana 1–2) — Qualidade e segurança funcional
**Meta:** aumentar previsibilidade do comportamento atual.

- Criar testes de interface para:
  - início/parada do bot;
  - aceitação/rejeição no modo swipe;
  - aceitação via modal;
  - exportação CSV com dados capturados.
- Cobrir componentes com maior risco de regressão:
  - `ShiftModal`, `SwipeTab`, `CapturedTab`, `SettingsTab`.
- Adicionar validação de entradas de usuário:
  - sanitização básica do nome no onboarding;
  - limite de tamanho e normalização no chat.
- Padronizar mensagens de feedback (toast/notificação) com tipagem única (`success`, `info`, `error`).

**Resultado esperado:** mais segurança para refatorar sem quebrar fluxos existentes.

### Fase 2 (Semana 3–4) — Arquitetura e estado
**Meta:** reduzir complexidade do `App` e facilitar manutenção.

- Migrar o gerenciamento principal para `useReducer` + ações explícitas.
- Extrair lógica de domínio para hooks/serviços:
  - simulação do bot;
  - cálculo e atualização de métricas mensais;
  - ações de captura/rejeição.
- Consolidar persistência:
  - manter em `localStorage` tudo que afeta experiência do usuário ao recarregar.
- Introduzir camada de mapeamento de dados (`ShiftDTO -> ShiftViewModel`) para desacoplar UI de origem dos dados.

**Resultado esperado:** código mais legível, previsível e com menor acoplamento.

### Fase 3 (Semana 5–6) — Preparação para backend e UX
**Meta:** deixar o app pronto para integração real.

- Definir contrato HTTP mínimo (OpenAPI simples ou documento JSON):
  - `GET /shifts`;
  - `POST /captures`;
  - `GET/PUT /preferences`.
- Criar adaptador de API com fallback para mock local (feature flag).
- Implementar estados de carregamento/erro em tabs de feed, capturados e IA.
- Melhorias de acessibilidade:
  - foco visível consistente;
  - labels/roles em controles críticos;
  - navegação por teclado em modal.

**Resultado esperado:** pronto para trocar mock por backend progressivamente, sem ruptura de UX.

## Backlog técnico priorizado

### P0 (imediato)
- Testes de fluxo dos caminhos críticos de captura.
- Padronização de feedback visual (toast/notificação).
- Validação/sanitização de entrada do usuário.

### P1 (curto prazo)
- `useReducer` no estado central.
- Separação da lógica de domínio em hooks.
- Persistência ampliada no `localStorage`.

### P2 (médio prazo)
- Adaptador de API com fallback para mocks.
- Acessibilidade avançada e refinamento de UX.
- Instrumentação básica (eventos de captura/rejeição/erro).

## Indicadores de sucesso
- **Qualidade:** cobertura de testes dos fluxos críticos >= 70%.
- **Confiabilidade:** zero regressões em captura/rejeição em 2 releases consecutivos.
- **Manutenibilidade:** redução do tamanho/responsabilidade de `App.jsx` (meta: apenas composição e roteamento interno).
- **Produto:** tempo médio para concluir captura manual reduzido em 20%.

## Estratégia de execução
- Trabalhar em PRs pequenos por fase (1 objetivo por PR quando possível).
- Cada PR deve incluir:
  - mudança funcional;
  - testes relacionados;
  - breve nota de impacto no README/changelog.
- Revisão com checklist fixo: regressão de fluxo, acessibilidade mínima e persistência.

## Primeiro pacote recomendado (próxima sprint)
1. Escrever testes para `SwipeTab` e `ShiftModal`.
2. Padronizar estrutura de `toast/notif`.
3. Implementar validação simples de onboarding/chat.
4. Atualizar documentação de contribuição com checklist de testes de fluxo.
