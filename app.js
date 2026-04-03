/* ─── QUANTAFLOW · app.js ─── */

/* 
   UNIT DATA
 */
const UNITS = {
  length: {
    label: 'Length',
    units: {
      m: { name: 'Metre', factor: 1 },
      km: { name: 'Kilometre', factor: 1000 },
      cm: { name: 'Centimetre', factor: 0.01 },
      mm: { name: 'Millimetre', factor: 0.001 },
      mi: { name: 'Mile', factor: 1609.344 },
      yd: { name: 'Yard', factor: 0.9144 },
      ft: { name: 'Foot', factor: 0.3048 },
      in: { name: 'Inch', factor: 0.0254 },
      nmi: { name: 'Nautical Mile', factor: 1852 },
    }
  },
  weight: {
    label: 'Weight',
    units: {
      kg: { name: 'Kilogram', factor: 1 },
      g: { name: 'Gram', factor: 0.001 },
      mg: { name: 'Milligram', factor: 0.000001 },
      lb: { name: 'Pound', factor: 0.45359237 },
      oz: { name: 'Ounce', factor: 0.028349523 },
      t: { name: 'Metric Ton', factor: 1000 },
      st: { name: 'Stone', factor: 6.35029 },
    }
  },
  temperature: {
    label: 'Temperature',
    units: {
      C: { name: 'Celsius' },
      F: { name: 'Fahrenheit' },
      K: { name: 'Kelvin' },
      R: { name: 'Rankine' },
    }
  },
  volume: {
    label: 'Volume',
    units: {
      L: { name: 'Litre', factor: 1 },
      mL: { name: 'Millilitre', factor: 0.001 },
      m3: { name: 'Cubic Metre', factor: 1000 },
      cm3: { name: 'Cubic Cm', factor: 0.001 },
      gal: { name: 'US Gallon', factor: 3.78541 },
      qt: { name: 'US Quart', factor: 0.946353 },
      pt: { name: 'US Pint', factor: 0.473176 },
      fl_oz: { name: 'Fluid Oz', factor: 0.0295735 },
      cup: { name: 'Cup', factor: 0.236588 },
    }
  }
};

/* 
   STATE
 */
let currentUser = null;
let history = JSON.parse(localStorage.getItem('qf_hist') || '[]');
let convCat = 'length';
let cmpCat = 'length';
let arithCat = 'length';
let currentOp = '+';
let isDark = true;

/* 
   TEMPERATURE HELPERS
 */
function toCelsius(v, from) {
  if (from === 'C') return v;
  if (from === 'F') return (v - 32) * 5 / 9;
  if (from === 'K') return v - 273.15;
  if (from === 'R') return (v - 491.67) * 5 / 9;
}
function fromCelsius(c, to) {
  if (to === 'C') return c;
  if (to === 'F') return c * 9 / 5 + 32;
  if (to === 'K') return c + 273.15;
  if (to === 'R') return (c + 273.15) * 9 / 5;
}
function convertVal(v, from, to, cat) {
  if (cat === 'temperature') return fromCelsius(toCelsius(v, from), to);
  return (v * UNITS[cat].units[from].factor) / UNITS[cat].units[to].factor;
}

/* 
   NUMBER FORMAT
 */
function fmt(n) {
  if (isNaN(n) || n === null) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(3) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(3) + 'M';
  if (Math.abs(n) >= 1000) return parseFloat(n.toFixed(4)).toLocaleString();
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(4);
  return parseFloat(n.toFixed(6)).toString();
}

/* 
   AUTH — SIGN IN / SIGN UP
 */
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').classList.toggle('hidden', !isLogin);
  document.getElementById('form-signup').classList.toggle('hidden', isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
  document.getElementById('tab-track').style.transform =
    isLogin ? 'translateX(0)' : 'translateX(100%)';
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-password').value;
  if (!email || !pw) { toast('Please fill in all fields', 'error'); return; }
  if (!email.includes('@')) { toast('Enter a valid email', 'error'); return; }
  const saved = JSON.parse(localStorage.getItem('qf_u_' + email));
  if (!saved) { toast('Account not found — please sign up', 'error'); return; }
  // if (saved.pw !== btoa(pw)) { toast('Incorrect password', 'error'); return; }
  if (!saved.google && saved.pw !== btoa(pw)) {
  toast('Incorrect password', 'error');
  return;
}


  enterDashboard({ name: saved.name, email, av: saved.name[0].toUpperCase() });
}

