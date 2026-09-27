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
     weddingSupabase.from('wedding_guests').select('id,first_name,last_name,invitation_group,guest_type,rsvp_status,room_required,room_id,room_number,room_slot,room_notes').order('first_name').order('last_name'),
     weddingSupabase.from('wedding_rooms').select('id,room_name,room_type,capacity,notes,sort_order,active').eq('active',true).order('sort_order').order('room_name')
   ]);
   if(ge||re){msg.textContent='Could not load rooms: '+(ge?.message||re?.message);return}
   guests=gs||[];rooms=rs||[];render();
 };
 const slotKey=(roomId,slot)=>`${roomId}|${slot}`;
 const parseSlot=v=>{const [roomId,slot]=String(v||'').split('|');return roomId&&slot?{roomId,slot:Number(slot)}:{roomId:null,slot:null}};
 const render=()=>{
   const booked=guests.filter(g=>g.room_required),assigned=booked.filter(g=>g.room_id&&g.room_slot),unassigned=booked.filter(g=>!g.room_id||!g.room_slot),accepted=guests.filter(g=>g.rsvp_status==='Accepted');
   document.getElementById('roomTotal').textContent=rooms.length;
   document.getElementById('roomAssigned').textContent=assigned.length;
   document.getElementById('roomNeeded').textContent=unassigned.length;
   document.getElementById('roomGuests').textContent=accepted.length;
   const guestMetric=document.getElementById('expectedDayGuests');if(guestMetric)guestMetric.textContent=guests.length;

   const roomCards=rooms.map(r=>{
     const occupants=booked.filter(g=>g.room_id===r.id);
     const cap=Math.max(1,Number(r.capacity||1));
     const slots=Array.from({length:cap},(_,i)=>i+1).map(slot=>{
       const g=occupants.find(x=>Number(x.room_slot)===slot);
       return `<span class="room-occupant">Guest ${slot}: ${g?esc(fullName(g)):'Available'}</span>`;
     }).join('');
     const unslotted=occupants.filter(g=>!g.room_slot);
     return `<div class="room-inventory-card"><div><strong>${esc(r.room_name)}</strong><span>${esc(r.room_type||'Bedroom')} · sleeps ${cap}</span></div><div class="room-occupants">${slots}${unslotted.map(g=>`<span class="room-occupant">Needs slot: ${esc(fullName(g))}</span>`).join('')}</div><div class="room-capacity">${occupants.length}/${cap}</div></div>`;
   }).join('');

   const shown=booked;
   const guestRows=shown.length?shown.map(g=>{
     const options=[];
     rooms.forEach(r=>{
       const cap=Math.max(1,Number(r.capacity||1));
       for(let slot=1;slot<=cap;slot++){
         const occupiedBy=guests.find(x=>x.id!==g.id&&x.room_id===r.id&&Number(x.room_slot)===slot);
         const selected=g.room_id===r.id&&Number(g.room_slot)===slot;
         options.push(`<option value="${slotKey(r.id,slot)}" ${selected?'selected':''} ${occupiedBy?'disabled':''}>${esc(r.room_name)} · Guest ${slot}${occupiedBy?` · ${esc(fullName(occupiedBy))}`:''}</option>`);
       }
     });
     const currentNeedsSlot=g.room_id&&!g.room_slot?`<div class="small" style="margin-top:4px">Currently linked to ${esc(g.room_number||'a room')} but needs a guest slot.</div>`:'';
     return `<div class="room-row"><div class="room-person"><strong>${esc(fullName(g))}</strong><span>${esc(g.invitation_group||'')} · ${esc(g.guest_type||'')}</span>${currentNeedsSlot}</div><label class="room-check"><input type="checkbox" data-room-required="${g.id}" ${g.room_required?'checked':''}> Room</label><select class="room-number" data-room-slot="${g.id}"><option value="">Unallocated</option>${options.join('')}</select><button class="btn light room-save" data-room-save="${g.id}" type="button">Save</button></div>`;
   }).join(''):'<p class="small">No guests added to room allocation yet. Add them from the Guest Manager.</p>';

   list.innerHTML=`<div class="room-inventory"><div class="room-list-head"><div><span class="small-label">YOUR ROOM BLOCK</span><h3>Available rooms</h3></div><span class="small">Each room is split into numbered guest slots</span></div>${roomCards}</div><div class="room-allocation"><div class="room-list-head"><div><span class="small-label">GUEST ALLOCATION</span><h3>Who is staying where</h3></div></div>${guestRows}</div>`;
 };

 list.addEventListener('change',async e=>{
   const c=e.target.closest('[data-room-required]');if(!c||c.checked)return;
   const {error}=await weddingSupabase.from('wedding_guests').update({room_required:false,room_id:null,room_number:null,room_slot:null,room_share_with_id:null}).eq('id',c.dataset.roomRequired);
   msg.textContent=error?'Could not remove room allocation: '+error.message:'Removed from room allocation.';
   if(!error)await load();
 });

 list.addEventListener('click',async e=>{
   const b=e.target.closest('[data-room-save]');if(!b)return;
   const id=b.dataset.roomSave,row=b.closest('.room-row'),sel=row.querySelector('[data-room-slot]'),picked=parseSlot(sel.value);
   if(!picked.roomId){msg.textContent='Choose a room and guest slot first.';return}
   const room=rooms.find(r=>r.id===picked.roomId);if(!room){msg.textContent='That room could not be found.';return}
   const taken=guests.find(x=>x.id!==id&&x.room_id===picked.roomId&&Number(x.room_slot)===picked.slot);
   if(taken){msg.textContent=`${room.room_name} · Guest ${picked.slot} is already allocated to ${fullName(taken)}.`;return}
   const {error}=await weddingSupabase.from('wedding_guests').update({room_required:true,room_id:picked.roomId,room_number:room.room_name,room_slot:picked.slot,room_share_with_id:null,room_notes:null}).eq('id',id);
   msg.textContent=error?'Could not save: '+error.message:`${fullName(guests.find(x=>x.id===id))} saved to ${room.room_name} · Guest ${picked.slot}.`;
   if(!error)await load();
 });
 load();
})();