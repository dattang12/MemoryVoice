# MemoryBridge Test Checklist

Pre-submission verification document. Complete all sections before the demo.
Run the demo path test 3 times consecutively with zero failures before submitting to Devpost.

---

## 1. Backend API Checks (curl commands)

Run these from a terminal while the Flask server is running on port 5000.

### Health check
```bash
curl -s http://localhost:5000/api/health | python -m json.tool
# Expected: {"status": "ok", "service": "memorybridge-backend"}
```

### Upload 3 test photos
```bash
curl -s -X POST http://localhost:5000/api/upload \
  -F "person_name=Margaret Chen" \
  -F "photos[]=@/path/to/photo1.jpg;type=image/jpeg" \
  -F "photos[]=@/path/to/photo2.jpg;type=image/jpeg" \
  -F "photos[]=@/path/to/photo3.jpg;type=image/jpeg" \
  -F "voice_recording=@/path/to/voice.wav;type=audio/wav" \
  -F "captions[]=Wedding day 1974" \
  -F "captions[]=Family reunion 1985" \
  -F "captions[]=Grandkids 2020" | python -m json.tool
# Expected: {"memory_id": "<uuid>", "status": "processing"}
```

### Trigger embedding (replace MEMORY_ID with value from upload response)
```bash
export MEMORY_ID="<uuid-from-upload>"
curl -s -X POST http://localhost:5000/api/embed \
  -H "Content-Type: application/json" \
  -d "{\"memory_id\": \"$MEMORY_ID\"}" | python -m json.tool
# Expected: {"status": "queued", "memory_id": "...", "photo_count": 3}
```

### Retrieve memory
```bash
curl -s http://localhost:5000/api/memories/$MEMORY_ID | python -m json.tool
# Expected: full memory object with id, person_name, photos[], embedding_ready, voice_id
```

### List memories
```bash
curl -s "http://localhost:5000/api/memories?limit=10&offset=0" | python -m json.tool
# Expected: {"memories": [...], "total": N}
```

### Verify 404 for unknown memory
```bash
curl -s http://localhost:5000/api/memories/00000000-0000-0000-0000-000000000000 | python -m json.tool
# Expected: {"error": "not_found", "detail": "..."}
```

### Verify 400 for invalid upload (no photos)
```bash
curl -s -X POST http://localhost:5000/api/upload \
  -F "person_name=Test" \
  -F "voice_recording=@/path/to/voice.wav" | python -m json.tool
# Expected: {"error": "validation_failed", "detail": "...photo..."}
```

### Verify 400 for unsupported file type
```bash
curl -s -X POST http://localhost:5000/api/upload \
  -F "person_name=Test" \
  -F "photos[]=@/path/to/test.gif;type=image/gif" \
  -F "voice_recording=@/path/to/voice.wav" \
  -F "captions[]=Caption" | python -m json.tool
# Expected: {"error": "validation_failed", "detail": "...gif..."}
```

### CORS preflight check
```bash
curl -s -X OPTIONS http://localhost:5000/api/upload \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -D - | grep -i "access-control"
# Expected: Access-Control-Allow-Origin: http://localhost:5173
```

---

## 2. Automated Test Suite

### Run all integration tests
```bash
cd /c/Users/ASUS/Desktop/memorybridge/backend
pytest tests/test_integration.py -v -m integration
```

### Run all unit tests
```bash
pytest tests/ -v --tb=short
```

### Run demo path simulation
```bash
pytest tests/test_demo_path.py -v --tb=short
```

### Run preflight check 3 times consecutively
```bash
# Requires pytest-repeat: pip install pytest-repeat
pytest tests/test_demo_path.py::test_demo_preflight_all_components_green -v --count=3

# Without pytest-repeat, run manually 3 times:
for i in 1 2 3; do
  echo "=== RUN $i ==="
  pytest tests/test_demo_path.py::test_demo_preflight_all_components_green -v --tb=short
done
```

### Run with coverage report
```bash
pytest tests/ --cov=app --cov-report=term-missing --cov-fail-under=70
```

---

## 3. Frontend Manual Checks

Complete these checks in a browser at http://localhost:5173 (Vite dev server).

### Upload Flow
- [ ] Home screen loads without console errors
- [ ] Photo upload drag-and-drop zone is visible and labeled
- [ ] Drag 1 photo onto the drop zone — file appears in preview list
- [ ] Drag 5 photos at once — all 5 appear in the preview list
- [ ] Attempt to drag a .gif file — error message appears ("unsupported format")
- [ ] Attempt to drag a file >10 MB — error message appears ("file too large")
- [ ] Person name input field accepts text
- [ ] Submitting with empty person_name field shows validation error
- [ ] VoiceRecorder component is visible below the photo drop zone
- [ ] Clicking the record button starts recording (waveform or timer appears)
- [ ] Clicking stop saves the recording (audio preview appears)

