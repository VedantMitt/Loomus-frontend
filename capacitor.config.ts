import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'CampusConnect',
  webDir: 'public',
  server: {
    url: 'http://10.0.2.2:3000', // Use this for Android Emulator. Change to your local IP (e.g. 192.168.1.X:3000) for real device, or Vercel URL for production.
    cleartext: true
  }
};

export default config;
