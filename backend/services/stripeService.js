/**
 * Stripe payment service for PlantãoBot.
 *
 * Requires the following environment variables:
 *   STRIPE_SECRET_KEY       — server-side Stripe secret key
 *   STRIPE_WEBHOOK_SECRET   — signing secret for webhook events (whsec_...)
 *   APP_BASE_URL            — frontend origin, used to build redirect URLs
 *
 * Plans are defined in PLANS below and must match Stripe Price IDs configured
 * in your Stripe Dashboard (or set via STRIPE_PRICE_PRO / STRIPE_PRICE_PREMIUM
 * env vars for flexibility across environments).
 */

export const PLAN_IDS = {
  free: 'free',
  pro: 'pro',
  premium: 'premium',
};

export const PLAN_LIMITS = {
  free: {
    maxGroups: 1,
    maxCapturesPerMonth: 10,
    autoCapture: false,
    aiChat: false,
    exportCsv: false,
  },
  pro: {
    maxGroups: 5,
    maxCapturesPerMonth: null, // unlimited
    autoCapture: true,
    aiChat: true,
    exportCsv: true,
  },
  premium: {
    maxGroups: null, // unlimited
    maxCapturesPerMonth: null, // unlimited
    autoCapture: true,
    aiChat: true,
    exportCsv: true,
  },
};

export const PLAN_METADATA = {
  free: {
    id: 'free',
    name: 'Grátis',
    price: 0,
    currency: 'brl',
    interval: null,
    features: [
      '1 grupo monitorado',
      'Até 10 capturas/mês',
      'Feed de plantões',
      'Modo swipe manual',
    ],
    limitations: ['Sem captura automática', 'Sem Assistente IA', 'Sem exportação CSV'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 4990, // R$ 49,90 in centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Até 5 grupos monitorados',
      'Capturas ilimitadas',
      'Captura automática',
      'Assistente IA',
      'Exportação CSV',
      'Insights financeiros avançados',
    ],
    limitations: [],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 9990, // R$ 99,90 in centavos
    currency: 'brl',
    interval: 'month',
    features: [
      'Grupos ilimitados',
      'Capturas ilimitadas',
      'Captura automática',
      'Assistente IA com contexto expandido',
      'Exportação CSV',
      'Insights financeiros avançados',
      'Suporte prioritário',
    ],
    limitations: [],
  },
};

let _stripeInstance = null;

async function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurado.');
  }

  if (_stripeInstance) {
    return _stripeInstance;
  }

  let Stripe;
  try {
    const mod = await import('stripe');
    Stripe = mod.default || mod;
  } catch {
    throw new Error('Pacote stripe não instalado. Execute: npm install stripe');
  }

  _stripeInstance = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  return _stripeInstance;
}

function getPriceId(planId) {
  const env = {
    pro: process.env.STRIPE_PRICE_PRO,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };
  const priceId = env[planId];
  if (!priceId) {
    throw new Error(
      `STRIPE_PRICE_${planId.toUpperCase()} não configurado. Defina o Price ID do Stripe.`,
    );
  }
  return priceId;
}

function buildRedirectUrl(path) {
  const base = (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path}`;
}

export function createStripeService() {
  return {
    /**
     * Creates a Stripe Checkout session for subscribing to a paid plan.
     * @param {{ userId: string, email: string, planId: 'pro'|'premium', customerId?: string }} options
     * @returns {Promise<{ url: string, sessionId: string }>}
     */
    async createCheckoutSession({ userId, email, planId, customerId }) {
      const stripe = await getStripe();
      const priceId = getPriceId(planId);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: customerId || undefined,
        customer_email: customerId ? undefined : email,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        subscription_data: {
          metadata: { userId, planId },
        },
        metadata: { userId, planId },
        success_url: buildRedirectUrl(`/?checkout=success&plan=${planId}`),
        cancel_url: buildRedirectUrl('/?checkout=cancel'),
      });

      return { url: session.url, sessionId: session.id };
    },

    /**
     * Creates a Stripe Customer Portal session for managing/canceling subscriptions.
     * @param {{ customerId: string }} options
     * @returns {Promise<{ url: string }>}
     */
    async createPortalSession({ customerId }) {
      const stripe = await getStripe();

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: buildRedirectUrl('/'),
      });

      return { url: session.url };
    },

    /**
     * Constructs and verifies a Stripe webhook event.
     * @param {{ rawBody: Buffer|string, signature: string }} options
     * @returns {object} Verified Stripe event
     */
    async constructWebhookEvent({ rawBody, signature }) {
      const stripe = await getStripe();
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error('STRIPE_WEBHOOK_SECRET não configurado.');
      }
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    },

    /**
     * Retrieves a Stripe subscription by ID.
     * @param {string} subscriptionId
     * @returns {Promise<object>}
     */
    async getSubscription(subscriptionId) {
      const stripe = await getStripe();
      return stripe.subscriptions.retrieve(subscriptionId);
    },

    /**
     * Retrieves or creates a Stripe Customer for the given user.
     * @param {{ userId: string, email: string, name?: string }} options
     * @returns {Promise<{ customerId: string }>}
     */
    async getOrCreateCustomer({ userId, email, name }) {
      const stripe = await getStripe();

      const existing = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });

      if (existing.data.length > 0) {
        return { customerId: existing.data[0].id };
      }

      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: { userId },
      });

      return { customerId: customer.id };
    },
  };
}
