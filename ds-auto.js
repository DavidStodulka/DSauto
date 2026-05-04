/* DS AUTO — Sdílený JavaScript v1.0 */
'use strict';

// ===== NAV =====
(function initNav() {
  const burger = document.getElementById('hamburger');
  const links  = document.getElementById('navLinks');
  if (!burger || !links) return;
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open');
    links.classList.remove('open');
  }));
  const ids = Array.from(document.querySelectorAll('section[id]')).map(s => s.id);
  if (ids.length) {
    window.addEventListener('scroll', () => {
      let cur = ids[0];
      ids.forEach(id => { const el = document.getElementById(id); if (el && window.scrollY >= el.offsetTop - 130) cur = id; });
      document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    }, { passive: true });
  }
})();

// ===== EDIT MODE =====
const EditMode = (function() {
  const KEY = 'dsauto_content_v2';
  let active = false;
  const getEditables = () => document.querySelectorAll('[data-editable]');
  function toggle() {
    active = !active;
    document.body.classList.toggle('edit-mode', active);
    const tb = document.getElementById('editToggle');
    const sb = document.getElementById('editSave');
    if (tb) { tb.classList.toggle('active', active); tb.textContent = active ? 'Ukončit úpravy' : 'Upravit texty'; }
    if (sb) sb.style.display = active ? 'inline-block' : 'none';
    getEditables().forEach(el => { el.contentEditable = active ? 'true' : 'false'; });
    if (active) load();
  }
  function save() {
    const data = {};
    getEditables().forEach((el, i) => { data[i] = el.innerHTML; });
    localStorage.setItem(KEY, JSON.stringify(data));
    const btn = document.getElementById('editSave');
    if (btn) { const o = btn.textContent; btn.textContent = 'Uloženo ✓'; btn.style.background = '#1a6b1a'; setTimeout(() => { btn.textContent = o; btn.style.background = ''; }, 2000); }
  }
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); getEditables().forEach((el, i) => { if (d[i] !== undefined) el.innerHTML = d[i]; }); } catch(e) {}
  }
  function init() {
    getEditables().forEach(el => { el.contentEditable = 'false'; });
    load();
    document.getElementById('editToggle')?.addEventListener('click', toggle);
    document.getElementById('editSave')?.addEventListener('click', save);
  }
  return { init, toggle, save, load };
})();

// ===== FORM HELPERS =====
const FormHelper = {
  showStatus(el, type, msg) { if (!el) return; el.style.display = 'block'; el.className = 'form-status ' + (type === 'ok' ? 'ok' : 'err'); el.textContent = msg; },
  hideStatus(el) { if (el) el.style.display = 'none'; },
  setLoading(btn, loading, orig) { if (!btn) return; btn.disabled = loading; btn.textContent = loading ? 'Odesílám…' : orig; },
  getValue(id) { return document.getElementById(id)?.value.trim() || ''; },
  clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); },
};

// ===== CONTACT TABS =====
function switchContactTab(tab) {
  document.querySelectorAll('.contact-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.contact-form-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById('panel-' + tab)?.classList.add('active');
}

function initContactForm() {
  document.getElementById('btnSendKlient')?.addEventListener('click', () => sendContactForm('klient'));
  document.getElementById('btnSendTechnik')?.addEventListener('click', () => sendContactForm('technik'));
  document.querySelectorAll('.contact-tab-btn').forEach(btn => btn.addEventListener('click', () => switchContactTab(btn.dataset.tab)));
}

function sendContactForm(type) {
  const cfg = {
    klient:  { req: ['cf_jmeno','cf_kontakt'], btnId: 'btnSendKlient', statusId: 'cf_status', clearIds: ['cf_jmeno','cf_kontakt','cf_vin'], successMsg: 'Odesláno. Ozvu se do 24 hodin.', data: () => ({ typ_formular:'KLIENT', from_name: FormHelper.getValue('cf_jmeno'), kontakt: FormHelper.getValue('cf_kontakt'), typ_proveri: FormHelper.getValue('cf_typ'), vin_inzerat: FormHelper.getValue('cf_vin') || 'Nevyplněno' }) },
    technik: { req: ['tf_jmeno','tf_kontakt'], btnId: 'btnSendTechnik', statusId: 'tf_status', clearIds: ['tf_jmeno','tf_kontakt','tf_region','tf_bio'], successMsg: 'Přihláška odeslána. Ozvu se do 48 hodin.', data: () => ({ typ_formular:'TECHNIK', from_name: FormHelper.getValue('tf_jmeno'), kontakt: FormHelper.getValue('tf_kontakt'), region: FormHelper.getValue('tf_region') || 'Neuvedeno', zkusenosti: FormHelper.getValue('tf_zkusenosti'), bio: FormHelper.getValue('tf_bio') || 'Neuvedeno' }) },
  };
  const c = cfg[type];
  const status = document.getElementById(c.statusId);
  const btn = document.getElementById(c.btnId);
  const orig = btn?.textContent || '';
  for (const fid of c.req) { if (!FormHelper.getValue(fid)) { FormHelper.showStatus(status, 'err', 'Vyplňte prosím povinná pole.'); return; } }
  FormHelper.setLoading(btn, true, orig);
  if (typeof emailjs !== 'undefined') {
    emailjs.send('DOPLNIT_SERVICE_ID', 'DOPLNIT_TEMPLATE_ID', c.data())
      .then(() => { FormHelper.showStatus(status, 'ok', c.successMsg); if (btn) btn.textContent = 'Odesláno ✓'; FormHelper.clearFields(c.clearIds); })
      .catch(() => { FormHelper.showStatus(status, 'err', 'Chyba. Napište přímo na info@dsauto.cz'); FormHelper.setLoading(btn, false, orig); });
  } else {
    setTimeout(() => { FormHelper.showStatus(status, 'ok', c.successMsg); if (btn) btn.textContent = 'Odesláno ✓'; FormHelper.clearFields(c.clearIds); }, 600);
  }
}

// ===== VIN LINKS =====
function initVinLinks() { document.getElementById('vin')?.addEventListener('input', updateVinLinks); }
function updateVinLinks() {
  const vin = (document.getElementById('vin')?.value || '').trim().toUpperCase();
  const ok = vin.length >= 10;
  const map = { lkVin: `https://www.kontrola-vin.cz/check/?q=${vin}`, lkStk: `https://www.kontrola-stk.cz/?q=${vin}`, lkCar: `https://www.car.cz/vin/?vin=${vin}`, lkAutovin: `https://autovin.cz/?vin=${vin}` };
  Object.entries(map).forEach(([id, url]) => { const el = document.getElementById(id); if (!el) return; el.href = ok ? url : '#'; el.classList.toggle('disabled', !ok); });
}

// ===== SESSION =====
const Session = (function() {
  const KEY = 'ds_session', TTL = 8 * 60 * 60 * 1000;
  function get() { try { const s = JSON.parse(sessionStorage.getItem(KEY) || '{}'); if (s.loginTime && Date.now() - s.loginTime > TTL) { clear(); return null; } return s.jmeno ? s : null; } catch(e) { return null; } }
  function set(data) { sessionStorage.setItem(KEY, JSON.stringify({ ...data, loginTime: Date.now() })); }
  function clear() { sessionStorage.removeItem(KEY); }
  function require(url) { if (!get()) window.location.href = url || 'login.html'; }
  return { get, set, clear, require };
})();

// ===== DB (localStorage) =====
const DB = (function() {
  const KEY = 'ds_zakazky';
  function getAll() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; } }
  function save(z) { const all = getAll(); const i = all.findIndex(x => x.id === z.id); if (i >= 0) all[i] = z; else all.push(z); localStorage.setItem(KEY, JSON.stringify(all)); }
  function getById(id) { return getAll().find(z => z.id === id) || null; }
  function nextId() { return `DS-${new Date().getFullYear()}-${String(getAll().length + 1).padStart(3,'0')}`; }
  return { getAll, save, getById, nextId };
})();

