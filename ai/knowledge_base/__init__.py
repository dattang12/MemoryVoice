"""Knowledge-base sub-package for MemoryBridge.

Builds structured markdown strings from Firestore photo memories for use
as ElevenLabs conversational context.

Public surface:
    builder — PhotoMemory, ERA_LABELS, build_knowledge_base,
               validate_knowledge_base, summarize_caption, build_from_firestore
"""

from .builder import (
    PhotoMemory,
    ERA_LABELS,
    build_knowledge_base,
    validate_knowledge_base,
    summarize_caption,
    build_from_firestore,
)

__all__ = [
    "PhotoMemory",
    "ERA_LABELS",
    "build_knowledge_base",
    "validate_knowledge_base",
    "summarize_caption",
    "build_from_firestore",
]
