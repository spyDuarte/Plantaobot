import { C } from "../constants/colors.js";
import { SPECS } from "../data/mockData.js";
import { fmt } from "../utils/index.js";
import { GlassCard } from "./ui/index.jsx";

export default function InsightsPanel({captured,rejected,prefs}) {
  const total=captured.reduce((a,s)=>a+s.val,0);
  const matchRate=captured.length+rejected.length>0?Math.round(captured.length/(captured.length+rejected.length)*100):0;
  const avgVal=captured.length>0?Math.round(total/captured.length):0;
  const bySpec=SPECS.map(s=>({spec:s,count:captured.filter(x=>x.spec===s).length,total:captured.filter(x=>x.spec===s).reduce((a,x)=>a+x.val,0)})).filter(s=>s.count>0).sort((a,b)=>b.total-a.total);
  const insights=[
    captured.length===0&&{icon:"🎯",text:"Inicie o bot para gerar insights sobre seus plantões",color:C.cy},
    captured.length>0&&avgVal>0&&{icon:"💰",text:"Seu ticket médio por plantão é R$ "+fmt(avgVal)+". "+( avgVal>2500?"Acima da média do mercado!":"Tente aumentar o valor mínimo para otimizar."),color:C.em},
    matchRate>0&&{icon:"📊",text:"Taxa de match atual: "+matchRate+"%. "+(matchRate>60?"Seus filtros estão bem calibrados!":"Considere flexibilizar alguns critérios."),color:matchRate>60?C.em:C.am},
    bySpec.length>0&&{icon:"🏆",text:"Sua especialidade mais lucrativa: "+bySpec[0].spec+" (R$ "+fmt(bySpec[0].total)+")",color:C.pu},
    prefs.days.length<4&&{icon:"📅",text:"Você tem apenas "+prefs.days.length+" dias disponíveis. Mais disponibilidade = mais oportunidades.",color:C.am},
  ].filter(Boolean);

  return (
    <div>
      <div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px",marginBottom:4}}>Insights</div>
      <div style={{fontSize:11,color:C.tx2,marginBottom:16}}>Análise inteligente do seu perfil</div>
      {insights.length===0&&<GlassCard style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:11,color:C.tx2}}>Inicie o bot para ver insights</div></GlassCard>}
      {insights.map((ins,i)=>(
        <GlassCard key={i} style={{marginBottom:10,padding:"14px 16px",animation:"fadeUp .4s "+(i*.08)+"s both"}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:36,height:36,borderRadius:10,background:ins.color+"18",border:"1px solid "+ins.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ins.icon}</div>
            <div style={{fontSize:12,color:C.tx1,lineHeight:1.6}}>{ins.text}</div>
          </div>
        </GlassCard>
      ))}
      {bySpec.length>0&&(
        <GlassCard style={{marginTop:12}}>
          <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:12}}>GANHOS POR ESPECIALIDADE</div>
          {bySpec.map((s,i)=>{
            const pct=bySpec[0].total>0?Math.round(s.total/bySpec[0].total*100):0;
            return <div key={s.spec} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:C.tx1,fontWeight:600}}>{s.spec}</span>
                <span style={{color:C.em,fontWeight:800,fontFamily:"monospace"}}>R$ {fmt(s.total)}</span>
              </div>
              <div style={{height:4,background:C.bd,borderRadius:100}}>
                <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,"+C.em+","+C.cy+")",borderRadius:100,transition:"width .6s "+(i*.1)+"s ease"}}/>
              </div>
            </div>;
          })}
        </GlassCard>
      )}
    </div>
  );
}
