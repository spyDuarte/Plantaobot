import { C } from '../../constants/colors.js';

export function Button({ children, variant = 'primary', className = '', style, ...props }) {
  const variantClass =
    variant === 'secondary'
      ? 'ds-btn-secondary'
      : variant === 'danger'
        ? 'ds-btn-danger'
        : 'ds-btn-primary';

  return (
    <button className={`ds-btn ${variantClass} ${className}`.trim()} style={style} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, muted = false, className = '', style, ...props }) {
  const classes = ['ds-card', muted ? 'ds-card-muted' : '', className].filter(Boolean).join(' ');

  return (
    <section className={classes} style={style} {...props}>
      {children}
    </section>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`ds-field ${className}`.trim()} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`ds-field ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function Badge({ children, tone = 'info', className = '', style }) {
  const tones = {
    info: { bg: C.infoSoft, color: C.info },
    success: { bg: C.successSoft, color: C.success },
    warning: { bg: C.warningSoft, color: C.warning },
    error: { bg: C.errorSoft, color: C.error },
    primary: { bg: C.primarySoft, color: C.primary },
  };
  const picked = tones[tone] || tones.info;

  return (
    <span
      className={`pb-badge ${className}`.trim()}
      style={{ background: picked.bg, color: picked.color, ...style }}
    >
      {children}
    </span>
  );
}

export function Tabs({ items, activeKey, onChange, ariaLabel = 'Tabs' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${item.key}-panel`}
            id={`${item.key}-tab`}
            className={`ds-btn ${isActive ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
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
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9500,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="ds-card"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalUp .2s both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <strong style={{ fontSize: 18, color: C.text0 }}>{title}</strong>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="ds-btn ds-btn-secondary"
            type="button"
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            Fechar
          </button>
        </div>
        {children}
        {footer ? <div style={{ marginTop: 20 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

function toneToColors(tone) {
  if (tone === 'success') {
    return { bg: C.successSoft, color: C.success, border: C.success };
  }
  if (tone === 'warning') {
    return { bg: C.warningSoft, color: C.warning, border: C.warning };
  }
  if (tone === 'error') {
    return { bg: C.errorSoft, color: C.error, border: C.error };
  }
  return { bg: C.infoSoft, color: C.info, border: C.info };
}

export function ToastViewport({ items }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9200,
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => {
        const tone = toneToColors(item.severity || 'info');
        return (
          <article
            key={item.id}
            style={{
              animation: 'toastIn .2s both',
              borderRadius: 8,
              borderLeft: `4px solid ${tone.border}`,
              background: C.surface1,
              color: C.text0,
              padding: '12px 16px',
              boxShadow:
                '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: C.text1 }}>{item.message}</div>
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
            position: 'fixed',
            inset: 0,
            zIndex: 9100,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
          }}
        />
      ) : null}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width,
          maxWidth: '100%',
          height: '100vh',
          zIndex: 9200,
          background: C.surface1,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: '-4px 0 15px rgba(15, 23, 42, 0.05)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <button
            className="ds-btn ds-btn-secondary"
            type="button"
            onClick={onClose}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            Fechar
          </button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{children}</div>
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

export function EmptyState({ icon = '-', title, description, action }) {
  return (
    <div className="pb-empty">
      <div style={{ fontSize: 32, marginBottom: 12, color: C.text2 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text0 }}>{title}</div>
      {description ? (
        <div style={{ marginTop: 6, fontSize: 14, color: C.text1 }}>{description}</div>
      ) : null}
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}
