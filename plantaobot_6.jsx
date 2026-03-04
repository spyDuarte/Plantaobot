import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════ */
const C = {
  bg0: "#02060f", bg1: "#070e1d", bg2: "#0c1628",
  em: "#00ff9d", emA: "rgba(0,255,157,0.12)", emB: "rgba(0,255,157,0.06)", emG: "rgba(0,255,157,0.5)",
  cy: "#22d4f5", cyA: "rgba(34,212,245,0.12)", cyB: "rgba(34,212,245,0.06)",
  am: "#f5a623", amA: "rgba(245,166,35,0.15)",
  rd: "#ff4d6d", rdA: "rgba(255,77,109,0.15)",
  pu: "#a78bfa", puA: "rgba(167,139,250,0.12)",
  tx0: "#edf2ff", tx1: "#8da0b8", tx2: "#3a5068",
  bd: "rgba(255,255,255,0.07)", bdH: "rgba(255,255,255,0.12)",
  glass: "rgba(7,14,29,0.8)",
};

const AVC = {P:"#00ff9d",C:"#22d4f5",A:"#f472b6",S:"#a78bfa",U:"#f5a623",H:"#34d399",V:"#60a5fa",M:"#fbbf24",F:"#e879f9",O:"#4ade80",K:"#f87171",N:"#38bdf8"};
const reducedMotion = typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = n => n.toLocaleString("pt-BR");
const nowT = () => new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const SPECS = ["Clínica Geral","Emergência","UTI","Pediatria","Cardiologia","Ortopedia","Neurologia","Psiquiatria"];
const DAYS  = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const SHIFTS = [
  {id:1,group:"Plantões SP Centro",sender:"Dra. Paula",av:"P",hospital:"UPA Consolação",spec:"Emergência",val:1800,date:"Sáb 08/03",day:8,hours:"12h",loc:"Consolação, SP",dist:3.2,delay:2200,rivals:["Dr. Marcos","Dra. Júlia"],rawMsg:"🏥 PLANTÃO DISPONÍVEL\nUPA Consolação - Emergência\n📅 Sáb 08/03 | ⏰ 12h\n💰 R$ 1.800\n📍 Consolação, SP"},
  {id:2,group:"Médicos ABC",sender:"Coord. Regional",av:"C",hospital:"Hospital Regional ABC",spec:"Clínica Geral",val:2200,date:"Dom 09/03",day:9,hours:"24h",loc:"Santo André, SP",dist:18,delay:5000,rivals:["Dr. Felipe"],rawMsg:"🔔 VAGA URGENTE!\nHospital Regional ABC\nClínica Geral | 24h\n💰 R$ 2.200\n📅 Dom 09/03"},
  {id:3,group:"Plantões SP Centro",sender:"Adm. Santa Casa",av:"A",hospital:"Santa Casa SP",spec:"UTI",val:3100,date:"Sex 07/03",day:7,hours:"12h",loc:"Santa Cecília, SP",dist:5.1,delay:7500,rivals:["Dra. Renata","Dr. Paulo"],rawMsg:"Plantão UTI\nSanta Casa SP\nR$ 3.100 | 12h | Sex 07/03"},
  {id:4,group:"Oportunidades SP",sender:"RH Sírio",av:"S",hospital:"Hospital Sírio-Libanês",spec:"Cardiologia",val:4500,date:"Qua 12/03",day:12,hours:"12h",loc:"Bela Vista, SP",dist:2.8,delay:10500,rivals:["Dr. Roberto"],rawMsg:"🌟 PLANTÃO ESPECIAL\nSírio-Libanês | Cardiologia\n12h | R$ 4.500 | Qua 12/03"},
  {id:5,group:"Médicos ABC",sender:"Coord. UPA Mauá",av:"U",hospital:"UPA Mauá",spec:"Pediatria",val:1600,date:"Ter 11/03",day:11,hours:"12h",loc:"Mauá, SP",dist:28,delay:14000,rivals:["Dra. Camila"],rawMsg:"PLANTÃO UPA Mauá\nPediatria | R$ 1.600\nTer 11/03 | 12h"},
  {id:6,group:"Plantões SP Centro",sender:"HC Coord.",av:"H",hospital:"Hospital das Clínicas",spec:"Neurologia",val:3800,date:"Seg 10/03",day:10,hours:"12h",loc:"Cerqueira César, SP",dist:4.0,delay:18000,rivals:["Dr. Leonardo","Dra. Sofia"],rawMsg:"HC São Paulo\nNeurologia | 12h | R$ 3.800\nSeg 10/03"},
  {id:7,group:"Vagas UTI Sul",sender:"Coord. UTI",av:"V",hospital:"Hospital do Servidor",spec:"UTI",val:2900,date:"Dom 09/03",day:9,hours:"24h",loc:"Vila Mariana, SP",dist:6.5,delay:22000,rivals:["Dr. Gustavo"],rawMsg:"Plantão UTI\nH. Servidor Público\nR$ 2.900 | 24h | Dom 09/03"},
];
const NOISE = [
  {id:101,delay:3500,group:"Médicos ABC",sender:"Dr. Marcus",av:"M",text:"Protocolo de sepse atualizado? 🙏"},
  {id:102,delay:6500,group:"Plantões SP Centro",sender:"Dra. Fernanda",av:"F",text:"Bom dia galera! 😊"},
  {id:103,delay:12000,group:"Oportunidades SP",sender:"Adm.",av:"O",text:"Reunião amanhã às 8h cancelada."},
  {id:104,delay:17000,group:"Médicos ABC",sender:"Dr. Kleber",av:"K",text:"Alguém recomenda ATLS em SP? 😅"},
];
const MONTHLY = [{m:"Out",v:9200},{m:"Nov",v:12400},{m:"Dez",v:8800},{m:"Jan",v:15600},{m:"Fev",v:11200},{m:"Mar",v:0}];
const GROUPS  = [{id:1,name:"Plantões SP Centro",members:342,active:true,emoji:"🏥"},{id:2,name:"Médicos ABC Paulista",members:218,active:true,emoji:"👨‍⚕️"},{id:3,name:"Oportunidades Médicas SP",members:567,active:true,emoji:"💼"},{id:4,name:"Vagas UTI Sul SP",members:89,active:false,emoji:"🔬"}];
const CAL = [[null,null,null,null,null,1,2],[3,4,5,6,7,8,9],[10,11,12,13,14,15,16],[17,18,19,20,21,22,23],[24,25,26,27,28,29,30],[31,null,null,null,null,null,null]];

