/**
 * usePlan — hook that loads and caches the current user's subscription plan.
 *
 * Returns:
 *   planId       — 'free' | 'pro' | 'premium'
 *   limits       — plan limits object (maxGroups, maxCapturesPerMonth, etc.)
 *   loading      — true while fetching
 *   error        — error message string or null
 *   isPro        — convenience boolean (planId === 'pro' || 'premium')
 *   isPremium    — convenience boolean (planId === 'premium')
 *   refresh      — function to re-fetch subscription
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchSubscription } from '../services/billingApi.js';

const FREE_LIMITS = {
  maxGroups: 1,
  maxCapturesPerMonth: 10,
  autoCapture: false,
  aiChat: false,
  exportCsv: false,
};

const FREE_SUBSCRIPTION = {
  planId: 'free',
  limits: FREE_LIMITS,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripeStatus: null,
  currentPeriodEnd: null,
};

export function usePlan() {
  const [subscription, setSubscription] = useState(FREE_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubscription();
      setSubscription({
        planId: data.planId || 'free',
        limits: data.limits || FREE_LIMITS,
        stripeCustomerId: data.stripeCustomerId || null,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        stripeStatus: data.stripeStatus || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
      });
    } catch (err) {
      setError(err?.message || 'Não foi possível carregar assinatura.');
      // Keep last known subscription on error (defaults to free)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const planId = subscription.planId || 'free';

  return {
    planId,
    limits: subscription.limits || FREE_LIMITS,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeStatus: subscription.stripeStatus,
    currentPeriodEnd: subscription.currentPeriodEnd,
    loading,
    error,
    isPro: planId === 'pro' || planId === 'premium',
    isPremium: planId === 'premium',
    refresh,
  };
}
