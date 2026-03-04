export const C = {
  bg0: "#02060f", bg1: "#070e1d", bg2: "#0c1628",
  em: "#00ff9d", emA: "rgba(0,255,157,0.12)", emB: "rgba(0,255,157,0.06)", emG: "rgba(0,255,157,0.5)",
  cy: "#22d4f5", cyA: "rgba(34,212,245,0.12)", cyB: "rgba(34,212,245,0.06)",
  am: "#f5a623", amA: "rgba(245,166,35,0.15)",
  rd: "#ff4d6d", rdA: "rgba(255,77,109,0.15)",
  pu: "#a78bfa", puA: "rgba(167,139,250,0.12)",
  tx0: "#edf2ff", tx1: "#8da0b8", tx2: "#3a5068",
  bd: "rgba(255,255,255,0.07)", bdH: "rgba(255,255,255,0.12)",
  glass: "rgba(7,14,29,0.8)",
};

export const AVC = {P:"#00ff9d",C:"#22d4f5",A:"#f472b6",S:"#a78bfa",U:"#f5a623",H:"#34d399",V:"#60a5fa",M:"#fbbf24",F:"#e879f9",O:"#4ade80",K:"#f87171",N:"#38bdf8"};

export const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
