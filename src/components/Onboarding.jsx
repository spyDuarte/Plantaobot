import { useState } from 'react';
import { C, reducedMotion } from '../constants/colors.js';
import { DAYS, SPECS } from '../data/mockData.js';
import { fmt } from '../utils/index.js';
import { BgOrbs } from './ui/index.jsx';
import { S, CSS } from '../styles/index.js';

const NAME_MIN = 2;
const NAME_MAX = 60;

function sanitizeName(value) {
  return String(value)
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, NAME_MAX);
}

export default function Onboarding({
  obStep,
  setObStep,
  name,
  setName,
  prefs,
  setPrefs,
  projM,
  onDone,
}) {
  const [nameError, setNameError] = useState('');

  const ob = [
    {
      icon: '🤖',
      title: 'PlantãoBot v5',
      sub: 'Automação de plantões com IA integrada',
      body: (
        <div>
          <label style={S.lbl}>Seu nome</label>
          <input
            value={name}
            onChange={(e) => {
              const v = sanitizeName(e.target.value);
              setName(v);
              if (v.trim().length >= NAME_MIN) setNameError('');
            }}
            maxLength={NAME_MAX}
            placeholder="Dr(a). Seu Nome"
            style={{ ...S.inp, borderColor: nameError ? '#f87171' : undefined }}
            autoFocus
            aria-describedby={nameError ? 'ob-name-err' : undefined}
          />
          {nameError && (
            <div
              id="ob-name-err"
              role="alert"
              style={{ marginTop: 5, fontSize: 11, color: '#f87171' }}
            >
              {nameError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {[
              ['🔍', 'Monitoramento 24/7', 'Lê WhatsApp enquanto você trabalha ou dorme'],
              ['⚡', '0.8s de resposta', 'Impossível para humanos, fácil para o bot'],
              ['🤖', 'IA integrada', 'Assistente Claude analisa e aconselha em tempo real'],
            ].map(([i, t, d]) => (
              <div
                key={t}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  background: C.emB,
                  border: '1px solid ' + C.em + '18',
                  borderRadius: 12,
                }}
              >
                <span style={{ fontSize: 20, minWidth: 30 }}>{i}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.tx0, marginBottom: 1 }}>
                    {t}
                  </div>
                  <div style={{ fontSize: 11, color: C.tx2, lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: '💰',
      title: 'Filtros financeiros',
      sub: 'O bot só aceita o que vale seu tempo',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={S.lbl}>Valor mínimo</label>
              <span style={{ color: C.em, fontWeight: 800, fontSize: 18, fontFamily: 'monospace' }}>
                R$ {fmt(prefs.minVal)}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={5000}
              step={100}
              value={prefs.minVal}
              style={S.range}
              onChange={(e) => setPrefs((p) => ({ ...p, minVal: +e.target.value }))}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={S.lbl}>Distância máxima</label>
              <span style={{ color: C.cy, fontWeight: 800, fontSize: 18, fontFamily: 'monospace' }}>
                {prefs.maxDist} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={prefs.maxDist}
              style={S.range}
              onChange={(e) => setPrefs((p) => ({ ...p, maxDist: +e.target.value }))}
            />
          </div>
          <div
            style={{
              background: 'linear-gradient(135deg,' + C.emB + ',' + C.cyB + ')',
              border: '1px solid ' + C.em + '22',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.tx2,
                fontWeight: 700,
                letterSpacing: 0.8,
                marginBottom: 4,
              }}
            >
              💡 PROJEÇÃO MENSAL
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.em, fontFamily: 'monospace' }}>
              R$ {fmt(projM)}
            </div>
            <div style={{ fontSize: 11, color: C.tx2, marginTop: 2 }}>
              estimativa com seus filtros atuais
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '📅',
      title: 'Disponibilidade',
      sub: 'Quando e o que você aceita',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={S.lbl}>Dias disponíveis</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7,1fr)',
                gap: 4,
                marginTop: 8,
              }}
            >
              {DAYS.map((d) => {
                const on = prefs.days.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        days: on ? p.days.filter((x) => x !== d) : [...p.days, d],
                      }))
                    }
                    style={{
                      padding: '10px 0',
                      borderRadius: 10,
                      border: '1px solid ' + (on ? C.em + '55' : C.bd),
                      background: on ? C.emA : 'rgba(255,255,255,0.03)',
                      color: on ? C.em : C.tx2,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      boxShadow: on ? '0 0 12px ' + C.emA : '',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={S.lbl}>Especialidades</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {SPECS.map((s) => {
                const on = prefs.specs.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        specs: on ? p.specs.filter((x) => x !== s) : [...p.specs, s],
                      }))
                    }
                    style={{
                      padding: '6px 13px',
                      borderRadius: 20,
                      border: '1px solid ' + (on ? C.cy + '55' : C.bd),
                      background: on ? C.cyA : 'rgba(255,255,255,0.03)',
                      color: on ? C.cy : C.tx2,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '⚡',
      title: 'Modo de operação',
      sub: 'Velocidade total vs. controle manual',
      body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              v: true,
              i: '⚡',
              t: 'Aceite automático',
              d: 'Bot responde em 0.8s sem precisar de você. Máxima vantagem.',
              c: C.em,
            },
            {
              v: false,
              i: '🃏',
              t: 'Modo swipe',
              d: 'Bot avisa e você decide deslizando os cards. Mais controle.',
              c: C.cy,
            },
          ].map((o) => (
            <button
              type="button"
              key={o.t}
              onClick={() => setPrefs((p) => ({ ...p, auto: o.v }))}
              style={{
                background: prefs.auto === o.v ? o.c + '08' : 'rgba(255,255,255,0.02)',
                border: '2px solid ' + (prefs.auto === o.v ? o.c + '44' : C.bd),
                borderRadius: 16,
                padding: '16px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <span style={{ fontSize: 22 }}>{o.i}</span>
                <span
                  style={{ fontSize: 14, fontWeight: 800, color: prefs.auto === o.v ? o.c : C.tx1 }}
                >
                  {o.t}
                </span>
                {prefs.auto === o.v && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 10,
                      color: o.c,
                      fontWeight: 700,
                      background: o.c + '18',
                      padding: '2px 8px',
                      borderRadius: 100,
                    }}
                  >
                    ATIVO
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.tx2, lineHeight: 1.5, paddingLeft: 32 }}>
                {o.d}
              </div>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        fontFamily: "'Plus Jakarta Sans','Outfit',sans-serif",
        background: C.bg0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{CSS}</style>
      <BgOrbs />
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 30 }}>
          {ob.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === obStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i <= obStep ? C.em : C.bd,
                transition: 'all .3s cubic-bezier(.4,0,.2,1)',
                boxShadow: i === obStep ? '0 0 12px ' + C.emG : '',
              }}
            />
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (obStep === 0 && name.trim().length < NAME_MIN) {
              setNameError(`Informe seu nome (mínimo ${NAME_MIN} caracteres).`);
              return;
            }
            setNameError('');
            obStep < ob.length - 1 ? setObStep((p) => p + 1) : onDone();
          }}
          style={{
            background: 'rgba(7,14,29,0.88)',
            backdropFilter: 'blur(28px)',
            border: '1px solid ' + C.bd,
            borderRadius: 24,
            padding: 28,
            boxShadow: '0 30px 80px rgba(0,0,0,.8)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg,transparent,' + C.em + '66,transparent)',
            }}
          />
          <div style={{ fontSize: 42, marginBottom: 12, lineHeight: 1 }} aria-hidden="true">
            {ob[obStep].icon}
          </div>
          <div
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: C.tx0,
              letterSpacing: '-.6px',
              marginBottom: 5,
            }}
          >
            {ob[obStep].title}
          </div>
          <div style={{ fontSize: 13, color: C.tx2, marginBottom: 24, lineHeight: 1.5 }}>
            {ob[obStep].sub}
          </div>
          <div
            key={obStep}
            style={{ animation: reducedMotion ? 'none' : 'fadeUp .3s cubic-bezier(.4,0,.2,1)' }}
          >
            {ob[obStep].body}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            {obStep > 0 && (
              <button
                type="button"
                onClick={() => setObStep((p) => p - 1)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: C.bd,
                  border: '1px solid ' + C.bd,
                  borderRadius: 13,
                  color: C.tx1,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ← Voltar
              </button>
            )}
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '13px',
                background: 'linear-gradient(135deg,' + C.em + ',' + C.cy + ')',
                border: 'none',
                borderRadius: 13,
                color: '#021810',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: 14,
                boxShadow: '0 4px 24px ' + C.emA,
              }}
            >
              {obStep < ob.length - 1 ? 'Continuar →' : '🚀 Começar'}
            </button>
          </div>
        </form>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: C.tx2 }}>
          {obStep + 1} de {ob.length}
        </div>
      </div>
    </div>
  );
}
