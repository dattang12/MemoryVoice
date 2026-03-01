"""Pytest configuration and shared fixtures for the archive service test suite.

Fixtures provided:
    server_app      — Flask test application (cloud services mocked)
    http_client     — Flask test client
    sample_jpeg     — Minimal valid JPEG bytes
    sample_png      — Minimal valid PNG bytes
    sample_wav      — Minimal valid WAV bytes
    mock_cloud      — Auto-used fixture that stubs out all cloud service calls
"""

from __future__ import annotations

import io
import os
import struct
import uuid
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Environment setup — applied before any application import
# ---------------------------------------------------------------------------

os.environ.setdefault("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccount.json")
os.environ.setdefault("FIREBASE_STORAGE_BUCKET", "test-bucket.appspot.com")
os.environ.setdefault("ELEVENLABS_API_KEY", "test-elevenlabs-key")
os.environ.setdefault("AMD_API_KEY", "test-amd-key")
os.environ.setdefault("AMD_ENDPOINT", "https://api.amd.test/v1")
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("FLASK_SECRET_KEY", "test-secret-key-for-ci")


# ---------------------------------------------------------------------------
# Binary sample fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def sample_jpeg() -> bytes:
    """Return a minimal valid JPEG (1x1 white pixel) as bytes.

    Hardcoded binary so tests carry no file-system dependency.

    Returns:
        Valid JPEG bytes.
    """
    return bytes(
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
        b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
        b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
        b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\x1e"
        b"hj}~\x82\x88\x9a\xa4\xb5\xb5\xb5\xff\xc0\x00\x0b\x08\x00\x01"
        b"\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01"
        b"\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02"
        b"\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02"
        b"\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02"
        b"\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07\"q\x142\x81\x91\xa1"
        b"\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a"
        b"%&'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz"
        b"\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98"
        b"\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5"
        b"\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2"
        b"\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7"
        b"\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda"
        b"\x00\x08\x01\x01\x00\x00?\x00\xfb\xff\xd9"
    )


@pytest.fixture(scope="session")
def sample_png() -> bytes:
    """Return a minimal valid 1x1 red-pixel PNG as bytes.

    Constructed programmatically; no file-system dependency.

    Returns:
        Valid PNG bytes.
    """
    import zlib

    def _segment(tag: bytes, body: bytes) -> bytes:
        length = struct.pack(">I", len(body))
        crc = struct.pack(">I", zlib.crc32(tag + body) & 0xFFFFFFFF)
        return length + tag + body + crc

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_body = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    ihdr = _segment(b"IHDR", ihdr_body)
    pixel = b"\x00\xff\x00\x00"
    idat = _segment(b"IDAT", zlib.compress(pixel))
    iend = _segment(b"IEND", b"")
    return sig + ihdr + idat + iend