// ===== PHOTO UPLOAD =====
const PhotoUpload = (function() {
  const store = {};
  function init(sec) { if (!store[sec]) store[sec] = []; }
  function add(sec) {
    init(sec);
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.onchange = e => Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onload = ev => addToGrid(sec, ev.target.result, f.name); r.readAsDataURL(f); });
    inp.click();
  }
  function addToGrid(sec, url, name) {
    store[sec].push({ data: url, name });
    const grid = document.getElementById('photos_' + sec);
    if (!grid) return;
    const wrap = document.createElement('div');
    const slot = document.createElement('div');
    slot.className = 'photo-slot has-photo';
    slot.innerHTML = `<img src="${url}" alt="${name}"><div class="photo-placeholder"><div class="photo-placeholder-icon">📷</div><div class="photo-placeholder-text">Foto</div></div><button class="photo-remove" aria-label="Odebrat">✕</button>`;
    slot.querySelector('.photo-remove').addEventListener('click', () => wrap.remove());
    wrap.appendChild(slot); grid.appendChild(wrap);
  }
  function getAll(sec) { return store[sec] || []; }
  return { add, getAll, init };
})();

// ===== OBD =====
const OBD = (function() {
  let idx = 0;
  function add() {
    const i = idx++, list = document.getElementById('obdList');
    if (!list) return;
    const row = document.createElement('div');
    row.className = 'obd-row'; row.id = 'obd_' + i;
    row.innerHTML = `<input class="form-input" type="text" placeholder="P0300" maxlength="6" style="width:90px;font-family:var(--font-cond);font-weight:700;font-size:15px;color:var(--red);letter-spacing:2px;text-transform:uppercase;"><input class="form-input" type="text" placeholder="Popis závady…" style="flex:1;"><select class="form-select" style="width:110px;"><option>Informace</option><option>Výhrada</option><option>Kritická</option></select><button class="btn btn-sm" style="padding:7px 10px;" onclick="this.closest('.obd-row').remove()">✕</button>`;
    list.appendChild(row);
  }
  function getAll() {
    return Array.from(document.querySelectorAll('.obd-row')).map(r => ({ code: r.querySelectorAll('input')[0]?.value.trim().toUpperCase() || '', desc: r.querySelectorAll('input')[1]?.value.trim() || '', sev: r.querySelector('select')?.value || '' })).filter(c => c.code);
  }
  return { add, getAll };
})();

// ===== UTILS =====
function thCheck(input) { const v = parseInt(input.value); input.classList.remove('th-warning','th-ok'); if (!isNaN(v)) input.classList.add(v > 200 || v < 60 ? 'th-warning' : 'th-ok'); }
function formatCzk(n) { return Math.round(n).toLocaleString('cs-CZ') + '\u00a0Kč'; }
function formatDate(str) { if (!str) return '—'; const [y,m,d] = str.split('-'); return `${d}.\u00a0${m}.\u00a0${y}`; }
function today() { return new Date().toISOString().split('T')[0]; }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => { EditMode.init(); initContactForm(); initVinLinks(); });
