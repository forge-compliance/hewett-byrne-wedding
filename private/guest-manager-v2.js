(()=>{
  if(!window.weddingSupabase)return;
  const SAVE_MARK='[SAVE_DATE_GIVEN]';
  const PLUS_MARK='[PLUS_ONE_EXPECTED]';
  const form=document.getElementById('guestForm');
  const body=document.querySelector('#guestTable tbody');
  const msg=document.getElementById('guestImportMessage');
  if(!form||!body||!msg)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let guests=[],invitations=[];
  let sortKey='invitation', sortDir=1;
  const invMap=()=>Object.fromEntries(invitations.map(i=>[i.invitation_group,i]));
  const hasSave=i=>String(i?.notes||'').includes(SAVE_MARK);
  const hasPlus=i=>String(i?.notes||'').includes(PLUS_MARK);
  const toggleMark=(notes,mark,on)=>{const clean=String(notes||'').replaceAll(mark,'').replace(/\s{2,}/g,' ').trim();return on?((clean?clean+' ':'')+mark):(clean||null)};
  const saveNotes=(notes,on)=>toggleMark(notes,SAVE_MARK,on);
  const plusNotes=(notes,on)=>toggleMark(notes,PLUS_MARK,on);
  const invitationNumber=v=>{const m=String(v||'').match(/(\d+)/);return m?Number(m[1]):999999};
  const categoryLabel=g=>g.guest_type==='Evening'?'Evening':g.guest_type==='Night'?'Night':'Main';
  async function ensureSession(){const {data,error}=await weddingSupabase.auth.getSession();if(error||!data?.session){location.replace('../login.html');return false}return true}
  function sortValue(g,key,im){const i=im[g.invitation_group]||{};if(key==='name')return [g.first_name,g.last_name].filter(Boolean).join(' ').toLowerCase();if(key==='category')return String(g.guest_type||'').toLowerCase();if(key==='rsvp')return String(g.rsvp_status||'').toLowerCase();if(key==='invitation')return invitationNumber(g.invitation_group);if(key==='notes')return String(g.notes||'').toLowerCase();return ''}
  function updateSortHeaders(){const headers=[['name','Name'],['category','Category'],['rsvp','RSVP'],['invitation','Household / RSVP Code'],['notes','Notes']];document.querySelectorAll('#guestTable thead th').forEach((th,idx)=>{const item=headers[idx];if(!item)return;const [key,label]=item;th.style.cursor='pointer';th.title='Click to sort';th.textContent=label+(sortKey===key?(sortDir===1?' ▲':' ▼'):'');th.dataset.sortKey=key})}
  function render(){
    const im=invMap();
    const q=(document.getElementById('guestSearch')?.value||'').trim().toLowerCase();
    const tf=document.getElementById('guestTypeFilter')?.value||'';
    const rf=document.getElementById('guestRsvpFilter')?.value||'';
    const sf=document.getElementById('guestSideFilter')?.value||'';
    const shown=guests.filter(g=>{const i=im[g.invitation_group]||{};const hay=[g.first_name,g.last_name,g.invitation_group,i.rsvp_code,g.family_group,g.notes].filter(Boolean).join(' ').toLowerCase();return(!q||hay.includes(q))&&(!tf||g.guest_type===tf)&&(!rf||g.rsvp_status===rf)&&(!sf||g.side===sf)}).sort((a,b)=>{const av=sortValue(a,sortKey,im),bv=sortValue(b,sortKey,im);if(typeof av==='number'&&typeof bv==='number')return(av-bv)*sortDir;return String(av).localeCompare(String(bv),'en-GB',{numeric:true,sensitivity:'base'})*sortDir});
    const main=guests.filter(g=>g.guest_type==='Day').length;
    const evening=guests.filter(g=>g.guest_type==='Evening').length;
    const night=guests.filter(g=>g.guest_type==='Night').length;
    const plus=invitations.filter(hasPlus).length;
    const baseTotal=main+evening+night;
    document.getElementById('mainCount').textContent=main;
    document.getElementById('eveningCount').textContent=evening;
    document.getElementById('plusOneCount').textContent=plus;
    document.getElementById('totalGuestCount').textContent=`${baseTotal} + ${plus}`;
    document.getElementById('nightCount').textContent=night;
    document.getElementById('shownGuestCount').textContent=shown.length;
    updateSortHeaders();
    body.innerHTML=shown.length?shown.map(g=>{const i=im[g.invitation_group]||{};const name=[g.first_name,g.last_name].filter(Boolean).join(' ');return `<tr><td><b>${esc(name)}</b></td><td>${categoryLabel(g)}</td><td><select data-rsvp-id="${g.id}"><option ${g.rsvp_status==='Awaiting reply'?'selected':''}>Awaiting reply</option><option ${g.rsvp_status==='Accepted'?'selected':''}>Accepted</option><option ${g.rsvp_status==='Declined'?'selected':''}>Declined</option></select></td><td><b>${esc(g.invitation_group)}</b>${i.rsvp_code?`<br><span class="small">RSVP code</span><br><strong>${esc(String(i.rsvp_code).toUpperCase())}</strong>`:''}<div style="display:grid;gap:6px;margin-top:8px"><div style="display:flex;gap:14px;flex-wrap:wrap"><label><input type="checkbox" data-save-id="${i.id||''}" ${hasSave(i)?'checked':''}> Save the Date given</label><label><input type="checkbox" data-plus-id="${i.id||''}" ${hasPlus(i)?'checked':''}> Plus one expected</label></div><label><input type="checkbox" data-invite-id="${i.id||''}" ${i.invitation_sent?'checked':''}> Invitation given</label></div></td><td>${esc(g.notes||'')}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn light" type="button" data-room-guest="${g.id}">${g.room_required?'Remove from rooms':'Add to rooms'}</button><button class="btn light" type="button" data-edit-guest="${g.id}">Edit name</button><button class="btn light" type="button" data-delete-guest="${g.id}">Remove</button></div></td></tr>`}).join(''):'<tr><td colspan="6">No guests match those filters.</td></tr>';
  }
  async function load(){msg.textContent='Loading from Supabase…';const [gr,ir]=await Promise.all([weddingSupabase.from('wedding_guests').select('*').order('created_at'),weddingSupabase.from('wedding_invitations').select('*').order('invitation_group')]);if(gr.error)throw gr.error;if(ir.error)throw ir.error;guests=gr.data||[];invitations=ir.data||[];render();msg.textContent=`${guests.length} guests loaded from Supabase.`}
  [document.getElementById('guestSearch'),document.getElementById('guestTypeFilter'),document.getElementById('guestRsvpFilter'),document.getElementById('guestSideFilter')].forEach(el=>el?.addEventListener(el.tagName==='INPUT'?'input':'change',render));
  document.querySelector('#guestTable thead')?.addEventListener('click',e=>{const th=e.target.closest('th[data-sort-key]');if(!th)return;const key=th.dataset.sortKey;if(sortKey===key)sortDir*=-1;else{sortKey=key;sortDir=1}render()});
  body.addEventListener('change',async e=>{const rsvp=e.target.closest('[data-rsvp-id]');if(rsvp){const x=await weddingSupabase.from('wedding_guests').update({rsvp_status:rsvp.value}).eq('id',rsvp.dataset.rsvpId);msg.textContent=x.error?x.error.message:'RSVP updated.';return}const save=e.target.closest('[data-save-id]');if(save&&save.dataset.saveId){const i=invitations.find(x=>String(x.id)===save.dataset.saveId);const notes=saveNotes(i?.notes,save.checked);const x=await weddingSupabase.from('wedding_invitations').update({notes}).eq('id',save.dataset.saveId);if(x.error){save.checked=!save.checked;msg.textContent=x.error.message}else{if(i)i.notes=notes;msg.textContent='Save the Date status updated.'}return}const plus=e.target.closest('[data-plus-id]');if(plus&&plus.dataset.plusId){const i=invitations.find(x=>String(x.id)===plus.dataset.plusId);const notes=plusNotes(i?.notes,plus.checked);const x=await weddingSupabase.from('wedding_invitations').update({notes}).eq('id',plus.dataset.plusId);if(x.error){plus.checked=!plus.checked;msg.textContent=x.error.message}else{if(i)i.notes=notes;render();msg.textContent=plus.checked?'Plus one marked as expected.':'Plus one expectation removed.'}return}const inv=e.target.closest('[data-invite-id]');if(inv&&inv.dataset.inviteId){const x=await weddingSupabase.from('wedding_invitations').update({invitation_sent:inv.checked}).eq('id',inv.dataset.inviteId);if(x.error){inv.checked=!inv.checked;msg.textContent=x.error.message}else{const i=invitations.find(x=>String(x.id)===inv.dataset.inviteId);if(i)i.invitation_sent=inv.checked;msg.textContent='Invitation status updated.'}}});
  body.addEventListener('click',async e=>{const room=e.target.closest('[data-room-guest]');if(room){const g=guests.find(x=>String(x.id)===room.dataset.roomGuest);if(!g)return;const next=!g.room_required;const payload=next?{room_required:true}:{room_required:false,room_id:null,room_number:null,room_notes:null};const x=await weddingSupabase.from('wedding_guests').update(payload).eq('id',g.id);if(x.error){msg.textContent=x.error.message;return}g.room_required=next;if(!next){g.room_id=null;g.room_number=null;g.room_notes=null}render();msg.textContent=next?'Guest added to room allocation.':'Guest removed from room allocation.';return}const edit=e.target.closest('[data-edit-guest]');if(edit){const g=guests.find(x=>String(x.id)===edit.dataset.editGuest);if(!g)return;const current=[g.first_name,g.last_name].filter(Boolean).join(' ');const next=prompt('Edit guest name',current);if(next===null)return;const clean=next.trim().replace(/\s+/g,' ');if(!clean){msg.textContent='Name cannot be blank.';return}const parts=clean.split(' '),first=parts.shift(),last=parts.join(' ')||null;const x=await weddingSupabase.from('wedding_guests').update({first_name:first,last_name:last}).eq('id',g.id);if(x.error){msg.textContent=x.error.message;return}g.first_name=first;g.last_name=last;render();msg.textContent='Guest name updated.';return}const d=e.target.closest('[data-delete-guest]');if(!d)return;if(!confirm('Remove this guest?'))return;const x=await weddingSupabase.from('wedding_guests').delete().eq('id',d.dataset.deleteGuest);msg.textContent=x.error?x.error.message:'Guest removed.';if(!x.error)await load()});
  document.getElementById('planningLogout')?.addEventListener('click',async()=>{await weddingSupabase.auth.signOut();location.replace('../login.html')});
  updateSortHeaders();
  ensureSession().then(ok=>{if(ok)load().catch(err=>{msg.textContent='Supabase error: '+err.message})});
})();