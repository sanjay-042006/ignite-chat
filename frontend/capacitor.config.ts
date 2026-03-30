import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ignitechat.app',
  appName: 'IgniteChat',
  webDir: 'dist',
  plugins: {
    CapacitorCookies: {
        enabled: true,
    },
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['api.ignite-chat-freex.dns.army']
  }
};

export default config;
