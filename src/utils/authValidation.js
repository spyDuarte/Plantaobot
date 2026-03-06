const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasLengthBetween(value, min, max) {
  return value.length >= min && value.length <= max;
}

export function normalizeLoginForm(form) {
  return {
    email: normalize(form?.email).toLowerCase(),
    password: normalize(form?.password),
  };
}

export function normalizeSignupForm(form) {
  return {
    name: normalize(form?.name),
    email: normalize(form?.email).toLowerCase(),
    password: normalize(form?.password),
  };
}

export function normalizeEmailInput(value) {
  return normalize(value).toLowerCase();
}

export function normalizePasswordInput(value) {
  return normalize(value);
}

export function validateLoginForm(form) {
  const normalized = normalizeLoginForm(form);

  if (!hasLengthBetween(normalized.email, 5, 320) || !EMAIL_PATTERN.test(normalized.email)) {
    return { valid: false, message: 'Email em formato inválido.', normalized };
  }

  if (!hasLengthBetween(normalized.password, 6, 128)) {
    return { valid: false, message: 'Senha precisa ter entre 6 e 128 caracteres.', normalized };
  }

  if (normalized.password.includes(' ')) {
    return { valid: false, message: 'Senha não pode conter espaços.', normalized };
  }

  return { valid: true, normalized };
}

export function validateSignupForm(form) {
  const normalized = normalizeSignupForm(form);

  if (!hasLengthBetween(normalized.name, 2, 80)) {
    return { valid: false, message: 'Nome precisa ter entre 2 e 80 caracteres.', normalized };
  }

  const loginLikeValidation = validateLoginForm({
    email: normalized.email,
    password: normalized.password,
  });

  if (!loginLikeValidation.valid) {
    if (loginLikeValidation.message.startsWith('Senha precisa ter entre 6')) {
      return { valid: false, message: 'Senha precisa ter entre 8 e 128 caracteres.', normalized };
    }

    return { valid: false, message: loginLikeValidation.message, normalized };
  }

  if (normalized.password.length < 8) {
    return { valid: false, message: 'Senha precisa ter entre 8 e 128 caracteres.', normalized };
  }

  return { valid: true, normalized };
}

export function validateEmailPayload(value) {
  const normalized = normalizeEmailInput(value);
  if (!hasLengthBetween(normalized, 5, 320) || !EMAIL_PATTERN.test(normalized)) {
    return { valid: false, message: 'Email em formato inválido.', normalized };
  }

  return { valid: true, normalized };
}

export function validateResetPassword(value) {
  const normalized = normalizePasswordInput(value);

  if (!hasLengthBetween(normalized, 8, 128)) {
    return { valid: false, message: 'Senha precisa ter entre 8 e 128 caracteres.', normalized };
  }

  if (normalized.includes(' ')) {
    return { valid: false, message: 'Senha não pode conter espaços.', normalized };
  }

  return { valid: true, normalized };
}
