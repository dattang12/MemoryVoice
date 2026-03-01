# RallyCoach Refactor Design

**Date:** 2026-01-30
**Status:** Approved
**Author:** Claude (Senior Principal Engineer)

---

## Overview

This document outlines the design for a major refactor of the RallyCoach badminton analytics application. The refactor addresses four core requirements:

1. **Strict Player Lock Isolation** — YOLO + ByteTrack tracking pipeline
2. **Ghost Visualization Refactor** — Move to Compare Mode in Detected Issues panel
3. **3D Pose Sandbox** — React Three Fiber with OrbitControls
4. **Movement Guidance Enhancements** — Phase sequence, Why cards, Stance brackets

---

## 1. Architecture Overview

### Current Flow
```
Video Upload → MediaPipe (browser) → All poses → bbox proximity matching → Render
```

### New Flow
```
Video Upload → Backend API
                  ↓
         YOLO Person Detection
                  ↓
         ByteTrack (stable track_ids)
                  ↓
         Crop ROIs per track_id
                  ↓
         MediaPipe Pose (per crop)
                  ↓
         Return: TrackingResult {
           frames: [{
             frame_index: number,
             tracks: [{
               track_id: number,
               bbox: {x, y, w, h},
               landmarks: PoseLandmark[],
               confidence: number
             }]
           }]
         }
                  ↓
         Frontend receives pre-tracked data
                  ↓
         User selects player by track_id
                  ↓
         Filter ALL downstream by selected track_id:
           - Skeleton overlay
           - Ghost extraction (only from selected track)
           - Gemini analysis (only selected track ROIs)
           - Mistake detection
```

### Key Principle

The `track_id` is the single source of truth. Once assigned by ByteTrack, it persists across frames. All analysis is **strictly isolated** to the selected `track_id`.

---

## 2. Backend — YOLO + ByteTrack Pipeline

### New Dependencies

Add to `backend/requirements.txt`:
```
ultralytics>=8.0.0    # YOLOv8 person detection
supervision>=0.16.0   # ByteTrack implementation
```

### New Module: `backend/tracking.py`

