import { useState, useRef } from "react";
import { C } from "../constants/colors.js";
import { fmt, calcScore } from "../utils/index.js";
import { GlassCard, Pill, ScBar } from "./ui/index.jsx";

export default function SwipeCard({shift,prefs,onAccept,onReject,index,total}) {
  const res=calcScore(shift,prefs); const sc=res.s;
  const col=sc>=80?C.em:sc>=50?C.am:C.rd;
  const [drag,setDrag]=useState(0);
  const [dragging,setDragging]=useState(false);
  const startX=useRef(null);
  const handleStart=(e)=>{startX.current=e.touches?e.touches[0].clientX:e.clientX;setDragging(true);};
  const handleMove=(e)=>{if(startX.current===null) return;const x=(e.touches?e.touches[0].clientX:e.clientX)-startX.current;setDrag(x);};
  const handleEnd=()=>{
    setDragging(false);
    if(drag>80) onAccept();
    else if(drag<-80) onReject();
    else setDrag(0);
    startX.current=null;
  };
  const rot=drag/20;
  return (
    <div style={{position:"relative",width:"100%",marginBottom:12}}>
      <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1,marginBottom:10,textAlign:"center"}}>{index+1} DE {total} PENDENTES</div>
      <div onMouseDown={handleStart} onMouseMove={dragging?handleMove:null} onMouseUp={handleEnd} onMouseLeave={dragging?handleEnd:null} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        style={{transform:"translateX("+drag+"px) rotate("+rot+"deg)",transition:dragging?"none":"transform .4s cubic-bezier(.4,0,.2,1)",cursor:"grab",userSelect:"none",touchAction:"pan-y"}}>
        <GlassCard glow={sc>=80} style={{borderColor:drag>30?C.em+"66":drag<-30?C.rd+"66":col+"33"}}>
          {drag>30&&<div style={{position:"absolute",top:16,left:16,background:C.em+"22",border:"2px solid "+C.em,borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:800,color:C.em,transform:"rotate(-12deg)"}}>ACEITAR ✓</div>}
          {drag<-30&&<div style={{position:"absolute",top:16,right:16,background:C.rd+"22",border:"2px solid "+C.rd,borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:800,color:C.rd,transform:"rotate(12deg)"}}>RECUSAR ✗</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.tx0,letterSpacing:"-.3px"}}>{shift.hospital}</div>
              <div style={{fontSize:11,color:C.tx2,marginTop:2}}>{shift.group}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:800,color:col,fontFamily:"monospace"}}>R$ {fmt(shift.val)}</div>
              <Pill sc={sc}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
            {[["📅",shift.date],["⏰",shift.hours],["📍",shift.dist+"km"],["🩺",shift.spec]].map(([ic,v])=>(
              <div key={v} style={{background:"rgba(255,255,255,0.04)",borderRadius:9,padding:"8px 10px",fontSize:11,color:C.tx1}}>{ic} {v}</div>
            ))}
          </div>
          <ScBar sc={sc} h={5}/>
          <div style={{marginTop:14,fontSize:11,color:C.tx2,textAlign:"center"}}>← Arraste para recusar  ·  Aceitar para aceitar →</div>
        </GlassCard>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
        <button onClick={onReject} style={{padding:"12px",background:C.rdA,border:"1px solid "+C.rd+"44",borderRadius:14,color:C.rd,fontWeight:800,cursor:"pointer",fontSize:14,transition:"all .2s"}}>✗ Recusar</button>
        <button onClick={onAccept} style={{padding:"12px",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",border:"none",borderRadius:14,color:"#021810",fontWeight:800,cursor:"pointer",fontSize:14,boxShadow:"0 4px 20px "+C.emA}}>✓ Aceitar</button>
      </div>
    </div>
  );
}