function handleSignup() {
  const fn = document.getElementById('signup-fname').value.trim();
  const ln = document.getElementById('signup-lname').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw = document.getElementById('signup-password').value;
  const terms = document.getElementById('terms-chk').checked;
  if (!fn || !ln || !email || !pw) { toast('Please fill all fields', 'error'); return; }
  if (!email.includes('@')) { toast('Enter a valid email', 'error'); return; }
  if (pw.length < 8) { toast('Password must be 8+ characters', 'error'); return; }
  if (!terms) { toast('Please accept the terms', 'error'); return; }
  const name = fn + ' ' + ln;
  localStorage.setItem('qf_u_' + email, JSON.stringify({ name, pw: btoa(pw) }));
  enterDashboard({ name, email, av: fn[0].toUpperCase() });
  toast('Account created — welcome! 🎉', 'success');
}
//google auth handler
function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);

  console.log("Google User:", data);

  const user = {
    name: data.name,
    email: data.email,
    av: data.name[0].toUpperCase()
  };

  // OPTIONAL: store in localStorage (like your signup users)
  localStorage.setItem('qf_u_' + user.email, JSON.stringify({
    name: user.name,
    pw: null, // Google users don’t need password
    google: true
  }));

  toast('Google login successful 🎉', 'success');

  // reuse your existing flow
  enterDashboard(user);
}
function parseJwt(token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}



// function handleGoogleAuth() {
//   const mocks = [
//     { name: 'Alex Johnson',  email: 'alex@gmail.com',   av: 'A' },
//     { name: 'Sam Rivera',    email: 'sam@gmail.com',    av: 'S' },
//     { name: 'Morgan Lee',    email: 'morgan@gmail.com', av: 'M' },
//   ];
//   const u = mocks[Math.floor(Math.random() * mocks.length)];
//   toast('Connecting to Google…', 'success');
//   setTimeout(() => {
//     enterDashboard(u);
//     toast(`Welcome, ${u.name.split(' ')[0]}! 👋`, 'success');
//   }, 900);
// }

function enterDashboard(user) {
  currentUser = user;
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('sb-name').textContent = user.name.split(' ')[0];
  document.getElementById('sb-avatar').textContent = user.av;
  document.getElementById('topbar-avatar').textContent = user.av;
  initDash();
}

function handleLogout() {
  currentUser = null;
  document.getElementById('dashboard-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  toast('Signed out', 'success');
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const isText = inp.type === 'text';
  inp.type = isText ? 'password' : 'text';
  btn.innerHTML = isText
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

function checkStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { w: '0%', c: 'transparent', t: '' },
    { w: '25%', c: '#e8857a', t: 'Weak' },
    { w: '50%', c: '#f0b87a', t: 'Fair' },
    { w: '75%', c: '#87d4b3', t: 'Good' },
    { w: '100%', c: '#5fb892', t: 'Strong' },
  ];
  const l = levels[s];
  const fill = document.getElementById('str-fill');
  const label = document.getElementById('str-label');
  fill.style.width = l.w;
  fill.style.background = l.c;
  label.textContent = l.t;
  label.style.color = l.c;
}

/* 
   DASHBOARD — INIT
 */
function initDash() {
  // Converter
  setCat('length', document.querySelector('#tab-converter .cat-btn'), 'conv');
  // Compare
  setCat('length', document.querySelector('#tab-compare .cat-btn'), 'cmp');
  // Arithmetic
  setCat('length', document.querySelector('#tab-arithmetic .cat-btn'), 'arith');
  renderHistory();
}

/* 
   SIDEBAR NAVIGATION
 */
const PAGE_META = {
  converter: { title: 'Unit Converter', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` },
  compare: { title: 'Compare Quantities', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
  arithmetic: { title: 'Quantity Arithmetic', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>` },
  history: { title: 'History', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
};

function switchTab2(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');
  const m = PAGE_META[tab];
  document.getElementById('page-title-text').textContent = m.title;
  document.querySelector('.page-title-ico').outerHTML =
    `<span class="page-title-ico">${m.icon}</span>`;
  if (window.innerWidth <= 900) closeSidebar();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-overlay').classList.add('active');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-overlay').classList.remove('active');
}

/* 
   THEME TOGGLE
 */
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-ico-moon').classList.toggle('hidden', !isDark);
  document.getElementById('theme-ico-sun').classList.toggle('hidden', isDark);
}

/* 
   CATEGORY SELECTOR
 */
