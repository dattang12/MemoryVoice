# Skill: ElevenLabs Expert — Production-Level Patterns

## Active Endpoints (verified Feb 2026)

### Authentication
```
Header: xi-api-key: <API_KEY>          ← NOT "Authorization: Bearer"
Base: https://api.elevenlabs.io/v1
```

### Endpoint Map
```
# Voice
POST   /voices/add                      Instant Voice Clone
GET    /voices                          List voices
GET    /voices/{voice_id}               Get voice details
DELETE /voices/{voice_id}               Delete voice

# Conversational AI
POST   /convai/agents/create            Create agent
GET    /convai/agents/{agent_id}        Get agent config
PATCH  /convai/agents/{agent_id}        Update agent
GET    /convai/agents                   List agents

# Knowledge Base
POST   /convai/knowledge-base/text      Upload text/markdown KB source
GET    /convai/knowledge-base/{id}      Get KB details

# User
GET    /user                            Profile + quota
GET    /user/subscription              Quota details
```

## Voice Cloning — Instant Only

```python
import httpx
import os

async def instant_voice_clone(
    audio_path: str,
    person_name: str,
) -> str:
    """Clone voice. Returns voice_id. Takes ~10-30 seconds."""
    api_key = os.environ["ELEVENLABS_API_KEY"]
    async with httpx.AsyncClient(timeout=120.0) as client:
        with open(audio_path, "rb") as f:
            mime = "audio/wav" if audio_path.endswith(".wav") else "audio/mpeg"
            response = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                headers={"xi-api-key": api_key},
                files={"files": (os.path.basename(audio_path), f, mime)},
                data={
                    "name": person_name,
                    "description": f"Memory companion voice for {person_name}",
                },
            )
        response.raise_for_status()
        return response.json()["voice_id"]
```

**Requirements:**
- Audio: 60-120 seconds clean speech (WAV preferred, MP3 acceptable)
- Min 16kHz sample rate, mono or stereo
- No background music, minimal noise
- Use ONLY Instant Voice Clone (Professional = 30+ min)

## Knowledge Base Upload

```python
async def upload_knowledge_base(content: str, name: str) -> str:
    """Upload markdown/text KB. Returns kb_id (the 'id' field)."""
    api_key = os.environ["ELEVENLABS_API_KEY"]
    # Enforce 50KB limit
    if len(content) > 50_000:
        content = content[:50_000]

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/convai/knowledge-base/text",
            headers={"xi-api-key": api_key},
            files={"file": (f"{name}.md", content.encode("utf-8"), "text/plain")},
            data={"name": name},
        )
        response.raise_for_status()
        return response.json()["id"]   # ← "id", not "knowledge_base_id"
```

**Note:** Response field is `"id"`, not `"knowledge_base_id"`.

## Create Conversational Agent

```python
async def create_agent(
    voice_id: str,
    kb_id: str,
    person_name: str,
) -> str:
    """Create conversational agent. Returns agent_id."""
    api_key = os.environ["ELEVENLABS_API_KEY"]
    payload = {
        "name": f"{person_name} Memory Companion",
        "conversation_config": {
            "agent": {
                "prompt": {
                    "prompt": f"""You are {person_name}'s memory companion. Speak in first person,
exactly as {person_name} would speak when remembering their own life.

Guidelines:
- Always respond in first person ("I remember...", "We went to...")
- Draw on the knowledge base for specific details (dates, places, names)
- If you don't know something: "I'm not sure I remember that clearly, but..."
- Keep responses to 2-4 sentences — conversational, not documentary
- Speak slowly and clearly
Every memory you share is a gift.""",
                    "knowledge_base": [{"type": "file", "id": kb_id}],
                },
                "first_message": "Hello, I'm here to share some memories with you. What would you like to remember today?",
                "language": "en",
            },
            "tts": {
                "voice_id": voice_id,
                "model_id": "eleven_turbo_v2_5",    # ← Current model (not v2)
                "stability": 0.75,
                "similarity_boost": 0.85,
            },
            "asr": {
                "quality": "high",
                "user_input_audio_format": "pcm_16000",
            },
        },
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/convai/agents/create",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
        return response.json()["agent_id"]
```

## Update Agent Voice

```python
async def update_agent_voice(agent_id: str, voice_id: str) -> None:
    """Update existing agent's TTS voice."""
    api_key = os.environ["ELEVENLABS_API_KEY"]
    # CORRECT payload structure (nested under conversation_config.tts)
    payload = {
        "conversation_config": {
            "tts": {
                "voice_id": voice_id
            }
        }
    }
    # WRONG: json={"voice_id": voice_id}   ← top-level doesn't work

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.patch(
            f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
```

## Frontend Widget Integration

### index.html (add once to head)
```html
<script src="https://elevenlabs.io/convai-widget/index.js"
        async type="text/javascript"></script>
```

### React Integration (correct)
```tsx
import { useEffect } from 'react'

export function VoiceWidget({ agentId }: { agentId: string }) {
  useEffect(() => {
    if (!agentId) return

    // Remove any existing widget
    document.querySelector('elevenlabs-convai')?.remove()

    // Create and mount widget
    const widget = document.createElement('elevenlabs-convai')
    widget.setAttribute('agent-id', agentId)
    document.body.appendChild(widget)

    // Listen for events (correct event names)
    const onStart = () => console.log('Call started')
    const onEnd = () => console.log('Call ended')
    window.addEventListener('elevenlabs-convai:call_started', onStart)
    window.addEventListener('elevenlabs-convai:call_ended', onEnd)

    return () => {
      widget.remove()
      window.removeEventListener('elevenlabs-convai:call_started', onStart)
      window.removeEventListener('elevenlabs-convai:call_ended', onEnd)
    }
  }, [agentId])

  return null
}
```

