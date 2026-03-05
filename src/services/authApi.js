import { apiRequest } from './apiClient.js';

export function signup(body) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body,
  });
}

export function login(body) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body,
  });
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
    body: {},
  });
}

export function fetchMe() {
  return apiRequest('/auth/me');
}

export function resendVerification(body) {
  return apiRequest('/auth/resend-verification', {
    method: 'POST',
    body,
  });
}

export function forgotPassword(body) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body,
  });
}

export function confirmAuth(body) {
  return apiRequest('/auth/confirm', {
    method: 'POST',
    body,
  });
}

export function resetPassword(body) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body,
  });
}

export function bootstrapImport(body) {
  return apiRequest('/auth/bootstrap-import', {
    method: 'POST',
    body,
  });
}
