# MemoryBridge — ElevenLabs Setup Report
**Generated:** 2026-02-23
**Author:** ElevenLabs Expert Analysis (Claude)
**Project:** `C:\Users\ASUS\Desktop\memorybridge`

---

## Executive Summary

After reading every source file in the project, I found **6 critical issues** that completely break the ElevenLabs integration despite all the service code being well-written. The voice feature will not work until these are fixed. I also created a team of 5 expert agents to fix them and monitor the integration going forward.

---

## Part 1: What Is Mock / Broken

### 🔴 CRITICAL — Will Cause Complete Failure

#### 1. `ELEVENLABS_API_KEY` is empty
**File:** `backend/.env` line 34
```
ELEVENLABS_API_KEY=     ← EMPTY
```
Every call to ElevenLabs API will return `401 Unauthorized`. Nothing works without this key.

#### 2. No Flask route calls ElevenLabs after upload
**File:** `backend/app/routes/upload.py`
The upload route saves photos to Firebase Storage and Firestore correctly, then queues an AMD embedding job. But it **never calls** `create_voice_clone()`, `upload_knowledge_base_document()`, or `create_conversational_agent()`.

These functions exist and are fully written in `backend/app/services/elevenlabs_service.py` — but they are **never called from any route**. The `voice_id` field in Firestore is set to `null` on creation and **never updated**.

**Effect:** The voice companion feature is completely non-functional. Every memory shows "Voice agent unavailable" to users.

#### 3. `FLASK_SECRET_KEY` is the placeholder
**File:** `backend/.env` line 62
```
FLASK_SECRET_KEY=change_me_to_a_random_32_char_secret
```
The Flask factory (`backend/app/__init__.py`) explicitly throws a `RuntimeError` if this placeholder is detected in production:
```python
raise RuntimeError("FLASK_SECRET_KEY is missing or is the default placeholder.")
```
The backend will crash on startup in any non-development environment.

#### 4. `build_from_firestore()` reads wrong Firestore path
**File:** `ai/knowledge_base/builder.py` line 326–328
```python
snap = await asyncio.get_event_loop().run_in_executor(None, doc_ref.get)
data: dict = snap.to_dict() or {}
photos: list[dict] = data.get("photos", [])  # ← ALWAYS RETURNS []
```

Photos are stored in a **Firestore subcollection** at `memories/{id}/photos`, not as an embedded array field on the parent document. The code reads the parent document and calls `.get("photos", [])` — this field does not exist on the parent. The result is always an empty list, producing a knowledge base with no memories.

**Correct code:**
```python
photos_ref = db.collection("memories").document(memory_id).collection("photos")
docs = await loop.run_in_executor(None, lambda: list(photos_ref.stream()))
photos = [doc.to_dict() for doc in docs]
```

### 🟠 HIGH — Feature Broken

#### 5. `VITE_ELEVENLABS_AGENT_ID` is empty
**File:** `frontend/.env` line ~40
```
VITE_ELEVENLABS_AGENT_ID=     ← EMPTY
```
The `VoiceWidget` component calls `getConfiguredAgentId()` which reads this env var. When it returns null, the widget renders `<ConfigurationPlaceholder>` — a muted orb with "Voice agent unavailable" text — instead of the actual voice companion.

Every user who visits the app sees the placeholder.

#### 6. `sendPhotoContext` uses an unsupported event
**File:** `frontend/src/services/elevenlabs.ts` line 287
```javascript
const event = new CustomEvent('elevenlabs-convai:inject_context', {
  detail: { context },
  bubbles: true,
})
activeWidget.dispatchEvent(event)
```

`elevenlabs-convai:inject_context` is **not a real ElevenLabs widget event**. The widget silently ignores it. When a user selects a photo, the voice agent never receives the photo context — it cannot ask about specific photos.

The correct approach is to reinitialize the widget with the photo context in the `firstMessage` override, or use `@11labs/client` SDK's `dynamicVariables`.

---

## Part 2: What Is Working (Do Not Break)

