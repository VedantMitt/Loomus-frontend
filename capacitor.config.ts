import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'Loomus',
  server: {
    url: 'https://loomusapp.vercel.app',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'Loomus',
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
