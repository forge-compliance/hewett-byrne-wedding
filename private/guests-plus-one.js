(()=>{
 const form=document.getElementById('guestForm');
 const nameEl=document.getElementById('guestName');
 const plusOne=document.getElementById('guestPlusOne');
 if(!form||!nameEl||!plusOne||!window.weddingSupabase)return;
 let pending=null;
 form.addEventListener('submit',()=>{
   if(!plusOne.checked)return;
   pending={name:nameEl.value.trim()};
   setTimeout(async()=>{
     if(!pending)return;
     const p=pending;pending=null;
     const parts=p.name.split(/\s+/),first=parts.shift(),last=parts.join(' ');
     let q=weddingSupabase.from('wedding_guests').select('id,invitation_group,first_name,last_name,guest_type,created_at').eq('first_name',first).order('created_at',{ascending:false}).limit(1);
     if(last)q=q.eq('last_name',last);
     const {data,error}=await q;
     if(error||!data?.length)return;
     const host=data[0];
     const {error:insertError}=await weddingSupabase.from('wedding_guests').insert({
       invitation_group:host.invitation_group,
       first_name:'Plus One',
       last_name:host.first_name,
       guest_type:host.guest_type,
       adult_child:'Adult',
       rsvp_status:'Awaiting reply',
       plus_one:true,
       notes:`Plus one for ${[host.first_name,host.last_name].filter(Boolean).join(' ')}`
     });
     if(insertError){const m=document.getElementById('guestImportMessage');if(m)m.textContent='Guest added, but plus-one could not be added: '+insertError.message;}
     else location.reload();
   },800);
 },true);
})();