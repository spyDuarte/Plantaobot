import { useState, useRef, useEffect } from "react";
import { C } from "../constants/colors.js";
import { fmt } from "../utils/index.js";

export default function AIChat({prefs,name,captured,rejected}) {
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
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {quickPrompts.map(p=>(
          <button key={p} onClick={()=>send(p)} disabled={loading} style={{padding:"6px 12px",background:C.cyB,border:"1px solid "+C.cy+"33",borderRadius:20,color:C.cy,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>
            {p}
          </button>
        ))}
      </div>
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
