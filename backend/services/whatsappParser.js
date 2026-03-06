import crypto from 'node:crypto';

// Keywords that indicate a shift offer in Portuguese medical group chats
const OFFER_KEYWORD_PATTERNS = [
  /plant[aã]o/i,
  /sobreaviso/i,
  /escala\s+(m[eé]dic|de\s+plant)/i,
  /vaga\s+(para\s+)?m[eé]dic/i,
  /oportunidade.*plant/i,
  /disponível.*plant/i,
  /plant.*disponível/i,
  /preciso.*m[eé]dic/i,
  /m[eé]dic.*preciso/i,
];

// Value extraction patterns (Brazilian Reais)
const VALUE_PATTERNS = [
  /r\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i,
  /valor[:\s]+r?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i,
  /pagamento[:\s]+r?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i,
  /remunera[cç][aã]o[:\s]+r?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})?)/i,
];

// Hospital/facility extraction patterns
const HOSPITAL_PATTERNS = [
  /hospital[:\s]+([^\n,]+)/i,
  /\bhsp\b[:\s]+([^\n,]+)/i,
  /\bupa\b[:\s]*([^\n,]*)/i,
  /\bhc\b[:\s]+([^\n,]+)/i,
  /unidade[:\s]+([^\n,]+)/i,
  /cl[ií]nica[:\s]+([^\n,]+)/i,
  /pronto.socorro[:\s]+([^\n,]+)/i,
];

// Specialty keyword mapping (Brazilian medical specialties)
const SPECIALTY_MAP = {
  'cl[ií]nica\s+geral': 'Clínica Geral',
  'cl[ií]nica': 'Clínica Geral',
  'emerg[eê]ncia': 'Emergência',
  'pronto.socorro': 'Emergência',
  'ps\b': 'Emergência',
  'pediatria': 'Pediatria',
  'pediatr': 'Pediatria',
  '\buti\b': 'UTI',
  'terapia\s+intensiva': 'UTI',
  'psiquiatria': 'Psiquiatria',
  'psiquiatr': 'Psiquiatria',
  'cardiologia': 'Cardiologia',
  'cardio\b': 'Cardiologia',
  'ortopedia': 'Ortopedia',
  'ortoped': 'Ortopedia',
  'ginecologia': 'Ginecologia',
  'obstet': 'Obstetrícia',
  'neurologia': 'Neurologia',
  'neuro\b': 'Neurologia',
  'cirurgia\s+geral': 'Cirurgia Geral',
  'anestesia': 'Anestesiologia',
  'dermatologia': 'Dermatologia',
  'oftalmologia': 'Oftalmologia',
};

// Brazilian weekday labels
const WEEKDAY_LABELS = {
  segunda: 'Seg',
  'ter[cç]a': 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  's[aá]bado': 'Sáb',
  domingo: 'Dom',
};

function parseValue(text) {
  for (const pattern of VALUE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].replace(/\./g, '').replace(',', '.');
      const num = parseFloat(raw);
      if (!Number.isNaN(num) && num > 0 && num < 100000) {
        return num;
      }
    }
  }
  return 0;
}

function parseHospital(text) {
  for (const pattern of HOSPITAL_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.length >= 2) {
        return name.slice(0, 100);
      }
    }
  }
  return null;
}

function parseSpecialty(text) {
  const lower = text.toLowerCase();
  for (const [pattern, label] of Object.entries(SPECIALTY_MAP)) {
    if (new RegExp(pattern, 'i').test(lower)) {
      return label;
    }
  }
  return 'Clínica Geral';
}

function parseDate(text) {
  // Day name + numeric date: "Sexta 15/03" or "Sábado, 22/02"
  for (const [pattern, label] of Object.entries(WEEKDAY_LABELS)) {
    const regex = new RegExp(`(${pattern})[,\\s]+(\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?)`, 'i');
    const match = text.match(regex);
    if (match) {
      return `${label} ${match[2]}`;
    }
  }

  // "data: 15/03"
  const dataMatch = text.match(/data[:\s]+([^\n]+)/i);
  if (dataMatch?.[1]) {
    return dataMatch[1].trim().slice(0, 40);
  }

  // Bare numeric date
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/);
  if (dateMatch) {
    return dateMatch[1];
  }

  return '';
}

function parseHours(text) {
  // Range format: "07h às 19h" or "07x19" or "07 a 19"
  const rangeMatch = text.match(/(\d{1,2})h?\s*(?:[aà×x]|às)\s*(\d{1,2})h/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    let diff = end - start;
    if (diff <= 0) diff += 24;
    return `${diff}h`;
  }

  // Colon time range: "07:00 a 19:00"
  const colonMatch = text.match(/(\d{2}):00\s*[aà]\s*(\d{2}):00/);
  if (colonMatch) {
    const start = parseInt(colonMatch[1], 10);
    const end = parseInt(colonMatch[2], 10);
    let diff = end - start;
    if (diff <= 0) diff += 24;
    return `${diff}h`;
  }

  // Duration mention: "12 horas" or "duração: 12h"
  const durationMatch = text.match(/(\d+)\s*horas?/i) || text.match(/dura[cç][aã]o[:\s]+(\d+)\s*h/i);
  if (durationMatch) {
    return `${durationMatch[1]}h`;
  }

  // Common shift length keywords
  if (/plant[aã]o\s+de\s+6h/i.test(text)) return '6h';
  if (/plant[aã]o\s+de\s+24/i.test(text)) return '24h';

  return '12h';
}

