const $=id=>document.getElementById(id),money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),today=()=>new Date().toISOString().slice(0,10);
const cats={income:["💰 Trabalho/Renda","📈 Investimentos","🎁 Presente recebido","✏️ Outra entrada"],expense:["🍔 Alimentação","🚗 Transporte","🏠 Moradia","💊 Saúde","📚 Educação","🎮 Lazer","🛍️ Compras","🎁 Presentes","🧾 Contas","🛡️ Reserva de emergência","📈 Investimentos","✏️ Outra despesa"]};
let transactions=JSON.parse(localStorage.getItem("finorganize_transactions")||"[]"),balances=JSON.parse(localStorage.getItem("finorganize_balances")||'{"bank":0,"cash":0}'),goals=JSON.parse(localStorage.getItem("finorganize_goals")||"[]"),emergency=JSON.parse(localStorage.getItem("finorganize_emergency")||'{"target":0,"saved":0,"created":false}');
function save(){localStorage.setItem("finorganize_transactions",JSON.stringify(transactions));localStorage.setItem("finorganize_balances",JSON.stringify(balances));localStorage.setItem("finorganize_goals",JSON.stringify(goals));localStorage.setItem("finorganize_emergency",JSON.stringify(emergency))}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function sum(a,t){return a.filter(x=>x.type===t).reduce((n,x)=>n+x.amount,0)}
function txNode(t,actions=false){let d=document.createElement("div");d.className="transaction";let cat=t.category||"Movimentação",emoji=cat.split(" ")[0];d.innerHTML=`<div class="tx-icon">${emoji}</div><div class="tx-info"><strong></strong><small></small></div><div class="tx-value ${t.type}">${t.type==="income"?"+":"−"} ${money(t.amount)}</div>${actions?'<div class="tx-actions"><button data-edit>Editar</button><button data-delete>Excluir</button></div>':""}`;d.querySelector("strong").textContent=t.description||cat.slice(emoji.length);d.querySelector("small").textContent=cat+" · "+new Date(t.date+"T12:00:00").toLocaleDateString("pt-BR")+" · "+(t.payment==="cash"?"Espécie":"Banco");if(actions){d.querySelector("[data-edit]").onclick=()=>editTx(t.id);d.querySelector("[data-delete]").onclick=()=>deleteTx(t.id)}return d}
function list(id,arr,msg,actions=false){let el=$(id);el.innerHTML="";if(!arr.length){el.className="transaction-list empty-state";el.textContent=msg;return}el.className="transaction-list";arr.forEach(t=>el.append(txNode(t,actions)))}
function goalCard(g,isEmergency=false){let c=document.createElement("article"),pct=g.target?Math.min(100,g.saved/g.target*100):0;c.className="goal-card"+(isEmergency?" emergency":"");c.innerHTML=`<div class="goal-card-top"><div><h3></h3><small></small></div><b class="goal-amount"></b></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="goal-meta"><span>${pct.toFixed(0)}% concluído</span><span>Faltam ${money(Math.max(0,g.target-g.saved))}</span></div><p class="goal-description"></p><div class="goal-card-actions"><button data-action="deposit">＋ Guardar</button><button data-action="withdraw">Retirar</button>${isEmergency?"":'<button data-action="delete">Excluir</button>'}</div>`;c.querySelector("h3").textContent=g.name;c.querySelector("small").textContent=`${money(g.saved)} de ${money(g.target)}${g.deadline?" · Prazo "+new Date(g.deadline+"T12:00:00").toLocaleDateString("pt-BR"):""}`;c.querySelector(".goal-amount").textContent=money(g.saved);c.querySelector(".goal-description").textContent=g.description||"";c.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(b.dataset.action==="delete"){if(confirm("Excluir esta meta? O valor guardado será devolvido ao banco.")){balances.bank+=g.saved;goals=goals.filter(x=>x.id!==g.id);save();render();toast("Meta excluída.")}}else openMovement(g.id,b.dataset.action,isEmergency)});return c}
function filteredHistory(){let q=$("searchInput").value.toLowerCase().trim(),type=$("filterType").value,pay=$("filterPayment").value,from=$("filterFrom").value,to=$("filterTo").value,cat=$("filterCategory").value;return [...transactions].filter(t=>(!q||(t.description+" "+t.category+" "+t.reason).toLowerCase().includes(q))&&(!type||t.type===type)&&(!pay||t.payment===pay)&&(!from||t.date>=from)&&(!to||t.date<=to)&&(!cat||t.category===cat)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||b.id)-(a.createdAt||a.id))}
function updateCategoryFilter(){let sel=$("filterCategory"),current=sel.value,all=[...new Set(transactions.map(t=>t.category).filter(Boolean))].sort();sel.innerHTML='<option value="">Todas as categorias</option>'+all.map(c=>`<option></option>`).join("");[...sel.options].slice(1).forEach((o,i)=>o.textContent=all[i]);if(all.includes(current))sel.value=current}
function render(){let m=transactions.filter(t=>t.date.slice(0,7)===today().slice(0,7)),sorted=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||b.id)-(a.createdAt||a.id));$("bankBalance").textContent=money(balances.bank);$("cashBalance").textContent=money(balances.cash);$("totalBalance").textContent=money(balances.bank+balances.cash);$("monthIncome").textContent=money(sum(m,"income"));$("monthExpense").textContent=money(sum(m,"expense"));list("recentList",sorted.slice(0,4),"Seus lançamentos aparecerão aqui.");list("transactionList",sorted,"Nenhum lançamento cadastrado ainda.");updateCategoryFilter();let hist=filteredHistory();list("historyList",hist,"Nenhum resultado encontrado.",true);$("resultsCount").textContent=`${hist.length} ${hist.length===1?"movimentação encontrada":"movimentações encontradas"}`;$("nexorMessage").textContent=`Neste mês, você registrou ${money(sum(m,"income"))} em entradas e ${money(sum(m,"expense"))} em despesas.`;let gl=$("goalsList");gl.innerHTML="";gl.className=goals.length?"goal-list":"goal-list goal-empty";if(!goals.length)gl.textContent="Você ainda não criou metas pessoais.";goals.forEach(g=>gl.append(goalCard(g)));let ec=$("emergencyCard");ec.innerHTML="";ec.append(goalCard({name:"Reserva de emergência",target:emergency.target||0,saved:emergency.saved||0,description:"Uma proteção para imprevistos."},true))}
function tab(t){document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id==="screen-"+t));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.tab===t));if(t==="home"&&typeof updateNexorBillAlert==="function")updateNexorBillAlert()}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>tab(b.dataset.tab));document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>tab(b.dataset.go));
function openTx(type,tx=null){$("typeField").value=type;$("dialogTitle").textContent=tx?"Editar lançamento":type==="income"?"Nova entrada":"Nova despesa";$("transactionEyebrow").textContent=tx?"CORRIGIR REGISTRO":"NOVO REGISTRO";$("saveTransactionBtn").textContent=tx?"Salvar alterações":"Salvar lançamento";$("categoryField").innerHTML=cats[type].map(x=>`<option>${x}</option>`).join("");$("dateField").value=tx?.date||today();$("amountField").value=tx?.amount??"";$("descriptionField").value=tx?.description||"";$("reasonField").value=tx?.reason||"";$("paymentField").value=tx?.payment||"bank";$("categoryField").value=tx?.category||cats[type][0];$("editingId").value=tx?String(tx.id):"";$("transactionDialog").showModal()}
function editTx(id){let tx=transactions.find(t=>String(t.id)===String(id));if(tx)openTx(tx.type,tx)}
function applyBalance(tx,sign){let key=tx.payment==="cash"?"cash":"bank";balances[key]+=sign*(tx.type==="income"?tx.amount:-tx.amount)}
function deleteTx(id){let tx=transactions.find(t=>String(t.id)===String(id));if(!tx)return;if(!confirm("Excluir este lançamento? O saldo da conta será ajustado."))return;applyBalance(tx,-1);transactions=transactions.filter(t=>String(t.id)!==String(id));save();render();toast("Lançamento excluído e saldo atualizado.")}
$("quickAdd").onclick=()=>openTx("expense");$("closeDialog").onclick=()=>$("transactionDialog").close();document.querySelectorAll("[data-new]").forEach(b=>b.onclick=()=>openTx(b.dataset.new));
["searchInput","filterType","filterPayment","filterFrom","filterTo","filterCategory"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",()=>{let hist=filteredHistory();list("historyList",hist,"Nenhum resultado encontrado.",true);$("resultsCount").textContent=`${hist.length} ${hist.length===1?"movimentação encontrada":"movimentações encontradas"}`}));$("clearFilters").onclick=()=>{["searchInput","filterType","filterPayment","filterFrom","filterTo","filterCategory"].forEach(id=>$(id).value="");render()};
$("transactionForm").onsubmit=e=>{e.preventDefault();let amount=Number($("amountField").value),type=$("typeField").value,payment=$("paymentField").value,id=$("editingId").value;if(!(amount>0))return toast("Informe um valor válido.");let tx={id:id||String(Date.now()),type,amount,category:$("categoryField").value,date:$("dateField").value,description:$("descriptionField").value.trim(),reason:$("reasonField").value,payment,createdAt:id?(transactions.find(t=>String(t.id)===id)?.createdAt||Date.now()):Date.now()};if(id){let index=transactions.findIndex(t=>String(t.id)===id);if(index<0)return toast("Lançamento não encontrado.");applyBalance(transactions[index],-1);transactions[index]=tx;applyBalance(tx,1)}else{transactions.push(tx);applyBalance(tx,1)}save();render();$("transactionDialog").close();tab("transactions");toast(id?"Lançamento atualizado!":"Lançamento salvo!")};
function openGoalDialog(isEmergency=false){$("goalDialogTitle").textContent=isEmergency?"Configurar reserva de emergência":"Criar meta";$("goalName").value=isEmergency?"Reserva de emergência":"";$("goalName").readOnly=isEmergency;$("goalTarget").value=isEmergency?(emergency.target||""):"";$("goalDeadline").value="";$("goalDescription").value=isEmergency?"Proteção para imprevistos.":"";$("goalForm").dataset.emergency=isEmergency?"true":"false";$("goalDialog").showModal()}
$("addGoalBtn").onclick=()=>openGoalDialog();$("addEmergencyBtn").onclick=()=>{if(emergency.created){toast("Reserva já configurada. Use Guardar ou Retirar.");return}openGoalDialog(true)};$("closeGoalDialog").onclick=()=>$("goalDialog").close();
$("goalForm").onsubmit=e=>{e.preventDefault();let target=Number($("goalTarget").value),isEm=$("goalForm").dataset.emergency==="true";if(!(target>0))return toast("Informe um valor desejado válido.");let g={id:String(Date.now()),name:$("goalName").value.trim(),target,saved:0,deadline:$("goalDeadline").value,description:$("goalDescription").value.trim()};if(isEm){emergency.target=target;emergency.created=true}else goals.push(g);save();render();$("goalDialog").close();toast(isEm?"Reserva configurada!":"Meta criada!")};
function openMovement(id,type,isEm){$("movementId").value=id;$("movementType").value=type;$("movementTitle").textContent=type==="deposit"?"Guardar dinheiro":"Retirar dinheiro";$("movementSubmit").textContent=type==="deposit"?"Confirmar depósito":"Confirmar retirada";$("movementAmount").value="";$("movementForm").dataset.emergency=isEm?"true":"false";$("movementDialog").showModal()}
$("closeMovementDialog").onclick=()=>$("movementDialog").close();
$("movementForm").onsubmit=e=>{e.preventDefault();let amount=Number($("movementAmount").value),type=$("movementType").value,src=$("movementSource").value,isEm=$("movementForm").dataset.emergency==="true",g=isEm?emergency:goals.find(x=>x.id===$("movementId").value);if(!(amount>0))return toast("Informe um valor válido.");if(type==="deposit"){if(balances[src]<amount)return toast("Saldo insuficiente nessa origem.");balances[src]-=amount;g.saved+=amount}else{if(g.saved<amount)return toast("Valor guardado insuficiente.");g.saved-=amount;balances[src]+=amount}save();render();$("movementDialog").close();toast(type==="deposit"?"Dinheiro guardado!":"Retirada registrada!")};
render();if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});