function calcScore(shift, p) {
  let s=0; const r=[];
  const d=shift.date.split(" ")[0];
  if(shift.val>=p.minVal){s+=30;r.push({l:"Valor ✓ R$"+fmt(shift.val),ok:true});}
  else r.push({l:"Abaixo do mínimo R$"+fmt(p.minVal),ok:false});
  if(shift.dist<=p.maxDist){s+=30;r.push({l:"Distância ✓ "+shift.dist+"km",ok:true});}
  else r.push({l:"Muito longe "+shift.dist+"km",ok:false});
  if(p.days.includes(d)){s+=20;r.push({l:"Dia disponível ✓",ok:true});}
  else r.push({l:"Dia bloqueado ("+d+")",ok:false});
  if(p.specs.includes(shift.spec)){s+=20;r.push({l:"Especialidade ✓",ok:true});}
  else r.push({l:"Especialidade diferente",ok:false});
  return {s,r};
}

/* ═══════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════ */
function Av({l,sz=32}) {
  const col=AVC[l]||"#64748b";
  return <div aria-hidden="true" style={{width:sz,height:sz,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"1.5px solid "+col+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.36,fontWeight:800,color:col,flexShrink:0}}>{l}</div>;
}

function Pill({sc}) {
  if(sc>=80) return <span style={{background:C.emA,border:"1px solid "+C.em+"44",color:C.em,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>✓ MATCH</span>;
  if(sc>=50) return <span style={{background:C.amA,border:"1px solid "+C.am+"44",color:C.am,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>≈ PARCIAL</span>;
  return <span style={{background:C.rdA,border:"1px solid "+C.rd+"44",color:C.rd,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>✗ RECUSADO</span>;
}

function ScBar({sc,h=4}) {
  const col=sc>=80?C.em:sc>=50?C.am:C.rd;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:h,background:C.bd,borderRadius:100,overflow:"hidden"}}>
        <div style={{width:sc+"%",height:"100%",background:"linear-gradient(90deg,"+col+","+col+"99)",borderRadius:100,transition:"width .8s cubic-bezier(.4,0,.2,1)",boxShadow:"0 0 8px "+col+"66"}}/>
      </div>
      <span style={{fontSize:10,fontWeight:800,color:col,minWidth:26,fontFamily:"monospace"}}>{sc}%</span>
    </div>
  );
}

function Toggle({on,onChange,label}) {
  return <button onClick={onChange} role="switch" aria-checked={on} aria-label={label} style={{width:42,height:23,borderRadius:12,background:on?"linear-gradient(135deg,"+C.em+","+C.cy+")":C.bd,border:"none",cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0,boxShadow:on?"0 0 14px "+C.emA:""}}>
    <div style={{position:"absolute",top:2.5,left:on?20:2.5,width:18,height:18,borderRadius:"50%",background:"#fff",transition:reducedMotion?"none":"left .3s cubic-bezier(.4,0,.2,1)",boxShadow:"0 1px 6px rgba(0,0,0,.5)"}}/>
  </button>;
}

function GlassCard({children,style={},glow=false,onClick,hover=false}) {
  const [hov,setHov]=useState(false);
  return <div
    onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    onClick={onClick}
    style={{background:C.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid "+(glow?C.em+"55":(hov&&hover)?C.bdH:C.bd),borderRadius:18,padding:18,position:"relative",overflow:"hidden",boxShadow:glow?"0 0 40px "+C.emA+",0 8px 32px rgba(0,0,0,.5)":"0 4px 24px rgba(0,0,0,.4)",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>
    {glow&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,"+C.em+"88,transparent)"}}/>}
    {children}
  </div>;
}

/* Animated counter */
function Counter({value,prefix="",suffix="",color=C.em}) {
  const [disp,setDisp]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    if(ref.current) clearInterval(ref.current);
    const start=disp; const diff=value-start; const dur=800; const fps=40;
    const step=diff/((dur/1000)*fps);
    let cur=start;
    ref.current=setInterval(()=>{
      cur+=step;
      if((step>0&&cur>=value)||(step<0&&cur<=value)){setDisp(value);clearInterval(ref.current);}
      else setDisp(Math.round(cur));
    },1000/fps);
    return ()=>clearInterval(ref.current);
  },[value]);
  return <span style={{color,fontFamily:"'JetBrains Mono',monospace",fontWeight:800}}>{prefix}{fmt(disp)}{suffix}</span>;
}

/* Confetti */
function Confetti({active}) {
  if(!active) return null;
  const cols=[C.em,C.cy,C.pu,C.am,"#f472b6","#60a5fa"];
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:9900,overflow:"hidden"}}>
    {Array.from({length:30},(_,i)=>{
      const col=cols[i%cols.length],sz=Math.random()*8+5;
      return <div key={i} style={{position:"absolute",top:-10,left:Math.random()*100+"%",width:sz,height:sz,background:col,borderRadius:Math.random()>.5?"50%":"3px",animation:"cfFall "+(1.3+Math.random()*1.3)+"s "+(Math.random()*.7)+"s ease-in forwards",boxShadow:"0 0 6px "+col}}/>;
    })}
  </div>;
}

/* Toast */
function Toasts({items}) {
  return <div style={{position:"fixed",top:70,right:14,zIndex:8800,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none",maxWidth:290}}>
    {items.map(t=>{
      const col=t.type==="win"?C.em:t.type==="info"?C.cy:C.rd;
      return <div key={t.id} style={{background:"rgba(7,14,29,0.97)",backdropFilter:"blur(20px)",border:"1px solid "+col+"44",borderRadius:14,padding:"11px 15px",boxShadow:"0 8px 32px rgba(0,0,0,.7),0 0 24px "+col+"18",animation:"toastIn .35s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{fontSize:12,fontWeight:800,color:col,marginBottom:3}}>{t.title}</div>
        <div style={{fontSize:11,color:C.tx1,lineHeight:1.4}}>{t.body}</div>
      </div>;
    })}
  </div>;
}

/* Waveform animation for bot "listening" state */
function Waveform({active}) {
  return <div style={{display:"flex",alignItems:"center",gap:3,height:24}} aria-hidden="true">
    {[1,.6,.9,.5,.8,.4,.7,.5,.9,.6,1,.7].map((h,i)=>(
      <div key={i} style={{width:3,height:active?(h*20)+"px":"3px",background:active?"linear-gradient(180deg,"+C.em+","+C.cy+")":C.bd,borderRadius:2,transition:reducedMotion?"none":"height .15s ease",animation:active&&!reducedMotion?"wave .8s "+(i*.07)+"s ease-in-out infinite alternate":""}}/>
    ))}
  </div>;
}

/* Rival race */
function RivalRace({shift,won}) {
  return <div style={{background:"rgba(0,0,0,0.35)",border:"1px solid "+C.bd,borderRadius:12,padding:"12px 14px",marginTop:10}}>
    <div style={{fontSize:9,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:10}}>⚡ CORRIDA PELO PLANTÃO</div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
      <div style={{fontSize:11,fontWeight:700,color:C.em,minWidth:80}}>🤖 PlantãoBot</div>
      <div style={{flex:1,height:6,background:C.bd,borderRadius:100,overflow:"hidden"}}>
        <div style={{width:won?"100%":"22%",height:"100%",background:"linear-gradient(90deg,"+C.em+","+C.cy+")",borderRadius:100,transition:"width .6s ease",boxShadow:"0 0 8px "+C.emG}}/>
      </div>
      <span style={{fontSize:10,fontWeight:800,color:C.em,minWidth:20,fontFamily:"monospace"}}>{won?"1º":"-"}</span>
    </div>
    {(shift.rivals||[]).slice(0,2).map((r,i)=>(
      <div key={r} style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
        <div style={{fontSize:11,color:C.tx1,minWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</div>
        <div style={{flex:1,height:6,background:C.bd,borderRadius:100,overflow:"hidden"}}>
          <div style={{width:won?(20+i*20)+"%":"52%",height:"100%",background:"rgba(255,255,255,0.1)",borderRadius:100,transition:"width .6s "+(i*.15)+"s ease"}}/>
        </div>
        <span style={{fontSize:10,fontWeight:700,color:C.tx2,minWidth:20,fontFamily:"monospace"}}>{won?(i+2)+"º":"-"}</span>
      </div>
    ))}
  </div>;
}

/* Shift modal */
function ShiftModal({shift,prefs,onClose,onAccept,captured=[]}) {
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

/* Notif drawer */
function NotifDrawer({open,notifs,onClose}) {
  return <>
    {open&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:7900,background:"rgba(2,6,15,.6)",backdropFilter:"blur(4px)"}} onClick={onClose}/>}
    <div style={{position:"fixed",top:0,right:0,height:"100vh",width:300,background:"rgba(7,14,29,0.98)",backdropFilter:"blur(24px)",borderLeft:"1px solid "+C.bd,zIndex:8000,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .35s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",boxShadow:"-12px 0 50px rgba(0,0,0,.8)"}}>
      <div style={{padding:"20px 16px 12px",borderBottom:"1px solid "+C.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:14,fontWeight:800,color:C.tx0}}>Notificações</div>
        <button onClick={onClose} aria-label="Fechar notificações" style={{background:C.bd,border:"1px solid "+C.bd,color:C.tx1,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
        {notifs.length===0?<div style={{textAlign:"center",padding:40,color:C.tx2}}><div style={{fontSize:28,marginBottom:8}}>🔔</div><div style={{fontSize:12}}>Nenhuma notificação</div></div>
        :notifs.slice().reverse().map(n=>{
          const col=n.type==="win"?C.em:C.cy;
          return <div key={n.id} style={{background:col+"08",border:"1px solid "+col+"22",borderRadius:11,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:col,marginBottom:2}}>{n.title}</div>
            <div style={{fontSize:11,color:C.tx1,lineHeight:1.4}}>{n.body}</div>
            <div style={{fontSize:10,color:C.tx2,marginTop:4,fontFamily:"monospace"}}>{n.time}</div>
          </div>;
        })}
      </div>
    </div>
  </>;
}

/* Swipe card */
function SwipeCard({shift,prefs,onAccept,onReject,index,total}) {
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
  const rot=drag/20; const opacity=Math.max(0,1-Math.abs(drag)/300);
  return (
    <div style={{position:"relative",width:"100%",marginBottom:12}}>
      <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1,marginBottom:10,textAlign:"center"}}>{index+1} DE {total} PENDENTES</div>
      <div onMouseDown={handleStart} onMouseMove={handleEnd&&dragging?handleMove:null} onMouseUp={handleEnd} onMouseLeave={dragging?handleEnd:null} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        style={{transform:"translateX("+drag+"px) rotate("+rot+"deg)",transition:dragging?"none":"transform .4s cubic-bezier(.4,0,.2,1)",cursor:"grab",userSelect:"none",touchAction:"pan-y"}}>
        <GlassCard glow={sc>=80} style={{borderColor:drag>30?C.em+"66":drag<-30?C.rd+"66":col+"33"}}>
          {/* Swipe hints */}
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

/* AI Chat */
function AIChat({prefs,name,captured,rejected}) {
  const [msgs,setMsgs]=useState([{role:"assistant",content:"Olá Dr(a). "+name+"! Sou seu assistente de plantões. Posso analisar suas oportunidades, sugerir estratégias para maximizar sua renda, ou responder perguntas sobre seus dados. Como posso ajudar? 💊"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);

  useEffect(()=>{if(bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const quickPrompts=[
    "Qual plantão vale mais a pena?",
    "Como maximizar minha renda mensal?",
    "Análise do meu perfil atual",
    "Dicas para conseguir mais plantões",
  ];

  async function send(text) {
    const q=(text||input).trim().slice(0,500); if(!q||loading) return;
    setInput(""); setLoading(true);
    const history=[...msgs,{role:"user",content:q}];
    setMsgs(history);
    const context="Você é um assistente especializado para médicos que usam o PlantãoBot, um app de automação de seleção de plantões. "+
      "Dados do médico: valor mínimo R$"+fmt(prefs.minVal)+", distância máxima "+prefs.maxDist+"km, dias disponíveis: "+prefs.days.join(", ")+", especialidades: "+prefs.specs.join(", ")+". "+
      "Plantões capturados nesta sessão: "+captured.length+" (total R$"+fmt(captured.reduce((a,s)=>a+s.val,0))+"). "+
      "Plantões recusados: "+rejected.length+". "+
      "Seja direto, use emojis médicos ocasionalmente, dê conselhos práticos e financeiros. Responda em português do Brasil. Seja conciso (máx 3 parágrafos).";
    const apiKey=import.meta.env.VITE_ANTHROPIC_API_KEY;
    if(!apiKey){
      setMsgs(p=>[...p,{role:"assistant",content:"⚠️ Chave de API não configurada. Crie um arquivo .env com VITE_ANTHROPIC_API_KEY=sua-chave e reinicie o servidor."}]);
      setLoading(false); return;
    }
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:context,messages:history.map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Desculpe, não consegui responder agora.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    } catch(e) {
      setMsgs(p=>[...p,{role:"assistant",content:"Erro ao conectar com a IA. Tente novamente. 🔌"}]);
    }
    setLoading(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px"}}>Assistente IA</div>
        <div style={{fontSize:11,color:C.tx2,marginTop:2}}>Powered by Claude · Especialista em gestão de plantões</div>
      </div>
      {/* Quick prompts */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {quickPrompts.map(p=>(
          <button key={p} onClick={()=>send(p)} disabled={loading} style={{padding:"6px 12px",background:C.cyB,border:"1px solid "+C.cy+"33",borderRadius:20,color:C.cy,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>
            {p}
          </button>
        ))}
      </div>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:12,paddingRight:4,minHeight:0}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
            {m.role==="assistant"&&<div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🤖</div>}
            <div style={{maxWidth:"78%",background:m.role==="user"?"linear-gradient(135deg,"+C.em+"22,"+C.cy+"18)":C.glass,backdropFilter:"blur(12px)",border:"1px solid "+(m.role==="user"?C.em+"33":C.bd),borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",padding:"10px 13px"}}>
              <div style={{fontSize:12,color:C.tx0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🤖</div>
            <div style={{background:C.glass,border:"1px solid "+C.bd,borderRadius:"4px 16px 16px 16px",padding:"12px 16px",display:"flex",alignItems:"center",gap:4}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.em,animation:"bounce .7s "+(i*.15)+"s infinite"}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {/* Input */}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value.slice(0,500))} maxLength={500} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pergunte sobre seus plantões..." disabled={loading}
          style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid "+(input?C.em+"44":C.bd),borderRadius:12,padding:"11px 14px",color:C.tx0,fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color .2s"}}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()}
          style={{padding:"11px 18px",background:input.trim()&&!loading?"linear-gradient(135deg,"+C.em+","+C.cy+")":C.bd,border:"none",borderRadius:12,color:"#021810",fontWeight:800,cursor:input.trim()&&!loading?"pointer":"default",fontSize:13,transition:"all .2s",flexShrink:0}}>
          {loading?"...":"→"}
        </button>
      </div>
    </div>
  );
}

/* Insights panel */
function InsightsPanel({captured,rejected,prefs}) {
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
      {/* Specialty breakdown */}
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

/* Background orbs */
function BgOrbs() {
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}} aria-hidden="true">
    <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle,rgba(0,255,157,0.055) 0%,transparent 70%)",animation:reducedMotion?"none":"orb1 22s ease-in-out infinite"}}/>
    <div style={{position:"absolute",bottom:"5%",right:"-15%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(34,212,245,0.045) 0%,transparent 70%)",animation:reducedMotion?"none":"orb2 28s ease-in-out infinite"}}/>
    <div style={{position:"absolute",top:"35%",left:"25%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(167,139,250,0.035) 0%,transparent 70%)",animation:reducedMotion?"none":"orb3 35s ease-in-out infinite"}}/>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:"linear-gradient("+C.bd+" 1px,transparent 1px),linear-gradient(90deg,"+C.bd+" 1px,transparent 1px)",backgroundSize:"44px 44px",maskImage:"radial-gradient(ellipse 80% 80% at 50% 40%,black 30%,transparent 100%)"}}/>
  </div>;
}

/* ═══════════════════════════════════════════════════════
   LOCAL STORAGE HOOK
═══════════════════════════════════════════════════════ */
function useLocalStorage(key,initial){
  const[val,setVal]=useState(()=>{
    try{const s=localStorage.getItem(key);return s!==null?JSON.parse(s):initial;}
    catch{return initial;}
  });
  const set=useCallback(v=>{
    setVal(prev=>{
      const next=typeof v==="function"?v(prev):v;
      try{localStorage.setItem(key,JSON.stringify(next));}catch{}
      return next;
    });
  },[key]);
  return[val,set];
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════ */
export default function App() {
  const [screen,setScreen]     = useLocalStorage("pb_screen","onboard");
  const [obStep,setObStep]     = useState(0);
  const [tab,setTab]           = useState("dashboard");
  const [name,setName]         = useLocalStorage("pb_name","");
  const [botOn,setBotOn]       = useState(false);
  const [feed,setFeed]         = useState([]);
  const [typing,setTyping]     = useState(null);
  const [captured,setCaptured] = useLocalStorage("pb_captured",[]);
  const [rejected,setRejected] = useState([]);
  const [pending,setPending]   = useState([]);  // for swipe mode
  const [toasts,setToasts]     = useState([]);
  const [notifs,setNotifs]     = useState([]);
  const [notifOpen,setNotifOpen] = useState(false);
  const [confetti,setConfetti] = useState(false);
  const [modal,setModal]       = useState(null);
  const [groups,setGroups]     = useLocalStorage("pb_groups",GROUPS);
  const [monthly,setMonthly]   = useState(MONTHLY);
  const [prefs,setPrefs]       = useLocalStorage("pb_prefs",{minVal:1500,maxDist:20,days:["Sex","Sáb","Dom"],specs:["Emergência","UTI","Clínica Geral"],auto:true});
  const timers=useRef([]); const feedRef=useRef(null);
  const tid=useRef(0); const nid=useRef(0);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const toast=useCallback((title,body,type="win")=>{
    const id=++tid.current; setToasts(p=>[...p,{id,title,body,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4500);
  },[]);
  const addNotif=useCallback((title,body,type="win")=>{
    setNotifs(p=>[...p,{id:++nid.current,title,body,type,time:nowT()}]);
  },[]);

  useEffect(()=>{if(feedRef.current) feedRef.current.scrollTop=99999;},[feed]);
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  function startBot() {
    setBotOn(true); setFeed([]); setCaptured([]); setRejected([]); setPending([]);
    setMonthly(MONTHLY); clearAllTimers();
    const all=[...SHIFTS.map(s=>({...s,isOffer:true,delay:s.delay})),...NOISE.map(n=>({...n,isOffer:false}))].sort((a,b)=>a.delay-b.delay);
    all.forEach(msg=>{
      const tT=setTimeout(()=>{setTyping(msg.group);setTimeout(()=>setTyping(null),900);},Math.max(0,msg.delay-1000));
      timers.current.push(tT);
      const t1=setTimeout(()=>{
        setFeed(p=>[...p,{...msg,ts:nowT(),state:msg.isOffer?"scanning":"done"}]);
        if(!msg.isOffer) return;
        const t2=setTimeout(()=>{
          const res=calcScore(msg,prefs); const sc=res.s; const ok=sc>=60;
          setFeed(p=>p.map(x=>x.id===msg.id?{...x,state:"done",sc,ok}:x));
          if(prefs.auto) {
            if(ok){
              setCaptured(p=>[...p,{...msg,sc,capturedAt:nowT()}]);
              setMonthly(p=>p.map(x=>x.m==="Mar"?{...x,v:x.v+msg.val}:x));
              toast("✅ Plantão garantido!",msg.hospital+" — R$ "+fmt(msg.val),"win");
              addNotif("✅ Plantão capturado!",msg.hospital+" · "+msg.date+" · R$ "+fmt(msg.val),"win");
              if(msg.val>=3000){setConfetti(true);setTimeout(()=>setConfetti(false),2500);}
            } else {
              setRejected(p=>[...p,{...msg,sc}]);
              addNotif("ℹ️ Vaga descartada",msg.hospital+" — score "+sc+"%","info");
            }
          } else {
            if(ok) setPending(p=>[...p,{...msg,sc}]);
            else setRejected(p=>[...p,{...msg,sc}]);
          }
        },1700); timers.current.push(t2);
      },msg.delay); timers.current.push(t1);
    });
    timers.current.push(setTimeout(()=>setBotOn(false),30000));
  }
  function stopBot(){setBotOn(false);setTyping(null);clearAllTimers();}

  function acceptPending(shift){
    setPending(p=>p.filter(x=>x.id!==shift.id));
    setCaptured(p=>[...p,{...shift,capturedAt:nowT()}]);
    setMonthly(p=>p.map(x=>x.m==="Mar"?{...x,v:x.v+shift.val}:x));
    toast("✅ Aceito!",shift.hospital+" — R$ "+fmt(shift.val),"win");
    if(shift.val>=3000){setConfetti(true);setTimeout(()=>setConfetti(false),2500);}
  }
  function rejectPending(shift){
    setPending(p=>p.filter(x=>x.id!==shift.id));
    setRejected(p=>[...p,shift]);
  }
  function exportCSV(){
    const header=["Hospital","Grupo","Especialidade","Valor (R$)","Data","Duração","Distância (km)","Score (%)","Capturado às"];
    const rows=captured.map(s=>[s.hospital,s.group,s.spec,s.val,s.date,s.hours,s.dist,s.sc||"",s.capturedAt||""]);
    const csv=[header,...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="plantoes_capturados.csv"; a.click();
    URL.revokeObjectURL(url);
  }
  function acceptFromModal(shift){
    if(captured.some(c=>c.id===shift.id)) return;
    setCaptured(p=>[...p,{...shift,capturedAt:nowT()}]);
    setMonthly(p=>p.map(x=>x.m==="Mar"?{...x,v:x.v+shift.val}:x));
    setPending(p=>p.filter(x=>x.id!==shift.id));
    if(shift.val>=3000){setConfetti(true);setTimeout(()=>setConfetti(false),2500);}
    toast("✅ Plantão aceito!",shift.hospital+" — R$ "+fmt(shift.val),"win");
    addNotif("✅ Plantão capturado!",shift.hospital+" · "+shift.date+" · R$ "+fmt(shift.val),"win");
  }

  const total=useMemo(()=>captured.reduce((a,s)=>a+s.val,0),[captured]);
  const actG=useMemo(()=>groups.filter(g=>g.active),[groups]);
  const projM=useMemo(()=>prefs.minVal<=2000?18400:prefs.minVal<=3000?14200:9800,[prefs.minVal]);

  /* ONBOARDING */
  const ob=[
    {icon:"🤖",title:"PlantãoBot v5",sub:"Automação de plantões com IA integrada",
     body:<div>
       <label style={S.lbl}>Seu nome</label>
       <input value={name} onChange={e=>setName(e.target.value.slice(0,60))} maxLength={60} placeholder="Dr(a). Seu Nome" style={S.inp} autoFocus/>
       <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:18}}>
         {[["🔍","Monitoramento 24/7","Lê WhatsApp enquanto você trabalha ou dorme"],["⚡","0.8s de resposta","Impossível para humanos, fácil para o bot"],["🤖","IA integrada","Assistente Claude analisa e aconselha em tempo real"]].map(([i,t,d])=>(
           <div key={t} style={{display:"flex",gap:12,padding:"12px 14px",background:C.emB,border:"1px solid "+C.em+"18",borderRadius:12}}>
             <span style={{fontSize:20,minWidth:30}}>{i}</span>
             <div><div style={{fontSize:13,fontWeight:700,color:C.tx0,marginBottom:1}}>{t}</div><div style={{fontSize:11,color:C.tx2,lineHeight:1.5}}>{d}</div></div>
           </div>
         ))}
       </div>
     </div>
    },
    {icon:"💰",title:"Filtros financeiros",sub:"O bot só aceita o que vale seu tempo",
     body:<div style={{display:"flex",flexDirection:"column",gap:20}}>
       <div>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={S.lbl}>Valor mínimo</label><span style={{color:C.em,fontWeight:800,fontSize:18,fontFamily:"monospace"}}>R$ {fmt(prefs.minVal)}</span></div>
         <input type="range" min={500} max={5000} step={100} value={prefs.minVal} style={S.range} onChange={e=>setPrefs(p=>({...p,minVal:+e.target.value}))}/>
       </div>
       <div>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={S.lbl}>Distância máxima</label><span style={{color:C.cy,fontWeight:800,fontSize:18,fontFamily:"monospace"}}>{prefs.maxDist} km</span></div>
         <input type="range" min={1} max={100} step={1} value={prefs.maxDist} style={S.range} onChange={e=>setPrefs(p=>({...p,maxDist:+e.target.value}))}/>
       </div>
       <div style={{background:"linear-gradient(135deg,"+C.emB+","+C.cyB+")",border:"1px solid "+C.em+"22",borderRadius:14,padding:16}}>
         <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:.8,marginBottom:4}}>💡 PROJEÇÃO MENSAL</div>
         <div style={{fontSize:30,fontWeight:800,color:C.em,fontFamily:"monospace"}}>R$ {fmt(projM)}</div>
         <div style={{fontSize:11,color:C.tx2,marginTop:2}}>estimativa com seus filtros atuais</div>
       </div>
     </div>
    },
    {icon:"📅",title:"Disponibilidade",sub:"Quando e o que você aceita",
     body:<div style={{display:"flex",flexDirection:"column",gap:18}}>
       <div>
         <label style={S.lbl}>Dias disponíveis</label>
         <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginTop:8}}>
           {DAYS.map(d=>{const on=prefs.days.includes(d);return(
             <button type="button" key={d} onClick={()=>setPrefs(p=>({...p,days:on?p.days.filter(x=>x!==d):[...p.days,d]}))}
               style={{padding:"10px 0",borderRadius:10,border:"1px solid "+(on?C.em+"55":C.bd),background:on?C.emA:"rgba(255,255,255,0.03)",color:on?C.em:C.tx2,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s",boxShadow:on?"0 0 12px "+C.emA:""}}>
               {d}
             </button>
           );})}
         </div>
       </div>
       <div>
         <label style={S.lbl}>Especialidades</label>
         <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
           {SPECS.map(s=>{const on=prefs.specs.includes(s);return(
             <button type="button" key={s} onClick={()=>setPrefs(p=>({...p,specs:on?p.specs.filter(x=>x!==s):[...p.specs,s]}))}
               style={{padding:"6px 13px",borderRadius:20,border:"1px solid "+(on?C.cy+"55":C.bd),background:on?C.cyA:"rgba(255,255,255,0.03)",color:on?C.cy:C.tx2,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
               {s}
             </button>
           );})}
         </div>
       </div>
     </div>
    },
    {icon:"⚡",title:"Modo de operação",sub:"Velocidade total vs. controle manual",
     body:<div style={{display:"flex",flexDirection:"column",gap:10}}>
       {[{v:true,i:"⚡",t:"Aceite automático",d:"Bot responde em 0.8s sem precisar de você. Máxima vantagem.",c:C.em},{v:false,i:"🃏",t:"Modo swipe",d:"Bot avisa e você decide deslizando os cards. Mais controle.",c:C.cy}].map(o=>(
         <button type="button" key={o.t} onClick={()=>setPrefs(p=>({...p,auto:o.v}))}
           style={{background:prefs.auto===o.v?o.c+"08":"rgba(255,255,255,0.02)",border:"2px solid "+(prefs.auto===o.v?o.c+"44":C.bd),borderRadius:16,padding:"16px 18px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
           <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
             <span style={{fontSize:22}}>{o.i}</span>
             <span style={{fontSize:14,fontWeight:800,color:prefs.auto===o.v?o.c:C.tx1}}>{o.t}</span>
             {prefs.auto===o.v&&<span style={{marginLeft:"auto",fontSize:10,color:o.c,fontWeight:700,background:o.c+"18",padding:"2px 8px",borderRadius:100}}>ATIVO</span>}
           </div>
           <div style={{fontSize:12,color:C.tx2,lineHeight:1.5,paddingLeft:32}}>{o.d}</div>
         </button>
       ))}
     </div>
    },
  ];

  if(screen==="onboard") return (
    <div style={{fontFamily:"'Plus Jakarta Sans','Outfit',sans-serif",background:C.bg0,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style><BgOrbs/>
      <div style={{width:"100%",maxWidth:480,position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:30}}>
          {ob.map((_,i)=><div key={i} style={{width:i===obStep?24:8,height:8,borderRadius:4,background:i<=obStep?C.em:C.bd,transition:"all .3s cubic-bezier(.4,0,.2,1)",boxShadow:i===obStep?"0 0 12px "+C.emG:""}}/>)}
        </div>
        <form onSubmit={e=>{e.preventDefault();obStep<ob.length-1?setObStep(p=>p+1):setScreen("app");}} style={{background:"rgba(7,14,29,0.88)",backdropFilter:"blur(28px)",border:"1px solid "+C.bd,borderRadius:24,padding:28,boxShadow:"0 30px 80px rgba(0,0,0,.8)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,"+C.em+"66,transparent)"}}/>
          <div style={{fontSize:42,marginBottom:12,lineHeight:1}} aria-hidden="true">{ob[obStep].icon}</div>
          <div style={{fontSize:23,fontWeight:800,color:C.tx0,letterSpacing:"-.6px",marginBottom:5}}>{ob[obStep].title}</div>
          <div style={{fontSize:13,color:C.tx2,marginBottom:24,lineHeight:1.5}}>{ob[obStep].sub}</div>
          <div key={obStep} style={{animation:reducedMotion?"none":"fadeUp .3s cubic-bezier(.4,0,.2,1)"}}>{ob[obStep].body}</div>
          <div style={{display:"flex",gap:10,marginTop:26}}>
            {obStep>0&&<button type="button" onClick={()=>setObStep(p=>p-1)} style={{flex:1,padding:"12px",background:C.bd,border:"1px solid "+C.bd,borderRadius:13,color:C.tx1,fontWeight:700,cursor:"pointer",fontSize:14}}>← Voltar</button>}
            <button type="submit"
              style={{flex:2,padding:"13px",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",border:"none",borderRadius:13,color:"#021810",fontWeight:800,cursor:"pointer",fontSize:14,boxShadow:"0 4px 24px "+C.emA}}>
              {obStep<ob.length-1?"Continuar →":"🚀 Começar"}
            </button>
          </div>
        </form>
        <div style={{textAlign:"center",marginTop:12,fontSize:11,color:C.tx2}}>{obStep+1} de {ob.length}</div>
      </div>
    </div>
  );

  /* APP */
  const TABS=[
    {k:"dashboard",ico:"📊",lbl:"Dashboard"},
    {k:"feed",ico:"💬",lbl:feed.length>0?"Feed ("+feed.length+")":"Feed"},
    {k:prefs.auto?"captured":"swipe",ico:prefs.auto?"✅":"🃏",lbl:prefs.auto?("Capturados"+(captured.length>0?" ("+captured.length+")":"")):"Swipe"+(pending.length>0?" ("+pending.length+")":"")},
    {k:"insights",ico:"📈",lbl:"Insights"},
    {k:"ai",ico:"🤖",lbl:"IA"},
    {k:"settings",ico:"⚙️",lbl:"Config"},
  ];

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans','Outfit',sans-serif",background:C.bg0,minHeight:"100vh",color:C.tx0,display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{CSS}</style><BgOrbs/>
      <Confetti active={confetti}/>
      <Toasts items={toasts}/>
      <NotifDrawer open={notifOpen} notifs={notifs} onClose={()=>setNotifOpen(false)}/>
      {modal&&<ShiftModal shift={modal} prefs={prefs} captured={captured} onClose={()=>setModal(null)} onAccept={acceptFromModal}/>}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:400,background:"rgba(2,6,15,0.85)",backdropFilter:"blur(24px)",borderBottom:"1px solid "+C.bd,padding:"0 16px",display:"flex",alignItems:"center",height:56,gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:9,flex:1}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,"+C.em+","+C.cy+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,boxShadow:"0 4px 16px "+C.emA+",0 0 0 1px "+C.em+"33",flexShrink:0}}>🤖</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,letterSpacing:"-.4px",color:C.tx0,lineHeight:1.1}}>PlantãoBot</div>
            <div style={{fontSize:9,color:C.tx2,fontWeight:700,letterSpacing:1.1}}>DR(A). {(name||"MÉDICO").toUpperCase()}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {botOn&&<div style={{display:"flex",alignItems:"center",gap:8,background:C.emA,border:"1px solid "+C.em+"44",borderRadius:20,padding:"5px 10px",boxShadow:"0 0 16px "+C.emA}}>
            <Waveform active={true}/>
            <span style={{fontSize:9,fontWeight:800,color:C.em,letterSpacing:.8}}>ATIVO</span>
          </div>}
          <button onClick={()=>setNotifOpen(true)} aria-label={"Notificações"+(notifs.length>0?" ("+notifs.length+")":"")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+C.bd,borderRadius:9,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,position:"relative"}}>
            <span aria-hidden="true">🔔</span>
            {notifs.length>0&&<div aria-hidden="true" style={{position:"absolute",top:-2,right:-2,width:15,height:15,borderRadius:"50%",background:C.rd,fontSize:8,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 8px "+C.rd}}>{notifs.length>9?"9+":notifs.length}</div>}
          </button>
          <button onClick={botOn?stopBot:startBot}
            style={{padding:"7px 14px",background:botOn?C.rdA:"linear-gradient(135deg,"+C.em+","+C.cy+")",border:"1px solid "+(botOn?C.rd+"44":"transparent"),borderRadius:10,color:botOn?C.rd:"#021810",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:.2,boxShadow:botOn?"":("0 4px 20px "+C.emA),whiteSpace:"nowrap"}}>
            {botOn?"⏹ Parar":"▶ Iniciar"}
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{flex:1,overflowY:"auto",padding:"16px 16px 80px",maxWidth:900,margin:"0 auto",width:"100%",boxSizing:"border-box",position:"relative",zIndex:1}}>

        {/* DASHBOARD */}
        {tab==="dashboard"&&<div style={{animation:"fadeUp .35s both"}}>
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

          {/* Bot card */}
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

          {/* How it works */}
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

          {/* Recent */}
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
        </div>}

        {/* FEED */}
        {tab==="feed"&&<div style={{animation:"fadeUp .35s both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div><div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px"}}>Feed ao Vivo</div><div style={{fontSize:11,color:C.tx2,marginTop:2}}>Mensagens monitoradas dos grupos</div></div>
            {botOn&&<div style={{display:"flex",alignItems:"center",gap:6,background:C.emA,border:"1px solid "+C.em+"44",borderRadius:20,padding:"5px 11px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.em,animation:"dotP 1.5s infinite"}}/>
              <span style={{fontSize:9,fontWeight:800,color:C.em}}>AO VIVO</span>
            </div>}
          </div>
          {typing&&<GlassCard style={{padding:"8px 14px",marginBottom:9,borderColor:C.cy+"33"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:C.cy}}>{typing}</span>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:C.cy,animation:"bounce .7s "+(i*.15)+"s infinite"}}/>)}</div>
          </GlassCard>}
          <div ref={feedRef} style={{display:"flex",flexDirection:"column",gap:8,maxHeight:560,overflowY:"auto"}}>
            {feed.length===0?<GlassCard style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:36,marginBottom:10}}>💬</div><div style={{fontSize:13,fontWeight:700,color:C.tx1}}>Aguardando mensagens</div><div style={{fontSize:11,color:C.tx2,marginTop:3}}>Inicie o bot no Dashboard</div></GlassCard>
            :feed.map(msg=>{
              const bc=msg.isOffer?(msg.ok===true?C.em:msg.ok===false?C.rd:C.cy):C.bd;
              return <GlassCard key={msg.id} glow={msg.ok===true} style={{borderColor:bc+"44",padding:"12px 14px",animation:"fadeUp .3s both"}}>
                <div style={{display:"flex",gap:9,marginBottom:msg.isOffer?9:0}}>
                  <Av l={msg.av}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div><span style={{fontSize:12,fontWeight:700,color:C.tx0}}>{msg.sender}</span><span style={{fontSize:10,color:C.tx2,marginLeft:7}}>{msg.group}</span></div>
                      <span style={{fontSize:9,color:C.tx2,fontFamily:"monospace"}}>{msg.ts}</span>
                    </div>
                    {!msg.isOffer&&<div style={{fontSize:11,color:C.tx2,marginTop:3,fontStyle:"italic"}}>{msg.text}</div>}
                  </div>
                </div>
                {msg.isOffer&&<>
                  <div style={{background:"rgba(0,0,0,.5)",borderRadius:9,padding:"8px 11px",marginBottom:8,fontFamily:"monospace",fontSize:10,color:C.tx2,whiteSpace:"pre-wrap",lineHeight:1.7,borderLeft:"2px solid "+bc+"44"}}>{msg.rawMsg}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                    {msg.state==="scanning"
                      ?<div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.cy}}><div style={{width:11,height:11,border:"2px solid "+C.cy,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin .6s linear infinite"}}/>Analisando...</div>
                      :<div style={{display:"flex",alignItems:"center",gap:8,flex:1}}><Pill sc={msg.sc}/><div style={{flex:1}}><ScBar sc={msg.sc}/></div></div>}
                    {msg.state==="done"&&<button onClick={()=>setModal(msg)} style={{fontSize:10,color:C.cy,background:"none",border:"none",cursor:"pointer",fontWeight:700,flexShrink:0}}>detalhes →</button>}
                  </div>
                </>}
              </GlassCard>;
            })}
          </div>
        </div>}

        {/* SWIPE */}
        {tab==="swipe"&&<div style={{animation:"fadeUp .35s both"}}>
          <div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px",marginBottom:4}}>Modo Swipe</div>
          <div style={{fontSize:11,color:C.tx2,marginBottom:16}}>Plantões compatíveis aguardando sua decisão</div>
          {pending.length===0
            ?<GlassCard style={{textAlign:"center",padding:"50px 20px"}}>
              <div style={{fontSize:36,marginBottom:10}}>🃏</div>
              <div style={{fontSize:14,fontWeight:700,color:C.tx1}}>Nenhum plantão pendente</div>
              <div style={{fontSize:11,color:C.tx2,marginTop:3}}>{botOn?"Bot monitorando — novos plantões aparecerão aqui":"Inicie o bot no Dashboard"}</div>
            </GlassCard>
            :<SwipeCard shift={pending[0]} prefs={prefs} index={0} total={pending.length} onAccept={()=>acceptPending(pending[0])} onReject={()=>rejectPending(pending[0])}/>}
          {captured.length>0&&<GlassCard style={{marginTop:14}}>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:10}}>ACEITOS ({captured.length})</div>
            {captured.slice(-3).reverse().map(s=>(
              <div key={s.id} onClick={()=>setModal(s)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.emB,border:"1px solid "+C.em+"22",borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
                <div><div style={{fontSize:12,fontWeight:700,color:C.tx0}}>{s.hospital}</div><div style={{fontSize:10,color:C.tx2,marginTop:1}}>{s.date}</div></div>
                <div style={{fontSize:15,fontWeight:800,color:C.em,fontFamily:"monospace"}}>R$ {fmt(s.val)}</div>
              </div>
            ))}
          </GlassCard>}
        </div>}

        {/* CAPTURED */}
        {tab==="captured"&&<div style={{animation:"fadeUp .35s both"}}>
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
        </div>}

        {/* INSIGHTS */}
        {tab==="insights"&&<div style={{animation:"fadeUp .35s both"}}>
          <InsightsPanel captured={captured} rejected={rejected} prefs={prefs}/>
          {/* Monthly chart */}
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
        </div>}

        {/* AI CHAT */}
        {tab==="ai"&&<div style={{animation:"fadeUp .35s both",height:"calc(100vh - 180px)",display:"flex",flexDirection:"column"}}>
          <AIChat prefs={prefs} name={name} captured={captured} rejected={rejected}/>
        </div>}

        {/* SETTINGS */}
        {tab==="settings"&&<div style={{animation:"fadeUp .35s both"}}>
          <div style={{fontSize:20,fontWeight:800,color:C.tx0,letterSpacing:"-.5px",marginBottom:14}}>Configurações</div>
          <GlassCard style={{marginBottom:11}}>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:11}}>GRUPOS DE WHATSAPP</div>
            {groups.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",border:"1px solid "+C.bd,borderRadius:11,padding:"10px 13px",marginBottom:7}}>
                <span style={{fontSize:18}}>{g.emoji}</span>
                <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:C.tx0}}>{g.name}</div><div style={{fontSize:10,color:C.tx2,marginTop:1}}>{g.members} membros</div></div>
                <Toggle on={g.active} onChange={()=>setGroups(p=>p.map(x=>x.id===g.id?{...x,active:!x.active}:x))} label={(g.active?"Desativar":"Ativar")+" "+g.name}/>
              </div>
            ))}
          </GlassCard>
          <GlassCard style={{marginBottom:11}}>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:14}}>FILTROS</div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><label htmlFor="sliderMinVal" style={S.lbl}>Valor mínimo</label><span style={{fontWeight:800,color:C.em,fontSize:14,fontFamily:"monospace"}}>R$ {fmt(prefs.minVal)}</span></div>
              <input id="sliderMinVal" type="range" min={500} max={5000} step={100} value={prefs.minVal} style={S.range} onChange={e=>setPrefs(p=>({...p,minVal:+e.target.value}))} aria-valuetext={"R$ "+fmt(prefs.minVal)}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><label htmlFor="sliderMaxDist" style={S.lbl}>Distância máxima</label><span style={{fontWeight:800,color:C.cy,fontSize:14,fontFamily:"monospace"}}>{prefs.maxDist} km</span></div>
              <input id="sliderMaxDist" type="range" min={1} max={100} step={1} value={prefs.maxDist} style={S.range} onChange={e=>setPrefs(p=>({...p,maxDist:+e.target.value}))} aria-valuetext={prefs.maxDist+" km"}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={S.lbl}>Dias disponíveis</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                {DAYS.map(d=>{const on=prefs.days.includes(d);return(
                  <button key={d} onClick={()=>setPrefs(p=>({...p,days:on?p.days.filter(x=>x!==d):[...p.days,d]}))}
                    style={{padding:"6px 12px",borderRadius:9,border:"1px solid "+(on?C.em+"55":C.bd),background:on?C.emA:"rgba(255,255,255,0.03)",color:on?C.em:C.tx2,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                    {d}
                  </button>
                );})}
              </div>
            </div>
            <div>
              <div style={S.lbl}>Especialidades</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                {SPECS.map(s=>{const on=prefs.specs.includes(s);return(
                  <button key={s} onClick={()=>setPrefs(p=>({...p,specs:on?p.specs.filter(x=>x!==s):[...p.specs,s]}))}
                    style={{padding:"5px 11px",borderRadius:9,border:"1px solid "+(on?C.cy+"55":C.bd),background:on?C.cyA:"rgba(255,255,255,0.03)",color:on?C.cy:C.tx2,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                    {s}
                  </button>
                );})}
              </div>
            </div>
          </GlassCard>
          <GlassCard style={{marginBottom:11}}>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:10}}>MODO DE ACEITE</div>
            {[{v:true,i:"⚡",t:"Automático",d:"Bot aceita sem confirmação",c:C.em},{v:false,i:"🃏",t:"Swipe",d:"Você decide deslizando cards",c:C.cy}].map(o=>(
              <div key={o.t} onClick={()=>setPrefs(p=>({...p,auto:o.v}))} style={{display:"flex",alignItems:"center",gap:12,background:prefs.auto===o.v?o.c+"08":"rgba(255,255,255,0.02)",border:"1px solid "+(prefs.auto===o.v?o.c+"44":C.bd),borderRadius:11,padding:"11px 14px",marginBottom:7,cursor:"pointer",transition:"all .2s"}}>
                <span style={{fontSize:20}}>{o.i}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:prefs.auto===o.v?o.c:C.tx1}}>{o.t}</div><div style={{fontSize:11,color:C.tx2,marginTop:1}}>{o.d}</div></div>
                {prefs.auto===o.v&&<span style={{fontSize:10,color:o.c,fontWeight:700,background:o.c+"18",padding:"2px 8px",borderRadius:100}}>ATIVO</span>}
              </div>
            ))}
          </GlassCard>
          <GlassCard>
            <div style={{fontSize:10,color:C.tx2,fontWeight:700,letterSpacing:1.2,marginBottom:10}}>PERFIL</div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.03)",border:"1px solid "+C.bd,borderRadius:11,padding:"13px 15px",marginBottom:10}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,"+C.em+","+C.cy+")",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#021810",boxShadow:"0 4px 16px "+C.emA}} aria-hidden="true">{(name||"D")[0].toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.tx0}}>{name||"Dr(a). Médico"}</div><div style={{fontSize:11,color:C.tx2,marginTop:1}}>PlantãoBot Pro · {actG.length} grupos</div></div>
              <button onClick={()=>{setScreen("onboard");setObStep(0);}} style={{fontSize:11,color:C.tx2,background:"rgba(255,255,255,0.06)",border:"1px solid "+C.bd,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:600}}>Editar</button>
            </div>
            <button onClick={()=>{if(window.confirm("Limpar todo o histórico de plantões capturados? Esta ação não pode ser desfeita.")){setCaptured([]);setMonthly(MONTHLY);setRejected([]);toast("🗑 Histórico limpo","Plantões capturados foram removidos.","info");}}} style={{width:"100%",padding:"10px",background:C.rdA,border:"1px solid "+C.rd+"33",borderRadius:10,color:C.rd,fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 Limpar histórico de plantões</button>
          </GlassCard>
        </div>}

      </main>

      {/* BOTTOM NAV */}
      <nav role="navigation" aria-label="Navegação principal" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,background:"rgba(2,6,15,0.94)",backdropFilter:"blur(28px)",borderTop:"1px solid "+C.bd,display:"flex",justifyContent:"space-around",padding:"8px 4px 12px"}}>
        {TABS.map(t=>{
          const active=tab===t.k;
          return <button key={t.k} onClick={()=>setTab(t.k)} aria-label={t.lbl} aria-current={active?"page":undefined}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"5px 12px",borderRadius:12,transition:"all .2s",background:active?C.emA:"transparent",flex:1,minWidth:0}}>
            <span style={{fontSize:18,lineHeight:1}} aria-hidden="true">{t.ico}</span>
            <span style={{fontSize:9,fontWeight:700,color:active?C.em:C.tx2,letterSpacing:.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:64}} aria-hidden="true">{t.lbl}</span>
          </button>;
        })}
      </nav>
    </div>
  );
}

const S = {
  lbl:{fontSize:10,color:"#3a5068",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5},
  inp:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"11px 13px",color:"#edf2ff",fontSize:14,fontWeight:600,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginTop:6},
  range:{width:"100%",cursor:"pointer"},
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700;800&display=swap');
  * { box-sizing:border-box; }
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
  @keyframes modalUp{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes dotP{0%,100%{box-shadow:0 0 0 0 rgba(0,255,157,.5)}50%{box-shadow:0 0 0 5px rgba(0,255,157,.06)}}
  @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1.1)}}
  @keyframes cfFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(800deg);opacity:0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes wave{from{height:4px}to{height:100%}}
  @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(5%,4%) scale(1.1)}}
  @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-4%,-5%) scale(1.06)}}
  @keyframes orb3{0%,100%{transform:translate(0,0)}33%{transform:translate(4%,-4%)}66%{transform:translate(-3%,3%)}}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px}
  input[type=range]{-webkit-appearance:none;height:5px;background:rgba(255,255,255,0.08);border-radius:3px}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#00ff9d,#22d4f5);cursor:pointer;box-shadow:0 0 0 3px rgba(0,255,157,.2),0 2px 8px rgba(0,0,0,.5)}
  input:focus{outline:none;border-color:rgba(34,212,245,0.5)!important}
  button:active{transform:scale(.96)}
  ::selection{background:rgba(0,255,157,.2);color:#edf2ff}
`;
