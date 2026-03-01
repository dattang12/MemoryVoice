/// <reference types="vite/client" />

// ============================================================
// WebSpatial globals — injected by @webspatial/vite-plugin
// ============================================================

/**
 * Base URL prefix for all WebSpatial scene routes.
 * In browser mode: '' (empty string)
 * In visionOS mode (XR_ENV=avp): '/webspatial/avp'
 */
declare const __XR_ENV_BASE__: string

// ============================================================
// App-level globals
// ============================================================

/** Injected from package.json via vite.config.ts define */
declare const __APP_VERSION__: string

// ============================================================
// Vite environment variables
// ============================================================

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_ELEVENLABS_AGENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ============================================================
// WebSpatial JSX custom attributes
// Allow enable-xr on any JSX element without TS errors.
// ============================================================

declare namespace React {
  interface HTMLAttributes<T> {
    'enable-xr'?: string | boolean | ''
  }
}
