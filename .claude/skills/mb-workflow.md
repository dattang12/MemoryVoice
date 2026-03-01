# MemoryBridge — Master Build Workflow
# H4H 2026 | Feb 28 - Mar 1 | 22 Hours to Champion

---

## THE SYSTEM: 12 Specialized Agents

```
ORCHESTRATION LAYER
  └── mb-orchestrator      (conductor — owns phase gates, risk, sequencing)

BUILD LAYER (parallel execution)
  ├── mb-frontend          (React + Vite + Upload UI + Timeline)
  ├── mb-spatial           (WebSpatial SDK + 3D Memory Room)
  ├── mb-voice             (ElevenLabs Clone + Conversational Agent)
  ├── mb-backend           (Flask REST API + Firebase integration)
  └── mb-compute           (AMD GPU + Embeddings + Semantic Graph)

QUALITY LAYER
  ├── mb-reviewer          (code review after each phase)
  ├── mb-debugger          (error resolution)
  └── mb-tester            (integration + E2E tests)

LAUNCH LAYER
  ├── mb-devops            (Firebase Hosting + GitHub + ENV config)
  ├── mb-polisher          (loading states + animations + UX polish)
  └── mb-demo              (Devpost + demo script + rehearsal)
```

---

## PROJECT DIRECTORY STRUCTURE

```
memorybridge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── upload/
│   │   │   │   ├── PhotoUpload.tsx          # mb-frontend
│   │   │   │   ├── VoiceRecorder.tsx        # mb-frontend
│   │   │   │   └── ProcessingScreen.tsx     # mb-polisher
│   │   │   ├── timeline/
│   │   │   │   ├── MemoryTimeline.tsx       # mb-frontend
│   │   │   │   └── MemoryCard.tsx           # mb-frontend
│   │   │   ├── spatial/
│   │   │   │   ├── SpatialMemoryRoom.tsx    # mb-spatial
│   │   │   │   ├── FloatingPhotoPanel.tsx   # mb-spatial
│   │   │   │   ├── MemoryOrb.tsx            # mb-spatial
│   │   │   │   └── FallbackRoom.tsx         # mb-spatial
│   │   │   └── chat/
│   │   │       └── VoiceWidget.tsx          # mb-voice
│   │   ├── hooks/
│   │   │   ├── useFirebase.ts               # mb-frontend
│   │   │   ├── useMemories.ts               # mb-frontend
│   │   │   └── useVoiceAgent.ts             # mb-voice
│   │   ├── services/
│   │   │   ├── api.ts                       # mb-frontend
│   │   │   ├── firebase.ts                  # mb-frontend
│   │   │   └── elevenlabs.ts                # mb-voice
│   │   ├── types/
│   │   │   └── index.ts                     # mb-frontend (define first)
│   │   └── App.tsx
│   ├── index.html                           # mb-voice (widget script)
│   ├── package.json
│   └── vite.config.ts                       # mb-spatial (WebSpatial plugin)
│
├── backend/
│   ├── app/
│   │   ├── __init__.py                      # mb-backend (app factory)
│   │   ├── routes/
│   │   │   ├── upload.py                    # mb-backend
│   │   │   ├── memories.py                  # mb-backend
│   │   │   └── embeddings.py               # mb-backend + mb-compute
│   │   ├── services/
│   │   │   ├── firebase_service.py          # mb-backend
│   │   │   ├── elevenlabs_service.py        # mb-voice
│   │   │   └── amd_service.py               # mb-compute
│   │   └── models/
│   │       └── memory.py                    # mb-backend
│   ├── tests/
│   │   ├── test_upload.py                   # mb-tester
│   │   ├── test_memories.py                 # mb-tester
│   │   └── test_integration.py              # mb-tester
│   ├── requirements.txt                     # mb-backend
│   ├── .env.example                         # mb-devops
│   └── run.py                               # mb-backend
│
├── ai/
│   ├── embeddings/
│   │   ├── generate.py                      # mb-compute
│   │   ├── semantic_graph.py                # mb-compute
│   │   └── retrieval.py                     # mb-compute
│   └── knowledge_base/
│       └── builder.py                       # mb-voice
│
├── firebase.json                            # mb-devops
├── firestore.rules                          # mb-devops
├── storage.rules                            # mb-devops
├── .gitignore                               # mb-devops
└── README.md                                # mb-demo
```

