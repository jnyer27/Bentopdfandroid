import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bentopdf.app',
  appName: 'BentoPDF',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  zoomEnabled: true,
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
