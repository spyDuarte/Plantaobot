# Ordem de execução — PlantãoBot (padrões de referência internacionais)

Este plano prioriza **impacto alto + baixo risco** primeiro, depois evolui para arquitetura e qualidade contínua.

## Fase 0 — Preparação (rápido)
1. Criar baseline do projeto (`npm install`, `npm run build`) para garantir estado inicial estável.
2. Criar branch de trabalho para cada fase (ou subtarefa).
3. Definir checklist de aceitação por fase.

## Fase 1 — Higiene de repositório e padronização de nomes
1. Remover artefatos legados não utilizados (ex.: `plantaobot_6.jsx`).
2. Validar nomenclatura:
   - Componentes: `PascalCase.jsx`
   - Hooks: `useXxx.js`
   - Utils/constantes: nomes claros sem sufixo de versão
3. Garantir imports consistentes após qualquer rename.

## Fase 2 — Documentação confiável
1. Atualizar `README.md` para refletir a arquitetura real modular em `src/`.
2. Documentar setup local, build, preview e convenções.
3. Incluir seção de “Como contribuir” e padrão de commits.

## Fase 3 — Portabilidade de build/deploy
1. Parametrizar `base` do Vite por ambiente (`VITE_BASE_PATH`, com fallback `/`).
2. Documentar exemplos de deploy (root path e subpath).
3. Validar build em ambos cenários.

## Fase 4 — Qualidade de código (gate mínimo)
1. Adicionar ESLint + Prettier com scripts no `package.json`.
2. Criar scripts: `lint`, `lint:fix`, `format`, `test`.
3. Introduzir Vitest + RTL para testes iniciais.

## Fase 5 — Testes de unidade essenciais
1. Cobrir utilitários puros (`fmt`, `nowT`, `calcScore`).
2. Definir critérios mínimos de cobertura (ex.: funções críticas e cenários de borda).
3. Estabilizar testes para execução no CI.

## Fase 6 — Acessibilidade e UX base
1. Revisar semântica HTML e ARIA dos componentes interativos.
2. Verificar navegação por teclado e foco em modal/drawer.
3. Revisar contraste e `prefers-reduced-motion`.

## Fase 7 — Segurança e arquitetura de integração
1. Remover qualquer chave/API sensível do frontend.
2. Introduzir proxy/backend para chamadas de IA.
3. Sanitizar entradas de usuário e validar limites de input.

## Fase 8 — Observabilidade e governança
1. Configurar CI para `lint`, `test`, `build` em pull request.
2. Adicionar template de PR + checklist técnico.
3. Definir versionamento e changelog.

## Critério de pronto por fase
- Código compilando (`npm run build`).
- Checks da fase passando.
- README atualizado quando houver mudança de comportamento/execução.
- PR com descrição objetiva + evidências de validação.
