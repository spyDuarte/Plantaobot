/* @vitest-environment node */

import { describe, expect, it } from 'vitest';
import {
  validateEmailPayload,
  validateLogin,
  validateResetPassword,
  validateSignup,
} from '../validation.js';

describe('backend validation contract', () => {
  it('normalizes signup/login email and trims name', () => {
    expect(
      validateSignup({
        name: '  Dra. Alice  ',
        email: '  ALICE@EXAMPLE.COM ',
        password: 'SenhaForte123',
      }),
    ).toEqual({
      name: 'Dra. Alice',
      email: 'alice@example.com',
      password: 'SenhaForte123',
    });

    expect(
      validateLogin({
        email: '  ALICE@EXAMPLE.COM ',
        password: 'SenhaForte123',
      }),
    ).toEqual({
      email: 'alice@example.com',
      password: 'SenhaForte123',
    });
  });

  it('rejects invalid payloads with validation error', () => {
    expect(() => validateEmailPayload({ email: 'invalid' })).toThrow('Payload inválido.');
    expect(() => validateResetPassword({ newPassword: 'senha com espaco' })).toThrow('Payload inválido.');
    expect(() => validateSignup({ name: 'A', email: 'a@b.com', password: '123' })).toThrow('Payload inválido.');
  });
});
