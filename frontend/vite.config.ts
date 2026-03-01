import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webSpatial from '@webspatial/vite-plugin'
import { createHtmlPlugin } from 'vite-plugin-html'
import { resolve } from 'path'

// XR_ENV is set to 'avp' when running: XR_ENV=avp npm run dev
// It is empty/undefined in standard browser mode.
const XR_ENV = process.env.XR_ENV ?? ''

export default defineConfig({
  plugins: [
    react({
      // Explicitly align Babel (dev) jsxImportSource with the esbuild (prod) config
      // set by @webspatial/vite-plugin — avp mode uses the full spatial runtime,
      // browser mode uses the web-only stub.
      jsxImportSource: XR_ENV === 'avp'
        ? '@webspatial/react-sdk/default'
        : '@webspatial/react-sdk/web',
    }),
    // WebSpatial plugin — injects __XR_ENV_BASE__ global, handles manifest, etc.
    webSpatial(),
    // Allows EJS templating in index.html for conditional is-spatial class.
    createHtmlPlugin({
      inject: {
        data: {
          XR_ENV,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Bind to all interfaces so the visionOS simulator on the Mac mini
    // can reach the dev server over the network (e.g. via the machine's LAN IP).
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/storage'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    // __XR_ENV_BASE__ is injected at runtime by @webspatial/vite-plugin
  },
})
