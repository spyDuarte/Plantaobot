import { C } from '../../constants/colors.js';
import { fmt } from '../../utils/index.js';
import { Badge, Button, Card, PageHeader, Waveform } from '../ui/index.jsx';

function StatCard({ label, value, tone = 'info' }) {
  const toneMap = {
    info: { border: C.border, bg: C.surface1, color: C.text0 },
    success: { border: C.successSoft, bg: C.successSoft, color: C.success },
    warning: { border: C.warningSoft, bg: C.warningSoft, color: C.warning },
    error: { border: C.errorSoft, bg: C.errorSoft, color: C.error },
  };
  const colors = toneMap[tone] || toneMap.info;

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: tone === 'info' ? C.text2 : colors.color,
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div className="pb-mono" style={{ fontSize: 28, fontWeight: 700, color: colors.color }}>
        {value}
      </div>
    </div>
  );
}

const PLAN_LABELS = { free: 'Grátis', pro: 'Pro', premium: 'Premium' };
const PLAN_BADGE_COLORS = {
  free: { bg: C.surface2, color: C.text2, border: C.border },
  pro: { bg: C.primarySoft, color: C.primary, border: C.primarySoft },
  premium: { bg: C.accentSoft, color: C.accent, border: C.accentSoft },
};

export default function Dashboard({
  uiV2,
  setTab,
  botOn,
  startBot,
  stopBot,
  captured,
  rejected,
  pending,
  actG,
  total,
  prefs,
  typing,
  setModal,
  planId,
  planLimits,
}) {
  const action = (
    <Button
      type="button"
      variant={botOn ? 'danger' : 'primary'}
      onClick={botOn ? stopBot : startBot}
    >
      {botOn ? 'Parar bot' : 'Iniciar bot'}
    </Button>
  );

  return (
    <div style={{ animation: 'fadeUp .2s ease-out' }}>
      {uiV2 ? (
        <PageHeader
          title="Dashboard operacional"
          subtitle="Visão consolidada de capturas e monitoramento em tempo real"
          action={action}
        />
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            border: `1px solid ${C.border}`,
            background: C.surface1,
            borderRadius: 8,
            padding: 20,
            gridColumn: '1 / -1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: C.text2, fontWeight: 600, marginBottom: 4 }}>
              Total garantido (Mês)
            </div>
            <div className="pb-mono" style={{ fontSize: 36, fontWeight: 700, color: C.primary }}>
              R$ {fmt(total)}
            </div>
          </div>
          <div>
            <Badge tone={botOn ? 'success' : 'warning'}>
              {botOn ? 'Monitorando ativamente' : 'Pausado'}
            </Badge>
          </div>
        </div>

        <StatCard label="Analisados" value={captured.length + rejected.length} tone="info" />
        <StatCard label="Capturados" value={captured.length} tone="success" />
        <StatCard label="Pendentes" value={pending.length} tone="warning" />
        <StatCard label="Descartados" value={rejected.length} tone="error" />
      </div>

      {planId ? (() => {
        const currentPlan = planId || 'free';
        const colors = PLAN_BADGE_COLORS[currentPlan] || PLAN_BADGE_COLORS.free;
        const maxCaptures = planLimits?.maxCapturesPerMonth ?? null;
        const capturedCount = captured.length;
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: colors.color,
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: `1px solid ${colors.color}`,
                }}
              >
                {PLAN_LABELS[currentPlan] || currentPlan}
              </span>
              {maxCaptures !== null ? (
                <span style={{ fontSize: 13, color: C.text2 }}>
                  {capturedCount} / {maxCaptures} capturas este mês
                </span>
              ) : (
                <span style={{ fontSize: 13, color: C.text2 }}>Capturas ilimitadas</span>
              )}
            </div>
            {currentPlan === 'free' && setTab ? (
              <button
                type="button"
                onClick={() => setTab('plans')}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Fazer upgrade →
              </button>
            ) : null}
          </div>
        );
      })() : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text0 }}>
                Status do Monitoramento
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: C.text2 }}>
                {botOn
                  ? `Analisando ${actG.length} grupos no modo ${prefs.auto ? 'automático' : 'manual'}`
                  : `${actG.length} grupos ativos e configurados`}
              </div>
            </div>
            {botOn ? <Waveform active /> : <Badge tone="warning">Inativo</Badge>}
          </div>

          {botOn ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {actG.map((group) => (
                <div
                  key={group.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: C.surface2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13, color: C.text0, fontWeight: 500 }}>
                    {group.emoji} {group.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: typing === group.name ? C.info : C.success,
                      fontWeight: 600,
                    }}
                  >
                    {typing === group.name ? 'Digitando...' : 'Ativo'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: C.text2,
                padding: '16px',
                background: C.surface2,
                borderRadius: 6,
                textAlign: 'center',
              }}
            >
              O bot precisa ser iniciado para captar novas oportunidades.
            </div>
          )}
        </Card>

        {captured.length > 0 ? (
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text0 }}>Últimas Capturas</div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTab(prefs.auto ? 'captured' : 'swipe')}
                style={{ padding: '6px 12px', fontSize: 13 }}
              >
                Ver todas
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {captured
                .slice(-4)
                .reverse()
                .map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => setModal(shift)}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      background: C.surface1,
                      padding: '12px 14px',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'border-color .15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = C.primarySoft)}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text0 }}>
                        {shift.hospital}
                      </div>
                      <div style={{ display: 'block', marginTop: 4, fontSize: 12, color: C.text2 }}>
                        {shift.date} • {shift.spec}
                      </div>
                    </div>
                    <div
                      className="pb-mono"
                      style={{ fontSize: 15, color: C.success, fontWeight: 600 }}
                    >
                      R$ {fmt(shift.val)}
                    </div>
                  </button>
                ))}
            </div>
          </Card>
        ) : null}
      </div>

      {!uiV2 ? action : null}
    </div>
  );
}
