// Geocoding via LocationIQ — free tier, no credit card required.
// Sign up at https://locationiq.com, copy your Access Token, and add to .env:
//   VITE_LOCATIONIQ_TOKEN=your_token_here
// Map tiles remain OpenStreetMap (free, keyless) — only search uses LocationIQ.

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN as string | undefined;

function assertConfigured() {
  if (!TOKEN) {
    throw new Error(
      'Location search is not configured. Add VITE_LOCATIONIQ_TOKEN to your .env file.'
    );
  }
}

/** Live "as you type" suggestions — used for the search dropdown. */
export async function autocompletePlaces(query: string, limit = 5): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  assertConfigured();

  const url = `https://api.locationiq.com/v1/autocomplete?key=${TOKEN}&q=${encodeURIComponent(
    trimmed
  )}&limit=${limit}&format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) return []; // rate limited — fail quietly, user can keep typing
    return [];
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map((d: any) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name || d.display_place || trimmed,
  }));
}

/** One-shot lookup (kept for anywhere that just needs a single best match). */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const results = await autocompletePlaces(address, 1);
  return results[0] || null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  assertConfigured();
  const url = `https://us1.locationiq.com/v1/reverse?key=${TOKEN}&lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return '';
  const data = await res.json();
  return data?.display_name || '';
}