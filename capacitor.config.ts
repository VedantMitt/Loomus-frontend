import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'CampusConnect',
  // webDir: 'out', // Not needed when pointing to live URL
  server: {
    // Change this to your live URL (e.g. Vercel) for the final production APK
    // url: 'https://campusconnect-frontend.vercel.app',
    url: 'http://192.168.29.133:3000', // Real Device over WiFi
    cleartext: true
  }
};

export default config;