| Component | Status | Notes |
|-----------|--------|-------|
| `elevenlabs_service.py` functions | ✅ Written correctly | All 5 functions are production-quality but never called |
| `_post_with_retry` backoff logic | ✅ Correct | 3 retries, exponential backoff, stream rewind |
| `_patch_with_retry` logic | ✅ Correct | For agent voice updates |
| Widget script loading (`loadElevenLabsWidget`) | ✅ Correct | Deduplicates loading, cached promise |
| Widget event listener names | ✅ Correct | `call_started`, `call_ended`, `agent_speaking`, `user_speaking` |
| `useVoiceAgent` hook state machine | ✅ Correct | Transitions, cleanup, subscribe/unsubscribe pattern |
| Knowledge base document builder | ✅ Correct | Size validation, era grouping, era ordering |
| `create_conversational_agent` payload | ✅ Mostly correct | Model ID should be updated to `eleven_turbo_v2_5` |

---

## Part 3: What You Need to Do on ElevenLabs

### Step 1: Get Your API Key
1. Go to **https://elevenlabs.io/app/settings/api-keys**
2. Click **"Create API Key"** if you don't have one
3. Name it `memorybridge-hackathon`
4. Copy the key (starts with `sk_`)
5. Paste into `backend/.env`:
   ```
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Apply Hackathon Promo Code (if available)
- Go to **Account → Billing → Promo Code**
- The Creator tier gives 100,000 characters/month (~333 demo sessions)
- Free tier is only 10,000 chars/month (~33 demo sessions)

### Step 3: Record the Voice Sample
Record **90 seconds** of the person speaking naturally. Requirements:
- Quiet room, no background music, no fan noise
- WAV format, 44.1kHz (or at least 16kHz)
- Normal conversational speech — tell a story, read a letter
- Save to: `backend/recordings/voice_sample.wav`

**Quality tips:**
- Record 3 takes, pick the cleanest one
- Use a smartphone voice memo app for easy access
- Test playback before uploading — you should hear clear, crisp speech
- No long silences (>3 seconds) or throat-clearing

### Step 4: Clone the Voice (Instant Voice Clone ONLY)

**Option A — Dashboard (easiest):**
1. Go to **https://elevenlabs.io/app/voice-lab**
2. Click **"Add Generative or Cloned Voice"**
3. Select **"Instant Voice Clone"** (not Professional)
4. Name: use the person's name (e.g., "Dorothy")
5. Upload your WAV file
6. Click **"Add Voice"** — takes ~10 seconds
7. Click the voice → click the **settings icon (⚙)** → copy the Voice ID from the URL:
   `https://elevenlabs.io/app/voice-lab/edit/{VOICE_ID_HERE}`
8. Paste into `backend/.env`:
   ```
   ELEVENLABS_VOICE_ID=abc123xxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Quality check:** In Voice Lab, type "I remember the summer we spent at the lake. Those were the best days." and click Generate. The clone should sound like the original recording.

**Option B — Run the provisioning script (automated):**
```bash
cd C:\Users\ASUS\Desktop\memorybridge\backend
python -m app.scripts.provision_el --audio recordings/voice_sample.wav --name "Dorothy"
```
(This script will be created by the `el-provision` agent)

### Step 5: Build and Upload the Knowledge Base

This is done automatically after you have photo captions in Firestore. But for a quick manual test:

1. Collect your photo captions (from the upload flow or write them manually)
2. Run the builder:
   ```python
   from ai.knowledge_base.builder import PhotoMemory, build_knowledge_base
   memories = [
       PhotoMemory(date="1958-07-04", caption="Family picnic at Coyote Creek with Grandma Rose.", era="Childhood (0-18 years)"),
       PhotoMemory(date="1974-06-15", caption="Wedding day at St. Joseph's Church.", era="Family Years (35-60)"),
   ]
   doc = build_knowledge_base("Dorothy", memories)
   print(doc)  # Review before uploading
   ```
3. Upload via API or the provisioning script

Save the KB ID to `backend/.env`:
```
ELEVENLABS_KB_ID=kb_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 6: Create the Conversational Agent

