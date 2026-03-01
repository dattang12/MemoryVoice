"""Unit tests for the POST /api/upload and GET /api/health endpoints.

Coverage:
    - Successful submission returns entry_id and 'processing' state
    - Missing photos[] returns 400
    - Missing voice_recording returns 400
    - Mismatched captions[] count returns 400
    - Missing person_name returns 400
    - Exceeding photo quota returns 400
    - Unsupported image format returns 400
    - Unsupported audio format returns 400
    - Zero-byte files return 400
    - GET /api/health returns 200
"""

from __future__ import annotations

import io
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# Submission helper
# ---------------------------------------------------------------------------


def _post_submission(
    client,
    photos: list[tuple[bytes, str, str]] | None = None,
    audio: tuple[bytes, str, str] | None = None,
    captions: list[str] | None = None,
    subject_name: str = "Margaret Chen",
):
    """Build and send a multipart POST to /api/upload.

    Args:
        client: Flask test client.
        photos: List of (bytes, filename, content_type) tuples.
        audio: (bytes, filename, content_type) for the voice recording.
        captions: Annotation strings parallel to photos.
        subject_name: Display name for the subject.

    Returns:
        Flask test Response.
    """
    payload: dict = {"person_name": subject_name}

    if photos is not None:
        payload["photos[]"] = [
            (io.BytesIO(b), fname, ct) for b, fname, ct in photos
        ]

    if audio is not None:
        ab, aname, act = audio
        payload["voice_recording"] = (io.BytesIO(ab), aname, act)

    if captions is not None:
        payload["captions[]"] = captions

    return client.post(
        "/api/upload",
        data=payload,
        content_type="multipart/form-data",
    )


# ---------------------------------------------------------------------------
# Liveness check
# ---------------------------------------------------------------------------


