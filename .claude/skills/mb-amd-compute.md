# Skill: AMD Developer Cloud + Embeddings for MemoryBridge

## AMD Developer Cloud Setup
```
1. Apply: https://devcloud.amd.com → "Request Access" (3 business days — apply Feb 17)
2. Once approved: Login → Instances → Launch MI300X instance
3. Note your AMD_ENDPOINT and AMD_API_KEY
4. Hello world test: run vLLM inference or sentence-transformers via HTTP API
```

## AMD vLLM Hello World (via SSH on AMD instance)
```bash
# On AMD MI300X instance
pip install vllm
python -c "
from vllm import LLM, SamplingParams
llm = LLM(model='sentence-transformers/all-MiniLM-L6-v2')
print('AMD GPU inference working')
"
```

## AMD Embeddings HTTP Endpoint Pattern
```python
# AMD Developer Cloud uses OpenAI-compatible API
import httpx
import os

AMD_API_KEY = os.environ["AMD_API_KEY"]
AMD_ENDPOINT = os.environ["AMD_ENDPOINT"]  # e.g. https://api.cloud.amd.com/v1

async def generate_embedding_amd(text: str) -> list[float]:
    """Generate embedding using AMD MI300X via OpenAI-compatible API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AMD_ENDPOINT}/embeddings",
            headers={
                "Authorization": f"Bearer {AMD_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "input": text,
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "encoding_format": "float",
            }
        )
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]
```

## Local CPU Fallback (if AMD not available)
```python
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)
_model: SentenceTransformer | None = None

def get_local_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model

def generate_embedding_local(text: str) -> list[float]:
    """CPU fallback for when AMD Cloud is unavailable."""
    logger.warning("Using CPU fallback for embeddings (AMD not available)")
    return get_local_model().encode(text).tolist()
```

## Unified Embedding Function (with fallback)
```python
import os
import asyncio

USE_AMD = bool(os.environ.get("AMD_ENDPOINT"))

async def generate_embedding(text: str) -> list[float]:
    """Generate embedding — AMD GPU if available, CPU otherwise."""
    if USE_AMD:
        try:
            return await generate_embedding_amd(text)
        except (httpx.TimeoutException, httpx.HTTPError) as e:
            logger.warning("AMD timeout (%s), falling back to CPU", e)
            return generate_embedding_local(text)
    else:
        return generate_embedding_local(text)
```

## Batch Embedding (efficient for 30 photos)
```python
async def batch_embed(texts: list[str]) -> list[list[float]]:
    """Embed all texts — sequential to avoid rate limits."""
    embeddings = []
    for text in texts:
        emb = await generate_embedding(text)
        embeddings.append(emb)
        await asyncio.sleep(0.1)  # gentle rate limiting
    return embeddings
```

## Timing Logger (for AMD prize — show performance data)
```python
import time

async def generate_embedding_timed(text: str) -> tuple[list[float], float]:
    """Returns embedding + latency in milliseconds."""
    start = time.perf_counter()
    embedding = await generate_embedding(text)
    latency_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "Embedding: %.1fms | backend=%s | dims=%d | text='%s...'",
        latency_ms,
        "AMD-MI300X" if USE_AMD else "CPU",
        len(embedding),
        text[:50]
    )
    return embedding, latency_ms
```

## Cosine Similarity (pure Python — no numpy needed for 30 photos)
```python
import math

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two embedding vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
```

## Memory Graph Edge Building
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class MemoryEdge:
    source_id: str
    target_id: str
    similarity: float
    connection_type: str  # "temporal" | "topical" | "emotional"

def build_memory_graph(
    ids: list[str],
    embeddings: list[list[float]],
    threshold: float = 0.7
) -> list[MemoryEdge]:
    edges = []
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sim = cosine_similarity(embeddings[i], embeddings[j])
            if sim >= threshold:
                edges.append(MemoryEdge(
                    source_id=ids[i],
                    target_id=ids[j],
                    similarity=round(sim, 4),
                    connection_type="topical"
                ))
    return edges
```

## AMD Demo Evidence (for prize judges)
```python
# Generate performance report showing AMD impact
def generate_amd_performance_report(latencies_ms: list[float]) -> dict:
    return {
        "backend": "AMD Instinct MI300X" if USE_AMD else "CPU",
        "total_embeddings": len(latencies_ms),
        "avg_latency_ms": sum(latencies_ms) / len(latencies_ms),
        "total_time_ms": sum(latencies_ms),
        "model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dims": 384,
    }
# Log this report in your Devpost: "AMD MI300X generated 25 embeddings in Xms"
```

## install requirements
```bash
pip install sentence-transformers numpy httpx
# For AMD ROCm on AMD instance:
pip install torch --extra-index-url https://download.pytorch.org/whl/rocm6.0
```

## Key Rules
- Apply for AMD account TODAY (Feb 17) — 3 business day approval
- Test AMD endpoint before Feb 25 dry run
- Always implement CPU fallback — demo cannot break if AMD is slow
- Log AMD timing data — use it as evidence in Devpost ("25 embeddings in 1.2s on MI300X")
- Normalize embeddings before cosine similarity for accuracy
- Never use numpy in Firestore — convert to list[float] first