**Option A — Dashboard:**
1. Go to **https://elevenlabs.io/app/conversational-ai**
2. Click **"Create Agent"**
3. Under **Voice**: select "Dorothy" (your cloned voice)
4. Under **Knowledge Base**: attach the document from Step 5
5. Replace the default system prompt with:
   ```
   You are Dorothy's memory companion. Speak in first person, exactly as
   Dorothy would speak when remembering their own life.

   You have access to memories — family photos, important events, and personal
   stories. When someone asks about a memory or photo, respond warmly,
   personally, and in the voice of someone genuinely remembering.

   Guidelines:
   - Always respond in first person ("I remember...", "We went to...")
   - Draw on the knowledge base for specific details (dates, places, names)
   - If you don't know something: "I'm not sure I remember that clearly, but..."
   - Keep responses to 2-4 sentences — conversational, not documentary
   - Speak slowly and clearly — this is for someone who may have difficulty hearing

   Every memory you share is a gift.
   ```
6. Under **First Message**:
   ```
   Hello, I'm here to share some memories with you. What would you like to remember today?
   ```
7. Under **Settings → Voice Settings**:
   - Model: `Turbo v2.5` (lowest latency for real-time conversation)
   - Stability: 0.75
   - Similarity Boost: 0.85
8. Click **Save**
9. Copy the Agent ID from the URL:
   `https://elevenlabs.io/app/conversational-ai/{AGENT_ID_HERE}`

**Add to BOTH .env files:**
```bash
# backend/.env
ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxx

# frontend/.env
VITE_ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxxxxxxxxxxxxxx
```

**These must be the same value.**

### Step 7: Generate Flask Secret Key
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```
Paste output into `backend/.env`:
```
FLASK_SECRET_KEY=<output from above>
```

---

## Part 4: What I Created for You

### Agents Created in `.claude/agents/`

| Agent | Purpose | When to Invoke |
|-------|---------|----------------|
| `el-supervisor` | Master auditor, coordinates all el-* agents, veto authority over deployment | Start of day, before demo, after major changes |
| `el-provision` | Fixes the missing ElevenLabs provisioning route in Flask; handles full voice clone → KB → agent pipeline | When voice_id is null in Firestore, when provisioning fails |
| `el-kb-architect` | Fixes the Firestore subcollection bug in `build_from_firestore()`; manages KB content quality | When agent doesn't know specific memories, KB is empty |
| `el-api-guard` | Validates API keys, monitors quota, handles rate limits, pre-demo health checks | Before demo day, after any 401/429 error, quota warnings |
| `el-widget-integrator` | Fixes the `sendPhotoContext` event bug; ensures widget wires to agent ID; validates env var chain | When widget shows placeholder, photo context isn't delivered |
| `el-qa-validator` | End-to-end QA across all 7 test groups; produces pass/fail report; delegates to right agent | After any el-* agent finishes, morning of demo day |

### Skill Created in `.claude/skills/`

| Skill | Purpose |
|-------|---------|
| `elevenlabs-expert.md` | Corrected production-level API patterns, current model IDs, context injection methods, complete provisioning script |

### How the Agents Communicate

```
el-qa-validator
      │
      │ Finds issues, delegates
      ▼
el-supervisor  ─────────────────────────────────────
      │                                             │
      │ Coordinates                                 │ Veto / approve
      ▼                                             ▼
el-provision     el-kb-architect     el-api-guard   el-widget-integrator
      │                 │                  │                │
      │ Fixes           │ Fixes            │ Monitors       │ Fixes
      ▼                 ▼                  ▼                ▼
 Missing route    Firestore bug      API key/quota    Widget events
 voice clone      KB construction    Rate limits      Context injection
 KB upload        50KB validation    Model IDs        Env var chain
 agent creation   Era mapping        Health checks    CSP headers
```

---

## Part 5: Complete `.env` Reference

### `backend/.env` — Required variables

```bash
# Firebase (already set correctly)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
FIREBASE_STORAGE_BUCKET=memorybridge-h4h-2026.firebasestorage.app

# ElevenLabs — YOU MUST SET ALL 5
ELEVENLABS_API_KEY=sk_...                          # From elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_BASE=https://api.elevenlabs.io/v1  # Already correct, keep as-is
ELEVENLABS_VOICE_ID=...                            # From Step 4 above
ELEVENLABS_KB_ID=...                               # From Step 5 above
ELEVENLABS_AGENT_ID=...                            # From Step 6 above

# Flask — Generate a real key!
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">

# Upload limits (already set)
MAX_UPLOAD_SIZE_MB=10
MAX_PHOTOS=30

