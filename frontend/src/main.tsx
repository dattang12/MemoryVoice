import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// ============================================================
// WebSpatial SDK Initialization
//
// initScene is the initialization API from @webspatial/react-sdk.
// It must be called before React renders when running in spatial
// (visionOS / XR_ENV=avp) mode. In standard browser mode the SDK
// is present but initScene is a no-op, so the try/catch ensures
// the app still boots if the SDK is unavailable (e.g. during CI
// or on platforms where the package is not installed yet).
// ============================================================

try {
  // Dynamically import so bundler does not error if pkg is absent
  const sdkModule = await import('@webspatial/react-sdk')
  if (typeof sdkModule.initScene === 'function') {
    // Configure the default scene dimensions for the main window.
    // When XR_ENV is not 'avp' this call is silently ignored.
    sdkModule.initScene('main', (prev) => ({
      ...prev,
      defaultSize: { width: 1280, height: 800 },
    }))
  }
} catch {
  // @webspatial/react-sdk not installed — spatial mode disabled, CSS 3D fallback active
  console.info('[MemoryVoice] WebSpatial SDK not available — running in browser mode')
}

// ============================================================
// React 18 Mount
// ============================================================

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in DOM')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
