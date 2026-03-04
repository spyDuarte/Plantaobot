export const fmt = n => n.toLocaleString("pt-BR");
export const nowT = () => new Date().toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});

export function calcScore(shift, p) {
  let s = 0; const r = [];
  const d = shift.date.split(" ")[0];
  if (shift.val >= p.minVal) { s+=30; r.push({l:"Valor ✓ R$"+fmt(shift.val), ok:true}); }
  else r.push({l:"Abaixo do mínimo R$"+fmt(p.minVal), ok:false});
  if (shift.dist <= p.maxDist) { s+=30; r.push({l:"Distância ✓ "+shift.dist+"km", ok:true}); }
  else r.push({l:"Muito longe "+shift.dist+"km", ok:false});
  if (p.days.includes(d)) { s+=20; r.push({l:"Dia disponível ✓", ok:true}); }
  else r.push({l:"Dia bloqueado ("+d+")", ok:false});
  if (p.specs.includes(shift.spec)) { s+=20; r.push({l:"Especialidade ✓", ok:true}); }
  else r.push({l:"Especialidade diferente", ok:false});
  return {s, r};
}
