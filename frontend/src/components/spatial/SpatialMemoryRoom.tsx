import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Era, PhotoMeta, Memory } from '@/types'
import { ERA_CONFIGS } from '@/types'
import { useMemories } from '@/hooks/useMemories'
import { sendPhotoContext } from '@/services/elevenlabs'
import { VoiceWidget } from '@/components/chat/VoiceWidget'
import FallbackRoom from './FallbackRoom'
import FloatingPhotoPanel from './FloatingPhotoPanel'
import MemoryOrb from './MemoryOrb'
import EraSection from './EraSection'

// ============================================================
// SpatialMemoryRoom
//
// Browser mode  → FallbackRoom (CSS 3D arc, perspective 1200px)
// visionOS mode → FloatingPhotoPanel with enable-xr + --xr-* CSS
// ============================================================

// Detect visionOS / WebSpatial runtime
function useIsSpatialMode(): boolean {
  const [spatial, setSpatial] = useState(false)
  useEffect(() => {
    setSpatial(document.documentElement.classList.contains('is-spatial'))
  }, [])
  return spatial
}

// Era Z-depth for visionOS panel positioning (meters)
const ERA_DEPTH: Record<Era, number> = {
  childhood:     -3,
  'young-adult': -2,
  family:        -1,
  recent:         0,
}

// Horizontal positions for era labels in visionOS spatial mode.
// translateZ alone does not shift X/Y on screen — eras must be
// spread horizontally so labels don't stack at the same point.
const ERA_SPATIAL_LEFT: Record<Era, string> = {
  childhood:     '12%',
  'young-adult': '33%',
  family:        '60%',
  recent:        '82%',
}

export default function SpatialMemoryRoom() {
  const { memoryId } = useParams<{ memoryId: string }>()
  const isSpatialMode = useIsSpatialMode()
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null)

  const { photos, grouped, isLoading, error, photoCount, personName, memoryStatus, agentId } =
    useMemories(memoryId ?? null)

  const allPhotos = useMemo<PhotoMeta[]>(() => [
    ...(grouped.childhood ?? []),
    ...(grouped['young-adult'] ?? []),
    ...(grouped.family ?? []),
    ...(grouped.recent ?? []),
  ], [grouped])

  const handlePhotoSelect = useCallback(async (photo: PhotoMeta) => {
    const mem: Memory = { id: photo.id, photoUrl: photo.url, caption: photo.caption, date: photo.date, era: photo.era }
    setActiveMemory(mem)
    try { await sendPhotoContext(mem) } catch { /* no active widget */ }
  }, [])

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-memory-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto skeleton" />
          <p className="text-memory-text-muted font-body italic text-sm">Loading gallery…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-memory-bg flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center space-y-4 border-t-4 border-t-memory-accent">
          <p className="text-2xl font-bold font-heading text-memory-accent">Gallery Unavailable</p>
          <p className="text-memory-text-muted text-sm font-body">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-ghost text-sm">Try Again</button>
        </div>
      </div>
    )
  }

  // ── Empty ──────────────────────────────────────────────────
  if (allPhotos.length === 0) {
    return (
      <div className="min-h-screen bg-memory-bg flex items-center justify-center p-4">
        <div className="glass-card p-10 max-w-md text-center space-y-4 border-t-4 border-t-memory-text">
          <h2 className="text-xl font-bold font-heading text-memory-text">No Photographs Yet</h2>
          <p className="text-memory-text-muted text-sm font-body">Upload photos to populate the gallery.</p>
          {memoryStatus === 'processing' && (
            <p className="text-memory-accent text-xs font-body font-bold animate-pulse">Processing memories…</p>
          )}
          {memoryId && (
            <Link to={`/memory/${memoryId}`} className="btn-gold inline-block text-sm">Back to Archive</Link>
          )}
        </div>
      </div>
    )
  }

  const eraOrder: Era[] = ['childhood', 'young-adult', 'family', 'recent']

  return (
    <div className="min-h-screen bg-memory-bg overflow-hidden">

      {/* Fixed voice widget — bottom-center, does not overlap photo columns */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-64">
        <VoiceWidget
          agentId={agentId}
          memoryId={memoryId}
          personName={personName}
          photos={photos}
          activeMemory={activeMemory}
        />
      </div>

      {/* Nav bar */}
      <nav className="sticky top-0 z-40 bg-memory-text border-b-2 border-memory-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {memoryId && (
            <Link to={`/memory/${memoryId}`} className="flex items-center gap-2 text-white hover:text-memory-accent transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span className="text-sm font-bold font-body">Back to Archive</span>
            </Link>
          )}
          <h1 className="text-sm font-bold font-heading text-white">
            {personName ? `${personName}'s Memory Room` : 'Memory Room'}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs font-body">{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
            {isSpatialMode && (
              <span className="text-[10px] px-2 py-0.5 bg-memory-accent/20 text-memory-accent border border-memory-accent/30 font-body uppercase tracking-wider">
                Spatial
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* ── visionOS: Spatial floating panels ────────────────── */}
      {isSpatialMode ? (
        <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(109,40,217,0.15) 0%, transparent 65%)' }}
            aria-hidden="true"
          />

          {/* Central orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <MemoryOrb
              personName={personName}
              isSpeaking={activeMemory !== null}
              isSpatialMode={true}
            />
          </div>

          {/* Era sections + photo panels */}
          {eraOrder.map((era) => {
            const eraPhotos = grouped[era] ?? []
            if (eraPhotos.length === 0) return null
            const depth = ERA_DEPTH[era]
            return (
              <div key={era}>
                {/* Era label — spread horizontally per era */}
                <div
                  className="absolute"
                  style={{
                    top: '6%',
                    left: ERA_SPATIAL_LEFT[era],
                    transform: `translate(-50%, 0) translateZ(${depth * 80}px)`,
                    width: 160,
                  }}
                  aria-hidden="true"
                >
                  <EraSection era={era} photoCount={eraPhotos.length} />
                </div>

                {/* Photos in this era */}
                {eraPhotos.map((photo, i) => {
                  const arcStep = 15
                  const startAngle = -((eraPhotos.length - 1) * arcStep) / 2
                  const rotateY = startAngle + i * arcStep
                  return (
                    <div
                      key={photo.id}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        transform: [
                          `rotateY(${rotateY}deg)`,
                          `translateX(${rotateY !== 0 ? (rotateY > 0 ? 280 : -280) * Math.abs(Math.sin(rotateY * Math.PI / 180)) : 0}px)`,
                          `translateY(-50%)`,
                          `translateZ(${depth * 80}px)`,
                          `translateX(-50%)`,
                        ].join(' '),
                      }}
                    >
                      <FloatingPhotoPanel
                        photo={photo}
                        index={i}
                        position={{ x: 0, y: 0, z: depth }}
                        onSelect={handlePhotoSelect}
                        isSpatialMode={true}
                        entranceDelay={i * 60}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Browser: CSS 3D arc room ─────────────────────── */
        <FallbackRoom
          photos={allPhotos}
          personName={personName}
          isSpeaking={activeMemory !== null}
          onPhotoSelect={handlePhotoSelect}
        />
      )}
    </div>
  )
}
