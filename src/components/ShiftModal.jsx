import { C, reducedMotion } from "../constants/colors.js";
import { fmt, calcScore } from "../utils/index.js";
import { ScBar, Pill, RivalRace } from "./ui/index.jsx";

export default function ShiftModal({shift,prefs,onClose,onAccept,captured=[]}) {
  if(!shift) return null;
  const res=calcScore(shift,prefs); const sc=res.s; const r=res.r;
  const col=sc>=80?C.em:sc>=50?C.am:C.rd;
  const alreadyCaptured=captured.some(c=>c.id===shift.id);
  return <div role="presentation" style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(2,6,15,0.88)",backdropFilter:"blur(14px)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={shift.hospital} onClick={e=>e.stopPropagation()} style={{background:"rgba(7,14,29,0.99)",backdropFilter:"blur(24px)",border:"1px solid "+col+"44",borderRadius:22,width:"100%",maxWidth:420,padding:22,boxShadow:"0 0 80px "+col+"12,0 30px 80px rgba(0,0,0,.9)",animation:reducedMotion?"none":"modalUp .3s cubic-bezier(.4,0,.2,1)",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,"+col+"88,transparent)",borderRadius:"22px 22px 0 0"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:C.tx0,letterSpacing:"-.4px"}}>{shift.hospital}</div>
          <div style={{fontSize:11,color:C.tx2,marginTop:2}}>{shift.group}</div>
        </div>
        <button onClick={onClose} aria-label="Fechar" style={{background:C.bd,border:"1px solid "+C.bd,color:C.tx1,width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        {[["💰","Valor","R$ "+fmt(shift.val)],["⏰","Duração",shift.hours],["📅","Data",shift.date],["📍","Distância",shift.dist+" km"],["🩺","Especialidade",shift.spec],["📌","Local",shift.loc]].map(([ic,lb,v])=>(
          <div key={lb} style={{background:"rgba(255,255,255,0.04)",border:"1px solid "+C.bd,borderRadius:11,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:C.tx2,marginBottom:2}}>{ic} {lb}</div>
            <div style={{fontSize:12,fontWeight:700,color:C.tx0}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid "+C.bd,borderRadius:13,padding:13,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <span style={{fontSize:12,fontWeight:700,color:C.tx1}}>Compatibilidade</span>
          <span style={{fontSize:24,fontWeight:800,color:col,fontFamily:"monospace"}}>{sc}%</span>
        </div>
        <ScBar sc={sc} h={6}/>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
          {r.map((x,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:11,color:x.ok?C.em:C.rd}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:x.ok?C.em:C.rd,flexShrink:0,boxShadow:"0 0 5px "+(x.ok?C.em:C.rd)}}/>
            {x.l}
          </div>)}
        </div>
      </div>
      {shift.rivals&&<RivalRace shift={shift} won={sc>=60}/>}
      <div style={{background:"rgba(0,0,0,.5)",borderRadius:10,padding:"9px 11px",margin:"12px 0",fontFamily:"monospace",fontSize:10,color:C.tx2,whiteSpace:"pre-wrap",maxHeight:80,overflowY:"auto",lineHeight:1.7,borderLeft:"2px solid "+C.bd}}>{shift.rawMsg}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <button onClick={onClose} style={{padding:"11px",background:C.bd,border:"1px solid "+C.bd,borderRadius:12,color:C.tx1,fontWeight:700,cursor:"pointer",fontSize:13}}>Fechar</button>
        {alreadyCaptured
          ?<button disabled style={{padding:"11px",background:C.emB,border:"1px solid "+C.em+"44",borderRadius:12,color:C.em,fontWeight:800,fontSize:13,cursor:"default"}}>✓ Já Capturado</button>
          :<button onClick={()=>{onAccept&&onAccept(shift);onClose();}} style={{padding:"11px",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",border:"none",borderRadius:12,color:"#021810",fontWeight:800,cursor:"pointer",fontSize:13,boxShadow:"0 4px 20px "+C.emA}}>✓ Aceitar</button>
        }
      </div>
    </div>
  </div>;
}
