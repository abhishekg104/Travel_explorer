# Travel Explorer

Trip-lookup site: city photo, weather + 3-day forecast, map with nearby attractions, accounts, favorites, reviews, bookings and a dashboard.

**Stack:** static HTML/CSS/JS frontend · Vercel serverless functions (`/api`) · Supabase (auth + Postgres) · Leaflet/OpenStreetMap maps.

## Setup

1. **Supabase:** create a project, run `supabase.sql` in the SQL Editor. (Auth > Providers > Email: turn off "Confirm email" while testing.)
2. Put the project URL and anon key in `api-config.js`. The anon key is public by design; row-level security protects the data.
3. **Vercel:** import the repo, add env vars `UNSPLASH_ACCESS_KEY` and `WEATHER_API_KEY`, deploy.
4. Supabase > Auth > URL Configuration: add your Vercel URL as Site URL.

Local: `npm i -g vercel`, then `vercel dev` (plain Live Server has no `/api`, so images fall back to placeholders and weather is empty).

## Pages

`index` · `destination?city=` · `favorites` · `login` · `dashboard`

## Notes

- Never put the Unsplash or WeatherAPI keys in the frontend; they live only in Vercel env vars.
- Maps: OpenStreetMap tiles, Nominatim (geocoding) and Overpass (nearby attractions). All free, no key, light-use only.
- Bookings are requests saved to your account. No payment or email is sent.

Author: Abhishek Gupta · https://github.com/abhishekg104
