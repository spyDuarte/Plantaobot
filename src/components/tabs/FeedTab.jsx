import { C } from "../../constants/colors.js";
import { Av, Badge, Button, Card, EmptyState, PageHeader, Pill, ScBar } from "../ui/index.jsx";

export default function FeedTab({ uiV2, botOn, feed, typing, setModal, feedRef, setTab }) {
  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Feed monitorado"
          subtitle="Mensagens analisadas dos grupos conectados"
          action={botOn ? <Badge tone="success">Ao vivo</Badge> : <Badge tone="warning">Pausado</Badge>}
        />
      ) : null}

      {typing ? (
        <Card muted style={{ marginBottom: 8, borderColor: "rgba(34, 120, 166, 0.24)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.info }}>
            <strong>{typing}</strong>
            <span>[digitando]</span>
          </div>
        </Card>
      ) : null}

      <div ref={feedRef} style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 620, overflowY: "auto" }}>
        {feed.length === 0 ? (
          <Card>
            {!botOn ? (
              <EmptyState
                icon="F"
                title="Bot inativo"
                description="Inicie o monitoramento para receber mensagens dos grupos."
              />
            ) : (
              <EmptyState
                icon="F"
                title="Aguardando mensagens"
                description="Monitoramento ativo. Configure a integração WhatsApp para receber ofertas de plantão em tempo real."
                action={
                  setTab ? (
                    <Button type="button" variant="secondary" onClick={() => setTab("settings")}>
                      Configurar WhatsApp
                    </Button>
                  ) : null
                }
              />
            )}
          </Card>
        ) : (
          feed.map((message) => {
            const borderColor =
              message.isOffer && message.ok === true
                ? "rgba(15, 159, 111, 0.34)"
                : message.isOffer && message.ok === false
                  ? "rgba(201, 62, 74, 0.34)"
                  : "rgba(34, 120, 166, 0.26)";

            return (
              <Card key={message.id} style={{ borderColor }}>
                <div style={{ display: "flex", gap: 10, marginBottom: message.isOffer ? 8 : 0 }}>
                  <Av l={message.av} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <strong style={{ fontSize: 12, color: C.text0 }}>{message.sender}</strong>
                        <div style={{ marginTop: 1, fontSize: 11, color: C.text2 }}>{message.group}</div>
                      </div>
                      <span className="pb-mono" style={{ fontSize: 11, color: C.text2 }}>
                        {message.ts}
                      </span>
                    </div>

                    {!message.isOffer ? (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: C.text1 }}>{message.rawMsg || message.text}</p>
                    ) : null}
                  </div>
                </div>

                {message.isOffer ? (
                  <>
                    <pre
                      style={{
                        margin: "0 0 8px",
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: C.surface2,
                        padding: "8px 10px",
                        fontSize: 11,
                        color: C.text1,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {message.rawMsg}
                    </pre>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      {message.state === "scanning" ? (
                        <Badge tone="info">Analisando</Badge>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                          <Pill sc={message.sc} />
                          <div style={{ flex: 1 }}>
                            <ScBar sc={message.sc} />
                          </div>
                        </div>
                      )}

                      {message.state === "done" ? (
                        <Button type="button" variant="secondary" onClick={() => setModal(message)}>
                          Detalhes
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
