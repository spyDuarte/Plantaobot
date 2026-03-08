const palette = {
  background: '#f8fafc', // Fundo geral mais claro e limpo
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  surfaceStrong: '#e2e8f0',
  text: '#0f172a', // Texto mais escuro e sério
  textMuted: '#475569',
  textSubtle: '#64748b',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  primary: '#2563eb', // Azul B2B profissional
  primarySoft: '#eff6ff',
  success: '#059669', // Verde B2B corporativo
  successSoft: '#ecfdf5',
  warning: '#d97706',
  warningSoft: '#fffbeb',
  error: '#dc2626', // Vermelho erro forte
  errorSoft: '#fef2f2',
  info: '#3b82f6',
  infoSoft: '#eff6ff',
  accent: '#4f46e5',
  accentSoft: '#eef2ff',
  shadow: 'rgba(15, 23, 42, 0.08)', // Sombra elegante e discreta
};

export const C = {
  primary: palette.primary,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  accent: palette.accent,
  surface0: palette.background,
  surface1: palette.surface,
  surface2: palette.surfaceMuted,
  text0: palette.text,
  text1: palette.textMuted,
  text2: palette.textSubtle,
  border: palette.border,
  borderStrong: palette.borderStrong,
  primarySoft: palette.primarySoft,
  successSoft: palette.successSoft,
  warningSoft: palette.warningSoft,
  errorSoft: palette.errorSoft,
  infoSoft: palette.infoSoft,
  accentSoft: palette.accentSoft,
  shadow: palette.shadow,
  bg0: palette.background,
  bg1: palette.surface,
  bg2: palette.surfaceMuted,
  em: palette.success,
  emA: 'rgba(5,150,105,0.1)',
  emB: 'rgba(5,150,105,0.05)',
  emG: 'rgba(5,150,105,0.4)',
  cy: palette.info,
  cyA: 'rgba(59,130,246,0.1)',
  cyB: 'rgba(59,130,246,0.05)',
  am: palette.warning,
  amA: 'rgba(217,119,6,0.1)',
  rd: palette.error,
  rdA: 'rgba(220,38,38,0.1)',
  pu: palette.accent,
  puA: 'rgba(79,70,229,0.1)',
  tx0: palette.text,
  tx1: palette.textMuted,
  tx2: palette.textSubtle,
  bd: palette.border,
  bdH: palette.borderStrong,
  glass: 'rgba(255,255,255,0.95)',
};

export const AVC = {
  P: '#059669',
  C: '#2563eb',
  A: '#c026d3',
  S: '#4f46e5',
  U: '#d97706',
  H: '#0d9488',
  V: '#2563eb',
  M: '#b45309',
  F: '#9333ea',
  O: '#059669',
  K: '#dc2626',
  N: '#0284c7',
};

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
