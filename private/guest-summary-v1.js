(()=>{
  if(!window.weddingSupabase)return;
  const PLUS_MARK='[PLUS_ONE_EXPECTED]';

  async function refreshSummary(){
    const [gr,ir]=await Promise.all([
      weddingSupabase.from('wedding_guests').select('invitation_group,guest_type'),
      weddingSupabase.from('wedding_invitations').select('invitation_group,notes')
    ]);
    if(gr.error||ir.error)return;

    const guests=gr.data||[];
    const invitations=ir.data||[];
    const main=guests.filter(g=>g.guest_type==='Day').length;
    const evening=guests.filter(g=>g.guest_type==='Evening').length;
    const plusGroups=invitations.filter(i=>String(i.notes||'').includes(PLUS_MARK));

    let mainPlus=0, eveningPlus=0;
    plusGroups.forEach(i=>{
      const groupGuests=guests.filter(g=>g.invitation_group===i.invitation_group);
      if(groupGuests.some(g=>g.guest_type==='Day')) mainPlus++;
      else if(groupGuests.some(g=>g.guest_type==='Evening')) eveningPlus++;
    });

    const totalPlus=mainPlus+eveningPlus;
    const mainEl=document.getElementById('mainCount');
    const eveningEl=document.getElementById('eveningCount');
    const plusEl=document.getElementById('plusOneCount');
    const totalEl=document.getElementById('totalGuestCount');
    if(mainEl)mainEl.textContent=`${main} + ${mainPlus}`;
    if(eveningEl)eveningEl.textContent=`${evening} + ${eveningPlus}`;
    if(plusEl)plusEl.textContent=totalPlus;
    if(totalEl)totalEl.textContent=`${main+evening} + ${totalPlus}`;
  }

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('[data-plus-id]')) setTimeout(refreshSummary,350);
  });
  setTimeout(refreshSummary,500);
})();
