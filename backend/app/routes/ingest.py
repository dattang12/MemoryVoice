"""Ingest routes — POST /api/upload, GET /api/health, POST /api/retry-agent/<id>.

Accepts multipart submissions, validates every field, stores assets in Firebase,
persists metadata to Firestore, and fans out two non-blocking background jobs:
  1. ElevenLabs voice-clone + knowledge-base + agent provisioning
  2. AMD/local embedding computation
"""

from __future__ import annotations

import logging
import os
import tempfile
import threading
import uuid
from typing import List, Tuple

from flask import Blueprint, jsonify, request
from werkzeug.datastructures import FileStorage

from ..services import cloud_store

logger = logging.getLogger(__name__)

ingest_bp = Blueprint("ingest", __name__)

# ---------------------------------------------------------------------------
# Limits and allowed types
# ---------------------------------------------------------------------------

_FILE_CEILING_BYTES: int = int(os.environ.get("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
_IMAGE_QUOTA: int = int(os.environ.get("MAX_PHOTOS", "30"))
_SUBJECT_NAME_CAP: int = 100
_ANNOTATION_CAP: int = 500

_VALID_PHOTO_TYPES: frozenset[str] = frozenset(
    {"image/jpeg", "image/png", "image/webp"}
)
_VALID_PHOTO_SUFFIXES: frozenset[str] = frozenset(
    {".jpg", ".jpeg", ".png", ".webp"}
)

_VALID_AUDIO_TYPES: frozenset[str] = frozenset(
    {"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/x-m4a"}
)
_VALID_AUDIO_SUFFIXES: frozenset[str] = frozenset(
    {".mp3", ".wav", ".ogg", ".m4a", ".webm"}
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@ingest_bp.get("/health")
def liveness_probe() -> Tuple[object, int]:
    """Lightweight health check used by load balancers and CI pipelines.

    Returns:
        JSON ``{"status": "ok", "service": "memoryvoice-backend"}`` with HTTP 200.
    """
    return jsonify({"status": "ok", "service": "memoryvoice-backend"}), 200


@ingest_bp.post("/upload")
def process_submission() -> Tuple[object, int]:
    """Accept a multipart form submission with photos and a voice recording.

    Form fields:
        photos[]        — one or more JPEG/PNG/WebP image files (max 30, max 10 MB)
        voice_recording — a single audio file (WAV/MP3/OGG/M4A/WebM)
        captions[]      — one annotation per photo (parallel to photos[])
        person_name     — display name of the subject

    Returns:
        200: ``{"memory_id": str, "status": "processing"}``
        400: ``{"error": "validation_failed", "detail": str}``
        500: ``{"error": "server_error", "detail": str}``
    """
    photos: List[FileStorage] = request.files.getlist("photos[]")
    audio: FileStorage | None = request.files.get("voice_recording")
    annotations: List[str] = request.form.getlist("captions[]")
    subject_name: str = request.form.get("person_name", "").strip()

    issue = _check_submission(photos, audio, annotations, subject_name)
    if issue:
        return jsonify({"error": "validation_failed", "detail": issue}), 400

    if audio is None:
        return jsonify({"error": "validation_failed", "detail": "voice_recording is required"}), 400

    entry_id = str(uuid.uuid4())

    try:
        audio_suffix = _extract_suffix(audio.filename or "", _VALID_AUDIO_SUFFIXES, ".mp3")
        audio.stream.seek(0)
        audio_bytes = audio.stream.read()
        audio.stream.seek(0)

        audio_path = f"memories/{entry_id}/voice/recording{audio_suffix}"
        audio_url = cloud_store.push_asset_to_cloud(
            file_obj=audio.stream,
            destination_path=audio_path,
            content_type=audio.content_type or "audio/mpeg",
        )
        logger.info("Audio asset stored at %s", audio_url)

        image_docs: List[dict] = []
        for idx, (photo, annotation) in enumerate(zip(photos, annotations)):
            asset_id = str(uuid.uuid4())
            photo_suffix = _extract_suffix(photo.filename or "", _VALID_PHOTO_SUFFIXES, ".jpg")
            photo_path = f"memories/{entry_id}/photos/{asset_id}{photo_suffix}"
            photo.stream.seek(0)
            photo_url = cloud_store.push_asset_to_cloud(
                file_obj=photo.stream,
                destination_path=photo_path,
                content_type=photo.content_type or "image/jpeg",
            )
            image_docs.append({
                "asset_id": asset_id,
                "url": photo_url,
                "storage_path": photo_path,
                "annotation": annotation.strip()[:_ANNOTATION_CAP],
                "captured": "",
                "phase": _assign_life_phase(idx, len(photos)),
            })

        cloud_store.persist_entry(
            entry_id=entry_id,
            subject_name=subject_name,
            audio_storage_path=audio_path,
            image_docs=image_docs,
        )

    except Exception:
        logger.exception("Submission failed for entry %s", entry_id)
        return jsonify({"error": "server_error", "detail": "An internal error occurred. Please try again."}), 500

    _schedule_vector_computation(entry_id, image_docs)
    _schedule_voice_pipeline(entry_id, subject_name, audio_bytes, audio_suffix)

    return jsonify({"memory_id": entry_id, "status": "processing"}), 200


@ingest_bp.post("/retry-agent/<entry_id>")
def requeue_voice_agent(entry_id: str) -> Tuple[object, int]:
    """Re-attempt companion agent creation for an entry that has voice + KB but no agent.

    Useful after a partial provisioning failure where voice cloning and KB upload
    completed but the final agent creation step failed.

    Args:
        entry_id: UUID of the Firestore archive entry.

    Returns:
        200: ``{"memory_id": str, "status": "processing"}``
        400: ``{"error": str}`` — voice_token or context_ref not yet stored
        404: ``{"error": str}`` — entry_id does not exist
    """
    rec = cloud_store.retrieve_entry(entry_id)
    if not rec:
        return jsonify({"error": f"Entry {entry_id} not found"}), 404

    voice_token = rec.get("voice_token")
    context_ref = rec.get("context_ref")
    subject_name = rec.get("subject_name", "Unknown")

    if not voice_token:
        return jsonify({"error": "voice_token not set — run full upload first"}), 400
    if not context_ref:
        return jsonify({"error": "context_ref not set — run full upload first"}), 400

    def _worker() -> None:
        import asyncio
        from ..services import voice_engine

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            companion_id = loop.run_until_complete(
                voice_engine.spawn_ai_companion(voice_token, context_ref, subject_name)
            )
            cloud_store.bind_companion_id(entry_id, companion_id)
            cloud_store.set_entry_state(entry_id, "ready")
            logger.info("[requeue] companion_id=%s for entry %s.", companion_id, entry_id)
        except Exception:
            logger.exception("[requeue] Failed for entry %s", entry_id)
            cloud_store.set_entry_state(entry_id, "error")
        finally:
            loop.close()

    t = threading.Thread(target=_worker, daemon=True, name=f"requeue-{entry_id[:8]}")
    t.start()
    logger.info("Requeue thread launched for entry %s.", entry_id)
    return jsonify({"memory_id": entry_id, "status": "processing"}), 200


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def _check_submission(
    photos: List[FileStorage],
    audio: FileStorage | None,
    annotations: List[str],
    subject_name: str,
) -> str | None:
    """Validate all fields of a multipart submission.

    Args:
        photos: List of photo FileStorage objects.
        audio: Voice recording FileStorage, or None if absent.
        annotations: Parallel list of caption strings.
        subject_name: Submitted subject name.

    Returns:
        An error message string if any field is invalid, otherwise None.
    """
    if not subject_name:
        return "person_name is required"

    if len(subject_name) > _SUBJECT_NAME_CAP:
        return f"person_name must be {_SUBJECT_NAME_CAP} characters or fewer"

    if not photos:
        return "At least one photo is required in photos[]"

    if not audio:
        return "voice_recording is required"

    if len(photos) > _IMAGE_QUOTA:
        return f"Maximum {_IMAGE_QUOTA} photos allowed; received {len(photos)}"

    if len(annotations) != len(photos):
        return (
            f"captions[] length ({len(annotations)}) must match "
            f"photos[] length ({len(photos)})"
        )

    for i, photo in enumerate(photos):
        err = _inspect_photo(photo, i)
        if err:
            return err

    return _inspect_audio(audio)


def _inspect_photo(photo: FileStorage, index: int) -> str | None:
    """Validate a single photo: extension, MIME type, size, and non-empty.

    Args:
        photo: Werkzeug FileStorage for this image.
        index: Zero-based position in the batch (used in error messages).

    Returns:
        Error string or None if the file passes all checks.
    """
    filename = photo.filename or ""
    suffix = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    if suffix not in _VALID_PHOTO_SUFFIXES:
        return (
            f"photos[{index}] has unsupported extension '{suffix}'. "
            f"Allowed: {sorted(_VALID_PHOTO_SUFFIXES)}"
        )

    mime = (photo.content_type or "").split(";")[0].strip().lower()
    if mime and mime not in _VALID_PHOTO_TYPES:
        return (
            f"photos[{index}] has unsupported MIME type '{mime}'. "
            f"Allowed: {sorted(_VALID_PHOTO_TYPES)}"
        )

    photo.stream.seek(0, 2)
    size = photo.stream.tell()
    photo.stream.seek(0)

    if size > _FILE_CEILING_BYTES:
        mb = size / (1024 * 1024)
        return (
            f"photos[{index}] is {mb:.1f} MB; maximum is "
            f"{_FILE_CEILING_BYTES // (1024 * 1024)} MB"
        )

    if size == 0:
        return f"photos[{index}] is empty"

    return None


def _inspect_audio(audio: FileStorage) -> str | None:
    """Validate the voice recording: extension, MIME type, size, and non-empty.

    Args:
        audio: Werkzeug FileStorage for the audio file.

    Returns:
        Error string or None if the file passes all checks.
    """
    filename = audio.filename or ""
    suffix = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""

    if suffix not in _VALID_AUDIO_SUFFIXES:
        return (
            f"voice_recording has unsupported extension '{suffix}'. "
            f"Allowed: {sorted(_VALID_AUDIO_SUFFIXES)}"
        )

    mime = (audio.content_type or "").split(";")[0].strip().lower()
    if mime and mime not in _VALID_AUDIO_TYPES:
        return (
            f"voice_recording has unsupported MIME type '{mime}'. "
            f"Allowed: {sorted(_VALID_AUDIO_TYPES)}"
        )

    audio.stream.seek(0, 2)
    size = audio.stream.tell()
    audio.stream.seek(0)

    if size == 0:
        return "voice_recording is empty"

    if size > _FILE_CEILING_BYTES:
        mb = size / (1024 * 1024)
        return (
            f"voice_recording is {mb:.1f} MB; maximum is "
            f"{_FILE_CEILING_BYTES // (1024 * 1024)} MB"
        )

    return None


# ---------------------------------------------------------------------------
# Background job schedulers
# ---------------------------------------------------------------------------


def _schedule_voice_pipeline(
    entry_id: str,
    subject_name: str,
    audio_bytes: bytes,
    audio_suffix: str,
) -> None:
    """Spawn a daemon thread to run the full ElevenLabs provisioning pipeline.

    Pipeline sequence:
      1. Write audio bytes to a local temp file
      2. Clone the subject's voice (ElevenLabs Instant Voice Clone)
      3. Compile knowledge base markdown from Firestore annotations
      4. Upload knowledge base document to ElevenLabs
      5. Create the conversational AI companion
      6. Persist voice_token, context_ref, companion_id back to Firestore
      7. Mark entry state as "ready"

    Skips without error if ELEVENLABS_API_KEY is absent.

    Args:
        entry_id: Archive entry UUID.
        subject_name: Display name used as voice/agent label.
        audio_bytes: Raw bytes of the voice recording.
        audio_suffix: File extension including dot (e.g. ".wav").
    """
    if not os.environ.get("ELEVENLABS_API_KEY"):
        logger.info(
            "ELEVENLABS_API_KEY not configured — skipping voice pipeline for %s.",
            entry_id,
        )
        return

    def _worker() -> None:
        import asyncio

        logger.info("Voice pipeline thread started for entry %s.", entry_id)
        tmp_path: str | None = None

        try:
            with tempfile.NamedTemporaryFile(
                suffix=audio_suffix,
                delete=False,
                prefix=f"vp_{entry_id[:8]}_",
            ) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    _execute_voice_pipeline(entry_id, subject_name, tmp_path)
                )
            finally:
                loop.close()

        except Exception:
            logger.exception("Voice pipeline failed for entry %s", entry_id)
            try:
                cloud_store.set_entry_state(entry_id, "error")
            except Exception:
                pass
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    t = threading.Thread(
        target=_worker,
        daemon=True,
        name=f"vp-{entry_id[:8]}",
    )
    t.start()
    logger.info("Voice pipeline thread queued for entry %s.", entry_id)


async def _execute_voice_pipeline(
    entry_id: str,
    subject_name: str,
    recording_path: str,
) -> None:
    """Run the asynchronous ElevenLabs provisioning steps for one entry.

    Includes an idempotency guard: if companion_id is already stored on the
    entry, the pipeline is skipped to prevent duplicate resources.

    Args:
        entry_id: Firestore archive entry UUID.
        subject_name: Display name for voice clone and agent labels.
        recording_path: Absolute path to the temp audio file.
    """
    from ..services import voice_engine
    from ai.knowledge_base.builder import build_from_firestore

    existing = cloud_store.retrieve_entry(entry_id)
    if existing and existing.get("companion_id"):
        logger.info(
            "[VP] Entry %s already provisioned (companion_id=%s). Skipping.",
            entry_id,
            existing["companion_id"],
        )
        return

    logger.info("[VP] Step 1 — cloning voice for entry %s.", entry_id)
    clone = await voice_engine.clone_subject_voice(recording_path, subject_name)
    cloud_store.bind_voice_token(entry_id, clone.voice_token)
    logger.info("[VP] Voice cloned: token=%s.", clone.voice_token)

    logger.info("[VP] Step 2 — building knowledge base for entry %s.", entry_id)
    kb_content = await build_from_firestore(entry_id, subject_name)

    logger.info("[VP] Step 3 — uploading context document for entry %s.", entry_id)
    context_ref = await voice_engine.push_context_document(
        kb_content, f"{subject_name} Life Memories"
    )
    cloud_store.bind_knowledge_ref(entry_id, context_ref)
    logger.info("[VP] Context document stored: ref=%s.", context_ref)

    logger.info("[VP] Step 4 — spawning AI companion for entry %s.", entry_id)
    companion_id = await voice_engine.spawn_ai_companion(
        clone.voice_token, context_ref, subject_name
    )
    cloud_store.bind_companion_id(entry_id, companion_id)
    logger.info("[VP] Companion created: id=%s.", companion_id)

    cloud_store.set_entry_state(entry_id, "ready")
    logger.info(
        "[VP] Pipeline complete for entry %s: voice=%s ctx=%s agent=%s.",
        entry_id,
        clone.voice_token,
        context_ref,
        companion_id,
    )


def _schedule_vector_computation(
    entry_id: str,
    image_docs: List[dict],
) -> None:
    """Spawn a daemon thread to generate embeddings for all photos.

    Failures are logged and do not crash the application. The ElevenLabs
    pipeline thread owns the "ready"/"error" state transitions.

    Args:
        entry_id: Archive entry UUID.
        image_docs: List of image metadata dicts with 'asset_id' and 'annotation'.
    """
    def _worker() -> None:
        import asyncio

        logger.info(
            "Vector computation thread started for entry %s (%d images).",
            entry_id,
            len(image_docs),
        )
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_compute_photo_vectors(entry_id, image_docs))
        except Exception:
            logger.exception("Vector computation failed for entry %s", entry_id)
        finally:
            loop.close()

    t = threading.Thread(target=_worker, daemon=True, name=f"vc-{entry_id[:8]}")
    t.start()
    logger.info("Vector computation thread queued for entry %s.", entry_id)


async def _compute_photo_vectors(
    entry_id: str,
    image_docs: List[dict],
) -> None:
    """Generate and persist text embeddings for each image in an entry.

    Skips photos with existing vectors (idempotent). Failures per-image are
    logged individually and do not abort the remaining images.

    Args:
        entry_id: Parent entry UUID.
        image_docs: List of dicts with 'asset_id' and 'annotation' fields.
    """
    from ..services.vector_engine import encode_text

    failed = 0

    for img in image_docs:
        asset_id: str = img["asset_id"]
        annotation: str = img.get("annotation", "")

        try:
            vec = await encode_text(b"", annotation)
            cloud_store.store_vector(
                entry_id=entry_id,
                asset_id=asset_id,
                vector=vec,
            )
            logger.info("Vector stored for asset %s / entry %s.", asset_id, entry_id)
        except Exception:
            failed += 1
            logger.error(
                "Failed to encode asset %s / entry %s.",
                asset_id,
                entry_id,
                exc_info=True,
            )

    logger.info(
        "Vector computation done for entry %s — %d failed.", entry_id, failed
    )


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def _assign_life_phase(index: int, total: int) -> str:
    """Map a photo's position in the batch to a life-era label.

    Divides the batch into four equal chronological quarters.

    Args:
        index: Zero-based photo index.
        total: Total number of photos in the batch.

    Returns:
        One of: ``"childhood"``, ``"young-adult"``, ``"family"``, ``"recent"``.
    """
    if total <= 1:
        return "recent"
    quarter = total / 4
    if index < quarter:
        return "childhood"
    if index < quarter * 2:
        return "young-adult"
    if index < quarter * 3:
        return "family"
    return "recent"


def _extract_suffix(filename: str, allowed: frozenset[str], fallback: str) -> str:
    """Extract a validated lowercase extension from a client-supplied filename.

    The raw filename is never used in Storage paths — only the suffix is kept,
    preventing path traversal via crafted filenames.

    Args:
        filename: Original filename from the HTTP multipart header.
        allowed: Set of permitted extensions (e.g. ``{".jpg", ".jpeg"}``).
        fallback: Extension to use when the file has no known extension.

    Returns:
        Validated lowercase extension string or ``fallback``.
    """
    if "." in filename:
        suffix = "." + filename.rsplit(".", 1)[-1].lower()
        if suffix in allowed:
            return suffix
    return fallback
