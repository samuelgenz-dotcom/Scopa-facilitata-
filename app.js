const semi = [
    {nome:"Denari", classe:"denari"},
    {nome:"Coppe", classe:"coppe"},
    {nome:"Bastoni", classe:"bastoni"},
    {nome:"Spade", classe:"spade"}
];

let cards = [];
let history = [];
let showOnlyRemaining = false;
let myHand = []; // carte in mano al giocatore (max 3 id)

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
                used:false,
                inHand:false
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
        if(c.inHand) div.classList.add("in-hand");
        if(c.valore===7 && c.seme==="Denari") div.classList.add("settebello");

        const label = c.valore === 1 ? "A" :
                      c.valore === 8 ? "F" :
                      c.valore === 9 ? "C" :
                      c.valore === 10 ? "R" : c.valore;

        div.innerHTML = `
            <div class="value">${label}</div>
            <div class="suit">${suitIcon(c.seme)}</div>
            <div class="card-state">${c.inHand ? "✋" : c.used ? "✓" : ""}</div>
        `;

        div.onclick = () => handleCardClick(c.id);
        container.appendChild(div);
    });

    renderMyHand();
}

function suitIcon(nome){
    const map = { Denari:"🪙", Coppe:"🏆", Bastoni:"🌿", Spade:"⚔️" };
    return map[nome] || nome;
}

// -------------------
// CLICK CARTA — cicla tra 3 stati: libera → in mano → uscita → libera
// -------------------
function handleCardClick(id){
    const c = cards.find(x => x.id === id);

    if(!c.used && !c.inHand){
        // libera → metti in mano (max 3)
        const handCount = cards.filter(x => x.inHand).length;
        if(handCount >= 3){
            showToast("Hai già 3 carte in mano!");
            return;
        }
        c.inHand = true;
        myHand.push(id);
        history.push({id, action:"hand"});
    } else if(c.inHand){
        // in mano → uscita
        c.inHand = false;
        c.used = true;
        myHand = myHand.filter(h => h !== id);
        history.push({id, action:"used"});
    } else if(c.used){
        // uscita → libera
        c.used = false;
        history = history.filter(h => h.id !== id);
    }

    save();
    updateStats();
    renderCards();
    renderHistory();
}

// -------------------
// MANO GIOCATORE
// -------------------
function renderMyHand(){
    const section = document.getElementById("myHandCards");
    section.innerHTML = "";

    const handCards = cards.filter(c => c.inHand);

    if(handCards.length === 0){
        section.innerHTML = "<p class='hand-empty'>Clicca una carta per aggiungerla alla tua mano</p>";
        return;
    }

    handCards.forEach(c => {
        const div = document.createElement("div");
        div.className = `card ${c.classe} hand-card`;
        if(c.valore===7 && c.seme==="Denari") div.classList.add("settebello");

        const label = c.valore === 1 ? "A" :
                      c.valore === 8 ? "F" :
                      c.valore === 9 ? "C" :
                      c.valore === 10 ? "R" : c.valore;

        div.innerHTML = `
            <div class="value">${label}</div>
            <div class="suit">${suitIcon(c.seme)}</div>
        `;
        div.onclick = () => handleCardClick(c.id);
        section.appendChild(div);
    });
}

// -------------------
// TOAST
// -------------------
function showToast(msg){
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
}

// -------------------
// CRONOLOGIA
// -------------------
function renderHistory(){
    historyList.innerHTML = "";
    [...history].reverse().forEach((h, i) => {
        const li = document.createElement("li");
        const label = h.action === "hand" ? "✋ In mano" : "✓ Uscita";
        li.textContent = `${h.id} — ${label}`;
        li.onclick = () => undo(h);
        historyList.appendChild(li);
    });
}

// -------------------
// UNDO
// -------------------
function undo(entry){
    const c = cards.find(x => x.id === entry.id);
    if(!c) return;

    if(entry.action === "hand"){
        c.inHand = false;
        myHand = myHand.filter(h => h !== entry.id);
    } else {
        c.used = false;
    }

    history = history.filter(h => !(h.id === entry.id && h.action === entry.action));

    save();
    updateStats();
    renderCards();
    renderHistory();
}

