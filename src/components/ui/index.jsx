import { useState, useEffect, useRef } from 'react';
import { C, AVC, reducedMotion } from '../../constants/colors.js';
import { fmt } from '../../utils/index.js';
import { Card } from './primitives.jsx';

export function Av({ l, sz = 32 }) {
  const col = AVC[l] || C.textSubtle;
  return (
    <div
      aria-hidden="true"
      style={{
        width: sz,
        height: sz,
        borderRadius: '50%',
        background: C.surfaceMuted,
        border: `1px solid ${col}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: sz * 0.4,
        fontWeight: 600,
        color: col,
        flexShrink: 0,
      }}
    >
      {l}
    </div>
  );
}

export function Pill({ sc }) {
  if (sc >= 80)
    return (
      <span
        style={{
          background: C.successSoft,
          color: C.success,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        Excelente
      </span>
    );
  if (sc >= 50)
    return (
      <span
        style={{
          background: C.warningSoft,
          color: C.warning,
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        Bom
      </span>
    );
  return (
    <span
      style={{
        background: C.errorSoft,
        color: C.error,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      Regular
    </span>
  );
}

export function ScBar({ sc, h = 6 }) {
  const col = sc >= 80 ? C.success : sc >= 50 ? C.warning : C.error;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          flex: 1,
          height: h,
          background: C.border,
          borderRadius: h / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${sc}%`,
            height: '100%',
            background: col,
            borderRadius: h / 2,
            transition: 'width .5s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text1, minWidth: 32 }}>{sc}%</span>
    </div>
  );
}

export function Toggle({ on, onChange, label }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      aria-label={label}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? C.primary : C.borderStrong,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color .2s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: reducedMotion ? 'none' : 'left .2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    </button>
  );
}

export function GlassCard({ children, style = {}, glow = false, onClick, hover = false }) {
  // Substituímos o visual "Glass" por um visual SaaS de Card limpo interativo
  const [hov, setHov] = useState(false);
  const baseStyle = {
    background: C.surface1,
    border: `1px solid ${glow ? C.primarySoft : hov && hover ? C.primary : C.border}`,
    borderRadius: 8,
    padding: 20,
    boxShadow: glow ? `0 0 0 2px ${C.primarySoft}` : '0 1px 3px rgba(15, 23, 42, 0.08)',
    transition: 'all .15s ease',
    textAlign: 'left',
    width: '100%',
    ...style,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
        style={{ ...baseStyle, cursor: 'pointer' }}
      >
        {children}
      </button>
    );
  }

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={baseStyle}>
      {children}
    </div>
  );
}

export function Counter({ value, prefix = '', suffix = '', color = C.text0 }) {
  const [disp, setDisp] = useState(0);
  const ref = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    if (ref.current) clearInterval(ref.current);
    const start = prev.current;
    const diff = value - start;
    const dur = 600;
    const fps = 30;
    const step = diff / ((dur / 1000) * fps);
    let cur = start;

    ref.current = setInterval(() => {
      cur += step;
      if ((step > 0 && cur >= value) || (step < 0 && cur <= value)) {
        setDisp(value);
        prev.current = value;
        clearInterval(ref.current);
      } else {
        const rounded = Math.round(cur);
        setDisp(rounded);
        prev.current = rounded;
      }
    }, 1000 / fps);

    return () => clearInterval(ref.current);
  }, [value]);

  return (
    <span style={{ color, fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
      {prefix}
      {fmt(disp)}
      {suffix}
    </span>
  );
}

export function Confetti({ active }) {
  // Removendo excesso de confete no B2B; se ativo não faz nada para manter limpo
  if (!active) return null;
  return null;
}

export function Toasts({ items }) {
  // Versão V1 simplificada compatível com o ToastViewport
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 8800,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        maxWidth: 320,
      }}
    >
      {items.map((t) => {
        const tone =
          t.type === 'win'
            ? { bg: C.successSoft, border: C.success, color: C.text0 }
            : t.type === 'info'
              ? { bg: C.infoSoft, border: C.info, color: C.text0 }
              : { bg: C.errorSoft, border: C.error, color: C.text0 };
        return (
          <div
            key={t.id}
            role="status"
            style={{
              background: C.surface1,
              borderLeft: `4px solid ${tone.border}`,
              borderRadius: 8,
              padding: '12px 16px',
              boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
              animation: 'toastIn .2s ease-out',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: tone.color, marginBottom: 4 }}>
              {t.title}
            </div>
            <div style={{ fontSize: 13, color: C.text1 }}>{t.body}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Waveform({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 16 }} aria-hidden="true">
      {[1, 0.6, 0.9, 0.5, 0.8, 0.4].map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: active ? `${h * 16}px` : '4px',
            background: active ? C.success : C.borderStrong,
            borderRadius: 2,
            transition: reducedMotion ? 'none' : 'height .2s ease',
            animation:
              active && !reducedMotion ? `wave 1s ${i * 0.1}s ease-in-out infinite alternate` : '',
          }}
        />
      ))}
    </div>
  );
}

export function RivalRace({ shift, won }) {
  return (
    <div
      style={{
        background: C.surfaceMuted,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '12px 16px',
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: C.text2,
          fontWeight: 600,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Competição
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text0, minWidth: 90 }}>
          Você (Bot)
        </div>
        <div
          style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}
        >
          <div
            style={{
              width: won ? '100%' : '22%',
              height: '100%',
              background: C.primary,
              borderRadius: 3,
              transition: 'width .6s ease',
            }}
          />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text1, minWidth: 24 }}>
          {won ? '1º' : '-'}
        </span>
      </div>
      {(shift.rivals || []).slice(0, 2).map((r, i) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div
            style={{
              fontSize: 12,
              color: C.text2,
              minWidth: 90,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {r}
          </div>
          <div
            style={{
              flex: 1,
              height: 6,
              background: C.border,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: won ? `${20 + i * 20}%` : '52%',
                height: '100%',
                background: C.borderStrong,
                borderRadius: 3,
                transition: `width .6s ${i * 0.15}s ease`,
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.text2, minWidth: 24 }}>
            {won ? `${i + 2}º` : '-'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BgOrbs() {
  // Fundo limpo para SaaS, sem orbs espaciais distraindo a leitura.
  return null;
}

export {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
  ToastViewport,
} from './primitives.jsx';
