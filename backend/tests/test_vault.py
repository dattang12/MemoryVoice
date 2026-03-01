"""Unit tests for GET /api/memories/:id and GET /api/memories endpoints.

Coverage:
    - Existing entry returns 200 with complete structure
    - Non-existent entry returns 404
    - Cloud service exception returns 500
    - vectors_complete flag reflects embedding state
    - Entry with no images returns 200 with empty photos list
    - List endpoint returns 200 with memories array
    - Invalid pagination params return 400
    - Service error on list returns 500
"""

from __future__ import annotations

import uuid
from unittest.mock import patch


# ---------------------------------------------------------------------------
# GET /api/memories/:id
# ---------------------------------------------------------------------------


def test_fetch_existing_entry_returns_200(client, mock_cloud) -> None:
    """An existing entry must return 200 with correct JSON structure."""
    entry_id = str(uuid.uuid4())
    doc = {
        "id": entry_id,
        "subject_name": "Margaret Chen",
        "registered_at": "2026-02-22T10:00:00+00:00",
        "state": "ready",
        "voice_token": "el_voice_abc123",
        "vectors_complete": True,
        "companion_id": "agent_xyz",
        "context_ref": "kb_ref_001",
        "images": [
            {
                "asset_id": str(uuid.uuid4()),
                "url": "https://storage.test/photo.jpg",
                "annotation": "Family reunion 1985",
                "captured": "1985",
                "phase": "family",
                "vector": [0.1] * 1024,
            }
        ],
    }
    mock_cloud.retrieve_entry.return_value = doc

    resp = client.get(f"/api/memories/{entry_id}")

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["id"] == entry_id
    assert body["person_name"] == "Margaret Chen"
    assert body["status"] == "ready"
    assert body["voice_id"] == "el_voice_abc123"
    assert body["embedding_ready"] is True
    assert len(body["photos"]) == 1
    assert len(body["photos"][0]["embedding"]) == 1024


def test_fetch_missing_entry_returns_404(client, mock_cloud) -> None:
    """A non-existent entry must return 404."""
    mock_cloud.retrieve_entry.return_value = None

    resp = client.get(f"/api/memories/{uuid.uuid4()}")

    assert resp.status_code == 404
    body = resp.get_json()
    assert body["error"] == "not found"


def test_cloud_error_on_fetch_returns_500(client, mock_cloud) -> None:
    """A cloud service exception during retrieval must return 500."""
    mock_cloud.retrieve_entry.side_effect = Exception("Firestore unavailable")

    resp = client.get(f"/api/memories/{uuid.uuid4()}")

    assert resp.status_code == 500
    body = resp.get_json()
    assert body["error"] == "server_error"
    assert "Firestore unavailable" not in body.get("detail", "")


def test_entry_without_vectors_has_embedding_ready_false(client, mock_cloud) -> None:
    """Entry whose images lack vectors must report embedding_ready=False."""
    entry_id = str(uuid.uuid4())
    mock_cloud.retrieve_entry.return_value = {
        "id": entry_id,
        "subject_name": "John",
        "registered_at": "2026-02-22T10:00:00+00:00",
        "state": "processing",
        "voice_token": None,
        "vectors_complete": False,
        "images": [
            {
                "asset_id": str(uuid.uuid4()),
                "url": "https://storage.test/photo.jpg",
                "annotation": "Old photo",
                "captured": "1970",
                "phase": "childhood",
                "vector": None,
            }
        ],
    }

    resp = client.get(f"/api/memories/{entry_id}")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["embedding_ready"] is False
    assert body["photos"][0]["embedding"] is None


def test_entry_with_no_images_returns_empty_photos(client, mock_cloud) -> None:
    """Entry with empty images list must return an empty photos array."""
    entry_id = str(uuid.uuid4())
    mock_cloud.retrieve_entry.return_value = {
        "id": entry_id,
        "subject_name": "Alice",
        "registered_at": "2026-02-22T10:00:00+00:00",
        "state": "processing",
        "voice_token": None,
        "vectors_complete": False,
        "images": [],
    }

    resp = client.get(f"/api/memories/{entry_id}")
    assert resp.status_code == 200
    assert resp.get_json()["photos"] == []


# ---------------------------------------------------------------------------
# GET /api/memories (browse list)
# ---------------------------------------------------------------------------


def test_browse_entries_returns_200(client, mock_cloud) -> None:
    """GET /api/memories must return 200 with a memories array and total."""
    resp = client.get("/api/memories")

    assert resp.status_code == 200
    body = resp.get_json()
    assert "memories" in body
    assert "total" in body
    assert isinstance(body["memories"], list)
    assert body["total"] == len(body["memories"])


def test_browse_uses_default_pagination(client, mock_cloud) -> None:
    """GET /api/memories without params must call query_entries with defaults."""
    client.get("/api/memories")
    mock_cloud.query_entries.assert_called_once_with(page_size=20, skip=0)


def test_browse_custom_pagination_passes_args(client, mock_cloud) -> None:
    """GET /api/memories?limit=5&offset=10 must forward correct args."""
    client.get("/api/memories?limit=5&offset=10")
    mock_cloud.query_entries.assert_called_once_with(page_size=5, skip=10)


def test_browse_clamps_large_limit(client, mock_cloud) -> None:
    """GET /api/memories?limit=9999 must clamp to a maximum of 100."""
    client.get("/api/memories?limit=9999")
    kwargs = mock_cloud.query_entries.call_args.kwargs
    assert kwargs["page_size"] <= 100


def test_browse_invalid_limit_returns_400(client, mock_cloud) -> None:
    """Non-integer limit must return 400."""
    resp = client.get("/api/memories?limit=abc")
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "invalid_params"


def test_browse_service_error_returns_500(client, mock_cloud) -> None:
    """A cloud service exception during listing must return 500."""
    mock_cloud.query_entries.side_effect = Exception("DB unreachable")
    resp = client.get("/api/memories")
    assert resp.status_code == 500
    assert resp.get_json()["error"] == "server_error"
