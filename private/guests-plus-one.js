(()=>{
 const form=document.getElementById('guestForm');
 const nameEl=document.getElementById('guestName');
 const plusOne=document.getElementById('guestPlusOne');
 if(!window.weddingSupabase)return;
 const table=document.getElementById('guestTable');
 const renderPlusOneBoxes=()=>{
   if(!table)return;
   table.querySelectorAll('tbody tr').forEach(row=>{
     if(row.dataset.plusOneReady)return;
     const first=row.querySelector('td'); if(!first)return;
     const name=(first.textContent||'').trim().split('\n')[0].trim();
     if(!name||name==='Name')return;
     const cell=document.createElement('div');
     cell.style.cssText='margin-top:7px;font-size:13px;';
     cell.innerHTML=`<label style="display:flex;align-items:center;gap:7px;cursor:pointer;font-weight:600"><input type="checkbox" class="existing-plus-one" style="width:18px;height:18px;margin:0;accent-color:#6f5a3e"><span>Give plus one</span></label>`;
     first.appendChild(cell);
     const box=cell.querySelector('input');
     box.addEventListener('change',async()=>{
       if(!box.checked)return;
       box.disabled=true;
       const {data,error}=await weddingSupabase.from('wedding_guests').select('id,invitation_group,first_name,last_name,guest_type').or(`first_name.eq.${name.split(' ')[0]},last_name.eq.${name.split(' ').slice(1).join(' ')}`).order('created_at',{ascending:false}).limit(1);
       if(error||!data?.length){box.checked=false;box.disabled=false;alert('Could not find this guest.');return;}
       const host=data[0];
       const {error:insertError}=await weddingSupabase.from('wedding_guests').insert({invitation_group:host.invitation_group,first_name:'Plus One',last_name:host.first_name,guest_type:host.guest_type,adult_child:'Adult',rsvp_status:'Awaiting reply',plus_one:true,notes:`Plus one for ${[host.first_name,host.last_name].filter(Boolean).join(' ')}`});
       if(insertError){box.checked=false;box.disabled=false;alert('Could not add plus-one: '+insertError.message);return;}
       location.reload();
     });
   });
 };
 const observer=new MutationObserver(renderPlusOneBoxes); if(table)observer.observe(table,{childList:true,subtree:true}); renderPlusOneBoxes();
 if(form&&nameEl&&plusOne){
   let pending=null;
   form.addEventListener('submit',()=>{
     if(!plusOne.checked)return;
     pending={name:nameEl.value.trim()};
     setTimeout(async()=>{
       if(!pending)return; const p=pending;pending=null;
       const parts=p.name.split(/\s+/),first=parts.shift(),last=parts.join(' ');
       let q=weddingSupabase.from('wedding_guests').select('id,invitation_group,first_name,last_name,guest_type,created_at').eq('first_name',first).order('created_at',{ascending:false}).limit(1);
       if(last)q=q.eq('last_name',last);
       const {data,error}=await q;if(error||!data?.length)return; const host=data[0];
       const {error:insertError}=await weddingSupabase.from('wedding_guests').insert({invitation_group:host.invitation_group,first_name:'Plus One',last_name:host.first_name,guest_type:host.guest_type,adult_child:'Adult',rsvp_status:'Awaiting reply',plus_one:true,notes:`Plus one for ${[host.first_name,host.last_name].filter(Boolean).join(' ')}`});
       if(insertError){const m=document.getElementById('guestImportMessage');if(m)m.textContent='Guest added, but plus-one could not be added: '+insertError.message;}else location.reload();
     },800);
   },true);
 }
})();