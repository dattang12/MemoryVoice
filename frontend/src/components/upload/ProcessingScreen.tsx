import React, { useEffect, useState } from 'react'
import type { ProcessingStage } from '@/types'

// ============================================================
// Stage configuration — newspaper "press" metaphor
// ============================================================

interface StageConfig {
  id: ProcessingStage
  headline: string
  byline: string
  estimate: string
}

const STAGE_ORDER: ProcessingStage[] = ['uploading', 'cloning', 'embedding', 'ready']

const STAGES: StageConfig[] = [
  {
    id: 'uploading',
    headline: 'Filing the Archive',
    byline: 'Photographs and voice recording transferred to secure servers',
    estimate: '~10s',
  },
  {
    id: 'cloning',
    headline: 'Capturing the Voice',
    byline: 'Creating an authentic voice clone from the recorded sample',
    estimate: '~30s',
  },
  {
    id: 'embedding',
    headline: 'Indexing Memories',
    byline: 'Building AI memory map so each photograph can be discussed by name',
    estimate: '~20s',
  },
  {
    id: 'ready',
    headline: 'Archive Ready to Publish',
    byline: 'All memories processed — the bridge is open',
    estimate: 'Done!',
  },
]

const MEMORY_QUOTES = [
  '"The heart never forgets the ones it loves."',
  '"Memories are the treasures we keep locked deep within the storehouse of our souls."',
  '"In every moment you can\'t remember, someone loves you who does."',
  '"Love is not what the mind thinks, but what the heart feels."',
]

// ============================================================
// Stage row — editorial table row style
// ============================================================

interface StageRowProps {
  stage: StageConfig
  status: 'pending' | 'active' | 'complete'
  index: number
}

