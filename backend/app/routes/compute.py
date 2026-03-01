"""Compute routes — POST /api/embed.

Accepts a memory_id and queues a batch embedding job that encodes
every image caption in the archive entry and writes the resulting
vectors back to Firestore.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Dict, List, Optional, Tuple

from flask import Blueprint, jsonify, request

from ..services import cloud_store

logger = logging.getLogger(__name__)

compute_bp = Blueprint("compute", __name__)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@compute_bp.post("/embed")
def launch_vectorization() -> Tuple[object, int]:
    """Queue an embedding batch job for all images in an archive entry.

    Request body (JSON):
        ``{"memory_id": "<uuid>"}``

    Returns:
        200: ``{"status": "queued", "memory_id": str, "photo_count": int}``
        400: ``{"error": str}`` — missing or invalid body
        404: ``{"error": str}`` — entry_id not found in Firestore
        500: ``{"error": str}`` — unexpected server error
    """
    body: Dict[str, Any] = request.get_json(silent=True) or {}
    entry_id: str = body.get("memory_id", "").strip()

    if not entry_id:
        return jsonify({"error": "memory_id is required in the request body"}), 400

    try:
        rec = cloud_store.retrieve_entry(entry_id)
    except Exception:
        logger.exception("retrieve_entry failed for %s during embed request", entry_id)
        return jsonify({"error": "server_error", "detail": "Failed to look up entry."}), 500

    if not rec:
        return jsonify({"error": f"Entry {entry_id!r} not found"}), 404

    images: List[Dict[str, Any]] = rec.get("images", [])
    _schedule_batch(entry_id, images)

    return jsonify({
        "status": "queued",
        "memory_id": entry_id,
        "photo_count": len(images),
    }), 200


# ---------------------------------------------------------------------------
# Background batch helpers
# ---------------------------------------------------------------------------


def _schedule_batch(entry_id: str, images: List[Dict[str, Any]]) -> None:
    """Spawn a daemon thread to run the embedding batch for ``entry_id``.

    Args:
        entry_id: Archive entry UUID.
        images: List of image metadata dicts with 'asset_id' and 'annotation'.
    """
    def _worker() -> None:
        import asyncio

        logger.info(
            "Embedding batch thread started for entry %s (%d images).",
            entry_id,
            len(images),
        )
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_process_vector_batch(entry_id, images))
        except Exception:
            logger.exception("Embedding batch thread crashed for entry %s", entry_id)
        finally:
            loop.close()

    t = threading.Thread(
        target=_worker,
        daemon=True,
        name=f"batch-{entry_id[:8]}",
    )
    t.start()
    logger.info("Embedding batch thread queued for entry %s.", entry_id)


async def _process_vector_batch(
    entry_id: str,
    images: List[Dict[str, Any]],
) -> None:
    """Encode all images and persist vectors; set entry state to ready/error.

    Skips images that already have a vector stored (idempotency guard).
    All failures are logged individually. The entry state is set to "ready"
    if all images succeed and "error" if any fail.

    Args:
        entry_id: Parent archive entry UUID.
        images: List of image dicts with 'asset_id' and 'annotation' fields.
    """
    from ..services.vector_engine import encode_text

    succeeded = 0
    failed = 0

    for img in images:
        asset_id: str = img.get("asset_id", img.get("id", ""))
        annotation: str = img.get("annotation", "")

        if img.get("vector") is not None:
            logger.debug("Skipping asset %s — vector already stored.", asset_id)
            succeeded += 1
            continue

        try:
            vec = await encode_text(b"", annotation)
            cloud_store.store_vector(
                entry_id=entry_id,
                asset_id=asset_id,
                vector=vec,
            )
            succeeded += 1
            logger.info("Vector stored for asset %s / entry %s.", asset_id, entry_id)
        except Exception:
            failed += 1
            logger.error(
                "Failed to embed asset %s / entry %s.",
                asset_id,
                entry_id,
                exc_info=True,
            )

    terminal_state = "ready" if failed == 0 else "error"
    cloud_store.set_entry_state(entry_id, terminal_state)
    logger.info(
        "Batch complete for entry %s — %d ok, %d failed. State → %s.",
        entry_id,
        succeeded,
        failed,
        terminal_state,
    )
