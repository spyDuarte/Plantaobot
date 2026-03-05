import { createHttpError } from './errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireString(value, field, { min = 1, max = 255 } = {}) {
  const normalized = normalizeString(value);
  if (normalized.length < min || normalized.length > max) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: `Campo ${field} precisa ter entre ${min} e ${max} caracteres.`,
    });
  }
  return normalized;
}

function optionalString(value, { max = 255 } = {}) {
  if (value == null) {
    return null;
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, max);
}

function requireEmail(value, field = 'email') {
  const email = requireString(value, field, { min: 5, max: 320 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: 'Email em formato inválido.',
    });
  }
  return email;
}

function requirePassword(value, field = 'password', minLength = 8) {
  const password = requireString(value, field, { min: minLength, max: 128 });
  if (password.includes(' ')) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: 'Senha não pode conter espaços.',
    });
  }
  return password;
}

function ensureObject(value, field = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: `Campo ${field} precisa ser um objeto.`,
    });
  }
  return value;
}

function ensureArray(value, field, { max = 500 } = {}) {
  if (!Array.isArray(value)) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: `Campo ${field} precisa ser uma lista.`,
    });
  }

  if (value.length > max) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field,
      message: `Campo ${field} excedeu o limite de ${max} itens.`,
    });
  }

  return value;
}

function sanitizeOffer(input) {
  if (!input || typeof input !== 'object') {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field: 'offer',
      message: 'Oferta inválida.',
    });
  }

  const id = optionalString(input.id, { max: 120 });

  return {
    ...input,
    id,
    hospital: optionalString(input.hospital, { max: 160 }),
    group: optionalString(input.group, { max: 120 }),
    spec: optionalString(input.spec, { max: 120 }),
    date: optionalString(input.date, { max: 80 }),
    hours: optionalString(input.hours, { max: 80 }),
    loc: optionalString(input.loc, { max: 120 }),
    rawMsg: optionalString(input.rawMsg, { max: 1000 }),
    val: Number(input.val ?? 0),
    dist: Number(input.dist ?? 0),
    score: Number(input.score ?? input.sc ?? 0),
  };
}

export function validateSignup(body) {
  const payload = ensureObject(body);
  return {
    name: requireString(payload.name, 'name', { min: 2, max: 80 }),
    email: requireEmail(payload.email),
    password: requirePassword(payload.password),
  };
}

export function validateLogin(body) {
  const payload = ensureObject(body);
  return {
    email: requireEmail(payload.email),
    password: requirePassword(payload.password, 'password', 6),
  };
}

export function validateEmailPayload(body) {
  const payload = ensureObject(body);
  return {
    email: requireEmail(payload.email),
  };
}

export function validateConfirm(body) {
  const payload = ensureObject(body);
  const type = requireString(payload.type, 'type', { min: 3, max: 32 }).toLowerCase();
  const allowed = ['signup', 'recovery', 'invite', 'magiclink', 'email_change'];

  if (!allowed.includes(type)) {
    throw createHttpError(422, 'VALIDATION_ERROR', 'Payload inválido.', {
      field: 'type',
      message: 'Tipo de confirmação inválido.',
    });
  }

  return {
    tokenHash: requireString(payload.token_hash, 'token_hash', { min: 8, max: 512 }),
    type,
  };
}

export function validateResetPassword(body) {
  const payload = ensureObject(body);
  return {
    newPassword: requirePassword(payload.newPassword, 'newPassword'),
  };
}

export function validateBootstrapImport(body) {
  const payload = ensureObject(body);

  return {
    prefs: ensureObject(payload.prefs || {}, 'prefs'),
    groups: ensureArray(payload.groups || [], 'groups', { max: 100 }).map((group) => ({
      id: optionalString(group?.id, { max: 120 }) || String(group?.id ?? ''),
      name: optionalString(group?.name, { max: 120 }) || 'Grupo',
      members: Number(group?.members ?? 0),
      active: Boolean(group?.active),
      emoji: optionalString(group?.emoji, { max: 24 }) || '🏥',
    })),
    captured: ensureArray(payload.captured || [], 'captured', { max: 1000 }).map(sanitizeOffer),
    rejected: ensureArray(payload.rejected || [], 'rejected', { max: 1000 }).map(sanitizeOffer),
  };
}

export function validateMonitorStart(body) {
  const payload = ensureObject(body);

  const groups = ensureArray(payload.groups || [], 'groups', { max: 100 }).map((group, index) => ({
    id: optionalString(group?.id, { max: 120 }) || String(index + 1),
    name: optionalString(group?.name, { max: 120 }) || `Grupo ${index + 1}`,
    active: Boolean(group?.active),
    members: Number(group?.members ?? 0),
    emoji: optionalString(group?.emoji, { max: 24 }) || '🏥',
  }));

  return {
    groups,
    preferences: ensureObject(payload.preferences || {}, 'preferences'),
    operatorName: optionalString(payload.operatorName, { max: 100 }),
  };
}

export function validateOfferMutation(body) {
  const payload = ensureObject(body);
  return {
    sessionId: optionalString(payload.sessionId, { max: 140 }),
    source: optionalString(payload.source, { max: 40 }) || 'manual',
    reason: optionalString(payload.reason, { max: 120 }) || null,
    offer: sanitizeOffer(payload.offer),
  };
}

export function validatePreferences(body) {
  const payload = ensureObject(body);
  return {
    preferences: ensureObject(payload.preferences || {}, 'preferences'),
  };
}

export function validateGroups(body) {
  const payload = ensureObject(body);
  return {
    groups: ensureArray(payload.groups || [], 'groups', { max: 100 }).map((group, index) => ({
      id: optionalString(group?.id, { max: 120 }) || String(index + 1),
      name: optionalString(group?.name, { max: 120 }) || `Grupo ${index + 1}`,
      members: Number(group?.members ?? 0),
      active: Boolean(group?.active),
      emoji: optionalString(group?.emoji, { max: 24 }) || '🏥',
    })),
  };
}

export function validateEvent(body) {
  const payload = ensureObject(body);

  return {
    name: requireString(payload.name, 'name', { min: 2, max: 120 }),
    payload: payload.payload && typeof payload.payload === 'object' ? payload.payload : {},
    timestamp: optionalString(payload.timestamp, { max: 64 }) || new Date().toISOString(),
  };
}
