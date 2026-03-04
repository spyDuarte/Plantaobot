import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { GlassCard } from "../ui/index.jsx";
import InsightsPanel from "../InsightsPanel.jsx";

export default function InsightsTab({captured,rejected,prefs,monthly,projM}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
      <InsightsPanel captured={captured} rejected={rejected} prefs={prefs}/>
      <GlassCard style={{marginTop:14}}>
        <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>HISTÓRICO MENSAL</div>
        <div style={{fontSize:26,fontWeight:800,fontFamily:"monospace",background:"linear-gradient(90deg,"+C.em+","+C.cy+")",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:14}}>R$ {fmt(monthly.reduce((a,m)=>a+m.v,0))}</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={monthly} margin={{top:5,right:0,left:0,bottom:0}}>
            <defs><linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.em} stopOpacity={0.3}/><stop offset="95%" stopColor={C.em} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="m" tick={{fill:C.tx2,fontSize:10,fontFamily:"monospace"}} axisLine={false} tickLine={false}/>
            <YAxis hide/><Tooltip contentStyle={{background:"rgba(7,14,29,0.97)",backdropFilter:"blur(20px)",border:"1px solid "+C.bd,borderRadius:10,fontSize:11,fontFamily:"monospace"}} formatter={v=>["R$ "+fmt(v)]}/>
            <Area type="monotone" dataKey="v" stroke={C.em} strokeWidth={2.5} fill="url(#gEm)"/>
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard style={{marginTop:12,background:"linear-gradient(135deg,"+C.cyB+","+C.emB+")",border:"1px solid "+C.cy+"22"}}>
        <div style={{fontSize:10,color:C.cy,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>PROJEÇÃO ANUAL</div>
        <div style={{fontSize:30,fontWeight:800,fontFamily:"monospace",color:C.cy,marginBottom:3}}>R$ {fmt(projM*12)}</div>
        <div style={{fontSize:11,color:C.tx2,marginBottom:14}}>≈ R$ {fmt(projM)}/mês com {prefs.specs.length} especialidades</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{l:"Tempo livre",v:"~40h/mês",c:C.pu},{l:"Plantões/mês",v:"6–8",c:C.am},{l:"Taxa sucesso",v:"94%",c:C.em}].map(m=>(
            <div key={m.l} style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:800,color:m.c,fontFamily:"monospace"}}>{m.v}</div>
              <div style={{fontSize:9,color:C.tx2,marginTop:3,lineHeight:1.4}}>{m.l}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
