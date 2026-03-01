"""Embedding generation pipeline for MemoryVoice.

Priority order:
  1. AMD MI300X endpoint (httpx async, 30 s timeout) when AMD_ENDPOINT is set.
  2. Local CPU via sentence-transformers (all-MiniLM-L6-v2) as fallback.

Environment variables:
    AMD_API_KEY           — Bearer token for AMD endpoint.
    AMD_ENDPOINT          — Base URL, e.g. https://api.amd.com/v1.
                            Set to empty string to force local CPU.
    AMD_EMBEDDING_MODEL   — Model ID (default: sentence-transformers/all-MiniLM-L6-v2).
    SIMILARITY_THRESHOLD  — Float threshold for graph edges (default: 0.7).
"""

from __future__ import annotations

import asyncio
import logging
import math
import os
import time
from dataclasses import dataclass
from typing import Sequence

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AMD_API_KEY: str = os.environ.get("AMD_API_KEY", "")
AMD_ENDPOINT: str = os.environ.get("AMD_ENDPOINT", "").rstrip("/")
AMD_EMBEDDING_MODEL: str = os.environ.get(
    "AMD_EMBEDDING_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)
_AMD_TIMEOUT_SECONDS: float = 30.0
_LOCAL_MODEL_NAME: str = "all-MiniLM-L6-v2"


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class EmbeddingResult:
    """Immutable result returned by any embedding backend."""

    text: str
    embedding: list[float]
    model: str
    backend: str  # "amd" | "local"


# ---------------------------------------------------------------------------
# Local CPU backend
# ---------------------------------------------------------------------------
_local_model = None  # lazy-loaded SentenceTransformer instance


def _get_local_model():  # type: ignore[return]
    """Lazy-load the sentence-transformers model on first call."""
    global _local_model
    if _local_model is None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore[import]

            logger.info("Loading local sentence-transformer model: %s", _LOCAL_MODEL_NAME)
            _local_model = SentenceTransformer(_LOCAL_MODEL_NAME)
            logger.info("Local model loaded successfully.")
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. "
                "Run: pip install sentence-transformers"
            ) from exc
    return _local_model


def _normalize(vector: list[float]) -> list[float]:
    """L2-normalize a float vector in pure Python."""
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude == 0.0:
        return vector
    return [x / magnitude for x in vector]


def generate_embedding_local(text: str) -> EmbeddingResult:
    """Generate a normalized embedding on the local CPU.

    Args:
        text: Input text to embed.

    Returns:
        EmbeddingResult with backend="local".
    """
    logger.info("Using local CPU (fallback) for embedding.")
    model = _get_local_model()
    raw: list[float] = model.encode(text).tolist()  # numpy → Python list
    normalized = _normalize(raw)
    return EmbeddingResult(
        text=text,
        embedding=normalized,
        model=_LOCAL_MODEL_NAME,
        backend="local",
    )


# ---------------------------------------------------------------------------
# AMD MI300X backend
# ---------------------------------------------------------------------------
async def _generate_embedding_amd(text: str) -> EmbeddingResult:
    """Generate an embedding via the AMD MI300X REST endpoint.

    Args:
        text: Input text to embed.

    Returns:
        EmbeddingResult with backend="amd".

    Raises:
        httpx.HTTPStatusError: On non-2xx response.
        httpx.TimeoutException: If the request exceeds 30 s.
    """
    logger.info("Using AMD MI300X for embedding (endpoint=%s).", AMD_ENDPOINT)
    async with httpx.AsyncClient(timeout=_AMD_TIMEOUT_SECONDS) as client:
        response = await client.post(
            f"{AMD_ENDPOINT}/embeddings",
            headers={"Authorization": f"Bearer {AMD_API_KEY}"},
            json={"input": text, "model": AMD_EMBEDDING_MODEL},
        )
        response.raise_for_status()
        data = response.json()

    raw: list[float] = data["data"][0]["embedding"]
    normalized = _normalize(raw)
    return EmbeddingResult(
        text=text,
        embedding=normalized,
        model=data.get("model", AMD_EMBEDDING_MODEL),
        backend="amd",
    )


