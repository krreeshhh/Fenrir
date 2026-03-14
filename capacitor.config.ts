import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pivot.app',
  appName: 'Pivot',
  webDir: 'public',
  server: {
    url: 'https://fenrirwolf.vercel.app',
    cleartext: true
  }
};

export default config;
