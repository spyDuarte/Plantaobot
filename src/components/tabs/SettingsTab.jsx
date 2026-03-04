import { C } from "../../constants/colors.js";
import { DAYS, SPECS, MONTHLY } from "../../data/mockData.js";
import { fmt } from "../../utils/index.js";
import { GlassCard, Toggle } from "../ui/index.jsx";
import { S } from "../../styles/index.js";

export default function SettingsTab({groups,setGroups,prefs,setPrefs,name,actG,setScreen,setObStep,setCaptured,setMonthly,setRejected,toast}) {
  return (
    <div style={{animation:"fadeUp .35s both"}}>
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
    </div>
  );
}
