# Plano de melhorias — Plantaobot

## Objetivo
Evoluir o produto de protótipo funcional para uma aplicação confiável em produção, com foco em qualidade, integração backend, observabilidade e melhor experiência de uso.

## Diagnóstico do cenário atual
- O frontend já possui boa separação por componentes e tabs, mas ainda depende de estados centralizados com alta responsabilidade no fluxo principal.
- Existem testes em utilitários e API, porém faltam testes de jornada de usuário ponta a ponta (captura, swipe, preferências e autenticação).
- Backend já contém estrutura de autenticação e validação, mas precisa reforçar contratos, monitoramento e cobertura de testes de integração.
- Persistência local e dados mockados ajudam no desenvolvimento rápido, mas criam lacunas para comportamento consistente em ambiente real.

## Princípios de execução
1. **Confiabilidade antes de velocidade**: primeiro eliminar riscos de regressão.
2. **Incremental e reversível**: entregas pequenas, com rollback simples.
3. **Medição contínua**: toda melhoria precisa de indicador de sucesso.
4. **Pronto para produção**: segurança, logs e documentação não são opcionais.

---

## Roadmap de melhorias (90 dias)

### Fase 1 (Semanas 1–3) — Estabilização de fluxos críticos
**Meta:** reduzir bugs nos fluxos de maior valor.

#### Entregas
- Cobrir jornadas críticas com testes de interface e integração:
  - login/logout;
  - aceitar/rejeitar item no swipe;
  - captura manual e exportação;
  - atualização de preferências.
- Padronizar validações de entrada (frontend + backend):
  - limites de tamanho;
  - normalização/sanitização;
  - mensagens de erro consistentes.
- Criar checklist de regressão para PRs (autenticação, captura, exportação, notificações).

#### Indicadores de sucesso
- Cobertura dos fluxos críticos >= 70%.
- Redução de bugs funcionais em homologação em pelo menos 40%.

---

### Fase 2 (Semanas 4–7) — Arquitetura e integração backend
**Meta:** diminuir acoplamento e facilitar evolução.

#### Entregas
- Refatorar estado principal para `useReducer`/ações explícitas.
- Extrair lógica de domínio para hooks/serviços reutilizáveis.
- Consolidar camada de API:
  - contratos claros por endpoint;
  - tratamento de erros unificado;
  - fallback controlado para mocks via feature flag.
- Definir e documentar contrato mínimo da API (ex.: OpenAPI enxuta).

#### Indicadores de sucesso
- Redução do tamanho e complexidade do componente principal.
- Menor duplicação de lógica de negócio entre tabs.
- Tempo médio de implementação de nova funcionalidade reduzido.

---

### Fase 3 (Semanas 8–10) — UX, acessibilidade e observabilidade
**Meta:** melhorar experiência e dar visibilidade operacional.

#### Entregas
- Acessibilidade:
  - foco visível consistente;
  - labels e roles corretos;
  - navegação por teclado em componentes interativos.
- UX:
  - estados de loading/erro vazios padronizados;
  - feedback visual unificado para sucesso, aviso e erro.
- Observabilidade:
  - logs estruturados no backend;
  - eventos de produto (captura, rejeição, erro);
  - monitoramento básico de falhas por endpoint.

#### Indicadores de sucesso
- Queda na taxa de abandono em fluxos de captura.
- Tempo de diagnóstico de erro reduzido em incidentes reais.

---

### Fase 4 (Semanas 11–12) — Hardening e preparação de release
**Meta:** elevar confiança para release contínuo.

#### Entregas
- Revisão de segurança:
  - validação de permissões;
  - rate limiting e headers de segurança;
  - revisão de dados sensíveis em logs.
- Pipeline de qualidade:
  - lint + testes + build como gates obrigatórios.
- Documentação operacional:
  - runbook de deploy/rollback;
  - guia de troubleshooting;
  - definição de SLO inicial.

#### Indicadores de sucesso
- Build quebrado em main próximo de zero.
- Tempo de rollback e recuperação mensurável e reduzido.

---

## Backlog priorizado

### P0 (imediato)
- Testes de fluxo ponta a ponta dos cenários críticos.
- Padronização de validações e mensagens de erro.
- Checklist de regressão no processo de PR.

### P1 (curto prazo)
- Refatoração do estado central e separação da lógica de domínio.
- Camada de API com contratos explícitos e fallback.
- Melhoria de loading/error states na interface.

### P2 (médio prazo)
- Acessibilidade avançada.
- Observabilidade e eventos de produto.
- Hardening de segurança e runbook operacional.

## Plano de execução por sprint
- **Sprint 1:** testes críticos + validações + checklist de PR.
- **Sprint 2:** refatoração de estado + extração para hooks/serviços.
- **Sprint 3:** contratos de API + fallback mock + UX de erro/loading.
- **Sprint 4:** acessibilidade + observabilidade + hardening + documentação.

## Riscos e mitigação
- **Risco:** escopo de refatoração crescer demais.
  - **Mitigação:** limitar PRs a uma responsabilidade por vez.
- **Risco:** mudanças de backend quebrarem frontend.
  - **Mitigação:** contrato versionado e testes de integração por endpoint.
- **Risco:** baixa adesão a padrões de qualidade.
  - **Mitigação:** gates automáticos no CI e checklist obrigatório.

## Resultado esperado ao final do ciclo
- Plataforma com menor taxa de regressão.
- Código mais simples de manter e evoluir.
- Integração backend mais previsível.
- Melhor experiência para usuários e maior confiança para releases frequentes.
