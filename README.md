# MemoryVoice

> Giving dementia patients their own voice back.

57 million people live with dementia. They forget their children's names, their wedding days, the sound of their own voice. **MemoryVoice** clones a patient's voice from 90 seconds of home audio, builds a semantic memory graph from family photos using AMD MI300X GPU-accelerated embeddings, and delivers it as an immersive spatial memory room on Apple Vision Pro — where the patient can walk through their past and hear themselves remember.

Built at **Hack for Humanity 2026**, Santa Clara University. Feb 28 – Mar 1, 2026.

---

## What It Does

1. **Family uploads photos + a voice clip** — caregiver uploads up to 30 family photos with captions and a 90-second audio sample of the patient's voice
2. **AI processes the memories** — AMD MI300X generates semantic embeddings for every caption; ElevenLabs clones the voice and builds a conversational knowledge base
3. **Patient enters their Memory Room** — on Apple Vision Pro, floating photo panels are arranged by life era in real 3D space; on browser, a clean 4-column grid organized by life stage
4. **Patient talks to themselves** — gaze at a photo, pinch to select it, and ask a question. The AI responds in the patient's own cloned voice with memories from that era

---

## Demo

Live demo: **https://memorybridge-h4h-2026.web.app**

---

## Architecture

```
  FAMILY / CAREGIVER                        PATIENT
  +-------------------+                  +---------------------------+
  | Upload Portal     |                  | Apple Vision Pro          |
  | - Photos + caps   |                  | WebSpatial SDK            |
  | - 90s voice clip  |                  | Floating photo panels     |
  | - Era tagging     |                  | Gaze + pinch interaction  |
  +--------+----------+                  +-------------+-------------+
           |                                           |
           | HTTPS                                     | WebSocket + HTTPS
           |                                           |
+----------v-------------------------------------------v--------------+
|                      FLASK REST API  (Python 3.11)                  |
|                AMD Developer Cloud  /  CPU fallback                 |
+------+-------------------------+-----------------------------+-------+
       |                         |                             |
       v                         v                             v
+------+--------+   +------------+----------+   +-------------+------+
| ElevenLabs    |   | AMD Instinct MI300X    |   | Firebase           |
|               |   | ROCm + sentence-       |   |                    |
| Instant Voice |   | transformers           |   | Firestore (DB)     |
| Clone (IVC)   |   | 384-dim embeddings     |   | Storage (photos)   |
|               |   | Cosine similarity      |   | Hosting (frontend) |
| Conversational|   | 192 GB HBM3 unified   |   |                    |
| AI Agent      |   | <400ms / 25 photos    |   |                    |
| STT + TTS     |   |                        |   |                    |
| Knowledge Base|   | CPU fallback (same API)|   |                    |
+---------------+   +------------------------+   +--------------------+
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Voice cloning | ElevenLabs Instant Voice Clone | Indistinguishable clone from 90s of audio |
| Conversational AI | ElevenLabs Conversational AI SDK | Built-in STT, TTS, knowledge base, real-time WebSocket |
| GPU inference | AMD Instinct MI300X (ROCm) | 192 GB unified HBM3 — full semantic graph resident in memory |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | 384-dim semantic vectors; ROCm-native; CPU fallback with no code changes |
| Spatial UI | WebSpatial SDK (ByteDance) | Native visionOS from React + Vite — no Swift required |
| Frontend | React + Vite + TypeScript + Tailwind | Fast iteration; WebSpatial is React-native |
| Backend | Flask (Python 3.11) | Thin orchestration layer |
| Database | Firebase Firestore | Real-time sync — photo appears in spatial room in under 1 second |
| File storage | Firebase Storage | Authenticated uploads; CDN delivery for spatial room |
| Hosting | Firebase Hosting | Global CDN; one-command deploy |

---

## Project Structure

```
memoryvoice/
├── frontend/                        # React + Vite + WebSpatial
│   ├── src/
│   │   ├── components/
│   │   │   ├── spatial/             # SpatialMemoryRoom, FallbackRoom, FloatingPhotoPanel
│   │   │   ├── chat/                # VoiceWidget (ElevenLabs)
│   │   │   ├── upload/              # PhotoUpload, VoiceRecorder, ProcessingScreen
│   │   │   └── timeline/            # MemoryCard, MemoryTimeline
│   │   ├── pages/                   # UploadPage, TimelinePage
│   │   ├── hooks/                   # useMemories, useVoiceAgent
│   │   ├── services/                # elevenlabs.ts, firebase.ts
│   │   └── types/                   # Shared TypeScript types
│   ├── .env.example
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── routes/                  # API endpoints
│   │   └── services/
│   │       ├── cloud_store.py       # Firebase Firestore + Storage
│   │       ├── voice_engine.py      # ElevenLabs voice clone + agent
│   │       ├── vector_engine.py     # AMD / CPU embeddings
│   │       ├── ingest.py            # Photo processing pipeline
│   │       └── vault.py             # Knowledge base builder
│   ├── serviceAccount.json          # ← gitignored, never commit
│   ├── .env.example
│   ├── setup_venv.sh
│   └── setup_venv.bat
├── scripts/
│   ├── dev.sh                       # Start both servers locally
│   └── deploy.sh                    # Build + deploy to Firebase
├── firebase.json
├── firestore.rules
├── storage.rules
└── README.md
```

---

## Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.11+ |
| Firebase CLI | latest — `npm install -g firebase-tools` |
| Git | 2+ |
| Xcode *(Mac only)* | 15+ — required for visionOS simulator |

You will also need accounts at:
- **Firebase** (free) — [console.firebase.google.com](https://console.firebase.google.com)
- **ElevenLabs** (free tier works for demo) — [elevenlabs.io](https://elevenlabs.io)
- **AMD Developer Cloud** (request access 3 days early) — [devcloud.amd.com](https://devcloud.amd.com)

> The app runs fully on CPU fallback without AMD — same features, ~8× slower embedding.

---

### Step 1 — Clone

```bash
git clone https://github.com/YOUR_USERNAME/memoryvoice.git
cd memoryvoice
```

---

### Step 2 — Environment variables

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

**`frontend/.env`**
```env
VITE_FIREBASE_API_KEY=<Firebase Console → Project Settings → Web App>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
VITE_FIREBASE_APP_ID=<from Firebase Console>
VITE_API_URL=http://localhost:5000
VITE_ELEVENLABS_AGENT_ID=<ElevenLabs → Conversational AI → Agent ID>
VITE_WEBSPATIAL_ENABLED=true
```

**`backend/.env`**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
ELEVENLABS_API_KEY=sk_...
AMD_API_KEY=          # leave empty to use CPU fallback
AMD_ENDPOINT=https://api.amd.com/v1
FLASK_SECRET_KEY=<random 32-char string>
```

