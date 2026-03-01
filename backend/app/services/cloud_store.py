"""Cloud persistence layer for the archive service.

Handles all interactions with Firebase Firestore (document store)
and Firebase Storage (binary asset store).

The Firebase application is initialized lazily on first use and
reused as a singleton for the lifetime of the process.
"""

from __future__ import annotations

import datetime
import logging
import os
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import credentials, firestore, storage

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal constants
# ---------------------------------------------------------------------------

_DOWNLOAD_LINK_TTL: int = 24  # signed-URL validity in hours
_COLLECTION_ROOT: str = "memories"
_ASSETS_SUB: str = "photos"


# ---------------------------------------------------------------------------
# Firebase initialization helpers
# ---------------------------------------------------------------------------


def _acquire_cloud_client() -> firebase_admin.App:
    """Return the singleton Firebase application, initializing it if needed.

    Reads credentials and bucket from environment variables. Safe to call
    multiple times — returns the existing app after the first initialization.

    Returns:
        The initialized firebase_admin.App instance.

    Raises:
        FileNotFoundError: If the service account file does not exist.
        ValueError: If required environment variables are not set.
    """
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass

    account_path = os.environ.get(
        "FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccount.json"
    )
    bucket_id = os.environ.get("FIREBASE_STORAGE_BUCKET", "")

    cert = credentials.Certificate(account_path)
    options: Dict[str, Any] = {}
    if bucket_id:
        options["storageBucket"] = bucket_id

    return firebase_admin.initialize_app(cert, options)


def _firestore_ref() -> Any:
    """Return a Firestore client, initializing Firebase if needed."""
    _acquire_cloud_client()
    return firestore.client()


def _storage_ref() -> Any:
    """Return the default Storage bucket, initializing Firebase if needed."""
    _acquire_cloud_client()
    return storage.bucket()


# ---------------------------------------------------------------------------
# Asset storage
# ---------------------------------------------------------------------------


def push_asset_to_cloud(
    file_obj: Any,
    destination_path: str,
    content_type: str,
) -> str:
    """Upload a binary object to Firebase Storage and return a signed download URL.

    Args:
        file_obj: File-like object opened in binary mode.
        destination_path: Target path within the Storage bucket.
        content_type: MIME type of the asset (e.g. "image/jpeg").

    Returns:
        Temporary signed HTTPS URL valid for ``_DOWNLOAD_LINK_TTL`` hours.
    """
    bucket = _storage_ref()
    blob = bucket.blob(destination_path)
    blob.upload_from_file(file_obj, content_type=content_type)

    expiry = datetime.timedelta(hours=_DOWNLOAD_LINK_TTL)
    signed = blob.generate_signed_url(expiration=expiry, method="GET", version="v4")
    logger.debug("Asset pushed to %s; link valid %dh.", destination_path, _DOWNLOAD_LINK_TTL)
    return signed


# ---------------------------------------------------------------------------
# Document persistence
# ---------------------------------------------------------------------------


def persist_entry(
    entry_id: str,
    subject_name: str,
    audio_storage_path: str,
    image_docs: List[Dict[str, Any]],
) -> None:
    """Write a new archive entry and its image sub-documents to Firestore.

    Creates the parent document in ``_COLLECTION_ROOT`` and a child document
    for every image in the ``_ASSETS_SUB`` sub-collection.

    Args:
        entry_id: UUID that identifies this archive entry.
        subject_name: Display name of the recorded subject.
        audio_storage_path: Firebase Storage path for the voice recording.
        image_docs: List of dicts; each contains url, storage_path, annotation,
            captured, phase (and optionally others).
    """
    db = _firestore_ref()
    now = datetime.datetime.utcnow().isoformat() + "Z"

    entry_ref = db.collection(_COLLECTION_ROOT).document(entry_id)
    entry_ref.set({
        "person_name": subject_name,
        "created_at": now,
        "status": "processing",
        "voice_id": None,
        "kb_id": None,
        "agent_id": None,
        "voice_storage_path": audio_storage_path,
    })

    for doc in image_docs:
        asset_ref = entry_ref.collection(_ASSETS_SUB).document(doc["asset_id"])
        asset_ref.set({
            "url": doc["url"],
            "storage_path": doc["storage_path"],
            "caption": doc.get("annotation", ""),
            "date": doc.get("captured", ""),
            "era": doc.get("phase", "recent"),
            "embedding": None,
        })

    logger.info("Entry %s persisted with %d image(s).", entry_id, len(image_docs))