```python
from ultralytics import YOLO
import supervision as sv
from dataclasses import dataclass, asdict
import mediapipe as mp
import cv2
import numpy as np

@dataclass
class TrackedPerson:
    track_id: int
    bbox: tuple[float, float, float, float]  # x, y, w, h normalized
    landmarks: list[dict] | None  # 33 MediaPipe landmarks
    confidence: float

@dataclass
class FrameTracking:
    frame_index: int
    timestamp: float
    tracks: list[TrackedPerson]

class PlayerTracker:
    def __init__(self, fps: int = 30):
        self.yolo = YOLO("yolov8n.pt")  # Nano model for speed
        self.byte_tracker = sv.ByteTrack(
            track_activation_threshold=0.25,
            lost_track_buffer=30,
            minimum_matching_threshold=0.8,
            frame_rate=fps
        )
        self.pose = mp.solutions.pose.Pose(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5
        )
        self.fps = fps

    def process_video(self, video_path: str) -> list[FrameTracking]:
        """
        Full pipeline: Detect → Track → Crop → Pose
        Returns stable track_ids across all frames.
        """
        results = []
        cap = cv2.VideoCapture(video_path)
        frame_index = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w = frame.shape[:2]

            # 1. YOLO detection (persons only, class_id=0)
            detections = self.yolo(frame, classes=[0], verbose=False)[0]
            sv_detections = sv.Detections.from_ultralytics(detections)

            # 2. ByteTrack assigns stable track_ids
            tracked = self.byte_tracker.update_with_detections(sv_detections)

            # 3. Crop ROI per track → Pose estimation
            frame_tracks = []

            if tracked.tracker_id is not None:
                for i, track_id in enumerate(tracked.tracker_id):
                    bbox_xyxy = tracked.xyxy[i]  # x1, y1, x2, y2

                    # Add padding to bbox
                    pad = 0.1
                    x1, y1, x2, y2 = bbox_xyxy
                    bw, bh = x2 - x1, y2 - y1
                    x1 = max(0, x1 - bw * pad)
                    y1 = max(0, y1 - bh * pad)
                    x2 = min(w, x2 + bw * pad)
                    y2 = min(h, y2 + bh * pad)

                    # Crop
                    cropped = frame_rgb[int(y1):int(y2), int(x1):int(x2)]

                    # 4. MediaPipe on cropped region
                    pose_result = self.pose.process(cropped)

                    landmarks_full = None
                    if pose_result.pose_landmarks:
                        # 5. Map landmarks back to full frame coordinates
                        landmarks_full = []
                        for lm in pose_result.pose_landmarks.landmark:
                            landmarks_full.append({
                                'x': (x1 + lm.x * (x2 - x1)) / w,
                                'y': (y1 + lm.y * (y2 - y1)) / h,
                                'z': lm.z,
                                'visibility': lm.visibility
                            })

                    # Normalize bbox
                    norm_bbox = (
                        x1 / w,
                        y1 / h,
                        (x2 - x1) / w,
                        (y2 - y1) / h
                    )

                    frame_tracks.append(TrackedPerson(
                        track_id=int(track_id),
                        bbox=norm_bbox,
                        landmarks=landmarks_full,
                        confidence=float(tracked.confidence[i])
                    ))

            results.append(FrameTracking(
                frame_index=frame_index,
                timestamp=frame_index / self.fps,
                tracks=frame_tracks
            ))

            frame_index += 1

        cap.release()
        return results

    def extract_track_thumbnails(
        self,
        video_path: str,
        tracking_results: list[FrameTracking]
    ) -> dict[int, str]:
        """Extract thumbnail for each unique track_id."""
        thumbnails = {}
        cap = cv2.VideoCapture(video_path)

        # Find first clear appearance of each track
        track_first_frame = {}
        for frame in tracking_results:
            for track in frame.tracks:
                if track.track_id not in track_first_frame:
                    if track.confidence > 0.7:
                        track_first_frame[track.track_id] = (
                            frame.frame_index,
                            track.bbox
                        )

        for track_id, (frame_idx, bbox) in track_first_frame.items():
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                h, w = frame.shape[:2]
                x, y, bw, bh = bbox
                x1, y1 = int(x * w), int(y * h)
                x2, y2 = int((x + bw) * w), int((y + bh) * h)
                crop = frame[y1:y2, x1:x2]

                # Resize and encode as base64
                crop = cv2.resize(crop, (80, 120))
                _, buffer = cv2.imencode('.jpg', crop)
                import base64
                thumbnails[track_id] = base64.b64encode(buffer).decode()

        cap.release()
        return thumbnails


def extract_unique_tracks(tracking_results: list[FrameTracking]) -> list[dict]:
    """Extract unique track IDs with metadata."""
    tracks = {}
    for frame in tracking_results:
        for track in frame.tracks:
            if track.track_id not in tracks:
                tracks[track.track_id] = {
                    'track_id': track.track_id,
                    'first_seen': frame.timestamp,
                    'confidence': track.confidence
                }
            else:
                # Update confidence to max seen
                tracks[track.track_id]['confidence'] = max(
                    tracks[track.track_id]['confidence'],
                    track.confidence
                )
    return list(tracks.values())
```

### API Endpoint Update: `backend/main.py`

```python
from tracking import PlayerTracker, extract_unique_tracks

@app.post("/api/analyze")
async def analyze_video(file: UploadFile, user_id: str = Form(...)):
    # Save video temporarily
    video_path = f"/tmp/{file.filename}"
    with open(video_path, "wb") as f:
        f.write(await file.read())

    # Get video FPS
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
    cap.release()

    # Run tracking pipeline
    tracker = PlayerTracker(fps=fps)
    tracking_results = tracker.process_video(video_path)
    thumbnails = tracker.extract_track_thumbnails(video_path, tracking_results)

    # Serialize results
    tracking_data = [asdict(f) for f in tracking_results]
    detected_players = extract_unique_tracks(tracking_results)

    # Add thumbnails to player data
    for player in detected_players:
        player['thumbnail'] = thumbnails.get(player['track_id'], '')

    return {
        "tracking_data": tracking_data,
        "detected_players": detected_players,
        "fps": fps,
        "total_frames": len(tracking_results),
    }
```

