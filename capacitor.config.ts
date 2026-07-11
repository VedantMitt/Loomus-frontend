import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'CampusConnect',
  // webDir: 'out', // Not needed when pointing to live URL
  server: {
    // Change this to your live URL (e.g. Vercel) for the final production APK
    // url: 'https://loomusapp.vercel.app',
    url: 'http://192.168.29.45:3000', // Real Device over WiFi
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '179896098236-k92cj68fkliirf291ruuu6sk6rp1e7q4.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  }
};

export default config;
