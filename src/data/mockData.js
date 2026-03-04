export const SPECS = ["Clínica Geral","Emergência","UTI","Pediatria","Cardiologia","Ortopedia","Neurologia","Psiquiatria"];
export const DAYS  = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

export const SHIFTS = [
  {id:1,group:"Plantões SP Centro",sender:"Dra. Paula",av:"P",hospital:"UPA Consolação",spec:"Emergência",val:1800,date:"Sáb 08/03",day:8,hours:"12h",loc:"Consolação, SP",dist:3.2,delay:2200,rivals:["Dr. Marcos","Dra. Júlia"],rawMsg:"🏥 PLANTÃO DISPONÍVEL\nUPA Consolação - Emergência\n📅 Sáb 08/03 | ⏰ 12h\n💰 R$ 1.800\n📍 Consolação, SP"},
  {id:2,group:"Médicos ABC",sender:"Coord. Regional",av:"C",hospital:"Hospital Regional ABC",spec:"Clínica Geral",val:2200,date:"Dom 09/03",day:9,hours:"24h",loc:"Santo André, SP",dist:18,delay:5000,rivals:["Dr. Felipe"],rawMsg:"🔔 VAGA URGENTE!\nHospital Regional ABC\nClínica Geral | 24h\n💰 R$ 2.200\n📅 Dom 09/03"},
  {id:3,group:"Plantões SP Centro",sender:"Adm. Santa Casa",av:"A",hospital:"Santa Casa SP",spec:"UTI",val:3100,date:"Sex 07/03",day:7,hours:"12h",loc:"Santa Cecília, SP",dist:5.1,delay:7500,rivals:["Dra. Renata","Dr. Paulo"],rawMsg:"Plantão UTI\nSanta Casa SP\nR$ 3.100 | 12h | Sex 07/03"},
  {id:4,group:"Oportunidades SP",sender:"RH Sírio",av:"S",hospital:"Hospital Sírio-Libanês",spec:"Cardiologia",val:4500,date:"Qua 12/03",day:12,hours:"12h",loc:"Bela Vista, SP",dist:2.8,delay:10500,rivals:["Dr. Roberto"],rawMsg:"🌟 PLANTÃO ESPECIAL\nSírio-Libanês | Cardiologia\n12h | R$ 4.500 | Qua 12/03"},
  {id:5,group:"Médicos ABC",sender:"Coord. UPA Mauá",av:"U",hospital:"UPA Mauá",spec:"Pediatria",val:1600,date:"Ter 11/03",day:11,hours:"12h",loc:"Mauá, SP",dist:28,delay:14000,rivals:["Dra. Camila"],rawMsg:"PLANTÃO UPA Mauá\nPediatria | R$ 1.600\nTer 11/03 | 12h"},
  {id:6,group:"Plantões SP Centro",sender:"HC Coord.",av:"H",hospital:"Hospital das Clínicas",spec:"Neurologia",val:3800,date:"Seg 10/03",day:10,hours:"12h",loc:"Cerqueira César, SP",dist:4.0,delay:18000,rivals:["Dr. Leonardo","Dra. Sofia"],rawMsg:"HC São Paulo\nNeurologia | 12h | R$ 3.800\nSeg 10/03"},
  {id:7,group:"Vagas UTI Sul",sender:"Coord. UTI",av:"V",hospital:"Hospital do Servidor",spec:"UTI",val:2900,date:"Dom 09/03",day:9,hours:"24h",loc:"Vila Mariana, SP",dist:6.5,delay:22000,rivals:["Dr. Gustavo"],rawMsg:"Plantão UTI\nH. Servidor Público\nR$ 2.900 | 24h | Dom 09/03"},
];

export const NOISE = [
  {id:101,delay:3500,group:"Médicos ABC",sender:"Dr. Marcus",av:"M",text:"Protocolo de sepse atualizado? 🙏"},
  {id:102,delay:6500,group:"Plantões SP Centro",sender:"Dra. Fernanda",av:"F",text:"Bom dia galera! 😊"},
  {id:103,delay:12000,group:"Oportunidades SP",sender:"Adm.",av:"O",text:"Reunião amanhã às 8h cancelada."},
  {id:104,delay:17000,group:"Médicos ABC",sender:"Dr. Kleber",av:"K",text:"Alguém recomenda ATLS em SP? 😅"},
];

export const MONTHLY = [{m:"Out",v:9200},{m:"Nov",v:12400},{m:"Dez",v:8800},{m:"Jan",v:15600},{m:"Fev",v:11200},{m:"Mar",v:0}];

export const GROUPS = [
  {id:1,name:"Plantões SP Centro",members:342,active:true,emoji:"🏥"},
  {id:2,name:"Médicos ABC Paulista",members:218,active:true,emoji:"👨‍⚕️"},
  {id:3,name:"Oportunidades Médicas SP",members:567,active:true,emoji:"💼"},
  {id:4,name:"Vagas UTI Sul SP",members:89,active:false,emoji:"🔬"},
];

export const CAL = [
  [null,null,null,null,null,1,2],
  [3,4,5,6,7,8,9],
  [10,11,12,13,14,15,16],
  [17,18,19,20,21,22,23],
  [24,25,26,27,28,29,30],
  [31,null,null,null,null,null,null],
];
