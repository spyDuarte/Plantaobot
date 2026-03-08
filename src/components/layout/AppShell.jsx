import { C } from '../../constants/colors.js';
import { Badge, Button } from '../ui/primitives.jsx';

function NavButton({ item, active, onSelect }) {
  return (
    <button
      type="button"
      className="pb-nav-btn"
      onClick={() => onSelect(item.key)}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>
          {item.icon}
        </span>
        <span>{item.label}</span>
      </span>
      {item.badgeCount > 0 ? (
        <Badge tone={active ? 'primary' : 'info'}>
          {item.badgeCount > 99 ? '99+' : item.badgeCount}
        </Badge>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.primary,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              PB
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text0 }}>{title}</div>
              <div style={{ fontSize: 12, color: C.text1 }}>{subtitle}</div>
            </div>
          </div>

          <div className="pb-nav-list">
            {desktopTabs.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={item.key === activeTab}
                onSelect={onTabChange}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: C.text2, marginBottom: 8, paddingLeft: 12 }}>
              Sistema
            </div>
            <Button
              type="button"
              onClick={botOn ? onStopBot : onStartBot}
              variant={botOn ? 'danger' : 'primary'}
            >
              {botOn ? 'Parar monitoramento' : 'Iniciar monitoramento'}
            </Button>
            <Button type="button" onClick={onOpenNotifications} variant="secondary">
              Notificações {notificationCount > 0 ? `(${notificationCount})` : ''}
            </Button>

            <div
              style={{
                marginTop: 12,
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: C.surface2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text1,
                }}
              >
                {(userName || 'M')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text0 }}>
                  {userName || 'Médico'}
                </div>
                <div style={{ fontSize: 11, color: C.text2 }}>Usuário ativo</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="pb-content">
          <header className="pb-topbar">
            <div>
              <div style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>
                Painel operacional
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.text0 }}>
                {tabs.find((t) => t.key === activeTab)?.label || title}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge tone={botOn ? 'success' : 'warning'}>
                {botOn ? 'Monitoramento ativo' : 'Monitoramento pausado'}
              </Badge>
              <Button type="button" onClick={onOpenNotifications} variant="secondary">
                Alertas {notificationCount > 0 ? notificationCount : ''}
              </Button>
              <Button
                type="button"
                onClick={botOn ? onStopBot : onStartBot}
                variant={botOn ? 'danger' : 'primary'}
              >
                {botOn ? 'Parar' : 'Iniciar'}
              </Button>
            </div>
          </header>

          <main
            className="pb-main"
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
          >
            {children}
          </main>
        </section>
      </div>

      <nav className="pb-mobile-nav" role="navigation" aria-label="Navegação principal mobile">
        {mobileTabs.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
                {item.icon}
              </span>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  maxWidth: '100%',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