# AMD (optional — leave empty for CPU fallback)
AMD_API_KEY=
AMD_ENDPOINT=https://api.amd.com/v1
AMD_EMBEDDING_MODEL=clip-vit-large-patch14
```

### `frontend/.env` — Required variables

```bash
# Firebase (already set correctly — do not change)
VITE_FIREBASE_API_KEY=AIzaSyBMQe8qhTVZmQ9gIUpHjXe0zUkAXIxbsX4
VITE_FIREBASE_AUTH_DOMAIN=memorybridge-h4h-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=memorybridge-h4h-2026
VITE_FIREBASE_STORAGE_BUCKET=memorybridge-h4h-2026.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=556760714344
VITE_FIREBASE_APP_ID=1:556760714344:web:8f1d9cda3fe75d3f853fdd
VITE_FIREBASE_MEASUREMENT_ID=G-3792LH0W46

# Backend
VITE_BACKEND_URL=http://localhost:5000

# ElevenLabs — YOU MUST SET THIS
VITE_ELEVENLABS_AGENT_ID=...    # Same value as ELEVENLABS_AGENT_ID in backend/.env
```

---

## Part 6: Priority Fix Order

### Do this now (30 minutes total):

1. **[5 min]** Get ElevenLabs API key → paste into `backend/.env`
2. **[5 min]** Generate Flask secret key → paste into `backend/.env`
3. **[15 min]** Record 90s voice sample → save to `backend/recordings/voice_sample.wav`
4. **[5 min]** Clone voice in ElevenLabs dashboard → save `ELEVENLABS_VOICE_ID`

### Do this next (45 minutes):

5. **[10 min]** Upload captions as knowledge base → save `ELEVENLABS_KB_ID`
6. **[10 min]** Create conversational agent → save `ELEVENLABS_AGENT_ID`
7. **[5 min]** Set `VITE_ELEVENLABS_AGENT_ID` in `frontend/.env`
8. **[5 min]** Invoke `el-provision` agent to create the missing Flask route
9. **[5 min]** Invoke `el-kb-architect` agent to fix the Firestore subcollection bug
10. **[10 min]** Invoke `el-qa-validator` agent to validate everything

### Fix before demo:

11. Invoke `el-widget-integrator` to fix photo context injection
12. Invoke `el-api-guard` to run pre-demo quota and health check

---

## Part 7: Demo Checklist

Run this before every judging session:

```
□ Backend starts without RuntimeError (FLASK_SECRET_KEY fixed)
□ GET http://localhost:5000/api/health → {"status": "ok"}
□ ElevenLabs API: curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/user → 200
□ Voice ID valid: curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/voices/{VOICE_ID} → 200
□ Agent ID valid: curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/convai/agents/{AGENT_ID} → 200
□ VITE_ELEVENLABS_AGENT_ID is set in frontend/.env
□ Widget loads at http://localhost:5173 (no ConfigurationPlaceholder)
□ Orb click connects within 5 seconds
□ Agent responds in cloned voice
□ Quota remaining: > 5,000 characters (check elevenlabs.io/app/subscription)
```

---

## Troubleshooting

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| Backend crashes on startup | `FLASK_SECRET_KEY` is placeholder | Generate real key with `secrets.token_hex(32)` |
| All ElevenLabs calls return 401 | `ELEVENLABS_API_KEY` empty or invalid | Get key from elevenlabs.io/app/settings/api-keys |
| Widget shows "Voice agent unavailable" | `VITE_ELEVENLABS_AGENT_ID` is empty | Set it to your agent ID from Step 6 |
| Agent doesn't know specific memories | `build_from_firestore()` reads wrong path | Invoke `el-kb-architect` to fix subcollection read |
| Photo selection doesn't change agent context | `elevenlabs-convai:inject_context` not real | Invoke `el-widget-integrator` to fix event |
| voice_id is null in Firestore forever | No provisioning route in Flask | Invoke `el-provision` to create the route |
| Agent speaks in wrong/robotic voice | voice_id not set on agent | PATCH agent with correct voice_id via `update_agent_voice()` |
| Widget connects but no sound | WebRTC blocked by firewall | Use Chrome on localhost; check browser mic permissions |
| Agent responds generically | Knowledge base not attached to agent | Re-create agent with KB via `create_conversational_agent()` |
| 429 Too Many Requests | Rate limit hit | Already handled by `_post_with_retry`; reduce demo frequency |