function setCat(cat, btn, mode) {
  const barId = { conv: '#tab-converter .cat-bar', cmp: '#tab-compare .cat-bar', arith: '#tab-arithmetic .cat-bar' }[mode];
  document.querySelectorAll(barId + ' .cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (mode === 'conv') {
    convCat = cat;
    fillSelect('from-unit', cat);
    fillSelect('to-unit', cat);
    if (cat === 'temperature') document.getElementById('to-unit').value = 'F';
    else {
      const keys = Object.keys(UNITS[cat].units);
      document.getElementById('to-unit').value = keys[1] || keys[0];
    }
    doConvert();
  } else if (mode === 'cmp') {
    cmpCat = cat;
    fillSelect('cmp-unit-a', cat);
    fillSelect('cmp-unit-b', cat);
    if (cat === 'temperature') document.getElementById('cmp-unit-b').value = 'F';
    else {
      const keys = Object.keys(UNITS[cat].units);
      document.getElementById('cmp-unit-b').value = keys[1] || keys[0];
    }
    doCompare();
  } else {
    arithCat = cat;
    fillSelect('arith-unit-a', cat);
    fillSelect('arith-unit-b', cat);
    if (cat === 'temperature') document.getElementById('arith-unit-b').value = 'F';
    else {
      const keys = Object.keys(UNITS[cat].units);
      document.getElementById('arith-unit-b').value = keys[1] || keys[0];
    }
    doArith();
  }
}

function fillSelect(id, cat) {
  const sel = document.getElementById(id);
  sel.innerHTML = '';
  Object.entries(UNITS[cat].units).forEach(([k, u]) => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = `${u.name} (${k})`;
    sel.appendChild(o);
  });
}

/* 
   CONVERTER
 */
function doConvert() {
  const from = document.getElementById('from-unit').value;
  const to = document.getElementById('to-unit').value;
  const raw = parseFloat(document.getElementById('from-val').value);
  const grid = document.getElementById('all-units-grid');
  const fbox = document.getElementById('formula-text');

  if (isNaN(raw)) {
    document.getElementById('to-val').value = '';
    fbox.textContent = 'Enter a value above to see the formula';
    grid.innerHTML = '';
    return;
  }

  const result = convertVal(raw, from, to, convCat);
  document.getElementById('to-val').value = fmt(result);

  // Formula string
  if (convCat === 'temperature') {
    const formulae = {
      'C→F': `(${raw} × 9/5) + 32 = ${fmt(result)} °F`,
      'F→C': `(${raw} − 32) × 5/9 = ${fmt(result)} °C`,
      'C→K': `${raw} + 273.15 = ${fmt(result)} K`,
      'K→C': `${raw} − 273.15 = ${fmt(result)} °C`,
      'C→R': `(${raw} + 273.15) × 9/5 = ${fmt(result)} R`,
      'F→K': `(${raw} − 32) × 5/9 + 273.15 = ${fmt(result)} K`,
    };
    fbox.textContent = formulae[`${from}→${to}`] || `${raw} ${from} = ${fmt(result)} ${to}`;
  } else {
    const ff = UNITS[convCat].units[from].factor;
    const tf = UNITS[convCat].units[to].factor;
    fbox.textContent = `${raw} ${from} × ${ff} ÷ ${tf} = ${fmt(result)} ${to}`;
  }

  // All-units chips
  grid.innerHTML = '';
  Object.entries(UNITS[convCat].units).forEach(([k, u]) => {
    const v = convertVal(raw, from, k, convCat);
    grid.insertAdjacentHTML('beforeend',
      `<div class="chip">
         <span class="chip-name">${u.name}</span>
         <span class="chip-val">${fmt(v)} <small style="font-size:.7em;opacity:.7">${k}</small></span>
       </div>`
    );
  });

  pushHistory(`${raw} ${from} → ${fmt(result)} ${to}`, convCat, 'convert');
}

function swapUnits() {
  const fu = document.getElementById('from-unit');
  const tu = document.getElementById('to-unit');
  [fu.value, tu.value] = [tu.value, fu.value];
  doConvert();
}

/* 
   COMPARE
 */
