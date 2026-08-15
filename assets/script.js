document.querySelectorAll('.menu').forEach(btn=>btn.addEventListener('click',()=>document.querySelector('.links')?.classList.toggle('open')));
document.querySelectorAll('.accordion button').forEach(btn=>btn.addEventListener('click',()=>btn.parentElement.classList.toggle('open')));
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money=v=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(Number(v)||0);

const dateEl=document.querySelector('[data-wedding-date]');
if(dateEl){const chosenDate=new Date((localStorage.getItem('hewettWeddingDate')||dateEl.dataset.weddingDate)+'T12:00:00');function tick(){const d=chosenDate-new Date(),v=d>0?[Math.floor(d/86400000),Math.floor(d/3600000)%24,Math.floor(d/60000)%60,Math.floor(d/1000)%60]:[0,0,0,0];['days','hours','minutes','seconds'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=v[i]})}tick();setInterval(tick,1000)}
const privateDate=document.getElementById('privateDate');
if(privateDate){privateDate.value=localStorage.getItem('hewettWeddingDate')||'2027-09-11';privateDate.addEventListener('change',()=>{localStorage.setItem('hewettWeddingDate',privateDate.value);document.getElementById('savedMessage').textContent='Date saved.'})}
document.querySelectorAll('[data-save-check]').forEach(el=>{const k='hewettCheck_'+el.dataset.saveCheck;el.checked=localStorage.getItem(k)==='1';el.addEventListener('change',()=>localStorage.setItem(k,el.checked?'1':'0'))});

const loginForm=document.getElementById('planningLoginForm');
if(loginForm&&window.weddingSupabase){const msg=document.getElementById('planningLoginMessage');weddingSupabase.auth.getSession().then(({data})=>{if(data.session)location.replace('private/')});loginForm.addEventListener('submit',async e=>{e.preventDefault();msg.textContent='Checking…';const {error}=await weddingSupabase.auth.signInWithPassword({email:document.getElementById('planningEmail').value.trim(),password:document.getElementById('planningPassword').value});if(error){msg.textContent='Email or password not recognised.';return}location.replace('private/')})}

