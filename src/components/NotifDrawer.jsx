import { C } from "../constants/colors.js";

export default function NotifDrawer({open,notifs,onClose}) {
  return <>
    {open&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:7900,background:"rgba(2,6,15,.6)",backdropFilter:"blur(4px)"}} onClick={onClose}/>}
    <div style={{position:"fixed",top:0,right:0,height:"100vh",width:300,background:"rgba(7,14,29,0.98)",backdropFilter:"blur(24px)",borderLeft:"1px solid "+C.bd,zIndex:8000,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .35s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",boxShadow:"-12px 0 50px rgba(0,0,0,.8)"}}>
      <div style={{padding:"20px 16px 12px",borderBottom:"1px solid "+C.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:14,fontWeight:800,color:C.tx0}}>Notificações</div>
        <button onClick={onClose} aria-label="Fechar notificações" style={{background:C.bd,border:"1px solid "+C.bd,color:C.tx1,width:26,height:26,borderRadius:"50%",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
        {notifs.length===0
          ?<div style={{textAlign:"center",padding:40,color:C.tx2}}><div style={{fontSize:28,marginBottom:8}}>🔔</div><div style={{fontSize:12}}>Nenhuma notificação</div></div>
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
