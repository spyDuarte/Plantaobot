import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { GlassCard, Counter, Waveform } from "../ui/index.jsx";

export default function Dashboard({setTab,botOn,startBot,stopBot,captured,rejected,pending,actG,total,prefs,typing,setModal}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:4}}>TOTAL GARANTIDO</div>
        <div style={{fontSize:40,fontWeight:800,letterSpacing:"-2px",lineHeight:1,background:"linear-gradient(90deg,"+C.em+","+C.cy+")",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          <Counter value={total} prefix="R$ "/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9,marginBottom:14}}>
        {[{l:"Analisados",v:captured.length+rejected.length,c:C.cy,i:"🔍"},{l:"Capturados",v:captured.length,c:C.em,i:"✅"},{l:"Pendentes",v:pending.length,c:C.am,i:"🃏"},{l:"Recusados",v:rejected.length,c:C.rd,i:"✗"}].map(s=>(
          <GlassCard key={s.l} style={{padding:"14px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:s.c+"18",border:"1px solid "+s.c+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.i}</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"monospace",lineHeight:1}}><Counter value={s.v} color={s.c}/></div>
              <div style={{fontSize:10,color:C.tx2,marginTop:2,fontWeight:700,letterSpacing:.2}}>{s.l}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard glow={botOn} style={{marginBottom:12,transition:"all .4s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              {botOn?<Waveform active/>:<div style={{width:8,height:8,borderRadius:"50%",background:C.bd}}/>}
              <div style={{fontSize:14,fontWeight:800,color:C.tx0}}>Monitoramento WhatsApp</div>
            </div>
            <div style={{fontSize:11,color:C.tx2,marginLeft:botOn?20:16,marginBottom:botOn?12:0}}>
              {botOn?"Escaneando "+actG.length+" grupos · modo "+(prefs.auto?"automático":"swipe"):actG.length+" grupos prontos · clique em Iniciar"}
            </div>
            {botOn&&actG.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:8,background:C.emB,border:"1px solid "+C.em+"18",borderRadius:9,padding:"6px 11px",marginBottom:5}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.em,animation:"dotP 2s infinite"}}/>
                <span style={{fontSize:11,color:C.tx1,flex:1}}>{g.emoji} {g.name}</span>
                {typing===g.name?<span style={{fontSize:9,color:C.cy,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>digitando {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:C.cy,animation:"bounce .7s "+(i*.15)+"s infinite"}}/>)}</span>:<span style={{fontSize:9,color:C.em,fontWeight:800}}>●</span>}
              </div>
            ))}
          </div>
          <div style={{fontSize:30,marginLeft:14,animation:botOn?"float 3s ease-in-out infinite":""}}>{botOn?"🤖":"😴"}</div>
        </div>
      </GlassCard>

      <GlassCard style={{marginBottom:12}}>
        <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:14}}>COMO FUNCIONA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {[["💬","1. Detecta","NLP identifica ofertas de plantão em tempo real"],["🧠","2. Analisa","Compara valor, distância, especialidade, dia"],["⚡","3. Responde","0.8s — antes de qualquer outro médico"],["🤖","4. IA advisa","Claude analisa seu perfil e sugere estratégias"]].map(([ic,t,d])=>(
            <div key={t} style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+C.bd,borderRadius:11,padding:"12px 13px"}}>
              <div style={{fontSize:18,marginBottom:6}}>{ic}</div>
              <div style={{fontSize:12,fontWeight:700,color:C.tx0,marginBottom:2}}>{t}</div>
              <div style={{fontSize:11,color:C.tx2,lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {captured.length>0&&<GlassCard style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2}}>ÚLTIMOS CAPTURADOS</div>
          <button onClick={()=>setTab(prefs.auto?"captured":"swipe")} style={{fontSize:11,color:C.cy,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>ver todos →</button>
        </div>
        {captured.slice(-3).reverse().map(s=>(
          <div key={s.id} onClick={()=>setModal(s)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.emB,border:"1px solid "+C.em+"22",borderRadius:11,padding:"10px 13px",marginBottom:6,cursor:"pointer"}}>
            <div><div style={{fontSize:13,fontWeight:700,color:C.tx0}}>{s.hospital}</div><div style={{fontSize:10,color:C.tx2,marginTop:1}}>{s.date} · {s.spec}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:800,color:C.em,fontFamily:"monospace"}}>R$ {fmt(s.val)}</div><div style={{fontSize:9,color:C.tx2}}>{s.capturedAt}</div></div>
          </div>
        ))}
      </GlassCard>}

      <button onClick={botOn?stopBot:startBot}
        style={{width:"100%",padding:"14px",background:botOn?C.rdA:"linear-gradient(135deg,"+C.em+","+C.cy+")",border:"1px solid "+(botOn?C.rd+"44":"transparent"),borderRadius:16,color:botOn?C.rd:"#021810",fontSize:14,fontWeight:800,cursor:"pointer",letterSpacing:.2,boxShadow:botOn?"":("0 6px 28px "+C.emA)}}>
        {botOn?"⏹ Parar simulação":"▶ Simular bot ao vivo (30s)"}
      </button>
      <div style={{textAlign:"center",fontSize:10,color:C.tx2,marginTop:6}}>7 grupos · 7 ofertas · modo {prefs.auto?"automático":"swipe"}</div>
    </div>
  );
}
