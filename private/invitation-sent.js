(()=>{
  if(!window.weddingSupabase)return;
  const table=document.getElementById('guestTable');
  if(!table)return;
  const SAVE_MARK='[SAVE_DATE_GIVEN]';
  let invitations=[];
  const byGroup=()=>Object.fromEntries(invitations.map(i=>[i.invitation_group,i]));
  const hasSaveDate=i=>(i.notes||'').includes(SAVE_MARK);
  const setSaveDateNote=(notes,given)=>{
    const clean=String(notes||'').replaceAll(SAVE_MARK,'').replace(/\s{2,}/g,' ').trim();
    return given ? (clean?clean+' ':'')+SAVE_MARK : (clean||null);
  };
  async function loadInvitations(){
    const {data,error}=await weddingSupabase.from('wedding_invitations').select('id,invitation_group,invitation_sent,notes').order('invitation_group');
    if(error)return;
    invitations=data||[];
    render();
  }
  function render(){
    const map=byGroup();
    table.querySelectorAll('tbody tr').forEach(row=>{
      if(row.dataset.inviteTrackerReady)return;
      const cells=row.querySelectorAll('td');
      if(cells.length<4)return;
      const group=(cells[3].querySelector('b')?.textContent||'').trim();
      const invite=map[group];
      if(!invite)return;
      row.dataset.inviteTrackerReady='1';
      const wrap=document.createElement('div');
      wrap.style.cssText='display:grid;gap:7px;margin-top:8px;font-size:13px;font-weight:600';
      wrap.innerHTML=`
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" data-save-date-id="${invite.id}" style="width:18px;height:18px;margin:0;accent-color:#6f5a3e" ${hasSaveDate(invite)?'checked':''}><span>Save the date given</span></label>
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer"><input type="checkbox" data-invitation-id="${invite.id}" style="width:18px;height:18px;margin:0;accent-color:#6f5a3e" ${invite.invitation_sent?'checked':''}><span>Invitation given</span></label>`;
      cells[3].appendChild(wrap);
      const saveBox=wrap.querySelector('[data-save-date-id]');
      const inviteBox=wrap.querySelector('[data-invitation-id]');
      saveBox.addEventListener('change',async()=>{
        saveBox.disabled=true;
        const newNotes=setSaveDateNote(invite.notes,saveBox.checked);
        const {error}=await weddingSupabase.from('wedding_invitations').update({notes:newNotes}).eq('id',invite.id);
        saveBox.disabled=false;
        const msg=document.getElementById('guestImportMessage');
        if(error){saveBox.checked=!saveBox.checked;if(msg)msg.textContent='Could not update save-the-date status: '+error.message;return;}
        invite.notes=newNotes;
        if(msg)msg.textContent=saveBox.checked?'Save the date marked as given.':'Save the date marked as not given.';
      });
      inviteBox.addEventListener('change',async()=>{
        inviteBox.disabled=true;
        const {error}=await weddingSupabase.from('wedding_invitations').update({invitation_sent:inviteBox.checked}).eq('id',invite.id);
        inviteBox.disabled=false;
        const msg=document.getElementById('guestImportMessage');
        if(error){inviteBox.checked=!inviteBox.checked;if(msg)msg.textContent='Could not update invitation status: '+error.message;return;}
        invite.invitation_sent=inviteBox.checked;
        if(msg)msg.textContent=inviteBox.checked?'Invitation marked as given.':'Invitation marked as not given.';
      });
    });
  }
  new MutationObserver(render).observe(table,{childList:true,subtree:true});
  loadInvitations();
})();
