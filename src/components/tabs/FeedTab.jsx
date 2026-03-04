import { C } from "../../constants/colors.js";
import { GlassCard, Av, Pill, ScBar } from "../ui/index.jsx";

export default function FeedTab({botOn,feed,typing,setModal,feedRef}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
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
        {feed.length===0
          ?<GlassCard style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:36,marginBottom:10}}>💬</div><div style={{fontSize:13,fontWeight:700,color:C.tx1}}>Aguardando mensagens</div><div style={{fontSize:11,color:C.tx2,marginTop:3}}>Inicie o bot no Dashboard</div></GlassCard>
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
    </div>
  );
}
