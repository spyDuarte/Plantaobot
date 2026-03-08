/**
 * Billing API service — communicates with /api/billing/* backend endpoints.
 */
import { apiRequest } from './apiClient.js';

/**
 * Returns the list of all available plans (public, no auth required).
 * @returns {Promise<Array>}
 */
export async function fetchPlans() {
  const data = await apiRequest('/billing/plans', { method: 'GET' });
  return Array.isArray(data?.plans) ? data.plans : [];
}

/**
 * Returns the current user's active subscription (plan + limits).
 * @returns {Promise<{ planId: string, limits: object, stripeCustomerId: string|null, stripeSubscriptionId: string|null, stripeStatus: string|null, currentPeriodEnd: string|null }>}
 */
export async function fetchSubscription() {
  return apiRequest('/billing/subscription', { method: 'GET' });
}

/**
 * Creates a Stripe Checkout session and returns the hosted URL.
 * Caller should redirect to the URL to complete payment.
 * @param {{ planId: 'pro'|'premium' }} options
 * @returns {Promise<{ url: string, sessionId: string }>}
 */
export async function createCheckoutSession({ planId }) {
  return apiRequest('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}

/**
 * Creates a Stripe Customer Portal session for managing/canceling subscription.
 * @returns {Promise<{ url: string }>}
 */
export async function createPortalSession() {
  return apiRequest('/billing/portal', { method: 'POST' });
}
