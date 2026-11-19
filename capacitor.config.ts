import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anoclix.app',
  appName: 'ANOCLIX',
  webDir: 'dist',
  backgroundColor: '#000000',
  ios: {
    contentInset: 'never',
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 250,
      launchAutoHide: false,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: true,
    },
  },
};

export default config;
