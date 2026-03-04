export const S = {
  lbl:{fontSize:10,color:"#3a5068",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5},
  inp:{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"11px 13px",color:"#edf2ff",fontSize:14,fontWeight:600,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginTop:6},
  range:{width:"100%",cursor:"pointer"},
};

export const CSS = `
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
