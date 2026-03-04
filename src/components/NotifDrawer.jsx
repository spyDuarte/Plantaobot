import { C } from "../constants/colors.js";
import { Badge, Card, Drawer, EmptyState } from "./ui/index.jsx";

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return String(timestamp);
  }

  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function normalize(item) {
  return {
    id: item.id,
    title: item.title,
    message: item.message ?? item.body ?? "",
    severity: item.severity ?? (item.type === "win" ? "success" : item.type || "info"),
    timestamp: item.timestamp ?? item.time,
    source: item.source || "bot",
  };
}

export default function NotifDrawer({ open, notifs, onClose }) {
  const normalized = notifs.map(normalize).slice().reverse();

  return (
    <Drawer open={open} title="Notificacoes" onClose={onClose}>
      {normalized.length === 0 ? (
        <EmptyState icon="!" title="Nenhuma notificacao" description="Alertas do bot e da captura aparecem aqui." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {normalized.map((notification) => {
            const tone =
              notification.severity === "success"
                ? "success"
                : notification.severity === "warning"
                  ? "warning"
                  : notification.severity === "error"
                    ? "error"
                    : "info";

            return (
              <Card key={notification.id} muted style={{ borderColor: C.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 13 }}>{notification.title}</strong>
                  <Badge tone={tone}>{notification.severity}</Badge>
                </div>
                <p style={{ margin: "7px 0 6px", fontSize: 12, color: C.text1, lineHeight: 1.5 }}>{notification.message}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.text2 }}>
                  <span>{formatTimestamp(notification.timestamp)}</span>
                  <span>{notification.source}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