---

## 3. Frontend — Player Lock & Filtering

### Updated Types: `lib/types.ts`

```typescript
// New tracking types from backend
export interface TrackedPerson {
  track_id: number;
  bbox: { x: number; y: number; w: number; h: number };
  landmarks: PoseLandmark[] | null;
  confidence: number;
}

export interface FrameTracking {
  frame_index: number;
  timestamp: number;
  tracks: TrackedPerson[];
}

export interface TrackingData {
  frames: FrameTracking[];
  detected_players: {
    track_id: number;
    first_seen: number;
    confidence: number;
    thumbnail: string;
  }[];
  fps: number;
  total_frames: number;
}
```

### State Management: `app/analytics/page.tsx`

```typescript
// Replace old subject-lock with track_id based system
const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

// Derived: Get poses ONLY for selected track
const filteredPoseData = useMemo(() => {
  if (!trackingData || selectedTrackId === null) return [];

  return trackingData.frames.map(frame => {
    const track = frame.tracks.find(t => t.track_id === selectedTrackId);
    return track?.landmarks ?? null;
  });
}, [trackingData, selectedTrackId]);

// Derived: Get bboxes for selected track (for Gemini cropping)
const selectedTrackBboxes = useMemo(() => {
  if (!trackingData || selectedTrackId === null) return [];

  return trackingData.frames.map(frame => {
    const track = frame.tracks.find(t => t.track_id === selectedTrackId);
    return track?.bbox ?? null;
  });
}, [trackingData, selectedTrackId]);

// Ghost extraction — ONLY from selected track
const ghostData = useMemo(() => {
  if (!filteredPoseData.length) return null;
  return initializeGhostRival(filteredPoseData, metricsHistory, fps);
}, [filteredPoseData, metricsHistory, fps]);

// Mistake detection — ONLY from selected track
const mistakeEvents = useMemo(() => {
  if (!filteredPoseData.length) return [];
  return detectMistakes(filteredPoseData, fps);
}, [filteredPoseData, fps]);
```

### Skeleton Overlay Filtering

```typescript
// In render loop, only draw selected track
const renderFrame = useCallback(() => {
  const frameData = trackingData?.frames[currentFrameIndex];
  if (!frameData) return;

  // Find ONLY the selected track
  const selectedTrack = frameData.tracks.find(
    t => t.track_id === selectedTrackId
  );

  if (selectedTrack?.landmarks) {
    drawUserSkeleton(ctx, selectedTrack.landmarks, formQuality, renderOptions);

    // Optional: dim other players to show isolation
    frameData.tracks
      .filter(t => t.track_id !== selectedTrackId)
      .forEach(t => {
        if (t.landmarks) {
          drawDimmedSkeleton(ctx, t.landmarks, renderOptions, 0.2);
        }
      });
  }
}, [trackingData, currentFrameIndex, selectedTrackId]);
```

---

## 4. Ghost Refactor & Compare Mode

### Key Change

Remove ghost from main video overlay. Move to Detected Issues panel as Compare Mode.

### Remove from Main Overlay

```typescript
// BEFORE: Ghost rendered on main canvas
if (showGhost && ghostLandmarks) {
  drawGhostSkeleton(ctx, ghostLandmarks, renderOptions, ghostPulse);
}

// AFTER: Remove this entirely from main render loop
```

### New Component: `components/CompareMode.tsx`