# ---------------------------------------------------------------------------
# Public embedding entry-point (AMD with CPU fallback)
# ---------------------------------------------------------------------------
async def generate_embedding(text: str) -> EmbeddingResult:
    """Generate an embedding, preferring AMD and falling back to local CPU.

    Fallback is triggered when:
    - AMD_ENDPOINT env var is empty / unset, OR
    - The AMD endpoint raises any exception (timeout, HTTP error, etc.).

    Args:
        text: Input text to embed.

    Returns:
        EmbeddingResult from whichever backend succeeded.
    """
    if not AMD_ENDPOINT:
        logger.info("AMD_ENDPOINT not set — using local CPU (fallback).")
        return generate_embedding_local(text)

    try:
        return await _generate_embedding_amd(text)
    except httpx.TimeoutException:
        logger.warning(
            "AMD endpoint timed out after %.0fs — falling back to local CPU.",
            _AMD_TIMEOUT_SECONDS,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "AMD endpoint failed (%s: %s) — falling back to local CPU.",
            type(exc).__name__,
            exc,
        )

    return generate_embedding_local(text)


async def generate_embedding_with_timing(text: str) -> EmbeddingResult:
    """Wrap generate_embedding with AMD demo evidence logging.

    Logs a line of the form:
        AMD MI300X embedding: 42.3ms for 128 chars   [backend=amd]
    or:
        AMD MI300X embedding: 12.1ms for 128 chars   [backend=local]

    Args:
        text: Input text to embed.

    Returns:
        EmbeddingResult from whichever backend was used.
    """
    start = time.perf_counter()
    result = await generate_embedding(text)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    logger.info(
        "AMD MI300X embedding: %.1fms for %d chars   [backend=%s]",
        elapsed_ms,
        len(text),
        result.backend,
    )
    return result


# ---------------------------------------------------------------------------
# Firestore helpers (lazy import to avoid hard dependency in unit tests)
# ---------------------------------------------------------------------------
def _get_firestore_client():  # type: ignore[return]
    """Return the Firestore client from firebase_admin."""
    try:
        from firebase_admin import firestore  # type: ignore[import]

        return firestore.client()
    except ImportError as exc:
        raise RuntimeError(
            "firebase-admin is not installed. Run: pip install firebase-admin"
        ) from exc


async def _store_embedding(
    memory_id: str,
    caption_index: int,
    embedding: list[float],
    caption: str,
) -> None:
    """Persist a single embedding to Firestore.

    Path: memories/{memory_id}/embeddings/{caption_index}

    Stores embedding as list[float] — never as a numpy array.

    Args:
        memory_id: Firestore memory document ID.
        caption_index: Zero-based index of this caption within the memory.
        embedding: Normalized float vector.
        caption: Original caption text.
    """
    db = _get_firestore_client()
    doc_ref = (
        db.collection("memories")
        .document(memory_id)
        .collection("embeddings")
        .document(str(caption_index))
    )
    # Run blocking Firestore call in thread pool to keep the event loop free.
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,
        lambda: doc_ref.set(
            {
                "caption": caption,
                "embedding": embedding,  # list[float] — Firestore-safe
                "caption_index": caption_index,
            }
        ),
    )
    logger.debug("Stored embedding for memory=%s caption=%d.", memory_id, caption_index)


async def _store_graph(memory_id: str, edges: list[dict]) -> None:
    """Persist the semantic graph edges to Firestore.

    Path: memories/{memory_id}/graph/edges  (single document, list field)

    Args:
        memory_id: Firestore memory document ID.
        edges: Serialised list of edge dicts.
    """
    db = _get_firestore_client()
    doc_ref = (
        db.collection("memories").document(memory_id).collection("graph").document("edges")
    )
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(
        None,
        lambda: doc_ref.set({"edges": edges}),
    )
    logger.info("Stored semantic graph for memory=%s (%d edges).", memory_id, len(edges))


