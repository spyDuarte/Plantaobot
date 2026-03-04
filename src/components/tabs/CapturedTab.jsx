import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { GlassCard, Pill, ScBar } from "../ui/index.jsx";

export default function CapturedTab({captured,rejected,total,exportCSV,setModal}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px"}}>Plantões Capturados</div>
        {captured.length>0&&<button onClick={exportCSV} aria-label="Exportar plantões como CSV" style={{fontSize:11,color:C.cy,background:C.cyB,border:"1px solid "+C.cy+"33",borderRadius:9,padding:"6px 12px",cursor:"pointer",fontWeight:700}}>⬇ CSV</button>}
      </div>
      {captured.length===0
        ?<GlassCard style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:36,marginBottom:10}}>🎯</div><div style={{fontSize:13,fontWeight:700,color:C.tx1}}>Nenhum plantão ainda</div><div style={{fontSize:11,color:C.tx2,marginTop:3}}>Inicie o bot no Dashboard</div></GlassCard>
        :<>
          <GlassCard glow style={{marginBottom:12,background:"linear-gradient(135deg,"+C.emB+","+C.cyB+")"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>TOTAL GARANTIDO</div><div style={{fontSize:28,fontWeight:800,fontFamily:"monospace",background:"linear-gradient(90deg,"+C.em+","+C.cy+")",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>R$ {fmt(total)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>PLANTÕES</div><div style={{fontSize:28,fontWeight:800,fontFamily:"monospace",color:C.cy}}>{captured.length}</div></div>
            </div>
          </GlassCard>
          {captured.map(s=>(
            <GlassCard key={s.id} onClick={()=>setModal(s)} hover glow style={{marginBottom:9,borderLeft:"3px solid "+C.em,borderRadius:"4px 18px 18px 4px",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div><div style={{fontSize:14,fontWeight:700,color:C.tx0}}>{s.hospital}</div><div style={{fontSize:10,color:C.tx2,marginTop:1}}>{s.group}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:C.em,fontFamily:"monospace"}}>R$ {fmt(s.val)}</div><div style={{fontSize:9,color:C.tx2,fontFamily:"monospace"}}>{s.capturedAt}</div></div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
                {[["📅",s.date],["⏰",s.hours],["📍",s.dist+"km"],["🩺",s.spec]].map(([i,v])=>(
                  <span key={v} style={{fontSize:10,color:C.tx1,background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:6}}>{i} {v}</span>
                ))}
              </div>
              <ScBar sc={s.sc} h={5}/>
            </GlassCard>
          ))}
          {rejected.length>0&&<>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,margin:"18px 0 9px"}}>FORA DO PERFIL — {rejected.length}</div>
            {rejected.map(s=>(
              <GlassCard key={s.id} onClick={()=>setModal(s)} hover style={{marginBottom:7,borderLeft:"3px solid "+C.rd,borderRadius:"4px 14px 14px 4px",opacity:.6,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.tx1}}>{s.hospital}</div>
                  <div style={{color:C.rd,fontWeight:800,fontFamily:"monospace",fontSize:13}}>R$ {fmt(s.val)}</div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[s.date,s.spec,s.dist+"km"].map(v=><span key={v} style={{fontSize:10,color:C.tx2,background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:5}}>{v}</span>)}
                  <Pill sc={s.sc}/>
                </div>
              </GlassCard>
            ))}
          </>}
        </>}
    </div>
  );
}
