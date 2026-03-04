import { useEffect } from "react";
import { C, reducedMotion } from "../constants/colors.js";
import { fmt, calcScore } from "../utils/index.js";
import { Button, Card, Pill, RivalRace, ScBar } from "./ui/index.jsx";

export default function ShiftModal({ shift, prefs, onClose, onAccept, captured = [] }) {
  useEffect(() => {
    if (!shift) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shift, onClose]);

  if (!shift) {
    return null;
  }

  const result = calcScore(shift, prefs);
  const score = result.s;
  const scoreColor = score >= 80 ? C.success : score >= 50 ? C.warning : C.error;
  const alreadyCaptured = captured.some((item) => item.id === shift.id);

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16, 36, 59, 0.45)",
        backdropFilter: "blur(6px)",
        zIndex: 9300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={shift.hospital}
        onClick={(event) => event.stopPropagation()}
        style={{ width: "100%", maxWidth: 500, animation: reducedMotion ? "none" : "modalUp .2s both" }}
      >
        <Card style={{ maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{shift.hospital}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: C.text2 }}>{shift.group}</div>
            </div>
            <Button type="button" variant="secondary" onClick={onClose} aria-label="Fechar modal">
              Fechar
            </Button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7, marginBottom: 10 }}>
            {[
              ["Valor", `R$ ${fmt(shift.val)}`],
              ["Duracao", shift.hours],
              ["Data", shift.date],
              ["Distancia", `${shift.dist} km`],
              ["Especialidade", shift.spec],
              ["Local", shift.loc],
            ].map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px", background: C.surface2 }}>
                <div style={{ fontSize: 11, color: C.text2 }}>{label}</div>
                <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          <Card muted style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Compatibilidade</strong>
              <span className="pb-mono" style={{ fontSize: 24, fontWeight: 700, color: scoreColor }}>
                {score}%
              </span>
            </div>
            <ScBar sc={score} h={6} />
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {result.r.map((reason, index) => (
                <div key={`${reason.l}-${index}`} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: reason.ok ? C.success : C.error }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: reason.ok ? C.success : C.error }} />
                  {reason.l}
                </div>
              ))}
            </div>
          </Card>

          {shift.rivals ? <RivalRace shift={shift} won={score >= 60} /> : null}

          <Card muted style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 6, fontSize: 11, color: C.text2 }}>Mensagem original</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.5, color: C.text1, fontFamily: "'IBM Plex Mono', monospace" }}>
              {shift.rawMsg}
            </pre>
          </Card>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {alreadyCaptured ? (
              <Button type="button" variant="secondary" disabled>
                Ja capturado
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (onAccept) {
                    onAccept(shift);
                  }
                  onClose();
                }}
              >
                Aceitar plantao
              </Button>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <Pill sc={score} />
          </div>
        </Card>
      </div>
    </div>
  );
}