### Processing Screen
- [ ] After upload, ProcessingScreen appears immediately
- [ ] Progress indicator or spinner is visible
- [ ] Status message updates (e.g., "Building your memory...")
- [ ] Screen does not freeze for more than 3 seconds

### Memory Timeline
- [ ] After processing completes, MemoryTimeline renders
- [ ] Photos appear grouped by era (childhood, young-adult, family, recent)
- [ ] Photos are sorted with oldest era at the top
- [ ] Captions appear below each photo thumbnail
- [ ] Clicking a photo opens a detail view or triggers voice narration

### Voice Widget
- [ ] VoiceWidget / ElevenLabs widget appears in the bottom corner
- [ ] Widget is clickable and opens the conversational agent
- [ ] Clicking the widget shows the agent is active (not loading indefinitely)

### Error States
- [ ] Upload a file that is completely empty — error message is shown
- [ ] Simulate network error (disconnect Wi-Fi during upload) — error message appears, no crash
- [ ] Navigate to a non-existent memory URL — 404 page or error message shown

### Loading Skeletons
- [ ] While photos are loading, skeleton placeholder cards appear
- [ ] Skeletons disappear once data loads
- [ ] No layout shift after skeletons are replaced with real content

---

## 4. Spatial Room Checks (Browser CSS 3D Fallback)

These checks run in a desktop browser where XR is unavailable.

- [ ] Open /spatial/:memoryId in the browser
- [ ] FloatingPhotoPanel components are visible (CSS 3D transforms or flat fallback)
- [ ] Each panel shows the correct photo and caption
- [ ] No console errors in the browser devtools
- [ ] FallbackRoom activates automatically if XRSystem is unavailable (check console log)
- [ ] Clicking a FloatingPhotoPanel triggers a visible state change (highlight, scale, etc.)
- [ ] Panels for "childhood" era appear visually distinct from "recent" era panels
- [ ] Panels do not fully overlap (max 20% overlap between adjacent panels)

### visionOS Simulator Checks (Apple Silicon Mac required)

- [ ] Panels float at correct Z-depth: childhood farthest, recent closest
- [ ] Gaze at a panel — scale animation triggers within 300ms
- [ ] Pinch gesture on a panel — voice agent receives photo context and responds
- [ ] Head movement in the simulator — subtle parallax effect on panels
- [ ] Multiple panels open simultaneously — no panels overlap >20%
- [ ] Pinch-to-close gesture dismisses the focused panel

---

## 5. ElevenLabs Voice Checks

- [ ] Open ElevenLabs dashboard — cloned voice appears in the Voices list
- [ ] Play the original voice recording in the app
- [ ] Play the cloned voice — it should sound noticeably similar to the original
- [ ] Open the Conversational AI agent page in ElevenLabs
- [ ] Verify the agent is using the cloned voice_id (not a default ElevenLabs voice)
- [ ] Send a test message to the agent: "What is your first memory?"
  - Response must be in first person ("I remember...")
  - Response must be 2-4 sentences
  - Response must reference content from the knowledge base
- [ ] Send an unknown question: "What is the capital of France?"
  - Response must gracefully redirect: "I'm not sure I remember that..."
- [ ] Ask: "Where did we go on our honeymoon?"
  - If not in knowledge base: "I'm not sure I remember that clearly..."
  - If in knowledge base: accurate first-person answer

---

## 6. Firebase Checks

- [ ] Firebase console — Storage bucket contains uploaded photos under memories/:id/photos/
- [ ] Firebase console — Storage bucket contains voice recording under memories/:id/voice/
- [ ] Firestore — document exists at memories/:id with correct schema
- [ ] Firestore — document fields: person_name, created_at, status, voice_id, embedding_ready, photos[]
- [ ] Firestore — after embedding completes: status="ready", embedding_ready=true
- [ ] Firestore — each photo sub-document has embedding field with 1024-float array
- [ ] Firebase console — no security rule violations in the logs

---

## 7. AMD Embedding Checks

- [ ] Check backend logs during embedding — look for "[AMD MI300X]" log lines
- [ ] If AMD_ENDPOINT is set: verify AMD logs show "<200ms" latency
- [ ] If AMD_ENDPOINT is empty/unreachable: verify "[CPU fallback]" log lines appear
- [ ] Verify CPU fallback embeddings are 1024-dimensional (check Firestore)
- [ ] Verify embedding values are not all zero (non-trivial fallback)

