import React, { useState } from 'react'
import type { PhotoMeta } from '@/types'
import { ERA_CONFIGS } from '@/types'

// ============================================================
// Era Badge — newspaper section tag
// ============================================================

interface EraBadgeProps {
  era: PhotoMeta['era']
  size?: 'sm' | 'md'
}

const EraBadge: React.FC<EraBadgeProps> = ({ era, size = 'sm' }) => {
  const config = ERA_CONFIGS[era]
  const sizeClass = size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'
  return (
    <span
      className={`era-badge font-body font-bold uppercase tracking-widest ${sizeClass}`}
      style={{ color: '#1c1c1c', borderColor: 'rgba(0,0,0,0.2)', backgroundColor: 'rgba(0,0,0,0.04)' }}
    >
      {config.label}
    </span>
  )
}

// ============================================================
// Photo Modal — editorial lightbox
// ============================================================

interface PhotoModalProps {
  photo: PhotoMeta
  onClose: () => void
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    onClick={onClose}
  >
    <div
      className="relative max-w-3xl w-full bg-white overflow-hidden shadow-2xl"
      style={{ borderRadius: '2px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Newspaper header bar */}
      <div className="bg-memory-text px-5 py-2.5 flex items-center justify-between">
        <span className="text-white text-xs font-bold uppercase tracking-widest font-body">
          Photo Detail
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors w-7 h-7 flex items-center justify-center"
          aria-label="Close photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Image */}
      <div className="max-h-[60vh] overflow-hidden bg-memory-bg-secondary">
        <img
          src={photo.url}
          alt={photo.caption}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Caption section — newspaper photo caption style */}
      <div className="p-5 border-t-2 border-memory-text">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-heading font-bold text-memory-text leading-snug mb-1">
              {photo.caption || 'Untitled Photograph'}
            </p>
            {photo.date && (
              <p className="text-xs text-memory-text-muted font-body italic">{photo.date}</p>
            )}
          </div>
          <EraBadge era={photo.era} size="md" />
        </div>
      </div>
    </div>
  </div>
)

// ============================================================
// Memory Card — newspaper photograph style
// ============================================================

interface MemoryCardProps {
  photo: PhotoMeta
  index: number
  onSelect?: (photo: PhotoMeta) => void
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ photo, index, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = (): void => {
    setIsExpanded(true)
    onSelect?.(photo)
  }

  return (
    <>
      <article
        className="group relative bg-white border border-[rgba(0,0,0,0.1)] overflow-hidden cursor-pointer
                   transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
        style={{
          borderRadius: '2px',
          animationDelay: `${Math.min(index * 60, 500)}ms`,
        }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View photograph: ${photo.caption || 'Photo from ' + photo.date}`}
      >
        {/* Era color top strip */}
        <div
          className="h-1 w-full transition-opacity duration-200 group-hover:opacity-100 opacity-60"
          style={{ backgroundColor: ERA_CONFIGS[photo.era].color }}
        />

        {/* Photo */}
        <div className="relative aspect-square overflow-hidden bg-memory-bg-secondary">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 skeleton" />
          )}
          {imageError && (
            <div className="absolute inset-0 bg-memory-bg-secondary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-memory-text-muted/40">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
            </div>
          )}
          <img
            src={photo.url}
            alt={photo.caption}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white w-9 h-9 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Caption — newspaper photo caption below image */}
        <div className="px-3 py-2.5 border-t border-[rgba(0,0,0,0.07)]">
          <p className="text-xs font-body text-memory-text italic line-clamp-2 leading-snug">
            {photo.caption || <span className="text-memory-text-muted not-italic">No caption</span>}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-memory-text-muted font-body">{photo.date}</span>
            <EraBadge era={photo.era} />
          </div>
        </div>
      </article>

      {/* Modal */}
      {isExpanded && (
        <PhotoModal photo={photo} onClose={() => setIsExpanded(false)} />
      )}
    </>
  )
}

export default MemoryCard
