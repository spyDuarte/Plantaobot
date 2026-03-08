import { C } from '../../constants/colors.js';
import { fmt } from '../../utils/index.js';
import { Badge, Button, Card, EmptyState, PageHeader, Pill, ScBar } from '../ui/index.jsx';

export default function CapturedTab({
  uiV2,
  captured,
  rejected,
  total,
  exportCSV,
  onShareCaptured,
  shareClicked = 0,
  shareReady = 0,
  inviteAccepted = 0,
  lastShareLabel = '',
  setModal,
}) {
  const shareReadyRate = shareClicked > 0 ? Math.round((shareReady / shareClicked) * 100) : null;
  const inviteRate = shareReady > 0 ? Math.round((inviteAccepted / shareReady) * 100) : null;

  return (
    <div style={{ animation: 'fadeUp .2s ease-out' }}>
      {uiV2 ? (
        <PageHeader
          title="Plantões Capturados"
          subtitle="Histórico consolidado com métricas, score e exportação de dados"
          action={
            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="button" onClick={onShareCaptured} disabled={captured.length === 0}>
                Compartilhar Relatório
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={exportCSV}
                disabled={captured.length === 0}
              >
                Exportar (CSV)
              </Button>
            </div>
          }
        />
      ) : null}

      {captured.length === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="Nenhum plantão capturado"
            description="Inicie o bot no dashboard para começar a analisar e capturar oportunidades."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            <Card
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: C.text2, fontWeight: 500, marginBottom: 8 }}>
                    Total Financeiro Acumulado
                  </div>
                  <div
                    className="pb-mono"
                    style={{ fontSize: 36, fontWeight: 700, color: C.primary }}
                  >
                    R$ {fmt(total)}
                  </div>
                </div>
                <Badge tone="success" style={{ fontSize: 13, padding: '4px 12px' }}>
                  {captured.length} capturados
                </Badge>
              </div>
              <div
                style={{
                  background: C.surfaceMuted,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: C.text1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span>Ticket Médio:</span>
                  <span className="pb-mono" style={{ fontWeight: 600, color: C.text0 }}>
                    R$ {Math.round(total / captured.length)}
                  </span>
                </div>
              </div>
            </Card>

            <Card
              style={{
                padding: 24,
                border: `1px solid ${C.infoSoft}`,
                background: C.infoSoft,
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 14, color: C.info, fontWeight: 600 }}>
                  Métricas de Compartilhamento
                </div>
                <Badge tone="info" style={{ background: '#ffffff', border: `1px solid ${C.info}` }}>
                  {shareReady} envios prontos
                </Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: C.text0,
                  }}
                >
                  <span>Cliques (Intenção):</span>
                  <strong>{shareClicked}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: C.text0,
                  }}
                >
                  <span>Taxa Clique-Envio:</span>
                  <strong>{shareReadyRate != null ? `${shareReadyRate}%` : '--'}</strong>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: C.text0,
                  }}
                >
                  <span>Convites Abertos:</span>
                  <strong>
                    {inviteAccepted}{' '}
                    <span style={{ color: C.text2, fontWeight: 'normal', fontSize: 11 }}>
                      (taxa: {inviteRate != null ? `${inviteRate}%` : '--'})
                    </span>
                  </strong>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: C.text1,
                    background: 'rgba(255,255,255,0.6)',
                    padding: '10px',
                    borderRadius: 6,
                  }}
                >
                  {lastShareLabel
                    ? `Último compartilhamento às ${lastShareLabel}.`
                    : 'Compartilhe seus resultados com colegas e ganhe referências.'}
                </div>
              </div>
            </Card>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: C.surface2,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text0 }}>
                Histórico de Capturas ({captured.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {captured.map((shift, index) => (
                <div
                  key={shift.id}
                  style={{
                    borderBottom: index === captured.length - 1 ? 'none' : `1px solid ${C.border}`,
                    borderLeft: `4px solid ${C.success}`,
                    transition: 'background-color .15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = C.surface2;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setModal(shift)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        width: '100%',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: C.text0 }}>
                          {shift.hospital}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: C.text2 }}>
                          Grupo: {shift.group}
                        </div>
                      </div>
                      <div
                        className="pb-mono"
                        style={{ fontSize: 20, color: C.success, fontWeight: 700 }}
                      >
                        R$ {fmt(shift.val)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        width: '100%',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          padding: '4px 8px',
                          background: C.surface1,
                          fontSize: 12,
                          color: C.text1,
                          fontWeight: 500,
                        }}
                      >
                        {shift.date}
                      </span>
                      <span
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          padding: '4px 8px',
                          background: C.surface1,
                          fontSize: 12,
                          color: C.text1,
                          fontWeight: 500,
                        }}
                      >
                        {shift.hours}
                      </span>
                      <span
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          padding: '4px 8px',
                          background: C.surface1,
                          fontSize: 12,
                          color: C.text1,
                          fontWeight: 500,
                        }}
                      >
                        {shift.dist} km
                      </span>
                      <span
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 4,
                          padding: '4px 8px',
                          background: C.surface1,
                          fontSize: 12,
                          color: C.text1,
                          fontWeight: 500,
                        }}
                      >
                        {shift.spec}
                      </span>
                      <div
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: C.text2,
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Score Profile
                        </span>
                        <div style={{ width: 80 }}>
                          <ScBar sc={shift.sc} h={6} />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {rejected.length > 0 ? (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: C.surface2,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text0 }}>
                  Plantões Descartados ({rejected.length})
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {rejected.map((shift, index) => (
                  <div
                    key={shift.id}
                    style={{
                      padding: '16px 24px',
                      borderBottom:
                        index === rejected.length - 1 ? 'none' : `1px solid ${C.border}`,
                      borderLeft: `4px solid ${C.errorSoft}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      opacity: 0.8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontSize: 14, color: C.text0, fontWeight: 500 }}>
                        {shift.hospital}
                      </div>
                      <span
                        className="pb-mono"
                        style={{ color: C.error, fontWeight: 600, fontSize: 15 }}
                      >
                        R$ {fmt(shift.val)}
                      </span>
                    </div>
                    <div
                      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
                    >
                      {[shift.date, shift.spec, `${shift.dist}km`].map((entry) => (
                        <span key={entry} style={{ fontSize: 12, color: C.text2 }}>
                          {entry}
                        </span>
                      ))}
                      <div style={{ marginLeft: 'auto' }}>
                        <Pill sc={shift.sc} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
