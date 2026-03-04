import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { Badge, Button, Card, EmptyState, PageHeader, Pill, ScBar } from "../ui/index.jsx";

export default function CapturedTab({ uiV2, captured, rejected, total, exportCSV, setModal }) {
  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Plantoes capturados"
          subtitle="Historico consolidado com score e exportacao"
          action={
            <Button type="button" variant="secondary" onClick={exportCSV} disabled={captured.length === 0}>
              Exportar CSV
            </Button>
          }
        />
      ) : null}

      {captured.length === 0 ? (
        <Card>
          <EmptyState icon="C" title="Nenhum plantao capturado" description="Inicie o bot no dashboard para comecar." />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: C.text2 }}>Total financeiro</div>
                <div className="pb-mono" style={{ marginTop: 3, fontSize: 28, fontWeight: 700, color: C.primary }}>
                  R$ {fmt(total)}
                </div>
              </div>
              <Badge tone="success">{captured.length} capturados</Badge>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {captured.map((shift) => (
              <Card key={shift.id} style={{ borderLeft: `3px solid ${C.success}` }}>
                <button
                  type="button"
                  onClick={() => setModal(shift)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{shift.hospital}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: C.text2 }}>{shift.group}</div>
                    </div>
                    <div className="pb-mono" style={{ fontSize: 17, color: C.success, fontWeight: 700 }}>
                      R$ {fmt(shift.val)}
                    </div>
                  </div>
                </button>

                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[shift.date, shift.hours, `${shift.dist}km`, shift.spec].map((entry) => (
                    <span
                      key={entry}
                      style={{
                        border: `1px solid ${C.border}`,
                        borderRadius: 999,
                        padding: "3px 8px",
                        background: C.surface2,
                        fontSize: 11,
                        color: C.text1,
                      }}
                    >
                      {entry}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 8 }}>
                  <ScBar sc={shift.sc} h={5} />
                </div>
              </Card>
            ))}
          </div>

          {rejected.length > 0 ? (
            <Card style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, fontSize: 12, color: C.text1, fontWeight: 700 }}>Descartados ({rejected.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rejected.map((shift) => (
                  <Card key={shift.id} muted style={{ borderLeft: `3px solid ${C.error}`, opacity: 0.85 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, color: C.text1 }}>{shift.hospital}</div>
                      <span className="pb-mono" style={{ color: C.error, fontWeight: 700 }}>
                        R$ {fmt(shift.val)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {[shift.date, shift.spec, `${shift.dist}km`].map((entry) => (
                        <span key={entry} style={{ fontSize: 11, color: C.text2 }}>
                          {entry}
                        </span>
                      ))}
                      <Pill sc={shift.sc} />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
