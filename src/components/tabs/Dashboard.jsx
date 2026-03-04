import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { Badge, Button, Card, PageHeader, Waveform } from "../ui/index.jsx";

function StatCard({ label, value, tone = "info" }) {
  const toneMap = {
    info: { border: "rgba(34, 120, 166, 0.24)", bg: C.infoSoft, color: C.info },
    success: { border: "rgba(15, 159, 111, 0.24)", bg: C.successSoft, color: C.success },
    warning: { border: "rgba(201, 122, 20, 0.24)", bg: C.warningSoft, color: C.warning },
    error: { border: "rgba(201, 62, 74, 0.24)", bg: C.errorSoft, color: C.error },
  };
  const colors = toneMap[tone] || toneMap.info;

  return (
    <Card muted style={{ borderColor: colors.border, background: colors.bg, padding: 12 }}>
      <div style={{ fontSize: 11, color: C.text2 }}>{label}</div>
      <div className="pb-mono" style={{ marginTop: 4, fontSize: 24, fontWeight: 700, color: colors.color }}>
        {value}
      </div>
    </Card>
  );
}

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
}) {
  const action = (
    <Button type="button" variant={botOn ? "danger" : "primary"} onClick={botOn ? stopBot : startBot}>
      {botOn ? "Parar bot" : "Iniciar bot"}
    </Button>
  );

  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Dashboard operacional"
          subtitle="Visao consolidada de capturas e monitoramento em tempo real"
          action={action}
        />
      ) : null}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>Total garantido</div>
          <Badge tone={botOn ? "success" : "warning"}>{botOn ? "Monitorando" : "Pausado"}</Badge>
        </div>
        <div className="pb-mono" style={{ fontSize: 34, fontWeight: 700, color: C.primary }}>
          R$ {fmt(total)}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginBottom: 12 }}>
        <StatCard label="Analisados" value={captured.length + rejected.length} tone="info" />
        <StatCard label="Capturados" value={captured.length} tone="success" />
        <StatCard label="Pendentes" value={pending.length} tone="warning" />
        <StatCard label="Descartados" value={rejected.length} tone="error" />
      </div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Status do monitoramento</div>
            <div style={{ marginTop: 3, fontSize: 12, color: C.text1 }}>
              {botOn
                ? `Escaneando ${actG.length} grupos no modo ${prefs.auto ? "automatico" : "manual"}`
                : `${actG.length} grupos ativos e prontos para iniciar`}
            </div>
          </div>
          {botOn ? <Waveform active /> : <Badge tone="warning">Inativo</Badge>}
        </div>

        {botOn ? (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {actG.map((group) => (
              <div
                key={group.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12 }}>{group.emoji} {group.name}</span>
                <span style={{ fontSize: 11, color: typing === group.name ? C.info : C.success, fontWeight: 600 }}>
                  {typing === group.name ? "Digitando..." : "Ativo"}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {captured.length > 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>Ultimos capturados</strong>
            <Button type="button" variant="secondary" onClick={() => setTab(prefs.auto ? "captured" : "swipe")}>Ver todos</Button>
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    <strong style={{ fontSize: 12, color: C.text0 }}>{shift.hospital}</strong>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11, color: C.text2 }}>
                      {shift.date} - {shift.spec}
                    </span>
                  </span>
                  <span className="pb-mono" style={{ fontSize: 14, color: C.success, fontWeight: 700 }}>
                    R$ {fmt(shift.val)}
                  </span>
                </button>
              ))}
          </div>
        </Card>
      ) : null}

      {!uiV2 ? action : null}
    </div>
  );
}
