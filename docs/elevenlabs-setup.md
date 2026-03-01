# ElevenLabs Setup Guide — MemoryVoice

This guide walks you through every ElevenLabs configuration step needed to run
the MemoryVoice voice companion from scratch. Follow the sections in order.

---

## 1. Create an ElevenLabs Account

1. Go to https://elevenlabs.io and click **Sign Up**.
2. Use Google or email sign-up — either works.
3. At hackathon events ElevenLabs often provides a Creator tier code.
   Apply it under **Account > Billing > Promo Code** to unlock 100,000 characters/month.
   Skip this step if you are on a personal free plan (10,000 chars/month).
4. Verify your email address if prompted.

---

## 2. Get Your API Key

1. Log in to the ElevenLabs dashboard at https://elevenlabs.io/app.
2. Click your avatar (top-right) and choose **Profile + API key**.
3. Under **API Key**, click **Copy** next to the key string.
4. Open `backend/.env` and paste it:

   ```
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Never commit this value to git. It is already in `.gitignore` via `.env`.

---

## 3. Record a Voice Sample

The Instant Voice Clone requires 60–120 seconds of clean speech.
Quality matters more than length. Aim for 90 seconds.

### Recording Requirements

| Requirement | Detail |
|-------------|--------|
| Duration | 60–120 seconds (90 s is optimal) |
| Format | WAV or MP3, 16 kHz or higher |
| Room | Quiet room — no background music, no fan hum |
| Device | Smartphone voice memo app or any condenser mic |
| Content | Normal conversational speech — reading a letter, telling a story |

### Tips

- Have the person speak naturally about something they enjoy — a holiday,
  a favourite recipe, a childhood game. Authentic speech produces a better clone.
- Avoid coughing, throat-clearing, long silences, or strong background noise.
- Record three short takes and pick the cleanest one.
- Use Audacity (free) to trim silence from the start and end if needed.

### Where to Save the File

Place the recording in the project at a path accessible to the backend, e.g.:

```
backend/recordings/voice_sample.wav
```

Set the path in `backend/.env`:

```
VOICE_SAMPLE_PATH=./recordings/voice_sample.wav
```

---

## 4. Clone the Voice (Instant Voice Clone)

**IMPORTANT: Use Instant Voice Clone only — never Professional Voice Clone.**
Professional Voice Clone takes 30+ minutes and costs significantly more.

### Option A — Python Script (Recommended for Hackathon)

Run the one-shot provisioning script from the backend directory:

```bash
cd backend
python -m app.scripts.provision_voice --audio recordings/voice_sample.wav --name "Dorothy"
```

The script calls `elevenlabs_service.create_voice_clone()`, prints the `voice_id`,
and writes it to `.env` automatically.

### Option B — ElevenLabs Dashboard (Manual)

1. Go to https://elevenlabs.io/app/voice-lab.
2. Click **Add Generative or Cloned Voice**.
3. Select **Instant Voice Clone**.
4. Name the voice (e.g. "Dorothy").
5. Drag and drop your WAV file.
6. Click **Add Voice** and wait ~10 seconds.
7. Copy the `voice_id` from the URL:
   `https://elevenlabs.io/app/voice-lab/edit/{voice_id}`

### Save the Voice ID

Add to `backend/.env`:

```
ELEVENLABS_VOICE_ID=abc123xxxxxxxxxxxxxxxxxxxxxxxx
```

### Quality Check

After cloning, play a test sentence from the dashboard:

1. Open the cloned voice in Voice Lab.
2. Type: "I remember the summer we spent at the lake. Those were the best days."
3. Click **Generate** and compare with the original recording.
4. The clone should be indistinguishable within one listen. If not, re-record
   with less background noise.

**Backup plan**: If the quality check fails, use ElevenLabs built-in "Aria" voice.
Update `ELEVENLABS_VOICE_ID` to Aria's voice_id from the Voice Library.

---

## 5. Build and Upload the Knowledge Base

The knowledge base gives the agent access to specific memories (photo captions,
dates, names) so it can respond with personal details.

### From Python

```python
from ai.knowledge_base.builder import PhotoMemory, build_knowledge_base
from backend.app.services.elevenlabs_service import upload_knowledge_base_document
import asyncio

memories = [
    PhotoMemory(
        date="1958-07-04",
        caption="Family picnic at Coyote Creek. Grandma brought her apple pie.",
        era="Childhood (1940s-1960s)",
    ),
    PhotoMemory(
        date="1974-06-15",
        caption="Wedding day at St. Joseph's Church. We danced until midnight.",
        era="Family Years (1970s-1990s)",
    ),
]

document = build_knowledge_base("Dorothy", memories)

async def upload():
    kb_id = await upload_knowledge_base_document(document, "Dorothy Life Memories")
    print(f"Knowledge base ID: {kb_id}")

asyncio.run(upload())
```

