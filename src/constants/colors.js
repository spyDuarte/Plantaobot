const palette = {
  background: '#f8fafc', // Clean, corporate background
  surface: '#ffffff', // Pure white for cards
  surfaceMuted: '#f1f5f9', // Very subtle gray for secondary areas
  surfaceStrong: '#e2e8f0', // Stronger gray for robust borders or active states
  text: '#0f172a', // High contrast dark text for readability
  textMuted: '#475569', // Muted text for secondary info
  textSubtle: '#64748b', // Subtle text for tertiary info
  border: '#e2e8f0', // Clean default border
  borderStrong: '#cbd5e1', // Hover or active border state
  primary: '#2563eb', // Deep blue, authoritative and professional
  primarySoft: '#eff6ff', // Extremely light blue for subtle highlights
  success: '#059669', // Serious emerald green for success metrics
  successSoft: '#ecfdf5', // Light green for success backgrounds
  warning: '#d97706', // Amber for warnings
  warningSoft: '#fffbeb', // Light amber background
  error: '#dc2626', // Sharp red for errors or urgent actions
  errorSoft: '#fef2f2', // Light red background
  info: '#3b82f6', // Standard blue for informational elements
  infoSoft: '#eff6ff', // Match primary soft for coherence
  accent: '#4f46e5', // Indigo for secondary actions
  accentSoft: '#eef2ff', // Light indigo
  shadow: 'rgba(15, 23, 42, 0.05)', // Even more subtle, corporate shadow
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
