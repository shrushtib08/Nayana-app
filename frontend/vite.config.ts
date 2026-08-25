import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Nayana — Understand Anything",
        short_name: "Nayana",
        description:
          "Point your camera at anything and Nayana explains it in simple language, out loud.",
        theme_color: "#1B2A4A",
        background_color: "#FAF7F0",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        // Cache the app shell so the interface still loads with poor connectivity.
        // AI analysis itself still requires a live network call.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"]
      }
    })
  ],
  server: {
    port: 5173
  }
});
