"""Voice cloning and conversational AI provisioning via ElevenLabs.

Responsibilities:
- Instant Voice Clone creation from a recorded audio file
- Knowledge base document upload for conversational context grounding
- AI companion agent creation and voice patching
- Shareable agent URL construction

All outbound calls use httpx.AsyncClient with xi-api-key authentication.
HTTP 429 responses trigger exponential back-off with up to _RETRY_CAP attempts.
"""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_REMOTE_BASE: str = os.environ.get("ELEVENLABS_API_BASE", "https://api.elevenlabs.io/v1")

_RETRY_CAP: int = 3
_WAIT_INTERVAL: float = 2.0
_CONTEXT_SIZE_LIMIT: int = 50_000


def _resolve_token() -> str:
    """Lazily read the ElevenLabs API key from the runtime environment.

    Deferred evaluation ensures dotenv has already been applied before
    the key is accessed, regardless of import order.

    Returns:
        The API key string.

    Raises:
        KeyError: If ELEVENLABS_API_KEY is absent from the environment.
    """
    return os.environ["ELEVENLABS_API_KEY"]


def _auth_headers() -> dict[str, str]:
    """Build authentication headers from the resolved API key."""
    return {"xi-api-key": _resolve_token()}


# ---------------------------------------------------------------------------
# Companion system prompt
# ---------------------------------------------------------------------------

_COMPANION_PROMPT = """\
You are {subject_name}'s memory companion. Speak in first person, exactly as \
{subject_name} would speak when remembering their own life.

You have access to memories — family photos, important events, and personal \
stories. When someone asks about a memory or photo, respond warmly, personally, \
and in the voice of someone genuinely remembering.

Guidelines:
- Always respond in first person ("I remember...", "We went to...", "That was the day...")
- Draw on the knowledge base for specific details such as dates, places, and names
- If you don't know something, respond with warmth: \
"I'm not sure I remember that clearly, but..."
- Keep every response to 2–4 sentences — conversational, not documentary
- Speak slowly and clearly — this is for someone who may have difficulty hearing

You are helping this person reconnect with who they are. \
Every memory you share is a gift.
"""

# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class CloneOutcome:
    """Immutable result returned after a successful Instant Voice Clone."""

    voice_token: str
    label: str


@dataclass(frozen=True)
class AgentBlueprint:
    """Immutable record describing a fully provisioned ElevenLabs agent."""

    companion_id: str
    voice_token: str
    context_ref: str


# ---------------------------------------------------------------------------
# HTTP helpers with retry logic
# ---------------------------------------------------------------------------


async def _http_post(
    session: httpx.AsyncClient,
    endpoint: str,
    *,
    extra_headers: dict[str, str] | None = None,
    form_data: dict | None = None,
    json_body: dict | None = None,
    file_map: dict | None = None,
) -> httpx.Response:
    """Execute a POST request with exponential back-off on HTTP 429.

    Args:
        session: Shared async HTTP client.
        endpoint: Full target URL.
        extra_headers: Headers merged on top of the default auth headers.
        form_data: URL-encoded form payload.
        json_body: JSON-serialisable payload.
        file_map: Multipart file payload.

    Returns:
        Successful httpx.Response (2xx status).

    Raises:
        httpx.HTTPStatusError: After all retry attempts are exhausted.
    """
    merged = {**_auth_headers(), **(extra_headers or {})}
    attempt = 0

    while True:
        resp = await session.post(
            endpoint,
            headers=merged,
            data=form_data,
            json=json_body,
            files=file_map,
        )

        if resp.status_code != 429 or attempt >= _RETRY_CAP:
            if resp.status_code >= 400:
                logger.error(
                    "[VoiceEngine %d] endpoint=%s body=%s",
                    resp.status_code,
                    endpoint,
                    resp.text[:1000],
                )
            resp.raise_for_status()
            return resp

        delay = _WAIT_INTERVAL * (2 ** attempt)
        logger.warning(
            "Rate limited (attempt %d/%d). Waiting %.1fs.",
            attempt + 1,
            _RETRY_CAP,
            delay,
        )
        await asyncio.sleep(delay)
        attempt += 1

        if file_map:
            for _k, payload in file_map.items():
                if isinstance(payload, (list, tuple)) and len(payload) >= 2:
                    stream = payload[1]
                    if hasattr(stream, "seek"):
                        stream.seek(0)


