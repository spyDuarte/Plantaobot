import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "./constants/colors.js";
import { SHIFTS, NOISE, MONTHLY, GROUPS } from "./data/mockData.js";
import { fmt, nowT, calcScore } from "./utils/index.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { CSS } from "./styles/index.js";
import { BgOrbs, Confetti, Toasts, Waveform } from "./components/ui/index.jsx";
import ShiftModal from "./components/ShiftModal.jsx";
import NotifDrawer from "./components/NotifDrawer.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Dashboard from "./components/tabs/Dashboard.jsx";
import FeedTab from "./components/tabs/FeedTab.jsx";
import SwipeTab from "./components/tabs/SwipeTab.jsx";
import CapturedTab from "./components/tabs/CapturedTab.jsx";
import InsightsTab from "./components/tabs/InsightsTab.jsx";
import SettingsTab from "./components/tabs/SettingsTab.jsx";
import AIChat from "./components/AIChat.jsx";

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
  const [pending,setPending]   = useState([]);
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

  if(screen==="onboard") return (
    <Onboarding
      obStep={obStep} setObStep={setObStep}
      name={name} setName={setName}
      prefs={prefs} setPrefs={setPrefs}
      projM={projM}
      onDone={()=>setScreen("app")}
    />
  );

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

      <main style={{flex:1,overflowY:"auto",padding:"16px 16px 80px",maxWidth:900,margin:"0 auto",width:"100%",boxSizing:"border-box",position:"relative",zIndex:1}}>
        {tab==="dashboard"&&<Dashboard setTab={setTab} botOn={botOn} startBot={startBot} stopBot={stopBot} captured={captured} rejected={rejected} pending={pending} actG={actG} total={total} prefs={prefs} typing={typing} setModal={setModal}/>}
        {tab==="feed"&&<FeedTab botOn={botOn} feed={feed} typing={typing} setModal={setModal} feedRef={feedRef}/>}
        {tab==="swipe"&&<SwipeTab botOn={botOn} pending={pending} captured={captured} prefs={prefs} acceptPending={acceptPending} rejectPending={rejectPending} setModal={setModal}/>}
        {tab==="captured"&&<CapturedTab captured={captured} rejected={rejected} total={total} exportCSV={exportCSV} setModal={setModal}/>}
        {tab==="insights"&&<InsightsTab captured={captured} rejected={rejected} prefs={prefs} monthly={monthly} projM={projM}/>}
        {tab==="ai"&&<div style={{animation:"fadeUp .35s both",height:"calc(100vh - 180px)",display:"flex",flexDirection:"column"}}><AIChat prefs={prefs} name={name} captured={captured} rejected={rejected}/></div>}
        {tab==="settings"&&<SettingsTab groups={groups} setGroups={setGroups} prefs={prefs} setPrefs={setPrefs} name={name} actG={actG} setScreen={setScreen} setObStep={setObStep} setCaptured={setCaptured} setMonthly={setMonthly} setRejected={setRejected} toast={toast}/>}
      </main>

      <nav role="navigation" aria-label="Navegação principal" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:400,background:"rgba(2,6,15,0.94)",backdropFilter:"blur(28px)",borderTop:"1px solid "+C.bd,display:"flex",justifyContent:"space-around",padding:"8px 4px 12px"}}>
        {TABS.map(t=>{
          const active=tab===t.k;
          return <button key={t.k} onClick={()=>setTab(t.k)} aria-label={t.lbl} aria-current={active?"page":undefined}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:active?C.emA:"transparent",border:"none",cursor:"pointer",padding:"5px 12px",borderRadius:12,transition:"all .2s",flex:1,minWidth:0}}>
            <span style={{fontSize:18,lineHeight:1}} aria-hidden="true">{t.ico}</span>
            <span style={{fontSize:9,fontWeight:700,color:active?C.em:C.tx2,letterSpacing:.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:64}} aria-hidden="true">{t.lbl}</span>
          </button>;
        })}
      </nav>
    </div>
  );
}