---

## 22-HOUR BUILD TIMELINE WITH AGENT ASSIGNMENTS

### PRE-HACKATHON (Feb 17-27) — mb-devops + mb-voice

**Feb 17 (TODAY — CRITICAL):**
```
mb-devops:  Apply AMD Developer Cloud (devcloud.amd.com) — 3-day approval
mb-devops:  Create Firebase project (memorybridge-h4h-2026)
mb-voice:   Create ElevenLabs account + test voice clone with test audio
mb-devops:  Verify Mac with Apple Silicon available for WebSpatial
```

**Feb 18-22:**
```
mb-devops:  Install Xcode + visionOS Simulator (large download)
mb-spatial: Run WebSpatial quick-example locally
mb-voice:   Test ElevenLabs agent with custom knowledge base
mb-compute: Test AMD Developer Cloud account (if approved)
mb-backend: Set up Flask + Firebase Admin SDK boilerplate
```

**Feb 25-27 (Dry Run):**
```
mb-tester:  Full pipeline dry run (upload → clone → spatial → converse)
mb-voice:   Prepare DEMO AUDIO (90-120s clean WAV recording)
mb-demo:    Prepare demo photo set (20-30 photos with dates)
mb-devops:  Test Firebase Hosting deploy
mb-devops:  Create private GitHub repo (goes public after 10AM Feb 28)
```

---

### PHASE 1: FOUNDATION (Hours 0-4 | 11AM-3PM Feb 28)
**Goal: Every component starts and connects**

**PARALLEL LAUNCH AT 11AM:**

```
mb-frontend [P1-A] CRITICAL
  Task: React + Vite + Tailwind setup
  Deliverable: Dev server on localhost:5173
  Done when: App.tsx renders MemoryBridge title
  Time box: 30 minutes

mb-backend [P1-B] CRITICAL
  Task: Flask app factory + Firebase Admin SDK
  Deliverable: API server on localhost:5000
  Done when: GET /health returns {"status":"ok"}
  Time box: 30 minutes

mb-voice [P1-C] HIGH
  Task: ElevenLabs first voice clone + agent creation
  Deliverable: voice_id + agent_id stored in .env
  Done when: Agent responds to text message
  Time box: 60 minutes

mb-spatial [P1-D] HIGH
  Task: WebSpatial hello world + visionOS Simulator check
  Deliverable: Single floating box in browser
  Done when: <Space> element renders without errors
  Time box: 60 minutes

mb-devops [P1-E] HIGH
  Task: .env files + .gitignore + Firebase project config
  Deliverable: Both frontend and backend read from .env
  Done when: No secrets in source code
  Time box: 30 minutes
```

**3PM: AMD Workshop — ALL HANDS. Get AMD account + endpoint URL.**

**Phase 1 Gate (mb-reviewer runs):**
```
[ ] localhost:5173 renders (no crash)
[ ] localhost:5000/health returns 200
[ ] No secrets in source files
[ ] WebSpatial hello world visible
[ ] voice_id exists in .env
→ GO: Advance to Phase 2
```

---

### PHASE 2: CORE FEATURES (Hours 4-10 | 3PM-9PM Feb 28)
**Goal: Each technology works independently**

**PARALLEL LAUNCH AFTER AMD WORKSHOP:**

```
mb-frontend [P2-A] CRITICAL
  Task: PhotoUpload + VoiceRecorder + MemoryTimeline
  Done when: User can select 5 photos + captions, record audio, see preview
  Skill: mb-react-upload

mb-backend [P2-B] CRITICAL
  Task: POST /api/upload + GET /api/memories/:id
  Done when: Upload 3 photos → Firestore document + Storage URLs exist
  Skill: mb-flask, mb-firebase

mb-voice [P2-C] CRITICAL
  Task: ElevenLabs agent with knowledge base + voice widget embed
  Done when: Agent answers "What happened in 1987?" from KB
  Skill: mb-elevenlabs

mb-compute [P2-D] HIGH
  Task: AMD endpoint + single embedding + cosine similarity
  Done when: Caption → 384-dim vector returned from AMD (or CPU fallback)
  Skill: mb-amd-compute

mb-spatial [P2-E] HIGH
  Task: Multi-panel spatial room (5+ photos floating by era)
  Done when: 5 FloatingPhotoPanels render at correct Z-depth
  Skill: mb-webspatial
```