@pytest.fixture(scope="session")
def sample_wav() -> bytes:
    """Return a minimal valid WAV (44-byte header, 1 sample of silence) as bytes.

    Returns:
        Valid WAV bytes (PCM 16-bit, mono, 44100 Hz).
    """
    rate = 44100
    channels = 1
    depth = 16
    num_samples = 1
    chunk_size = num_samples * channels * (depth // 8)
    byte_rate = rate * channels * (depth // 8)
    block_align = channels * (depth // 8)

    hdr = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + chunk_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        channels,
        rate,
        byte_rate,
        block_align,
        depth,
        b"data",
        chunk_size,
    )
    return hdr + b"\x00\x00" * num_samples


@pytest.fixture(scope="session")
def sample_mp3() -> bytes:
    """Return minimal MP3-like bytes sufficient for extension and size checks.

    Returns:
        Bytes that pass upload validation (ID3 header + minimal frame).
    """
    return b"ID3" + b"\x00" * 7 + b"\xff\xfb\x90\x00" + b"\x00" * 200


# ---------------------------------------------------------------------------
# Cloud service mock
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_cloud() -> Generator[MagicMock, None, None]:
    """Stub out all Firebase Admin SDK and cloud_store calls.

    Patches:
        firebase_admin.initialize_app
        firebase_admin.get_app
        cloud_store._acquire_cloud_client
        cloud_store.push_asset_to_cloud
        cloud_store.persist_entry
        cloud_store.retrieve_entry
        cloud_store.fetch_image_assets
        cloud_store.store_vector
        cloud_store.set_entry_state
        cloud_store.bind_voice_token
        cloud_store.query_entries

    Yields:
        A MagicMock instance for assertion in individual tests.
    """
    stub = MagicMock()

    stub.push_asset_to_cloud.return_value = "https://storage.test/photo.jpg"
    stub.persist_entry.return_value = None
    stub.retrieve_entry.return_value = _default_entry_doc()
    stub.fetch_image_assets.return_value = _default_image_list()
    stub.store_vector.return_value = None
    stub.set_entry_state.return_value = None
    stub.bind_voice_token.return_value = None
    stub.query_entries.return_value = [_default_entry_doc()]

    with (
        patch("firebase_admin.initialize_app", return_value=MagicMock()),
        patch("firebase_admin.get_app", side_effect=ValueError("no app")),
        patch(
            "app.services.cloud_store._acquire_cloud_client",
            return_value=MagicMock(),
        ),
        patch(
            "app.services.cloud_store.push_asset_to_cloud",
            side_effect=stub.push_asset_to_cloud,
        ),
        patch(
            "app.services.cloud_store.persist_entry",
            side_effect=stub.persist_entry,
        ),
        patch(
            "app.services.cloud_store.retrieve_entry",
            side_effect=stub.retrieve_entry,
        ),
        patch(
            "app.services.cloud_store.fetch_image_assets",
            side_effect=stub.fetch_image_assets,
        ),
        patch(
            "app.services.cloud_store.store_vector",
            side_effect=stub.store_vector,
        ),
        patch(
            "app.services.cloud_store.set_entry_state",
            side_effect=stub.set_entry_state,
        ),
        patch(
            "app.services.cloud_store.bind_voice_token",
            side_effect=stub.bind_voice_token,
        ),
        patch(
            "app.services.cloud_store.query_entries",
            side_effect=stub.query_entries,
        ),
    ):
        yield stub


# ---------------------------------------------------------------------------
# Flask application fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def server_app(mock_cloud: MagicMock):
    """Create a Flask test application with cloud services fully mocked.

    Args:
        mock_cloud: Injected cloud mock fixture.

    Returns:
        Configured Flask app in testing mode.
    """
    from app import build_server

    flask_app = build_server()
    flask_app.config["TESTING"] = True
    flask_app.config["WTF_CSRF_ENABLED"] = False
    return flask_app


# Keep 'app' alias so pytest auto-discovery finds the fixture by the
# conventional name used in some test files.
@pytest.fixture
def app(mock_cloud: MagicMock):
    from app import build_server

    flask_app = build_server()
    flask_app.config["TESTING"] = True
    flask_app.config["WTF_CSRF_ENABLED"] = False
    return flask_app


@pytest.fixture
def http_client(server_app):
    """Return a Flask test client bound to ``server_app``.

    Args:
        server_app: Flask application fixture.

    Returns:
        Flask test client instance.
    """
    return server_app.test_client()


@pytest.fixture
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# Default document builders
# ---------------------------------------------------------------------------


def _default_entry_doc() -> dict:
    """Build a realistic Firestore entry document for mock defaults."""
    return {
        "id": str(uuid.uuid4()),
        "subject_name": "Margaret Chen",
        "registered_at": "2026-02-22T10:00:00+00:00",
        "state": "processing",
        "voice_token": None,
        "vectors_complete": False,
        "images": _default_image_list(),
        # Frontend-compatible aliases
        "person_name": "Margaret Chen",
        "created_at": "2026-02-22T10:00:00+00:00",
        "status": "processing",
        "voice_id": None,
        "embedding_ready": False,
        "photos": _default_image_list(),
    }


def _default_image_list() -> list[dict]:
    """Build a minimal image list for mock defaults."""
    return [
        {
            "asset_id": str(uuid.uuid4()),
            "photo_id": str(uuid.uuid4()),
            "url": "https://storage.test/photo_0.jpg",
            "annotation": "At the beach, 1965",
            "caption": "At the beach, 1965",
            "captured": "1965",
            "date": "1965",
            "phase": "childhood",
            "era": "childhood",
            "vector": None,
            "embedding": None,
        }
    ]
