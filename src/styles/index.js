import { C } from '../constants/colors.js';

export const S = {
  lbl: {
    fontSize: 12,
    color: C.text1,
    fontWeight: 600,
    display: 'block',
    marginBottom: 8,
  },
  inp: {
    width: '100%',
    background: C.surface1,
    border: '1px solid ' + C.border,
    borderRadius: 6,
    padding: '10px 14px',
    color: C.text0,
    fontSize: 14,
    fontWeight: 500,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    marginTop: 6,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  range: { width: '100%', cursor: 'pointer' },
};

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    --pb-color-bg: ${C.surface0};
    --pb-color-surface: ${C.surface1};
    --pb-color-surface-muted: ${C.surface2};
    --pb-color-text: ${C.text0};
    --pb-color-text-muted: ${C.text1};
    --pb-color-text-subtle: ${C.text2};
    --pb-color-primary: ${C.primary};
    --pb-color-success: ${C.success};
    --pb-color-warning: ${C.warning};
    --pb-color-error: ${C.error};
    --pb-color-info: ${C.info};
    --pb-color-border: ${C.border};
    --pb-color-border-strong: ${C.borderStrong};
    --pb-shadow-soft: 0 1px 2px rgba(15, 23, 42, 0.05);
    --pb-shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03);
    --pb-shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
    --pb-radius-sm: 4px;
    --pb-radius-md: 6px;
    --pb-radius-lg: 8px;
    --pb-space-1: 4px;
    --pb-space-2: 8px;
    --pb-space-3: 12px;
    --pb-space-4: 16px;
    --pb-space-5: 20px;
    --pb-space-6: 24px;
  }

  * { box-sizing: border-box; }

  html, body, #root {
    margin: 0;
    min-height: 100%;
    background: var(--pb-color-bg);
    color: var(--pb-color-text);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  .pb-mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .pb-shell {
    min-height: 100vh;
    background: var(--pb-color-bg);
    color: var(--pb-color-text);
  }

  .pb-shell-grid {
    max-width: 1280px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 32px;
    padding: 24px 32px;
  }

  .pb-sidebar {
    position: sticky;
    top: 24px;
    align-self: start;
    background: transparent;
  }

  .pb-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }

  .pb-topbar {
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid var(--pb-color-border);
    padding-bottom: 16px;
  }

  .pb-main {
    background: transparent;
    min-height: calc(100vh - 180px);
    padding-bottom: 72px;
  }

  .pb-nav-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 24px;
  }

  .pb-nav-btn {
    width: 100%;
    border: none;
    border-radius: var(--pb-radius-sm);
    background: transparent;
    color: var(--pb-color-text-muted);
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color .15s ease, color .15s ease;
  }

  .pb-nav-btn:hover,
  .pb-nav-btn:focus-visible {
    background: var(--pb-color-surface-muted);
    color: var(--pb-color-text);
    outline: none;
  }

  .pb-nav-btn[aria-current="page"] {
    background: var(--pb-color-surface-muted);
    color: var(--pb-color-primary);
    font-weight: 600;
  }

  .pb-badge {
    min-width: 20px;
    height: 20px;
    border-radius: 9999px;
    padding: 0 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    border: none;
  }

  .pb-mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 400;
    background: var(--pb-color-surface);
    border-top: 1px solid var(--pb-color-border);
    display: none;
    padding: 10px 8px;
    padding-bottom: env(safe-area-inset-bottom, 10px);
    box-shadow: 0 -1px 3px rgba(0,0,0,0.05);
  }

  .pb-mobile-nav button {
    flex: 1;
    min-width: 0;
    border: none;
    border-radius: var(--pb-radius-sm);
    background: transparent;
    color: var(--pb-color-text-subtle);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 4px;
    font-size: 11px;
    font-weight: 500;
  }

  .pb-mobile-nav button[aria-current="page"] {
    color: var(--pb-color-primary);
  }

  .ds-card {
    background: var(--pb-color-surface);
    border: 1px solid var(--pb-color-border);
    border-radius: var(--pb-radius-md);
    box-shadow: var(--pb-shadow-soft);
    padding: 24px;
  }

  .ds-card-muted {
    background: var(--pb-color-surface-muted);
    box-shadow: none;
  }

  .ds-btn {
    border: 1px solid transparent;
    border-radius: var(--pb-radius-sm);
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    line-height: 1.2;
    letter-spacing: 0.01em;
  }

  .ds-btn:focus-visible, .ds-btn-focus:focus-visible {
    outline: 2px solid var(--pb-color-primary);
    outline-offset: 1px;
  }

  .ds-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .ds-btn-primary {
    background: var(--pb-color-primary);
    color: #ffffff;
    border-color: var(--pb-color-primary);
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
  }

  .ds-btn-primary:hover:not(:disabled) {
    background: #1d4ed8;
    border-color: #1d4ed8;
  }

  .ds-btn-primary:active:not(:disabled) {
    background: #1e40af;
    border-color: #1e40af;
    box-shadow: none;
  }

  .ds-btn-secondary {
    background: var(--pb-color-surface);
    color: var(--pb-color-text);
    border-color: var(--pb-color-border-strong);
    box-shadow: var(--pb-shadow-soft);
  }

  .ds-btn-secondary:hover:not(:disabled) {
    background: var(--pb-color-surface-muted);
    border-color: #94a3b8;
  }

  .ds-btn-secondary:active:not(:disabled) {
    background: #e2e8f0;
    box-shadow: none;
  }

  .ds-btn-danger {
    background: var(--pb-color-error);
    color: #ffffff;
    border-color: var(--pb-color-error);
    box-shadow: 0 1px 2px rgba(220, 38, 38, 0.2);
  }

  .ds-btn-danger:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
  }

  .ds-btn-danger:active:not(:disabled) {
    background: #991b1b;
    border-color: #991b1b;
    box-shadow: none;
  }

  .ds-field {
    width: 100%;
    border-radius: var(--pb-radius-sm);
    border: 1px solid var(--pb-color-border-strong);
    background: var(--pb-color-surface);
    color: var(--pb-color-text);
    padding: 10px 14px;
    font-size: 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .ds-field:focus-visible {
    outline: none;
    border-color: var(--pb-color-primary);
    box-shadow: 0 0 0 3px var(--pb-color-primarySoft);
  }

  .pb-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .pb-page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--pb-color-text);
  }

  .pb-page-subtitle {
    margin-top: 4px;
    color: var(--pb-color-text-muted);
    font-size: 14px;
  }

  .pb-empty {
    text-align: center;
    padding: 64px 24px;
    border: 1px dashed var(--pb-color-border-strong);
    border-radius: var(--pb-radius-md);
    background: var(--pb-color-surface-muted);
  }

  .pb-tab-panels {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes modalUp { from { opacity: 0; transform: scale(.98) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--pb-color-border-strong); border-radius: 8px; }

  input[type=range] {
    -webkit-appearance: none;
    height: 4px;
    background: var(--pb-color-border);
    border-radius: 4px;
  }

  input[type=range]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--pb-color-primarySoft);
  }

  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--pb-color-primary);
    cursor: pointer;
    box-shadow: var(--pb-shadow-soft);
    border: 2px solid var(--pb-color-surface);
  }

  button:active { transform: scale(.99); }
  ::selection { background: var(--pb-color-primarySoft); color: var(--pb-color-primary); }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media (max-width: 960px) {
    .pb-shell-grid {
      grid-template-columns: minmax(0, 1fr);
      padding: 16px 16px 80px;
      gap: 24px;
    }

    .pb-sidebar {
      display: none;
    }

    .pb-mobile-nav {
      display: flex;
    }

    .pb-main {
      min-height: auto;
    }

    .pb-topbar {
      padding-bottom: 12px;
    }

    .pb-page-title {
      font-size: 20px;
    }
  }
`;
