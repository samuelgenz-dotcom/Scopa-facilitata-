const semi = [
    {nome:"Denari", classe:"denari"},
    {nome:"Coppe", classe:"coppe"},
    {nome:"Bastoni", classe:"bastoni"},
    {nome:"Spade", classe:"spade"}
];

let cards = [];
let history = [];
let showOnlyRemaining = false;

const container = document.getElementById("cardsContainer");
const historyList = document.getElementById("historyList");

// -------------------
// CREA MAZZO
// -------------------
function createDeck(){

    cards = [];

    semi.forEach(s => {
        for(let v=1; v<=10; v++){
            cards.push({
                id:`${v}-${s.nome}`,
                valore:v,
                seme:s.nome,
                classe:s.classe,
                used:false
            });
        }
    });
}

// -------------------
// RENDER CARDS
// -------------------
function renderCards(){

    container.innerHTML = "";

    cards.forEach(c => {

        if(showOnlyRemaining && c.used) return;

        const div = document.createElement("div");

        div.className = `card ${c.classe}`;
        if(c.used) div.classList.add("used");

        if(c.valore===7 && c.seme==="Denari")
            div.classList.add("settebello");

        div.innerHTML = `
            <div class="value">${c.valore}</div>
            <div class="suit">${c.seme}</div>
        `;

        div.onclick = () => toggleCard(c.id);

        container.appendChild(div);
    });
}

// -------------------
// TOGGLE CARTA
// -------------------
function toggleCard(id){

    const c = cards.find(x => x.id === id);

    c.used = !c.used;

    if(c.used){
        history.push(id);
    } else {
        history = history.filter(h => h !== id);
    }

    save();
    updateStats();
    renderCards();
    renderHistory();
}

// -------------------
// CRONOLOGIA
// -------------------
function renderHistory(){

    historyList.innerHTML = "";

    history.forEach((h,i) => {

        const li = document.createElement("li");
        li.textContent = `${i+1}. ${h}`;

        li.onclick = () => undo(h);

        historyList.appendChild(li);
    });
}

// -------------------
// UNDO
// -------------------
function undo(id){

    const c = cards.find(x => x.id === id);

    if(c) c.used = false;

    history = history.filter(h => h !== id);

    save();
    updateStats();
    renderCards();
    renderHistory();
}

// -------------------
// STATISTICHE + AI
// -------------------
function updateStats(){

    const used = cards.filter(c => c.used);
    const rimaste = 40 - used.length;

    const denari = cards.filter(c => c.seme==="Denari" && !c.used).length;
    const sette = cards.filter(c => c.valore===7 && !c.used).length;
    const assi = cards.filter(c => c.valore===1 && !c.used).length;
    const figure = cards.filter(c => c.valore>=8 && !c.used).length;

    const setteBello = cards.find(c => c.valore===7 && c.seme==="Denari");

    // UI base
    document.getElementById("uscite").textContent = used.length;
    document.getElementById("rimaste").textContent = rimaste;

    document.getElementById("denari").textContent = denari;
    document.getElementById("sette").textContent = sette;
    document.getElementById("assi").textContent = assi;
    document.getElementById("figure").textContent = figure;

    document.getElementById("settebello").textContent =
        setteBello && setteBello.used ? "🔴" : "🟢";

    // -------------------
    // PROBABILITÀ
    // -------------------
    document.getElementById("probDenari").textContent =
        rimaste ? ((denari/rimaste)*100).toFixed(1)+"%" : "0%";

    document.getElementById("probSette").textContent =
        rimaste ? ((sette/rimaste)*100).toFixed(1)+"%" : "0%";

    document.getElementById("probAsso").textContent =
        rimaste ? ((assi/rimaste)*100).toFixed(1)+"%" : "0%";

    document.getElementById("probFigura").textContent =
        rimaste ? ((figure/rimaste)*100).toFixed(1)+"%" : "0%";

    document.getElementById("probSettebello").textContent =
        rimaste ? ((setteBello && !setteBello.used ? 1 : 0)/rimaste*100).toFixed(1)+"%" : "0%";

    // -------------------
    // 🧠 AI SCOPA PRO
    // -------------------

    const remaining = cards.filter(c => !c.used);

    const strong = remaining.filter(c =>
        c.valore===7 || c.valore===1 || c.seme==="Denari"
    );

    const ratio = strong.length / (remaining.length || 1);

    let advantage = "🟢";
    let enemy = "Bassa";
    let ai7 = "-";

    if(ratio > 0.45){
        advantage = "🔴";
        enemy = "Alta";
    }
    else if(ratio > 0.25){
        advantage = "🟡";
        enemy = "Media";
    }
    else{
        advantage = "🟢";
        enemy = "Bassa";
    }

    if(setteBello && !setteBello.used){
        const p = Math.min(90, strong.length * 8);
        ai7 = `Prob avversari 7 Bello: ${p.toFixed(0)}%`;
    } else {
        ai7 = "7 Bello già uscito";
    }

    document.getElementById("aiAdvantage").textContent = advantage;
    document.getElementById("aiEnemyStrength").textContent = enemy;
    document.getElementById("aiSevenBello").textContent = ai7;
}

// -------------------
// SAVE / LOAD
// -------------------
function save(){
    localStorage.setItem("scopa_cards", JSON.stringify(cards));
    localStorage.setItem("scopa_history", JSON.stringify(history));
}

function load(){

    const c = JSON.parse(localStorage.getItem("scopa_cards"));
    const h = JSON.parse(localStorage.getItem("scopa_history"));

    if(c){
        cards = c;
        history = h || [];
    } else {
        createDeck();
    }
}

// -------------------
// BOTTONI
// -------------------
document.getElementById("toggleView").onclick = () => {
    showOnlyRemaining = !showOnlyRemaining;
    document.getElementById("toggleView").textContent =
        showOnlyRemaining ? "👁 Mostra tutte" : "👁 Solo carte rimaste";
    renderCards();
};

document.getElementById("undoBtn").onclick = () => {

    const last = history.pop();

    if(!last) return;

    const c = cards.find(x => x.id === last);

    if(c) c.used = false;

    save();
    updateStats();
    renderCards();
    renderHistory();
};

document.getElementById("resetBtn").onclick = () => {
    localStorage.clear();
    location.reload();
};

// -------------------
load();
updateStats();
renderCards();
renderHistory();
