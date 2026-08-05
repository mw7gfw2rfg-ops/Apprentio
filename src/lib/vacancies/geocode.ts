export type Coordinates = { latitude: number; longitude: number };

// postcodes.io: free, keyless UK postcode geocoding.
export async function geocodePostcode(postcode: string): Promise<Coordinates | null> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`
  );
  if (!res.ok) return null;

  const body = await res.json();
  if (body.status !== 200 || !body.result) return null;

  return { latitude: body.result.latitude, longitude: body.result.longitude };
}