**6PM: DINNER BREAK — mandatory 30 minutes**

**Phase 2 Gate (mb-tester runs T1-T4):**
```
[ ] POST /api/upload returns memory_id
[ ] Photos appear in Firebase Storage
[ ] AMD embedding endpoint returns vector
[ ] ElevenLabs agent answers from knowledge base
[ ] 3+ panels visible in spatial room
→ GO: Advance to Phase 3
```

---

### PHASE 3: INTEGRATION SPRINT (Hours 10-16 | 9PM-3AM)
**Goal: The full pipeline works end-to-end**

**PARALLEL LAUNCH:**

```
mb-backend [P3-A] CRITICAL
  Task: POST /api/embed → AMD batch job → Firestore update
        Firebase real-time sync (photos appear without refresh)
  Done when: New photo upload → appears in spatial room in <3s

mb-voice [P3-B] CRITICAL
  Task: Swap agent voice to cloned voice_id
        Photo selection → agent narrates that specific photo
  Done when: Click wedding photo → agent says "May 3rd, 1974..."

mb-spatial [P3-C] CRITICAL
  Task: Photo tap/pinch → trigger VoiceAgent with photo context
        Memory panel click handler complete
  Done when: Any panel click → voice responds about that memory

mb-frontend [P3-D] HIGH
  Task: ProcessingScreen with stage indicators
        MemoryTimeline showing real data from Firestore
  Done when: Upload → "Building memory..." → timeline populated

mb-reviewer [P3-E] HIGH (runs in parallel with build agents)
  Task: Code review all Phase 1 + 2 output
  Done when: All CRITICAL issues fixed, HIGH issues reported
```

**3AM: RAMEN BREAK — mandatory**

**Phase 3 Gate (mb-tester runs T5-T9 + demo path once):**
```
[ ] Upload 5 photos → spatial room shows all 5
[ ] Click any photo → voice responds with photo details
[ ] Cloned voice audibly similar to original
[ ] Real-time sync: new photo appears without refresh
[ ] Full 4-minute demo path runs without errors
→ GO: Advance to Phase 4
```

---

### PHASE 4: POLISH + LAUNCH (Hours 16-22 | 3AM-9AM Mar 1)
**Goal: Demo-ready. Submitted. Champion.**

**PARALLEL LAUNCH:**

```
mb-polisher [P4-A] CRITICAL
  Task: Loading states (upload, processing, spatial load)
        Error states (upload fail, AMD timeout, voice unavailable)
        Page entrance animations
        Empty state for new users
  Done when: Zero visible "nothing happening" moments in demo path

mb-demo [P4-B] CRITICAL
  Task: Devpost all fields complete
        GitHub README complete
        6 screenshots taken
        Demo script rehearsed 3x consecutively without errors
  Done when: Devpost saved as draft (submit at 8:30AM)

mb-devops [P4-C] HIGH
  Task: Firebase Hosting deploy
        GitHub repo public (after 10AM rule — set to auto-public)
        Final .env verification (no secrets committed)
  Done when: https://memorybridge-h4h-2026.web.app loads the app

mb-debugger [P4-D] HIGH
  Task: Fix any remaining issues from mb-reviewer report
        Final bug sweep of demo path
  Done when: Zero console errors during 4-minute demo path
```

**6-7AM: MANDATORY SLEEP WINDOW — no exceptions**
**7-8AM: Final Devpost writeup + screenshots**
**8-8:30AM: Attend Devpost Q&A session**
**8:30AM: Submit Devpost**
**9:00AM HARD DEADLINE**

---

## QUALITY GATES SUMMARY

```
After Phase 1 → mb-reviewer: security check + type safety
After Phase 2 → mb-tester: T1-T4 integration suite
After Phase 3 → mb-tester: T5-T9 + demo path once
After Phase 4 → mb-demo: demo path 3x consecutive → SUBMIT
```

