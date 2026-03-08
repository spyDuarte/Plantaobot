/**
 * Subscription service — persists and reads plan/subscription data via Supabase.
 *
 * Expected Supabase table: `subscriptions`
 *   id              uuid primary key default gen_random_uuid()
 *   user_id         uuid not null references auth.users(id) on delete cascade
 *   plan_id         text not null default 'free'
 *   stripe_customer_id    text
 *   stripe_subscription_id text
 *   stripe_status   text
 *   current_period_end    timestamptz
 *   created_at      timestamptz default now()
 *   updated_at      timestamptz default now()
 *
 * Create the table with:
 *   create table subscriptions (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid not null references auth.users(id) on delete cascade,
 *     plan_id text not null default 'free',
 *     stripe_customer_id text,
 *     stripe_subscription_id text,
 *     stripe_status text,
 *     current_period_end timestamptz,
 *     created_at timestamptz default now(),
 *     updated_at timestamptz default now(),
 *     unique (user_id)
 *   );
 *   alter table subscriptions enable row level security;
 *   create policy "Users can read their own subscription"
 *     on subscriptions for select using (auth.uid() = user_id);
 */

import { createClient } from '@supabase/supabase-js';
import { PLAN_IDS, PLAN_LIMITS } from './stripeService.js';

function createServiceClient(config) {
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function resolvePlanFromStripeStatus(stripeStatus) {
  // Active/trialing statuses keep the paid plan active
  if (['active', 'trialing'].includes(stripeStatus)) {
    return null; // keep stored planId
  }
  // Any other status (past_due, canceled, unpaid) downgrades to free
  return PLAN_IDS.free;
}

export function createSubscriptionService(config) {
  const db = createServiceClient(config);

  return {
    /**
     * Returns the active subscription record for a user.
     * Creates a free-tier record if none exists.
     * @param {string} userId
     * @returns {Promise<{ planId, stripeCustomerId, stripeSubscriptionId, stripeStatus, currentPeriodEnd, limits }>}
     */
    async getSubscription(userId) {
      const { data, error } = await db
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[subscriptionService] getSubscription error', error.message);
        // Return free plan on DB errors to avoid blocking users
        return { planId: PLAN_IDS.free, limits: PLAN_LIMITS.free };
      }

      if (!data) {
        // Auto-provision free plan
        await this.ensureFreePlan(userId);
        return { planId: PLAN_IDS.free, limits: PLAN_LIMITS.free };
      }

      const planId = data.plan_id || PLAN_IDS.free;
      return {
        planId,
        stripeCustomerId: data.stripe_customer_id || null,
        stripeSubscriptionId: data.stripe_subscription_id || null,
        stripeStatus: data.stripe_status || null,
        currentPeriodEnd: data.current_period_end || null,
        limits: PLAN_LIMITS[planId] || PLAN_LIMITS.free,
      };
    },

    /**
     * Creates a free-plan record if it doesn't already exist.
     * @param {string} userId
     */
    async ensureFreePlan(userId) {
      const now = new Date().toISOString();
      const { error } = await db.from('subscriptions').upsert(
        {
          user_id: userId,
          plan_id: PLAN_IDS.free,
          updated_at: now,
        },
        { onConflict: 'user_id', ignoreDuplicates: true },
      );

      if (error) {
        console.warn('[subscriptionService] ensureFreePlan error', error.message);
      }
    },

    /**
     * Stores or updates Stripe customer ID for a user.
     * @param {{ userId: string, stripeCustomerId: string }} options
     */
    async saveStripeCustomer({ userId, stripeCustomerId }) {
      const now = new Date().toISOString();
      const { error } = await db.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          plan_id: PLAN_IDS.free,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        console.warn('[subscriptionService] saveStripeCustomer error', error.message);
      }
    },

    /**
     * Updates subscription data after a successful Stripe checkout or webhook event.
     * @param {{ userId: string, planId: string, stripeSubscriptionId: string, stripeStatus: string, currentPeriodEnd?: string, stripeCustomerId?: string }} options
     */
    async updateSubscription({
      userId,
      planId,
      stripeSubscriptionId,
      stripeStatus,
      currentPeriodEnd,
      stripeCustomerId,
    }) {
      const now = new Date().toISOString();
      const patch = {
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_status: stripeStatus,
        updated_at: now,
      };

      if (currentPeriodEnd) {
        patch.current_period_end = currentPeriodEnd;
      }

      if (stripeCustomerId) {
        patch.stripe_customer_id = stripeCustomerId;
      }

      const { error } = await db
        .from('subscriptions')
        .upsert(patch, { onConflict: 'user_id' });

      if (error) {
        console.warn('[subscriptionService] updateSubscription error', error.message);
        throw new Error('Falha ao atualizar assinatura.');
      }
    },

    /**
     * Handles a Stripe subscription status change event (e.g. invoice.payment_failed).
     * Downgrades the user to free if the subscription becomes inactive.
     * @param {{ stripeSubscriptionId: string, stripeStatus: string, currentPeriodEnd?: string }} options
     */
    async handleStripeStatusChange({ stripeSubscriptionId, stripeStatus, currentPeriodEnd }) {
      // Find subscription by Stripe subscription ID
      const { data, error } = await db
        .from('subscriptions')
        .select('user_id, plan_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .maybeSingle();

      if (error || !data) {
        console.warn(
          '[subscriptionService] handleStripeStatusChange: subscription not found',
          stripeSubscriptionId,
        );
        return;
      }

      const downgradedPlan = resolvePlanFromStripeStatus(stripeStatus);
      const planId = downgradedPlan || data.plan_id;

      await this.updateSubscription({
        userId: data.user_id,
        planId,
        stripeSubscriptionId,
        stripeStatus,
        currentPeriodEnd,
      });
    },

    /**
     * Looks up user_id from a Stripe customer ID.
     * @param {string} stripeCustomerId
     * @returns {Promise<string|null>}
     */
    async getUserIdByCustomer(stripeCustomerId) {
      const { data } = await db
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .maybeSingle();

      return data?.user_id || null;
    },
  };
}
