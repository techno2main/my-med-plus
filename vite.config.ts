import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(Date.now()),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Plugin pour générer version.json automatiquement
    {
      name: 'version-generator',
      generateBundle(_options: any, bundle: any) {
        const version = {
          timestamp: Date.now(),
          date: new Date().toISOString(),
          version: `v${Date.now()}`
        };
        bundle['version.json'] = {
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify(version, null, 2)
        };
      }
    },
    VitePWA({
      registerType: 'autoUpdate', // Mise à jour automatique au lieu de 'prompt'
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MyHealthPlus',
        short_name: 'MyHealthPlus',
        description: 'Gérez vos traitements médicaux en toute confidentialité',
        theme_color: '#1a1f38',
        background_color: '#1a1f38',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true, // Nettoie automatiquement les anciens caches
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/phnydcqronyofqroptkf\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
