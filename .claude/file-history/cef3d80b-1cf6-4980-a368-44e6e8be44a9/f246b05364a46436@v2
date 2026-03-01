# Player Detection Optimization Design

**Date:** 2026-02-01
**Status:** Implemented

## Problem Statement

The original tracking system had three critical issues:

1. **Filename Sanitization Failure**: Chinese characters in filenames caused Supabase Storage upload failures
2. **Audience Detection**: YOLO detected 97 "players" including audience members instead of just 2-4 court players
3. **Slow Performance**: Processing every frame with full MediaPipe pose estimation was too slow

## Solution Design

### 1. Filename Sanitization Fix

**Before:** Used `[^\w\-.]` regex which includes Unicode characters in Python.

**After:** Changed to `[^a-zA-Z0-9\-_]` to only allow ASCII alphanumeric characters.

**File:** `backend/main.py` - `sanitize_filename()` function

### 2. Court Region Detection

Added automatic court detection to filter out audience members:

1. **Green Color Detection**: Badminton courts are typically green. Use HSV color space to find the largest green region.
2. **Fallback Region**: If no green detected, use center 70% horizontal x 80% vertical of frame.
3. **Bounding Box Filter**: Only track persons whose bbox center falls within the court region.

**New Functions in `backend/tracking.py`:**
- `detect_court_region(frame)` - Returns normalized (x, y, w, h) bounding box
- `is_in_court_region(bbox, court_region)` - Checks if person is on court

### 3. Maximum Players Limit

Added `MAX_PLAYERS = 4` constant to limit detections to maximum badminton players (doubles match).

**Filtering Strategy:**
1. First pass: Filter all detections to court region only
2. Sort by confidence, limit to top 4 per frame
3. Final pass: Keep only top 4 track IDs by total visibility across video

### 4. Performance Optimizations

**Frame Skipping:**
- Default `skip_frames=2` processes every 3rd frame
- Skipped frames carry forward the last tracking result
- 3x reduction in YOLO/ByteTrack processing

**Selective Pose Estimation:**
- Only run MediaPipe on court-filtered candidates (max 4)
- Previously ran on ALL detected persons (up to 97)

## Architecture

```
Video Frame
    │
    ├─[First Frame]─► detect_court_region() ─► court_region (x,y,w,h)
    │
    └─[Each Frame]─► YOLO Detection (class=0: person)
                         │
                         ▼
                    ByteTrack (stable IDs)
                         │
                         ▼
                    Filter: is_in_court_region()
                         │
                         ▼
                    Sort by confidence, limit to 4
                         │
                         ▼
                    MediaPipe Pose (only filtered)
                         │
                         ▼
                    Final: top 4 by visibility
```

## Files Modified

| File | Changes |
|------|---------|
| `backend/main.py` | Fixed `sanitize_filename()` to ASCII-only |
| `backend/tracking.py` | Added court detection, filtering, frame skipping |

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Players detected | 97 | 2-4 |
| Frames processed | 3687 | ~1229 (1/3) |
| Pose estimations/frame | Up to 97 | Max 4 |
| Filename handling | Fails on Chinese | Works |

## Testing

Restart the backend and test with the same video:
```bash
cd backend
python main.py
```

Expected log output:
```
[Tracking] Court region detected: x=0.15, y=0.10, w=0.70, h=0.80
[Tracking] Processing 3687 frames at 30.0 fps (skip=2)
[Tracking] Complete: 1229 frames processed, 2-4 players identified
```
