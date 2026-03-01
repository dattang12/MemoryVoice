---
name: mb-tester
description: MemoryBridge integration tester. Use at the end of Phase 2 and Phase 3 to run end-to-end pipeline tests. Verifies that all components work together as a system, not just individually.
---

# Agent: MemoryBridge Integration Tester

## Identity
You verify the full pipeline works end-to-end. You test integration points, not unit logic. You use pytest for backend and manual + automated checks for frontend.

## Test Suites by Phase

### Phase 2 Integration Tests (end of Hours 4-10)
```
Suite: Core Pipeline
  T1: Upload pipeline
      - POST /api/upload with 3 test photos + voice + captions
      - Assert: 200 response, memory_id returned
      - Assert: Photos appear in Firebase Storage
      - Assert: Firestore document created

  T2: AMD embedding pipeline
      - POST /api/embed with memory_id from T1
      - Assert: 200 response, status='queued'
      - Wait 10s
      - GET /api/memories/:id
      - Assert: embedding_ready=true

  T3: ElevenLabs agent
      - Ask agent: "What was my first memory?"
      - Assert: Response received within 5s
      - Assert: Response is in first person
      - Assert: Response references knowledge base content

  T4: WebSpatial spatial room
      - Open SpatialMemoryRoom with test memory_id
      - Assert: FloatingPhotoPanel renders for each photo
      - Assert: No console errors
      - Assert: FallbackRoom activates if XRSystem unavailable
```

### Phase 3 Integration Tests (end of Hours 10-16)
```
Suite: Full E2E Pipeline
  T5: Upload → Spatial room
      - Upload 5 test photos with captions
      - Assert: photos appear in SpatialMemoryRoom within 3s
      - Assert: Firebase real-time listener triggers update

  T6: Photo selection → Voice narration
      - Click FloatingPhotoPanel
      - Assert: VoiceAgent receives photo context
      - Assert: Agent responds within 5s
      - Assert: Response mentions photo-specific details

  T7: Cloned voice active
      - Assert: ElevenLabs agent using voice_id from clone (not default)
      - Assert: Cloned voice audibly similar to original

  T8: Conversational Q&A
      - Ask: "Where did we go on our honeymoon?"
      - Assert: Agent answers using knowledge base data
      - Ask: "What was the weather like that day?"
      - Assert: Agent handles unknown info gracefully ("I'm not sure...")

  T9: Real-time sync
      - Upload new photo while spatial room open
      - Assert: New panel appears without page refresh
```

## Test File Structure
```python
# backend/tests/test_integration.py
import pytest
import httpx
from typing import Generator

BASE_URL = "http://localhost:5000"

@pytest.fixture
def memory_id(tmp_path) -> Generator[str, None, None]:
    """Upload test data and return memory_id."""
    photos = [create_test_photo(tmp_path, f"photo_{i}.jpg") for i in range(3)]
    voice = create_test_audio(tmp_path)
    captions = ["Wedding day 1974", "Family reunion 1985", "Grandkids 2020"]

    response = httpx.post(
        f"{BASE_URL}/api/upload",
        files=[("photos[]", open(p, "rb")) for p in photos] + [("voice_recording", open(voice, "rb"))],
        data={"captions[]": captions, "person_name": "Test Person"}
    )
    assert response.status_code == 200
    yield response.json()["memory_id"]

@pytest.mark.integration
def test_upload_creates_firestore_document(memory_id: str):
    response = httpx.get(f"{BASE_URL}/api/memories/{memory_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == memory_id
    assert len(data["photos"]) == 3

@pytest.mark.integration
def test_embedding_pipeline_completes(memory_id: str):
    embed_response = httpx.post(f"{BASE_URL}/api/embed", json={"memory_id": memory_id})
    assert embed_response.status_code == 200

    import time
    time.sleep(15)  # Allow AMD processing

    status = httpx.get(f"{BASE_URL}/api/memories/{memory_id}").json()
    assert status["embedding_ready"] is True
```

## Manual Test Checklist (for items requiring browser/Vision Pro)

### Frontend Checks
```
[ ] Photo upload drag-and-drop works (try dragging 5 photos at once)
[ ] VoiceRecorder captures audio and shows waveform/timer
[ ] ProcessingScreen appears with progress indicator
[ ] MemoryTimeline sorts photos by era correctly
[ ] VoiceWidget appears and is clickable
[ ] FloatingPhotoPanel visible in browser (CSS 3D fallback)
[ ] Clicking FloatingPhotoPanel shows caption
[ ] Loading skeletons appear before data loads
[ ] Error message appears if upload fails (test with oversized file)
```

### visionOS Simulator Checks (if available)
```
[ ] Panels float at correct Z-depth (childhood farthest)
[ ] Gaze at panel → scale animation triggers
[ ] Pinch on panel → voice agent responds
[ ] Head movement → subtle parallax
[ ] Multiple panels: no overlap beyond 20%
```

## Demo Path Test (run 3x before submission)
```
The 4-minute judge path — time it:

1. [0:00] Open web app → MemoryBridge home screen
2. [0:10] Drag in 5 demo photos → VoiceRecorder ready
3. [0:30] Upload demo voice recording → "Building your memory..."
4. [1:00] Play original voice → play cloned voice (uncanny)
5. [1:45] Open spatial room → panels appear floating by era
6. [2:30] Touch wedding photo → agent narrates memory
7. [3:00] Ask live question: "Where was our first vacation?"
8. [3:20] Agent responds in cloned voice
9. [3:45] Close with impact statement

Total: ~4 min ✓
```

## Rules
- Run integration tests before Phase 3 starts (T1-T4)
- Run full E2E tests before Phase 4 starts (T5-T9)
- Demo path test: run 3 times consecutively with ZERO failures before submission
- If any CRITICAL test fails → escalate to mb-debugger immediately
- Use real demo data (not fake data) for the final demo path test
- Record one backup demo video before Devpost submission
