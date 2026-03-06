import { createHttpError } from '../errors.js';

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function createInstanceName(userId) {
  return `user-${String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function toQrCode(value) {
  if (!value) {
    return null;
  }

  const qr = String(value);
  if (qr.startsWith('data:')) {
    return qr;
  }

  if (qr.startsWith('http://') || qr.startsWith('https://')) {
    return qr;
  }

  return `data:image/png;base64,${qr}`;
}

function extractChatItems(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload.chats,
    payload.groups,
    payload.data,
    payload.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function toGroupShape(chat) {
  const id = String(chat?.id || chat?.jid || chat?.remoteJid || '').trim();
  if (!id || !id.endsWith('@g.us')) {
    return null;
  }

  const membersRaw = chat?.participantsCount ?? chat?.participants?.length ?? chat?.members ?? 0;

  return {
    id,
    name: String(chat?.name || chat?.subject || chat?.pushName || 'Grupo sem nome').slice(0, 120),
    members: Number(membersRaw || 0),
    emoji: '🏥',
    active: true,
  };
}

function mapEvolutionError(error) {
  if (error?.name === 'AbortError') {
    return createHttpError(504, 'EVOLUTION_TIMEOUT', 'A Evolution API demorou para responder. Tente novamente em instantes.');
  }

  const status = Number(error?.status || error?.details?.status || 0);
  const detailsMessage = String(error?.details?.message || error?.message || '');
  const lower = detailsMessage.toLowerCase();

  if (status === 401 || status === 403 || lower.includes('invalid api key') || lower.includes('unauthorized')) {
    return createHttpError(502, 'EVOLUTION_INVALID_KEY', 'Falha de autenticação na Evolution API. Verifique a chave da integração.');
  }

  if (status === 409 || lower.includes('already exists') || lower.includes('instance already')) {
    return createHttpError(409, 'EVOLUTION_INSTANCE_EXISTS', 'A instância do WhatsApp já existe. Vamos reutilizar a conexão existente.');
  }

  if (error?.status && error?.code) {
    return error;
  }

  return createHttpError(502, 'EVOLUTION_ERROR', 'Falha ao comunicar com a Evolution API.');
}

export function createWhatsappProvider(config = {}) {
  const baseUrl = normalizeBaseUrl(config.evolutionApiUrl || process.env.EVOLUTION_API_URL || '');
  const apiKey = config.evolutionApiKey || process.env.EVOLUTION_API_KEY || '';

  if (!baseUrl || !apiKey) {
    throw createHttpError(500, 'EVOLUTION_ENV_MISSING', 'Configuração da Evolution API ausente no ambiente.');
  }

  async function requestEvolution(path, { method = 'GET', body, timeoutMs = 15000 } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw createHttpError(response.status, 'EVOLUTION_HTTP_ERROR', data?.message || 'Evolution API request failed.', {
          status: response.status,
          message: data?.message,
          data,
        });
      }

      return data;
    } catch (error) {
      throw mapEvolutionError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async createInstanceForUser({ userId }) {
      const instanceName = createInstanceName(userId);

      try {
        const data = await requestEvolution('/instance/create', {
          method: 'POST',
          body: {
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          },
        });

        return {
          instanceId:
            data?.instance?.instanceName ||
            data?.instance?.instanceId ||
            data?.instanceName ||
            instanceName,
        };
      } catch (error) {
        if (error?.code === 'EVOLUTION_INSTANCE_EXISTS') {
          return { instanceId: instanceName, alreadyExisted: true };
        }

        throw error;
      }
    },

    async getInstanceQr({ instanceId }) {
      const connectPayload = await requestEvolution(`/instance/connect/${instanceId}`, { method: 'GET' });
      const qrPayload = await requestEvolution(`/instance/qrcode/${instanceId}`, { method: 'GET' }).catch(() => null);

      const rawQr =
        connectPayload?.base64 ||
        connectPayload?.qrcode ||
        connectPayload?.qr ||
        qrPayload?.base64 ||
        qrPayload?.qrcode ||
        qrPayload?.qr ||
        null;

      const state =
        connectPayload?.state ||
        connectPayload?.instance?.state ||
        qrPayload?.state ||
        'connecting';

      return {
        qrCode: toQrCode(rawQr),
        state,
      };
    },

    async listInstanceGroups({ instanceId }) {
      const attempts = [
        `/chat/findChats/${instanceId}`,
        `/group/fetchAllGroups/${instanceId}`,
      ];

      let chats = [];
      let lastError = null;

      for (const path of attempts) {
        try {
          const payload = await requestEvolution(path, { method: 'GET' });
          chats = extractChatItems(payload);
          if (chats.length > 0) {
            break;
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (chats.length === 0 && lastError) {
        throw lastError;
      }

      const groups = chats
        .map(toGroupShape)
        .filter(Boolean);

      return groups;
    },
  };
}
