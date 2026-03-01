import React, { useState, useMemo } from 'react'
import { MemoryCard } from './MemoryCard'
import { useMemories } from '@/hooks/useMemories'
import type { Era, PhotoMeta } from '@/types'
import { ERA_CONFIGS } from '@/types'

// ============================================================
// Skeleton — editorial placeholder
// ============================================================

const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="bg-white border border-[rgba(0,0,0,0.1)] overflow-hidden"
    style={{ borderRadius: '2px', animationDelay: `${index * 50}ms` }}
  >
    <div className="h-1 w-full skeleton" />
    <div className="aspect-square skeleton" />
    <div className="p-3 space-y-2 border-t border-[rgba(0,0,0,0.07)]">
      <div className="skeleton h-3 w-3/4" style={{ borderRadius: '2px' }} />
      <div className="skeleton h-2.5 w-1/2" style={{ borderRadius: '2px' }} />
    </div>
  </div>
)

const SkeletonGrid: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} index={i} />)}
  </div>
)

// ============================================================
// Empty state — editorial
// ============================================================

const EmptyState: React.FC<{ era?: Era }> = ({ era }) => (
  <div className="text-center py-16 border-2 border-dashed border-[rgba(0,0,0,0.12)]">
    <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-[rgba(0,0,0,0.15)]">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-memory-text-muted/50">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
      </svg>
    </div>
    <p className="text-memory-text-muted text-sm font-body italic">
      {era
        ? `No photographs from ${ERA_CONFIGS[era].label} yet`
        : 'No photographs found in this archive'}
    </p>
  </div>
)

// ============================================================
// Era Section — newspaper section with column rule
// ============================================================

interface EraSectionProps {
  era: Era
  photos: PhotoMeta[]
  onPhotoSelect: (photo: PhotoMeta) => void
}