const StageRow: React.FC<StageRowProps> = ({ stage, status, index }) => {
  const isActive = status === 'active'
  const isComplete = status === 'complete'
  const isPending = status === 'pending'

  return (
    <div
      className={`flex items-start gap-4 py-4 border-b border-[rgba(0,0,0,0.08)] transition-all duration-300
        ${isActive ? 'border-l-4 border-l-memory-accent pl-4 bg-[rgba(192,57,43,0.03)]' : 'pl-0 border-l-4 border-l-transparent'}
        ${isPending ? 'opacity-40' : ''}
      `}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {isComplete && (
          <div className="w-6 h-6 bg-emerald-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
        )}
        {isActive && (
          <div
            className="w-5 h-5 border-2 border-memory-text/20 border-t-memory-accent animate-spin"
            style={{ borderRadius: '50%' }}
          />
        )}
        {isPending && (
          <div className="w-5 h-5 border-2 border-[rgba(0,0,0,0.15)]" style={{ borderRadius: '50%' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <p className={`text-sm font-bold font-heading transition-colors duration-300
            ${isActive ? 'text-memory-text' : isComplete ? 'text-memory-text' : 'text-memory-text-muted'}`}>
            {stage.headline}
          </p>
          {isActive && (
            <span className="text-xs text-memory-accent font-body">{stage.estimate}</span>
          )}
          {isComplete && (
            <span className="text-xs text-emerald-600 font-body font-semibold">Complete</span>
          )}
        </div>
        <p className={`text-xs font-body transition-colors duration-300
          ${isActive ? 'text-memory-text-muted' : 'text-memory-text-muted/70'}`}>
          {stage.byline}
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Progress bar — newspaper column fill style
// ============================================================

const ProgressBar: React.FC<{ stage: ProcessingStage; progress: number }> = ({ stage, progress }) => {
  const stageIndex = STAGE_ORDER.indexOf(stage)
  const totalStages = STAGE_ORDER.length - 1
  const totalPct = Math.min(((stageIndex / totalStages) + (progress / 100 / totalStages)) * 100, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-body">
        <span className="text-memory-text-muted uppercase tracking-wider font-bold">Press progress</span>
        <span className="text-memory-accent font-bold tabular-nums">{Math.round(totalPct)}%</span>
      </div>
      <div className="h-3 bg-memory-bg-secondary border border-[rgba(0,0,0,0.1)]">
        <div
          className="h-full bg-memory-accent transition-all duration-500 ease-out"
          style={{ width: `${totalPct}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================
// Main ProcessingScreen
// ============================================================

interface ProcessingScreenProps {
  stage: ProcessingStage
  uploadProgress: number
  personName?: string
  onViewMemory?: () => void
  onRetry?: () => void
  error?: string | null
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  stage,
  uploadProgress,
  personName = 'your loved one',
  onViewMemory,
  onRetry,
  error,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % MEMORY_QUOTES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const currentStageIndex = STAGE_ORDER.indexOf(stage)

  const getStageStatus = (stageId: ProcessingStage): 'pending' | 'active' | 'complete' => {
    const idx = STAGE_ORDER.indexOf(stageId)
    if (idx < currentStageIndex) return 'complete'
    if (idx === currentStageIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-memory-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Newspaper card */}
        <div className="glass-card overflow-hidden">
          {/* Masthead */}
          <div className="bg-memory-text px-6 py-4 text-center">
            <div className="newspaper-rule mb-3 border-white/30" style={{ borderTopColor: 'white', borderBottomColor: 'rgba(255,255,255,0.3)' }} />
            <h1 className="text-2xl font-bold font-heading text-white">
              The Memory Herald
            </h1>
            <div className="flex items-center justify-between mt-2 text-xs text-white/60 font-body">
              <span>{today}</span>
              <span className="text-memory-accent font-bold uppercase tracking-wider">
                PRESS IN PROGRESS
              </span>
              <span>Special Edition</span>
            </div>
            <div className="newspaper-rule mt-3" style={{ borderTopColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(255,255,255,0.15)' }} />
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Headline */}
            <div className="text-center border-b-2 border-memory-text pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-memory-accent font-body mb-1">
                Breaking News
              </p>
              <h2 className="text-2xl font-bold font-heading text-memory-text leading-tight">
                Building Memory Archive for{' '}
                <span className="text-gradient-gold">{personName}</span>
              </h2>
              <p className="text-sm text-memory-text-muted font-body mt-2 italic">
                AI systems are processing photographs and voice recording — please wait
              </p>
            </div>

            {/* Progress bar */}
            {stage !== 'ready' && !error && (
              <ProgressBar stage={stage} progress={uploadProgress} />
            )}

            {/* Stage list */}
            <div>
              {STAGES.map((s, i) => (
                <StageRow
                  key={s.id}
                  stage={s}
                  status={getStageStatus(s.id)}
                  index={i}
                />
              ))}
            </div>

            {/* Ready state */}
            {stage === 'ready' && !error && (
              <div className="space-y-4 border-t-4 border-t-emerald-600 pt-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-600 font-heading uppercase tracking-wider">
                    ✓ Archive Published Successfully
                  </p>
                  <p className="text-xs text-memory-text-muted font-body mt-1">
                    All memories have been processed and are ready to explore
                  </p>
                </div>
                {onViewMemory && (
                  <button
                    type="button"
                    onClick={onViewMemory}
                    className="btn-gold w-full flex items-center justify-center gap-2 py-4 text-base font-bold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                    Open Memory Archive
                  </button>
                )}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="border-l-4 border-l-memory-accent bg-red-50 p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-memory-accent font-body">
                  Press Error
                </p>
                <p className="text-sm text-memory-text font-body">{error}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="btn-gold flex items-center gap-2 text-sm px-5 py-2.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                    </svg>
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rotating quote — editorial footer */}
        <div className="mt-6 text-center px-4">
          <p className="text-sm text-memory-text-muted italic font-heading leading-relaxed">
            {MEMORY_QUOTES[quoteIndex]}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProcessingScreen
