"""Semantic memory graph construction for MemoryVoice.

Builds an undirected similarity graph where:
  - Each MemoryNode represents one photo caption with its embedding.
  - Two nodes are connected by a MemoryEdge when cosine_similarity >= threshold.
  - Community detection groups nodes into era/topic clusters.

With at most 30 nodes the max edge-candidate count is 30*29/2 = 435,
which completes in well under 5 s on a modern CPU.

Environment variables:
    SIMILARITY_THRESHOLD — float, default 0.7.
"""

from __future__ import annotations

import logging
import math
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Sequence

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Era mapping
# ---------------------------------------------------------------------------
ERA_DECADE_MAP: dict[str, str] = {
    "1940": "1940s",
    "1950": "1950s",
    "1960": "1960s",
    "1970": "1970s",
    "1980": "1980s",
    "1990": "1990s",
    "2000": "2000s",
    "2010": "2010s",
    "2020": "2020s",
}

_UNKNOWN_ERA = "unknown"


def get_era_from_date(date_str: str) -> str:
    """Map an ISO-8601 or partial date string to a decade era label.

    Examples:
        "1985-06-15" -> "1980s"
        "2003"       -> "2000s"
        ""           -> "unknown"
        "bad-date"   -> "unknown"

    Args:
        date_str: Date string in ISO-8601 format (YYYY-MM-DD), partial (YYYY),
                  or empty.

    Returns:
        Decade string like "1980s" or "unknown".
    """
    if not date_str:
        return _UNKNOWN_ERA

    # Extract the first 4-digit year found in the string
    match = re.search(r"\b(\d{4})\b", date_str)
    if not match:
        return _UNKNOWN_ERA

    year_str = match.group(1)
    try:
        year = int(year_str)
    except ValueError:
        return _UNKNOWN_ERA

    decade_key = str((year // 10) * 10)
    return ERA_DECADE_MAP.get(decade_key, f"{decade_key}s")


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class MemoryNode:
    """A single photo memory with its semantic embedding.

    Attributes:
        id: Unique identifier, typically "{memory_id}_{caption_index}".
        text: Caption text that was embedded.
        embedding: L2-normalized embedding vector (list[float]).
        date: ISO-8601 date string; may be empty.
        era: Decade string derived from date (e.g. "1980s").
    """

    id: str
    text: str
    embedding: list[float]
    date: str
    era: str


@dataclass(frozen=True)
class MemoryEdge:
    """A directed (logically undirected) similarity edge between two memory nodes.

    source_id is always the node with the lower list-index to avoid duplicates.

    Attributes:
        source_id: ID of the first node.
        target_id: ID of the second node.
        similarity: Cosine similarity in [0, 1], rounded to 4 decimal places.
    """

    source_id: str
    target_id: str
    similarity: float


# ---------------------------------------------------------------------------
# Core math
# ---------------------------------------------------------------------------
def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two float vectors in pure Python.

    If either vector has zero magnitude, returns 0.0 to avoid division by zero.

    Args:
        a: First embedding vector.
        b: Second embedding vector.

    Returns:
        Cosine similarity in [-1, 1] (typically [0, 1] for sentence embeddings).
    """
    if len(a) != len(b):
        raise ValueError(
            f"Embedding dimension mismatch: {len(a)} vs {len(b)}"
        )

    dot: float = sum(x * y for x, y in zip(a, b))
    norm_a: float = math.sqrt(sum(x * x for x in a))
    norm_b: float = math.sqrt(sum(x * x for x in b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# Graph builder
# ---------------------------------------------------------------------------
def build_semantic_graph(
    nodes: Sequence[MemoryNode],
    threshold: float | None = None,
) -> list[MemoryEdge]:
    """Build an undirected semantic graph from a list of memory nodes.

    Iterates over all unique (i, j) pairs with i < j and adds an edge when
    cosine_similarity(nodes[i].embedding, nodes[j].embedding) >= threshold.

    With 30 nodes this is at most 435 comparisons — always < 5 s on CPU.

    Args:
        nodes: Sequence of MemoryNode objects with pre-computed embeddings.
        threshold: Minimum cosine similarity to create an edge.
                   Defaults to SIMILARITY_THRESHOLD env var (default 0.7).

    Returns:
        List of MemoryEdge objects, sorted by descending similarity.
    """
    if threshold is None:
        threshold = float(os.environ.get("SIMILARITY_THRESHOLD", "0.7"))

    node_list = list(nodes)
    n = len(node_list)
    edges: list[MemoryEdge] = []

    logger.info(
        "Building semantic graph: %d nodes, threshold=%.2f, max_comparisons=%d.",
        n,
        threshold,
        n * (n - 1) // 2,
    )

    for i in range(n):
        for j in range(i + 1, n):
            sim = cosine_similarity(node_list[i].embedding, node_list[j].embedding)
            if sim >= threshold:
                edges.append(
                    MemoryEdge(
                        source_id=node_list[i].id,
                        target_id=node_list[j].id,
                        similarity=round(sim, 4),
                    )
                )

    edges.sort(key=lambda e: e.similarity, reverse=True)
    logger.info("Semantic graph built: %d edges above threshold %.2f.", len(edges), threshold)
    return edges


# ---------------------------------------------------------------------------
# Community detection (union-find based clustering)
# ---------------------------------------------------------------------------
def _make_union_find(node_ids: list[str]) -> dict[str, str]:
    """Initialise union-find parent map with each node as its own root."""
    return {nid: nid for nid in node_ids}


def _find(parent: dict[str, str], nid: str) -> str:
    """Path-compressed find operation for union-find."""
    while parent[nid] != nid:
        parent[nid] = parent[parent[nid]]  # path compression
        nid = parent[nid]
    return nid


def _union(parent: dict[str, str], a: str, b: str) -> None:
    """Union two sets in the union-find structure."""
    root_a = _find(parent, a)
    root_b = _find(parent, b)
    if root_a != root_b:
        parent[root_b] = root_a


def find_memory_clusters(
    nodes: Sequence[MemoryNode],
    edges: Sequence[MemoryEdge],
) -> dict[str, list[str]]:
    """Detect communities in the semantic graph via union-find.

    All nodes connected (directly or transitively) by edges above the graph
    threshold are grouped into the same cluster.  Isolated nodes form their
    own single-node cluster, labelled by their era if available.

    Args:
        nodes: All MemoryNode objects in the graph.
        edges: MemoryEdge list produced by build_semantic_graph.

    Returns:
        Dictionary mapping cluster label -> list of node IDs.
        Labels are derived from the era of the cluster's first node, e.g.
        "cluster_1980s_0" or "cluster_unknown_2".
    """
    node_list = list(nodes)
    node_ids = [n.id for n in node_list]
    id_to_node: dict[str, MemoryNode] = {n.id: n for n in node_list}

    parent = _make_union_find(node_ids)

    for edge in edges:
        if edge.source_id in parent and edge.target_id in parent:
            _union(parent, edge.source_id, edge.target_id)

    # Group node IDs by their root
    root_to_members: dict[str, list[str]] = defaultdict(list)
    for nid in node_ids:
        root = _find(parent, nid)
        root_to_members[root].append(nid)

    # Produce human-readable cluster labels
    clusters: dict[str, list[str]] = {}
    era_counter: dict[str, int] = defaultdict(int)

    for root, members in root_to_members.items():
        # Label by era of the root node (or first member)
        era = id_to_node[root].era if root in id_to_node else _UNKNOWN_ERA
        idx = era_counter[era]
        era_counter[era] += 1
        label = f"cluster_{era}_{idx}"
        clusters[label] = members

    logger.info(
        "Community detection complete: %d clusters from %d nodes.",
        len(clusters),
        len(node_ids),
    )
    return clusters
