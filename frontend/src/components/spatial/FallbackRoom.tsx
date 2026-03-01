import type { PhotoMeta, Era } from '@/types'
import { ERA_CONFIGS } from '@/types'
import FloatingPhotoPanel from './FloatingPhotoPanel'

// ============================================================
// FallbackRoom — 4-Column Life-Stage Memory Grid
//
// Layout: Four equal vertical columns, one per era.
// Photos snap to their era column and stack top-to-bottom.
// No overlapping — each card occupies its own row slot.
// Columns are independently scrollable for long photo lists.
// ============================================================

const ERA_ORDER: Era[] = ['childhood', 'young-adult', 'family', 'recent']

interface FallbackRoomProps {
  photos: PhotoMeta[]
  personName: string
  isSpeaking?: boolean
  onPhotoSelect: (photo: PhotoMeta) => void
}

// Column header for each life stage
function EraColumnHeader({ era, count }: { era: Era; count: number }) {
  const config = ERA_CONFIGS[era]

  const yearRanges: Record<Era, string> = {
    childhood:     '0 – 18 years',
    'young-adult': '18 – 35 years',
    family:        '35 – 60 years',
    recent:        '60+ years',
  }

  return (
    <div
      className="flex flex-col items-center gap-1 pb-3 border-b-2 mb-4 select-none"
      style={{ borderColor: config.color + '55' }}
    >
      {/* Era icon */}
      <span className="text-2xl" aria-hidden="true">{config.icon}</span>

      {/* Era name */}
      <span
        className={`text-xs font-bold uppercase tracking-[0.15em] ${config.textColor}`}
      >
        {config.label}
      </span>

      {/* Year range */}
      <span className="text-[10px] text-memory-text-muted tracking-wider">
        {yearRanges[era]}
      </span>

      {/* Photo count badge */}
      <span
        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${config.textColor}`}
        style={{
          background: config.color + '15',
          borderColor: config.color + '40',
        }}
      >
        {count} {count === 1 ? 'memory' : 'memories'}
      </span>
    </div>
  )
}

// Empty column placeholder
function EmptyColumn({ era }: { era: Era }) {
  const config = ERA_CONFIGS[era]
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
      <span className="text-5xl" aria-hidden="true">{config.icon}</span>
      <p className="text-xs text-memory-text-muted text-center leading-relaxed max-w-[120px]">
        No memories yet
      </p>
    </div>
  )
}

export default function FallbackRoom({
  photos,
  personName,
  onPhotoSelect,
}: FallbackRoomProps) {
  // Group all photos by era — each era gets its own column
  const columns = ERA_ORDER.map((era) => ({
    era,
    photos: photos.filter((p) => p.era === era),
  }))

  return (
    <div
      className="relative min-h-screen bg-memory-bg flex flex-col animate-page-enter"
      aria-label={`${personName}'s memory room — ${photos.length} memories`}
    >
      {/* ── 4-column grid ──────────────────────────────────────── */}
      {/*
        Outer wrapper scrolls horizontally on narrow screens so
        cards (200px min) are never clipped or overlapped.
      */}
      <div className="flex-1 overflow-x-auto pb-8 px-4">
        <div
          className="grid gap-4 h-full"
          style={{
            gridTemplateColumns: 'repeat(4, minmax(210px, 1fr))',
            minWidth: 880,
          }}
        >
          {columns.map(({ era, photos: eraPhotos }, colIdx) => (
            <div
              key={era}
              className="flex flex-col min-h-0"
              role="region"
              aria-label={ERA_CONFIGS[era].label}
            >
              {/* Column header — sticky so it stays visible while scrolling */}
              <div className="sticky top-0 z-10 bg-memory-bg pt-2">
                <EraColumnHeader era={era} count={eraPhotos.length} />
              </div>

              {/* Photos stacked vertically, column scrollable */}
              <div className="flex flex-col gap-4 overflow-y-auto">
                {eraPhotos.length === 0 ? (
                  <EmptyColumn era={era} />
                ) : (
                  eraPhotos.map((photo, i) => (
                    <div key={photo.id} className="w-full flex justify-center">
                      <FloatingPhotoPanel
                        photo={photo}
                        index={i + colIdx * 10}
                        position={{ x: 0, y: 0, z: 0 }}
                        onSelect={onPhotoSelect}
                        isSpatialMode={false}
                        entranceDelay={i * 80 + colIdx * 30}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
