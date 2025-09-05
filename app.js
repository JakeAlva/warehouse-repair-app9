
// Simple in-memory + localStorage store
const store = {
  load() { try { return JSON.parse(localStorage.getItem('hh_survey_v9')) || {meta:{}, frames:[], damages:[]}; } catch { return {meta:{}, frames:[], damages:[]}; } },
  save(data) { localStorage.setItem('hh_survey_v9', JSON.stringify(data)); }
}
let data = store.load();

// Tab nav helpers
const tabs = document.querySelectorAll('nav.tabs button');
const views = {
  start: document.getElementById('view-start'),
  frame: document.getElementById('view-frame'),
  damage: document.getElementById('view-damage'),
  done: document.getElementById('view-done')
};
function show(view) {
  for (const t of tabs) t.classList.toggle('active', t.dataset.view === view);
  for (const id in views) views[id].hidden = id !== view;
}
tabs.forEach(b=> b.addEventListener('click', ()=>show(b.dataset.view)));

// Info modals
document.querySelectorAll('.info').forEach(btn=>{
  btn.addEventListener('click', ()=> {
    const id = btn.dataset.modal;
    document.getElementById(id).showModal();
  });
});

// Meta
const facilityName = document.getElementById('facilityName');
const surveyor = document.getElementById('surveyor');
const surveyDate = document.getElementById('surveyDate');
const surveyNotes = document.getElementById('surveyNotes');
[facilityName, surveyor, surveyDate, surveyNotes].forEach(el=>{
  const key = el.id;
  el.value = data.meta[key] || '';
  el.addEventListener('change', ()=>{ data.meta[key] = el.value; store.save(data); });
});
document.getElementById('goToFrame').addEventListener('click', ()=>{
  show('frame');
});

// Frame form
const frameDepth = document.getElementById('frameDepth');
const frameWidth = document.getElementById('frameWidth');
const backerType = document.getElementById('backerType');
const strutHeights = document.getElementById('strutHeights');
const holeStyle = document.getElementById('holeStyle');
const hStrutsNeeded = document.getElementById('hStrutsNeeded');
const dStrutsNeeded = document.getElementById('dStrutsNeeded');
const frameNotes = document.getElementById('frameNotes');

// Enable proceed button only if notes entered (as requested)
const proceedDamage = document.getElementById('proceedDamage');
function updateProceed() {
  proceedDamage.disabled = frameNotes.value.trim().length === 0;
}
frameNotes.addEventListener('input', updateProceed);
updateProceed();

document.getElementById('saveFrame').addEventListener('click', ()=>{
  const frame = {
    depth: frameDepth.value,
    width: frameWidth.value,
    backerType: backerType.value,
    strutHeights: strutHeights.value,
    holeStyle: holeStyle.value,
    hStrutsNeeded: hStrutsNeeded.value || 0,
    dStrutsNeeded: dStrutsNeeded.value || 0,
    notes: frameNotes.value.trim(),
    createdAt: new Date().toISOString()
  };
  data.frames.push(frame);
  store.save(data);
  alert('Frame saved.');
});
proceedDamage.addEventListener('click', ()=> show('damage'));