async def _http_patch(
    session: httpx.AsyncClient,
    endpoint: str,
    *,
    json_body: dict,
) -> httpx.Response:
    """Execute a PATCH request with exponential back-off on HTTP 429."""
    attempt = 0

    while True:
        resp = await session.patch(
            endpoint,
            headers={**_auth_headers(), "Content-Type": "application/json"},
            json=json_body,
        )

        if resp.status_code != 429 or attempt >= _RETRY_CAP:
            if resp.status_code >= 400:
                logger.error(
                    "[VoiceEngine PATCH %d] endpoint=%s body=%s",
                    resp.status_code,
                    endpoint,
                    resp.text[:1000],
                )
            resp.raise_for_status()
            return resp

        delay = _WAIT_INTERVAL * (2 ** attempt)
        logger.warning(
            "Rate limited on PATCH (attempt %d/%d). Waiting %.1fs.",
            attempt + 1,
            _RETRY_CAP,
            delay,
        )
        await asyncio.sleep(delay)
        attempt += 1


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def clone_subject_voice(
    recording_path: str,
    subject_name: str,
) -> CloneOutcome:
    """Clone a voice from an audio file using ElevenLabs Instant Voice Clone.

    Sends the recording to the /voices/add endpoint. The audio should be
    60–120 seconds of clean, noise-free speech for best results.

    Args:
        recording_path: Absolute local path to the WAV/MP3/WebM audio file.
        subject_name: Label applied to the cloned voice in ElevenLabs.

    Returns:
        CloneOutcome containing the assigned voice_token and label.

    Raises:
        FileNotFoundError: If the recording file does not exist on disk.
        httpx.HTTPStatusError: On API error after all retries.
    """
    if not os.path.isfile(recording_path):
        raise FileNotFoundError(f"Recording not found: {recording_path}")

    logger.info("Cloning voice for '%s' from '%s'.", subject_name, recording_path)

    async with httpx.AsyncClient(timeout=120.0) as session:
        with open(recording_path, "rb") as audio:
            suffix = recording_path.lower()
            if suffix.endswith(".wav"):
                mime = "audio/wav"
            elif suffix.endswith(".webm"):
                mime = "audio/webm"
            elif suffix.endswith(".ogg"):
                mime = "audio/ogg"
            elif suffix.endswith(".m4a"):
                mime = "audio/mp4"
            else:
                mime = "audio/mpeg"
            basename = os.path.basename(recording_path)

            resp = await _http_post(
                session,
                f"{_REMOTE_BASE}/voices/add",
                file_map={"files": (basename, audio, mime)},
                form_data={
                    "name": subject_name,
                    "description": f"Memory companion voice for {subject_name}",
                },
            )

    payload = resp.json()
    token: str = payload["voice_id"]
    logger.info("Voice cloned. token=%s", token)
    return CloneOutcome(voice_token=token, label=subject_name)


async def push_context_document(
    content: str,
    label: str,
) -> str:
    """Upload a text document as a knowledge base source in ElevenLabs.

    Content exceeding _CONTEXT_SIZE_LIMIT characters is truncated before upload
    to stay within ElevenLabs size constraints.

    Args:
        content: Markdown or plain-text content to upload.
        label: Human-readable name for this knowledge base entry.

    Returns:
        Knowledge base document ID assigned by ElevenLabs.

    Raises:
        httpx.HTTPStatusError: On API error after all retries.
    """
    if len(content) > _CONTEXT_SIZE_LIMIT:
        logger.warning(
            "Context content (%d chars) exceeds limit %d. Truncating.",
            len(content),
            _CONTEXT_SIZE_LIMIT,
        )
        content = content[:_CONTEXT_SIZE_LIMIT]

    logger.info("Uploading context document '%s' (%d chars).", label, len(content))

    async with httpx.AsyncClient(timeout=60.0) as session:
        resp = await _http_post(
            session,
            f"{_REMOTE_BASE}/convai/knowledge-base/text",
            json_body={"text": content, "name": label},
        )

    payload = resp.json()
    ref_id: str = payload["id"]
    logger.info("Context document uploaded. id=%s", ref_id)
    return ref_id