Download your Firebase service account key:
**Firebase Console → Project Settings → Service Accounts → Generate new private key**
Save as `backend/serviceAccount.json` — gitignored, never commit it.

---

### Step 3 — Install frontend

```bash
cd frontend && npm install
```

---

### Step 4 — Install backend

```bash
# Mac / Linux
chmod +x backend/setup_venv.sh && ./backend/setup_venv.sh

# Windows
backend\setup_venv.bat
```

---

### Step 5 — Run locally

```bash
# Mac / Linux
chmod +x scripts/dev.sh && ./scripts/dev.sh

# Windows — two terminals
# Terminal 1:
cd backend && .venv\Scripts\activate && flask run --host=0.0.0.0 --port=5000
# Terminal 2:
cd frontend && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/api/health |

---

### Step 6 — Deploy

```bash
chmod +x scripts/deploy.sh && ./scripts/deploy.sh
```

---

## How the Gallery Works

### Browser (any device)
4-column grid — one column per life stage. Photos snap to their era and stack vertically. A voice widget at the bottom center connects to the ElevenLabs agent.

```
[ CHILDHOOD ] [ YOUNG ADULT ] [ FAMILY YEARS ] [  RECENT  ]
[ 0–18 yrs  ] [ 18–35 yrs   ] [ 35–60 yrs    ] [ 60+ yrs  ]
[  Photo 1  ] [   Photo 1   ] [   Photo 1    ] [  Photo 1 ]
[  Photo 2  ] [   Photo 2   ] [   Photo 2    ] [  Photo 2 ]

                    [ 🎙 Voice Companion ]
```

### Apple Vision Pro (WebSpatial)
When the WebSpatial runtime sets `is-spatial` on `<html>`, the app switches to floating glass panels suspended in real 3D space. Eras are separated by Z-depth — childhood is farthest away, recent is closest. Gaze at a panel for 1.5 seconds to expand it, then pinch to hear the memory narrated in the patient's own voice.

---

## Ethical Design

**Consent** — Voice cloning requires explicit authorization from the patient's legal guardian. We clone the patient's own preserved voice — not anyone else's.

**Access control** — Firebase Security Rules enforce authenticated write access. Only verified family members can add or modify memories.

**Distress detection** — The ElevenLabs agent system prompt monitors for distress signals and pivots to a calming phrase if detected.

**Data minimization** — We store photo captions (not photos on the AI server), a voice ID (not the raw recording), and session IDs (not linked to medical records).

Reminiscence therapy using personal memories is clinically validated (Woods et al., Cochrane Review, 2018). MemoryVoice does not claim to treat or diagnose dementia.

---

## Team

| Name | Role | Class |
|---|---|---|
| [Name 1] | AI / Backend | 2029 |
| [Name 2] | Frontend / WebSpatial | 2029 |
| [Name 3] | Design / UX | 2029 |
| [Name 4] | DevOps / Firebase | 2029 |

---

## License

MIT — see LICENSE for details.

---

*Built with urgency and care at Hack for Humanity 2026, Santa Clara University.*
