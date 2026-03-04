import { C } from "../../constants/colors.js";
import { DAYS, SPECS, MONTHLY } from "../../data/mockData.js";
import { fmt } from "../../utils/index.js";
import { Badge, Button, Card, PageHeader, Toggle } from "../ui/index.jsx";
import { S } from "../../styles/index.js";

export default function SettingsTab({
  uiV2,
  groups,
  setGroups,
  prefs,
  setPrefs,
  name,
  actG,
  setScreen,
  setObStep,
  setCaptured,
  setMonthly,
  setRejected,
  toast,
}) {
  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? <PageHeader title="Configuracoes" subtitle="Preferencias operacionais, filtros e perfil" action={<Badge tone="info">{actG.length} grupos ativos</Badge>} /> : null}

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Grupos monitorados</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "9px 11px",
                background: C.surface2,
              }}
            >
              <span style={{ fontSize: 18 }}>{group.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{group.name}</div>
                <div style={{ marginTop: 1, fontSize: 11, color: C.text2 }}>{group.members} membros</div>
              </div>
              <Toggle
                on={group.active}
                onChange={() => setGroups((previous) => previous.map((item) => (item.id === group.id ? { ...item, active: !item.active } : item)))}
                label={`${group.active ? "Desativar" : "Ativar"} ${group.name}`}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 10, fontSize: 12, color: C.text2, fontWeight: 700 }}>Filtros</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <label htmlFor="sliderMinVal" style={S.lbl}>
              Valor minimo
            </label>
            <span className="pb-mono" style={{ color: C.success, fontWeight: 700 }}>
              R$ {fmt(prefs.minVal)}
            </span>
          </div>
          <input
            id="sliderMinVal"
            type="range"
            min={500}
            max={5000}
            step={100}
            value={prefs.minVal}
            style={S.range}
            onChange={(event) => setPrefs((previous) => ({ ...previous, minVal: Number(event.target.value) }))}
            aria-valuetext={`R$ ${fmt(prefs.minVal)}`}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <label htmlFor="sliderMaxDist" style={S.lbl}>
              Distancia maxima
            </label>
            <span className="pb-mono" style={{ color: C.info, fontWeight: 700 }}>
              {prefs.maxDist} km
            </span>
          </div>
          <input
            id="sliderMaxDist"
            type="range"
            min={1}
            max={100}
            step={1}
            value={prefs.maxDist}
            style={S.range}
            onChange={(event) => setPrefs((previous) => ({ ...previous, maxDist: Number(event.target.value) }))}
            aria-valuetext={`${prefs.maxDist} km`}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={S.lbl}>Dias disponiveis</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {DAYS.map((day) => {
              const enabled = prefs.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setPrefs((previous) => ({
                      ...previous,
                      days: enabled ? previous.days.filter((item) => item !== day) : [...previous.days, day],
                    }))
                  }
                  style={{
                    padding: "6px 10px",
                    borderRadius: 9,
                    border: `1px solid ${enabled ? C.primary : C.border}`,
                    background: enabled ? C.primarySoft : "#fff",
                    color: enabled ? C.primary : C.text2,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={S.lbl}>Especialidades</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            {SPECS.map((specialty) => {
              const enabled = prefs.specs.includes(specialty);
              return (
                <button
                  key={specialty}
                  type="button"
                  onClick={() =>
                    setPrefs((previous) => ({
                      ...previous,
                      specs: enabled
                        ? previous.specs.filter((item) => item !== specialty)
                        : [...previous.specs, specialty],
                    }))
                  }
                  style={{
                    padding: "5px 11px",
                    borderRadius: 9,
                    border: `1px solid ${enabled ? C.info : C.border}`,
                    background: enabled ? C.infoSoft : "#fff",
                    color: enabled ? C.info : C.text2,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {specialty}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 10 }}>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Modo de aceite</div>
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          {[
            { value: true, title: "Automatico", description: "Captura imediata sem confirmacao" },
            { value: false, title: "Manual (swipe)", description: "Voce decide cada oportunidade" },
          ].map((option) => {
            const active = prefs.auto === option.value;
            return (
              <button
                key={option.title}
                type="button"
                onClick={() => setPrefs((previous) => ({ ...previous, auto: option.value }))}
                style={{
                  border: `1px solid ${active ? C.primary : C.border}`,
                  borderRadius: 10,
                  background: active ? C.primarySoft : "#fff",
                  color: active ? C.primary : C.text1,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{option.title}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: C.text2 }}>{option.description}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Perfil</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{name || "Dr(a). Medico"}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: C.text2 }}>Plataforma ativa em {actG.length} grupos</div>
          </div>
          <Button type="button" variant="secondary" onClick={() => { setScreen("onboard"); setObStep(0); }}>
            Editar
          </Button>
        </div>

        <Button
          type="button"
          variant="danger"
          onClick={() => {
            if (
              window.confirm(
                "Limpar todo o historico de plantoes capturados? Esta acao nao pode ser desfeita.",
              )
            ) {
              setCaptured([]);
              setMonthly(MONTHLY);
              setRejected([]);
              toast("Historico limpo", "Plantoes capturados foram removidos.", "info", "manual");
            }
          }}
        >
          Limpar historico de plantoes
        </Button>
      </Card>
    </div>
  );
}