async def spawn_ai_companion(
    voice_token: str,
    context_ref: str,
    subject_name: str,
    custom_prompt: str | None = None,
) -> str:
    """Create an ElevenLabs Conversational AI agent wired to a cloned voice and KB.

    Args:
        voice_token: ElevenLabs voice_id from clone_subject_voice.
        context_ref: Knowledge base document ID from push_context_document.
        subject_name: Used to personalise the system prompt if none provided.
        custom_prompt: Optional override for the agent system prompt.

    Returns:
        ElevenLabs agent_id string for the created companion.

    Raises:
        ValueError: If voice_token or context_ref is empty.
        httpx.HTTPStatusError: On API error after all retries.
    """
    if not voice_token:
        raise ValueError(f"voice_token empty — cloning failed for {subject_name!r}")
    if not context_ref:
        raise ValueError(f"context_ref empty — KB upload failed for {subject_name!r}")

    sys_prompt = custom_prompt or _COMPANION_PROMPT.format(subject_name=subject_name)

    spec: dict = {
        "name": f"{subject_name} Memory Companion",
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": sys_prompt,
                    "llm": "gemini-2.0-flash",
                    "knowledge_base": [
                        {
                            "type": "file",
                            "name": f"{subject_name} memories",
                            "id": context_ref,
                        }
                    ],
                },
                "first_message": (
                    "Hello, I'm here to share some memories with you. "
                    "What would you like to remember today?"
                ),
                "language": "en",
            },
            "tts": {
                "voice_id": voice_token,
                "model_id": "eleven_turbo_v2",
            },
        },
    }

    logger.info("Spawning AI companion for '%s'.", subject_name)

    async with httpx.AsyncClient(timeout=60.0) as session:
        resp = await _http_post(
            session,
            f"{_REMOTE_BASE}/convai/agents/create",
            json_body=spec,
        )

    companion_id: str = resp.json()["agent_id"]
    logger.info("AI companion created. id=%s", companion_id)
    return companion_id


async def swap_companion_voice(companion_id: str, voice_token: str) -> bool:
    """Replace the TTS voice on an existing ElevenLabs companion agent.

    Useful after re-running voice cloning without recreating the full agent.

    Args:
        companion_id: ElevenLabs agent_id to update.
        voice_token: New voice_id to apply.

    Returns:
        True on success, False if the patch was rejected after all retries.
    """
    spec: dict = {
        "conversation_config": {
            "tts": {"voice_id": voice_token}
        }
    }

    logger.info("Patching companion %s with voice_token=%s.", companion_id, voice_token)

    try:
        async with httpx.AsyncClient(timeout=30.0) as session:
            await _http_patch(
                session,
                f"{_REMOTE_BASE}/convai/agents/{companion_id}",
                json_body=spec,
            )
        logger.info("Companion voice patched.")
        return True
    except httpx.HTTPStatusError as exc:
        logger.error("Companion voice patch failed: %s", exc)
        return False


async def resolve_companion_url(companion_id: str) -> str:
    """Construct the shareable widget URL for a conversational companion.

    No API call is required — the URL follows a known canonical pattern.

    Args:
        companion_id: ElevenLabs agent_id.

    Returns:
        Public HTTPS URL for the ElevenLabs companion widget.
    """
    url = f"https://elevenlabs.io/convai/agent/{companion_id}"
    logger.info("Companion URL for %s: %s", companion_id, url)
    return url
