import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MemoryTimeline } from '@/components/timeline/MemoryTimeline'
import { VoiceWidget } from '@/components/chat/VoiceWidget'
import { useMemories } from '@/hooks/useMemories'
import type { PhotoMeta, Memory } from '@/types'

// ============================================================
// NavBar — editorial masthead strip
// ============================================================

interface NavBarProps {
  personName: string
  memoryId: string
  photoCount: number
}

const NavBar: React.FC<NavBarProps> = ({ personName, memoryId, photoCount }) => (
  <nav
    className="sticky top-0 z-40 bg-memory-text border-b-2 border-memory-accent"
    aria-label="Memory archive navigation"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 flex-shrink-0 group" aria-label="The Memory Herald home">
        <div className="w-7 h-7 flex items-center justify-center bg-memory-accent">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </div>
        <span className="text-sm font-bold text-white font-heading hidden sm:inline group-hover:text-memory-accent transition-colors">
          The Memory Herald
        </span>
      </Link>

      {/* Person name */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-bold text-white font-heading truncate">
          {personName ? `${personName}'s Archive` : 'Memory Archive'}
        </h1>
        {photoCount > 0 && (
          <p className="text-xs text-white/60 font-body hidden sm:block">
            {photoCount} {photoCount === 1 ? 'photograph' : 'photographs'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to={`/room/${memoryId}`}
          className="text-xs font-semibold px-3 py-1.5 border border-white/30 text-white hover:bg-white hover:text-memory-text hidden sm:flex items-center gap-1.5 transition-colors font-body"
          aria-label="View photo gallery"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
            <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
          </svg>
          Gallery
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold px-3 py-1.5 bg-memory-accent text-white hover:bg-memory-accent-dim transition-colors font-body"
          aria-label="Upload more memories"
        >
          + Submit Photos
        </Link>
      </div>
    </div>
  </nav>
)

// ============================================================
// Missing ID fallback
// ============================================================

const MissingIdFallback: React.FC = () => (
  <div className="min-h-screen bg-memory-bg flex items-center justify-center">
    <div className="glass-card p-10 text-center space-y-4 max-w-sm border-t-4 border-t-memory-accent">
      <p className="text-3xl font-bold font-heading text-memory-accent">Not Found</p>
      <p className="text-memory-text-muted font-body">No memory ID found in the URL.</p>
      <Link to="/" className="btn-gold inline-block">
        Return to front page
      </Link>
    </div>
  </div>
)

// ============================================================
// Main TimelinePage
// ============================================================

export const TimelinePage: React.FC = () => {
  const { id: memoryId } = useParams<{ id: string }>()
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null)

  const { photos, photoCount, personName, agentId } = useMemories(memoryId ?? null)

  if (!memoryId) {
    return <MissingIdFallback />
  }

  const handlePhotoSelect = (photo: PhotoMeta): void => {
    setActiveMemory({
      id: photo.id,
      photoUrl: photo.url,
      caption: photo.caption,
      date: photo.date,
      era: photo.era,
    })
  }

  return (
    <div className="min-h-screen bg-memory-bg">
      <NavBar personName={personName} memoryId={memoryId} photoCount={photoCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main timeline */}
          <main className="flex-1 min-w-0" aria-label="Memory archive">
            <MemoryTimeline
              memoryId={memoryId}
              personName={personName}
              onPhotoSelect={handlePhotoSelect}
            />
          </main>

          {/* Sidebar: Voice companion */}
          <aside className="lg:w-72 xl:w-80 flex-shrink-0" aria-label="Voice companion">
            <div className="lg:sticky lg:top-[3.5rem] space-y-4 pt-1">
              <VoiceWidget
                agentId={agentId}
                memoryId={memoryId}
                personName={personName}
                photos={photos}
                activeMemory={activeMemory}
                className=""
              />

              {/* Quick links */}
              <div className="glass-card p-4 space-y-1 border-t-4 border-t-memory-purple">
                <p className="text-xs font-bold uppercase tracking-widest text-memory-text-muted font-body mb-3">
                  Archive Actions
                </p>
                <Link
                  to={`/room/${memoryId}`}
                  className="flex items-center gap-3 p-3 hover:bg-memory-bg-secondary
                             transition-colors duration-200 text-sm text-memory-text-muted hover:text-memory-text group font-body"
                >
                  <span className="text-memory-purple group-hover:text-memory-accent transition-colors inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
                      <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                    </svg>
                  </span>
                  Open Photo Gallery
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-3 p-3 hover:bg-memory-bg-secondary
                             transition-colors duration-200 text-sm text-memory-text-muted hover:text-memory-text group font-body"
                >
                  <span className="text-memory-purple group-hover:text-memory-accent transition-colors inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                  </span>
                  Submit More Photographs
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default TimelinePage
