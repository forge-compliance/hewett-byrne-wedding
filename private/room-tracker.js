(()=>{
 const root=document.getElementById('roomTracker');
 if(!root||!window.weddingSupabase)return;
 const list=document.getElementById('roomTrackerList'),msg=document.getElementById('roomTrackerMessage');
 let guests=[],rooms=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const fullName=g=>[g?.first_name,g?.last_name].filter(Boolean).join(' ');
 const load=async()=>{
   msg.textContent='Loading rooms…';
   const [{data:gs,error:ge},{data:rs,error:re}]=await Promise.all([
     weddingSupabase.from('wedding_guests').select('id,first_name,last_name,invitation_group,guest_type,rsvp_status,room_required,room_id,room_number,room_notes,room_share_with_id').order('first_name').order('last_name'),
     weddingSupabase.from('wedding_rooms').select('id,room_name,room_type,capacity,notes,sort_order,active').eq('active',true).order('sort_order').order('room_name')
   ]);
   if(ge||re){msg.textContent='Could not load rooms: '+(ge?.message||re?.message);return}
   guests=gs||[];rooms=rs||[];render();
 };
 const render=()=>{
   const booked=guests.filter(g=>g.room_required),assigned=booked.filter(g=>g.room_id),unassigned=booked.filter(g=>!g.room_id),accepted=guests.filter(g=>g.rsvp_status==='Accepted');
   document.getElementById('roomTotal').textContent=rooms.length;
   document.getElementById('roomAssigned').textContent=assigned.length;
   document.getElementById('roomNeeded').textContent=unassigned.length;
   document.getElementById('roomGuests').textContent=accepted.length;
   const guestMetric=document.getElementById('expectedDayGuests');if(guestMetric)guestMetric.textContent=guests.length;
   const roomCards=rooms.map(r=>{const occupants=booked.filter(g=>g.room_id===r.id);return `<div class="room-inventory-card"><div><strong>${esc(r.room_name)}</strong><span>${esc(r.room_type||'Bedroom')} · sleeps ${esc(r.capacity||'—')}</span></div><div class="room-occupants">${occupants.length?occupants.map(g=>`<span class="room-occupant">${esc(fullName(g))}</span>`).join(''):'<span class="room-empty">Available</span>'}</div><div class="room-capacity">${occupants.length}/${esc(r.capacity||'?')}</div></div>`}).join('');
   const sharedIds=new Set(booked.map(g=>g.room_share_with_id).filter(Boolean));
   const shown=booked.filter(g=>!sharedIds.has(g.id));
   const guestRows=shown.length?shown.map(g=>{
     const shareOptions=guests.filter(x=>x.id!==g.id).map(x=>`<option value="${x.id}" ${g.room_share_with_id===x.id?'selected':''}>${esc(fullName(x))}</option>`).join('');
     return `<div class="room-row"><div class="room-person"><strong>${esc(fullName(g))}</strong><span>${esc(g.invitation_group||'')} · ${esc(g.guest_type||'')}</span></div><label class="room-check"><input type="checkbox" data-room-required="${g.id}" ${g.room_required?'checked':''}> Room</label><select class="room-number" data-room-id="${g.id}"><option value="">Unallocated</option>${rooms.map(r=>`<option value="${r.id}" ${g.room_id===r.id?'selected':''}>${esc(r.room_name)}${r.capacity?` · ${r.capacity} guests`:''}</option>`).join('')}</select><select class="room-share" data-room-share="${g.id}"><option value="">Not sharing / choose guest…</option>${shareOptions}</select><button class="btn light room-save" data-room-save="${g.id}" type="button">Save</button></div>`;
   }).join(''):'<p class="small">No guests added to room allocation yet. Add them from the Guest Manager.</p>';
   list.innerHTML=`<div class="room-inventory"><div class="room-list-head"><div><span class="small-label">YOUR ROOM BLOCK</span><h3>Available rooms</h3></div><span class="small">${rooms.length} rooms currently held</span></div>${roomCards}</div><div class="room-allocation"><div class="room-list-head"><div><span class="small-label">GUEST ALLOCATION</span><h3>Who is staying where</h3></div></div>${guestRows}</div>`;
 };
 list.addEventListener('change',async e=>{
   const c=e.target.closest('[data-room-required]');if(!c)return;
   if(c.checked)return;
   const g=guests.find(x=>x.id===c.dataset.roomRequired),oldShare=g?.room_share_with_id||null;
   const updates=[weddingSupabase.from('wedding_guests').update({room_required:false,room_id:null,room_number:null,room_share_with_id:null}).eq('id',c.dataset.roomRequired)];
   if(oldShare)updates.push(weddingSupabase.from('wedding_guests').update({room_required:false,room_id:null,room_number:null}).eq('id',oldShare));
   await Promise.all(updates);await load();
 });
 list.addEventListener('click',async e=>{
   const b=e.target.closest('[data-room-save]');if(!b)return;
   const id=b.dataset.roomSave,row=b.closest('.room-row'),roomId=row.querySelector('[data-room-id]').value||null,shareId=row.querySelector('[data-room-share]').value||null;
   const g=guests.find(x=>x.id===id),oldShare=g?.room_share_with_id||null,roomName=roomId?rooms.find(r=>r.id===roomId)?.room_name:null;
   if(shareId===id){msg.textContent='A guest cannot share with themselves.';return}
   const room=rooms.find(r=>r.id===roomId);if(roomId&&room?.capacity){const already=guests.filter(x=>x.room_id===roomId&&!([id,oldShare,shareId].includes(x.id))).length;const incoming=1+(shareId?1:0);if(already+incoming>Number(room.capacity)){msg.textContent=`${room.room_name} does not have enough space for that allocation.`;return}}
   const primary=await weddingSupabase.from('wedding_guests').update({room_required:true,room_id:roomId,room_number:roomName,room_share_with_id:shareId,room_notes:null}).eq('id',id);
   if(primary.error){msg.textContent='Could not save: '+primary.error.message;return}
   if(oldShare&&oldShare!==shareId){await weddingSupabase.from('wedding_guests').update({room_required:false,room_id:null,room_number:null}).eq('id',oldShare)}
   if(shareId){const shared=await weddingSupabase.from('wedding_guests').update({room_required:true,room_id:roomId,room_number:roomName,room_share_with_id:null,room_notes:null}).eq('id',shareId);if(shared.error){msg.textContent='Main guest saved, but sharing guest could not be linked: '+shared.error.message;await load();return}}
   msg.textContent=shareId?`Room allocation saved for ${fullName(g)} and ${fullName(guests.find(x=>x.id===shareId))}.`:'Room allocation saved.';await load();
 });
 load();
})();