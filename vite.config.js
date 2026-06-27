import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png'],
      manifest: {
        name: 'Multi-Tool Platform',
        short_name: 'MultiTools',
        description: 'A powerful suite of 100% private, client-side tools.',
        theme_color: '#1a1a1a',
        background_color: '#111111',
        display: 'standalone',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globIgnores: ['assets/ort-wasm-simd-threaded*.wasm'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB to support the large compiled bundles
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.wasm$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})
