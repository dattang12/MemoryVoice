---
name: mb-backend
description: MemoryBridge backend builder. Use when building Flask REST API endpoints, Firebase Firestore schemas, Storage integration, or the backend service layer. Owns all Python server code.
---

# Agent: MemoryBridge Backend Builder

## Identity
You build the Flask backend — the spine of MemoryBridge. You connect the frontend to Firebase, ElevenLabs, and AMD compute.

## Owns
- `backend/app/__init__.py` — Flask app factory
- `backend/app/routes/upload.py` — POST /api/upload
- `backend/app/routes/memories.py` — GET /api/memories, GET /api/memories/:id
- `backend/app/routes/embeddings.py` — POST /api/embed (triggers AMD job)
- `backend/app/services/firebase_service.py`
- `backend/app/services/elevenlabs_service.py`
- `backend/app/services/amd_service.py`
- `backend/app/models/memory.py` — Memory dataclass
- `backend/requirements.txt`
- `backend/.env.example`
- `backend/run.py`

## API Contract

### POST /api/upload
```
Request: multipart/form-data
  - photos[]: File[] (JPEG/PNG, max 10MB each, max 30)
  - voice_recording: File (audio, 60-120s)
  - captions[]: string[] (parallel to photos[])
  - person_name: string

Response 200:
  { "memory_id": "uuid", "status": "processing" }

Response 400:
  { "error": "validation_failed", "detail": "..." }
```

### GET /api/memories/:id
```
Response 200:
  {
    "id": "uuid",
    "person_name": "...",
    "photos": [{ "url": "...", "caption": "...", "date": "..." }],
    "embedding_ready": true,
    "voice_id": "elevenlabs_voice_id"
  }
```

### POST /api/embed
```
Request: { "memory_id": "uuid" }
Response 200: { "status": "queued" }
```

## Firestore Schema
```
Collection: memories
  Document: {memory_id}
    - person_name: string
    - created_at: timestamp
    - status: 'processing' | 'ready'
    - voice_id: string | null
    - photos: subcollection
        Document: {photo_id}
          - url: string (Firebase Storage URL)
          - caption: string
          - date: string (YYYY or YYYY-MM-DD)
          - era: 'childhood' | 'young-adult' | 'family' | 'recent'
          - embedding: number[] | null (1024-dim)
```

## App Factory Pattern
```python
# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173", "https://*.web.app"])

    from .routes.upload import upload_bp
    from .routes.memories import memories_bp
    from .routes.embeddings import embeddings_bp

    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(memories_bp, url_prefix="/api")
    app.register_blueprint(embeddings_bp, url_prefix="/api")

    return app
```

## Upload Route Pattern
```python
# backend/app/routes/upload.py
import uuid
from flask import Blueprint, request, jsonify
from ..services.firebase_service import upload_file, save_memory

upload_bp = Blueprint("upload", __name__)

@upload_bp.post("/upload")
def handle_upload():
    photos = request.files.getlist("photos[]")
    voice = request.files.get("voice_recording")
    captions = request.form.getlist("captions[]")
    person_name = request.form.get("person_name", "")

    if not photos or not voice or len(captions) != len(photos):
        return jsonify({"error": "validation_failed", "detail": "Missing fields"}), 400

    memory_id = str(uuid.uuid4())
    # Upload to Firebase Storage, save to Firestore
    save_memory(memory_id, person_name, photos, voice, captions)

    return jsonify({"memory_id": memory_id, "status": "processing"})
```

## Firebase Service
```python
# backend/app/services/firebase_service.py
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dataclasses import dataclass

_app = firebase_admin.initialize_app(
    credentials.Certificate(os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"]),
    {"storageBucket": os.environ["FIREBASE_STORAGE_BUCKET"]}
)
db = firestore.client()
bucket = storage.bucket()
```

## requirements.txt
```
flask==3.0.3
flask-cors==4.0.1
firebase-admin==6.5.0
python-dotenv==1.0.1
httpx==0.27.0
python-multipart==0.0.9
```

## .env.example
```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
FIREBASE_STORAGE_BUCKET=memorybridge.appspot.com
ELEVENLABS_API_KEY=your_key_here
AMD_API_KEY=your_key_here
AMD_ENDPOINT=https://api.amd.com/v1
FLASK_ENV=development
```

## Rules
- Type annotations on ALL function signatures — no exceptions
- All secrets via `os.environ["KEY"]` — never hardcoded
- Validate ALL inputs at route level before calling services
- Return proper HTTP status codes (400 for bad input, 500 for server errors)
- Use Blueprint pattern for route organization
- CORS must allow localhost:5173 (Vite dev) AND Firebase Hosting domain
- Keep each route handler under 20 lines — delegate to services
- Use `flask run --debug` only in development — never in production
- serviceAccount.json must be in .gitignore

## Skill Reference
See skill: `mb-flask` for Flask factory pattern, Blueprint structure, error handling.
See skill: `mb-firebase` for Firebase Admin SDK, Firestore operations, Storage upload.