function doCompare() {
  const vA = parseFloat(document.getElementById('cmp-a').value);
  const vB = parseFloat(document.getElementById('cmp-b').value);
  const uA = document.getElementById('cmp-unit-a').value;
  const uB = document.getElementById('cmp-unit-b').value;
  const badge = document.getElementById('cmp-badge');
  const result = document.getElementById('cmp-result');
  const barA = document.getElementById('bar-a');
  const barB = document.getElementById('bar-b');

  if (isNaN(vA) || isNaN(vB)) {
    result.textContent = 'Enter values above to compare';
    result.style.color = '';
    badge.textContent = 'VS';
    badge.style.color = '';
    return;
  }

  let bA, bB;
  if (cmpCat === 'temperature') {
    bA = toCelsius(vA, uA);
    bB = toCelsius(vB, uB);
  } else {
    bA = vA * UNITS[cmpCat].units[uA].factor;
    bB = vB * UNITS[cmpCat].units[uB].factor;
  }

  const max = Math.max(Math.abs(bA), Math.abs(bB)) || 1;
  barA.style.width = (Math.abs(bA) / max * 100) + '%';
  barB.style.width = (Math.abs(bB) / max * 100) + '%';

  if (Math.abs(bA - bB) < 1e-9) {
    badge.textContent = '=';
    badge.style.color = 'var(--green)';
    result.textContent = '✓ A and B are exactly equal';
    result.style.color = 'var(--green-l)';
  } else if (bA > bB) {
    badge.textContent = '>';
    badge.style.color = 'var(--accent)';
    const pct = bB !== 0 ? ((bA - bB) / Math.abs(bB) * 100).toFixed(2) : '∞';
    result.textContent = `A is ${pct}% greater than B`;
    result.style.color = 'var(--accent-l)';
  } else {
    badge.textContent = '<';
    badge.style.color = 'var(--green)';
    const pct = bA !== 0 ? ((bB - bA) / Math.abs(bA) * 100).toFixed(2) : '∞';
    result.textContent = `B is ${pct}% greater than A`;
    result.style.color = 'var(--green-l)';
  }
}

/* 
   ARITHMETIC
 */
function pickOp(btn) {
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentOp = btn.dataset.op;
  doArith();
}

function doArith() {
  const vA = parseFloat(document.getElementById('arith-a').value);
  const vB = parseFloat(document.getElementById('arith-b').value);
  const uA = document.getElementById('arith-unit-a').value;
  const uB = document.getElementById('arith-unit-b').value;
  const rVal = document.getElementById('result-val');
  const rUnit = document.getElementById('result-unit');
  const note = document.getElementById('arith-note');

  if (isNaN(vA) || isNaN(vB)) { rVal.textContent = '—'; rUnit.textContent = ''; note.textContent = ''; return; }

  let bA, bB, resUnit;
  if (arithCat === 'temperature') {
    bA = toCelsius(vA, uA);
    bB = toCelsius(vB, uB);
    resUnit = '°C';
    note.textContent = 'Temperature arithmetic performed in Celsius';
  } else {
    bA = vA * UNITS[arithCat].units[uA].factor;
    bB = vB * UNITS[arithCat].units[uB].factor;
    resUnit = Object.keys(UNITS[arithCat].units)[0];
    note.textContent = '';
  }

  let result;
  switch (currentOp) {
    case '+': result = bA + bB; break;
    case '-': result = bA - bB; break;
    case '*': result = bA * bB; resUnit += '²'; note.textContent = 'Result is in squared base units'; break;
    case '/':
      if (bB === 0) { rVal.textContent = '∞'; rUnit.textContent = ''; return; }
      result = bA / bB; resUnit = '(dimensionless ratio)'; break;
  }
  rVal.textContent = fmt(result);
  rUnit.textContent = resUnit;
}

function saveHistory() {
  const vA = parseFloat(document.getElementById('arith-a').value);
  const vB = parseFloat(document.getElementById('arith-b').value);
  const uA = document.getElementById('arith-unit-a').value;
  const uB = document.getElementById('arith-unit-b').value;
  const rVal = document.getElementById('result-val').textContent;
  if (rVal === '—' || isNaN(vA) || isNaN(vB)) { toast('Nothing to save yet', 'error'); return; }
  const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const expr = `${vA} ${uA} ${symbols[currentOp]} ${vB} ${uB} = ${rVal}`;
  pushHistory(expr, arithCat, 'arithmetic');
  toast('Saved to history ✓', 'success');
  switchTab2('history', document.querySelector('[data-tab="history"]'));
}

/* 
   HISTORY
 */
function pushHistory(expr, cat, type) {
  if (history.length && history[0].expr === expr) return;
  history.unshift({
    expr, cat, type,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString()
  });
  if (history.length > 60) history.pop();
  localStorage.setItem('qf_hist', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('hist-list');
  if (!history.length) {
    list.innerHTML = `<div class="hist-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>No history yet — start converting!</p></div>`;
    return;
  }
  list.innerHTML = history.map(h => `
    <div class="hist-item">
      <div class="hist-left">
        <span class="hist-expr">${h.expr}</span>
        <span class="hist-meta">${h.date} at ${h.time} · ${h.type}</span>
      </div>
      <span class="hist-tag">${UNITS[h.cat]?.label || h.cat}</span>
    </div>
  `).join('');
}

function clearHistory() {
  history = [];
  localStorage.removeItem('qf_hist');
  renderHistory();
  toast('History cleared', 'success');
}

/* 
   TOAST
 */
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}
