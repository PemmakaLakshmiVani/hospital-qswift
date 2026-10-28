// Free OpenStreetMap Nominatim Geocoding & Geolocation (No key required)

const geocodeCache = new Map();

/**
 * Convert address string to lat/lng using OpenStreetMap Nominatim
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null;

  const cleanAddr = address.trim();
  if (geocodeCache.has(cleanAddr.toLowerCase())) {
    return geocodeCache.get(cleanAddr.toLowerCase());
  }

  try {
    const encoded = encodeURIComponent(cleanAddr);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      {
        headers: {
          'User-Agent': 'HospitalQswift/1.0 (Health OPD Queue App)'
        }
      }
    );

    if (!response.ok) throw new Error('Geocoding request failed');

    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
      geocodeCache.set(cleanAddr.toLowerCase(), result);
      return result;
    }
  } catch (err) {
    console.warn('Nominatim geocoding error:', err);
  }

  // Default fallback center if offline / fetch fails
  return {
    lat: 12.9716,
    lng: 77.5946,
    displayName: address
  };
}

/**
 * Get user location from Browser Geolocation API
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 12.9716, lng: 77.5946, isDefault: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isDefault: false
        });
      },
      (err) => {
        console.warn('Geolocation access denied or unavailable:', err.message);
        resolve({ lat: 12.9716, lng: 77.5946, isDefault: true });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}