---

## AGENT INVOCATION GUIDE

When you hit a situation, invoke the right agent:

| Situation | Invoke |
|-----------|--------|
| Starting a new phase | `mb-orchestrator` |
| Building React components | `mb-frontend` |
| Working on 3D spatial room | `mb-spatial` |
| ElevenLabs / voice work | `mb-voice` |
| Flask API / Firebase backend | `mb-backend` |
| AMD embeddings / semantic graph | `mb-compute` |
| Code review before advancing phase | `mb-reviewer` |
| Got an error / something broke | `mb-debugger` |
| Running integration tests | `mb-tester` |
| Deploy / GitHub / ENV setup | `mb-devops` |
| Loading states / animations | `mb-polisher` |
| Devpost / demo prep | `mb-demo` |

---

## FALLBACK DECISION POINTS

```
Hour 0: AMD not approved?
  → mb-compute switches to local CPU sentence-transformers
  → Note in Devpost: "AMD in production — demo uses CPU fallback"
  → Still wins AMD prize if framing is right

Hour 0: No Mac with Apple Silicon?
  → mb-spatial builds FallbackRoom (CSS 3D, full feature parity)
  → Demo from browser instead of Vision Pro
  → Still viable for WebSpatial prize (web spatial mode)

Hour 4: Voice clone sounds robotic?
  → mb-voice re-records with 90-120s WAV in quiet room
  → If still fails: use ElevenLabs "Aria" voice with warm persona
  → Demo continues — conversational Q&A still impressive

Hour 12: ElevenLabs credits running low?
  → mb-voice pre-records 5 "demo responses" as MP3 files
  → Spatial room: hardcoded responses play for specific photos
  → Live Q&A: 1 real call per judging session

Hour 18: Something fundamentally broken?
  → mb-orchestrator: activate fallback tier
  → Minimum viable: ElevenLabs agent + photo upload + voice Q&A
  → Still wins: Best Freshman Hack + Best ElevenLabs ($2,980+)
```

---

## PRIZE TARGETING CHECKLIST

Before final submission, verify each prize:

**Best Freshman Hack ($1,000)**
```
[ ] All team members confirm graduation year 2029 in Devpost
[ ] Product is functional (not just a demo slide)
[ ] Design is polished (mb-polisher Phase 4)
```

**Best ElevenLabs ($1,980/member)**
```
[ ] Voice cloning demo is live (not pre-recorded)
[ ] Conversational AI agent responds in cloned voice
[ ] Devpost explicitly: "voice IS the therapeutic intervention"
[ ] Frame: "agentic memory companion" language
```

**Best AMD Tech ($1,000)**
```
[ ] AMD MI300X used for semantic embeddings (log timing as evidence)
[ ] Include timing data in Devpost: "25 embeddings in Xms on MI300X"
[ ] Frame: "privacy-first — memories never leave AMD secure compute"
[ ] Note ROCm stack usage
```

**Best WebSpatial ($1,000)**
```
[ ] Photos float in 3D space (WebSpatial or CSS 3D fallback)
[ ] Era-based depth positioning (childhood → recent)
[ ] Gaze/click → voice interaction working
[ ] Screenshot of spatial room in Devpost
```

**Future Unicorn ($1,000)**
```
[ ] $350B eldercare market mentioned in pitch
[ ] $39/month family OR $299/resident/month business model stated
[ ] "15,000 memory care facilities" in US stat included
[ ] Acquisition targets named (Honor, Amedisys, Apple Healthcare)
```

**Responsible AI ($750)**
```
[ ] Consent model explained (family-mediated)
[ ] Clinical alignment: reminiscence therapy reference
[ ] "Digital preservation of personhood, not simulation" framing
[ ] NOT "replacing" the person — "preserving their voice"
```

---

## WINNING MINDSET

> Every judge criterion is a checkbox. Technology: 5 sponsor technologies used correctly.
> Polish: mb-polisher owns this. Innovativeness: voice IS the data representation (protocol-level).
> Social Impact: 57 million people. We tested with real families.

The demo is the product. The product is the demo. Build for the 4-minute window.
