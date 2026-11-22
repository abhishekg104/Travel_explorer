// favorites.js
function render() {
  const grid = document.getElementById('favoritesGrid'), empty = document.getElementById('emptyState');
  const count = document.getElementById('favoritesCount'), clear = document.getElementById('clearAllBtn');
  if (!currentUser) {
    empty.innerHTML = `<i class="fas fa-user-lock"></i><h2>Log in to see your favorites</h2><p>Favorites are saved to your account.</p><a href="${loginUrl()}" class="explore-btn">Log in</a>`;
    empty.classList.remove('hidden'); grid.classList.add('hidden'); clear.style.display = 'none'; count.textContent = 0; return;
  }
  count.textContent = favCache.length;
  const has = favCache.length > 0;
  empty.classList.toggle('hidden', has); grid.classList.toggle('hidden', !has); clear.style.display = has ? 'flex' : 'none';
  grid.innerHTML = '';
  favCache.forEach(f => grid.appendChild(createCard({ name: f.city, image: f.image || placeholderImage(f.city), description: f.description })));
}
document.addEventListener('DOMContentLoaded', async () => {
  await initCommon();
  document.getElementById('clearAllBtn').onclick = async () => {
    if (!confirm('Clear all favorites?')) return;
    await sb.from('favorites').delete().eq('user_id', currentUser.id);
    favCache = []; render();
  };
  document.addEventListener('favchange', render);
  render();
});