async def _fetch_captions(memory_id: str) -> list[str]:
    """Retrieve photo captions from the Firestore photos subcollection.

    Reads: memories/{memory_id}/photos — a subcollection of photo documents
    written by firebase_service.save_memory_to_firestore(). The parent memory
    document does NOT contain a photos array.

    Args:
        memory_id: Firestore memory document ID.

    Returns:
        Ordered list of caption strings.
    """
    db = _get_firestore_client()
    loop = asyncio.get_running_loop()
    photos_ref = db.collection("memories").document(memory_id).collection("photos")
    photo_docs = await loop.run_in_executor(None, lambda: list(photos_ref.stream()))
    captions = [doc.to_dict().get("caption", "") for doc in photo_docs]
    logger.info(
        "Fetched %d captions for memory=%s.", len(captions), memory_id
    )
    return captions


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------
async def batch_generate_embeddings(
    memory_id: str,
    captions: Sequence[str],
) -> list[EmbeddingResult]:
    """Generate embeddings for a sequence of captions and persist each to Firestore.

    Processes captions sequentially to stay within AMD rate limits and to
    guarantee ordering in Firestore.  With at most 30 photos this completes
    well within the hackathon demo window.

    Args:
        memory_id: Firestore memory document ID.
        captions: Ordered list of caption strings (max 30).

    Returns:
        List of EmbeddingResult, one per caption, in input order.
    """
    if len(captions) > 30:
        logger.warning(
            "batch_generate_embeddings received %d captions; only the first 30 "
            "will be processed (limit is 30).",
            len(captions),
        )
        captions = captions[:30]

    results: list[EmbeddingResult] = []
    for idx, caption in enumerate(captions):
        result = await generate_embedding_with_timing(caption)
        await _store_embedding(memory_id, idx, result.embedding, caption)
        results.append(result)

    logger.info(
        "batch_generate_embeddings complete: %d embeddings for memory=%s.",
        len(results),
        memory_id,
    )
    return results


async def process_memory_embeddings(memory_id: str) -> None:
    """Full embedding pipeline for a memory document.

    Steps:
      1. Fetch captions from Firestore memories/{memory_id}.photos.
      2. Generate and store an embedding for every caption (AMD or CPU).
      3. Build the semantic graph (cosine similarity >= SIMILARITY_THRESHOLD).
      4. Store graph edges back to Firestore.

    Args:
        memory_id: Firestore memory document ID.
    """
    from .semantic_graph import MemoryNode, build_semantic_graph  # local import avoids cycle

    logger.info("process_memory_embeddings START for memory=%s.", memory_id)

    captions = await _fetch_captions(memory_id)
    if not captions:
        logger.warning("No captions found for memory=%s — skipping.", memory_id)
        return

    embedding_results = await batch_generate_embeddings(memory_id, captions)

    # Build MemoryNode list (date is unknown at this stage; era derived later)
    nodes: list[MemoryNode] = [
        MemoryNode(
            id=f"{memory_id}_{idx}",
            text=caption,
            embedding=result.embedding,
            date="",
            era="unknown",
        )
        for idx, (caption, result) in enumerate(zip(captions, embedding_results))
    ]

    threshold = float(os.environ.get("SIMILARITY_THRESHOLD", "0.7"))
    edges = build_semantic_graph(nodes, threshold=threshold)

    # Serialise edges as plain dicts for Firestore
    edge_dicts = [
        {
            "source_id": e.source_id,
            "target_id": e.target_id,
            "similarity": e.similarity,
        }
        for e in edges
    ]
    await _store_graph(memory_id, edge_dicts)

    logger.info(
        "process_memory_embeddings DONE for memory=%s: %d nodes, %d edges.",
        memory_id,
        len(nodes),
        len(edges),
    )