function parseLocation(text) {
  // "Cidade: São Paulo" or "SP - São Paulo"
  const cityMatch =
    text.match(/cidad[ae][:\s]+([^\n,]+)/i) ||
    text.match(/bairro[:\s]+([^\n,]+)/i) ||
    text.match(/\b([A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕ][a-záéíóúâêîôûãõ]+)*)\s*[-–]\s*[A-Z]{2}\b/);

  if (cityMatch?.[1]) {
    return cityMatch[1].trim().slice(0, 80);
  }

  return '';
}

/**
 * Determines whether a message text looks like a medical shift offer.
 * @param {string} text
 * @returns {boolean}
 */
export function isShiftOffer(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  return OFFER_KEYWORD_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Parses a shift offer from raw message text.
 * @param {string} text
 * @param {{ groupName?: string, senderName?: string, messageId?: string | null }} options
 * @returns {object} Normalized shift offer
 */
export function parseShiftOffer(text, { groupName = '', senderName = '', messageId = null } = {}) {
  const id = messageId || crypto.randomUUID();
  const val = parseValue(text);
  const hospital = parseHospital(text) || groupName || 'Unidade não informada';
  const spec = parseSpecialty(text);
  const date = parseDate(text);
  const hours = parseHours(text);
  const loc = parseLocation(text);

  return {
    id,
    group: groupName || 'WhatsApp',
    sender: senderName || 'Grupo',
    av: (senderName || groupName || 'W').charAt(0).toUpperCase(),
    hospital,
    spec,
    val,
    date,
    hours,
    loc,
    dist: 0,
    rawMsg: text.slice(0, 500),
    isOffer: true,
    state: 'done',
  };
}

/**
 * Normalizes an incoming Evolution API webhook payload into a common message format.
 * Supports both "messages.upsert" and "message" event names.
 * @param {object} payload
 * @returns {{ messageId, jid, isGroup, text, senderName, groupName, timestamp, instanceId } | null}
 */
export function normalizeEvolutionApiMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const event = String(payload.event || '');
  if (!event.includes('message')) {
    return null;
  }

  const data = payload.data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const messageText =
    data.message?.conversation ||
    data.message?.extendedTextMessage?.text ||
    data.message?.imageMessage?.caption ||
    null;

  if (!messageText || typeof messageText !== 'string') {
    return null;
  }

  const jid = String(data.key?.remoteJid || '');
  const isGroup = jid.endsWith('@g.us');
  const messageId = data.key?.id ? String(data.key.id) : null;
  const senderName = data.pushName ? String(data.pushName) : '';
  const groupName = data.verifiedBizName ? String(data.verifiedBizName) : '';

  const rawTimestamp = data.messageTimestamp;
  const timestamp = rawTimestamp
    ? new Date(Number(rawTimestamp) * 1000).toISOString()
    : new Date().toISOString();

  return {
    messageId,
    jid,
    isGroup,
    text: messageText,
    senderName,
    groupName,
    timestamp,
    instanceId: payload.instance ? String(payload.instance) : null,
  };
}

/**
 * Normalizes an incoming WhatsApp Business Cloud API webhook payload.
 * @param {object} payload
 * @returns {{ messageId, jid, isGroup, text, senderName, groupName, timestamp, instanceId } | null}
 */
export function normalizeWhatsappCloudMessage(payload) {
  try {
    if (payload?.object !== 'whatsapp_business_account') {
      return null;
    }

    const change = payload?.entry?.[0]?.changes?.[0]?.value;
    if (!change) {
      return null;
    }

    const message = change.messages?.[0];
    if (!message || message.type !== 'text') {
      return null;
    }

    const text = message.text?.body;
    if (!text || typeof text !== 'string') {
      return null;
    }

    const senderName = change.contacts?.[0]?.profile?.name || String(message.from);
    const rawTimestamp = message.timestamp;
    const timestamp = rawTimestamp
      ? new Date(Number(rawTimestamp) * 1000).toISOString()
      : new Date().toISOString();

    return {
      messageId: String(message.id),
      jid: String(message.from),
      isGroup: false,
      text,
      senderName,
      groupName: '',
      timestamp,
      instanceId: change.metadata?.phone_number_id ? String(change.metadata.phone_number_id) : null,
    };
  } catch {
    return null;
  }
}

/**
 * Tries to parse an incoming webhook payload from any supported WhatsApp bridge.
 * Returns null if the payload format is unrecognized or does not contain a text message.
 * @param {object} payload
 * @returns {{ messageId, jid, isGroup, text, senderName, groupName, timestamp, instanceId } | null}
 */
export function normalizeIncomingWebhook(payload) {
  return normalizeEvolutionApiMessage(payload) || normalizeWhatsappCloudMessage(payload);
}
