(()=>{
 const root=document.getElementById('roomTracker');
 if(!root||!window.weddingSupabase)return;
 const list=document.getElementById('roomTrackerList'),msg=document.getElementById('roomTrackerMessage');
 let guests=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const load=async()=>{
   msg.textContent='Loading room list…';
   const {data,error}=await weddingSupabase.from('wedding_guests').select('id,first_name,last_name,invitation_group,guest_type,rsvp_status,room_required,room_number,room_notes').order('first_name').order('last_name');
   if(error){msg.textContent='Could not load rooms: '+error.message;return}
   guests=data||[];render();
 };
 const render=()=>{
   const booked=guests.filter(g=>g.room_required),assigned=booked.filter(g=>g.room_number?.trim()),unassigned=booked.filter(g=>!g.room_number?.trim());
   document.getElementById('roomTotal').textContent=booked.length;
   document.getElementById('roomAssigned').textContent=assigned.length;
   document.getElementById('roomNeeded').textContent=unassigned.length;
   document.getElementById('roomGuests').textContent=guests.filter(g=>g.rsvp_status==='Accepted').length;
   const shown=guests.filter(g=>g.room_required || g.rsvp_status==='Accepted');
   list.innerHTML=shown.length?shown.map(g=>`<div class="room-row"><div class="room-person"><strong>${esc([g.first_name,g.last_name].filter(Boolean).join(' '))}</strong><span>${esc(g.invitation_group||'')} · ${esc(g.guest_type||'')}</span></div><label class="room-check"><input type="checkbox" data-room-required="${g.id}" ${g.room_required?'checked':''}> Room</label><input class="room-number" data-room-number="${g.id}" value="${esc(g.room_number||'')}" placeholder="Room no."><input class="room-notes" data-room-notes="${g.id}" value="${esc(g.room_notes||'')}" placeholder="Notes / sharing with…"><button class="btn light room-save" data-room-save="${g.id}" type="button">Save</button></div>`).join(''):'<p class="small">No accepted guests or room requirements recorded yet.</p>';
 };
 list.addEventListener('change',async e=>{const c=e.target.closest('[data-room-required]');if(!c)return;const id=c.dataset.roomRequired;await weddingSupabase.from('wedding_guests').update({room_required:c.checked}).eq('id',id);await load()});
 list.addEventListener('click',async e=>{const b=e.target.closest('[data-room-save]');if(!b)return;const id=b.dataset.roomSave,row=b.closest('.room-row');const number=row.querySelector('[data-room-number]').value.trim()||null,notes=row.querySelector('[data-room-notes]').value.trim()||null,required=row.querySelector('[data-room-required]').checked;const {error}=await weddingSupabase.from('wedding_guests').update({room_required:required,room_number:number,room_notes:notes}).eq('id',id);msg.textContent=error?'Could not save: '+error.message:'Room details saved.';if(!error)await load()});
 load();
})();