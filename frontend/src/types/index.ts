// ============================================================
// MEMORY BRIDGE — Shared TypeScript Types
// ============================================================

export type Era = 'childhood' | 'young-adult' | 'family' | 'recent'

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error'

export type ProcessingStage =
  | 'uploading'
  | 'cloning'
  | 'embedding'
  | 'ready'

export type RecordingStatus =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

export type VoiceAgentStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'error'

// ------------------------------------------------------------
// Photo + Memory
// ------------------------------------------------------------

export interface PhotoMeta {
  id: string
  url: string
  storagePath: string
  caption: string
  date: string
  era: Era
  width?: number
  height?: number
  dominantColor?: string
  embedding?: number[]
  uploadedAt: string
}

export interface Memory {
  id: string
  photoUrl: string
  caption: string
  date: string
  era: Era
  embedding?: number[]
}

export interface MemorySession {
  id: string
  title: string
  personName: string
  photos: PhotoMeta[]
  voiceCloneId?: string
  agentId?: string
  embeddingReady: boolean
  createdAt: string
  updatedAt: string
  status: 'processing' | 'ready' | 'error'
}

// ------------------------------------------------------------
// Upload Flow
// ------------------------------------------------------------

export interface UploadState {
  status: UploadStatus
  progress: number
  stage: ProcessingStage
  memoryId?: string
  error?: string
}

export interface PhotoFile {
  file: File
  previewUrl: string
  caption: string
  id: string
}

export interface UploadPayload {
  photos: File[]
  voiceRecording: File
  captions: string[]
  personName: string
}

// ------------------------------------------------------------
// API Responses
// ------------------------------------------------------------

// Matches backend POST /api/upload response shape (snake_case from Flask)
export interface UploadResponse {
  memory_id: string
  status: 'processing' | 'ready'
}

// Matches backend GET /api/memories/:id response shape
export interface MemoryResponse {
  id: string
  person_name: string
  created_at: string
  status: 'processing' | 'ready' | 'error'
  voice_id: string | null
  agent_id: string | null
  embedding_ready: boolean
  photos: PhotoMeta[]
}

// Matches backend POST /api/embed response shape
export interface EmbeddingResponse {
  status: 'queued' | 'no_photos'
  memory_id: string
  photo_count: number
  detail?: string
}

// ------------------------------------------------------------
// ElevenLabs / Voice Agent
// ------------------------------------------------------------

export interface VoiceAgentState {
  status: VoiceAgentStatus
  agentId?: string
  conversationId?: string
  isSpeaking: boolean
  isListening: boolean
  lastTranscript?: string
  error?: string
}

export interface ElevenLabsWidgetConfig {
  agentId: string
  overrides?: {
    tts?: {
      voiceId?: string
    }
    agent?: {
      prompt?: {
        prompt?: string
      }
      firstMessage?: string
    }
  }
}

// ------------------------------------------------------------
// Firebase / Firestore
// ------------------------------------------------------------

export interface FirebaseState {
  isConnected: boolean
  isInitialized: boolean
  error?: string
}

export interface FirestoreMemoryDoc {
  id: string
  personName: string
  agentId?: string
  voiceCloneId?: string
  embeddingReady: boolean
  status: 'processing' | 'ready' | 'error'
  photoCount: number
  createdAt: string
  updatedAt: string
}

export interface FirestorePhotoDoc {
  id: string
  memoryId: string
  url: string
  storagePath: string
  caption: string
  date: string
  era: Era
  uploadedAt: string
}

// ------------------------------------------------------------
// UI State
// ------------------------------------------------------------

export interface EraConfig {
  label: string
  color: string
  textColor: string
  bgColor: string
  borderColor: string
  icon: string
  years: string
}

export const ERA_CONFIGS: Record<Era, EraConfig> = {
  childhood: {
    label: 'Childhood',
    color: '#60a5fa',
    textColor: 'text-blue-300',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-400/40',
    icon: '🌱',
    years: '0 – 18',
  },
  'young-adult': {
    label: 'Young Adult',
    color: '#a78bfa',
    textColor: 'text-violet-300',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-400/40',
    icon: '✨',
    years: '18 – 35',
  },
  family: {
    label: 'Family Years',
    color: '#f4c430',
    textColor: 'text-yellow-300',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-400/40',
    icon: '🏡',
    years: '35 – 60',
  },
  recent: {
    label: 'Recent',
    color: '#34d399',
    textColor: 'text-emerald-300',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-400/40',
    icon: '📸',
    years: '60+',
  },
}