def test_liveness_probe_returns_200(client) -> None:
    """GET /api/health must return 200 with status ok."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "ok"


# ---------------------------------------------------------------------------
# Successful submissions
# ---------------------------------------------------------------------------


def test_single_photo_submission_succeeds(
    client, sample_jpeg: bytes, sample_wav: bytes, mock_cloud
) -> None:
    """A valid single-photo submission must return 200 with entry_id and processing state."""
    with patch("app.routes.ingest._schedule_vector_computation"):
        resp = _post_submission(
            client,
            photos=[(sample_jpeg, "shot1.jpg", "image/jpeg")],
            audio=(sample_wav, "recording.wav", "audio/wav"),
            captions=["Grandma at the beach"],
        )

    assert resp.status_code == 200
    body = resp.get_json()
    assert "memory_id" in body
    assert body["status"] == "processing"
    assert len(body["memory_id"]) == 36

    mock_cloud.persist_entry.assert_called_once()
    assert mock_cloud.push_asset_to_cloud.call_count == 2  # audio + 1 photo


def test_multi_photo_submission_succeeds(
    client, sample_jpeg: bytes, sample_png: bytes, sample_wav: bytes, mock_cloud
) -> None:
    """Uploading three photos must trigger three photo storage calls."""
    with patch("app.routes.ingest._schedule_vector_computation"):
        resp = _post_submission(
            client,
            photos=[
                (sample_jpeg, "p1.jpg", "image/jpeg"),
                (sample_png, "p2.png", "image/png"),
                (sample_jpeg, "p3.jpg", "image/jpeg"),
            ],
            audio=(sample_wav, "recording.wav", "audio/wav"),
            captions=["Label 1", "Label 2", "Label 3"],
            subject_name="John Doe",
        )

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "processing"
    assert mock_cloud.push_asset_to_cloud.call_count == 4  # 1 audio + 3 photos


# ---------------------------------------------------------------------------
# Photo field validation
# ---------------------------------------------------------------------------


def test_absent_photos_returns_400(client, sample_wav: bytes) -> None:
    """Omitting photos[] must return 400 validation_failed."""
    resp = _post_submission(
        client,
        photos=None,
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=[],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "photo" in body["detail"].lower()


def test_empty_photos_list_returns_400(client, sample_wav: bytes) -> None:
    """Sending an empty photos[] list must return 400."""
    resp = _post_submission(
        client,
        photos=[],
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=[],
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "validation_failed"


def test_quota_exceeded_returns_400(
    client, sample_jpeg: bytes, sample_wav: bytes
) -> None:
    """Submitting more than 30 photos must return 400."""
    excess_photos = [(sample_jpeg, f"p{i}.jpg", "image/jpeg") for i in range(31)]
    excess_captions = [f"Caption {i}" for i in range(31)]
    resp = _post_submission(
        client,
        photos=excess_photos,
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=excess_captions,
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "31" in body["detail"] or "maximum" in body["detail"].lower()


def test_caption_count_mismatch_returns_400(
    client, sample_jpeg: bytes, sample_wav: bytes
) -> None:
    """captions[] with wrong count must return 400."""
    resp = _post_submission(
        client,
        photos=[(sample_jpeg, "p1.jpg", "image/jpeg")],
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=["Cap A", "Cap B"],  # 2 captions for 1 photo
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "captions" in body["detail"].lower()


def test_unsupported_image_format_returns_400(client, sample_wav: bytes) -> None:
    """A .gif image file must be rejected with 400."""
    gif = b"GIF89a" + b"\x00" * 10
    resp = _post_submission(
        client,
        photos=[(gif, "img.gif", "image/gif")],
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=["A caption"],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert ".gif" in body["detail"]


def test_zero_byte_image_returns_400(client, sample_wav: bytes) -> None:
    """A zero-byte image must be rejected with 400."""
    resp = _post_submission(
        client,
        photos=[(b"", "blank.jpg", "image/jpeg")],
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=["A caption"],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "empty" in body["detail"].lower()


# ---------------------------------------------------------------------------
# Audio field validation
# ---------------------------------------------------------------------------


def test_absent_audio_returns_400(client, sample_jpeg: bytes) -> None:
    """Omitting voice_recording must return 400."""
    resp = _post_submission(
        client,
        photos=[(sample_jpeg, "p1.jpg", "image/jpeg")],
        audio=None,
        captions=["Caption"],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "voice" in body["detail"].lower()


def test_unsupported_audio_format_returns_400(client, sample_jpeg: bytes) -> None:
    """An .aac audio file must be rejected with 400."""
    aac = b"\xff\xf1" + b"\x00" * 100
    resp = _post_submission(
        client,
        photos=[(sample_jpeg, "p1.jpg", "image/jpeg")],
        audio=(aac, "recording.aac", "audio/aac"),
        captions=["Caption"],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert ".aac" in body["detail"]


def test_zero_byte_audio_returns_400(client, sample_jpeg: bytes) -> None:
    """A zero-byte audio file must be rejected with 400."""
    resp = _post_submission(
        client,
        photos=[(sample_jpeg, "p1.jpg", "image/jpeg")],
        audio=(b"", "recording.wav", "audio/wav"),
        captions=["Caption"],
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "empty" in body["detail"].lower()


# ---------------------------------------------------------------------------
# Subject name validation
# ---------------------------------------------------------------------------


def test_blank_subject_name_returns_400(
    client, sample_jpeg: bytes, sample_wav: bytes
) -> None:
    """An empty person_name field must return 400."""
    resp = _post_submission(
        client,
        photos=[(sample_jpeg, "p1.jpg", "image/jpeg")],
        audio=(sample_wav, "recording.wav", "audio/wav"),
        captions=["Caption"],
        subject_name="",
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"] == "validation_failed"
    assert "person_name" in body["detail"].lower()


# ---------------------------------------------------------------------------
# Life-phase assignment helper
# ---------------------------------------------------------------------------


def test_phase_assignment_quarters() -> None:
    """_assign_life_phase must label four equal quarters correctly."""
    from app.routes.ingest import _assign_life_phase

    batch_size = 8
    labels = [_assign_life_phase(i, batch_size) for i in range(batch_size)]
    assert labels[0] == "childhood"
    assert labels[1] == "childhood"
    assert labels[2] == "young-adult"
    assert labels[3] == "young-adult"
    assert labels[4] == "family"
    assert labels[5] == "family"
    assert labels[6] == "recent"
    assert labels[7] == "recent"


def test_phase_assignment_single_item() -> None:
    """A single-photo batch must receive the 'recent' phase."""
    from app.routes.ingest import _assign_life_phase

    assert _assign_life_phase(0, 1) == "recent"


def test_phase_assignment_zero_total() -> None:
    """Zero total must not raise and must return 'recent'."""
    from app.routes.ingest import _assign_life_phase

    assert _assign_life_phase(0, 0) == "recent"
