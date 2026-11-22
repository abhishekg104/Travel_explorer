// Vercel serverless function: keeps the WeatherAPI key on the server
module.exports = async (req, res) => {
  const q = String(req.query.q || '').slice(0, 80);
  const key = process.env.WEATHER_API_KEY;
  if (!q || !key) return res.status(400).json({ error: 'missing query or key' });
  try {
    const r = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(q)}&days=3&aqi=no`);
    if (!r.ok) return res.status(r.status).json({ error: 'weather error' });
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).json(await r.json());
  } catch (e) {
    res.status(502).json({ error: 'upstream failed' });
  }
};
