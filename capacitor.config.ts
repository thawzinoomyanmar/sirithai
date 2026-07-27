import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thaimmsiri.languageapp',
  appName: 'SiriThai',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
