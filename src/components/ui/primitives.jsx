import { C } from "../../constants/colors.js";

export function Button({
  children,
  variant = "primary",
  className = "",
  style,
  ...props
}) {
  const variantClass =
    variant === "secondary"
      ? "ds-btn-secondary"
      : variant === "danger"
        ? "ds-btn-danger"
        : "ds-btn-primary";

  return (
    <button className={`ds-btn ${variantClass} ${className}`.trim()} style={style} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, muted = false, className = "", style, ...props }) {
  const classes = ["ds-card", muted ? "ds-card-muted" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} style={style} {...props}>
      {children}
    </section>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`ds-field ${className}`.trim()} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`ds-field ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function Badge({ children, tone = "info", className = "", style }) {
  const tones = {
    info: { bg: C.infoSoft, color: C.info, border: "rgba(34, 120, 166, 0.24)" },
    success: { bg: C.successSoft, color: C.success, border: "rgba(15, 159, 111, 0.26)" },
    warning: { bg: C.warningSoft, color: C.warning, border: "rgba(201, 122, 20, 0.24)" },
    error: { bg: C.errorSoft, color: C.error, border: "rgba(201, 62, 74, 0.24)" },
    primary: { bg: C.primarySoft, color: C.primary, border: "rgba(11, 95, 255, 0.26)" },
  };
  const picked = tones[tone] || tones.info;

  return (
    <span
      className={`pb-badge ${className}`.trim()}
      style={{ background: picked.bg, color: picked.color, borderColor: picked.border, ...style }}
    >
      {children}
    </span>
  );
}

export function Tabs({ items, activeKey, onChange, ariaLabel = "Tabs" }) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${item.key}-panel`}
            id={`${item.key}-tab`}
            className={`ds-btn ${isActive ? "ds-btn-primary" : "ds-btn-secondary"}`}
            onClick={() => onChange(item.key)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ open, title, children, onClose, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16, 36, 59, 0.46)",
        backdropFilter: "blur(4px)",
        zIndex: 9500,
        padding: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="ds-card"
        style={{ width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", animation: "modalUp .2s both" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <strong>{title}</strong>
          <button aria-label="Close" onClick={onClose} className="ds-btn ds-btn-secondary" type="button">
            Close
          </button>
        </div>
        {children}
        {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

function toneToColors(tone) {
  if (tone === "success") {
    return { bg: C.successSoft, color: C.success, border: "rgba(15, 159, 111, 0.24)" };
  }
  if (tone === "warning") {
    return { bg: C.warningSoft, color: C.warning, border: "rgba(201, 122, 20, 0.24)" };
  }
  if (tone === "error") {
    return { bg: C.errorSoft, color: C.error, border: "rgba(201, 62, 74, 0.24)" };
  }
  return { bg: C.infoSoft, color: C.info, border: "rgba(34, 120, 166, 0.24)" };
}

export function ToastViewport({ items }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 74,
        right: 14,
        zIndex: 9200,
        maxWidth: 320,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {items.map((item) => {
        const tone = toneToColors(item.severity || "info");
        return (
          <article
            key={item.id}
            style={{
              animation: "toastIn .2s both",
              borderRadius: 12,
              border: `1px solid ${tone.border}`,
              background: tone.bg,
              color: tone.color,
              padding: "10px 12px",
              boxShadow: "0 8px 18px rgba(16, 36, 59, 0.12)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: C.text1 }}>{item.message}</div>
          </article>
        );
      })}
    </div>
  );
}

export function Drawer({ open, title, children, onClose, width = 360 }) {
  return (
    <>
      {open ? (
        <div
          onClick={onClose}
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9100,
            background: "rgba(16, 36, 59, 0.28)",
            backdropFilter: "blur(2px)",
          }}
        />
      ) : null}
      <aside
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width,
          maxWidth: "100%",
          height: "100vh",
          zIndex: 9200,
          background: C.surface1,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: "-10px 0 24px rgba(16, 36, 59, 0.14)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .2s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <strong>{title}</strong>
          <button className="ds-btn ds-btn-secondary" type="button" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>{children}</div>
      </aside>
    </>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="pb-page-header">
      <div>
        <div className="pb-page-title">{title}</div>
        {subtitle ? <div className="pb-page-subtitle">{subtitle}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}

export function EmptyState({ icon = "-", title, description, action }) {
  return (
    <div className="pb-empty">
      <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text0 }}>{title}</div>
      {description ? <div style={{ marginTop: 5, fontSize: 12, color: C.text1 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}
