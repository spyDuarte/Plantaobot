# Roadmap de 6 semanas — Plantaobot

## Base usada deste roadmap (evidências do repositório)
- Frontend React/Vite já modularizado por tabs e componentes, com testes unitários em utilitários e algumas telas.  
- Backend Express já implementado com autenticação (cookies + fallback Bearer), validação e CSRF.  
- Há duas estratégias de auth (`supabase` direto no cliente ou `bff` com backend), controladas por variáveis de ambiente.  
- Existe plano macro de 90 dias e ordem de execução priorizando confiabilidade, segurança, documentação e gates de qualidade.  
- Fluxos críticos de regressão já estão mapeados (auth, swipe/captura, preferências, exportação, lint/test/build).

---

## Milestones (6 semanas)

### M1 — Estabilização de fluxos críticos (fim da Semana 2)
**Objetivo:** reduzir regressões nos fluxos de maior valor (auth + captura).

**Entregáveis de milestone**
- Checklist de regressão incorporado ao template/ritual de PR.
- Testes cobrindo fluxos críticos de frontend e backend (mínimo: auth, swipe, captura, preferências).
- Padronização de mensagens de erro e validações de input entre cliente e servidor.

### M2 — Contratos e robustez de integração (fim da Semana 4)
**Objetivo:** tornar frontend/backend previsíveis e mais fáceis de evoluir.

**Entregáveis de milestone**
- Contrato mínimo documentado para endpoints principais (`/auth`, `/monitor`, `/captures`, `/preferences`, `/groups`).
- Camada de API no frontend com tratamento de erro consistente por tipo de falha.
- Observabilidade mínima no backend (logs estruturados por rota e erro).

### M3 — Hardening para release contínuo (fim da Semana 6)
**Objetivo:** elevar confiança de deploy e preparar operação inicial.

**Entregáveis de milestone**
- Gates obrigatórios de qualidade (lint, testes, build) em PR e branch principal.
- Revisão de segurança aplicada (headers, limites de input, verificação de configuração por ambiente).
- Runbook curto de deploy/rollback + troubleshooting.

---

## Plano semana a semana

| Semana | Objetivo | Entregáveis claros |
|---|---|---|
| **Semana 1** | Baseline técnico e alinhamento de qualidade | (1) Rodar baseline local (`install`, `lint`, `test`, `build`) e registrar status; (2) Formalizar checklist de regressão no fluxo de PR; (3) Mapear gaps de cobertura dos fluxos críticos (auth, swipe, captura, preferências). |
| **Semana 2** | Cobertura de fluxos críticos | (1) Adicionar/ajustar testes de UI para ações críticas em tabs (aceitar/recusar/capturar); (2) Expandir testes backend para cenários de erro/validação; (3) Padronizar payloads de erro frontend/backend. |
| **Semana 3** | Contratos de API e consistência de integração | (1) Documentar contrato mínimo dos endpoints usados pelo app; (2) Garantir alinhamento entre `apiClient` e respostas do backend (status/códigos/estrutura); (3) Definir fallback controlado quando endpoint opcional não existir. |
| **Semana 4** | Resiliência operacional e telemetria básica | (1) Implementar logs estruturados por request e erro no backend; (2) Revisar monitoramento de falhas dos fluxos de captura/monitor; (3) Consolidar tratamento de 401/403 e sessão expirada no frontend. |
| **Semana 5** | UX de estados críticos e acessibilidade mínima | (1) Padronizar estados de loading/erro/sucesso nos fluxos principais; (2) Melhorar acessibilidade dos componentes interativos-chave (foco/labels/teclado); (3) Revisar regressão de exportação e notificações. |
| **Semana 6** | Hardening + preparação de release | (1) Fechar gates de CI obrigatórios (`lint`, `test`, `build`); (2) Aplicar revisão de segurança (cookies/cors/csrf/configuração por ambiente); (3) Publicar runbook de deploy/rollback com checklist de verificação pós-release. |

---

## Dependências explícitas
- **Infra de ambiente:** variáveis de ambiente corretas para frontend e backend (ex.: `VITE_API_BASE_URL`, `VITE_AUTH_PROVIDER`, credenciais Supabase e cookies).
- **Supabase:** projeto configurado (URL, chaves, redirect URLs) para suportar ambos os modos de autenticação.
- **CI/CD:** pipeline com execução de `lint`, `test` e `build` em PR.
- **Dados/contratos:** alinhamento entre payloads esperados pelo frontend e respostas reais do backend.
- **Disciplina de PR:** uso consistente do checklist de regressão para evitar “passou local, quebrou em produção”.

## Riscos explícitos e mitigação
- **Risco 1 — Quebra de contrato API durante evolução paralela frontend/backend.**  
  **Mitigação:** contrato mínimo versionado + testes de integração por endpoint crítico.

- **Risco 2 — Regressão de autenticação por diferenças entre modo `supabase` e `bff`.**  
  **Mitigação:** matriz de testes para os dois modos e validação explícita de sessão expirada/renovação.

- **Risco 3 — Escopo de refatoração crescer e atrasar entregas.**  
  **Mitigação:** limitar WIP por semana, PRs pequenos por fluxo e congelamento de escopo no meio do ciclo (fim da Semana 3).

- **Risco 4 — Falta de observabilidade mascarar falhas em produção.**  
  **Mitigação:** logs estruturados mínimos + eventos de erro/captura + critérios de triagem de incidentes.

- **Risco 5 — Dependência de configuração manual de ambiente gerar comportamento inconsistente.**  
  **Mitigação:** checklist de configuração por ambiente (dev/homolog/prod) e validação automática no startup quando possível.

---

## Definição de pronto ao final das 6 semanas
- Fluxos críticos protegidos por testes e checklist operacional.
- Contratos de integração documentados e estáveis.
- Pipeline com gates de qualidade ativos.
- Segurança e operação básica (runbook) estabelecidas para evoluir com menor risco.
