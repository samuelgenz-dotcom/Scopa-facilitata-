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

function createDeck(){

    semi.forEach(seme=>{

        for(let valore=1; valore<=10; valore++){

            cards.push({
                id:`${valore}-${seme.nome}`,
                valore,
                seme:seme.nome,
                classe:seme.classe,
                used:false
            });

        }

    });

}

function renderCards(){

    container.innerHTML="";

    cards.forEach(card=>{

        if(showOnlyRemaining && card.used) return;

        const div=document.createElement("div");

        div.className=`card ${card.classe}`;

        if(card.used)
            div.classList.add("used");

        if(card.valore===7 && card.seme==="Denari")
            div.classList.add("settebello");

        div.innerHTML=`
            <div class="value">${card.valore}</div>
            <div class="suit">${card.seme}</div>
        `;

        div.onclick=()=>toggleCard(card.id);

        container.appendChild(div);

    });

}

function toggleCard(id){

    const card=cards.find(c=>c.id===id);

    card.used=!card.used;

    if(card.used){
        history.push(card.id);
    }

    save();
    updateStats();
    renderCards();
    renderHistory();
}

function renderHistory(){

    historyList.innerHTML="";

    history.forEach((item,index)=>{

        const li=document.createElement("li");

        li.textContent=(index+1)+". "+item;

        li.onclick=()=>undoSpecific(item);

        historyList.appendChild(li);

    });

}

function undoSpecific(id){

    const card=cards.find(c=>c.id===id);

    card.used=false;

    history=history.filter(x=>x!==id);

    save();
    updateStats();
    renderCards();
    renderHistory();
}

function updateStats(){

    const used=cards.filter(c=>c.used);

    document.getElementById("uscite").textContent=used.length;
    document.getElementById("rimaste").textContent=40-used.length;

    document.getElementById("denari").textContent=
        cards.filter(c=>c.seme==="Denari" && !c.used).length;

    document.getElementById("sette").textContent=
        cards.filter(c=>c.valore===7 && !c.used).length;

    document.getElementById("assi").textContent=
        cards.filter(c=>c.valore===1 && !c.used).length;

    document.getElementById("figure").textContent=
        cards.filter(c=>c.valore>=8 && !c.used).length;

    const setteBello=
        cards.find(c=>c.valore===7 && c.seme==="Denari");

    document.getElementById("settebello").textContent=
        setteBello.used ? "🔴" : "🟢";
}

function save(){

    localStorage.setItem("scopa_cards",JSON.stringify(cards));
    localStorage.setItem("scopa_history",JSON.stringify(history));

}

function load(){

    const savedCards=
        JSON.parse(localStorage.getItem("scopa_cards"));

    const savedHistory=
        JSON.parse(localStorage.getItem("scopa_history"));

    if(savedCards){
        cards=savedCards;
        history=savedHistory || [];
    }else{
        createDeck();
    }

}

document.getElementById("toggleView").onclick=()=>{

    showOnlyRemaining=!showOnlyRemaining;

    document.getElementById("toggleView").textContent=
        showOnlyRemaining
        ? "👁 Mostra tutte"
        : "👁 Solo carte rimaste";

    renderCards();

};

document.getElementById("undoBtn").onclick=()=>{

    const last=history.pop();

    if(!last) return;

    const card=cards.find(c=>c.id===last);

    card.used=false;

    save();
    updateStats();
    renderCards();
    renderHistory();

};

document.getElementById("resetBtn").onclick=()=>{

    localStorage.clear();
    location.reload();

};

load();
updateStats();
renderCards();
renderHistory();
