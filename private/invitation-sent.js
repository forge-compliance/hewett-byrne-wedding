(()=>{
  if(!window.weddingSupabase)return;
  const table=document.getElementById('guestTable');
  if(!table)return;
  let invitations=[];
  const byGroup=()=>Object.fromEntries(invitations.map(i=>[i.invitation_group,i]));
  async function loadInvitations(){
    const {data,error}=await weddingSupabase.from('wedding_invitations').select('id,invitation_group,invitation_sent').order('invitation_group');
    if(error)return;
    invitations=data||[];
    render();
  }
  function render(){
    const map=byGroup();
    table.querySelectorAll('tbody tr').forEach(row=>{
      if(row.dataset.saveDateReady)return;
      const cells=row.querySelectorAll('td');
      if(cells.length<4)return;
      const group=(cells[3].querySelector('b')?.textContent||'').trim();
      const invite=map[group];
      if(!invite)return;
      row.dataset.saveDateReady='1';
      const wrap=document.createElement('label');
      wrap.style.cssText='display:flex;align-items:center;gap:7px;margin-top:8px;font-size:13px;font-weight:600;cursor:pointer';
      wrap.innerHTML=`<input type="checkbox" data-save-date-id="${invite.id}" style="width:18px;height:18px;margin:0;accent-color:#6f5a3e" ${invite.invitation_sent?'checked':''}><span>Save the date given</span>`;
      cells[3].appendChild(wrap);
      const box=wrap.querySelector('input');
      box.addEventListener('change',async()=>{
        box.disabled=true;
        const {error}=await weddingSupabase.from('wedding_invitations').update({invitation_sent:box.checked}).eq('id',invite.id);
        box.disabled=false;
        const msg=document.getElementById('guestImportMessage');
        if(error){box.checked=!box.checked;if(msg)msg.textContent='Could not update save-the-date status: '+error.message;return;}
        invite.invitation_sent=box.checked;
        if(msg)msg.textContent=box.checked?'Save the date marked as given.':'Save the date marked as not given.';
      });
    });
  }
  new MutationObserver(render).observe(table,{childList:true,subtree:true});
  loadInvitations();
})();
