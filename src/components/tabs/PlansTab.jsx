/**
 * PlansTab — pagina de planos e assinatura do PlantãoBot.
 * Exibe os planos disponíveis, o plano atual do usuário e permite
 * iniciar o checkout do Stripe ou acessar o portal de gerenciamento.
 */
import { useState, useCallback } from 'react';
import { C } from '../../constants/colors.js';
import { Button, Card, PageHeader } from '../ui/index.jsx';
import { createCheckoutSession, createPortalSession } from '../../services/billingApi.js';

const PLAN_ORDER = ['free', 'pro', 'premium'];

const PLAN_LABELS = {
  free: 'Grátis',
  pro: 'Pro',
  premium: 'Premium',
};

const PLAN_COLORS = {
  free: { accent: C.text2, bg: C.surface2, badge: null },
  pro: { accent: C.primary, bg: C.primarySoft, badge: 'Mais popular' },
  premium: { accent: C.accent, bg: C.accentSoft, badge: 'Máximo desempenho' },
};

function formatPrice(price, interval) {
  if (price === 0) return 'Grátis';
  const formatted = (price / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  return interval === 'month' ? `${formatted}/mês` : formatted;
}

function PlanCard({ plan, currentPlanId, onUpgrade, onManage, upgrading }) {
  const isCurrentPlan = plan.id === currentPlanId;
  const isFree = plan.id === 'free';
  const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free;
  const isUpgrade =
    PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlanId);

  return (
    <div
      style={{
        border: `2px solid ${isCurrentPlan ? colors.accent : C.border}`,
        borderRadius: 12,
        padding: 24,
        background: isCurrentPlan ? colors.bg : C.surface1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'box-shadow .15s',
      }}
    >
      {colors.badge ? (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: colors.accent,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 12px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
          }}
        >
          {colors.badge}
        </div>
      ) : null}

      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: colors.accent,
            marginBottom: 4,
          }}
        >
          {PLAN_LABELS[plan.id] || plan.name}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text0 }}>
          {formatPrice(plan.price, plan.interval)}
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(plan.features || []).map((feature) => (
          <li key={feature} style={{ fontSize: 13, color: C.text1, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: C.success, fontWeight: 700, flexShrink: 0 }}>✓</span>
            {feature}
          </li>
        ))}
        {(plan.limitations || []).map((limitation) => (
          <li key={limitation} style={{ fontSize: 13, color: C.text2, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: C.text2, flexShrink: 0 }}>✕</span>
            {limitation}
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: colors.accent,
            padding: '8px 0',
          }}
        >
          Plano atual
        </div>
      ) : null}

      {isCurrentPlan && !isFree ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onManage}
          disabled={upgrading}
          style={{ width: '100%' }}
        >
          Gerenciar assinatura
        </Button>
      ) : null}

      {!isCurrentPlan && isUpgrade ? (
        <Button
          type="button"
          onClick={() => onUpgrade(plan.id)}
          disabled={upgrading}
          style={{ width: '100%', background: colors.accent }}
        >
          {upgrading ? 'Aguarde...' : `Assinar ${PLAN_LABELS[plan.id] || plan.name}`}
        </Button>
      ) : null}

      {!isCurrentPlan && !isUpgrade && !isFree ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onUpgrade(plan.id)}
          disabled={upgrading}
          style={{ width: '100%' }}
        >
          Mudar para {PLAN_LABELS[plan.id] || plan.name}
        </Button>
      ) : null}
    </div>
  );
}

export default function PlansTab({ uiV2, planId, onPlanChange }) {
  const [plans] = useState(() => [
    {
      id: 'free',
      name: 'Grátis',
      price: 0,
      interval: null,
      features: ['1 grupo monitorado', 'Até 10 capturas/mês', 'Feed de plantões', 'Modo swipe manual'],
      limitations: ['Sem captura automática', 'Sem Assistente IA', 'Sem exportação CSV'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 4990,
      interval: 'month',
      features: ['Até 5 grupos monitorados', 'Capturas ilimitadas', 'Captura automática', 'Assistente IA', 'Exportação CSV', 'Insights avançados'],
      limitations: [],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9990,
      interval: 'month',
      features: ['Grupos ilimitados', 'Capturas ilimitadas', 'Captura automática', 'IA com contexto expandido', 'Exportação CSV', 'Insights avançados', 'Suporte prioritário'],
      limitations: [],
    },
  ]);

  const [upgrading, setUpgrading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleUpgrade = useCallback(
    async (targetPlanId) => {
      setUpgrading(true);
      setCheckoutError('');
      try {
        const { url } = await createCheckoutSession({ planId: targetPlanId });
        if (url) {
          window.location.href = url;
        }
      } catch (err) {
        setCheckoutError(
          err?.message || 'Não foi possível iniciar o checkout. Tente novamente.',
        );
      } finally {
        setUpgrading(false);
      }
    },
    [],
  );

  const handleManage = useCallback(async () => {
    setUpgrading(true);
    setCheckoutError('');
    try {
      const { url } = await createPortalSession();
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setCheckoutError(
        err?.message || 'Não foi possível abrir o portal. Tente novamente.',
      );
    } finally {
      setUpgrading(false);
    }
  }, []);

  const currentPlanId = planId || 'free';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Planos e Assinatura"
        subtitle="Escolha o plano ideal para seu volume de plantões"
      />

      {checkoutError ? (
        <div
          style={{
            background: C.errorSoft,
            border: `1px solid ${C.error}`,
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 13,
            color: C.error,
          }}
        >
          {checkoutError}
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}
      >
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentPlanId}
            onUpgrade={handleUpgrade}
            onManage={handleManage}
            upgrading={upgrading}
          />
        ))}
      </div>

      <Card style={{ padding: 16, background: C.surface2 }}>
        <div style={{ fontSize: 13, color: C.text1, lineHeight: 1.6 }}>
          <strong style={{ color: C.text0 }}>Pagamentos seguros via Stripe.</strong>{' '}
          Aceitamos cartão de crédito e débito. Cancele a qualquer momento sem multa.
          Em caso de dúvidas, entre em contato pelo suporte.
        </div>
      </Card>
    </div>
  );
}
