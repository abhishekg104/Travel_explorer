// Vercel serverless function: keeps the Unsplash key on the server
module.exports = async (req, res) => {
  const q = String(req.query.q || '').slice(0, 80);
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!q || !key) return res.status(400).json({ error: 'missing query or key' });
  try {
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q + ' city')}&per_page=1&orientation=landscape&client_id=${key}`);
    if (!r.ok) return res.status(r.status).json({ error: 'unsplash error' });
    const d = await r.json();
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate');
    res.status(200).json({ url: d.results[0] ? d.results[0].urls.regular : null });
  } catch (e) {
    res.status(502).json({ error: 'upstream failed' });
  }
};
