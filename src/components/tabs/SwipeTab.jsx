import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { Button, Card, EmptyState, PageHeader } from "../ui/index.jsx";
import SwipeCard from "../SwipeCard.jsx";

export default function SwipeTab({ uiV2, botOn, pending, captured, prefs, acceptPending, rejectPending, setModal }) {
  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Triagem manual"
          subtitle="Aprove ou descarte os plantoes elegiveis pelo modo swipe"
          action={
            <Button type="button" variant="secondary" onClick={() => setModal(pending[0])} disabled={pending.length === 0}>
              Ver primeiro
            </Button>
          }
        />
      ) : null}

      {pending.length === 0 ? (
        <Card>
          <EmptyState
            icon="S"
            title="Nenhum plantao pendente"
            description={botOn ? "Monitoramento ativo. Novas oportunidades aparecem aqui." : "Inicie o bot no dashboard."}
          />
        </Card>
      ) : (
        <SwipeCard
          shift={pending[0]}
          prefs={prefs}
          index={0}
          total={pending.length}
          onAccept={() => acceptPending(pending[0])}
          onReject={() => rejectPending(pending[0])}
        />
      )}

      {captured.length > 0 ? (
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <strong style={{ fontSize: 13 }}>Aceitos recentemente</strong>
            <span style={{ fontSize: 12, color: C.text1 }}>{captured.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                    borderRadius: 10,
                    background: "#fff",
                    padding: "10px 12px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    <strong style={{ fontSize: 12 }}>{shift.hospital}</strong>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11, color: C.text2 }}>{shift.date}</span>
                  </span>
                  <span className="pb-mono" style={{ color: C.success, fontWeight: 700 }}>
                    R$ {fmt(shift.val)}
                  </span>
                </button>
              ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
