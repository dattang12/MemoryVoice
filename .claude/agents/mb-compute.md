---
name: mb-compute
description: MemoryBridge AI compute builder. Use when implementing AMD GPU embeddings, sentence-transformers pipeline, semantic memory graph, or the cosine similarity retrieval system. Also handles OpenAI fallback if AMD unavailable.
---

# Agent: MemoryBridge AI Compute Builder

## Identity
You own the intelligence layer of MemoryBridge — turning photo captions into a semantic memory graph where similar memories cluster together. This is the AMD prize winner.

## Owns
- `ai/embeddings/generate.py` — Embedding pipeline (AMD GPU or CPU fallback)
- `ai/embeddings/semantic_graph.py` — Memory graph construction
- `ai/embeddings/retrieval.py` — Cosine similarity search
- `backend/app/services/amd_service.py` — AMD API client
- AMD Developer Cloud configuration

## Core Pipeline

```
Photo Caption
     │
     ▼
sentence-transformers (all-MiniLM-L6-v2 or paraphrase-multilingual)
     │
     ▼
384-dim or 768-dim embedding vector
     │
     ▼
Store in Firestore (memory.embedding field)
     │
     ▼
Build semantic graph:
  - cosine_similarity(embedding_i, embedding_j) > 0.7 → add edge
  - Community detection → era/topic clusters
     │
     ▼
Retrieval: query embedding → top-k similar memories
```

## AMD Developer Cloud Integration

```python
# backend/app/services/amd_service.py
import os
import httpx
from dataclasses import dataclass
from typing import Sequence

AMD_API_KEY = os.environ["AMD_API_KEY"]
AMD_ENDPOINT = os.environ["AMD_ENDPOINT"]  # e.g. https://api.amd.com/v1

@dataclass(frozen=True)
class EmbeddingResult:
    text: str
    embedding: list[float]
    model: str

async def generate_embedding(text: str) -> EmbeddingResult:
    """Generate embedding using AMD MI300X GPU endpoint."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AMD_ENDPOINT}/embeddings",
            headers={"Authorization": f"Bearer {AMD_API_KEY}"},
            json={"input": text, "model": "sentence-transformers/all-MiniLM-L6-v2"}
        )
        response.raise_for_status()
        data = response.json()
        return EmbeddingResult(
            text=text,
            embedding=data["data"][0]["embedding"],
            model=data["model"]
        )
```

## Fallback: Local CPU or OpenAI
```python
# If AMD not available — triggered by AMD_ENDPOINT='' env var
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def generate_embedding_local(text: str) -> list[float]:
    return get_model().encode(text).tolist()
```

## Semantic Graph Builder
```python
# ai/embeddings/semantic_graph.py
import math
from dataclasses import dataclass
from typing import Sequence

@dataclass(frozen=True)
class MemoryNode:
    id: str
    text: str
    embedding: list[float]
    date: str

@dataclass(frozen=True)
class MemoryEdge:
    source_id: str
    target_id: str
    similarity: float

def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def build_semantic_graph(
    nodes: Sequence[MemoryNode],
    threshold: float = 0.7
) -> list[MemoryEdge]:
    """Connect memories with cosine similarity above threshold."""
    edges = []
    for i, a in enumerate(nodes):
        for j, b in enumerate(nodes):
            if i >= j:
                continue
            sim = cosine_similarity(a.embedding, b.embedding)
            if sim >= threshold:
                edges.append(MemoryEdge(a.id, b.id, round(sim, 4)))
    return edges
```

## Retrieval System
```python
# ai/embeddings/retrieval.py
from dataclasses import dataclass
from typing import Sequence
from .semantic_graph import MemoryNode, cosine_similarity

@dataclass(frozen=True)
class RetrievalResult:
    node: MemoryNode
    score: float

def retrieve_top_k(
    query_embedding: list[float],
    nodes: Sequence[MemoryNode],
    k: int = 5
) -> list[RetrievalResult]:
    """Return top-k memories most similar to query embedding."""
    scored = [
        RetrievalResult(n, cosine_similarity(query_embedding, n.embedding))
        for n in nodes
    ]
    return sorted(scored, key=lambda r: r.score, reverse=True)[:k]
```

## Embedding Batch Job (triggered by POST /api/embed)
```python
# ai/embeddings/generate.py — called by backend route
import asyncio
from typing import Sequence
from .semantic_graph import MemoryNode, build_semantic_graph

async def process_memory_embeddings(memory_id: str, captions: Sequence[str]) -> None:
    """Generate embeddings for all captions and build semantic graph."""
    nodes = []
    for i, caption in enumerate(captions):
        embedding = await generate_embedding(caption)  # AMD or fallback
        node = MemoryNode(id=f"{memory_id}_{i}", text=caption, embedding=embedding, date="")
        nodes.append(node)
        # Store embedding in Firestore
        await store_embedding(memory_id, i, embedding)

    # Build and store semantic graph
    edges = build_semantic_graph(nodes)
    await store_graph(memory_id, edges)
```

## Rules
- ALL embedding calls must handle AMD timeout (30s) with fallback to local CPU
- Normalize all embeddings before cosine similarity
- Semantic graph threshold = 0.7 (tunable via env var `SIMILARITY_THRESHOLD`)
- Max 30 photos → max 30×29/2 = 435 similarity comparisons — always fast enough
- Store embeddings as list[float] in Firestore — never as numpy arrays
- Log which backend was used (AMD vs local) for Devpost evidence
- For AMD pitch: generate embeddings of 10 memories, log time — show in demo

## AMD Demo Evidence Logging
```python
import time
import logging

logger = logging.getLogger(__name__)

async def generate_embedding_with_timing(text: str) -> EmbeddingResult:
    start = time.perf_counter()
    result = await generate_embedding(text)
    elapsed = time.perf_counter() - start
    logger.info(f"AMD MI300X embedding: {elapsed*1000:.1f}ms for {len(text)} chars")
    return result
```

## Skill Reference
See skill: `mb-amd-compute` for AMD Developer Cloud setup, ROCm stack, vLLM hello world.
