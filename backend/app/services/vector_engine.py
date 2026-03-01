"""Embedding generation via AMD MI300X or local CPU fallback.

Generates L2-normalized 384-dimensional float vectors from text captions.
The primary path posts to an AMD Developer Cloud endpoint using the
OpenAI-compatible embeddings API. When that endpoint is unavailable or
unconfigured, inference falls back to a locally loaded SentenceTransformer.

Usage:
    from app.services.vector_engine import encode_text, encode_batch
"""

from __future__ import annotations

import asyncio
import logging
import math
import os
import time
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_COMPUTE_HOST: str = os.environ.get("AMD_ENDPOINT", "")
_ENCODER_MODEL: str = os.environ.get("AMD_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
_VECTOR_SIZE: int = 384
_REQUEST_DEADLINE: httpx.Timeout = httpx.Timeout(30.0, connect=5.0)

# Lazily initialized on first local inference call
_cached_encoder: Any = None


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------


async def encode_text(raw_bytes: bytes, caption: str) -> List[float]:
    """Produce a 384-dim L2-normalized embedding for a given caption.

    The AMD cloud path is tried first when _COMPUTE_HOST is configured.
    Any connection failure or error falls through to the local CPU path.

    Note: raw_bytes is accepted for interface compatibility but is not used;
    the underlying model (all-MiniLM-L6-v2) is text-only.

    Args:
        raw_bytes: Binary asset data (ignored by text-only models).
        caption: Descriptive text to embed.

    Returns:
        List of 384 floats representing the L2-normalized embedding.
    """
    if _COMPUTE_HOST:
        try:
            t0 = time.perf_counter()
            vec = await _remote_encode(caption)
            elapsed = time.perf_counter() - t0
            logger.info("AMD encode %.3fs for caption=%r", elapsed, caption[:60])
            return vec
        except Exception as exc:
            logger.warning("AMD encode failed (%s). Falling back to local CPU.", exc)

    t0 = time.perf_counter()
    vec = await asyncio.to_thread(_local_encode, caption)
    elapsed = time.perf_counter() - t0
    logger.info("Local CPU encode %.3fs for caption=%r", elapsed, caption[:60])
    return vec


async def encode_batch(
    jobs: List[Dict[str, Any]],
) -> List[Optional[List[float]]]:
    """Concurrently embed multiple caption+image pairs.

    Each job dict must contain at minimum:
        ``image_bytes`` (bytes): raw asset data (currently ignored).
        ``caption`` (str): descriptive text for this image.

    Args:
        jobs: List of job dicts.

    Returns:
        Parallel list of embedding vectors. Entries are None for any job
        that raised an exception during encoding.
    """
    async def _safe_encode(job: Dict[str, Any]) -> Optional[List[float]]:
        try:
            return await encode_text(job.get("image_bytes", b""), job.get("caption", ""))
        except Exception as exc:
            logger.error("encode_batch item failed: %s", exc)
            return None

    return list(await asyncio.gather(*(_safe_encode(j) for j in jobs)))


# ---------------------------------------------------------------------------
# Private compute paths
# ---------------------------------------------------------------------------


async def _remote_encode(text: str) -> List[float]:
    """Request an embedding from the AMD cloud endpoint.

    Uses the OpenAI-compatible ``/embeddings`` endpoint.

    Args:
        text: Input string to embed.

    Returns:
        L2-normalized 384-dim float list.

    Raises:
        httpx.HTTPStatusError: On non-2xx response from the AMD endpoint.
        RuntimeError: If the response body lacks a recognised embedding field.
    """
    request_body = {
        "model": _ENCODER_MODEL,
        "input": text,
    }

    async with httpx.AsyncClient(timeout=_REQUEST_DEADLINE) as session:
        resp = await session.post(
            f"{_COMPUTE_HOST}/embeddings",
            json=request_body,
        )
        resp.raise_for_status()

    body = resp.json()

    # Handle both {"data": [{"embedding": [...]}]} and {"embedding": [...]}
    if "data" in body and body["data"]:
        raw_vec: List[float] = body["data"][0]["embedding"]
    elif "embedding" in body:
        raw_vec = body["embedding"]
    else:
        raise RuntimeError(f"Unrecognised AMD response shape: {list(body.keys())}")

    return _unit_normalize(raw_vec)


def _local_encode(text: str) -> List[float]:
    """Produce an embedding using a locally loaded SentenceTransformer.

    The model is loaded on the first call and cached for the process lifetime.

    Args:
        text: Input string to embed.

    Returns:
        L2-normalized 384-dim float list.
    """
    global _cached_encoder

    if _cached_encoder is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading local SentenceTransformer '%s'.", _ENCODER_MODEL)
        _cached_encoder = SentenceTransformer(_ENCODER_MODEL)

    raw = _cached_encoder.encode(text, normalize_embeddings=False)
    return _unit_normalize(raw.tolist())


def _unit_normalize(vec: List[float]) -> List[float]:
    """Return an L2-normalized copy of ``vec``.

    If the vector's norm is zero (all-zero input), the original vector is
    returned unchanged to avoid division by zero.

    Args:
        vec: Input float list.

    Returns:
        Normalized float list with unit L2 norm.
    """
    magnitude = math.sqrt(sum(x * x for x in vec))
    if magnitude == 0.0:
        return vec
    return [x / magnitude for x in vec]