const EraSection: React.FC<EraSectionProps> = ({ era, photos, onPhotoSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const config = ERA_CONFIGS[era]
  if (photos.length === 0) return null

  return (
    <section aria-label={`${config.label} photographs`}>
      {/* Section header — newspaper section heading */}
      <button
        type="button"
        onClick={() => setIsCollapsed((c) => !c)}
        className="w-full text-left mb-5 focus-visible:ring-0 group"
        aria-expanded={!isCollapsed}
        aria-controls={`era-${era}-grid`}
      >
        <div className="border-t-2 border-memory-text mb-0.5" />
        <div className="border-t border-memory-text-muted mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-memory-text group-hover:text-memory-accent transition-colors">
              {config.label}
            </h2>
            <p className="text-xs text-memory-text-muted font-body mt-0.5">
              {config.years} years &bull; {photos.length} {photos.length === 1 ? 'photograph' : 'photographs'}
            </p>
          </div>
          <div className={`text-memory-text-muted transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Grid */}
      {!isCollapsed && (
        <div id={`era-${era}-grid`} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
          {photos.map((photo, i) => (
            <MemoryCard key={photo.id} photo={photo} index={i} onSelect={onPhotoSelect} />
          ))}
        </div>
      )}
    </section>
  )
}

// ============================================================
// Filter Bar — editorial tabs
// ============================================================

type FilterEra = Era | 'all'

const FilterBar: React.FC<{
  activeFilter: FilterEra
  onFilterChange: (filter: FilterEra) => void
  photoCounts: Record<Era, number>
}> = ({ activeFilter, onFilterChange, photoCounts }) => {
  const eras: Era[] = ['childhood', 'young-adult', 'family', 'recent']

  return (
    <div className="flex items-stretch gap-0 border border-[rgba(0,0,0,0.1)] overflow-x-auto">
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        className={`flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 font-body border-r border-[rgba(0,0,0,0.1)]
          ${activeFilter === 'all'
            ? 'bg-memory-text text-white'
            : 'bg-white text-memory-text-muted hover:bg-memory-bg-secondary hover:text-memory-text'}`}
      >
        All Eras
      </button>
      {eras.map((era) => {
        const count = photoCounts[era]
        if (count === 0) return null
        const config = ERA_CONFIGS[era]
        const isActive = activeFilter === era
        return (
          <button
            key={era}
            type="button"
            onClick={() => onFilterChange(era)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 font-body border-r border-[rgba(0,0,0,0.1)] last:border-r-0
              ${isActive
                ? 'bg-memory-text text-white'
                : 'bg-white text-memory-text-muted hover:bg-memory-bg-secondary hover:text-memory-text'}`}
          >
            <span>{config.label}</span>
            <span className="opacity-60">({count})</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================
// Error state
// ============================================================

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="glass-card p-8 text-center space-y-4 border-l-4 border-l-memory-accent">
    <p className="text-memory-text font-heading font-bold">Unable to load photographs</p>
    <p className="text-sm text-memory-text-muted font-body">{error}</p>
    <button type="button" onClick={onRetry} className="btn-ghost text-sm">
      Try again
    </button>
  </div>
)

// ============================================================
// Main MemoryTimeline
// ============================================================

interface MemoryTimelineProps {
  memoryId: string
  personName?: string
  onPhotoSelect?: (photo: PhotoMeta) => void
}

const ERA_ORDER: Era[] = ['childhood', 'young-adult', 'family', 'recent']

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({
  memoryId,
  personName = 'Your loved one',
  onPhotoSelect,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterEra>('all')

  const { grouped, isLoading, error, photoCount, memoryStatus, embeddingReady, refresh } =
    useMemories(memoryId)

  const photoCounts = useMemo<Record<Era, number>>(
    () => ({
      childhood: grouped.childhood.length,
      'young-adult': grouped['young-adult'].length,
      family: grouped.family.length,
      recent: grouped.recent.length,
    }),
    [grouped]
  )

  const visibleEras = useMemo<Era[]>(() => {
    if (activeFilter !== 'all') return [activeFilter as Era]
    return ERA_ORDER.filter((era) => grouped[era].length > 0)
  }, [activeFilter, grouped])

  if (error) return <ErrorState error={error} onRetry={refresh} />

  return (
    <div className="space-y-8">
      {/* Archive header — editorial masthead */}
      <div>
        <div className="border-t-2 border-memory-text mb-0.5" />
        <div className="border-t border-memory-text-muted mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-memory-accent font-body mb-1">
              Photo Archive
            </p>
            <h1 className="text-3xl font-bold font-heading text-memory-text">
              {personName}'s Photographs
            </h1>
            <p className="text-sm text-memory-text-muted font-body mt-1">
              {isLoading
                ? 'Loading archive...'
                : `${photoCount} ${photoCount === 1 ? 'photograph' : 'photographs'} across ${visibleEras.length} era${visibleEras.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            {memoryStatus === 'processing' && (
              <div className="flex items-center gap-2 text-xs text-memory-text-muted font-body">
                <div className="w-3.5 h-3.5 border-2 border-memory-text-muted/30 border-t-memory-accent animate-spin" style={{ borderRadius: '50%' }} />
                Processing...
              </div>
            )}
            {embeddingReady && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-body font-bold">
                <div className="status-dot-active" />
                Voice-ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {!isLoading && photoCount > 0 && (
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          photoCounts={photoCounts}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <SkeletonGrid />
      ) : photoCount === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-12">
          {visibleEras.map((era) => (
            <EraSection
              key={era}
              era={era}
              photos={grouped[era]}
              onPhotoSelect={(photo) => onPhotoSelect?.(photo)}
            />
          ))}
        </div>
      )}

      {/* Processing notice */}
      {memoryStatus === 'processing' && !isLoading && photoCount === 0 && (
        <div className="glass-card p-6 text-center border-t-4 border-t-memory-accent">
          <div className="w-6 h-6 mx-auto mb-3 border-2 border-memory-accent/30 border-t-memory-accent animate-spin" style={{ borderRadius: '50%' }} />
          <p className="text-memory-text-muted text-sm font-body italic">
            Photographs are being processed — they will appear here shortly.
          </p>
        </div>
      )}
    </div>
  )
}

export default MemoryTimeline
