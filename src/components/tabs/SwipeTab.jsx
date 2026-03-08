import { C } from '../../constants/colors.js';
import { fmt } from '../../utils/index.js';
import { Button, Card, EmptyState, PageHeader } from '../ui/index.jsx';
import SwipeCard from '../SwipeCard.jsx';

export default function SwipeTab({
  uiV2,
  botOn,
  pending,
  captured,
  prefs,
  acceptPending,
  rejectPending,
  setModal,
}) {
  return (
    <div
      style={{
        animation: 'fadeUp .2s ease-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 800 }}>
        {uiV2 ? (
          <PageHeader
            title="Revisão Manual"
            subtitle="Analise e aprove as oportunidades pendentes"
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal(pending[0])}
                disabled={pending.length === 0}
              >
                Ver detalhes
              </Button>
            }
          />
        ) : null}

        {pending.length === 0 ? (
          <Card>
            <EmptyState
              icon="✓"
              title="Sua fila está vazia"
              description={
                botOn
                  ? 'Monitoramento ativo. Novas oportunidades compatíveis com seu perfil aparecerão aqui.'
                  : 'Inicie o monitoramento no dashboard para receber plantões.'
              }
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SwipeCard
              shift={pending[0]}
              prefs={prefs}
              index={0}
              total={pending.length}
              onAccept={() => acceptPending(pending[0])}
              onReject={() => rejectPending(pending[0])}
            />
          </div>
        )}

        {captured.length > 0 ? (
          <Card style={{ marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 16, color: C.text0, fontWeight: 600 }}>
                Aceitos recentemente
              </div>
              <span style={{ fontSize: 13, color: C.text2 }}>{captured.length} totais</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {captured
                .slice(-3)
                .reverse()
                .map((shift) => (
                  <button
                    key={shift.id}
                    type="button"
                    onClick={() => setModal(shift)}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      background: C.surface1,
                      padding: '16px 20px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color .15s ease',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = C.successSoft;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text0 }}>
                        {shift.hospital}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: C.text2 }}>
                        {shift.date} • {shift.spec}
                      </div>
                    </div>
                    <div
                      className="pb-mono"
                      style={{ color: C.success, fontWeight: 700, fontSize: 16 }}
                    >
                      R$ {fmt(shift.val)}
                    </div>
                  </button>
                ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
