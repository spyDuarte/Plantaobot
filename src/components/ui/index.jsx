import { useState, useEffect, useRef } from "react";
import { C, AVC, reducedMotion } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";

export function Av({l,sz=32}) {
  const col=AVC[l]||"#64748b";
  return <div aria-hidden="true" style={{width:sz,height:sz,borderRadius:"50%",background:"rgba(0,0,0,0.3)",border:"1.5px solid "+col+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:sz*.36,fontWeight:800,color:col,flexShrink:0}}>{l}</div>;
}

export function Pill({sc}) {
  if(sc>=80) return <span style={{background:C.emA,border:"1px solid "+C.em+"44",color:C.em,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>✓ MATCH</span>;
  if(sc>=50) return <span style={{background:C.amA,border:"1px solid "+C.am+"44",color:C.am,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>≈ PARCIAL</span>;
  return <span style={{background:C.rdA,border:"1px solid "+C.rd+"44",color:C.rd,padding:"2px 9px",borderRadius:100,fontSize:10,fontWeight:800,letterSpacing:.5}}>✗ RECUSADO</span>;
}

export function ScBar({sc,h=4}) {
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

export function Toggle({on,onChange,label}) {
  return <button onClick={onChange} role="switch" aria-checked={on} aria-label={label} style={{width:42,height:23,borderRadius:12,background:on?"linear-gradient(135deg,"+C.em+","+C.cy+")":C.bd,border:"none",cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0,boxShadow:on?"0 0 14px "+C.emA:""}}>
    <div style={{position:"absolute",top:2.5,left:on?20:2.5,width:18,height:18,borderRadius:"50%",background:"#fff",transition:reducedMotion?"none":"left .3s cubic-bezier(.4,0,.2,1)",boxShadow:"0 1px 6px rgba(0,0,0,.5)"}}/>
  </button>;
}

export function GlassCard({children,style={},glow=false,onClick,hover=false}) {
  const [hov,setHov]=useState(false);
  return <div
    onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    onClick={onClick}
    style={{background:C.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid "+(glow?C.em+"55":(hov&&hover)?C.bdH:C.bd),borderRadius:18,padding:18,position:"relative",overflow:"hidden",boxShadow:glow?"0 0 40px "+C.emA+",0 8px 32px rgba(0,0,0,.5)":"0 4px 24px rgba(0,0,0,.4)",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}>
    {glow&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,"+C.em+"88,transparent)"}}/>}
    {children}
  </div>;
}

export function Counter({value,prefix="",suffix="",color=C.em}) {
  const [disp,setDisp]=useState(0);
  const ref=useRef(null);
  const prev=useRef(0);

  useEffect(()=>{
    if(ref.current) clearInterval(ref.current);
    const start=prev.current;
    const diff=value-start;
    const dur=800;
    const fps=40;
    const step=diff/((dur/1000)*fps);
    let cur=start;

    ref.current=setInterval(()=>{
      cur+=step;
      if((step>0&&cur>=value)||(step<0&&cur<=value)){
        setDisp(value);
        prev.current=value;
        clearInterval(ref.current);
      } else {
        const rounded=Math.round(cur);
        setDisp(rounded);
        prev.current=rounded;
      }
    },1000/fps);

    return ()=>clearInterval(ref.current);
  },[value]);

  return <span style={{color,fontFamily:"'JetBrains Mono',monospace",fontWeight:800}}>{prefix}{fmt(disp)}{suffix}</span>;
}
export function Confetti({active}) {
  if(!active) return null;
  const cols=[C.em,C.cy,C.pu,C.am,"#f472b6","#60a5fa"];
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:9900,overflow:"hidden"}}>
    {Array.from({length:30},(_,i)=>{
      const col=cols[i%cols.length],sz=Math.random()*8+5;
      return <div key={i} style={{position:"absolute",top:-10,left:Math.random()*100+"%",width:sz,height:sz,background:col,borderRadius:Math.random()>.5?"50%":"3px",animation:"cfFall "+(1.3+Math.random()*1.3)+"s "+(Math.random()*.7)+"s ease-in forwards",boxShadow:"0 0 6px "+col}}/>;
    })}
  </div>;
}

export function Toasts({items}) {
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

export function Waveform({active}) {
  return <div style={{display:"flex",alignItems:"center",gap:3,height:24}} aria-hidden="true">
    {[1,.6,.9,.5,.8,.4,.7,.5,.9,.6,1,.7].map((h,i)=>(
      <div key={i} style={{width:3,height:active?(h*20)+"px":"3px",background:active?"linear-gradient(180deg,"+C.em+","+C.cy+")":C.bd,borderRadius:2,transition:reducedMotion?"none":"height .15s ease",animation:active&&!reducedMotion?"wave .8s "+(i*.07)+"s ease-in-out infinite alternate":""}}/>
    ))}
  </div>;
}

export function RivalRace({shift,won}) {
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

export function BgOrbs() {
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}} aria-hidden="true">
    <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(circle,rgba(0,255,157,0.055) 0%,transparent 70%)",animation:reducedMotion?"none":"orb1 22s ease-in-out infinite"}}/>
    <div style={{position:"absolute",bottom:"5%",right:"-15%",width:"55%",height:"55%",background:"radial-gradient(circle,rgba(34,212,245,0.045) 0%,transparent 70%)",animation:reducedMotion?"none":"orb2 28s ease-in-out infinite"}}/>
    <div style={{position:"absolute",top:"35%",left:"25%",width:"45%",height:"45%",background:"radial-gradient(circle,rgba(167,139,250,0.035) 0%,transparent 70%)",animation:reducedMotion?"none":"orb3 35s ease-in-out infinite"}}/>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundImage:"linear-gradient("+C.bd+" 1px,transparent 1px),linear-gradient(90deg,"+C.bd+" 1px,transparent 1px)",backgroundSize:"44px 44px",maskImage:"radial-gradient(ellipse 80% 80% at 50% 40%,black 30%,transparent 100%)"}}/>
  </div>;
}

export {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
  ToastViewport,
} from "./primitives.jsx";