```typescript
'use client';

import { useState, useRef, useMemo } from 'react';
import type { PoseLandmark, MistakeEvent, GhostRivalData } from '@/lib/types';
import { getGhostPoseAtTime } from '@/lib/ghost-overlay';

interface CompareModeProps {
  mistake: MistakeEvent;
  userPoseAtMistake: PoseLandmark[];
  ghostData: GhostRivalData;
  onClose: () => void;
}

export default function CompareMode({
  mistake,
  userPoseAtMistake,
  ghostData,
  onClose,
}: CompareModeProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [scrubTime, setScrubTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const ghostPose = useMemo(() => {
    if (!ghostData.bestRepWindow) return null;
    const { startTime, endTime } = ghostData.bestRepWindow;
    const targetTime = startTime + scrubTime * (endTime - startTime);
    return getGhostPoseAtTime(ghostData, targetTime);
  }, [ghostData, scrubTime]);

  const handleDrag = (deltaX: number, deltaY: number) => {
    setRotation(prev => ({
      x: prev.x + deltaY * 0.01,
      y: prev.y + deltaX * 0.01,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 rounded-2xl max-w-5xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Compare Mode</h2>
            <p className="text-sm text-slate-400">{mistake.summaryTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Side-by-side panels */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800">
          {/* Left: User's Form */}
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30">
              <span className="text-sm font-medium text-red-400">YOUR FORM</span>
            </div>
            <PoseCanvas
              landmarks={userPoseAtMistake}
              rotation={rotation}
              onDrag={handleDrag}
              color="#ef4444"
              width={400}
              height={350}
            />
          </div>

          {/* Right: Target Form */}
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-green-500/20 border-b border-green-500/30">
              <span className="text-sm font-medium text-green-400">TARGET FORM</span>
            </div>
            <PoseCanvas
              landmarks={ghostPose}
              rotation={rotation}
              onDrag={handleDrag}
              color="#22c55e"
              width={400}
              height={350}
            />
          </div>
        </div>

        {/* Scrub timeline */}
        <div className="px-6 py-4 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={scrubTime}
              onChange={(e) => setScrubTime(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-500"
            />

            <span className="text-sm text-slate-400 w-16 text-right">
              {Math.round(scrubTime * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. 3D Pose Sandbox

### New Component: `components/PoseSandbox3D.tsx`

Uses React Three Fiber with:
- `<Canvas>` for 3D rendering
- `<OrbitControls>` for drag/rotate/zoom
- Skeleton mesh: `<TubeGeometry>` for bones, `<SphereGeometry>` for joints
- Deviation highlighting via material colors
- Blue arrows showing correction direction

Key features:
- Affected joints pulse and glow red (error) or green (correct)
- Interpolation slider smoothly transitions between user → correct pose
- `<ContactShadows>` for grounding
- `<Environment preset="studio">` for lighting

Integration point: `components/FixItCard.tsx` or dedicated "Fix This Mistake" panel.

---

## 6. Movement Guidance Enhancements

### Phase Sequence Bar

Shows: "Ready → Split → Push → Strike → Recover"
- Current phase highlighted with cyan ring
- Completed phases show green checkmark
- Timing cues displayed below current phase

### Why Card

Displays for each mistake type:
- **Cause**: What went wrong
- **Effect**: Why it matters
- **Fix**: How to correct it
- **Timing** (optional): When to make the adjustment

### Stance Width Bracket

Two display modes (toggle):
1. **Mini-diagram** (default): Bird's-eye view in guidance panel
2. **Video overlay**: Red bracket (current) vs green bracket (target)

---

## 7. Implementation Order

```
Phase 1: Backend Tracking Pipeline
├── 1.1 Add ultralytics + supervision to requirements.txt
├── 1.2 Create backend/tracking.py
├── 1.3 Update /api/analyze endpoint
└── 1.4 Test: Verify stable track_ids

Phase 2: Frontend Track Integration
├── 2.1 Add tracking types to lib/types.ts
├── 2.2 Update analytics page state
├── 2.3 Implement track_id filtering
├── 2.4 Update PlayerSelectionModal
├── 2.5 Remove ghost from main overlay
└── 2.6 Test: Skeleton isolation

