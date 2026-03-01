import React, { useState, useRef, useCallback, useEffect } from 'react'
import type { RecordingStatus } from '@/types'

// ============================================================
// Constants
// ============================================================

const MIN_DURATION_S = 60
const MAX_DURATION_S = 120
const WAVEFORM_BARS = 28
const TICK_INTERVAL_MS = 100

// ============================================================
// Helpers
// ============================================================

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

// ============================================================
// Waveform Visualizer — editorial bar chart style
// ============================================================

interface WaveformProps {
  analyser: AnalyserNode | null
  isActive: boolean
}

const Waveform: React.FC<WaveformProps> = ({ analyser, isActive }) => {
  const [bars, setBars] = useState<number[]>(
    Array.from({ length: WAVEFORM_BARS }, () => 0.1)
  )
  const rafRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (!analyser || !isActive) {
      setBars(Array.from({ length: WAVEFORM_BARS }, (_, i) => 0.05 + Math.sin(i * 0.5) * 0.04))
      return
    }
    analyser.fftSize = 64
    const bufferLength = analyser.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength)

    const draw = (): void => {
      if (!analyser || !dataArrayRef.current) return
      analyser.getByteFrequencyData(dataArrayRef.current)
      const newBars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
        const bucketIndex = Math.floor((i / WAVEFORM_BARS) * bufferLength)
        const value = dataArrayRef.current![bucketIndex] ?? 0
        return Math.max(0.05, value / 255)
      })
      setBars(newBars)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [analyser, isActive])

  return (
    <div className="flex items-end justify-center gap-[3px] h-14" aria-hidden="true">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-1.5 transition-all duration-75"
          style={{
            height: `${Math.max(6, height * 56)}px`,
            backgroundColor: isActive ? '#c0392b' : 'rgba(192,57,43,0.25)',
            borderRadius: '1px',
          }}
        />
      ))}
    </div>
  )
}

// ============================================================
// Main VoiceRecorder Component
// ============================================================

interface VoiceRecorderProps {
  onRecordingComplete: (file: File, durationSeconds: number) => void
  disabled?: boolean
}

