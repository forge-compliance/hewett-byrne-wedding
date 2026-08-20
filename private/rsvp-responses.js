(()=>{
 const table=document.querySelector('#rsvpResponseTable tbody');
 if(!table||!window.weddingSupabase)return;
 const search=document.getElementById('responseSearch'),status=document.getElementById('responseStatus'),type=document.getElementById('responseType'),msg=document.getElementById('responseMessage');
 let rows=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const render=()=>{
  const q=(search.value||'').trim().toLowerCase(),sf=status.value,tf=type.value;
  const shown=rows.filter(g=>{const hay=[g.first_name,g.last_name,g.invitation_group,g.guest_message,g.dietary_requirements,g.accommodation,g.transport].filter(Boolean).join(' ').toLowerCase();return(!q||hay.includes(q))&&(!sf||g.rsvp_status===sf)&&(!tf||g.guest_type===tf)});
  document.getElementById('responseCount').textContent=rows.length;
  document.getElementById('acceptedCount').textContent=rows.filter(g=>g.rsvp_status==='Accepted').length;
  document.getElementById('declinedCount').textContent=rows.filter(g=>g.rsvp_status==='Declined').length;
  table.innerHTML=shown.length?shown.map(g=>`<tr><td><b>${esc([g.first_name,g.last_name].filter(Boolean).join(' '))}</b><br><span class="small">${esc(g.invitation_group||'')}</span></td><td>${esc(g.guest_type||'')}</td><td><b>${esc(g.rsvp_status||'')}</b></td><td>${g.rsvp_submitted_at?new Date(g.rsvp_submitted_at).toLocaleString('en-GB'):'<span class="small">Not submitted</span>'}</td><td>${esc(g.dietary_requirements||'—')}</td><td>${esc(g.accommodation||'—')}</td><td>${esc(g.transport||'—')}</td><td>${esc(g.guest_message||'—')}</td><td>${g.rsvp_status==='Accepted'?`<button class="btn alt unaccept-btn" data-id="${esc(g.id)}">Unaccept</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="9">No guests match those filters.</td></tr>';
  table.querySelectorAll('.unaccept-btn').forEach(btn=>btn.addEventListener('click',async()=>{
   if(!confirm('Unaccept this guest and return them to Awaiting reply?'))return;
   btn.disabled=true;btn.textContent='Updating…';
   const {error}=await weddingSupabase.from('wedding_guests').update({rsvp_status:'Awaiting reply'}).eq('id',btn.dataset.id);
   if(error){alert('Could not update guest: '+error.message);btn.disabled=false;btn.textContent='Unaccept';return;}
   const guest=rows.find(g=>String(g.id)===String(btn.dataset.id));if(guest)guest.rsvp_status='Awaiting reply';render();msg.textContent='Guest moved back to Awaiting reply.';
  }));
 };
 [search,status,type].forEach(el=>el?.addEventListener(el===search?'input':'change',render));
 (async()=>{
  const {data:{session}}=await weddingSupabase.auth.getSession();if(!session){location.replace('../login.html');return}
  document.getElementById('planningLogout')?.addEventListener('click',async()=>{await weddingSupabase.auth.signOut();location.replace('../login.html')});
  msg.textContent='Loading guest list…';
  const {data,error}=await weddingSupabase.from('wedding_guests').select('*').order('first_name').order('last_name');
  if(error){msg.textContent='Could not load guest list: '+error.message;return}
  rows=data||[];render();msg.textContent=`Showing the full guest list, including accepted guests who have not submitted the RSVP form.`;
 })();
})();