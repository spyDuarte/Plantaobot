import { C } from '../constants/colors.js';
import { fmt, calcScore } from '../utils/index.js';
import { Card, Pill, ScBar } from './ui/index.jsx';

export default function SwipeCard({ shift, prefs, onAccept, onReject, index, total }) {
  const res = calcScore(shift, prefs);
  const sc = res.s;
  const col = sc >= 80 ? C.success : sc >= 50 ? C.warning : C.error;

  return (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          color: C.text2,
          fontWeight: 600,
          letterSpacing: 0.5,
          marginBottom: 12,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {index + 1} DE {total} PENDENTES
      </div>

      <Card
        style={{
          padding: 24,
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
          border: `1px solid ${C.borderStrong}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text0 }}>{shift.hospital}</div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>Origem: {shift.group}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="pb-mono"
              style={{ fontSize: 24, fontWeight: 700, color: col, marginBottom: 4 }}
            >
              R$ {fmt(shift.val)}
            </div>
            <Pill sc={sc} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Data', value: shift.date, icon: '📅' },
            { label: 'Horário', value: shift.hours, icon: '⏰' },
            { label: 'Distância', value: `${shift.dist} km`, icon: '📍' },
            { label: 'Especialidade', value: shift.spec, icon: '🩺' },
          ].map((item, idx) => (
            <div
              key={`${shift.id || 'shift'}-${idx}`}
              style={{
                background: C.surface2,
                borderRadius: 6,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 14 }}>
                {item.icon}
              </span>
              <div>
                <div style={{ fontSize: 11, color: C.text2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text0 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, marginBottom: 8 }}>
            Aderência ao seu perfil
          </div>
          <ScBar sc={sc} h={6} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button
            type="button"
            onClick={onReject}
            style={{
              padding: '14px',
              background: C.surface1,
              border: `1px solid ${C.error}`,
              borderRadius: 8,
              color: C.error,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
              transition: 'all .15s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = C.errorSoft;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = C.surface1;
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>✕</span> Recusar
          </button>

          <button
            type="button"
            onClick={onAccept}
            style={{
              padding: '14px',
              background: C.success,
              border: `1px solid ${C.success}`,
              borderRadius: 8,
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              transition: 'all .15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#047857';
              e.currentTarget.style.borderColor = '#047857';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = C.success;
              e.currentTarget.style.borderColor = C.success;
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>✓</span> Aceitar
          </button>
        </div>
      </Card>
    </div>
  );
}
