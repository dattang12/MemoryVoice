# Skill: React Upload Components for MemoryBridge

## PhotoUpload Component
```tsx
// components/upload/PhotoUpload.tsx
import { useState, useCallback, useRef } from 'react'
import type { Memory } from '../../types'

interface PhotoUploadProps {
  onPhotosSelected: (photos: File[], captions: string[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ onPhotosSelected, maxPhotos = 30 }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; preview: string; caption: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files)
      .filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
      .filter(f => f.size <= 10 * 1024 * 1024)
      .slice(0, maxPhotos)

    const newPreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxPhotos))
  }, [maxPhotos])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleUpload = () => {
    onPhotosSelected(
      previews.map(p => p.file),
      previews.map(p => p.caption)
    )
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-yellow-400 bg-yellow-400/10'
            : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }
        `}
      >
        <p className="text-4xl mb-3">📸</p>
        <p className="text-white/70">Drop photos here or click to browse</p>
        <p className="text-white/40 text-sm mt-1">JPEG, PNG • Max 10MB • Up to {maxPhotos} photos</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Photo Grid with Captions */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previews.map((p, i) => (
            <div key={p.preview} className="space-y-2">
              <img src={p.preview} alt="" className="w-full h-40 object-cover rounded-2xl" />
              <input
                type="text"
                placeholder="Add caption & year..."
                value={p.caption}
                onChange={e => {
                  const next = [...previews]
                  next[i] = { ...next[i], caption: e.target.value }
                  setPreviews(next)
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-400/50"
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.length > 0 && (
        <button
          onClick={handleUpload}
          className="w-full py-4 bg-yellow-400 text-black font-semibold rounded-2xl hover:bg-yellow-300 transition-colors"
        >
          Continue with {previews.length} photo{previews.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}
```

## VoiceRecorder Component
```tsx
// components/upload/VoiceRecorder.tsx
import { useState, useRef, useEffect } from 'react'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  minSeconds?: number
  maxSeconds?: number
}

export function VoiceRecorder({ onRecordingComplete, minSeconds = 60, maxSeconds = 120 }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    chunks.current = []

    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data)
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setState('done')
      onRecordingComplete(blob)
    }

    mediaRecorder.current.start()
    setState('recording')
    setSeconds(0)
    timer.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    if (timer.current) clearInterval(timer.current)
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop())
  }

  useEffect(() => {
    if (seconds >= maxSeconds) stopRecording()
  }, [seconds])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-4 text-center">
      {/* Timer Display */}
      <div className="text-5xl font-mono text-white/80">{formatTime(seconds)}</div>

      {/* Recording Indicator */}
      {state === 'recording' && (
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-sm">Recording... speak naturally</span>
        </div>
      )}

      {/* Minimum duration hint */}
      {state === 'recording' && seconds < minSeconds && (
        <p className="text-white/40 text-sm">
          Keep going — {minSeconds - seconds}s more for best quality
        </p>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="px-8 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-400 transition-colors"
          >
            Start Recording
          </button>
        )}
        {state === 'recording' && (
          <button
            onClick={stopRecording}
            disabled={seconds < minSeconds}
            className="px-8 py-3 bg-white text-black rounded-full font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          >
            {seconds < minSeconds ? `Wait ${minSeconds - seconds}s` : 'Stop Recording'}
          </button>
        )}
        {state === 'done' && audioUrl && (
          <div className="space-y-3">
            <audio src={audioUrl} controls className="w-full" />
            <button
              onClick={() => { setState('idle'); setSeconds(0); setAudioUrl(null) }}
              className="text-white/40 text-sm underline"
            >
              Record again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

## API Service (services/api.ts)
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000'

export interface UploadResponse {
  memoryId: string
  status: 'processing' | 'ready'
}

export async function uploadMemory(
  photos: File[],
  captions: string[],
  voiceRecording: Blob,
  personName: string
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('person_name', personName)
  photos.forEach(p => formData.append('photos[]', p))
  captions.forEach(c => formData.append('captions[]', c))
  formData.append('voice_recording', voiceRecording, 'voice.wav')
  // NOTE: DO NOT set Content-Type header — browser sets multipart boundary

  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail ?? `Upload failed: ${response.status}`)
  }

  const data = await response.json()
  return { memoryId: data.memory_id, status: data.status }
}
```

## Key Rules
- NEVER set Content-Type on FormData fetch — browser handles multipart boundary
- Revoke object URLs on unmount: `URL.revokeObjectURL(preview)`
- VoiceRecorder: stop all MediaStream tracks on unmount
- Validate file size on client AND server
- Photo captions: non-blocking input (user fills while reviewing grid)