// ===== Versão 4: Contas, compromissos e calendário financeiro =====
let bills = JSON.parse(localStorage.getItem("finorganize_bills") || "[]");

function saveBills(){
  localStorage.setItem("finorganize_bills", JSON.stringify(bills));
}
function localDateString(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function dateBR(s){
  if(!s) return "Data não informada";
  const [y,m,d]=s.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("pt-BR");
}
function monthAdd(dateString, months){
  const [y,m,d]=dateString.split("-").map(Number);
  const first=new Date(y,m-1+months,1);
  const last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
  return localDateString(new Date(first.getFullYear(),first.getMonth(),Math.min(d,last)));
}
function billIsOverdue(b){
  return b.status!=="paid" && b.dueDate < localDateString();
}
function updateNexorBillAlert(){
  updateNexorBillAlert();
}
function renderBills(){
  const listEl=$("billList");
  const todayStr=localDateString();
  const pending=bills.filter(b=>b.status!=="paid");
  const overdue=pending.filter(b=>billIsOverdue(b));
  $("pendingBillsTotal").textContent=money(pending.reduce((s,b)=>s+b.amount,0));
  $("overdueBillsTotal").textContent=money(overdue.reduce((s,b)=>s+b.amount,0));
  $("calendarPeriod").textContent=new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const sorted=[...bills].sort((a,b)=>{
    if(a.status!==b.status) return a.status==="paid"?1:-1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  listEl.innerHTML="";
  if(!sorted.length){
    listEl.className="bill-list empty-state";
    listEl.textContent="Nenhuma conta ou compra parcelada cadastrada.";
    updateNexorBillAlert();
    return;
  }
  listEl.className="bill-list";
  sorted.forEach(b=>{
    const card=document.createElement("article");
    card.className="bill-card";
    const overdueFlag=billIsOverdue(b);
    const status=b.status==="paid"?"Pago":overdueFlag?`Atrasado há ${Math.max(1,Math.floor((new Date(todayStr+"T12:00:00")-new Date(b.dueDate+"T12:00:00"))/86400000))} dia(s)`:"Pendente";
    const installment=b.installmentGroup?` · Parcela ${b.installmentNo}/${b.installmentCount}`:"";
    const account=b.payment==="cash"?"Dinheiro em espécie":"Banco";
    card.innerHTML=`<div class="bill-top"><div><div class="bill-name"></div><div class="bill-meta"></div><span class="bill-status"></span></div><div class="bill-amount"></div></div><div class="bill-actions"></div>`;
    card.querySelector(".bill-name").textContent=b.name;
    card.querySelector(".bill-meta").textContent=`Vencimento: ${dateBR(b.dueDate)}${installment} · ${account}${b.note?" · "+b.note:""}`;
    card.querySelector(".bill-status").textContent=status;
    if(b.status==="paid") card.querySelector(".bill-status").classList.add("paid");
    else if(overdueFlag) card.querySelector(".bill-status").classList.add("overdue");
    card.querySelector(".bill-amount").textContent=money(b.amount);
    const actions=card.querySelector(".bill-actions");
    if(b.status!=="paid"){
      const pay=document.createElement("button");
      pay.className="pay-bill";pay.textContent="Marcar como paga";
      pay.onclick=()=>openBillPayment(b.id);
      actions.append(pay);
      const del=document.createElement("button");
      del.className="delete-bill";del.textContent="Excluir";
      del.onclick=()=>deleteBill(b.id);
      actions.append(del);
    } else {
      const paidInfo=document.createElement("span");
      paidInfo.className="bill-meta";
      paidInfo.textContent=`Pago em ${dateBR(b.paidDate)} · lançamento registrado no histórico`;
      actions.append(paidInfo);
    }
    listEl.append(card);
  });
  updateNexorBillAlert();
}
function openBillDialog(){
  $("billForm").reset();
  $("billDueDate").value=localDateString();
  $("billKind").value="single";
  $("installmentFields").classList.remove("visible");
  $("billDialog").showModal();
}
$("addBillBtn").onclick=openBillDialog;
$("closeBillDialog").onclick=()=>$("billDialog").close();
$("billKind").onchange=()=>{
  const isInstallment=$("billKind").value==="installment";
  $("installmentFields").classList.toggle("visible",isInstallment);
  $("billAmount").previousElementSibling.textContent=isInstallment?"Valor total da compra (R$)":"Valor da conta (R$)";
  $("billAmount").required=true;
  $("installmentAmount").required=isInstallment;
  $("installmentCount").required=isInstallment;
};
$("billForm").onsubmit=e=>{
  e.preventDefault();
  const kind=$("billKind").value,name=$("billName").value.trim();
  const total=Number($("billAmount").value),dueDate=$("billDueDate").value;
  const payment=$("billPayment").value,note=$("billNote").value.trim();
  if(!name||!(total>0)||!dueDate) return toast("Confira os dados do compromisso.");
  if(kind==="single"){
    bills.push({id:"bill-"+Date.now(),name,amount:total,dueDate,payment,note,status:"pending",createdAt:Date.now()});
  }else{
    const installmentAmount=Number($("installmentAmount").value);
    const count=Number($("installmentCount").value);
    if(!(installmentAmount>0)||!Number.isInteger(count)||count<2||count>120) return toast("Confira o valor e a quantidade de parcelas.");
    if(installmentAmount*count+0.001<total) return toast("A soma das parcelas não pode ser menor que o valor total da compra.");
    const group="parcelamento-"+Date.now();
    for(let i=0;i<count;i++){
      bills.push({
        id:`${group}-${i+1}`,groupId:group,installmentGroup:true,installmentNo:i+1,installmentCount:count,
        name,amount:installmentAmount,dueDate:monthAdd(dueDate,i),payment,note,status:"pending",createdAt:Date.now()
      });
    }
  }
  saveBills();renderBills();$("billDialog").close();toast(kind==="installment"?"Parcelamento cadastrado!":"Conta cadastrada!");
};
function openBillPayment(id){
  const b=bills.find(x=>x.id===id);
  if(!b||b.status==="paid") return;
  $("billPayId").value=b.id;
  $("billPayTitle").textContent="Pagar compromisso";
  $("billPayDescription").textContent=`${b.name} · ${b.installmentGroup?`Parcela ${b.installmentNo}/${b.installmentCount} · `:""}Vencimento ${dateBR(b.dueDate)}. O pagamento será registrado no histórico e descontado do saldo escolhido.`;
  $("billPayAmount").value=b.amount.toFixed(2);
  $("billPaySource").value=b.payment||"bank";
  $("billPayDate").value=localDateString();
  $("billPayDialog").showModal();
}
$("closeBillPayDialog").onclick=()=>$("billPayDialog").close();
$("billPayForm").onsubmit=e=>{
  e.preventDefault();
  const id=$("billPayId").value,b=bills.find(x=>x.id===id);
  const amount=Number($("billPayAmount").value),source=$("billPaySource").value,payDate=$("billPayDate").value;
  if(!b||b.status==="paid") return toast("Este compromisso já foi pago ou não existe.");
  if(!(amount>0)||!payDate) return toast("Informe um valor e uma data válidos.");
  if(balances[source]<amount) return toast("Saldo insuficiente na conta escolhida.");
  // Guarda o identificador no lançamento para impedir duplicidade e permitir rastreio.
  const txId="bill-payment-"+b.id;
  if(transactions.some(t=>t.id===txId)) return toast("Este pagamento já consta no histórico.");
  const tx={id:txId,type:"expense",amount,category:"🧾 Contas",date:payDate,description:b.name+(b.installmentGroup?` — parcela ${b.installmentNo}/${b.installmentCount}`:""),reason:"Planejado",payment:source,createdAt:Date.now(),linkedBillId:b.id};
  transactions.push(tx);
  balances[source]-=amount;
  b.status="paid";b.paidDate=payDate;b.paidAmount=amount;b.payment=source;b.transactionId=txId;
  save();saveBills();render();renderBills();
  $("billPayDialog").close();tab("calendar");toast("Pagamento registrado no histórico e no saldo!");
};
function deleteBill(id){
  const b=bills.find(x=>x.id===id);
  if(!b||b.status==="paid") return;
  if(!confirm("Excluir este compromisso pendente?")) return;
  bills=bills.filter(x=>x.id!==id);
  saveBills();renderBills();toast("Compromisso excluído.");
}
// A tela inicial mostra alertas úteis de vencimentos próximos e atrasados.
const originalRender=render;
render=function(){
  originalRender();
  renderBills();
  updateNexorBillAlert();
};
render();
