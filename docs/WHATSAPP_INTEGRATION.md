# Integração WhatsApp — PlantãoBot

Este documento descreve como configurar a integração real do PlantãoBot com o WhatsApp para monitorar grupos e detectar ofertas de plantão automaticamente.

---

## Visão geral da arquitetura

```
WhatsApp ──► Evolution API ──► Webhook ──► Backend PlantãoBot
                                               │
                                               ├── Parser de mensagens
                                               ├── Detecção de ofertas
                                               └── Supabase (persistência)
                                                       │
                                               Frontend (React) ◄── polling /api/monitor/feed
```

O PlantãoBot usa a **Evolution API** como bridge entre o WhatsApp e o backend. A Evolution API gerencia a conexão com o WhatsApp (via QR code) e encaminha as mensagens recebidas para o webhook do PlantãoBot.

---

## Pré-requisitos

| Componente         | Descrição                                              |
| ------------------ | ------------------------------------------------------ |
| Evolution API      | Serviço self-hosted ou gerenciado para bridge WhatsApp |
| Supabase           | Banco de dados e autenticação                          |
| Backend PlantãoBot | Node.js em execução (Render, Railway, VPS, etc.)       |

---

## 1. Instalar e configurar a Evolution API

A Evolution API é um projeto open-source que funciona como bridge entre o WhatsApp (protocolo Baileys) e seu backend via webhooks.

### Opção A — Docker (recomendado)

```bash
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-secreta \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  --name evolution-api \
  atendai/evolution-api:latest
```

### Opção B — Serviço gerenciado

Você pode usar serviços como [EvolutionAPI Cloud](https://evolution-api.com) ou fazer deploy em Railway/Render.

---

## 2. Configurar variáveis de ambiente no backend

Copie `.env.example` para `.env` e preencha as variáveis da Evolution API:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com   # sem barra final
EVOLUTION_API_KEY=sua-chave-global-da-evolution-api
```

As demais variáveis necessárias:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
COOKIE_SECRET=<string-aleatória-longa>
APP_BASE_URL=https://seu-frontend.github.io
```

---

## 3. Executar as migrations do banco de dados

Execute os scripts SQL no painel do Supabase (SQL Editor) em ordem:

```
backend/sql/001_auth_and_operational_schema.sql
backend/sql/002_whatsapp_schema.sql
backend/sql/002_rls_policies.sql
```

---

## 4. Conectar o WhatsApp via QR code

1. Acesse o PlantãoBot no navegador e faça login
2. Vá em **Configurações** → seção **Integração WhatsApp**
3. Clique em **Conectar WhatsApp**
4. Um QR code será exibido — escaneie-o com o WhatsApp no celular:
   - Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho
5. Após a leitura, o status mudará para **Conectado**

---

## 5. Configurar o webhook na Evolution API

Após conectar o WhatsApp, copie a **URL do Webhook** exibida na tela de configurações:

```
https://seu-backend.onrender.com/api/whatsapp/webhook/<userId>?token=<webhookToken>
```

Configure esta URL nas instâncias da Evolution API para que as mensagens sejam encaminhadas ao PlantãoBot. Você pode fazer isso via:

### Via API REST da Evolution API

```bash
curl -X POST https://sua-evolution-api.com/webhook/set/<instanceName> \
  -H "apikey: sua-chave" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-backend.onrender.com/api/whatsapp/webhook/<userId>?token=<webhookToken>",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'
```

### Via painel da Evolution API

Acesse o painel da sua instância → Configurações → Webhook → Cole a URL copiada do PlantãoBot.

> **Importante:** O token do webhook é secreto e autentica as requisições. Clique em **Novo token** para rotacioná-lo caso suspeite de comprometimento.

---

## 6. Sincronizar grupos do WhatsApp

1. Em **Configurações** → **Integração WhatsApp**, clique em **Sincronizar grupos do WhatsApp**
2. Os grupos dos quais seu número participa serão listados em **Grupos monitorados**
3. Ative os grupos que devem ser monitorados usando o toggle ao lado de cada um

---

## 7. Iniciar o monitoramento

1. No Dashboard ou na barra superior, clique em **Iniciar**
2. O bot começará a monitorar as mensagens dos grupos ativos
3. Mensagens com palavras-chave de plantão serão detectadas automaticamente e aparecem no **Feed**
4. Ofertas identificadas são pontuadas e, no modo automático, capturadas imediatamente

---

## Palavras-chave detectadas

O parser identifica ofertas de plantão por palavras-chave como:

- `plantão`, `plantao`
- `sobreaviso`
- `cobertura`
- `urgente`
- `encaixe`
- `troca de plantão`
- `vaga para médico`
- `disponibilidade imediata`

---

## Compatibilidade de webhooks

O PlantãoBot aceita webhooks de:

| Provedor                           | Suporte                           |
| ---------------------------------- | --------------------------------- |
| Evolution API (Baileys)            | ✅ Nativo                         |
| WhatsApp Business Cloud API (Meta) | ✅ Nativo                         |
| WPPConnect                         | ✅ (formato similar ao Evolution) |

---

## Solução de problemas

| Sintoma                                    | Causa provável                                      | Solução                                             |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| "Integração Evolution API não configurada" | `EVOLUTION_API_URL` ou `EVOLUTION_API_KEY` ausentes | Adicione ao `.env` do backend e reinicie            |
| QR code não aparece                        | Evolution API inacessível                           | Verifique se a URL e a chave estão corretas         |
| Mensagens não chegam no Feed               | Webhook não configurado                             | Copie a URL do webhook e configure na Evolution API |
| Token inválido (401)                       | Token expirado ou incorreto                         | Clique em **Novo token** e reconfigure o webhook    |
| Grupos não aparecem                        | WhatsApp não conectado ou sem grupos                | Certifique-se de estar em pelo menos um grupo       |

---

## Segurança

- O token do webhook é único por usuário e valida cada requisição recebida
- As mensagens são armazenadas com Row Level Security (RLS) no Supabase — cada usuário acessa apenas seus próprios dados
- A Evolution API nunca recebe credenciais do usuário — apenas encaminha mensagens via webhook autenticado
