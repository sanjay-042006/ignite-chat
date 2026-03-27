import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ignitechat.app',
  appName: 'IgniteChat',
  webDir: 'dist',
  plugins: {
    CapacitorCookies: {
        enabled: true,
    },
    CapacitorHttp: {
        enabled: true,
    },
  },
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
