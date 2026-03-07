import { C } from "../constants/colors.js";

export const S = {
  lbl: {
    fontSize: 11,
    color: C.text1,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    display: "block",
    marginBottom: 6,
  },
  inp: {
    width: "100%",
    background: C.surface1,
    border: "1px solid " + C.border,
    borderRadius: 12,
    padding: "11px 13px",
    color: C.text0,
    fontSize: 14,
    fontWeight: 500,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    marginTop: 6,
  },
  range: { width: "100%", cursor: "pointer" },
};

export const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

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
    --pb-shadow-soft: 0 8px 22px ${C.shadow};
    --pb-radius-sm: 8px;
    --pb-radius-md: 12px;
    --pb-radius-lg: 18px;
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
    font-family: 'IBM Plex Sans', sans-serif;
  }

  button, input, select, textarea {
    font-family: inherit;
  }

  .pb-mono {
    font-family: 'IBM Plex Mono', monospace;
  }

  .pb-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at 15% 20%, rgba(11, 95, 255, 0.08), transparent 35%),
      radial-gradient(circle at 85% 82%, rgba(15, 159, 111, 0.08), transparent 38%),
      linear-gradient(180deg, #f8fbff, #f5f8fb);
    color: var(--pb-color-text);
  }

  .pb-shell-grid {
    max-width: 1320px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 20px;
    padding: 20px;
  }

  .pb-sidebar {
    position: sticky;
    top: 20px;
    align-self: start;
    background: var(--pb-color-surface);
    border: 1px solid var(--pb-color-border);
    border-radius: var(--pb-radius-lg);
    box-shadow: var(--pb-shadow-soft);
    padding: var(--pb-space-4);
  }

  .pb-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .pb-topbar {
    background: var(--pb-color-surface);
    border: 1px solid var(--pb-color-border);
    border-radius: var(--pb-radius-lg);
    box-shadow: var(--pb-shadow-soft);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .pb-main {
    background: transparent;
    min-height: calc(100vh - 180px);
    padding-bottom: 72px;
  }

  .pb-nav-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .pb-nav-btn {
    width: 100%;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: var(--pb-color-text-muted);
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all .2s ease;
  }

  .pb-nav-btn:hover,
  .pb-nav-btn:focus-visible {
    background: #eef4ff;
    color: var(--pb-color-primary);
    border-color: #cadbff;
    outline: none;
  }

  .pb-nav-btn[aria-current="page"] {
    background: #e8f0ff;
    border-color: #bfd3ff;
    color: var(--pb-color-primary);
  }

  .pb-badge {
    min-width: 22px;
    height: 22px;
    border-radius: 100px;
    padding: 0 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
  }

  .pb-mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 400;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--pb-color-border);
    display: none;
    gap: 4px;
    padding: 8px 6px 10px;
  }

  .pb-mobile-nav button {
    flex: 1;
    min-width: 0;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    color: var(--pb-color-text-subtle);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 8px;
    font-size: 11px;
    font-weight: 600;
  }

  .pb-mobile-nav button[aria-current="page"] {
    background: #e8f0ff;
    border-color: #bfd3ff;
    color: var(--pb-color-primary);
  }

  .ds-card {
    background: var(--pb-color-surface);
    border: 1px solid var(--pb-color-border);
    border-radius: var(--pb-radius-lg);
    box-shadow: var(--pb-shadow-soft);
    padding: 16px;
  }

  .ds-card-muted {
    background: var(--pb-color-surface-muted);
  }

  .ds-btn {
    border: 1px solid transparent;
    border-radius: 11px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s ease;
  }

  .ds-btn:focus-visible, .ds-btn-focus:focus-visible {
    outline: 2px solid #7ea4ff;
    outline-offset: 1px;
  }

  .ds-btn-primary {
    background: var(--pb-color-primary);
    color: #ffffff;
  }

  .ds-btn-secondary {
    background: #eef4ff;
    color: var(--pb-color-primary);
    border-color: #cadbff;
  }

  .ds-btn-danger {
    background: #fbe7ea;
    color: var(--pb-color-error);
    border-color: #f0c1c8;
  }

  .ds-field {
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--pb-color-border);
    background: #ffffff;
    color: var(--pb-color-text);
    padding: 10px 12px;
    font-size: 14px;
  }

  .ds-field:focus-visible {
    outline: 2px solid #7ea4ff;
    outline-offset: 1px;
    border-color: #95b4ff;
  }

  .pb-page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 14px;
  }

  .pb-page-title {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: var(--pb-color-text);
  }

  .pb-page-subtitle {
    margin-top: 3px;
    color: var(--pb-color-text-muted);
    font-size: 12px;
  }

  .pb-empty {
    text-align: center;
    padding: 48px 22px;
    border: 1px dashed var(--pb-color-border-strong);
    border-radius: var(--pb-radius-lg);
    background: #fbfdff;
  }

  .pb-tab-panels {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes modalUp { from { opacity: 0; transform: scale(.98) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes dotP { 0%,100% { box-shadow: 0 0 0 0 rgba(15,159,111,.5); } 50% { box-shadow: 0 0 0 5px rgba(15,159,111,.08); } }
  @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  @keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1.1); } }
  @keyframes cfFall { 0% { transform: translateY(-10px) rotate(0); opacity:1; } 100% { transform: translateY(110vh) rotate(800deg); opacity: 0; } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  @keyframes wave { from { height: 4px; } to { height: 100%; } }
  @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(4%,4%) scale(1.1);} }
  @keyframes orb2 { 0%,100% { transform: translate(0,0) scale(1);} 50% { transform: translate(-4%,-4%) scale(1.06);} }
  @keyframes orb3 { 0%,100% { transform: translate(0,0);} 33% { transform: translate(4%,-4%);} 66% { transform: translate(-3%,3%);} }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #c9d7e6; border-radius: 8px; }

  input[type=range] {
    -webkit-appearance: none;
    height: 6px;
    background: #dce6f3;
    border-radius: 8px;
  }

  input[type=range]:focus-visible {
    outline: 2px solid #7ea4ff;
    outline-offset: 4px;
  }

  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0b5fff, #2278a6);
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(11,95,255,.16);
  }

  button:active { transform: scale(.98); }
  ::selection { background: #dbe7ff; color: #10243b; }

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
      padding: 14px 14px 76px;
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
      padding: 12px;
      border-radius: 14px;
    }

    .pb-page-title {
      font-size: 20px;
    }
  }
`;
