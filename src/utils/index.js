export const fmt = n => n.toLocaleString("pt-BR");
export const nowT = () => new Date().toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});

const DAY_MAP = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

function resolveDayLabel(shift) {
  if (typeof shift?.dayLabel === "string" && shift.dayLabel.length > 0) {
    return shift.dayLabel;
  }

  if (typeof shift?.date === "string" && shift.date.length > 0) {
    const token = shift.date.split(" ")[0];
    if (token.length >= 3) {
      return token;
    }
  }

  const dateCandidates = [shift?.dateISO, shift?.startAt, shift?.datetime, shift?.createdAt];
  for (const candidate of dateCandidates) {
    if (!candidate) {
      continue;
    }
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return DAY_MAP[parsed.getDay()];
    }
  }

  return "";
}

export function calcScore(shift, p) {
  let s = 0; const r = [];
  const dayLabel = resolveDayLabel(shift);

  if (shift.val >= p.minVal) { s+=30; r.push({l:"Valor ? R$"+fmt(shift.val), ok:true}); }
  else r.push({l:"Abaixo do mínimo R$"+fmt(p.minVal), ok:false});

  if (shift.dist <= p.maxDist) { s+=30; r.push({l:"Distância ? "+shift.dist+"km", ok:true}); }
  else r.push({l:"Muito longe "+shift.dist+"km", ok:false});

  if (p.days.includes(dayLabel)) { s+=20; r.push({l:"Dia disponível ?", ok:true}); }
  else r.push({l:"Dia bloqueado ("+(dayLabel || "?")+")", ok:false});

  if (p.specs.includes(shift.spec)) { s+=20; r.push({l:"Especialidade ?", ok:true}); }
  else r.push({l:"Especialidade diferente", ok:false});

  return {s, r};
}
