import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  lat: number;
  lng: number;
}

/**
 * Request GPS / Location permission on Android, iOS, or Web and return current coordinates.
 */
export async function requestLocationPermission(): Promise<LocationCoords | null> {
  try {
    // 1. If running on native Android or iOS via Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        let perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          perm = await Geolocation.requestPermissions();
        }

        if (perm.location === 'granted') {
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 30000,
          });
          if (pos && pos.coords) {
            return {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
          }
        }
      } catch (nativeErr) {
        console.warn("Native Geolocation error, trying web fallback:", nativeErr);
      }
    }

    // 2. Web / Browser fallback
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        });
        if (pos && pos.coords) {
          return {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
        }
      } catch (browserErr) {
        console.warn("Browser geolocation permission denied or timed out:", browserErr);
      }
    }

    return null;
  } catch (err) {
    console.error("Error in requestLocationPermission:", err);
    return null;
  }
}

/**
 * Automatically prompts for location permission, gets GPS coords,
 * reverse-geocodes to the city/neighborhood name, and updates global storage.
 */
export async function autoDetectAndSetLocation(silent = false): Promise<{ name: string; lat: number; lng: number } | null> {
  const coords = await requestLocationPermission();
  if (!coords) {
    if (!silent && typeof window !== "undefined") {
      alert("Location permission is needed to automatically detect nearby activities and events. Please allow location access in your device settings.");
    }
    return null;
  }

  const { lat, lng } = coords;
  localStorage.setItem("global_coords", JSON.stringify({ lat, lng }));

  // Reverse geocode
  let locationName = "Current Location";
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${API}/places/reverse?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      locationName = data.name || data.city || data.formatted || "Current Location";
    }
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
  }

  localStorage.setItem("global_location", locationName);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("global_location_change", { detail: locationName }));
  }

  return { name: locationName, lat, lng };
}

/**
 * Prompts for all general runtime permissions (Notifications, Location)
 */
export async function requestAllAppPermissions() {
  // 1. Request Location
  await requestLocationPermission();

  // 2. Request Notification Permission if supported
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn("Notification permission request failed", e);
    }
  }
}
