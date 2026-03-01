"""Vault routes — GET /api/memories and GET /api/memories/<entry_id>.

Provides read access to persisted archive entries. Retrieval includes
the full image sub-collection with embedding vectors and computed metadata.
"""

from __future__ import annotations

import logging
from typing import Tuple

from flask import Blueprint, jsonify, request

from ..services import cloud_store

logger = logging.getLogger(__name__)

vault_bp = Blueprint("vault", __name__)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@vault_bp.get("/memories/<entry_id>")
def fetch_entry(entry_id: str) -> Tuple[object, int]:
    """Return a single archive entry by its UUID, including all images.

    The response maps internal field names to the contract expected by the
    frontend: ``id``, ``person_name``, ``created_at``, ``status``, ``agent_id``,
    ``kb_id``, ``voice_id``, ``embedding_ready``, and ``photos``.

    Args:
        entry_id: UUID path parameter.

    Returns:
        200: Full entry document with nested photos list.
        404: ``{"error": "not found"}`` when the entry does not exist.
        500: ``{"error": "server_error"}`` on unexpected exceptions.
    """
    try:
        rec = cloud_store.retrieve_entry(entry_id)
    except Exception:
        logger.exception("retrieve_entry failed for %s", entry_id)
        return jsonify({"error": "server_error", "detail": "Failed to retrieve entry."}), 500

    if not rec:
        return jsonify({"error": "not found"}), 404

    images = rec.get("images", [])

    photos = [
        {
            "photo_id": img.get("asset_id", img.get("photo_id", img.get("id", ""))),
            "url": img.get("url", ""),
            "caption": img.get("caption", ""),
            "date": img.get("date", ""),
            "era": img.get("era", "recent"),
            "embedding": img.get("embedding"),
        }
        for img in images
    ]

    payload = {
        "id": entry_id,
        "person_name": rec.get("person_name", ""),
        "created_at": rec.get("created_at", ""),
        "status": rec.get("status", "processing"),
        "voice_id": rec.get("voice_id"),
        "kb_id": rec.get("kb_id"),
        "agent_id": rec.get("agent_id"),
        "embedding_ready": rec.get("vectors_complete", False),
        "photos": photos,
    }

    return jsonify(payload), 200


@vault_bp.get("/memories")
def browse_entries() -> Tuple[object, int]:
    """Return a paginated list of archive entries ordered newest-first.

    Query parameters:
        limit (int, 1–100, default 20): Number of entries per page.
        offset (int, ≥0, default 0): Number of entries to skip.

    Returns:
        200: ``{"memories": [...], "total": int}``
        400: ``{"error": "invalid_params", "detail": str}``
        500: ``{"error": "server_error"}``
    """
    try:
        raw_limit = request.args.get("limit", "20")
        raw_offset = request.args.get("offset", "0")
        page_size = max(1, min(int(raw_limit), 100))
        skip = max(0, int(raw_offset))
    except (ValueError, TypeError):
        return jsonify({"error": "invalid_params", "detail": "limit and offset must be integers."}), 400

    try:
        records = cloud_store.query_entries(page_size=page_size, skip=skip)
    except Exception:
        logger.exception("query_entries failed")
        return jsonify({"error": "server_error", "detail": "Failed to list entries."}), 500

    memories = [
        {
            "id": r.get("id", ""),
            "person_name": r.get("person_name", ""),
            "created_at": r.get("created_at", ""),
            "status": r.get("status", "processing"),
            "voice_id": r.get("voice_id"),
            "agent_id": r.get("agent_id"),
        }
        for r in records
    ]

    return jsonify({"memories": memories, "total": len(memories)}), 200
