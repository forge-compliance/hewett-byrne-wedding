(()=>{
  const COST=12550;
  const money=v=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(Number(v)||0);
  const tbody=document.querySelector('#costTable tbody');
  const packageInput=document.getElementById('packagePaidAmount');
  const savePackage=document.getElementById('savePackagePaid');
  if(!tbody||!packageInput||!savePackage)return;

  const status=(paid)=>paid<=0?'Not paid':paid>=COST?'Paid':'Part paid';
  function ensureRow(){
    if(tbody.querySelector('[data-package-row]'))return;
    const paid=Math.max(0,Number(packageInput.value||0));
    const tr=document.createElement('tr');
    tr.dataset.packageRow='1';
    tr.innerHTML=`<td><b>Buckler’s Bliss package</b></td><td>£11,550 package + £1,000 evening guests</td><td>${money(COST)}</td><td><div style="display:flex;gap:6px;align-items:center;min-width:150px"><input type="number" min="0" max="${COST}" step="0.01" value="${paid.toFixed(2)}" data-package-paid-row style="max-width:105px"><button class="btn light" type="button" data-save-package-row>Save</button></div></td><td data-package-balance>${money(Math.max(0,COST-paid))}</td><td><b data-package-status>${status(paid)}</b></td><td><span class="small">Included above</span></td>`;
    tbody.prepend(tr);
  }

  tbody.addEventListener('click',e=>{
    const btn=e.target.closest('[data-save-package-row]');
    if(!btn)return;
    const input=tbody.querySelector('[data-package-paid-row]');
    const amount=Math.max(0,Number(input?.value||0));
    packageInput.value=amount.toFixed(2);
    savePackage.click();
    const bal=tbody.querySelector('[data-package-balance]');
    const st=tbody.querySelector('[data-package-status]');
    if(bal)bal.textContent=money(Math.max(0,COST-amount));
    if(st)st.textContent=status(amount);
  });

  const observer=new MutationObserver(()=>setTimeout(ensureRow,0));
  observer.observe(tbody,{childList:true});
  setTimeout(ensureRow,300);
})();