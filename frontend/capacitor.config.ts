import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nayana.app",
  appName: "Nayana",
  webDir: "dist",
  server: {
    // During development, point the Android WebView at your running Vite
    // dev server so you get live reload on a real device (adjust IP to
    // your machine's LAN address, not localhost). Remove this whole
    // "server" block for production builds, so the app loads the bundled
    // files from webDir instead.
    // url: "http://192.168.1.100:5173",
    // cleartext: true
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
