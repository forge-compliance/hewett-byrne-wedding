
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
  datePicker.value=localStorage.getItem('hewettWeddingDate')||'2027-09-11';
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

  function parseCsv(text){
    const rows = [];
    let row = [], field = '', quoted = false;
    for(let i = 0; i < text.length; i++){
      const ch = text[i];
      if(quoted){
        if(ch === '"' && text[i + 1] === '"'){
          field += '"'; i++;
        } else if(ch === '"'){
          quoted = false;
        } else {
          field += ch;
        }
      } else {
        if(ch === '"') quoted = true;
        else if(ch === ','){ row.push(field); field = ''; }
        else if(ch === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
        else if(ch !== '\r') field += ch;
      }
    }
    if(field.length || row.length){ row.push(field); rows.push(row); }
    return rows;
  }

  document.getElementById('importGuests')?.addEventListener('click', () => {
    document.getElementById('importGuestsFile')?.click();
  });

  document.getElementById('importGuestsFile')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const message = document.getElementById('guestImportMessage');
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const rows = parseCsv(text);
      if(rows.length < 2) throw new Error('No guest rows found.');

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const required = ['name','category','rsvp','party','notes'];
      const missing = required.filter(h => !headers.includes(h));
      if(missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}`);

      const col = Object.fromEntries(required.map(h => [h, headers.indexOf(h)]));
      const imported = rows.slice(1).filter(r => r.some(v => String(v || '').trim())).map(r => ({
        name: String(r[col.name] || '').trim(),
        category: ['Main','Evening','Night'].includes(String(r[col.category] || '').trim()) ? String(r[col.category]).trim() : 'Main',
        rsvp: ['Awaiting reply','Accepted','Declined'].includes(String(r[col.rsvp] || '').trim()) ? String(r[col.rsvp]).trim() : 'Awaiting reply',
        party: String(r[col.party] || '').trim(),
        notes: String(r[col.notes] || '').trim()
      })).filter(g => g.name);

      if(!imported.length) throw new Error('No valid named guests found.');
      if(guests.length && !confirm(`This will replace the ${guests.length} guests already saved on this device. Continue?`)){
        e.target.value = '';
        return;
      }

      guests = imported;
      save();
      render();
      if(message) message.textContent = `${imported.length} guests imported successfully and saved on this device.`;
    } catch(err){
      if(message) message.textContent = `Import failed: ${err.message}`;
    }
    e.target.value = '';
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


// September Buckler's Bliss wedding cost tracker
(() => {
  const form = document.getElementById('costForm');
  const tableBody = document.querySelector('#costTable tbody');
  if(!form || !tableBody) return;

  const BASE_TOTAL = 12550;
  const STORAGE_KEY = 'hewettWeddingCosts';
  let costs = [];
  try { costs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { costs = []; }

  const money = value => new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP', maximumFractionDigits:2}).format(value);
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function renderCosts(){
    tableBody.innerHTML = costs.length ? costs.map((c, i) => `
      <tr>
        <td><b>${escapeHtml(c.item)}</b></td>
        <td>${escapeHtml(c.details || '')}</td>
        <td>${money(Number(c.amount) || 0)}</td>
        <td><button class="btn light" type="button" data-delete-cost="${i}">Remove</button></td>
      </tr>`).join('') : '<tr><td colspan="4" class="small">No extras added yet.</td></tr>';

    const extras = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const total = BASE_TOTAL + extras;
    document.getElementById('extrasTotal').textContent = money(extras);
    document.getElementById('extrasTableTotal').textContent = money(extras);
    document.getElementById('weddingGrandTotal').textContent = money(total);
    document.getElementById('topWeddingTotal').textContent = money(total);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const item = document.getElementById('costItem').value.trim();
    const details = document.getElementById('costDetails').value.trim();
    const amount = Number(document.getElementById('costAmount').value);
    if(!item || !Number.isFinite(amount) || amount < 0) return;
    costs.push({item, details, amount});
    save();
    form.reset();
    renderCosts();
    const msg = document.getElementById('costSavedMessage');
    if(msg) msg.textContent = `${item} added. Costs saved automatically on this device.`;
  });

  tableBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-delete-cost]');
    if(!btn) return;
    costs.splice(Number(btn.dataset.deleteCost), 1);
    save();
    renderCosts();
  });

  renderCosts();
})();
