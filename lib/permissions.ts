import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export type GeolocationResult =
  | { success: true; coords: LocationCoords; name: string }
  | { success: false; errorType: 'denied' | 'unavailable' | 'timeout' | 'unknown' };

/**
 * Get GPS coordinates from browser Geolocation API
 */
async function getBrowserPosition(): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { coords: null, errorType: 'unavailable' };
  }

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
        console.warn('Geolocation browser error:', err.code, err.message);
        if (err.code === 1) {
          // PERMISSION_DENIED
          resolve({ coords: null, errorType: 'denied' });
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE (e.g. Windows location disabled or no GPS)
          resolve({ coords: null, errorType: 'unavailable' });
        } else {
          // TIMEOUT
          resolve({ coords: null, errorType: 'timeout' });
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

/**
 * Request GPS / Location permission on Android, iOS, or Web and return current coordinates.
 */
export async function requestLocationPermission(): Promise<{ coords: LocationCoords | null; errorType?: 'denied' | 'unavailable' | 'timeout' }> {
  try {
    // 1. Native Capacitor Geolocation (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');

        let perm = await Geolocation.checkPermissions().catch(() => null);

        // Request permissions if not granted
        if (!perm || (perm.location !== 'granted' && perm.coarseLocation !== 'granted')) {
          perm = await Geolocation.requestPermissions().catch(() => null);
        }

        // Fetch position using high accuracy GPS
        try {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 10000,
          });
          if (pos && pos.coords) {
            return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
          }
        } catch (highErr) {
          console.warn('Native high-accuracy failed, trying standard:', highErr);
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          });
          if (pos && pos.coords) {
            return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
          }
        }
      } catch (nativeErr) {
        console.warn('Native Geolocation plugin error, falling back to web:', nativeErr);
      }
    }

    // 2. Browser Geolocation fallback
    return await getBrowserPosition();
  } catch (err) {
    console.error('Error in requestLocationPermission:', err);
    return { coords: null, errorType: 'unavailable' };
  }
}

/**
 * Prompts for location permission, gets GPS coords,
 * reverse-geocodes to the user's REAL city/neighborhood, and updates global state.
 */
export async function autoDetectAndSetLocation(): Promise<GeolocationResult> {
  const result = await requestLocationPermission();

  if (result.coords) {
    const { lat, lng } = result.coords;
    localStorage.setItem('global_coords', JSON.stringify({ lat, lng }));

    // Reverse geocode coordinates to get actual city name
    let locationName = 'Current Location';
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/places/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        locationName = data.name || data.city || data.formatted || 'Current Location';
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    }

    localStorage.setItem('global_location', locationName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global_location_change', { detail: locationName }));
    }

    return { success: true, coords: result.coords, name: locationName };
  }

  return { success: false, errorType: result.errorType || 'unavailable' };
}

/**
 * Prompts for all general runtime permissions (Notifications, Location)
 */
export async function requestAllAppPermissions() {
  await requestLocationPermission();

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
