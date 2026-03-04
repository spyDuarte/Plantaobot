import { C } from "../../constants/colors.js";
import { Badge, Button } from "../ui/primitives.jsx";

function NavButton({ item, active, onSelect }) {
  return (
    <button
      type="button"
      className="pb-nav-btn"
      onClick={() => onSelect(item.key)}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span aria-hidden="true" style={{ fontSize: 17 }}>
          {item.icon}
        </span>
        <span>{item.label}</span>
      </span>
      {item.badgeCount > 0 ? (
        <Badge tone={active ? "primary" : "info"}>{item.badgeCount > 99 ? "99+" : item.badgeCount}</Badge>
      ) : null}
    </button>
  );
}

export default function AppShell({
  title,
  subtitle,
  userName,
  botOn,
  tabs,
  activeTab,
  onTabChange,
  onStartBot,
  onStopBot,
  onOpenNotifications,
  notificationCount,
  children,
}) {
  const desktopTabs = tabs.filter((tab) => tab.desktopVisible);
  const mobileTabs = tabs.filter((tab) => tab.mobileVisible);

  return (
    <div className="pb-shell">
      <div className="pb-shell-grid">
        <aside className="pb-sidebar" aria-label="Navegacao lateral">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #0b5fff, #2278a6)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 8px 16px rgba(11, 95, 255, 0.22)",
              }}
            >
              +
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
              <div style={{ marginTop: 2, fontSize: 11, color: C.text1 }}>{subtitle}</div>
            </div>
          </div>

          <div className="pb-nav-list">
            {desktopTabs.map((item) => (
              <NavButton key={item.key} item={item} active={item.key === activeTab} onSelect={onTabChange} />
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              borderTop: `1px solid ${C.border}`,
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <Button type="button" onClick={botOn ? onStopBot : onStartBot} variant={botOn ? "danger" : "primary"}>
              {botOn ? "Parar monitoramento" : "Iniciar monitoramento"}
            </Button>
            <Button type="button" onClick={onOpenNotifications} variant="secondary">
              Notificacoes {notificationCount > 0 ? `(${notificationCount})` : ""}
            </Button>
            <div style={{ fontSize: 11, color: C.text1 }}>
              Usuario ativo: <strong>{userName || "Medico"}</strong>
            </div>
          </div>
        </aside>

        <section className="pb-content">
          <header className="pb-topbar">
            <div>
              <div style={{ fontSize: 13, color: C.text1 }}>Painel operacional</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge tone={botOn ? "success" : "warning"}>{botOn ? "Bot ativo" : "Bot inativo"}</Badge>
              <Button type="button" onClick={onOpenNotifications} variant="secondary">
                Alertas {notificationCount > 0 ? notificationCount : ""}
              </Button>
              <Button type="button" onClick={botOn ? onStopBot : onStartBot}>
                {botOn ? "Parar" : "Iniciar"}
              </Button>
            </div>
          </header>

          <main className="pb-main" id={`${activeTab}-panel`} role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
            {children}
          </main>
        </section>
      </div>

      <nav className="pb-mobile-nav" role="navigation" aria-label="Navegacao principal mobile">
        {mobileTabs.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
                {item.icon}
              </span>
              <span style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "100%" }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
