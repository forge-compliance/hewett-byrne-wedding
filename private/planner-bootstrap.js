(()=>{
  const loadScript=src=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);
  });

  (async()=>{
    if(!window.weddingSupabase){
      location.replace('../login.html');
      return;
    }
    const {data,error}=await weddingSupabase.auth.getSession();
    if(error||!data?.session){
      location.replace('../login.html');
      return;
    }
    try{
      await loadScript('../assets/script.js?v=20260927-finance-2');
      await loadScript('room-tracker.js?v=20260927-room-share-2');
      await loadScript('package-cost-row.js?v=2');
      await loadScript('payment-allocation.js?v=3');
    }catch(_){
      const roomMsg=document.getElementById('roomTrackerMessage');
      const costMsg=document.getElementById('costSavedMessage');
      const checkMsg=document.getElementById('checklistMessage');
      if(roomMsg)roomMsg.textContent='Planner code failed to load. Refresh this page.';
      if(costMsg)costMsg.textContent='Planner code failed to load. Refresh this page.';
      if(checkMsg)checkMsg.textContent='Planner code failed to load. Refresh this page.';
    }
  })();
})();