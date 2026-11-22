// Supabase URL + anon key: Project Settings > API. The anon key is meant to be public;
// row-level security (supabase.sql) is what protects the data.
const SUPABASE = { url: '', anonKey: '' };

// Unsplash / WeatherAPI keys are NOT here. Set them as Vercel env vars:
// UNSPLASH_ACCESS_KEY and WEATHER_API_KEY (used by /api/*).

const DESTINATIONS = [
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, description: 'The City of Light, known for the Eiffel Tower, museums and cafés.' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, description: 'A vibrant metropolis blending ancient tradition and neon futures.' },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.006, description: 'The city that never sleeps — culture, parks, skyline.' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, description: 'Opera House, beautiful harbour and beaches.' },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, description: 'Historic capital with royal palaces and museums.' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, description: 'Futuristic skyline, luxury malls, desert adventure.' },
  { name: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686, description: "Gaudí's architecture, sea and rich Catalan culture." },
  { name: 'Bali', country: 'Indonesia', lat: -8.4095, lon: 115.1889, description: 'Tropical paradise with rice terraces and beaches.' }
];
