"""Knowledge base builder for MemoryVoice ElevenLabs conversational agent.

Converts structured photo memory records into a formatted markdown document
suitable for upload as an ElevenLabs agent knowledge base source.

The builder:
- Groups memories into chronological eras (Childhood, Young Adult, etc.)
- Sorts within each era by date string
- Truncates captions at max_chars for density
- Validates the final document stays under 50 KB (ElevenLabs limit)
- Fetches memories from Firestore via build_from_firestore()
- Is importable standalone — no dependency on the AMD/embedding stack

Usage::

    from ai.knowledge_base.builder import PhotoMemory, build_knowledge_base

    memories = [
        PhotoMemory(
            date="1955-06-12",
            caption="Born in San Jose.",
            era="Childhood (1940s-1960s)",
            photo_url="",
        ),
        PhotoMemory(
            date="1972-08-20",
            caption="Wedding day.",
            era="Family Years (1970s-1990s)",
            photo_url="gs://memoryvoice.appspot.com/wedding.jpg",
        ),
    ]
    doc = build_knowledge_base("Dorothy", memories)
    # Upload doc to ElevenLabs via elevenlabs_service.upload_knowledge_base_document()
"""

from __future__ import annotations

import asyncio
import logging
import textwrap
from dataclasses import dataclass
from typing import Sequence

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Maximum output size in bytes / characters (50 KB guard for ElevenLabs)
_MAX_KB: int = 50
_MAX_CHARS: int = _MAX_KB * 1024  # 51_200 characters

# Mapping from era code (used in Firestore) to human-readable section header.
# Supports both decade codes ("1940s") and life-stage codes ("childhood")
# because _infer_era() in upload.py writes life-stage codes.
ERA_LABELS: dict[str, str] = {
    # decade codes (original design)
    "1940s": "Childhood (1940s-1960s)",
    "1950s": "Childhood (1940s-1960s)",
    "1960s": "Childhood (1940s-1960s)",
    "1970s": "Family Years (1970s-1990s)",
    "1980s": "Family Years (1970s-1990s)",
    "1990s": "Family Years (1970s-1990s)",
    "2000s": "Career & Later Life (2000s-2010s)",
    "2010s": "Career & Later Life (2000s-2010s)",
    "2020s": "Recent Memories (2020s)",
    # life-stage codes written by backend/_infer_era()
    "childhood": "Childhood (1940s-1960s)",
    "young-adult": "Young Adult Years",
    "family": "Family Years (1970s-1990s)",
    "recent": "Recent Memories (2020s)",
    "unknown": "Memories",
}

# Canonical era ordering for document section sorting
_ERA_ORDER: list[str] = [
    "Childhood (1940s-1960s)",
    "Young Adult Years",
    "Family Years (1970s-1990s)",
    "Career & Later Life (2000s-2010s)",
    "Recent Memories (2020s)",
    "Memories",
]


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class PhotoMemory:
    """Immutable record representing a single photo memory.

    Attributes:
        date: ISO-8601 date string (YYYY-MM-DD) or partial (YYYY, YYYY-MM).
              Used for chronological sorting within an era.
        caption: Human-readable description of the photo or event.
        era: Human-readable era label, e.g. "Childhood (1940s-1960s)".
             Use ERA_LABELS[decade_code] to map from Firestore era codes.
        photo_url: Optional Firebase Storage or public URL for the photo.
                   Empty string if not available.
    """

    date: str
    caption: str
    era: str
    photo_url: str = ""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _era_sort_key(era: str) -> tuple[int, str]:
    """Return a sort key that places canonical eras in the defined order.

    Unknown / custom era strings sort after all canonical ones, alphabetically.

    Args:
        era: Era label string.

    Returns:
        Tuple (canonical_index, era) for stable sorting.
    """
    for i, canonical in enumerate(_ERA_ORDER):
        if era == canonical or era.startswith(canonical.split(" ")[0]):
            return (i, era)
    return (len(_ERA_ORDER), era)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def summarize_caption(caption: str, max_chars: int = 200) -> str:
    """Truncate a verbose caption to max_chars, preserving whole words.

    Uses textwrap.shorten which collapses whitespace and appends an ellipsis
    when the text is shortened.

    Args:
        caption: Original caption text (any length).
        max_chars: Target maximum character count (default 200).

    Returns:
        Caption shortened to at most max_chars characters.
    """
    if len(caption) <= max_chars:
        return caption
    return textwrap.shorten(caption, width=max_chars, placeholder="...")


