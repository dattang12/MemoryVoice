# Skill: Flask API Patterns for MemoryBridge

## App Factory (backend/app/__init__.py)
```python
from flask import Flask
from flask_cors import CORS

def create_app() -> Flask:
    app = Flask(__name__)

    # CORS: allow Vite dev server + Firebase Hosting
    CORS(app, origins=[
        "http://localhost:5173",
        "https://memorybridge-h4h-2026.web.app",
    ])

    # Register blueprints
    from .routes.upload import upload_bp
    from .routes.memories import memories_bp
    from .routes.embeddings import embeddings_bp

    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(memories_bp, url_prefix="/api")
    app.register_blueprint(embeddings_bp, url_prefix="/api")

    return app
```

## run.py
```python
import os
from dotenv import load_dotenv
from app import create_app

load_dotenv()

app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=5000, debug=debug)
```

## Blueprint Pattern (routes/upload.py)
```python
import uuid
import logging
from flask import Blueprint, request, jsonify, Response
from ..services.firebase_service import upload_to_storage, save_memory_document, save_photo

logger = logging.getLogger(__name__)
upload_bp = Blueprint("upload", __name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/webm"}
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10MB
MAX_PHOTOS = 30

@upload_bp.post("/upload")
def handle_upload() -> tuple[Response, int]:
    # Validate inputs
    photos = request.files.getlist("photos[]")
    voice = request.files.get("voice_recording")
    captions = request.form.getlist("captions[]")
    person_name = request.form.get("person_name", "").strip()

    if not photos:
        return jsonify({"error": "validation_failed", "detail": "No photos provided"}), 400
    if len(photos) > MAX_PHOTOS:
        return jsonify({"error": "validation_failed", "detail": f"Max {MAX_PHOTOS} photos"}), 400
    if not voice:
        return jsonify({"error": "validation_failed", "detail": "No voice recording"}), 400
    if len(captions) != len(photos):
        return jsonify({"error": "validation_failed", "detail": "Captions count mismatch"}), 400
    if not person_name:
        return jsonify({"error": "validation_failed", "detail": "person_name required"}), 400

    # Validate file types
    for photo in photos:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            return jsonify({"error": "invalid_type", "detail": f"Invalid image type: {photo.content_type}"}), 400

    if voice.content_type not in ALLOWED_AUDIO_TYPES:
        return jsonify({"error": "invalid_type", "detail": "Invalid audio type"}), 400

    try:
        memory_id = str(uuid.uuid4())
        save_memory_document(memory_id, person_name)

        for i, (photo, caption) in enumerate(zip(photos, captions)):
            photo_id = str(uuid.uuid4())
            url = upload_to_storage(photo, memory_id, f"photo_{photo_id}.jpg")
            era = classify_era_from_caption(caption)
            save_photo(memory_id, photo_id, url, caption, "", era)

        voice_url = upload_to_storage(voice, memory_id, "voice.wav")
        logger.info("Memory created: %s", memory_id)

        return jsonify({"memory_id": memory_id, "status": "processing"}), 200

    except Exception as e:
        logger.exception("Upload failed for %s", person_name)
        return jsonify({"error": "server_error", "detail": str(e)}), 500
```

## Error Handler (register in create_app)
```python
from flask import jsonify

def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "not_found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "server_error"}), 500

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "file_too_large", "detail": "Max 10MB per file"}), 413

# Add to create_app:
# register_error_handlers(app)
```

## Async Background Job Pattern
```python
# For embedding job (POST /api/embed) — non-blocking
import threading
from .services.amd_service import generate_embedding_for_memory

@embeddings_bp.post("/embed")
def trigger_embedding() -> tuple[Response, int]:
    data = request.get_json()
    memory_id = data.get("memory_id")

    if not memory_id:
        return jsonify({"error": "memory_id required"}), 400

    # Run embedding in background — don't block HTTP response
    thread = threading.Thread(
        target=run_embedding_job,
        args=(memory_id,),
        daemon=True
    )
    thread.start()

    return jsonify({"status": "queued", "memory_id": memory_id}), 200

def run_embedding_job(memory_id: str) -> None:
    """Background worker — called in separate thread."""
    import asyncio
    try:
        asyncio.run(generate_embedding_for_memory(memory_id))
        logger.info("Embedding complete for %s", memory_id)
    except Exception:
        logger.exception("Embedding failed for %s", memory_id)
```

## Health Check Endpoint
```python
# Add to any blueprint or directly to app
@app.get("/health")
def health() -> tuple[Response, int]:
    return jsonify({"status": "ok", "service": "memorybridge-api"}), 200
```

## requirements.txt
```
flask==3.0.3
flask-cors==4.0.1
firebase-admin==6.5.0
python-dotenv==1.0.1
httpx==0.27.0
sentence-transformers==3.0.0
numpy==1.26.4
```

## Key Rules
- Use Blueprint pattern — never define routes directly on `app`
- Validate file types via content_type + extension (both checks)
- Background jobs via threading.Thread — never block HTTP request for long operations
- Use `logger.exception()` in except blocks — logs full traceback
- CORS origins: explicit list, never `*` in production
- Never commit .env or serviceAccount.json