// -------------------
// STATISTICHE + AI
// -------------------
function updateStats(){

    const usedCards    = cards.filter(c => c.used);
    const handCards    = cards.filter(c => c.inHand);
    const knownCards   = cards.filter(c => c.used || c.inHand);

    // Carte che l'avversario può avere = non uscite e non in mano mia
    const unknown      = cards.filter(c => !c.used && !c.inHand);
    const rimaste      = unknown.length;

    // Conteggi nelle carte "ignote" (potenzialmente avversario)
    const denariUnk    = unknown.filter(c => c.seme==="Denari").length;
    const setteUnk     = unknown.filter(c => c.valore===7).length;
    const assiUnk      = unknown.filter(c => c.valore===1).length;
    const figureUnk    = unknown.filter(c => c.valore>=8).length;
    const setteBello   = cards.find(c => c.valore===7 && c.seme==="Denari");

    // UI base
    document.getElementById("uscite").textContent   = usedCards.length;
    document.getElementById("rimaste").textContent  = rimaste;
    document.getElementById("denari").textContent   = denariUnk;
    document.getElementById("sette").textContent    = setteUnk;
    document.getElementById("assi").textContent     = assiUnk;
    document.getElementById("figure").textContent   = figureUnk;

    document.getElementById("settebello").textContent =
        setteBello && setteBello.used ? "🔴" :
        setteBello && setteBello.inHand ? "✋" : "🟢";

    // -------------------
    // PROBABILITÀ AVVERSARIO
    // L'avversario pesca da "unknown" — carte non uscite e non mie
    // Con 2 giocatori l'avversario ha max 3 carte
    // Probabilità che ALMENO UNA delle 3 carte avversario sia X:
    // P(almeno 1) = 1 - C(rimaste-X, 3) / C(rimaste, 3)
    // -------------------
    const enemyHandSize = Math.min(3, rimaste);

    function probAtLeastOne(count, pool, hand){
        if(pool < hand) return count > 0 ? 100 : 0;
        if(count <= 0) return 0;
        if(count >= pool) return 100;
        // P(nessuna) = C(pool-count, hand) / C(pool, hand)
        const pNone = combinations(pool - count, hand) / combinations(pool, hand);
        return ((1 - pNone) * 100);
    }

    function combinations(n, k){
        if(k > n) return 0;
        if(k === 0 || k === n) return 1;
        let result = 1;
        for(let i = 0; i < k; i++){
            result *= (n - i) / (i + 1);
        }
        return result;
    }

    const pDenari  = probAtLeastOne(denariUnk, rimaste, enemyHandSize);
    const pSette   = probAtLeastOne(setteUnk,  rimaste, enemyHandSize);
    const pAsso    = probAtLeastOne(assiUnk,   rimaste, enemyHandSize);
    const pFigura  = probAtLeastOne(figureUnk, rimaste, enemyHandSize);
    const pSB      = setteBello && !setteBello.used && !setteBello.inHand
                     ? probAtLeastOne(1, rimaste, enemyHandSize) : 0;

    document.getElementById("probDenari").textContent    = pDenari.toFixed(1)+"%";
    document.getElementById("probSette").textContent     = pSette.toFixed(1)+"%";
    document.getElementById("probAsso").textContent      = pAsso.toFixed(1)+"%";
    document.getElementById("probFigura").textContent    = pFigura.toFixed(1)+"%";
    document.getElementById("probSettebello").textContent= pSB.toFixed(1)+"%";

    // -------------------
    // 🧠 AI SUGGERIMENTO CARTA
    // -------------------
    const suggestion = suggestCard(handCards, unknown, rimaste);
    document.getElementById("aiSuggestion").textContent = suggestion.text;
    document.getElementById("aiSuggestion").className = "ai-suggestion " + suggestion.level;

    // Forza avversario
    const strongUnk = unknown.filter(c =>
        c.valore===7 || c.valore===1 || c.seme==="Denari"
    );
    const ratio = strongUnk.length / (rimaste || 1);
    let enemy = "Bassa 🟢";
    if(ratio > 0.45) enemy = "Alta 🔴";
    else if(ratio > 0.25) enemy = "Media 🟡";

    document.getElementById("aiAdvantage").textContent    = ratio > 0.45 ? "🔴" : ratio > 0.25 ? "🟡" : "🟢";
    document.getElementById("aiEnemyStrength").textContent = enemy;

    const ai7 = setteBello && !setteBello.used && !setteBello.inHand
        ? `Prob avversario: ${pSB.toFixed(0)}%`
        : setteBello && setteBello.inHand ? "✋ Ce l'hai tu!"
        : "Già uscito 🔴";
    document.getElementById("aiSevenBello").textContent = ai7;
}

