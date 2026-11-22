// dashboard.js
const $ = id => document.getElementById(id);
const row = html => `<li>${html}</li>`;
const cityLink = c => `<a href="destination.html?city=${encodeURIComponent(c)}">${escapeHtml(c)}</a>`;

async function renderAll() {
  const [b, r] = await Promise.all([
    sb.from('bookings').select('*').order('created_at', { ascending: false }),
    sb.from('reviews').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
  ]);
  const bookings = b.data || [], reviews = r.data || [];
  $('statFav').textContent = favCache.length; $('statBook').textContent = bookings.length; $('statRev').textContent = reviews.length;
  $('favList').innerHTML = favCache.map(f => row(`${cityLink(f.city)}<button class="link-btn" data-act="unfav" data-id="${f.id}">Remove</button>`)).join('')
    || row('<span>Nothing saved yet. <a href="index.html#destinations">Browse destinations</a></span>');
  $('bookList').innerHTML = bookings.map(x => row(`${cityLink(x.city)}<span>${x.checkin} to ${x.checkout} · ${x.people} people · ${escapeHtml(x.status)}</span>` +
    (x.status === 'pending' ? `<button class="link-btn" data-act="cancel" data-id="${x.id}">Cancel</button>` : ''))).join('')
    || row('<span>No bookings yet.</span>');
  $('revList').innerHTML = reviews.map(x => row(`${cityLink(x.city)}<span>${'★'.repeat(x.rating)} ${escapeHtml(x.text)}</span><button class="link-btn" data-act="delrev" data-id="${x.id}">Delete</button>`)).join('')
    || row('<span>No reviews yet.</span>');
}

document.addEventListener('DOMContentLoaded', async () => {
  await initCommon();
  if (!sb) { $('dashContent').innerHTML = '<p class="error-message">Backend not configured. See README.</p>'; return; }
  if (!currentUser) { location.href = loginUrl(); return; }
  $('dashName').textContent = displayName(); $('dashEmail').textContent = currentUser.email;
  $('logoutBtn').onclick = async () => { await sb.auth.signOut(); location.href = 'index.html'; };
  $('pwForm').onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.auth.updateUser({ password: $('newPw').value });
    toast(error ? error.message : 'Password updated'); if (!error) e.target.reset();
  };
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const { act, id } = b.dataset;
    if (act === 'unfav') { await sb.from('favorites').delete().eq('id', id); favCache = favCache.filter(f => f.id !== id); }
    if (act === 'cancel') await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (act === 'delrev') await sb.from('reviews').delete().eq('id', id);
    renderAll();
  });
  renderAll();
});
