import { C } from "../constants/colors.js";
import { SPECS } from "../data/mockData.js";
import { fmt } from "../utils/index.js";
import { Card } from "./ui/index.jsx";

export default function InsightsPanel({ captured, rejected, prefs }) {
  const total = captured.reduce((sum, shift) => sum + shift.val, 0);
  const matchRate = captured.length + rejected.length > 0 ? Math.round((captured.length / (captured.length + rejected.length)) * 100) : 0;
  const avgValue = captured.length > 0 ? Math.round(total / captured.length) : 0;

  const bySpec = SPECS.map((specialty) => ({
    specialty,
    count: captured.filter((item) => item.spec === specialty).length,
    total: captured.filter((item) => item.spec === specialty).reduce((sum, item) => sum + item.val, 0),
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.total - a.total);

  const insights = [
    captured.length === 0
      ? { tone: C.info, text: "Inicie o bot para gerar insights com base em capturas reais." }
      : null,
    captured.length > 0
      ? {
          tone: C.success,
          text:
            avgValue > 2500
              ? `Ticket medio atual: R$ ${fmt(avgValue)}. Acima da media esperada.`
              : `Ticket medio atual: R$ ${fmt(avgValue)}. Avalie aumentar o valor minimo para elevar o retorno.`,
        }
      : null,
    matchRate > 0
      ? {
          tone: matchRate > 60 ? C.success : C.warning,
          text:
            matchRate > 60
              ? `Taxa de compatibilidade: ${matchRate}%. Filtros bem calibrados.`
              : `Taxa de compatibilidade: ${matchRate}%. Considere ajustar filtros para melhorar volume.`,
        }
      : null,
    bySpec.length > 0
      ? {
          tone: C.primary,
          text: `Especialidade de maior retorno: ${bySpec[0].specialty} (R$ ${fmt(bySpec[0].total)}).`,
        }
      : null,
    prefs.days.length < 4
      ? { tone: C.warning, text: `Disponibilidade atual em ${prefs.days.length} dias. Mais dias aumentam chances de captura.` }
      : null,
  ].filter(Boolean);

  return (
    <Card>
      <div style={{ marginBottom: 9, fontSize: 12, color: C.text2, fontWeight: 700 }}>Destaques inteligentes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.map((insight, index) => (
          <div
            key={`${insight.text}-${index}`}
            style={{
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              padding: "10px 12px",
              background: "#fff",
              borderLeft: `3px solid ${insight.tone}`,
              fontSize: 12,
              lineHeight: 1.5,
              color: C.text1,
            }}
          >
            {insight.text}
          </div>
        ))}
      </div>

      {bySpec.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: C.text2, marginBottom: 8, fontWeight: 700 }}>Ganhos por especialidade</div>
          {bySpec.map((item, index) => {
            const percentage = bySpec[0].total > 0 ? Math.round((item.total / bySpec[0].total) * 100) : 0;
            return (
              <div key={item.specialty} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: C.text1 }}>{item.specialty}</span>
                  <span className="pb-mono" style={{ color: C.success, fontWeight: 700 }}>
                    R$ {fmt(item.total)}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: C.surface2, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #0b5fff, #2278a6)",
                      transition: `width .45s ${index * 0.05}s ease`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
