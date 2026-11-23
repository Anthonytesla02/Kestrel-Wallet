import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kestrel.wallet',
  appName: 'Kestrel Wallet',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#09101a',
  },
};

export default config;
