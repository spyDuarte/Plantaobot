import { C } from "../../constants/colors.js";
import { fmt } from "../../utils/index.js";
import { GlassCard } from "../ui/index.jsx";
import SwipeCard from "../SwipeCard.jsx";

export default function SwipeTab({botOn,pending,captured,prefs,acceptPending,rejectPending,setModal}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
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
    </div>
  );
}
