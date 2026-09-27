(()=>{
  const legacyInput=document.getElementById('packagePaidAmount');
  const legacySave=document.getElementById('savePackagePaid');
  const msg=document.getElementById('costSavedMessage');
  if(!legacyInput||!legacySave||!window.weddingSupabase)return;

  const card=legacyInput.closest('.card');
  if(!card)return;
  const oldGrid=legacyInput.closest('.form-grid');
  const oldHelp=card.querySelector('p.small');
  if(oldGrid)oldGrid.style.display='none';
  if(oldHelp)oldHelp.style.display='none';

  const wrap=document.createElement('div');
  wrap.innerHTML=`<div class="form-grid"><div class="field"><label for="paymentTarget">Pay against</label><select id="paymentTarget"><option value="">Loading costs…</option></select></div><div class="field"><label for="paymentAmount">Payment amount (£)</label><input id="paymentAmount" type="number" min="0.01" step="0.01" placeholder="0.00"></div><div class="field" style="align-self:end"><button class="btn planner-btn" id="saveAllocatedPayment" type="button">Save payment</button></div><div class="field full"><span id="paymentTargetHint" class="small">Choose the cost this payment should reduce.</span></div></div>`;
  card.prepend(wrap);

  const target=document.getElementById('paymentTarget');
  const amountInput=document.getElementById('paymentAmount');
  const saveBtn=document.getElementById('saveAllocatedPayment');
  const hint=document.getElementById('paymentTargetHint');
  const BASE_TOTAL=12550;
  const money=v=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(Number(v)||0);
  let costs=[],packagePaid=0;

  async function load(){
    const [cr,sr]=await Promise.all([
      weddingSupabase.from('wedding_costs').select('id,item,estimated_cost,actual_cost,paid_amount').order('sort_order').order('created_at'),
      weddingSupabase.from('wedding_settings').select('setting_value').eq('setting_key','package_paid_amount').maybeSingle()
    ]);
    if(cr.error||sr.error){if(msg)msg.textContent='Could not load payment targets.';return}
    costs=cr.data||[];packagePaid=Math.max(0,Number(sr.data?.setting_value||0));
    target.innerHTML='<option value="">Choose what this payment is for…</option><option value="package">Buckler’s Bliss package</option>'+costs.map(c=>`<option value="${c.id}">${String(c.item||'Cost').replace(/[&<>"']/g,'')}</option>`).join('');
    updateHint();
  }

  function updateHint(){
    if(target.value==='package'){
      hint.textContent=`Paid ${money(packagePaid)} · remaining ${money(Math.max(0,BASE_TOTAL-packagePaid))}`;return;
    }
    const row=costs.find(c=>c.id===target.value);
    if(!row){hint.textContent='Choose the cost this payment should reduce.';return}
    const cost=Number(row.actual_cost??row.estimated_cost??0),paid=Number(row.paid_amount||0);
    hint.textContent=`Paid ${money(paid)} · remaining ${money(Math.max(0,cost-paid))}`;
  }

  target.addEventListener('change',updateHint);
  saveBtn.addEventListener('click',async()=>{
    const payment=Number(amountInput.value);
    if(!target.value){if(msg)msg.textContent='Choose what the payment is for.';return}
    if(!Number.isFinite(payment)||payment<=0){if(msg)msg.textContent='Enter a payment amount greater than £0.';return}
    saveBtn.disabled=true;if(msg)msg.textContent='Saving payment…';

    let error=null,label='';
    if(target.value==='package'){
      const next=packagePaid+payment;
      if(next>BASE_TOTAL){if(msg)msg.textContent=`That would take package payments above ${money(BASE_TOTAL)}.`;saveBtn.disabled=false;return}
      ({error}=await weddingSupabase.from('wedding_settings').upsert({setting_key:'package_paid_amount',setting_value:String(next)},{onConflict:'setting_key'}));
      label='Buckler’s Bliss package';
    }else{
      const row=costs.find(c=>c.id===target.value);
      if(!row){if(msg)msg.textContent='That cost could not be found.';saveBtn.disabled=false;return}
      const cost=Number(row.actual_cost??row.estimated_cost??0),paid=Number(row.paid_amount||0),next=paid+payment;
      if(next>cost){if(msg)msg.textContent=`That would take payments above ${money(cost)} for ${row.item}.`;saveBtn.disabled=false;return}
      ({error}=await weddingSupabase.from('wedding_costs').update({paid_amount:next,paid:next>=cost&&cost>0}).eq('id',row.id));
      label=row.item;
    }
    if(error){if(msg)msg.textContent='Could not save payment: '+error.message;saveBtn.disabled=false;return}
    if(msg)msg.textContent=`${money(payment)} payment saved against ${label}.`;
    setTimeout(()=>location.reload(),450);
  });

  load();
})();