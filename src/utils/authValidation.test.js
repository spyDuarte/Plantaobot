import { describe, expect, it } from 'vitest';
import {
  normalizeEmailInput,
  validateEmailPayload,
  validateLoginForm,
  validateResetPassword,
  validateSignupForm,
} from './authValidation.js';

describe('authValidation', () => {
  it('normalizes and validates login data', () => {
    const valid = validateLoginForm({ email: '  MED@EXAMPLE.COM ', password: 'Senha123' });
    expect(valid.valid).toBe(true);
    expect(valid.normalized).toEqual({ email: 'med@example.com', password: 'Senha123' });

    const invalid = validateLoginForm({ email: 'med', password: '123' });
    expect(invalid.valid).toBe(false);
    expect(invalid.message).toBe('Email em formato inválido.');
  });

  it('enforces signup and reset password boundaries', () => {
    expect(validateSignupForm({ name: 'A', email: 'a@b.com', password: 'Senha123' }).valid).toBe(
      false,
    );
    expect(
      validateSignupForm({ name: 'Ana', email: 'ana@example.com', password: '1234567' }).message,
    ).toBe('Senha precisa ter entre 8 e 128 caracteres.');

    expect(validateResetPassword('  NovaSenha123 ').valid).toBe(true);
    expect(validateResetPassword('senha com espaco').message).toBe(
      'Senha não pode conter espaços.',
    );
  });

  it('validates emails with the same contract used in forms', () => {
    expect(normalizeEmailInput('  User@Mail.com  ')).toBe('user@mail.com');
    expect(validateEmailPayload('user@mail.com').valid).toBe(true);
    expect(validateEmailPayload('invalid').valid).toBe(false);
  });
});
