# MemoryVoice — Developer Setup Guide

Complete step-by-step instructions for getting MemoryVoice running locally.

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 18.x | https://nodejs.org |
| npm | 9.x (comes with Node) | — |
| Python | 3.11 | https://python.org |
| Git | 2.x | https://git-scm.com |
| Firebase CLI | latest | `npm install -g firebase-tools` |
| Xcode (Mac only) | 15+ | App Store (for visionOS simulator) |

---

## Step 1 — Clone and Enter the Project

```bash
git clone https://github.com/YOUR_USERNAME/memoryvoice.git
cd memoryvoice
```

---

## Step 2 — Firebase Project Setup

### 2a. Create the project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Project name: `memoryvoice-h4h-2026`
4. Disable Google Analytics (not needed for demo)
5. Click "Create project"

### 2b. Enable required services

In the Firebase console sidebar:

**Firestore:**
1. Build → Firestore Database → Create database
2. Select "Start in test mode" (we apply proper rules via CLI)
3. Choose region: `us-central1`

**Storage:**
1. Build → Storage → Get started
2. Select "Start in test mode"
3. Same region as Firestore: `us-central1`

**Hosting:**
1. Build → Hosting → Get started
2. Follow the prompts (we configure via `firebase.json`)

**Authentication (optional for demo):**
1. Build → Authentication → Get started
2. Sign-in method → Email/Password → Enable

### 2c. Get your web app config

1. Project Settings (gear icon) → General tab
2. Scroll to "Your apps" → click the web icon `</>`
3. Register app name: `memoryvoice-web`
4. Copy the `firebaseConfig` object values into `frontend/.env`

### 2d. Download service account key

1. Project Settings → Service Accounts tab
2. Click "Generate new private key"
3. Save the downloaded file as `backend/serviceAccount.json`
4. Confirm it is in `.gitignore` (it is — never commit this file)

### 2e. Deploy Firebase rules

```bash
firebase login
firebase use memoryvoice-h4h-2026
firebase deploy --only firestore:rules,storage
```

---

## Step 3 — ElevenLabs Setup

### 3a. Create account

1. Go to https://elevenlabs.io
2. Sign up for a free or paid account

### 3b. Clone a voice (optional but recommended for demo)

1. ElevenLabs dashboard → Voices → Add Voice → Instant Voice Clone
2. Upload 1-3 minute audio sample of the loved one's voice
3. Note the Voice ID

### 3c. Create a Conversational AI Agent

1. ElevenLabs dashboard → Conversational AI → Create Agent
2. Configure the agent:
   - Name: "MemoryVoice Companion"
   - Voice: select the cloned voice (or a default)
   - System prompt: (use the prompt from `backend/app/services/` — check the ElevenLabs service file)
3. Note the Agent ID → add to `frontend/.env` as `VITE_ELEVENLABS_AGENT_ID`

### 3d. Get API key

1. ElevenLabs dashboard → Settings → API Keys
2. Create new key → copy it
3. Add to `backend/.env` as `ELEVENLABS_API_KEY`

---

## Step 4 — AMD Developer Cloud Account

AMD MI300X access requires pre-approval (allow 3 business days).

### 4a. Apply for access (do this ASAP)

1. Go to https://devcloud.amd.com
2. Click "Sign Up" or "Request Access"
3. Select "Instinct MI300X" as the hardware you need
4. Use your university or personal email
5. Describe your use case: "Hackathon project — real-time CLIP image embeddings for dementia care app"

### 4b. While waiting for approval

The backend falls back to CPU-based inference automatically when `AMD_API_KEY` is empty.
CPU inference is slower but functional for development and demo preparation.

### 4c. Once approved

1. Log into AMD Developer Cloud dashboard
2. Find your API key and endpoint URL
3. Add to `backend/.env`:
   ```
   AMD_API_KEY=your_key_here
   AMD_ENDPOINT=https://api.amd.com/v1
   ```

---

## Step 5 — Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

Open `frontend/.env` and fill in:

```env
VITE_FIREBASE_API_KEY=<from Firebase console — step 2c>
VITE_FIREBASE_AUTH_DOMAIN=memoryvoice-h4h-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=memoryvoice-h4h-2026
VITE_FIREBASE_STORAGE_BUCKET=memoryvoice-h4h-2026.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<from Firebase console>
VITE_FIREBASE_APP_ID=<from Firebase console>
VITE_BACKEND_URL=http://localhost:5000
VITE_ELEVENLABS_AGENT_ID=<from ElevenLabs — step 3c>
VITE_WEBSPATIAL_ENABLED=false   # set true only on Mac with Xcode
```

Then install dependencies:

```bash
cd frontend
npm install
```

---

## Step 6 — Backend Environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your keys (see step 2d, 3d, 4c above).

Set up the Python virtual environment:

```bash
# Unix / Mac
chmod +x backend/setup_venv.sh
./backend/setup_venv.sh

# Windows
backend\setup_venv.bat
```

---

## Step 7 — Run Locally

### Option A — Single script (Unix/Mac)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### Option B — Manual (works on Windows too)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend

# Unix/Mac:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate.bat

flask run --host=0.0.0.0 --port=5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Access the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Backend health check: http://localhost:5000/api/health

---

## Step 8 — visionOS Simulator (Mac with Apple Silicon only)

```bash
# Install Xcode command line tools
xcode-select --install

# Download Xcode from App Store (requires ~15 GB disk space)
# After install, open Xcode:
# Xcode → Settings → Components → visionOS Simulator → Download

# Test WebSpatial example
git clone https://github.com/webspatial/quick-example /tmp/ws-test
cd /tmp/ws-test && npm install && npm run dev
```

---

## Troubleshooting

### "Permission denied" on .sh scripts

```bash
chmod +x scripts/dev.sh scripts/deploy.sh backend/setup_venv.sh
```

### Flask: "No module named flask"

The venv is not activated. Run:
```bash
source backend/.venv/bin/activate   # Unix/Mac
backend\.venv\Scripts\activate.bat  # Windows
```

### Vite: "VITE_FIREBASE_API_KEY is not defined"

The frontend `.env` file does not exist or has wrong variable names. Confirm:
```bash
cat frontend/.env | grep VITE_FIREBASE_API_KEY
```

### Firebase: "Missing or insufficient permissions"

Firestore rules have not been deployed yet. Run:
```bash
firebase deploy --only firestore:rules,storage
```

### CORS errors in browser console

The Flask backend's CORS origins do not include your frontend URL.
Check `CORS_ORIGINS` in `backend/.env` — add `http://localhost:5173`.

### AMD endpoint returning 401

Your `AMD_API_KEY` is incorrect or the account is not yet approved.
Leave `AMD_API_KEY` empty in `.env` to use CPU fallback automatically.

### "serviceAccount.json not found"

Download from Firebase Console → Project Settings → Service Accounts → Generate new private key.
Save as `backend/serviceAccount.json`.