(async()=>{
 const form=document.getElementById('guestForm');if(!form||!window.weddingSupabase)return;
 const {data:{session}}=await weddingSupabase.auth.getSession();if(!session){location.replace('../login.html');return}
 document.getElementById('planningLogout')?.addEventListener('click',async()=>{await weddingSupabase.auth.signOut();location.replace('../login.html')});
 let guests=[],invitations=[],costs=[];const body=document.querySelector('#guestTable tbody'),msg=document.getElementById('guestImportMessage'),costBody=document.querySelector('#costTable tbody'),costMsg=document.getElementById('costSavedMessage');
 const guestSearch=document.getElementById('guestSearch'),guestTypeFilter=document.getElementById('guestTypeFilter'),guestRsvpFilter=document.getElementById('guestRsvpFilter'),guestSideFilter=document.getElementById('guestSideFilter');
 const invMap=()=>Object.fromEntries(invitations.map(i=>[i.invitation_group,i]));
 function renderGuests(){const m=guests.filter(g=>g.guest_type==='Day').length,e=guests.filter(g=>g.guest_type==='Evening').length;document.getElementById('mainCount').textContent=m;document.getElementById('eveningCount').textContent=e;document.getElementById('nightCount').textContent='0';if(document.getElementById('expectedDayGuests'))document.getElementById('expectedDayGuests').textContent=m;if(document.getElementById('expectedEveningGuests'))document.getElementById('expectedEveningGuests').textContent=e;const im=invMap();
 const q=(guestSearch?.value||'').trim().toLowerCase(),tf=guestTypeFilter?.value||'',rf=guestRsvpFilter?.value||'',sf=guestSideFilter?.value||'';
 const shown=guests.filter(g=>{const hay=[g.first_name,g.last_name,g.invitation_group,g.family_group,g.notes].filter(Boolean).join(' ').toLowerCase();return(!q||hay.includes(q))&&(!tf||g.guest_type===tf)&&(!rf||g.rsvp_status===rf)&&(!sf||g.side===sf)});
 const shownEl=document.getElementById('shownGuestCount');if(shownEl)shownEl.textContent=shown.length;
 body.innerHTML=shown.length?shown.map(g=>{const name=[g.first_name,g.last_name].filter(Boolean).join(' '),notes=[g.side&&`Side: ${g.side}`,g.family_group&&`Group: ${g.family_group}`,g.adult_child,g.dietary_requirements&&`Dietary: ${g.dietary_requirements}`,g.accommodation&&`Accommodation: ${g.accommodation}`,g.transport&&`Transport: ${g.transport}`,g.notes].filter(Boolean).join(' | '),code=im[g.invitation_group]?.rsvp_code||'';return `<tr><td><b>${escapeHtml(name)}</b></td><td>${g.guest_type==='Evening'?'Evening':'Main'}</td><td><select data-rsvp-id="${g.id}"><option ${g.rsvp_status==='Awaiting reply'?'selected':''}>Awaiting reply</option><option ${g.rsvp_status==='Accepted'?'selected':''}>Accepted</option><option ${g.rsvp_status==='Declined'?'selected':''}>Declined</option></select></td><td>${escapeHtml(g.invitation_group)}</td><td>${escapeHtml(notes)}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap">${code?`<button class="btn light" type="button" data-copy-code="${code}">Copy RSVP code</button>`:''}<button class="btn light" type="button" data-delete-guest="${g.id}">Remove</button></div></td></tr>`}).join(''):'<tr><td colspan="6">No guests match those filters.</td></tr>'}
 [guestSearch,guestTypeFilter,guestRsvpFilter,guestSideFilter].forEach(el=>el?.addEventListener(el?.tagName==='INPUT'?'input':'change',renderGuests));
 async function loadGuests(){msg.textContent='Loading from Supabase…';const [gr,ir]=await Promise.all([weddingSupabase.from('wedding_guests').select('*').order('created_at'),weddingSupabase.from('wedding_invitations').select('*').order('invitation_group')]);if(gr.error)throw gr.error;if(ir.error)throw ir.error;guests=gr.data||[];invitations=ir.data||[];renderGuests();msg.textContent=`${guests.length} guests loaded from Supabase.`}
 form.addEventListener('submit',async e=>{e.preventDefault();const full=document.getElementById('guestName').value.trim(),parts=full.split(/\s+/),first=parts.shift(),last=parts.join(' ');let party=document.getElementById('guestParty').value.trim();if(!party){const n=Math.max(0,...invitations.map(i=>Number(i.invitation_group.replace(/\D/g,''))||0))+1;party='INV-'+String(n).padStart(3,'0')}if(!invitations.some(i=>i.invitation_group===party)){const x=await weddingSupabase.from('wedding_invitations').insert({invitation_group:party,contact_name:full});if(x.error){msg.textContent=x.error.message;return}}const x=await weddingSupabase.from('wedding_guests').insert({invitation_group:party,first_name:first,last_name:last||null,guest_type:document.getElementById('guestCategory').value==='Evening'?'Evening':'Day',adult_child:'Adult',rsvp_status:document.getElementById('guestRsvp').value,notes:document.getElementById('guestNotes').value.trim()||null});if(x.error){msg.textContent=x.error.message;return}form.reset();await loadGuests()});
 body.addEventListener('change',async e=>{const s=e.target.closest('[data-rsvp-id]');if(!s)return;const x=await weddingSupabase.from('wedding_guests').update({rsvp_status:s.value}).eq('id',s.dataset.rsvpId);msg.textContent=x.error?x.error.message:'RSVP updated.';if(!x.error)await loadGuests()});
 body.addEventListener('click',async e=>{const d=e.target.closest('[data-delete-guest]');if(d){if(!confirm('Remove this guest?'))return;const x=await weddingSupabase.from('wedding_guests').delete().eq('id',d.dataset.deleteGuest);msg.textContent=x.error?x.error.message:'Guest removed.';if(!x.error)await loadGuests();return}const c=e.target.closest('[data-copy-code]');if(c){await navigator.clipboard.writeText(c.dataset.copyCode);msg.textContent='RSVP code copied.'}});
 document.getElementById('clearGuests')?.addEventListener('click',async()=>{if(!confirm('Delete ALL guests from Supabase?'))return;if(!confirm('Seriously delete the entire guest list?'))return;const ids=guests.map(g=>g.id);if(!ids.length)return;const x=await weddingSupabase.from('wedding_guests').delete().in('id',ids);msg.textContent=x.error?x.error.message:'All guests removed.';if(!x.error)await loadGuests()});
 document.getElementById('exportGuests')?.addEventListener('click',()=>{const im=invMap(),rows=[['Name','Category','RSVP','Party','RSVP Code','Notes'],...guests.map(g=>[[g.first_name,g.last_name].filter(Boolean).join(' '),g.guest_type==='Evening'?'Evening':'Main',g.rsvp_status,g.invitation_group,im[g.invitation_group]?.rsvp_code||'',g.notes||''])];const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'),u=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),a=document.createElement('a');a.href=u;a.download='hewett-byrne-wedding-guest-list.csv';a.click();URL.revokeObjectURL(u)});
 function renderCosts(){costBody.innerHTML=costs.length?costs.map(c=>`<tr><td><b>${escapeHtml(c.item)}</b></td><td>${escapeHtml(c.details||'')}</td><td>${money(c.actual_cost??c.estimated_cost)}</td><td><button class="btn light" data-delete-cost="${c.id}">Remove</button></td></tr>`).join(''):'<tr><td colspan="4">No extras added yet.</td></tr>';const ex=costs.reduce((s,c)=>s+Number(c.actual_cost??c.estimated_cost??0),0),tot=12550+ex;['extrasTotal','extrasTableTotal'].forEach(id=>document.getElementById(id).textContent=money(ex));['weddingGrandTotal','topWeddingTotal'].forEach(id=>document.getElementById(id).textContent=money(tot))}
 async function loadCosts(){const x=await weddingSupabase.from('wedding_costs').select('*').order('sort_order').order('created_at');if(x.error){costMsg.textContent=x.error.message;return}costs=x.data||[];renderCosts();costMsg.textContent='Costs loaded from Supabase.'}
 document.getElementById('costForm')?.addEventListener('submit',async e=>{e.preventDefault();const amount=Number(document.getElementById('costAmount').value),x=await weddingSupabase.from('wedding_costs').insert({item:document.getElementById('costItem').value.trim(),details:document.getElementById('costDetails').value.trim()||null,estimated_cost:amount,actual_cost:amount,sort_order:costs.length+1});if(x.error){costMsg.textContent=x.error.message;return}e.target.reset();await loadCosts()});
 costBody?.addEventListener('click',async e=>{const b=e.target.closest('[data-delete-cost]');if(!b)return;const x=await weddingSupabase.from('wedding_costs').delete().eq('id',b.dataset.deleteCost);costMsg.textContent=x.error?x.error.message:'Cost removed.';if(!x.error)await loadCosts()});
 try{await Promise.all([loadGuests(),loadCosts()])}catch(err){msg.textContent='Supabase error: '+err.message}
})();

(()=>{const lookup=document.getElementById('rsvpLookupForm');if(!lookup||!window.weddingSupabase)return;const lm=document.getElementById('rsvpLookupMessage'),box=document.getElementById('rsvpHousehold'),forms=document.getElementById('rsvpGuestForms');let code='';
 lookup.addEventListener('submit',async e=>{e.preventDefault();code=document.getElementById('rsvpCode').value.trim().toLowerCase();lm.textContent='Finding your invitation…';box.hidden=true;const {data,error}=await weddingSupabase.rpc('lookup_wedding_invitation',{supplied_code:code});if(error||!data?.length){lm.textContent='We could not find that RSVP code. Please check it and try again.';return}lm.textContent='';forms.innerHTML=data.map(g=>`<form class="card rsvp-person" data-guest-id="${g.guest_id}"><h3>${escapeHtml([g.first_name,g.last_name].filter(Boolean).join(' '))}</h3><p class="small">${g.guest_type==='Evening'?'Evening invitation':'Day invitation'} · ${escapeHtml(g.adult_child)}</p><div class="form-grid"><div class="field"><label>Will you be joining us?</label><select name="status" required><option value="">Please choose</option><option value="Accepted" ${g.rsvp_status==='Accepted'?'selected':''}>Joyfully accepts</option><option value="Declined" ${g.rsvp_status==='Declined'?'selected':''}>Regretfully declines</option></select></div><div class="field full"><label>Dietary requirements / allergies</label><textarea name="dietary">${escapeHtml(g.dietary_requirements||'')}</textarea></div><div class="field"><label>Accommodation</label><select name="accommodation"><option value="">No answer yet</option><option>Interested</option><option>Not needed</option><option>Need more information</option></select></div><div class="field"><label>Transport</label><select name="transport"><option value="">No answer yet</option><option>Interested in shared transport</option><option>No transport needed</option><option>Need more information</option></select></div><div class="field full"><label>Message for Jo & Gary</label><textarea name="message"></textarea></div><div class="field full"><button class="btn" type="submit">Save ${escapeHtml(g.first_name)}'s RSVP</button> <span class="small rsvp-save-message"></span></div></div></form>`).join('');box.hidden=false});
 forms.addEventListener('submit',async e=>{const f=e.target.closest('.rsvp-person');if(!f)return;e.preventDefault();const m=f.querySelector('.rsvp-save-message'),fd=new FormData(f);m.textContent='Saving…';const {error}=await weddingSupabase.rpc('submit_wedding_rsvp',{supplied_code:code,supplied_guest_id:f.dataset.guestId,supplied_status:fd.get('status'),supplied_dietary:fd.get('dietary')||null,supplied_accommodation:fd.get('accommodation')||null,supplied_transport:fd.get('transport')||null,supplied_message:fd.get('message')||null});m.textContent=error?'Could not save: '+error.message:'Saved. Thank you ❤️'})
})();

(async()=>{
 const responseBody=document.querySelector('#rsvpResponseTable tbody');
 if(!responseBody||!window.weddingSupabase)return;
 const {data:{session}}=await weddingSupabase.auth.getSession();
 if(!session){location.replace('../login.html');return}
 const search=document.getElementById('responseSearch'),status=document.getElementById('responseStatus'),type=document.getElementById('responseType'),msg=document.getElementById('responseMessage');
 let rows=[];
 function render(){
   const q=(search.value||'').trim().toLowerCase(),sf=status.value,tf=type.value;
   const shown=rows.filter(g=>{
     const hay=[g.first_name,g.last_name,g.invitation_group,g.guest_message,g.dietary_requirements].filter(Boolean).join(' ').toLowerCase();
     return(!q||hay.includes(q))&&(!sf||g.rsvp_status===sf)&&(!tf||g.guest_type===tf);
   });
   document.getElementById('responseCount').textContent=rows.length;
   document.getElementById('acceptedCount').textContent=rows.filter(g=>g.rsvp_status==='Accepted').length;
   document.getElementById('declinedCount').textContent=rows.filter(g=>g.rsvp_status==='Declined').length;
   responseBody.innerHTML=shown.length?shown.map(g=>`<tr>
     <td><b>${escapeHtml([g.first_name,g.last_name].filter(Boolean).join(' '))}</b><br><span class="small">${escapeHtml(g.invitation_group||'')}</span></td>
     <td>${escapeHtml(g.guest_type||'')}</td>
     <td><b>${escapeHtml(g.rsvp_status||'')}</b></td>
     <td>${g.rsvp_submitted_at?new Date(g.rsvp_submitted_at).toLocaleString('en-GB'):'—'}</td>
     <td>${escapeHtml(g.dietary_requirements||'—')}</td>
     <td>${escapeHtml(g.accommodation||'—')}</td>
     <td>${escapeHtml(g.transport||'—')}</td>
     <td>${escapeHtml(g.guest_message||'—')}</td>
   </tr>`).join(''):'<tr><td colspan="8">No RSVP responses match those filters.</td></tr>';
 }
 [search,status,type].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
 const {data,error}=await weddingSupabase.from('wedding_guests').select('*').not('rsvp_submitted_at','is',null).order('rsvp_submitted_at',{ascending:false});
 if(error){msg.textContent='Could not load RSVP responses: '+error.message;return}
 rows=data||[];render();msg.textContent=`${rows.length} submitted RSVP response${rows.length===1?'':'s'} loaded.`;
})();

// ---------------------------
// Supabase wedding checklist
// ---------------------------
(async()=>{
 const form=document.getElementById('checklistForm');
 if(!form||!window.weddingSupabase)return;
 const {data:{session}}=await weddingSupabase.auth.getSession();
 if(!session)return;
 const rowsEl=document.getElementById('checklistRows'),msg=document.getElementById('checklistMessage');
 let rows=[];
 function render(){
   rowsEl.innerHTML=rows.length?rows.map(r=>`<div class="check-row">
     <input type="checkbox" data-check-id="${r.id}" ${r.completed?'checked':''}>
     <div style="flex:1"><b>${escapeHtml(r.item)}</b>${r.due_date?`<div class="small">Due ${new Date(r.due_date+'T12:00:00').toLocaleDateString('en-GB')}</div>`:''}${r.notes?`<div class="small">${escapeHtml(r.notes)}</div>`:''}</div>
     <button class="btn light" type="button" data-delete-check="${r.id}">Remove</button>
   </div>`).join(''):'<div class="small">Nothing on the checklist yet. Suspiciously peaceful.</div>';
 }
 async function load(){
   const {data,error}=await weddingSupabase.from('wedding_checklist').select('*').order('completed').order('sort_order').order('created_at');
   if(error){msg.textContent='Checklist setup needed: '+error.message;return}
   rows=data||[];render();msg.textContent=`${rows.filter(r=>!r.completed).length} jobs still to do.`;
 }
 form.addEventListener('submit',async e=>{
   e.preventDefault();
   const {error}=await weddingSupabase.from('wedding_checklist').insert({
     item:document.getElementById('checklistItem').value.trim(),
     due_date:document.getElementById('checklistDue').value||null,
     notes:document.getElementById('checklistNotes').value.trim()||null,
     sort_order:rows.length+1
   });
   if(error){msg.textContent='Could not add item: '+error.message;return}
   form.reset();await load();
 });
 rowsEl.addEventListener('change',async e=>{
   const c=e.target.closest('[data-check-id]');if(!c)return;
   const {error}=await weddingSupabase.from('wedding_checklist').update({completed:c.checked}).eq('id',c.dataset.checkId);
   if(error){msg.textContent='Could not update item: '+error.message;return}
   await load();
 });
 rowsEl.addEventListener('click',async e=>{
   const b=e.target.closest('[data-delete-check]');if(!b)return;
   if(!confirm('Remove this checklist item?'))return;
   const {error}=await weddingSupabase.from('wedding_checklist').delete().eq('id',b.dataset.deleteCheck);
   if(error){msg.textContent='Could not remove item: '+error.message;return}
   await load();
 });
 await load();
})();
