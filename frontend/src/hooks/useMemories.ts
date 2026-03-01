import { useState, useEffect, useCallback, useRef } from 'react'
import { subscribeToPhotos, subscribeToMemoryStatus } from '@/services/firebase'
import type { PhotoMeta, FirestoreMemoryDoc, Era } from '@/types'

// ============================================================
// useMemories — Real-time Firestore photo subscription hook
// ============================================================

type GroupedPhotos = Record<Era, PhotoMeta[]>

interface MemoriesState {
  photos: PhotoMeta[]
  grouped: GroupedPhotos
  isLoading: boolean
  error: string | null
  memoryStatus: FirestoreMemoryDoc['status'] | null
  embeddingReady: boolean
  photoCount: number
  personName: string
  agentId: string | undefined
}

interface UseMemoriesReturn extends MemoriesState {
  refresh: () => void
}

const EMPTY_GROUPED: GroupedPhotos = {
  childhood: [],
  'young-adult': [],
  family: [],
  recent: [],
}

function groupPhotosByEra(photos: PhotoMeta[]): GroupedPhotos {
  const grouped: GroupedPhotos = {
    childhood: [],
    'young-adult': [],
    family: [],
    recent: [],
  }

  photos.forEach((photo) => {
    const era = photo.era
    if (era in grouped) {
      grouped[era].push(photo)
    }
  })

  // Sort each era by date ascending
  Object.keys(grouped).forEach((era) => {
    grouped[era as Era].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })

  return grouped
}

/**
 * Subscribe to real-time Firestore updates for a memory session's photos.
 *
 * @param memoryId - The Firestore memory document ID
 * @returns Live photo data, grouped by era, with loading/error state
 */
export function useMemories(memoryId: string | null): UseMemoriesReturn {
  const [state, setState] = useState<MemoriesState>({
    photos: [],
    grouped: EMPTY_GROUPED,
    isLoading: !!memoryId,
    error: null,
    memoryStatus: null,
    embeddingReady: false,
    photoCount: 0,
    personName: '',
    agentId: undefined,
  })

  // Use a refresh key to allow manual re-subscription
  const [refreshKey, setRefreshKey] = useState(0)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const statusUnsubRef = useRef<(() => void) | null>(null)

  const cleanup = useCallback((): void => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (statusUnsubRef.current) {
      statusUnsubRef.current()
      statusUnsubRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!memoryId) {
      setState({
        photos: [],
        grouped: EMPTY_GROUPED,
        isLoading: false,
        error: null,
        memoryStatus: null,
        embeddingReady: false,
        photoCount: 0,
        personName: '',
        agentId: undefined,
      })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    // Subscribe to photo updates
    const photoUnsub = subscribeToPhotos(
      memoryId,
      (photos: PhotoMeta[]) => {
        const grouped = groupPhotosByEra(photos)
        setState((prev) => ({
          ...prev,
          photos,
          grouped,
          isLoading: false,
          error: null,
          photoCount: photos.length,
        }))
      },
      (error: Error) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }))
      }
    )

    // Subscribe to memory status updates
    const statusUnsub = subscribeToMemoryStatus(
      memoryId,
      (memDoc: FirestoreMemoryDoc) => {
        setState((prev) => ({
          ...prev,
          memoryStatus: memDoc.status,
          embeddingReady: memDoc.embeddingReady,
          personName: memDoc.personName,
          agentId: memDoc.agentId,
        }))
      },
      (error: Error) => {
        console.error('[useMemories] Status subscription error:', error)
      }
    )

    unsubscribeRef.current = photoUnsub
    statusUnsubRef.current = statusUnsub

    return cleanup
  }, [memoryId, refreshKey, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const refresh = useCallback((): void => {
    setRefreshKey((k) => k + 1)
  }, [])

  return { ...state, refresh }
}
