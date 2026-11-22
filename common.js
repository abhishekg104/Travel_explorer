// common.js - shared by every page (needs api-config.js and supabase-js loaded first)
const sb = (window.supabase && SUPABASE.url && SUPABASE.anonKey) ? window.supabase.createClient(SUPABASE.url, SUPABASE.anonKey) : null;
let currentUser = null, favCache = [];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}
function displayName() { return (currentUser.user_metadata && currentUser.user_metadata.name) || currentUser.email.split('@')[0]; }
function loginUrl() { return 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); }

// ---- data helpers ----
async function cachedFetchJson(url, ttl = 864e5) {
  const key = 'cache:' + url;
  try { const hit = JSON.parse(localStorage.getItem(key) || 'null'); if (hit && Date.now() - hit.t < ttl) return hit.d; } catch (e) {}
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  return data;
}
function placeholderImage(name) {
  let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='hsl(${h},25%,36%)'/><text x='50%' y='52%' fill='rgba(255,255,255,.85)' font-family='Georgia,serif' font-size='56' text-anchor='middle'>${escapeHtml(name)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
async function getImage(city) {
  try { const d = await cachedFetchJson('/api/unsplash?q=' + encodeURIComponent(city), 7 * 864e5); return d.url || placeholderImage(city); }
  catch (e) { return placeholderImage(city); }
}
async function getWeather(city) {
  try { return await cachedFetchJson('/api/weather?q=' + encodeURIComponent(city), 18e5); } catch (e) { return null; }
}
async function geocode(city) {
  try {
    const d = await cachedFetchJson('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(city), 30 * 864e5);
    return d[0] ? { lat: +d[0].lat, lon: +d[0].lon } : null;
  } catch (e) { return null; }
}
async function nearbyPlaces(lat, lon) {
  const q = `[out:json][timeout:15];node(around:7000,${lat},${lon})[tourism~"attraction|museum|viewpoint|gallery"][name];out 12;`;
  try {
    const d = await cachedFetchJson('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), 7 * 864e5);
    return d.elements.map(e => ({ name: e.tags.name, type: e.tags.tourism, lat: e.lat, lon: e.lon }));
  } catch (e) { return []; }
}
function addTiles(map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
}
function weatherHTML(c) {
  const icon = c.condition.icon.startsWith('//') ? 'https:' + c.condition.icon : c.condition.icon;
  return `<div class="weather-main"><img src="${icon}" alt="${escapeHtml(c.condition.text)}" class="weather-icon" />
    <div><div class="weather-temp">${Math.round(c.temp_c)}°C</div><div class="weather-condition">${escapeHtml(c.condition.text)}</div></div></div>
    <div class="weather-details">
      <div class="weather-item"><i class="fas fa-tint"></i><div class="label">Humidity</div><div class="value">${c.humidity}%</div></div>
      <div class="weather-item"><i class="fas fa-wind"></i><div class="label">Wind</div><div class="value">${c.wind_kph} km/h</div></div>
      <div class="weather-item"><i class="fas fa-thermometer-half"></i><div class="label">Feels Like</div><div class="value">${Math.round(c.feelslike_c)}°C</div></div>
    </div>`;
}

// ---- favorites (per user, Supabase) ----
async function loadFavs() {
  const { data } = await sb.from('favorites').select('*').order('created_at', { ascending: false });
  favCache = data || [];
}
const isFav = city => favCache.some(f => f.city === city);
async function toggleFav(dest) {
  if (!sb) { toast('Backend not configured yet. See README.'); return null; }
  if (!currentUser) { location.href = loginUrl(); return null; }
  const ex = favCache.find(f => f.city === dest.name);
  if (ex) {
    await sb.from('favorites').delete().eq('id', ex.id);
    favCache = favCache.filter(f => f !== ex);
  } else {
    const { data, error } = await sb.from('favorites').insert({ city: dest.name, image: dest.image, description: dest.description || '' }).select().single();
    if (error) { toast(error.message); return isFav(dest.name); }
    favCache.unshift(data);
  }
  document.dispatchEvent(new Event('favchange'));
  return isFav(dest.name);
}
function createCard(d) {
  const fav = isFav(d.name);
  const el = document.createElement('div'); el.className = 'destination-card';
  el.innerHTML = `<img src="${d.image}" alt="${escapeHtml(d.name)}" /><div class="destination-info"><h3>${escapeHtml(d.name)}</h3><p>${escapeHtml(d.description || '')}</p>
    <div class="destination-footer"><a href="destination.html?city=${encodeURIComponent(d.name)}" class="view-details">View Details <i class="fas fa-arrow-right"></i></a>
    <button class="favorite-btn ${fav ? 'active' : ''}" aria-label="Toggle favorite"><i class="${fav ? 'fas' : 'far'} fa-heart"></i></button></div></div>`;
  el.querySelector('.favorite-btn').onclick = async e => {
    const b = e.currentTarget, now = await toggleFav(d);
    if (now === null) return;
    b.classList.toggle('active', now); b.firstElementChild.className = (now ? 'fas' : 'far') + ' fa-heart';
  };
  return el;
}

// ---- page chrome + auth ----
function renderAuthNav() {
  const menu = document.querySelector('.nav-menu'); if (!menu) return;
  if (!document.getElementById('navStyle')) {
    const st = document.createElement('style'); st.id = 'navStyle';
    st.textContent = `
      .nav-menu { gap: 26px; }
      @media (min-width: 769px) { .nav-menu { flex: 1; margin-left: 40px; } .nav-menu .nav-user-first { margin-left: auto; } }
      @media (max-width: 1150px) and (min-width: 769px) { .nav-menu { gap: 16px; margin-left: 20px; } .nav-menu a { font-size: 14px; } }
      .nav-menu .nav-user a { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--secondary-color); white-space: nowrap; }
      .nav-menu .nav-user a::after { display: none; }
      .nav-menu .nav-user a:hover { background: var(--secondary-color); color: #fff; }
      .nav-menu .nav-user.primary a { background: var(--primary-color); border-color: var(--primary-color); color: #fff; }
      @media (max-width: 768px) { .nav-menu .nav-user { margin-top: 8px; } }`;
    document.head.appendChild(st);
  }
  const add = html => { const li = document.createElement('li'); li.innerHTML = html; menu.appendChild(li); return li; };
  const find = t => [...menu.querySelectorAll('li')].find(li => li.textContent.trim() === t);
  menu.querySelectorAll('a').forEach(a => { if (a.textContent.trim() === 'Contact Us') a.href = 'contact.html'; });
  if (!find('About')) add('<a href="about.html">About</a>');
  if (!find('Travel Tips')) add('<a href="tips.html">Travel Tips</a>');
  const user = [];
  const fav = find('Favorites'); if (fav) { fav.innerHTML = '<a href="favorites.html" class="favorites-link"><i class="fas fa-heart"></i> Favorites</a>'; user.push(fav); }
  if (currentUser) {
    user.push(add('<a href="dashboard.html"><i class="fas fa-user"></i> Dashboard</a>'));
    const out = add('<a href="#"><i class="fas fa-right-from-bracket"></i> Logout</a>');
    out.firstChild.onclick = async e => { e.preventDefault(); await sb.auth.signOut(); location.href = 'index.html'; };
    user.push(out);
  } else { const l = add(`<a href="${loginUrl()}"><i class="fas fa-right-to-bracket"></i> Login</a>`); l.classList.add('primary'); user.push(l); }
  // order: Home, Destinations, Map, Travel Tips, About, Contact Us | Favorites, Login/Dashboard
  ['Home', 'Destinations', 'Map', 'Travel Tips', 'About', 'Contact Us'].forEach(t => { const li = find(t); if (li) menu.appendChild(li); });
  user.forEach(li => { li.classList.add('nav-user'); menu.appendChild(li); });
  if (user[0]) user[0].classList.add('nav-user-first');
}
async function initCommon() {
  const dm = document.getElementById('darkModeToggle'), icon = dm && dm.querySelector('i');
  const setDark = on => { document.body.classList.toggle('dark-mode', on); localStorage.setItem('darkMode', on); if (icon) icon.className = on ? 'fas fa-sun' : 'fas fa-moon'; };
  setDark(localStorage.getItem('darkMode') === 'true');
  if (dm) dm.onclick = () => setDark(!document.body.classList.contains('dark-mode'));
  const hb = document.querySelector('.hamburger'); if (hb) hb.onclick = () => document.querySelector('.nav-menu').classList.toggle('active');
  const up = document.getElementById('scrollToTop');
  if (up) { up.onclick = () => scrollTo({ top: 0, behavior: 'smooth' }); addEventListener('scroll', () => up.classList.toggle('visible', scrollY > 300)); }
  if (sb) {
    const { data } = await sb.auth.getSession();
    currentUser = data.session ? data.session.user : null;
    if (currentUser) await loadFavs();
  }
  renderAuthNav();
}
