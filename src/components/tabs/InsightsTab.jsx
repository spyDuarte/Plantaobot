import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { Badge, Card, PageHeader } from "../ui/index.jsx";
import InsightsPanel from "../InsightsPanel.jsx";

export default function InsightsTab({ uiV2, captured, rejected, prefs, monthly, projM }) {
  const totalYear = projM * 12;
  const monthlyTotal = monthly.reduce((sum, entry) => sum + entry.v, 0);

  return (
    <div style={{ animation: "fadeUp .25s both" }}>
      {uiV2 ? (
        <PageHeader
          title="Insights financeiros"
          subtitle="Analise de performance e projecoes operacionais"
          action={<Badge tone="primary">Atualizado agora</Badge>}
        />
      ) : null}

      <InsightsPanel captured={captured} rejected={rejected} prefs={prefs} uiV2={uiV2} />

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>Historico mensal</div>
        <div className="pb-mono" style={{ fontSize: 27, fontWeight: 700, color: C.primary, marginBottom: 10 }}>
          R$ {fmt(monthlyTotal)}
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={monthly} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="insightFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.primary} stopOpacity={0.34} />
                <stop offset="95%" stopColor={C.primary} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 16px rgba(16, 36, 59, 0.12)",
              }}
              formatter={(value) => [`R$ ${fmt(value)}`]}
            />
            <Area type="monotone" dataKey="v" stroke={C.primary} strokeWidth={2.4} fill="url(#insightFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginTop: 12, background: C.primarySoft, borderColor: "rgba(11,95,255,0.28)" }}>
        <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>Projecao anual</div>
        <div className="pb-mono" style={{ fontSize: 31, fontWeight: 700, color: C.primary }}>
          R$ {fmt(totalYear)}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: C.text1 }}>
          Aproximadamente R$ {fmt(projM)} por mes com {prefs.specs.length} especialidades ativas.
        </div>
      </Card>
    </div>
  );
}