// Damage section
const damageList = document.getElementById('damageList');
function renderDamages(){
  damageList.innerHTML = '';
  data.damages.forEach((dmg, idx)=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.style.gridColumn = '1 / -1';
    card.innerHTML = `
      <div class="row">
        <div>
          <label>Location</label>
          <input type="text" value="${dmg.location}" data-k="location" placeholder="e.g., Aisle 12 / Bay 4 — Front Left Post"/>
        </div>
        <div>
          <label>Beam level height (in) <button class="info" data-modal="modal-beam">i</button></label>
          <input type="text" value="${dmg.beamHeights || ''}" data-k="beamHeights" placeholder="bottom, top (e.g., 34, 42)"/>
        </div>
      </div>
      <div class="row">
        <div>
          <label>Description</label>
          <input type="text" value="${dmg.description || ''}" data-k="description" placeholder="What is damaged?"/>
        </div>
        <div>
          <label>Severity</label>
          <select data-k="severity">
            ${['Low','Medium','High'].map(s=>`<option ${dmg.severity===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>

      <label>Photos (optional)</label>
      <input type="file" accept="image/*" capture="environment" data-k="photos" multiple />
      <div class="gallery"></div>

      <div class="actions">
        <button class="btn ghost" data-act="remove">Remove</button>
      </div>
    `;
    // hook up info buttons inside card
    card.querySelectorAll('.info').forEach(b=> b.addEventListener('click', ()=> document.getElementById(b.dataset.modal).showModal() ));
    const gallery = card.querySelector('.gallery');

    function refreshGallery(){
      gallery.innerHTML = '';
      (dmg.photos || []).forEach((src, i)=>{
        const div = document.createElement('div');
        div.className = 'thumb';
        div.innerHTML = `<img src="${src}"/><span class="x" title="remove">×</span>`;
        div.querySelector('.x').addEventListener('click', ()=>{
          dmg.photos.splice(i,1); store.save(data); refreshGallery();
        });
        gallery.appendChild(div);
      });
    }
    refreshGallery();

    // handlers for inputs
    card.querySelectorAll('input,select,textarea').forEach(input=>{
      const k = input.dataset.k;
      if (!k) return;
      input.addEventListener('change', ()=>{
        if (k === 'photos'){
          const files = input.files;
          if (!files || !files.length) return;
          const readers = [];
          dmg.photos = dmg.photos || [];
          Array.from(files).forEach(file=>{
            const r = new FileReader();
            r.onload = e => {
              dmg.photos.push(e.target.result);
              store.save(data);
              refreshGallery();
            };
            r.readAsDataURL(file);
          });
          input.value = '';
          return;
        }
        dmg[k] = input.value;
        store.save(data);
      });
    });

    // remove
    card.querySelector('[data-act="remove"]').addEventListener('click', ()=>{
      if (confirm('Remove this damage location?')){
        data.damages.splice(idx,1);
        store.save(data);
        renderDamages();
      }
    });

    damageList.appendChild(card);
  });
}
renderDamages();

document.getElementById('addDamage').addEventListener('click', ()=>{
  data.damages.push({ location:'', description:'', severity:'Low', photos:[] });
  store.save(data);
  renderDamages();
});
document.getElementById('finishSurvey').addEventListener('click', ()=> show('done'));

// DONE view
const donePreview = document.getElementById('donePreview');
function renderDone(){
  donePreview.innerHTML = `
    <div class="card">
      <div class="badge">Frames: ${data.frames.length}</div>
      <div class="badge">Damaged locations: ${data.damages.length}</div>
    </div>
  `;
}
renderDone();

document.getElementById('newSurvey').addEventListener('click', ()=>{
  if (!confirm('Start a new survey? This clears current local data.')) return;
  data = {meta:{}, frames:[], damages:[]};
  store.save(data);
  // Reset fields
  [facilityName,surveyor,surveyDate,surveyNotes].forEach(el=> el.value='');
  [frameDepth,frameWidth,backerType,strutHeights,holeStyle,hStrutsNeeded,dStrutsNeeded,frameNotes].forEach(el=> el.value='');
  updateProceed();
  renderDamages();
  renderDone();
  show('start');
});

// Export helpers
document.getElementById('exportJson').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:'hammerhead-survey.json'});
  a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
});

document.getElementById('exportCsv').addEventListener('click', ()=>{
  // Very simple CSV export of frames and damages counts
  const rows = [
    ['facilityName','surveyor','surveyDate','frames','damagedLocations'],
    [data.meta.facilityName||'', data.meta.surveyor||'', data.meta.surveyDate||'', data.frames.length, data.damages.length]
  ];
  const csv = rows.map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:'hammerhead-summary.csv'});
  a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
});
