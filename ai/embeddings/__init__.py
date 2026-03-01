"""Embeddings sub-package for MemoryBridge.

Public surface:
    generate   — AMD MI300X / CPU-fallback embedding pipeline
    semantic_graph — cosine-similarity graph builder & community detection
    retrieval  — top-k similarity search and Firestore-backed text search
"""

from .generate import (
    EmbeddingResult,
    generate_embedding,
    generate_embedding_local,
    generate_embedding_with_timing,
    batch_generate_embeddings,
    process_memory_embeddings,
)
from .semantic_graph import (
    MemoryNode,
    MemoryEdge,
    cosine_similarity,
    build_semantic_graph,
    find_memory_clusters,
    get_era_from_date,
)
from .retrieval import (
    RetrievalResult,
    retrieve_top_k,
    search_memories_by_text,
    format_retrieval_results,
)

__all__ = [
    # generate
    "EmbeddingResult",
    "generate_embedding",
    "generate_embedding_local",
    "generate_embedding_with_timing",
    "batch_generate_embeddings",
    "process_memory_embeddings",
    # semantic_graph
    "MemoryNode",
    "MemoryEdge",
    "cosine_similarity",
    "build_semantic_graph",
    "find_memory_clusters",
    "get_era_from_date",
    # retrieval
    "RetrievalResult",
    "retrieve_top_k",
    "search_memories_by_text",
    "format_retrieval_results",
]
