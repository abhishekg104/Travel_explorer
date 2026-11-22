// main.js - home page
async function searchCity(name) {
  const section = document.getElementById('searchResults'), box = document.getElementById('searchResultsContent');
  section.classList.remove('hidden');
  box.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Searching...</p></div>';
  section.scrollIntoView({ behavior: 'smooth' });
  const [image, w] = await Promise.all([getImage(name), getWeather(name)]);
  box.innerHTML = '<div class="destinations-grid" id="searchCard"></div>' +
    (w && w.current ? `<div class="weather-card">${weatherHTML(w.current)}</div>` : '<p class="error-message">Weather not available for this city.</p>') +
    `<div style="text-align:center;margin-top:30px"><a href="destination.html?city=${encodeURIComponent(name)}" class="submit-btn">View Full Details <i class="fas fa-arrow-right"></i></a></div>`;
  document.getElementById('searchCard').appendChild(createCard({ name, image, description: 'Explore ' + name }));
}

async function loadDestinations() {
  const grid = document.getElementById('destinationsGrid');
  grid.innerHTML = DESTINATIONS.map(d => `<div class="destination-card placeholder"><div class="placeholder-img"></div><div class="placeholder-body"><h3>${d.name}</h3><p>Loading…</p></div></div>`).join('');
  const list = await Promise.all(DESTINATIONS.map(async d => ({ ...d, image: await getImage(d.name) })));
  grid.innerHTML = '';
  list.forEach(d => grid.appendChild(createCard(d)));
}

function initHomeMap() {
  const el = document.getElementById('homeMap'); if (!el || !window.L) return;
  const map = L.map(el, { scrollWheelZoom: false }).setView([25, 20], 2);
  addTiles(map);
  DESTINATIONS.forEach(d => L.marker([d.lat, d.lon]).addTo(map)
    .bindPopup(`<b>${d.name}</b>, ${d.country}<br><a href="destination.html?city=${encodeURIComponent(d.name)}">View details</a>`));
}

document.addEventListener('DOMContentLoaded', async () => {
  await initCommon();
  const input = document.getElementById('citySearch');
  const go = () => { const v = input.value.trim(); if (v) searchCity(v); };
  document.getElementById('searchBtn').onclick = go;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  document.querySelectorAll('.chip').forEach(b => b.onclick = () => searchCity(b.dataset.city));
  initHomeMap();
  loadDestinations();
});