### Size Limit

The knowledge base must stay under **50 KB** (enforced by the builder).
If you hit the limit:
- Trim verbose captions to the key detail (person, place, feeling)
- Remove very similar entries
- Run `validate_knowledge_base(content)` from `ai.knowledge_base.builder`
  to check size before uploading

### Save the Knowledge Base ID

Add to `backend/.env`:

```
ELEVENLABS_KB_ID=kb_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 6. Create the Conversational Agent

### From Python

```python
from backend.app.services.elevenlabs_service import create_conversational_agent
import asyncio, os

async def create():
    agent_id = await create_conversational_agent(
        voice_id=os.environ["ELEVENLABS_VOICE_ID"],
        kb_id=os.environ["ELEVENLABS_KB_ID"],
        person_name="Dorothy",
    )
    print(f"Agent ID: {agent_id}")

asyncio.run(create())
```

### From the ElevenLabs Dashboard (Manual)

1. Go to https://elevenlabs.io/app/conversational-ai.
2. Click **Create Agent**.
3. Under **Voice**, select the cloned voice you created in step 4.
4. Under **Knowledge Base**, attach the document uploaded in step 5.
5. Replace the default system prompt with:

   ```
   You are Dorothy's memory companion. Speak in first person, exactly as
   Dorothy would speak when remembering their own life.

   You have access to memories — family photos, important events, and personal
   stories. When someone asks about a memory or photo, respond warmly, personally,
   and in the voice of someone genuinely remembering.

   Guidelines:
   - Always respond in first person ("I remember...", "We went to...")
   - Draw on the knowledge base for specific details (dates, places, names)
   - If you don't know something: "I'm not sure I remember that clearly, but..."
   - Keep every response to 2-4 sentences — conversational, not documentary
   - Speak slowly and clearly
   ```

6. Click **Save**.
7. Copy the agent ID from the URL:
   `https://elevenlabs.io/app/conversational-ai/{agent_id}`

### Save the Agent ID

Add to both `.env` files:

`backend/.env`:
```
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxx
```

`frontend/.env` (create if missing, never commit):
```
VITE_ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 7. Test the Voice Widget

1. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:5173 in Chrome (Chrome has the best WebRTC support).

3. Navigate to a memory session page.

4. Click the voice orb in the VoiceWidget component.

5. When the status badge shows "Ready to listen", speak:
   "Tell me about a happy memory."

6. The agent should respond in the cloned voice, drawing on the knowledge base.

---

## 8. Quota Monitoring

### Character Budget

| Plan | Characters/month | Approx. demo sessions |
|------|-----------------|----------------------|
| Free | 10,000 | ~33 |
| Creator (hackathon) | 100,000 | ~333 |

One demo session is approximately 300 characters (2–3 agent responses).

### Check Remaining Quota

1. Dashboard: https://elevenlabs.io/app/subscription — shows usage meter.
2. API: `GET /v1/user/subscription` — returns `character_count` and `character_limit`.

### Alerts

The `useVoiceAgent` hook logs a console warning when the estimated session
count drops below 20% of monthly quota. Add a Datadog / Sentry alert on that
log line for automated monitoring during the event.

### Demo Conservation Strategy

- Cap live judging demos to **3 per judging session** (use the orb's status
  to cut off gracefully after 3 interactions).
- Pre-record a 90-second demo video as backup in case quota runs out or the
  API has an outage. Store it at `docs/demo-recording.mp4`.

---

## 9. Environment Variables — Complete Reference

### `backend/.env`

```bash
# ElevenLabs
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_API_BASE=https://api.elevenlabs.io/v1
ELEVENLABS_VOICE_ID=...      # From step 4
ELEVENLABS_KB_ID=...         # From step 5
ELEVENLABS_AGENT_ID=...      # From step 6

# Voice recording path (for provisioning script)
VOICE_SAMPLE_PATH=./recordings/voice_sample.wav
```

### `frontend/.env`

```bash
VITE_ELEVENLABS_AGENT_ID=...  # Same value as ELEVENLABS_AGENT_ID above
```

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Widget script fails to load | CSP blocks unpkg.com | Add `https://elevenlabs.io` and `https://unpkg.com` to `script-src` |
| Clone sounds robotic | Background noise in recording | Re-record in quieter room; try 3 takes |
| Agent doesn't recall specific dates | KB not attached to agent | Verify KB ID in agent settings; re-upload if needed |
| 429 errors in backend logs | Rate limit | Built-in retry handles it; reduce demo frequency |
| Widget shows "Tap orb to connect" forever | Wrong agent_id | Check VITE_ELEVENLABS_AGENT_ID matches the dashboard URL |
| Microphone permission denied | Browser security | Must use HTTPS or localhost; grant mic permission in browser |
| Agent responds in wrong person | System prompt not saved | Re-paste system prompt and save in dashboard |
