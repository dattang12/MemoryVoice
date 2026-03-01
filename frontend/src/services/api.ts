import type {
  UploadPayload,
  UploadResponse,
  MemoryResponse,
  EmbeddingResponse,
} from '@/types'

// ============================================================
// API Configuration
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`
    let code = 'UNKNOWN_ERROR'

    try {
      const errorBody = (await response.json()) as { message?: string; code?: string }
      message = errorBody.message ?? message
      code = errorBody.code ?? code
    } catch {
      // response body not JSON — keep defaults
    }

    throw new ApiError(message, response.status, code)
  }

  return response.json() as Promise<T>
}

// ============================================================
// Upload API
// ============================================================

/**
 * Upload photos + voice recording to begin memory processing.
 *
 * POST /api/upload
 * Request: FormData { photos: File[], voiceRecording: File, captions: string[], personName: string }
 * Response: { memoryId: string, status: 'processing' | 'ready' }
 */
export async function uploadMemory(
  payload: UploadPayload,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()

  // Append each photo — field name must match backend: photos[]
  payload.photos.forEach((file) => {
    formData.append('photos[]', file, file.name)
  })

  // Append captions[] parallel array — field name must match backend: captions[]
  payload.captions.forEach((caption) => {
    formData.append('captions[]', caption)
  })

  // Field names match backend snake_case expectations
  formData.append('voice_recording', payload.voiceRecording, 'voice.webm')
  formData.append('person_name', payload.personName)

  // Use XMLHttpRequest for upload progress tracking
  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResponse
          resolve(data)
        } catch {
          reject(new ApiError('Invalid JSON response from upload', xhr.status, 'PARSE_ERROR'))
        }
      } else {
        let message = `Upload failed: ${xhr.statusText}`
        let code = 'UPLOAD_FAILED'
        try {
          const errBody = JSON.parse(xhr.responseText) as { message?: string; code?: string }
          message = errBody.message ?? message
          code = errBody.code ?? code
        } catch {
          // keep defaults
        }
        reject(new ApiError(message, xhr.status, code))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error during upload', 0, 'NETWORK_ERROR'))
    })

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Upload was aborted', 0, 'ABORTED'))
    })

    xhr.open('POST', `${API_BASE}/api/upload`)
    xhr.send(formData)
  })
}

// ============================================================
// Memory API
// ============================================================

/**
 * Fetch memory metadata and photo list.
 *
 * GET /api/memories/:id
 * Response: { id, person_name, created_at, status, voice_id, embedding_ready, photos }
 */
export async function getMemory(memoryId: string): Promise<MemoryResponse> {
  const response = await fetch(`${API_BASE}/api/memories/${memoryId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  return handleResponse<MemoryResponse>(response)
}

/**
 * Poll memory status until ready or error.
 * Returns the final MemoryResponse once status is 'ready' or 'error'.
 */
export async function pollMemoryReady(
  memoryId: string,
  options: {
    intervalMs?: number
    timeoutMs?: number
    onPoll?: (response: MemoryResponse) => void
  } = {}
): Promise<MemoryResponse> {
  const { intervalMs = 2000, timeoutMs = 120_000, onPoll } = options
  const startTime = Date.now()

  return new Promise<MemoryResponse>((resolve, reject) => {
    const poll = async (): Promise<void> => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new ApiError('Memory processing timed out', 408, 'TIMEOUT'))
        return
      }

      try {
        const data = await getMemory(memoryId)
        onPoll?.(data)

        if (data.status === 'ready') {
          resolve(data)
        } else if (data.status === 'error') {
          reject(new ApiError('Memory processing failed on server', 500, 'PROCESSING_ERROR'))
        } else {
          setTimeout(() => void poll(), intervalMs)
        }
      } catch (err) {
        reject(err)
      }
    }

    void poll()
  })
}

// ============================================================
// Embedding API
// ============================================================

/**
 * Trigger vector embedding generation for a memory.
 *
 * POST /api/embed
 * Response: { status: 'queued', memory_id, photo_count }
 */
export async function triggerEmbedding(memoryId: string): Promise<EmbeddingResponse> {
  const response = await fetch(`${API_BASE}/api/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ memory_id: memoryId }),
  })

  return handleResponse<EmbeddingResponse>(response)
}

// ============================================================
// Health Check
// ============================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

export { ApiError }