def build_knowledge_base(
    person_name: str,
    memories: Sequence[PhotoMemory],
) -> str:
    """Build a structured markdown knowledge base document for an ElevenLabs agent.

    Groups memories by era section, sorts each section by date, and formats
    them as a markdown document.  The output is capped at 50 KB; if the full
    document exceeds that limit the content is hard-truncated with a note.

    Args:
        person_name: Full name of the person whose memories are documented.
        memories: Sequence of PhotoMemory records to include.

    Returns:
        Formatted markdown string, max 50 KB, ready for ElevenLabs upload.
    """
    if not memories:
        logger.warning(
            "build_knowledge_base called with no memories for '%s'.", person_name
        )
        return f"# {person_name}'s Life Memories\n\nNo memories have been added yet.\n"

    # Group by era label
    by_era: dict[str, list[PhotoMemory]] = {}
    for memory in memories:
        by_era.setdefault(memory.era, []).append(memory)

    # Sort within each era by date (lexicographic is correct for ISO-8601)
    for era_list in by_era.values():
        era_list.sort(key=lambda m: m.date)

    # Sort era sections in canonical order
    sorted_eras = sorted(by_era.keys(), key=_era_sort_key)

    lines: list[str] = [
        f"# {person_name}'s Life Memories",
        "",
        f"This document contains photo memories for {person_name}, "
        "organized chronologically for use by the MemoryVoice voice companion.",
        "",
    ]

    for era in sorted_eras:
        era_memories = by_era[era]
        lines.append(f"## {era}")
        lines.append("")
        for memory in era_memories:
            short_caption = summarize_caption(memory.caption)
            date_label = memory.date if memory.date else "Unknown date"
            lines.append(f"- **{date_label}**: {short_caption}")
        lines.append("")

    document = "\n".join(lines)

    if len(document) > _MAX_CHARS:
        logger.warning(
            "Knowledge base for '%s' is %d chars — truncating to %d chars (%d KB).",
            person_name,
            len(document),
            _MAX_CHARS,
            _MAX_KB,
        )
        cutoff = _MAX_CHARS - 80
        document = (
            document[:cutoff]
            + "\n\n[Additional memories not shown — 50 KB knowledge base size limit reached]"
        )

    logger.info(
        "Built knowledge base for '%s': %d eras, %d memories, %d chars.",
        person_name,
        len(sorted_eras),
        len(memories),
        len(document),
    )
    return document


def validate_knowledge_base(content: str) -> tuple[bool, str]:
    """Validate that a knowledge base document is within ElevenLabs size limits.

    Args:
        content: Markdown string to validate.

    Returns:
        Tuple (is_valid, message):
          - is_valid: True if the document is within the 50 KB limit.
          - message: Human-readable status message.
    """
    size = len(content)
    size_kb = size / 1024.0

    if size == 0:
        return False, "Knowledge base content is empty."

    if size > _MAX_CHARS:
        return (
            False,
            f"Knowledge base is {size_kb:.1f} KB — exceeds the {_MAX_KB} KB ElevenLabs limit. "
            f"Reduce the number of memories or shorten captions.",
        )

    if size_kb > _MAX_KB * 0.9:
        logger.warning(
            "Knowledge base is %.1f KB — approaching the %d KB limit.", size_kb, _MAX_KB
        )
        return (
            True,
            f"Knowledge base is {size_kb:.1f} KB — within limit but approaching "
            f"the {_MAX_KB} KB cap. Consider trimming if more memories will be added.",
        )

    return True, f"Knowledge base is {size_kb:.1f} KB — within the {_MAX_KB} KB limit."


# ---------------------------------------------------------------------------
# Firestore-backed builder
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


def _firestore_photo_to_memory(photo: dict) -> PhotoMemory | None:
    """Convert a Firestore photo map to a PhotoMemory.

    Expected Firestore photo map shape:
        {
            "caption": str,
            "date": str,          # ISO-8601 or partial
            "era": str,           # decade code, e.g. "1980s"
            "photo_url": str,     # optional Firebase Storage URL
        }

    Args:
        photo: Raw Firestore photo map.

    Returns:
        PhotoMemory on success, None if caption is missing/empty.
    """
    caption: str = photo.get("caption", "").strip()
    if not caption:
        return None

    era_code: str = photo.get("era", "unknown")
    human_era: str = ERA_LABELS.get(era_code, era_code)

    return PhotoMemory(
        date=photo.get("date", ""),
        caption=caption,
        era=human_era,
        photo_url=photo.get("photo_url", ""),
    )


async def build_from_firestore(memory_id: str, person_name: str) -> str:
    """Fetch photo memories from Firestore and build the knowledge base document.

    Reads: memories/{memory_id}/photos (subcollection), not the parent document.
    Photos are stored as individual documents in the subcollection by firebase_service.

    Args:
        memory_id: Firestore memory document ID.
        person_name: Full name of the person, used as the document title.

    Returns:
        Formatted markdown knowledge base string (max 50 KB).
    """
    logger.info(
        "build_from_firestore: fetching memories for memory_id=%s, person=%s.",
        memory_id,
        person_name,
    )

    db = _get_firestore_client()
    loop = asyncio.get_running_loop()

    photos_ref = db.collection("memories").document(memory_id).collection("photos")
    photo_docs = await loop.run_in_executor(None, lambda: list(photos_ref.stream()))
    photos: list[dict] = [doc.to_dict() for doc in photo_docs]

    if not photos:
        logger.warning(
            "No photos found in subcollection for memory_id=%s — returning empty knowledge base.",
            memory_id,
        )
        return build_knowledge_base(person_name, [])

    memories: list[PhotoMemory] = []
    for photo in photos:
        memory = _firestore_photo_to_memory(photo)
        if memory is not None:
            memories.append(memory)
        else:
            logger.debug("Skipped photo with empty caption in memory_id=%s.", memory_id)

    logger.info(
        "build_from_firestore: converted %d/%d photos to PhotoMemory for memory_id=%s.",
        len(memories),
        len(photos),
        memory_id,
    )

    document = build_knowledge_base(person_name, memories)
    is_valid, validation_msg = validate_knowledge_base(document)
    log_fn = logger.info if is_valid else logger.warning
    log_fn("Knowledge base validation for memory_id=%s: %s", memory_id, validation_msg)

    return document
