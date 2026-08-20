(()=>{
 const root=document.getElementById('roomTracker');
 if(!root||!window.weddingSupabase)return;
 const list=document.getElementById('roomTrackerList'),msg=document.getElementById('roomTrackerMessage');
 let guests=[],rooms=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const load=async()=>{
   msg.textContent='Loading rooms…';
   const [{data:gs,error:ge},{data:rs,error:re}]=await Promise.all([
     weddingSupabase.from('wedding_guests').select('id,first_name,last_name,invitation_group,guest_type,rsvp_status,room_required,room_id,room_number,room_notes').order('first_name').order('last_name'),
     weddingSupabase.from('wedding_rooms').select('id,room_name,room_type,capacity,notes,sort_order,active').eq('active',true).order('sort_order').order('room_name')
   ]);
   if(ge||re){msg.textContent='Could not load rooms: '+(ge?.message||re?.message);return}
   guests=gs||[];rooms=rs||[];render();
 };
 const render=()=>{
   const booked=guests.filter(g=>g.room_required),assigned=booked.filter(g=>g.room_id),unassigned=booked.filter(g=>!g.room_id);
   document.getElementById('roomTotal').textContent=rooms.length;
   document.getElementById('roomAssigned').textContent=assigned.length;
   document.getElementById('roomNeeded').textContent=unassigned.length;
   document.getElementById('roomGuests').textContent=guests.filter(g=>g.rsvp_status==='Accepted').length;
   const roomCards=rooms.map(r=>{
     const occupants=booked.filter(g=>g.room_id===r.id);
     return `<div class="room-inventory-card"><div><strong>${esc(r.room_name)}</strong><span>${esc(r.room_type||'Bedroom')} · sleeps ${esc(r.capacity||'—')}</span></div><div class="room-occupants">${occupants.length?occupants.map(g=>`<span class="room-occupant">${esc([g.first_name,g.last_name].filter(Boolean).join(' '))}</span>`).join(''):'<span class="room-empty">Available</span>'}</div><div class="room-capacity">${occupants.length}/${esc(r.capacity||'?')}</div></div>`;
   }).join('');
   const shown=guests.filter(g=>g.room_required || g.rsvp_status==='Accepted');
   const guestRows=shown.length?shown.map(g=>`<div class="room-row"><div class="room-person"><strong>${esc([g.first_name,g.last_name].filter(Boolean).join(' '))}</strong><span>${esc(g.invitation_group||'')} · ${esc(g.guest_type||'')}</span></div><label class="room-check"><input type="checkbox" data-room-required="${g.id}" ${g.room_required?'checked':''}> Room</label><select class="room-number" data-room-id="${g.id}"><option value="">Unallocated</option>${rooms.map(r=>`<option value="${r.id}" ${g.room_id===r.id?'selected':''}>${esc(r.room_name)}${r.capacity?` · ${r.capacity} guests`:''}</option>`).join('')}</select><input class="room-notes" data-room-notes="${g.id}" value="${esc(g.room_notes||'')}" placeholder="Sharing with / notes…"><button class="btn light room-save" data-room-save="${g.id}" type="button">Save</button></div>`).join(''):'<p class="small">No accepted guests or room requirements recorded yet.</p>';
   list.innerHTML=`<div class="room-inventory"><div class="room-list-head"><div><span class="small-label">YOUR ROOM BLOCK</span><h3>Available rooms</h3></div><span class="small">7 rooms currently held</span></div>${roomCards}</div><div class="room-allocation"><div class="room-list-head"><div><span class="small-label">GUEST ALLOCATION</span><h3>Who is staying where</h3></div></div>${guestRows}</div>`;
 };
 list.addEventListener('change',async e=>{
   const c=e.target.closest('[data-room-required]');
   if(c){await weddingSupabase.from('wedding_guests').update({room_required:c.checked,room_id:c.checked?undefined:null}).eq('id',c.dataset.roomRequired);await load();return}
   const s=e.target.closest('[data-room-id]');
   if(s){const id=s.dataset.roomId;const roomId=s.value||null;await weddingSupabase.from('wedding_guests').update({room_required:!!roomId,room_id:roomId}).eq('id',id);await load();}
 });
 list.addEventListener('click',async e=>{
   const b=e.target.closest('[data-room-save]');if(!b)return;
   const id=b.dataset.roomSave,row=b.closest('.room-row'),roomId=row.querySelector('[data-room-id]').value||null,notes=row.querySelector('[data-room-notes]').value.trim()||null;
   const {error}=await weddingSupabase.from('wedding_guests').update({room_required:!!roomId,room_id:roomId,room_number:roomId?rooms.find(r=>r.id===roomId)?.room_name:null,room_notes:notes}).eq('id',id);
   msg.textContent=error?'Could not save: '+error.message:'Room allocation saved.';if(!error)await load();
 });
 load();
})();