interface RecorderState {
  status: RecordingStatus
  elapsed: number
  error: string | null
  audioBlob: Blob | null
  previewUrl: string | null
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const [state, setState] = useState<RecorderState>({
    status: 'idle',
    elapsed: 0,
    error: null,
    audioBlob: null,
    previewUrl: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const stopTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cleanupStream = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

  const finalize = useCallback(
    (chunks: Blob[], mimeType: string): void => {
      const blob = new Blob(chunks, { type: mimeType })
      const durationSeconds = elapsedRef.current
      const previewUrl = URL.createObjectURL(blob)

      setState((prev) => ({ ...prev, status: 'stopped', audioBlob: blob, previewUrl }))

      if (durationSeconds < MIN_DURATION_S) {
        setState((prev) => ({
          ...prev,
          error: `Recording too short (${Math.floor(durationSeconds)}s). Minimum is ${MIN_DURATION_S}s.`,
        }))
        return
      }

      const file = new File([blob], `voice-memory-${Date.now()}.webm`, {
        type: mimeType,
        lastModified: Date.now(),
      })
      onRecordingComplete(file, durationSeconds)
    },
    [onRecordingComplete]
  )

  const startRecording = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, error: null }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      })
      streamRef.current = stream

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new AudioCtx()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = getMimeType()
      const recorder = new MediaRecorder(stream, { mimeType: mimeType || undefined })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      elapsedRef.current = 0

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        finalize(chunksRef.current, mimeType || 'audio/webm')
        cleanupStream()
      }
      recorder.start(100)

      timerRef.current = setInterval(() => {
        elapsedRef.current += TICK_INTERVAL_MS / 1000
        setState((prev) => ({ ...prev, elapsed: elapsedRef.current }))
        if (elapsedRef.current >= MAX_DURATION_S) {
          stopTimer()
          recorder.stop()
        }
      }, TICK_INTERVAL_MS)

      setState((prev) => ({ ...prev, status: 'recording', elapsed: 0, audioBlob: null, previewUrl: null, error: null }))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === 'NotAllowedError'
            ? 'Microphone access denied. Please allow microphone in browser settings.'
            : err.message
          : 'Failed to start recording'
      setState((prev) => ({ ...prev, status: 'error', error: message }))
      cleanupStream()
    }
  }, [finalize, cleanupStream, stopTimer])

  const stopRecording = useCallback((): void => {
    stopTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [stopTimer])

  const resetRecording = useCallback((): void => {
    stopTimer()
    stopRecording()
    cleanupStream()
    elapsedRef.current = 0
    setState({ status: 'idle', elapsed: 0, error: null, audioBlob: null, previewUrl: null })
  }, [stopTimer, stopRecording, cleanupStream])

  useEffect(() => {
    return () => {
      stopTimer()
      cleanupStream()
    }
  }, [stopTimer, cleanupStream])

  const isRecording = state.status === 'recording'
  const isStopped = state.status === 'stopped'
  const canStop = isRecording && state.elapsed >= MIN_DURATION_S
  const isReady = isStopped && state.elapsed >= MIN_DURATION_S && !state.error

  // Progress bar
  const progressPct = Math.min((state.elapsed / MAX_DURATION_S) * 100, 100)
  const isMinReached = state.elapsed >= MIN_DURATION_S

  return (
    <div className="space-y-5">
      {/* Main recorder card — editorial style */}
      <div className="glass-card overflow-hidden border-t-4 border-t-memory-accent">
        {/* Header strip */}
        <div className="bg-memory-text px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="w-2.5 h-2.5 rounded-full bg-memory-accent animate-pulse" />
            )}
            <span className="text-white text-xs font-bold uppercase tracking-widest font-body">
              {isRecording ? 'Recording in Progress' : isStopped ? 'Recording Complete' : 'Voice Recorder'}
            </span>
          </div>
          <span className="text-white/60 text-xs font-body tabular-nums">
            {formatTime(state.elapsed)} / {formatTime(MAX_DURATION_S)}
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Waveform display */}
          <div className="border border-[rgba(0,0,0,0.08)] p-4 bg-memory-bg">
            <Waveform analyser={analyserRef.current} isActive={isRecording} />
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 bg-memory-bg-secondary overflow-hidden" style={{ borderRadius: '1px' }}>
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: isMinReached ? '#16a34a' : '#c0392b',
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-body text-memory-text-muted">
              <span className={isMinReached ? 'text-emerald-600 font-semibold' : ''}>
                {isMinReached ? '✓ Minimum reached' : `${MIN_DURATION_S}s minimum`}
              </span>
              <span>{MAX_DURATION_S}s maximum</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {state.status === 'idle' && (
              <button
                type="button"
                onClick={() => void startRecording()}
                disabled={disabled}
                className="btn-gold flex items-center gap-3 px-8 py-4 text-base font-bold disabled:opacity-50"
                aria-label="Start recording"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                Begin Recording
              </button>
            )}

            {isRecording && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={stopRecording}
                  disabled={!canStop}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all duration-200
                    ${canStop
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                      : 'bg-memory-bg-secondary text-memory-text-muted cursor-not-allowed opacity-60'
                    }`}
                  style={{ borderRadius: '2px' }}
                  aria-label="Stop recording"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="1" />
                  </svg>
                  {canStop ? 'Stop Recording' : `${Math.ceil(MIN_DURATION_S - state.elapsed)}s remaining`}
                </button>
                <button
                  type="button"
                  onClick={resetRecording}
                  className="btn-ghost px-4 py-3 text-sm"
                  aria-label="Cancel recording"
                >
                  Cancel
                </button>
              </div>
            )}

            {isStopped && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetRecording}
                  className="btn-ghost flex items-center gap-2 px-5 py-3 text-sm"
                  aria-label="Re-record"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                  </svg>
                  Re-record
                </button>
                {isReady && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm font-body">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                    Accepted — {formatTime(state.elapsed)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audio preview */}
          {state.previewUrl && (
            <div className="border-t border-[rgba(0,0,0,0.08)] pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-memory-text-muted font-body mb-2">
                Playback Preview
              </p>
              <audio
                controls
                src={state.previewUrl}
                className="w-full h-8"
                aria-label="Voice recording preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div className="border-l-4 border-l-memory-accent bg-red-50 p-4">
          <p className="text-sm text-memory-accent font-body font-semibold">{state.error}</p>
        </div>
      )}

      {/* Guidelines — newspaper column style */}
      <div className="glass-card p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-memory-text-muted font-body mb-3 border-b border-[rgba(0,0,0,0.1)] pb-2">
          Recording Guidelines
        </p>
        <ul className="space-y-2">
          {[
            'Choose a quiet room with no background noise',
            'Ask them to speak about their favorite memories or family',
            `Record ${MIN_DURATION_S}–${MAX_DURATION_S} seconds for best voice clone quality`,
            'Natural conversation works better than reading from a script',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-memory-text-muted font-body">
              <span className="text-memory-accent font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default VoiceRecorder
