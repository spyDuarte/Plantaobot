import { apiRequest, apiRequestOrNull, API_BASE_URL } from './apiClient.js';

/**
 * Fetches the current user's WhatsApp webhook configuration.
 * Returns null if the backend is unavailable or the user has no config yet.
 * @returns {Promise<{ userId: string, webhookToken: string, connected: boolean, messageCount: number } | null>}
 */
export async function fetchWhatsappConfig() {
  return apiRequestOrNull('/whatsapp/config');
}

/**
 * Rotates the user's webhook secret token.
 * @returns {Promise<{ webhookToken: string }>}
 */
export async function resetWhatsappToken() {
  return apiRequest('/whatsapp/config/reset-token', { method: 'POST' });
}

/**
 * Builds the full webhook URL for a given user ID and token.
 * Resolves against the API base URL when it is an absolute URL,
 * or falls back to the current page origin for relative paths.
 * @param {string} userId
 * @param {string} webhookToken
 * @returns {string}
 */
export function buildWebhookUrl(userId, webhookToken) {
  let baseOrigin = '';

  if (API_BASE_URL.startsWith('http')) {
    try {
      baseOrigin = new URL(API_BASE_URL).origin;
    } catch {
      baseOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    }
  } else if (typeof window !== 'undefined') {
    baseOrigin = window.location.origin;
  }

  return `${baseOrigin}/api/whatsapp/webhook/${userId}?token=${webhookToken}`;
}
