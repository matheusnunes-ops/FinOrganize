const categories = {
  income: ["💰 Trabalho/Renda","📈 Investimentos","🎁 Presente recebido","✏️ Outra entrada"],
  expense: ["🍔 Alimentação","🚗 Transporte","🏠 Moradia","💊 Saúde","📚 Educação","🎮 Lazer","🛍️ Compras","🎁 Presentes","🧾 Contas","🛡️ Reserva de emergência","📈 Investimentos","✏️ Outra despesa"]
};
const $ = id => document.getElementById(id);
const money = n => Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const today = () => new Date().toISOString().slice(0,10);
let transactions = JSON.parse(localStorage.getItem("finorganize_transactions") || "[]");
let balances = JSON.parse(localStorage.getItem("finorganize_balances") || '{"bank":0,"cash":0}');
let toastTimer;

function save(){localStorage.setItem("finorganize_transactions",JSON.stringify(transactions));localStorage.setItem("finorganize_balances",JSON.stringify(balances));}
function monthItems(){const m=today().slice(0,7);return transactions.filter(t=>t.date.slice(0,7)===m);}
function sum(items,type){return items.filter(t=>t.type===type).reduce((a,t)=>a+t.amount,0);}
function showToast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2200);}
function txNode(t){
 const div=document.createElement("div");div.className="transaction";
 const cat=t.category||"Movimentação";const emoji=cat.split(" ")[0];
 const title=t.description||cat.slice(emoji.length).trim()||"Lançamento";
 const date=new Date(t.date+"T12:00:00").toLocaleDateString("pt-BR");
 div.innerHTML=`<div class="tx-icon">${emoji}</div><div class="tx-info"><strong></strong><small></small></div><div class="tx-value ${t.type}">${t.type==="income"?"+":"−"} ${money(t.amount)}</div>`;
 div.querySelector(".tx-info strong").textContent=title;div.querySelector(".tx-info small").textContent=`${cat} · ${date}`;
 return div;
}
function renderList(target,items,empty){
 const el=$(target);el.innerHTML="";
 if(!items.length){el.className="transaction-list empty-state";el.textContent=empty;return;}
 el.className="transaction-list";items.forEach(t=>el.appendChild(txNode(t)));
}
function render(){
 $("bankBalance").textContent=money(balances.bank);$("cashBalance").textContent=money(balances.cash);
 $("totalBalance").textContent=money(balances.bank+balances.cash);
 const m=monthItems();$("monthIncome").textContent=money(sum(m,"income"));$("monthExpense").textContent=money(sum(m,"expense"));
 const sorted=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
 renderList("recentList",sorted.slice(0,4),"Seus lançamentos aparecerão aqui.");
 renderList("transactionList",sorted,"Nenhum lançamento cadastrado ainda.");
 const q=$("searchInput").value.toLocaleLowerCase("pt-BR");
 renderList("historyList",sorted.filter(t=>(t.description+" "+t.category+" "+t.reason).toLocaleLowerCase("pt-BR").includes(q)),"Nenhum resultado encontrado.");
 if(transactions.length){const spent=sum(m,"expense");$("nexorMessage").textContent=`Neste mês, você registrou ${money(sum(m,"income"))} em entradas e ${money(spent)} em despesas. Continue registrando suas movimentações para acompanhar melhor seu dinheiro.`;}
}
function openDialog(type="expense"){
 $("typeField").value=type;$("dialogTitle").textContent=type==="income"?"Nova entrada":"Nova despesa";
 $("categoryField").innerHTML=categories[type].map(c=>`<option>${c}</option>`).join("");
 $("dateField").value=today();$("amountField").value="";$("descriptionField").value="";$("reasonField").value="";
 $("transactionDialog").showModal();
}
function switchTab(tab){
 document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.id==="screen-"+tab));
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.go)));
document.querySelectorAll("[data-new]").forEach(b=>b.addEventListener("click",()=>openDialog(b.dataset.new)));
$("quickAdd").addEventListener("click",()=>openDialog("expense"));
$("closeDialog").addEventListener("click",()=>$("transactionDialog").close());
$("searchInput").addEventListener("input",render);
$("transactionForm").addEventListener("submit",e=>{
 e.preventDefault();
 const type=$("typeField").value,amount=Number($("amountField").value);
 if(!Number.isFinite(amount)||amount<=0){showToast("Informe um valor válido.");return;}
 const payment=$("paymentField").value;
 const item={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),type,amount,category:$("categoryField").value,date:$("dateField").value,description:$("descriptionField").value.trim(),reason:$("reasonField").value,payment,createdAt:Date.now()};
 transactions.push(item);balances[payment]+=type==="income"?amount:-amount;
 save();render();$("transactionDialog").close();switchTab("transactions");showToast("Lançamento salvo neste aparelho!");
});
render();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
