# Skill: Firebase Patterns for MemoryBridge

## Frontend: Firebase Web SDK v9 (modular)

### Initialize (frontend/src/services/firebase.ts)
```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

### Real-time Listener (useMemories.ts)
```typescript
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../services/firebase'
import type { Memory } from '../types'

export function useMemories(memoryId: string): Memory[] {
  const [memories, setMemories] = useState<Memory[]>([])

  useEffect(() => {
    const q = query(
      collection(db, 'memories', memoryId, 'photos'),
      orderBy('date', 'asc')
    )

    // Real-time subscription — unsubscribe on unmount
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Memory))
      setMemories(photos)
    })

    return () => unsubscribe()  // CRITICAL: cleanup
  }, [memoryId])

  return memories
}
```

### File Upload to Storage (frontend)
```typescript
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../services/firebase'

export async function uploadPhoto(
  memoryId: string,
  photoId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, `memories/${memoryId}/photos/${photoId}`)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(progress)
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}
```

## Backend: Firebase Admin SDK (Python)

### Initialize Once (app/__init__.py or services/firebase_service.py)
```python
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage

def _init_firebase() -> None:
    """Initialize Firebase Admin SDK once."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(
            os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"]
        )
        firebase_admin.initialize_app(
            cred,
            {"storageBucket": os.environ["FIREBASE_STORAGE_BUCKET"]}
        )

_init_firebase()
db = firestore.client()
bucket = storage.bucket()
```

### Firestore Write
```python
from dataclasses import asdict
from backend.app.models.memory import Memory
import uuid

def save_memory_document(memory_id: str, person_name: str) -> None:
    db.collection("memories").document(memory_id).set({
        "person_name": person_name,
        "created_at": firestore.SERVER_TIMESTAMP,
        "status": "processing",
        "voice_id": None,
        "embedding_ready": False,
    })

def save_photo(memory_id: str, photo_id: str, url: str, caption: str, date: str, era: str) -> None:
    db.collection("memories").document(memory_id)\
      .collection("photos").document(photo_id).set({
        "url": url,
        "caption": caption,
        "date": date,
        "era": era,
        "embedding": None,
    })

def update_photo_embedding(memory_id: str, photo_id: str, embedding: list[float]) -> None:
    db.collection("memories").document(memory_id)\
      .collection("photos").document(photo_id)\
      .update({"embedding": embedding})

def mark_memory_ready(memory_id: str, voice_id: str) -> None:
    db.collection("memories").document(memory_id).update({
        "status": "ready",
        "voice_id": voice_id,
        "embedding_ready": True,
    })
```

### Storage Upload (backend)
```python
import uuid
from werkzeug.datastructures import FileStorage

def upload_to_storage(file: FileStorage, memory_id: str, filename: str) -> str:
    """Upload file to Firebase Storage, return public URL."""
    blob = bucket.blob(f"memories/{memory_id}/{filename}")
    blob.upload_from_file(file.stream, content_type=file.content_type)
    blob.make_public()
    return blob.public_url
```

### Firestore Read (for API responses)
```python
def get_memory(memory_id: str) -> dict | None:
    doc = db.collection("memories").document(memory_id).get()
    if not doc.exists:
        return None

    photos = db.collection("memories").document(memory_id)\
               .collection("photos").stream()

    return {
        "id": memory_id,
        **doc.to_dict(),
        "photos": [{"id": p.id, **p.to_dict()} for p in photos],
    }
```

## Era Classification
```python
def classify_era(date_str: str) -> str:
    """Classify photo into memory era based on year."""
    try:
        year = int(date_str[:4])
    except (ValueError, IndexError):
        return "recent"

    if year < 1970:
        return "childhood"
    elif year < 1990:
        return "young-adult"
    elif year < 2010:
        return "family"
    else:
        return "recent"
```

## Key Rules
- Unsubscribe Firestore listeners in useEffect cleanup — memory leak otherwise
- Firebase Storage URLs: use getDownloadURL() not blob.public_url on frontend
- Firestore: use batch writes when saving multiple documents atomically
- Never use Firestore in lock-down mode during hackathon — use test mode
- Backend Admin SDK init: always check `if not firebase_admin._apps` first
