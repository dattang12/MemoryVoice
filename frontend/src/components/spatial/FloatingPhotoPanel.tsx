import { useState, useRef, useCallback, useEffect } from 'react'
import type { PhotoMeta } from '@/types'
import { ERA_CONFIGS } from '@/types'

// ============================================================
// FloatingPhotoPanel — Individual memory photo card
//
// WebSpatial mode (is-spatial on <html>):
//   - enable-xr attribute lifts the card into 3D space
//   - --xr-background-material: glass material in visionOS
//   - --xr-back: depth extrusion in pts
//   - Gaze (onPointerEnter held 1.5s) → scale 1.4x + caption
//   - Pinch / click → triggers voice agent narration
//
// Browser fallback mode:
//   - CSS hover scales to 1.2x
//   - Click → triggers voice agent narration
//
// Panel click ALWAYS works — gaze is a bonus for spatial mode.
// ============================================================

interface FloatingPhotoPanelProps {
  photo: PhotoMeta
  index: number
  /** Screen/layout position in px (fallback) or meters offset (spatial). */
  position: { x: number; y: number; z: number }
  onSelect: (photo: PhotoMeta) => void
  isSpatialMode: boolean
  /** Delay in ms for entrance stagger animation */
  entranceDelay?: number
}

// Gaze dwell time before expansion (ms)
const GAZE_DWELL_MS = 1500

// Era color palette mapping
const ERA_ACCENT_COLORS: Record<string, string> = {
  childhood:     '#60a5fa', // blue
  'young-adult': '#a78bfa', // purple
  family:        '#f4c430', // gold
  recent:        '#34d399', // emerald
}

export default function FloatingPhotoPanel({
  photo,
  index,
  position,
  onSelect,
  isSpatialMode,
  entranceDelay = 0,
}: FloatingPhotoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const gazeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const config = ERA_CONFIGS[photo.era]
  const accentColor = ERA_ACCENT_COLORS[photo.era] ?? '#8b5cf6'

  // Clean up gaze timer on unmount
  useEffect(() => {
    return () => {
      if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current)
    }
  }, [])

  // Gaze enter — start dwell timer
  const handlePointerEnter = useCallback(() => {
    setIsHovered(true)
    if (isSpatialMode) {
      gazeTimerRef.current = setTimeout(() => {
        setIsExpanded(true)
      }, GAZE_DWELL_MS)
    } else {
      // In browser mode expand immediately on hover
      setIsExpanded(true)
    }
  }, [isSpatialMode])

  // Gaze exit — cancel dwell, collapse if not explicitly clicked
  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
    if (gazeTimerRef.current) {
      clearTimeout(gazeTimerRef.current)
      gazeTimerRef.current = null
    }
    setIsExpanded(false)
  }, [])

  // Click / pinch → select and trigger voice narration
  const handleSelect = useCallback(() => {
    onSelect(photo)
    // Collapse after selection so panel returns to default
    setTimeout(() => setIsExpanded(false), 800)
  }, [photo, onSelect])

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect()
      }
      if (e.key === 'Escape') {
        setIsExpanded(false)
      }
    },
    [handleSelect],
  )

  const scale = isExpanded ? 1.4 : isHovered ? 1.08 : 1.0

  // WebSpatial CSS variables — only effective in visionOS, ignored in browser
  const spatialCssVars: React.CSSProperties = isSpatialMode
    ? ({
        '--xr-background-material': 'translucent',
        '--xr-back': String(Math.max(8, Math.abs(position.z) * 12)),
      } as React.CSSProperties)
    : {}

  return (
    <div
      ref={panelRef}
      // WebSpatial spatialization attribute — lifts card into 3D space in visionOS
      {...(isSpatialMode ? { 'enable-xr': true } : {})}
      role="button"
      tabIndex={0}
      aria-label={`Memory: ${photo.caption} — ${photo.date}. Click to hear narration.`}
      aria-pressed={isExpanded}
      className="relative cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-memory-accent focus-visible:ring-offset-2 focus-visible:ring-offset-memory-bg rounded-2xl"
      style={{
        // Entrance stagger — panels fade in sequentially
        animation: `memoryEntrance 0.5s ease-out ${entranceDelay}ms both`,
        // Scale interaction
        transform: `scale(${scale})`,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
        // Panel float animation with stagger offset
        willChange: 'transform',
        // WebSpatial spatial CSS vars
        ...spatialCssVars,
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      {/* Glass card container */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: isExpanded ? 260 : 200,
          transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: isExpanded
            ? `0 24px 64px rgba(0,0,0,0.6), 0 0 24px ${accentColor}33`
            : isHovered
            ? `0 12px 32px rgba(0,0,0,0.5), 0 0 12px ${accentColor}22`
            : '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Photo image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {!imageLoaded && !imageError && (
            // Skeleton while loading
            <div className="absolute inset-0 skeleton" aria-hidden="true" />
          )}

          {imageError ? (
            // Broken image placeholder
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-memory-bg-card gap-2">
              <span className="text-4xl opacity-40" aria-hidden="true">
                {config.icon}
              </span>
              <p className="text-xs text-memory-text-muted text-center px-3">
                {photo.caption}
              </p>
            </div>
          ) : (
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover"
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}

          {/* Era color top border */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: accentColor }}
            aria-hidden="true"
          />

          {/* Date badge */}
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: 'rgba(0,0,0,0.65)',
              border: `1px solid ${accentColor}55`,
              color: accentColor,
              backdropFilter: 'blur(4px)',
            }}
          >
            {photo.date}
          </div>
        </div>

        {/*
          Caption overlay — always visible as truncated text,
          expands to full on gaze/hover
        */}
        <div
          className="px-3 pt-2 pb-3"
          style={{
            minHeight: isExpanded ? 72 : 48,
            transition: 'min-height 0.3s ease',
          }}
        >
          <p
            className={`text-xs text-memory-text leading-relaxed ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
          >
            {photo.caption}
          </p>

          {/* Era badge — shown when expanded */}
          {isExpanded && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`era-badge ${config.textColor}`}
                style={{
                  borderColor: accentColor + '55',
                  background: accentColor + '18',
                }}
              >
                {config.icon} {config.label}
              </span>
              <span className="text-[10px] text-memory-text-muted">
                Tap to hear memory
              </span>
            </div>
          )}
        </div>

        {/*
          Gaze dwell progress ring — visible during 1.5s hover in spatial mode.
          Appears as a radial ring growing around the panel border.
        */}
        {isHovered && isSpatialMode && !isExpanded && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `conic-gradient(${accentColor}44 0%, transparent 0%)`,
              animation: `gazeProgress ${GAZE_DWELL_MS}ms linear forwards`,
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Floating animation — gentle bob up/down */}
      <style>{`
        @keyframes gazeProgress {
          0%   { background: conic-gradient(${accentColor}55 0deg, transparent 0deg); }
          100% { background: conic-gradient(${accentColor}55 360deg, transparent 360deg); }
        }
      `}</style>
    </div>
  )
}
