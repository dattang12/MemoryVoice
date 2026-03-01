# Skill: ElevenLabs API Patterns for MemoryBridge

## Reference: https://elevenlabs.io/docs/agents-platform/quickstart

## Voice Cloning (Instant — not Professional)
```python
# Instant Voice Clone — takes seconds, good enough for hackathon
import httpx

async def instant_voice_clone(audio_path: str, name: str, api_key: str) -> str:
    """Returns voice_id."""
    async with httpx.AsyncClient() as client:
        with open(audio_path, "rb") as f:
            response = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                headers={"xi-api-key": api_key},
                files={"files": (f"{name}.wav", f, "audio/wav")},
                data={
                    "name": name,
                    "description": "Memory companion cloned voice",
                    "labels": '{"use_case": "memory_companion"}',
                }
            )
        response.raise_for_status()
        return response.json()["voice_id"]
```

## List Voices (verify clone was created)
```python
async def list_voices(api_key: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": api_key}
        )
        return r.json()["voices"]
```

## Conversational Agent Setup (via Dashboard)
```
1. Go to: https://elevenlabs.io/app/conversational-ai
2. Create Agent → Custom Agent
3. Settings:
   - Voice: [Select your cloned voice_id]
   - Language: English (or target language)
   - System Prompt: [See mb-voice.md for full prompt]
4. Knowledge Base:
   - Upload: memories_knowledge_base.txt (built by ai/knowledge_base/builder.py)
5. Widget:
   - Copy Agent ID (starts with "agent_")
   - Enable: Allow microphone access
   - Enable: Show closed captions
6. Save Agent → copy agent_id to .env
```

## Updating Agent Voice to Cloned Voice (API)
```python
async def update_agent_voice(agent_id: str, voice_id: str, api_key: str) -> None:
    """Swap agent voice to the cloned voice."""
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json={"voice_id": voice_id}
        )
        response.raise_for_status()
```

## Upload Knowledge Base Document
```python
async def upload_knowledge_base(
    agent_id: str,
    document_text: str,
    document_name: str,
    api_key: str
) -> str:
    """Upload knowledge base document. Returns kb_id."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}/knowledge-base",
            headers={"xi-api-key": api_key},
            files={"file": (document_name, document_text.encode(), "text/plain")}
        )
        response.raise_for_status()
        return response.json()["id"]
```

## Frontend Widget Embedding
```tsx
// components/chat/VoiceWidget.tsx
import { useEffect, useRef } from 'react'

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID

export function VoiceWidget({ photoContext }: { photoContext?: string }) {
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ElevenLabs widget script — add to index.html once
    // <script src="https://elevenlabs.io/convai-widget/index.js" async></script>

    const widget = document.createElement('elevenlabs-convai')
    widget.setAttribute('agent-id', AGENT_ID)
    widgetRef.current?.appendChild(widget)
    return () => { widgetRef.current?.removeChild(widget) }
  }, [])

  // Send photo context to agent when a photo is selected
  useEffect(() => {
    if (photoContext) {
      const widget = document.querySelector('elevenlabs-convai')
      widget?.dispatchEvent(new CustomEvent('context', { detail: { context: photoContext } }))
    }
  }, [photoContext])

  return <div ref={widgetRef} className="fixed bottom-4 right-4 z-50" />
}
```

## index.html Widget Script
```html
<!-- Add to <head> or before </body> -->
<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
```

## Usage Estimation
```
Creator Tier (free at event): 100,000 chars/month
1 conversation turn ≈ 50-100 chars response
30 judge interactions × 5 turns × 75 chars avg = 11,250 chars
Buffer for testing: 20,000 chars
→ Well within free tier limits
```

## Audio Quality Tips for Voice Clone
```
✓ Record in a quiet room (no echo, no HVAC)
✓ Use WAV format (not MP3 — higher quality)
✓ Duration: 90-120 seconds (more = better)
✓ Speak naturally, not performatively
✓ Include emotional variation (excited, calm, thoughtful)
✓ No background music
✗ Don't record near a window (traffic noise)
✗ Don't whisper (unclear phonemes)
```

## Key Rules
- Always use Instant Voice Clone — Professional takes 30+ minutes
- Store voice_id in .env immediately after clone — don't lose it
- Test clone quality BEFORE hackathon day (Feb 25 deadline)
- Backup: ElevenLabs "Aria" or "Rachel" if clone sounds robotic
- Pre-record 3 key demo responses as MP3 files for offline fallback
