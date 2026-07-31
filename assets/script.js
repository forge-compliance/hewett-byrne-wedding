
document.querySelectorAll('.menu').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelector('.links')?.classList.toggle('open');
}));
document.querySelectorAll('.accordion button').forEach(btn=>btn.addEventListener('click',()=>{
  btn.parentElement.classList.toggle('open');
}));
const dateEl=document.querySelector('[data-wedding-date]');
if(dateEl){
  const raw=dateEl.dataset.weddingDate;
  const chosen=localStorage.getItem('hewettWeddingDate')||raw;
  const chosenDate=new Date(chosen+'T12:00:00');
  function tick(){
    const diff=chosenDate-new Date();
    const vals=diff>0?[
      Math.floor(diff/86400000),
      Math.floor(diff/3600000)%24,
      Math.floor(diff/60000)%60,
      Math.floor(diff/1000)%60
    ]:[0,0,0,0];
    ['days','hours','minutes','seconds'].forEach((id,i)=>{
      const el=document.getElementById(id); if(el) el.textContent=vals[i];
    });
  }
  tick();setInterval(tick,1000);
}
document.querySelectorAll('[data-save-check]').forEach((box,i)=>{
  const key='hewettCheck-'+(box.dataset.saveCheck||i);
  box.checked=localStorage.getItem(key)==='1';
  box.addEventListener('change',()=>localStorage.setItem(key,box.checked?'1':'0'));
});
const datePicker=document.getElementById('privateDate');
if(datePicker){
  datePicker.value=localStorage.getItem('hewettWeddingDate')||'2027-10-23';
  datePicker.addEventListener('change',()=>{
    localStorage.setItem('hewettWeddingDate',datePicker.value);
    document.getElementById('savedMessage').textContent='Saved on this device.';
  });
}


(function(){
  const form = document.getElementById('guestForm');
  const tableBody = document.querySelector('#guestTable tbody');
  if(!form || !tableBody) return;

  const STORAGE_KEY = 'hewettWeddingGuestsV1';
  let guests = [];

  try {
    guests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if(!Array.isArray(guests)) guests = [];
  } catch (e) {
    guests = [];
  }

  function escapeHtml(value){
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
  }

  function render(){
    tableBody.innerHTML = guests.length ? guests.map((g, i) => `
      <tr>
        <td>${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.category)}</td>
        <td>${escapeHtml(g.rsvp)}</td>
        <td>${escapeHtml(g.party)}</td>
        <td>${escapeHtml(g.notes)}</td>
        <td><button class="btn light" type="button" data-delete-guest="${i}">Remove</button></td>
      </tr>
    `).join('') : '<tr><td colspan="6">No guests added yet.</td></tr>';

    const counts = {Main:0, Evening:0, Night:0};
    guests.forEach(g => { if(counts[g.category] !== undefined) counts[g.category]++; });
    document.getElementById('mainCount').textContent = counts.Main;
    document.getElementById('eveningCount').textContent = counts.Evening;
    document.getElementById('nightCount').textContent = counts.Night;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('guestName').value.trim();
    if(!name) return;
    guests.push({
      name,
      category: document.getElementById('guestCategory').value,
      rsvp: document.getElementById('guestRsvp').value,
      party: document.getElementById('guestParty').value.trim(),
      notes: document.getElementById('guestNotes').value.trim()
    });
    save();
    form.reset();
    document.getElementById('guestCategory').value = 'Main';
    document.getElementById('guestRsvp').value = 'Awaiting reply';
    render();
  });

  tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-delete-guest]');
    if(!btn) return;
    const index = Number(btn.dataset.deleteGuest);
    guests.splice(index, 1);
    save();
    render();
  });

  document.getElementById('clearGuests')?.addEventListener('click', () => {
    if(confirm('Clear the entire guest list from this device?')){
      guests = [];
      save();
      render();
    }
  });

  document.getElementById('exportGuests')?.addEventListener('click', () => {
    const rows = [['Name','Category','RSVP','Party','Notes'], ...guests.map(g => [
      g.name, g.category, g.rsvp, g.party, g.notes
    ])];
    const csv = rows.map(row => row.map(value => {
      const s = String(value ?? '').replaceAll('"','""');
      return `"${s}"`;
    }).join(',')).join('\n');

    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hewett-byrne-wedding-guest-list.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  render();
})();
