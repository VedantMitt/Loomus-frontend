import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

/**
 * Helper to get position from browser geolocation with timeout & fallback
 */
async function getBrowserPosition(): Promise<LocationCoords | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  // Try fast low-accuracy first
  try {
    const pos: any = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 6000,
        maximumAge: 60000,
      });
    });
    if (pos && pos.coords) {
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
  } catch (e) {
    // Try high accuracy if low accuracy failed
    try {
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        });
      });
      if (pos && pos.coords) {
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (e2) {
      console.warn('Browser geolocation failed:', e2);
    }
  }

  return null;
}

/**
 * Fetch IP-based approximate location as an indestructible fallback
 */
async function getIpLocation(): Promise<{ name: string; lat: number; lng: number } | null> {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // 1. Try backend IP endpoint
  try {
    const res = await fetch(`${API}/places/ip-location`);
    if (res.ok) {
      const data = await res.json();
      if (data.lat && data.lng) {
        return {
          name: data.name || data.city || 'Nearby',
          lat: Number(data.lat),
          lng: Number(data.lng),
        };
      }
    }
  } catch (e) {
    console.warn('Backend IP location failed:', e);
  }

  // 2. Direct client fallback via ip-api
  try {
    const directRes = await fetch('https://ipapi.co/json/');
    if (directRes.ok) {
      const d = await directRes.json();
      if (d.latitude && d.longitude) {
        const cityName = [d.city, d.region, d.country_name].filter(Boolean).slice(0, 2).join(', ');
        return {
          name: cityName || 'Nearby',
          lat: Number(d.latitude),
          lng: Number(d.longitude),
        };
      }
    }
  } catch (directErr) {
    console.warn('Direct IP location failed:', directErr);
  }

  return null;
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
        
        // If not granted, request permission to trigger Android OS permission dialog
        if (!perm || (perm.location !== 'granted' && perm.coarseLocation !== 'granted')) {
          perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] }).catch(() => null);
        }

        // Try getting position with low accuracy first (instant & reliable)
        try {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 60000,
          });
          if (pos && pos.coords) {
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
        } catch (coarseErr) {
          // Retry with high accuracy
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 30000,
          });
          if (pos && pos.coords) {
            return { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
        }
      } catch (nativeErr) {
        console.warn('Native Geolocation failed, trying web fallback:', nativeErr);
      }
    }

    // 2. Web fallback
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
 * reverse-geocodes to the city/neighborhood name, and updates global storage.
 * If GPS is not available, gracefully falls back to IP-based location.
 */
export async function autoDetectAndSetLocation(silent = false): Promise<{ name: string; lat: number; lng: number } | null> {
  // Step 1: Try GPS Coordinates
  const coords = await requestLocationPermission();

  if (coords) {
    const { lat, lng } = coords;
    localStorage.setItem('global_coords', JSON.stringify({ lat, lng }));

    // Reverse geocode coordinates
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

  // Step 2: GPS failed or denied -> Use IP-based City Detection
  const ipLoc = await getIpLocation();
  if (ipLoc) {
    localStorage.setItem('global_coords', JSON.stringify({ lat: ipLoc.lat, lng: ipLoc.lng }));
    localStorage.setItem('global_location', ipLoc.name);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global_location_change', { detail: ipLoc.name }));
    }
    return ipLoc;
  }

  // Step 3: Default fallback
  const fallback = { name: 'Delhi, India', lat: 28.6139, lng: 77.2090 };
  localStorage.setItem('global_coords', JSON.stringify({ lat: fallback.lat, lng: fallback.lng }));
  localStorage.setItem('global_location', fallback.name);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('global_location_change', { detail: fallback.name }));
  }

  return fallback;
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
