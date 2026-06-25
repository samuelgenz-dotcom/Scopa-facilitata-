const semi = [
  {nome:"Denari",  classe:"denari"},
  {nome:"Coppe",   classe:"coppe"},
  {nome:"Bastoni", classe:"bastoni"},
  {nome:"Spade",   classe:"spade"}
];

let cards = [];
let history = [];
let selectedHand = [];
let showOnlyRemaining = false;

function createDeck(){
  cards = [];
  semi.forEach(s => {
    for(let v=1; v<=10; v++){
      cards.push({ id:`${v}-${s.nome}`, valore:v, seme:s.nome, classe:s.classe, used:false });
    }
  });
}

function label(v){ return v===1?"A": v===8?"F": v===9?"C": v===10?"R": v; }
function icon(s){ return {Denari:"🪙",Coppe:"🏆",Bastoni:"🌿",Spade:"⚔️"}[s]||s; }

function renderCards(){
  const c = document.getElementById("cardsContainer");
  c.innerHTML = "";
  cards.forEach(card => {
    if(showOnlyRemaining && card.used) return;
    const div = document.createElement("div");
    div.className = `card ${card.classe}`;
    if(card.used) div.classList.add("used");
    if(card.valore===7 && card.seme==="Denari") div.classList.add("settebello");
    div.innerHTML = `<div class="value">${label(card.valore)}</div><div class="suit">${icon(card.seme)}</div>`;
    div.onclick = () => toggleCard(card.id);
    c.appendChild(div);
  });
}

function toggleCard(id){
  const c = cards.find(x => x.id===id);
  c.used = !c.used;
  if(c.used) history.push(id);
  else history = history.filter(h => h!==id);
  save(); updateStats(); renderCards();
}

function updateStats(){
  const used    = cards.filter(c => c.used).length;
  const rimaste = 40 - used;
  const denari  = cards.filter(c => c.seme==="Denari" && !c.used).length;
  const sette   = cards.filter(c => c.valore===7 && !c.used).length;
  const assi    = cards.filter(c => c.valore===1 && !c.used).length;
  const sb      = cards.find(c => c.valore===7 && c.seme==="Denari");

  document.getElementById("uscite").textContent  = used;
  document.getElementById("rimaste").textContent = rimaste;
  document.getElementById("denari").textContent  = denari;
  document.getElementById("sette").textContent   = sette;
  document.getElementById("assi").textContent    = assi;
  document.getElementById("settebello").textContent = sb&&sb.used ? "🔴" : "🟢";
}

function openAI(){
  selectedHand = [];
  renderPicker();
  document.getElementById("aiResult").classList.add("hidden");
  document.getElementById("aiOverlay").classList.remove("hidden");
}

function closeAI(){
  document.getElementById("aiOverlay").classList.add("hidden");
}

function renderPicker(){
  const picker = document.getElementById("handPicker");
  picker.innerHTML = "";
  cards.forEach(c => {
    const div = document.createElement("div");
    div.className = "pick-card " + c.classe;
    if(c.used) div.classList.add("disabled");
    if(selectedHand.includes(c.id)) div.classList.add("selected");
    if(c.valore===7 && c.seme==="Denari") div.classList.add("settebello");
    div.innerHTML = `<div class="value">${label(c.valore)}</div><div class="suit">${icon(c.seme)}</div>`;
    div.onclick = () => pickCard(c.id);
    picker.appendChild(div);
  });
}

function pickCard(id){
  if(selectedHand.includes(id)){
    selectedHand = selectedHand.filter(h => h!==id);
  } else {
    if(selectedHand.length >= 3){ showToast("Seleziona max 3 carte!"); return; }
    selectedHand.push(id);
  }
  renderPicker();
  if(selectedHand.length === 3) showSuggestion();
  else document.getElementById("aiResult").classList.add("hidden");
}

function showSuggestion(){
  const hand    = cards.filter(c => selectedHand.includes(c.id));
  const unknown = cards.filter(c => !c.used && !selectedHand.includes(c.id));
  const rimaste = unknown.length;

  let scores = hand.map(c => {
    let score = 0;
    const reasons = [];

    if(c.valore===7 && c.seme==="Denari"){ score+=10; reasons.push("7 bello 💎"); }
    else if(c.valore===7){ score+=6; reasons.push("sette ⭐"); }
    else if(c.valore===1){ score+=5; reasons.push("asso ⭐"); }
    else if(c.seme==="Denari"){ score+=3; reasons.push("denaro 🪙"); }
    else if(c.valore>=8){ score+=1; reasons.push("figura"); }

    const catturabili = unknown.filter(u => u.valore===c.valore).length;
    const riskRatio   = rimaste > 0 ? catturabili/rimaste : 0;

    if(riskRatio > 0.15){
      score -= Math.round(riskRatio * 5);
      reasons.push(`rischio cattura ${(riskRatio*100).toFixed(0)}%`);
    }

    if(catturabili===0){ score+=3; reasons.push("sicura ✅"); }

    return { card:c, score, reasons };
  });

  scores.sort((a,b) => a.score - b.score);
  const butta = scores[0];
  const tieni = scores.slice(1);

  const nomi = {1:"Asso",8:"Fante",9:"Cavallo",10:"Re"};
  const n = v => nomi[v]||v;

  const motivazioni = butta.reasons.join(", ") || "carta meno pregiata";

  let testo = `Butta: ${n(butta.card.valore)} di ${butta.card.seme}\n`;
  testo += `(${motivazioni})\n\n`;
  testo += `Tieni: ${tieni.map(t=>`${n(t.card.valore)} di ${t.card.seme}`).join(" · ")}`;

  const el = document.getElementById("aiResult");
  el.textContent = testo;
  el.className = "ai-result" + (butta.reasons.some(r=>r.includes("rischio")) ? " warn" : "");
}

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 2000);
}

function save(){
  localStorage.setItem("scopa_cards",   JSON.stringify(cards));
  localStorage.setItem("scopa_history", JSON.stringify(history));
}

function load(){
  const c = JSON.parse(localStorage.getItem("scopa_cards"));
  const h = JSON.parse(localStorage.getItem("scopa_history"));
  if(c){ cards=c; history=h||[]; } else { createDeck(); }
}

document.getElementById("aiBtn").onclick      = openAI;
document.getElementById("closePanel").onclick = closeAI;

document.getElementById("clearHand").onclick = () => {
  selectedHand = [];
  renderPicker();
  document.getElementById("aiResult").classList.add("hidden");
};

document.getElementById("toggleView").onclick = () => {
  showOnlyRemaining = !showOnlyRemaining;
  document.getElementById("toggleView").textContent =
    showOnlyRemaining ? "👁 Mostra tutte" : "👁 Solo rimaste";
  renderCards();
};

document.getElementById("undoBtn").onclick = () => {
  const last = history.pop();
  if(!last) return;
  const c = cards.find(x => x.id===last);
  if(c) c.used = false;
  save(); updateStats(); renderCards();
};

document.getElementById("resetBtn").onclick = () => {
  if(confirm("Nuova partita?")){ localStorage.clear(); location.reload(); }
};

load();
updateStats();
renderCards();
