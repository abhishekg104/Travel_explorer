// destination.js
const city = new URLSearchParams(location.search).get('city') || 'Paris';
const cityData = { image: '' };
let rating = 5;
const $ = id => document.getElementById(id);

function updateFav() {
  const b = $('favoriteBtn'), f = isFav(city);
  b.classList.toggle('active', f); b.firstElementChild.className = (f ? 'fas' : 'far') + ' fa-heart';
}
function renderWeather(w) {
  const card = $('weatherCard');
  if (!w || !w.current) { card.innerHTML = '<p class="error-message">Weather data not available</p>'; return; }
  card.innerHTML = weatherHTML(w.current);
  const f = document.createElement('div'); f.className = 'forecast';
  f.innerHTML = w.forecast.forecastday.map(d => `<div class="forecast-day"><strong>${d.date}</strong><div class="muted">${escapeHtml(d.day.condition.text)} — ${d.day.maxtemp_c}° / ${d.day.mintemp_c}°</div></div>`).join('');
  card.parentElement.appendChild(f);
}

async function setupMap(w) {
  const el = $('map');
  const pos = w && w.location ? { lat: w.location.lat, lon: w.location.lon } : await geocode(city);
  if (!pos || !window.L) { el.outerHTML = '<p class="error-message">Map not available for this city.</p>'; $('placesGrid').innerHTML = ''; return; }
  const map = L.map(el).setView([pos.lat, pos.lon], 12);
  addTiles(map);
  L.marker([pos.lat, pos.lon]).addTo(map).bindPopup(escapeHtml(city)).openPopup();
  const places = await nearbyPlaces(pos.lat, pos.lon), grid = $('placesGrid');
  if (!places.length) { grid.innerHTML = '<p class="muted">No attractions found nearby.</p>'; return; }
  grid.innerHTML = '';
  places.forEach(p => {
    const m = L.marker([p.lat, p.lon]).addTo(map).bindPopup(escapeHtml(p.name));
    const b = document.createElement('button'); b.className = 'place-link';
    b.innerHTML = `${escapeHtml(p.name)}<span>${escapeHtml(p.type)}</span>`;
    b.onclick = () => { map.setView([p.lat, p.lon], 15); m.openPopup(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    grid.appendChild(b);
  });
}

async function loadReviews() {
  const list = $('reviewsList');
  if (!sb) { list.innerHTML = '<p class="muted">Reviews need the backend (see README).</p>'; return; }
  const { data } = await sb.from('reviews').select('*').eq('city', city).order('created_at', { ascending: false });
  if (!data || !data.length) { list.innerHTML = '<p class="muted" style="text-align:center">No reviews yet.</p>'; return; }
  list.innerHTML = data.map(r => `<div class="user-review"><h4>${escapeHtml(r.name)}</h4>
    <div class="stars">${'<i class="fas fa-star"></i>'.repeat(r.rating)}${'<i class="far fa-star"></i>'.repeat(5 - r.rating)}</div>
    <p>${escapeHtml(r.text)}</p><small class="muted">${new Date(r.created_at).toLocaleDateString()}</small>
    ${currentUser && r.user_id === currentUser.id ? `<button class="link-btn" data-id="${r.id}">Delete</button>` : ''}</div>`).join('');
  list.querySelectorAll('[data-id]').forEach(b => b.onclick = async () => { await sb.from('reviews').delete().eq('id', b.dataset.id); loadReviews(); });
}
function setupReviews() {
  const form = $('reviewForm');
  if (!currentUser) { form.outerHTML = `<p>Please <a href="${loginUrl()}">log in</a> to write a review.</p>`; return; }
  const fill = () => { $('reviewName').value = displayName(); };
  const stars = [...document.querySelectorAll('#starRating i')];
  const paint = n => stars.forEach((s, i) => s.className = (i < n ? 'fas' : 'far') + ' fa-star');
  stars.forEach((s, i) => s.onclick = () => { rating = i + 1; paint(rating); });
  paint(5); fill();
  form.onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.from('reviews').insert({ city, name: $('reviewName').value.trim(), rating, text: $('reviewText').value.trim() });
    if (error) return toast(error.message);
    form.reset(); rating = 5; paint(5); fill(); loadReviews(); toast('Review posted');
  };
}

function setupBooking() {
  const form = $('bookingForm');
  if (!currentUser) { form.outerHTML = `<p>Please <a href="${loginUrl()}">log in</a> to book a trip.</p>`; return; }
  const fill = () => { $('bookingName').value = displayName(); $('bookingEmail').value = currentUser.email; $('bookingCity').value = city; };
  const ci = $('bookingCheckin'), co = $('bookingCheckout'), today = new Date().toISOString().split('T')[0];
  ci.min = co.min = today; ci.onchange = () => { co.min = ci.value; };
  fill();
  form.onsubmit = async e => {
    e.preventDefault();
    if (co.value <= ci.value) return toast('Check-out has to be after check-in.');
    const { error } = await sb.from('bookings').insert({ city, name: $('bookingName').value, email: $('bookingEmail').value, people: +$('bookingPeople').value, checkin: ci.value, checkout: co.value, notes: $('bookingNotes').value });
    if (error) return toast(error.message);
    form.reset(); fill(); toast('Booking saved. You can see it in your dashboard.');
  };
}

async function init() {
  await initCommon();
  $('destinationTitle').textContent = city; document.title = city + ' - Travel Explorer';
  $('mapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(city);
  $('favoriteBtn').onclick = async () => {
    const r = await toggleFav({ name: city, image: cityData.image, description: 'Explore ' + city });
    if (r !== null) updateFav();
  };
  setupReviews(); setupBooking(); updateFav(); loadReviews();
  const [image, w] = await Promise.all([getImage(city), getWeather(city)]);
  cityData.image = image;
  $('destinationHero').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("${image}")`;
  renderWeather(w);
  $('pageLoader').style.display = 'none';
  setupMap(w);
}
document.addEventListener('DOMContentLoaded', init);
