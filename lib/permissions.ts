import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export type GeolocationResult =
  | { success: true; coords: LocationCoords; name: string }
  | { success: false; errorType: 'denied' | 'unavailable' | 'timeout' | 'unknown' };

/**
 * Reverse geocodes exact coordinates (lat, lng) to a clean, human-readable City/Locality name
 * using multiple reliable APIs (BigDataCloud, Photon, Backend, OSM Nominatim).
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. BigDataCloud Client-side Reverse Geocoding (Free, CORS-friendly, ultra-fast, high precision)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const locality = data.locality || '';
        const city = data.city || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';

        // E.g. "Faridabad, Haryana" or "Connaught Place, New Delhi" or "Indiranagar, Bengaluru"
        let parts: string[] = [];
        if (locality) parts.push(locality);
        if (city && city !== locality) parts.push(city);
        else if (state && state !== locality && state !== city) parts.push(state);

        if (parts.length > 0) {
          return parts.join(', ');
        }
        if (city || state || country) {
          return city || state || country;
        }
      }
    }
  } catch {}

  // 2. Photon (Komoot OSM Geocoding - fast, CORS-friendly)
  try {
    const res = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const p = data.features[0].properties;
        const locality = p.name || p.district || p.suburb || '';
        const city = p.city || p.county || p.state || '';
        if (locality && city && locality !== city) {
          return `${locality}, ${city}`;
        }
        if (locality || city) {
          return locality || city;
        }
      }
    }
  } catch {}

  // 3. Backend Reverse Geocode Endpoint (Geoapify & Nominatim proxy)
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${API}/places/reverse?lat=${lat}&lng=${lng}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name && data.name !== 'Current Location') {
        return data.name;
      }
      if (data && data.city && data.city !== 'Current Location') {
        return data.city;
      }
    }
  } catch {}

  // 4. OpenStreetMap Nominatim Direct
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'LoomusApp/1.0 (contact@loomus.app)' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.road || '';
      const city = addr.city || addr.town || addr.village || addr.county || addr.state || '';
      if (locality && city && locality !== city) {
        return `${locality}, ${city}`;
      }
      if (locality || city) {
        return locality || city;
      }
    }
  } catch {}

  return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

/**
 * Get exact GPS coordinates from browser Geolocation API
 */
async function getBrowserPosition(): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { coords: null, errorType: 'unavailable' };
  }

  const queryPos = (options: PositionOptions): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords && pos.coords.latitude && pos.coords.longitude) {
            resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
          } else {
            resolve({ coords: null, errorType: 'unavailable' });
          }
        },
        (err) => {
          if (err.code === 1) {
            resolve({ coords: null, errorType: 'denied' });
          } else if (err.code === 2) {
            resolve({ coords: null, errorType: 'unavailable' });
          } else {
            resolve({ coords: null, errorType: 'timeout' });
          }
        },
        options
      );
    });
  };

  // Attempt 1: High Accuracy GPS Position (12s timeout)
  let result = await queryPos({ enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 });
  if (result.coords) return result;

  // If user explicitly denied permission, do not retry
  if (result.errorType === 'denied') return result;

  // Attempt 2: Standard positioning fallback if high-accuracy timed out or was temporarily unavailable
  result = await queryPos({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  return result;
}

/**
 * Request GPS / Location permission on Android, iOS, or Web and return exact current coordinates.
 */
export async function requestLocationPermission(): Promise<{ coords: LocationCoords | null; name?: string; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
  try {
    // 1. Native Capacitor Geolocation (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');

        let perm = await Geolocation.checkPermissions().catch(() => null);

        // Explicitly request permissions from user if not already granted
        if (!perm || (perm.location !== 'granted' && perm.coarseLocation !== 'granted')) {
          perm = await Geolocation.requestPermissions().catch(() => null);
        }

        if (perm && (perm.location === 'granted' || perm.coarseLocation === 'granted')) {
          // Fetch exact position using high accuracy GPS first
          try {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 10000,
            });
            if (pos && pos.coords && pos.coords.latitude && pos.coords.longitude) {
              return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
            }
          } catch (posErr) {
            console.warn('Native GPS high accuracy failed, falling back to standard network position:', posErr);
          }

          // Standard accuracy / network positioning fallback
          try {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            });
            if (pos && pos.coords && pos.coords.latitude && pos.coords.longitude) {
              return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
            }
          } catch {}
        } else if (perm && perm.location === 'denied') {
          return { coords: null, errorType: 'denied' };
        }
      } catch (nativeErr) {
        console.warn('Native Geolocation plugin error:', nativeErr);
      }
    }

    // 2. Browser Geolocation API
    const browserResult = await getBrowserPosition();
    if (browserResult.coords) {
      return { coords: browserResult.coords };
    }

    return { coords: null, errorType: browserResult.errorType || 'unavailable' };
  } catch (err) {
    console.error('Error in requestLocationPermission:', err);
    return { coords: null, errorType: 'unavailable' };
  }
}

/**
 * Prompts for location permission, gets exact GPS coords,
 * reverse-geocodes to the user's REAL city/neighborhood, and updates global state.
 */
export async function autoDetectAndSetLocation(): Promise<GeolocationResult> {
  const result = await requestLocationPermission();

  if (result.coords) {
    const { lat, lng } = result.coords;
    localStorage.setItem('global_coords', JSON.stringify({ lat, lng }));

    // Reverse geocode exact GPS coords to neighborhood & city
    const locationName = await reverseGeocodeCoords(lat, lng);

    localStorage.setItem('global_location', locationName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global_location_change', { detail: locationName }));
    }

    return { success: true, coords: result.coords, name: locationName };
  }

  return { success: false, errorType: result.errorType || 'unavailable' };
}

/**
 * Prompts for all general runtime permissions (Notifications)
 */
export async function requestAllAppPermissions() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn('Notification permission request failed', e);
    }
  }
}
