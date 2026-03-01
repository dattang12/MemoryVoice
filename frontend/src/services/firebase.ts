import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  Unsubscribe,
  DocumentSnapshot,
  QuerySnapshot,
} from 'firebase/firestore'
import type {
  FirestoreMemoryDoc,
  FirestorePhotoDoc,
  MemorySession,
  PhotoMeta,
} from '@/types'

// ============================================================
// Firebase Configuration
// ============================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
}

// Prevent duplicate initialization during HMR
let app: FirebaseApp
let db: Firestore

function initFirebase(): { app: FirebaseApp; db: Firestore } {
  if (getApps().length > 0) {
    app = getApps()[0]
  } else {
    app = initializeApp(firebaseConfig)
  }
  db = getFirestore(app)
  return { app, db }
}

const { db: firestoreDb } = initFirebase()
export { firestoreDb as db }

// ============================================================
// Type Guards
// ============================================================

// Backend writes snake_case fields (person_name, created_at, status, voice_id).
// Only validate fields that are guaranteed to be written.
function isFirestoreMemoryDoc(data: unknown): data is FirestoreMemoryDoc {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d['id'] === 'string' && typeof d['status'] === 'string'
}

function isFirestorePhotoDoc(data: unknown): data is FirestorePhotoDoc {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d['id'] === 'string' &&
    typeof d['url'] === 'string' &&
    typeof d['caption'] === 'string' &&
    typeof d['era'] === 'string'
  )
}

// ============================================================
// Converters
// ============================================================

function toMemorySession(
  docSnap: DocumentSnapshot,
  photos: PhotoMeta[]
): MemorySession | null {
  const data = docSnap.data()
  if (!data || !isFirestoreMemoryDoc({ id: docSnap.id, ...data })) return null

  // Backend writes snake_case — map to camelCase for the app layer.
  // Fields not written by backend get safe defaults.
  const raw = data as Record<string, unknown>
  const personName = (raw['person_name'] as string) ?? ''
  const createdAt = (raw['created_at'] as string) ?? ''
  const voiceCloneId = raw['voice_id'] as string | undefined
  const status = (raw['status'] as 'processing' | 'ready' | 'error') ?? 'processing'

  return {
    id: docSnap.id,
    title: `${personName}'s Memories`,
    personName,
    photos,
    voiceCloneId,
    agentId: undefined,    // backend does not write agentId to Firestore
    embeddingReady: false, // backend does not write embeddingReady to Firestore
    createdAt,
    updatedAt: createdAt,  // backend does not write updatedAt; fall back to createdAt
    status,
  }
}

function toPhotoMeta(docSnap: { id: string; data: () => unknown }): PhotoMeta | null {
  const data = docSnap.data()
  if (!isFirestorePhotoDoc({ id: docSnap.id, ...(data as object) })) return null

  // Use Record to safely access fields backend may or may not write.
  const raw = data as Record<string, unknown>
  return {
    id: docSnap.id,
    url: raw['url'] as string,
    // Firestore stores 'url' (signed URL); use it as storagePath fallback so
    // images load correctly when read via real-time listener (no storagePath field).
    storagePath: (raw['storagePath'] as string) || (raw['url'] as string) || '',
    caption: raw['caption'] as string,
    date: (raw['date'] as string) ?? '',
    era: raw['era'] as PhotoMeta['era'],
    uploadedAt: (raw['uploadedAt'] as string) ?? '',   // backend does not write uploadedAt
  }
}

// ============================================================
// Firestore Helpers
// ============================================================

/**
 * Fetch a single memory session by ID (one-time read).
 */
export async function getMemory(memoryId: string): Promise<MemorySession | null> {
  try {
    const memoryRef = doc(firestoreDb, 'memories', memoryId)
    const memorySnap = await getDoc(memoryRef)

    if (!memorySnap.exists()) return null

    // Photos live in a subcollection: memories/{memoryId}/photos/{photoId}
    const photosRef = collection(firestoreDb, 'memories', memoryId, 'photos')
    const photosSnap = await getDocs(photosRef)
    const photos: PhotoMeta[] = photosSnap.docs
      .map((d) => toPhotoMeta({ id: d.id, data: () => d.data() }))
      .filter((p): p is PhotoMeta => p !== null)

    return toMemorySession(memorySnap, photos)
  } catch (err) {
    console.error('[Firebase] getMemory error:', err)
    return null
  }
}

/**
 * Subscribe to real-time photo updates for a memory session.
 * Returns an unsubscribe function.
 */
export function subscribeToPhotos(
  memoryId: string,
  onUpdate: (photos: PhotoMeta[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  // Photos live in a subcollection: memories/{memoryId}/photos/{photoId}
  // No where() filter needed — the subcollection is already scoped to this memory.
  const photosRef = collection(firestoreDb, 'memories', memoryId, 'photos')

  return onSnapshot(
    photosRef,
    (snap: QuerySnapshot) => {
      const photos: PhotoMeta[] = snap.docs
        .map((d) => toPhotoMeta({ id: d.id, data: () => d.data() }))
        .filter((p): p is PhotoMeta => p !== null)
      onUpdate(photos)
    },
    (err) => {
      console.error('[Firebase] subscribeToPhotos error:', err)
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  )
}

/**
 * Subscribe to memory document status changes.
 */
export function subscribeToMemoryStatus(
  memoryId: string,
  onUpdate: (doc: FirestoreMemoryDoc) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const memoryRef = doc(firestoreDb, 'memories', memoryId)

  return onSnapshot(
    memoryRef,
    (snap: DocumentSnapshot) => {
      if (!snap.exists()) return
      // Map backend snake_case fields to the camelCase FirestoreMemoryDoc shape.
      const raw = snap.data() as Record<string, unknown>
      const mapped: FirestoreMemoryDoc = {
        id: snap.id,
        personName: (raw['person_name'] as string) ?? '',
        voiceCloneId: raw['voice_id'] as string | undefined,
        agentId: raw['agent_id'] as string | undefined,
        embeddingReady: raw['status'] === 'ready',
        status: (raw['status'] as 'processing' | 'ready' | 'error') ?? 'processing',
        photoCount: (raw['photo_count'] as number) ?? 0,
        createdAt: (raw['created_at'] as string) ?? '',
        updatedAt: (raw['updated_at'] as string) ?? (raw['created_at'] as string) ?? '',
      }
      onUpdate(mapped)
    },
    (err) => {
      console.error('[Firebase] subscribeToMemoryStatus error:', err)
      onError(err instanceof Error ? err : new Error(String(err)))
    }
  )
}
