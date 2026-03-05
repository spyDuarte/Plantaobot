export function createHttpError(status, code, message, details) {
  const error = new Error(message || 'Unexpected error.');
  error.status = status;
  error.code = code;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
}

export function isHttpError(error) {
  return Boolean(error) && Number.isInteger(error.status) && typeof error.code === 'string';
}

export function toErrorPayload(error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  const payload = {
    error: typeof error?.code === 'string' ? error.code : 'INTERNAL_ERROR',
    message: status >= 500 ? 'Unexpected server error.' : error?.message || 'Unexpected request error.',
  };

  if (error?.details !== undefined) {
    payload.details = error.details;
  }

  return { status, payload };
}

function includesAny(text, snippets) {
  const normalized = String(text || '').toLowerCase();
  return snippets.some((snippet) => normalized.includes(snippet));
}

export function normalizeAuthError(error) {
  if (isHttpError(error)) {
    return error;
  }

  const message = String(error?.message || 'Auth request failed.');

  if (includesAny(message, ['invalid login credentials', 'invalid credentials'])) {
    return createHttpError(401, 'INVALID_CREDENTIALS', 'Email ou senha inválidos.');
  }

  if (includesAny(message, ['email not confirmed', 'email not verified', 'email is not confirmed'])) {
    return createHttpError(403, 'EMAIL_NOT_CONFIRMED', 'Confirme seu e-mail antes de continuar.');
  }

  if (includesAny(message, ['token has expired', 'expired', 'refresh token not found'])) {
    return createHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Faça login novamente.');
  }

  if (includesAny(message, ['user already registered', 'already been registered'])) {
    return createHttpError(422, 'USER_ALREADY_EXISTS', 'Já existe uma conta para este e-mail.');
  }

  if (includesAny(message, ['weak password', 'password should be'])) {
    return createHttpError(422, 'WEAK_PASSWORD', 'A senha informada não atende ao mínimo de segurança.');
  }

  return createHttpError(401, 'AUTH_FAILED', message);
}
