import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhotoUpload } from '@/components/upload/PhotoUpload'
import { VoiceRecorder } from '@/components/upload/VoiceRecorder'
import { ProcessingScreen } from '@/components/upload/ProcessingScreen'
import { uploadMemory } from '@/services/api'
import type { PhotoFile, UploadState, ProcessingStage } from '@/types'

// ============================================================
// Step indicator — editorial style
// ============================================================

type Step = 1 | 2 | 3

const STEPS = [
  { number: 1 as Step, label: 'Photographs', description: 'Upload up to 30 photos' },
  { number: 2 as Step, label: 'Voice Sample', description: '60–120 seconds of voice' },
  { number: 3 as Step, label: 'Processing', description: 'AI builds the bridge' },
]

const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => (
  <div className="flex items-stretch gap-0 mb-10 border border-[rgba(0,0,0,0.12)]" role="list" aria-label="Upload steps">
    {STEPS.map((step, i) => {
      const isComplete = step.number < currentStep
      const isActive = step.number === currentStep
      return (
        <div
          key={step.number}
          role="listitem"
          className={`
            flex-1 flex flex-col items-center justify-center py-3 px-2 text-center
            border-r border-[rgba(0,0,0,0.12)] last:border-r-0 transition-colors duration-300
            ${isActive ? 'bg-memory-accent text-white' : isComplete ? 'bg-memory-bg-secondary text-memory-text' : 'bg-white text-memory-text-muted'}
          `}
          aria-current={isActive ? 'step' : undefined}
        >
          <div className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${isActive ? 'text-white/70' : 'text-memory-text-muted'}`}>
            {isComplete ? '✓ Done' : `Step ${step.number}`}
          </div>
          <div className={`text-sm font-semibold font-heading ${isActive ? 'text-white' : ''}`}>
            {step.label}
          </div>
          <div className={`text-xs hidden sm:block mt-0.5 ${isActive ? 'text-white/80' : 'text-memory-text-muted'}`}>
            {step.description}
          </div>
        </div>
      )
    })}
  </div>
)

// ============================================================
// Masthead header — newspaper style
// ============================================================

const Masthead: React.FC = () => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <header className="text-center mb-10">
      {/* Top rule */}
      <div className="newspaper-rule mb-3" />

      {/* Tagline */}
      <p className="text-xs uppercase tracking-[0.25em] text-memory-text-muted font-body mb-2">
        Established 2026 &bull; Preserving Stories That Matter
      </p>

      {/* Title */}
      <h1 className="text-5xl sm:text-6xl font-bold font-heading text-memory-text leading-none mb-2">
        The Memory Herald
      </h1>

      {/* Bottom rule */}
      <div className="newspaper-rule mt-3 mb-3" />

      {/* Date + edition */}
      <div className="flex items-center justify-between text-xs font-body text-memory-text-muted">
        <span>{today}</span>
        <span className="font-semibold text-memory-accent uppercase tracking-wider">
          AI Memory Edition
        </span>
        <span>Vol. 1, No. 1</span>
      </div>
    </header>
  )
}

// ============================================================
// Main UploadPage
// ============================================================

export const UploadPage: React.FC = () => {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [voiceDuration, setVoiceDuration] = useState<number>(0)
  const [personName, setPersonName] = useState('')
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    stage: 'uploading',
  })

  const handleVoiceComplete = useCallback(
    (file: File, duration: number): void => {
      setVoiceFile(file)
      setVoiceDuration(duration)
    },
    []
  )

  const handleUpload = useCallback(async (): Promise<void> => {
    if (photos.length === 0 || !voiceFile) return

    setCurrentStep(3)
    setUploadState({ status: 'uploading', progress: 0, stage: 'uploading' })

    try {
      const uploadResponse = await uploadMemory(
        {
          photos: photos.map((p) => p.file),
          voiceRecording: voiceFile,
          captions: photos.map((p) => p.caption),
          personName: personName.trim() || 'My loved one',
        },
        (progress: number) => {
          setUploadState((prev) => ({ ...prev, progress }))
        }
      )

      const memoryId = uploadResponse.memory_id
      // Show "ready" state — photos are in Firestore, background jobs continue.
      setUploadState({ status: 'ready', progress: 100, stage: 'ready', memoryId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadState((prev) => ({ ...prev, status: 'error', error: message }))
    }
  }, [photos, voiceFile, personName])

  const canProceedToStep2 = photos.length > 0
  const canUpload = photos.length > 0 && voiceFile !== null
  const isUploading = uploadState.status === 'uploading' || uploadState.status === 'processing'

  const handleRetry = useCallback((): void => {
    setCurrentStep(2)
    setUploadState({ status: 'idle', progress: 0, stage: 'uploading' })
  }, [])

  if (currentStep === 3) {
    return (
      <ProcessingScreen
        stage={uploadState.stage}
        uploadProgress={uploadState.progress}
        personName={personName.trim() || 'your loved one'}
        error={uploadState.status === 'error' ? uploadState.error : null}
        onRetry={uploadState.status === 'error' ? handleRetry : undefined}
        onViewMemory={
          uploadState.status === 'ready' && uploadState.memoryId
            ? () => navigate(`/memory/${uploadState.memoryId}`)
            : undefined
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-memory-bg">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Masthead />
        <StepIndicator currentStep={currentStep} />

        {/* Subject name — editorial form */}
        <div className="glass-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3 border-l-4 border-l-memory-accent">
          <label
            htmlFor="person-name"
            className="text-sm font-bold uppercase tracking-widest text-memory-text-muted font-body whitespace-nowrap"
          >
            Subject Name
          </label>
          <input
            id="person-name"
            type="text"
            value={personName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPersonName(e.target.value)}
            placeholder="e.g. Dorothy, Grandpa Joe..."
            maxLength={60}
            className="flex-1 bg-transparent border-b-2 border-[rgba(0,0,0,0.15)] focus:border-memory-accent
                       text-memory-text placeholder-memory-text-muted/50 pb-1 outline-none
                       transition-colors duration-200 text-sm font-body"
          />
        </div>

        {/* Step content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Section header */}
            <div>
              <div className="border-t-2 border-memory-text mb-1" />
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold font-heading text-memory-text">
                  Photographic Archive
                </h2>
                <span className="text-xs uppercase tracking-widest text-memory-text-muted font-body">
                  Section A
                </span>
              </div>
              <p className="text-sm text-memory-text-muted font-body mt-1">
                Submit photographs from across their lifetime. The AI will organize them by era
                and use them as reference during voice conversations.
              </p>
              <div className="border-b border-[rgba(0,0,0,0.1)] mt-3" />
            </div>

            <div className="glass-card p-6 sm:p-8">
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="btn-gold flex items-center gap-2 disabled:opacity-50"
              >
                Continue to Voice Recording
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Section header */}
            <div>
              <div className="border-t-2 border-memory-text mb-1" />
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold font-heading text-memory-text">
                  Voice Recording
                </h2>
                <span className="text-xs uppercase tracking-widest text-memory-text-muted font-body">
                  Section B
                </span>
              </div>
              <p className="text-sm text-memory-text-muted font-body mt-1">
                Record 60–120 seconds of the subject speaking naturally. This sample will be
                used to clone their voice for authentic memory conversations.
              </p>
              <div className="border-b border-[rgba(0,0,0,0.1)] mt-3" />
            </div>

            <VoiceRecorder onRecordingComplete={handleVoiceComplete} disabled={false} />

            {voiceFile && (
              <div className="glass-card p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
                <div className="status-dot-active" />
                <span className="text-sm font-semibold text-emerald-700 font-body">
                  Voice sample captured — {Math.floor(voiceDuration)} seconds recorded
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-ghost flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Back
              </button>

              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={!canUpload || isUploading}
                className="btn-gold flex items-center gap-2 disabled:opacity-50 min-w-[200px] justify-center"
                aria-busy={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin flex-shrink-0" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Publish to Memory Archive
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 border-t border-[rgba(0,0,0,0.1)] pt-6 text-center">
          <div className="newspaper-rule mb-4 max-w-xs mx-auto" />
          <p className="text-xs text-memory-text-muted font-body">
            The Memory Herald &mdash; Built with care for Hack for Humanity 2026
          </p>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