---

## 8. Demo Path Timing Checklist (4-Minute Judge Demo)

Time each step with a stopwatch. The total must be under 4 minutes.

| Time   | Action                                                             | Pass Criteria                              |
|--------|--------------------------------------------------------------------|--------------------------------------------|
| 0:00   | Open web app                                                       | Home screen visible < 2s                  |
| 0:10   | Drag in 5 demo photos                                              | All 5 photos appear in preview list        |
| 0:20   | Select demo voice recording                                        | Audio preview appears, waveform visible    |
| 0:30   | Click "Build Memory" / upload button                               | ProcessingScreen appears immediately       |
| 1:00   | Show "Building your memory..." screen to judges                    | Status message updating                    |
| 1:10   | Play original voice recording                                      | Audio plays clearly                        |
| 1:25   | Play cloned voice (via ElevenLabs widget or preview)               | Voice sounds similar to original           |
| 1:45   | Click "Open Memory Room" or navigate to /spatial/:id               | Spatial room opens, panels visible         |
| 2:00   | Show era-grouped panels floating to judges                         | 5 panels visible, era labels visible       |
| 2:30   | Touch/click the wedding photo panel                                | Agent activates, response starts           |
| 2:45   | Agent narrates the wedding memory (listen)                         | First-person response, < 5s latency        |
| 3:00   | Ask live question: "Where was our first vacation?"                 | Agent answers from knowledge base          |
| 3:20   | Agent responds in cloned voice                                     | Response audible, < 5s latency             |
| 3:35   | Show impact: "Every memory you share is a gift."                   | Emotional close                            |
| 3:45   | Close demo                                                         | Total time < 4:00                          |

### Rehearsal Log

Run the demo path 3 times before submission and record results:

| Run | Start Time | End Time | Total Time | Failures |
|-----|-----------|----------|------------|----------|
| 1   |           |          |            |          |
| 2   |           |          |            |          |
| 3   |           |          |            |          |

All 3 runs must show zero failures and total time under 4:00.

---

## 9. Pre-Submission Final Verification

Complete this checklist on the day of submission.

### Code Checks
- [ ] All automated tests passing: `pytest tests/ -v` shows 0 failures
- [ ] No `.env` file with real API keys committed to git
- [ ] `ELEVENLABS_API_KEY` only in `.env` (gitignored)
- [ ] `AMD_API_KEY` only in `.env` (gitignored)
- [ ] Firebase service account key only in `serviceAccount.json` (gitignored)
- [ ] `README.md` updated with setup instructions and demo steps
- [ ] Devpost submission form filled out

### Demo Readiness
- [ ] Demo path test passed 3 times with zero failures
- [ ] Backup demo video recorded (in case of live demo failure)
- [ ] Backup video uploaded to a reliable hosting (Google Drive or YouTube unlisted)
- [ ] Backup video link added to Devpost submission as fallback
- [ ] All demo environment variables are set (`ELEVENLABS_API_KEY`, `AMD_ENDPOINT`, `FIREBASE_*`)
- [ ] Backend server tested on demo machine (not just CI)
- [ ] Frontend Vite build tested in production mode (`npm run build && npm run preview`)

### Devpost Submission
- [ ] Project title: "MemoryBridge"
- [ ] Tagline: "Giving dementia patients back their voice and memories"
- [ ] AMD track requirements met (AMD Developer Cloud usage or fallback demonstrated)
- [ ] WebSpatial track requirements met (spatial room with era-based depth)
- [ ] ElevenLabs track requirements met (voice clone + conversational agent)
- [ ] Demo video uploaded (max 3 minutes for most Devpost tracks)
- [ ] GitHub repo link included and repo is public
- [ ] Team members listed with correct names and emails
- [ ] Submission submitted before the deadline

---

## 10. Escalation — When to Call mb-debugger

Escalate to mb-debugger immediately if any of these occur:

- CRITICAL: Upload route returns 500 in production (not in tests)
- CRITICAL: ElevenLabs voice clone API returns 401 or 403
- CRITICAL: Firebase Storage throws PERMISSION_DENIED
- CRITICAL: AMD endpoint returns unexpected response shape
- HIGH: Embedding batch job silently fails (no log output after 30 seconds)
- HIGH: Spatial room panels do not render (blank screen)
- HIGH: Voice agent does not respond within 5 seconds
- MEDIUM: CPU fallback embeddings look incorrect (all zeros, wrong dimension)
- MEDIUM: CORS errors in browser console for any API endpoint
