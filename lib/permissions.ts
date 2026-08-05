import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export type GeolocationResult =
  | { success: true; coords: LocationCoords; name: string; isApproximate?: boolean }
  | { success: false; errorType: 'denied' | 'unavailable' | 'timeout' | 'unknown' };

/**
 * Reverse geocodes coordinates (lat, lng) to a clean, human-readable City/Locality name
 * using multiple reliable APIs (BigDataCloud, Photon, Backend, OSM Nominatim).
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. BigDataCloud Client-side Reverse Geocoding (Free, CORS-friendly, ultra-fast, high precision)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const locality = data.locality || '';
        const city = data.city || data.principalSubdivision || '';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';

        // Form nice descriptive city/neighborhood string
        let parts: string[] = [];
        if (locality) parts.push(locality);
        if (city && city !== locality) parts.push(city);
        else if (state && state !== locality) parts.push(state);

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
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3500) }
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
      { headers: { 'User-Agent': 'LoomusApp/1.0 (contact@loomus.app)' }, signal: AbortSignal.timeout(3500) }
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

  return 'Delhi, India';
}

/**
 * Fallback to IP-based Geolocation when GPS / browser permission is blocked or unavailable
 */
export async function getIpLocationFallback(): Promise<{ coords: LocationCoords; name: string } | null> {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // 1. Try our backend's IP location endpoint
  try {
    const res = await fetch(`${API}/places/ip-location`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const name = (data.name && data.name !== 'Current Location') ? data.name : (data.city || 'Delhi, India');
        return {
          coords: { lat: data.lat, lng: data.lng },
          name
        };
      }
    }
  } catch {}

  // 2. Direct client fallback via ipwho.is (fast, free, CORS-friendly)
  try {
    const res = await fetch('https://ipwho.is/', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        const city = data.city || data.region || data.country || '';
        const region = data.region || data.country || '';
        const name = region && city && city !== region ? `${city}, ${region}` : (city || region || 'Delhi, India');
        return {
          coords: { lat: data.latitude, lng: data.longitude },
          name
        };
      }
    }
  } catch {}

  // 3. Fallback via freeipapi.com
  try {
    const res = await fetch('https://freeipapi.com/api/json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const name = data.cityName ? (data.regionName && data.regionName !== data.cityName ? `${data.cityName}, ${data.regionName}` : `${data.cityName}, ${data.countryName}`) : 'Delhi, India';
        return {
          coords: { lat: data.latitude, lng: data.longitude },
          name
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Get exact GPS coordinates from browser Geolocation API with high accuracy prioritised
 */
async function getBrowserPosition(): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { coords: null, errorType: 'unavailable' };
  }

  const queryPos = (options: PositionOptions): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (pos && pos.coords) {
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

  // Attempt 1: Exact High Accuracy GPS Position (Live hardware GPS query)
  let result = await queryPos({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  if (result.coords) return result;

  // If user explicitly denied permission, do not retry
  if (result.errorType === 'denied') return result;

  // Attempt 2: Fallback to standard/network positioning if high-accuracy timed out
  result = await queryPos({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  return result;
}

/**
 * Request GPS / Location permission on Android, iOS, or Web and return exact current coordinates.
 */
export async function requestLocationPermission(): Promise<{ coords: LocationCoords | null; name?: string; isApproximate?: boolean; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
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

        // Fetch exact position using high accuracy GPS first
        try {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
          if (pos && pos.coords) {
            return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, isApproximate: false };
          }
        } catch {
          // Standard accuracy fallback
          try {
            const pos = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 30000,
            });
            if (pos && pos.coords) {
              return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, isApproximate: false };
            }
          } catch {}
        }
      } catch (nativeErr) {
        console.warn('Native Geolocation plugin error:', nativeErr);
      }
    }

    // 2. Browser Geolocation API
    const browserResult = await getBrowserPosition();
    if (browserResult.coords) {
      return { coords: browserResult.coords, isApproximate: false };
    }

    // 3. Fallback to IP Geolocation only if hardware GPS cannot be reached
    const ipFallback = await getIpLocationFallback();
    if (ipFallback && ipFallback.coords) {
      return {
        coords: ipFallback.coords,
        name: ipFallback.name,
        isApproximate: true
      };
    }

    return { coords: null, errorType: browserResult.errorType || 'unavailable' };
  } catch (err) {
    console.error('Error in requestLocationPermission:', err);
    const ipFallback = await getIpLocationFallback().catch(() => null);
    if (ipFallback && ipFallback.coords) {
      return {
        coords: ipFallback.coords,
        name: ipFallback.name,
        isApproximate: true
      };
    }
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
    let locationName = result.name && result.name !== 'Current Location' ? result.name : '';
    
    if (!locationName) {
      locationName = await reverseGeocodeCoords(lat, lng);
    }

    if (!locationName || locationName === 'Current Location') {
      locationName = 'Delhi, India';
    }

    localStorage.setItem('global_location', locationName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global_location_change', { detail: locationName }));
    }

    return { success: true, coords: result.coords, name: locationName, isApproximate: result.isApproximate };
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