// -------------------
// 🎯 SUGGERIMENTO CARTA DA GIOCARE
// -------------------
function suggestCard(hand, unknown, rimaste){

    if(hand.length === 0){
        return { text: "Seleziona le tue carte in mano", level: "neutral" };
    }

    let best = null;
    let bestScore = -Infinity;

    hand.forEach(c => {
        let score = 0;
        let reasons = [];

        // 1. Bonus carte importanti da giocare
        if(c.seme === "Denari"){ score += 3; reasons.push("denaro"); }
        if(c.valore === 7){ score += 4; reasons.push("sette"); }
        if(c.valore === 1){ score += 3; reasons.push("asso"); }
        if(c.valore >= 8){ score += 1; reasons.push("figura"); }

        // 2. Penalizza se l'avversario potrebbe catturarla (valore basso = rischio)
        const preso = unknown.filter(u => u.valore === c.valore).length;
        if(rimaste > 0){
            const rischioCattura = preso / rimaste;
            // se è una carta pregiata e alta prob che l'avversario la prenda, abbassa il punteggio
            if(rischioCattura > 0.3 && (c.seme==="Denari" || c.valore===7 || c.valore===1)){
                score -= 2;
                reasons.push("⚠️rischio");
            }
        }

        // 3. Bonus se la carta è "sicura" (nessuno può prenderla facilmente)
        if(preso === 0){ score += 2; reasons.push("sicura"); }

        // 4. Bonus strategico: gioca le figure quando non ci sono pericoli
        if(c.valore >= 8 && preso === 0){ score += 1; }

        if(score > bestScore){
            bestScore = score;
            best = { card: c, reasons };
        }
    });

    if(!best) return { text: "Nessuna carta in mano", level: "neutral" };

    const label = best.card.valore === 1  ? "Asso" :
                  best.card.valore === 8  ? "Fante" :
                  best.card.valore === 9  ? "Cavallo" :
                  best.card.valore === 10 ? "Re" : best.card.valore;

    const seme = best.card.seme;
    const warning = best.reasons.includes("⚠️rischio") ? " ⚠️ Attenzione al rischio!" : "";

    return {
        text: `Gioca: ${label} di ${seme}${warning}`,
        level: best.reasons.includes("⚠️rischio") ? "warn" : "good"
    };
}

// -------------------
// SAVE / LOAD
// -------------------
function save(){
    localStorage.setItem("scopa_cards",  JSON.stringify(cards));
    localStorage.setItem("scopa_history", JSON.stringify(history));
    localStorage.setItem("scopa_hand",   JSON.stringify(myHand));
}

function load(){
    const c = JSON.parse(localStorage.getItem("scopa_cards"));
    const h = JSON.parse(localStorage.getItem("scopa_history"));
    const hd = JSON.parse(localStorage.getItem("scopa_hand"));

    if(c){
        cards   = c;
        history = h || [];
        myHand  = hd || [];
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

    const c = cards.find(x => x.id === last.id);
    if(c){
        if(last.action === "hand"){ c.inHand = false; myHand = myHand.filter(h => h !== last.id); }
        else { c.used = false; }
    }

    save();
    updateStats();
    renderCards();
    renderHistory();
};

document.getElementById("resetBtn").onclick = () => {
    if(confirm("Inizia una nuova partita?")){
        localStorage.clear();
        location.reload();
    }
};

// -------------------
load();
updateStats();
renderCards();
renderHistory();
