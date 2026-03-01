"""Retrieval system for MemoryVoice semantic memory search.

Provides:
  - retrieve_top_k    — pure in-memory cosine similarity ranking.
  - search_memories_by_text — Firestore-backed end-to-end text query.
  - format_retrieval_results — converts results to a string for ElevenLabs.

All embedding comparisons use the cosine_similarity function from
semantic_graph to keep the math in one place.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Sequence

from .semantic_graph import MemoryNode, cosine_similarity

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class RetrievalResult:
    """A single ranked retrieval hit.

    Attributes:
        node: The matching MemoryNode.
        score: Cosine similarity score in [0, 1].
    """

    node: MemoryNode
    score: float


# ---------------------------------------------------------------------------
# In-memory top-k retrieval
# ---------------------------------------------------------------------------
def retrieve_top_k(
    query_embedding: list[float],
    nodes: Sequence[MemoryNode],
    k: int = 5,
) -> list[RetrievalResult]:
    """Return the k MemoryNodes most similar to query_embedding.

    Scores all nodes with cosine similarity, then returns the top-k sorted
    descending by score.  Ties are broken by node.id (alphabetical) for
    deterministic output.

    Args:
        query_embedding: L2-normalized embedding vector for the query.
        nodes: Candidate MemoryNode objects to rank.
        k: Number of results to return (default 5).

    Returns:
        List of RetrievalResult, length <= min(k, len(nodes)),
        sorted by descending score.
    """
    if not nodes:
        logger.debug("retrieve_top_k called with empty node list.")
        return []

    scored: list[RetrievalResult] = [
        RetrievalResult(node=n, score=cosine_similarity(query_embedding, n.embedding))
        for n in nodes
    ]
    # Sort: primary=score desc, secondary=node.id asc (deterministic tie-break)
    scored.sort(key=lambda r: (-r.score, r.node.id))

    top_k = scored[:k]
    logger.debug(
        "retrieve_top_k: query matched %d/%d nodes; returning top %d (best=%.4f).",
        len(scored),
        len(nodes),
        len(top_k),
        top_k[0].score if top_k else 0.0,
    )
    return top_k


# ---------------------------------------------------------------------------
# Firestore helpers
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


async def _load_nodes_from_firestore(memory_id: str) -> list[MemoryNode]:
    """Fetch all stored embeddings for a memory and reconstruct MemoryNodes.

    Reads from: memories/{memory_id}/embeddings/{0..N}

    Args:
        memory_id: Firestore memory document ID.

    Returns:
        List of MemoryNode objects, ordered by caption_index.
    """
    db = _get_firestore_client()
    embed_col = (
        db.collection("memories").document(memory_id).collection("embeddings")
    )

    # Blocking Firestore call — run in thread pool
    docs = await asyncio.get_event_loop().run_in_executor(
        None, lambda: list(embed_col.stream())
    )

    nodes: list[MemoryNode] = []
    for doc in docs:
        data: dict = doc.to_dict() or {}
        embedding: list[float] = data.get("embedding", [])
        if not embedding:
            logger.warning("Empty embedding in doc %s — skipping.", doc.id)
            continue

        caption: str = data.get("caption", "")
        caption_index: int = int(data.get("caption_index", 0))
        node = MemoryNode(
            id=f"{memory_id}_{caption_index}",
            text=caption,
            embedding=embedding,
            date="",
            era="unknown",
        )
        nodes.append(node)

    # Sort by caption_index for stable ordering
    nodes.sort(key=lambda n: int(n.id.rsplit("_", 1)[-1]))
    logger.info(
        "Loaded %d nodes from Firestore for memory=%s.", len(nodes), memory_id
    )
    return nodes


# ---------------------------------------------------------------------------
# End-to-end text search (Firestore-backed)
# ---------------------------------------------------------------------------
async def search_memories_by_text(
    query_text: str,
    memory_id: str,
    k: int = 5,
) -> list[RetrievalResult]:
    """Search a memory's photo captions by natural-language query.

    Steps:
      1. Load all stored embeddings from Firestore.
      2. Generate an embedding for query_text (AMD or CPU fallback).
      3. Run retrieve_top_k against the stored nodes.

    Args:
        query_text: Natural-language search query (e.g. "birthday party").
        memory_id: Firestore memory document ID.
        k: Number of results to return.

    Returns:
        Top-k RetrievalResult objects sorted by descending similarity.
    """
    # Import here to avoid a circular dependency at module load time
    from .generate import generate_embedding_with_timing  # noqa: PLC0415

    logger.info(
        "search_memories_by_text: query=%r, memory=%s, k=%d.",
        query_text,
        memory_id,
        k,
    )

    # 1. Load stored nodes
    nodes = await _load_nodes_from_firestore(memory_id)
    if not nodes:
        logger.warning(
            "No embeddings found for memory=%s — returning empty results.",
            memory_id,
        )
        return []

    # 2. Embed the query
    query_result = await generate_embedding_with_timing(query_text)
    query_embedding = query_result.embedding

    # 3. Rank and return
    results = retrieve_top_k(query_embedding, nodes, k=k)
    logger.info(
        "search_memories_by_text: returning %d results for query=%r.",
        len(results),
        query_text,
    )
    return results


# ---------------------------------------------------------------------------
# Formatting for ElevenLabs
# ---------------------------------------------------------------------------
def format_retrieval_results(results: Sequence[RetrievalResult]) -> str:
    """Convert retrieval results to a context string for ElevenLabs TTS.

    Each result is rendered as a numbered line with the similarity score
    and caption, ready to be injected into a system prompt or spoken context.

    Example output:
        Relevant memories (most similar first):
        1. [score=0.92] "Birthday party at the old house on Elm Street."
        2. [score=0.87] "Grandma blowing out candles, everyone laughing."

    Args:
        results: Ordered list of RetrievalResult (descending score assumed).

    Returns:
        Formatted multi-line string, or a fallback message if results is empty.
    """
    if not results:
        return "No matching memories found."

    lines: list[str] = ["Relevant memories (most similar first):"]
    for idx, result in enumerate(results, start=1):
        score_str = f"{result.score:.4f}"
        caption = result.node.text.strip()
        # Guard against excessively long captions in the spoken context
        if len(caption) > 200:
            caption = caption[:197] + "..."
        lines.append(f'{idx}. [score={score_str}] "{caption}"')

    return "\n".join(lines)
