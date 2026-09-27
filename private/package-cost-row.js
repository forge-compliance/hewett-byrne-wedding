(()=>{
  const COST=12550;
  const money=v=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(Number(v)||0);
  const tbody=document.querySelector('#costTable tbody');
  const packageInput=document.getElementById('packagePaidAmount');
  const savePackage=document.getElementById('savePackagePaid');
  if(!tbody||!packageInput||!savePackage)return;

  const status=paid=>paid<=0?'Not paid':paid>=COST?'Paid':'Part paid';
  function syncRow(){
    let tr=tbody.querySelector('[data-package-row]');
    if(!tr){tr=document.createElement('tr');tr.dataset.packageRow='1';tr.innerHTML=`<td><b>Buckler’s Bliss package</b></td><td>£11,550 package + £1,000 evening guests</td><td>${money(COST)}</td><td><div style="display:flex;gap:6px;align-items:center;min-width:150px"><input type="number" min="0" max="${COST}" step="0.01" data-package-paid-row style="max-width:105px"><button class="btn light" type="button" data-save-package-row>Save</button></div></td><td data-package-balance></td><td><b data-package-status></b></td><td><span class="small">Included above</span></td>`;tbody.prepend(tr)}
    const paid=Math.max(0,Number(packageInput.value||0));
    const rowInput=tr.querySelector('[data-package-paid-row]');
    if(rowInput&&document.activeElement!==rowInput)rowInput.value=paid.toFixed(2);
    tr.querySelector('[data-package-balance]').textContent=money(Math.max(0,COST-paid));
    tr.querySelector('[data-package-status]').textContent=status(paid);
  }

  tbody.addEventListener('click',e=>{
    const btn=e.target.closest('[data-save-package-row]');if(!btn)return;
    const input=tbody.querySelector('[data-package-paid-row]');
    const amount=Math.max(0,Number(input?.value||0));
    packageInput.value=amount.toFixed(2);savePackage.click();setTimeout(syncRow,250);
  });

  const observer=new MutationObserver(()=>setTimeout(syncRow,0));
  observer.observe(tbody,{childList:true});
  let tries=0;const timer=setInterval(()=>{syncRow();if(++tries>=15)clearInterval(timer)},200);
})();