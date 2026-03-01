import React, { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import UploadPage from '@/pages/UploadPage'
import TimelinePage from '@/pages/TimelinePage'

// Lazy-load the gallery room (spatial replacement)
const SpatialMemoryRoom = lazy(
  () => import('@/components/spatial/SpatialMemoryRoom')
)

function GalleryLoadingFallback() {
  return (
    <div className="min-h-screen bg-memory-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto skeleton" />
        <div className="w-32 h-4 mx-auto skeleton" />
        <p className="text-memory-text-muted text-sm font-body">
          Loading gallery...
        </p>
      </div>
    </div>
  )
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('animate-page-enter')
    void el.offsetWidth
    el.classList.add('animate-page-enter')
  }, [location.pathname])

  return (
    <div ref={ref} className="animate-page-enter" style={{ willChange: 'opacity, transform' }}>
      {children}
    </div>
  )
}

function App() {
  // Guard for environments where the WebSpatial plugin is not installed
  const base =
    typeof __XR_ENV_BASE__ !== 'undefined' ? __XR_ENV_BASE__ : ''

  return (
    <div className="min-h-screen bg-memory-bg text-memory-text font-body">
      <Routes>
        <Route
          path={`${base}/`}
          element={
            <PageTransition>
              <UploadPage />
            </PageTransition>
          }
        />
        <Route
          path={`${base}/memory/:id`}
          element={
            <PageTransition>
              <TimelinePage />
            </PageTransition>
          }
        />
        <Route
          path={`${base}/room/:memoryId`}
          element={
            <PageTransition>
              <Suspense fallback={<GalleryLoadingFallback />}>
                <SpatialMemoryRoom />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <div className="min-h-screen flex items-center justify-center bg-memory-bg">
                <div className="glass-card p-10 text-center space-y-4 max-w-sm">
                  <p className="text-5xl font-bold font-heading text-memory-accent">404</p>
                  <p className="text-memory-text-muted">This page was not found.</p>
                  <a href="/" className="btn-gold inline-block">
                    Return home
                  </a>
                </div>
              </div>
            </PageTransition>
          }
        />
      </Routes>
    </div>
  )
}

export default App