Phase 3: Compare Mode
├── 3.1 Create PoseCanvas.tsx
├── 3.2 Create CompareMode.tsx
├── 3.3 Integrate with Detected Issues
└── 3.4 Test: Compare mode functionality

Phase 4: 3D Pose Sandbox
├── 4.1 Create PoseSandbox3D.tsx
├── 4.2 Integrate into Fix This Mistake panel
└── 4.3 Test: 3D rendering + controls

Phase 5: Movement Guidance
├── 5.1 Create PhaseSequenceBar.tsx
├── 5.2 Create WhyCard.tsx
├── 5.3 Create StanceBracket.tsx
├── 5.4 Update MovementGuidance.tsx
└── 5.5 Test: All guidance elements

Phase 6: Integration & Polish
├── 6.1 End-to-end testing
├── 6.2 Verify Gemini isolation
├── 6.3 Performance optimization
├── 6.4 Debug overlay implementation
└── 6.5 Cleanup deprecated code
```

---

## 8. Verification Checklist

### Player Lock Isolation
- [ ] Switching players immediately changes skeleton overlay
- [ ] Switching players recalculates ghost from new player only
- [ ] Switching players recalculates mistakes from new player only
- [ ] Gemini analysis request contains ONLY selected player ROIs
- [ ] No skeleton bleed onto non-selected players
- [ ] Track IDs remain stable across video scrubbing

### Ghost Refactor
- [ ] Ghost skeleton NO LONGER appears on main video overlay
- [ ] Clicking mistake opens Compare Mode modal
- [ ] Compare Mode shows side-by-side: User vs Target
- [ ] Both panels rotate together when dragging
- [ ] Scrub timeline syncs both panels
- [ ] Context-aware ghost shows correct form for specific mistake

### 3D Pose Sandbox
- [ ] 3D skeleton renders in Fix This Mistake panel
- [ ] OrbitControls: drag to rotate, scroll to zoom
- [ ] Affected joints highlight red (error) or green (correct)
- [ ] Blue arrows show deviation direction
- [ ] Slider interpolates smoothly between poses

### Movement Guidance
- [ ] Phase sequence bar shows correct phases for shot type
- [ ] Current phase is highlighted
- [ ] Why card displays cause → effect → fix
- [ ] Timing cues appear where applicable
- [ ] Stance bracket diagram shows current vs target
- [ ] Toggle enables/disables stance overlay on video
- [ ] Overlay renders correctly aligned to feet

---

## 9. File Changes Summary

| Category | Files to Create | Files to Modify |
|----------|-----------------|-----------------|
| Backend | `backend/tracking.py` | `backend/main.py`, `backend/requirements.txt` |
| Types | — | `lib/types.ts` |
| Player Lock | — | `app/analytics/page.tsx` |
| Compare Mode | `components/CompareMode.tsx`, `components/PoseCanvas.tsx` | `app/analytics/page.tsx` |
| 3D Sandbox | `components/PoseSandbox3D.tsx` | `components/FixItCard.tsx` |
| Movement Guidance | `components/PhaseSequenceBar.tsx`, `components/WhyCard.tsx`, `components/StanceBracket.tsx` | `components/MovementGuidance.tsx` |

---

## Appendix: Debug Overlay

Temporary development tool to verify tracking:

```typescript
if (showDebugOverlay && trackingData) {
  const frame = trackingData.frames[currentFrameIndex];
  frame.tracks.forEach(track => {
    ctx.strokeStyle = track.track_id === selectedTrackId ? '#00ff00' : '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      offsetX + track.bbox.x * renderWidth,
      offsetY + track.bbox.y * renderHeight,
      track.bbox.w * renderWidth,
      track.bbox.h * renderHeight
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `ID: ${track.track_id}`,
      offsetX + track.bbox.x * renderWidth + 4,
      offsetY + track.bbox.y * renderHeight + 16
    );
  });
}
```

---

**End of Design Document**
