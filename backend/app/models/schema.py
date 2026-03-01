"""Domain schema definitions for the archive service."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True)
class ImageRecord:
    """Immutable descriptor for a single uploaded photograph."""

    asset_id: str
    url: str
    annotation: str
    captured: str
    phase: str
    vector: Optional[List[float]] = None


@dataclass(frozen=True)
class VaultEntry:
    """Immutable representation of one person's complete memory archive."""

    entry_id: str
    subject_name: str
    registered_at: str
    state: str
    voice_token: Optional[str] = None
    images: List[ImageRecord] = field(default_factory=list)
    vectors_complete: bool = False

    def serialize(self) -> dict:
        """Return a JSON-compatible dict representation of this entry."""
        return {
            "id": self.entry_id,
            "subject_name": self.subject_name,
            "registered_at": self.registered_at,
            "state": self.state,
            "voice_token": self.voice_token,
            "vectors_complete": self.vectors_complete,
            "images": [
                {
                    "asset_id": img.asset_id,
                    "url": img.url,
                    "annotation": img.annotation,
                    "captured": img.captured,
                    "phase": img.phase,
                    "vector": img.vector,
                }
                for img in self.images
            ],
        }


@dataclass(frozen=True)
class IngestPayload:
    """Validated representation of a multipart submission from a client."""

    subject_name: str
    annotations: List[str]
    photo_filenames: List[str]
    audio_filename: str