### Supported Widget Events (listen on window)
```javascript
'elevenlabs-convai:call_started'      // Session begins
'elevenlabs-convai:call_ended'        // Session ends
'elevenlabs-convai:agent_speaking'    // Agent audio playing
'elevenlabs-convai:user_speaking'     // User mic active
```

### Context Injection (CORRECT method)
```tsx
// DO NOT use custom events for context injection — not supported.
// INSTEAD: re-initialize widget with overrides when context changes.

const widget = document.querySelector('elevenlabs-convai')
if (widget) {
  // Use override attribute for session-level context
  widget.setAttribute('override', JSON.stringify({
    agent: {
      firstMessage: `I'm looking at a photo from ${memory.date}: ${memory.caption}`
    }
  }))
}
// Or reinit the widget with a new first message
```

## Quota Management

```python
async def check_quota() -> dict:
    api_key = os.environ["ELEVENLABS_API_KEY"]
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            "https://api.elevenlabs.io/v1/user",
            headers={"xi-api-key": api_key}
        )
        r.raise_for_status()
        sub = r.json()["subscription"]
        return {
            "tier": sub.get("tier"),
            "used": sub["character_count"],
            "limit": sub["character_limit"],
            "remaining": sub["character_limit"] - sub["character_count"],
            "pct_used": sub["character_count"] / sub["character_limit"] * 100,
        }
```

## Rate Limit Handling

```python
import asyncio

async def post_with_retry(client, url, *, max_retries=3, backoff=2.0, **kwargs):
    for attempt in range(max_retries + 1):
        response = await client.post(url, **kwargs)
        if response.status_code == 429 and attempt < max_retries:
            wait = backoff * (2 ** attempt)
            await asyncio.sleep(wait)
            # Rewind file streams for retry
            for file_tuple in (kwargs.get('files') or {}).values():
                if hasattr(file_tuple[1], 'seek'):
                    file_tuple[1].seek(0)
            continue
        response.raise_for_status()
        return response
    raise RuntimeError("Max retries exceeded on rate limit")
```

## Error Handling Reference

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Invalid API key | Check ELEVENLABS_API_KEY |
| 403 | Feature not on plan | Upgrade account |
| 404 | Resource not found | Wrong voice_id or agent_id |
| 413 | File too large | Compress audio/trim KB |
| 422 | Validation error | Check request payload shape |
| 429 | Rate limit | Retry with exponential backoff |
| 503 | Service down | Check status.elevenlabs.io, retry |

## Current Model IDs (Feb 2026)

```python
# Real-time conversation (recommended)
ELEVEN_TURBO_V2_5 = "eleven_turbo_v2_5"   # Best for ConvAI
ELEVEN_FLASH_V2_5 = "eleven_flash_v2_5"   # Fastest

# High quality (not for real-time)
ELEVEN_MULTILINGUAL_V2 = "eleven_multilingual_v2"

# DO NOT USE (legacy):
# "eleven_turbo_v2"           ← May be deprecated
# "eleven_monolingual_v1"     ← Legacy
# "eleven_v2"                 ← Outdated
```

## Complete Provisioning Script

```python
#!/usr/bin/env python3
"""One-shot ElevenLabs provisioning script for MemoryBridge demo.

Usage: python -m backend.app.scripts.provision_el \
    --audio recordings/voice_sample.wav \
    --name "Dorothy" \
    --memory-id <firestore_memory_id>
"""
import asyncio, os, argparse
from dotenv import load_dotenv
load_dotenv("backend/.env")

async def provision(audio_path: str, person_name: str, memory_id: str | None) -> None:
    from backend.app.services.elevenlabs_service import (
        create_voice_clone,
        upload_knowledge_base_document,
        create_conversational_agent,
    )
    from ai.knowledge_base.builder import build_from_firestore

    print("Step 1: Cloning voice...")
    result = await create_voice_clone(audio_path, person_name)
    print(f"  voice_id = {result.voice_id}")

    print("Step 2: Building knowledge base...")
    if memory_id:
        kb_content = await build_from_firestore(memory_id, person_name)
    else:
        kb_content = f"# {person_name}'s Life Memories\n\nMemories coming soon.\n"
    print(f"  KB size: {len(kb_content)} chars")

    print("Step 3: Uploading knowledge base...")
    kb_id = await upload_knowledge_base_document(kb_content, f"{person_name} Life Memories")
    print(f"  kb_id = {kb_id}")

    print("Step 4: Creating conversational agent...")
    agent_id = await create_conversational_agent(result.voice_id, kb_id, person_name)
    print(f"  agent_id = {agent_id}")

    print("\n✅ DONE. Add to your .env files:")
    print(f"ELEVENLABS_VOICE_ID={result.voice_id}")
    print(f"ELEVENLABS_KB_ID={kb_id}")
    print(f"ELEVENLABS_AGENT_ID={agent_id}")
    print(f"VITE_ELEVENLABS_AGENT_ID={agent_id}")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--audio", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--memory-id")
    args = p.parse_args()
    asyncio.run(provision(args.audio, args.name, args.memory_id))
```