def retrieve_entry(entry_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single archive entry and its images from Firestore.

    Args:
        entry_id: UUID of the target entry.

    Returns:
        Dict with all entry fields plus an ``images`` list, or None if absent.
    """
    db = _firestore_ref()
    ref = db.collection(_COLLECTION_ROOT).document(entry_id)
    snap = ref.get()

    if not snap.exists:
        return None

    data = snap.to_dict() or {}
    data["id"] = entry_id

    images: List[Dict[str, Any]] = []
    for img_snap in ref.collection(_ASSETS_SUB).stream():
        img = img_snap.to_dict() or {}
        img["asset_id"] = img_snap.id
        images.append(img)

    data["images"] = images
    data["vectors_complete"] = bool(images) and all(
        img.get("embedding") is not None for img in images
    )
    return data


def fetch_image_assets(entry_id: str) -> List[Dict[str, Any]]:
    """Stream all image documents for a given entry.

    Args:
        entry_id: UUID of the parent archive entry.

    Returns:
        List of image dicts including asset_id, url, annotation, phase, vector.
    """
    db = _firestore_ref()
    ref = db.collection(_COLLECTION_ROOT).document(entry_id)
    result: List[Dict[str, Any]] = []

    for snap in ref.collection(_ASSETS_SUB).stream():
        rec = snap.to_dict() or {}
        rec["id"] = snap.id
        rec["asset_id"] = snap.id
        rec["photo_id"] = snap.id
        rec["url"] = rec.get("url", "")
        rec["storagePath"] = rec.get("storage_path", "")
        rec["annotation"] = rec.get("caption", "")
        rec["captured"] = rec.get("date", "")
        rec["phase"] = rec.get("era", "recent")
        rec["uploadedAt"] = ""
        result.append(rec)

    return result


def store_vector(
    entry_id: str,
    asset_id: str,
    vector: List[float],
) -> None:
    """Write an embedding vector to an image document.

    Args:
        entry_id: Parent entry UUID.
        asset_id: Image document ID within the images sub-collection.
        vector: Floating-point embedding (typically 384 dimensions).
    """
    db = _firestore_ref()
    (
        db.collection(_COLLECTION_ROOT)
        .document(entry_id)
        .collection(_ASSETS_SUB)
        .document(asset_id)
        .update({"embedding": vector})
    )
    logger.debug("Vector stored for asset %s / entry %s.", asset_id, entry_id)


def set_entry_state(entry_id: str, state: str) -> None:
    """Update the processing state of an archive entry.

    Args:
        entry_id: UUID of the target entry.
        state: One of "processing", "ready", or "error".
    """
    db = _firestore_ref()
    db.collection(_COLLECTION_ROOT).document(entry_id).update({"status": state})
    logger.debug("Entry %s state → %s.", entry_id, state)


def bind_voice_token(entry_id: str, voice_token: str) -> None:
    """Persist the ElevenLabs voice clone ID on an archive entry.

    Args:
        entry_id: UUID of the target entry.
        voice_token: Voice clone identifier from ElevenLabs.
    """
    db = _firestore_ref()
    db.collection(_COLLECTION_ROOT).document(entry_id).update(
        {"voice_id": voice_token}
    )


def bind_knowledge_ref(entry_id: str, context_ref: str) -> None:
    """Persist the knowledge base document ID on an archive entry.

    Args:
        entry_id: UUID of the target entry.
        context_ref: Knowledge base ID from ElevenLabs.
    """
    db = _firestore_ref()
    db.collection(_COLLECTION_ROOT).document(entry_id).update(
        {"kb_id": context_ref}
    )


def bind_companion_id(entry_id: str, companion_id: str) -> None:
    """Persist the ElevenLabs conversational agent ID on an archive entry.

    Args:
        entry_id: UUID of the target entry.
        companion_id: Conversational AI agent ID from ElevenLabs.
    """
    db = _firestore_ref()
    db.collection(_COLLECTION_ROOT).document(entry_id).update(
        {"agent_id": companion_id}
    )


def query_entries(
    page_size: int = 20,
    skip: int = 0,
) -> List[Dict[str, Any]]:
    """Return a paginated list of archive entries ordered by registration date.

    Lightweight query — does not load image sub-collections.

    Args:
        page_size: Maximum number of entries to return (default 20).
        skip: Number of entries to skip from the start (default 0).

    Returns:
        List of entry dicts with id, person_name, created_at, status, etc.
    """
    db = _firestore_ref()
    query = (
        db.collection(_COLLECTION_ROOT)
        .order_by("created_at", direction=firestore.Query.DESCENDING)
    )

    all_snaps = list(query.stream())
    total = len(all_snaps)
    page = all_snaps[skip: skip + page_size]

    entries: List[Dict[str, Any]] = []
    for snap in page:
        rec = snap.to_dict() or {}
        rec["id"] = snap.id
        entries.append(rec)

    logger.debug("query_entries page_size=%d skip=%d → %d/%d.", page_size, skip, len(entries), total)
    return entries
