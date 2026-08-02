import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

/**
 * Get GPS coordinates from browser Geolocation API
 */
async function getBrowserPosition(): Promise<LocationCoords | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    // Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos && pos.coords) {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        } else {
          resolve(null);
        }
      },
      (err) => {
        console.warn('High accuracy geolocation failed, trying standard accuracy:', err.message);
        // Fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            if (pos2 && pos2.coords) {
              resolve({ lat: pos2.coords.latitude, lng: pos2.coords.longitude });
            } else {
              resolve(null);
            }
          },
          (err2) => {
            console.warn('Low accuracy geolocation failed:', err2.message);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

/**
 * Request GPS / Location permission on Android, iOS, or Web and return current coordinates.
 */
export async function requestLocationPermission(): Promise<LocationCoords | null> {
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
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
        } catch (highErr) {
          console.warn('Native high-accuracy failed, trying standard:', highErr);
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          });
          if (pos && pos.coords) {
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
        }
      } catch (nativeErr) {
        console.warn('Native Geolocation plugin error, falling back to web:', nativeErr);
      }
    }

    // 2. Browser Geolocation fallback
    const browserCoords = await getBrowserPosition();
    if (browserCoords) {
      return browserCoords;
    }

    return null;
  } catch (err) {
    console.error('Error in requestLocationPermission:', err);
    return null;
  }
}

/**
 * Automatically prompts for location permission, gets GPS coords,
 * reverse-geocodes to the user's REAL city/neighborhood, and updates global state.
 */
export async function autoDetectAndSetLocation(silent = false): Promise<{ name: string; lat: number; lng: number } | null> {
  const coords = await requestLocationPermission();

  if (coords) {
    const { lat, lng } = coords;
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

    return { name: locationName, lat, lng };
  }

  // If GPS failed or was blocked by device settings:
  if (!silent && typeof window !== 'undefined') {
    alert('Could not detect your GPS location. Please make sure Location (GPS) is turned ON in your phone settings and permission is granted.');
  }

  return null;
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
