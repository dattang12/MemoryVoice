# Fix History Detail Pages: Skeleton Overlay + Practice Coaching Info

## Context
The history session detail page (`rallycoach/src/app/history/[sessionId]/page.tsx`) has two bugs visible in the screenshots:
1. **Skeleton overlay invisible** - Canvas draws skeleton but it renders behind the video due to missing z-index (affects both Strategy Analysis and Practice Session views)
2. **Practice Session lacks coaching info** - Shows only "Form Analysis Complete" with no actionable feedback, no Gemini commentary, no form quality breakdown

**Root cause for Bug 1:** The practice page uses `style={{ zIndex: 1 }}` on video and `style={{ zIndex: 2 }}` on canvas (lines 712, 721). The history detail page has NO z-index on either element (lines 551-570).

## File Modified
- `rallycoach/src/app/history/[sessionId]/page.tsx` (ONLY this file)

---

## Phase 1: Fix Canvas Z-Index (Bug 1)

### Step 1.1: Add z-index to video element (line 553)
```jsx
// ADD style={{ zIndex: 1 }} to video
<video ref={videoRef}
  className="absolute inset-0 w-full h-full object-contain"
  style={{ zIndex: 1 }}
  ...
```

### Step 1.2: Add z-index to canvas + use style for visibility (lines 565-570)
```jsx
// REPLACE className-based hidden with style-based display + zIndex
<canvas ref={canvasRef}
  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
  style={{ display: showSkeleton ? 'block' : 'none', zIndex: 2 }}
/>
```

### Step 1.3: Add z-10 to banded score indicator (line 574)
Add `z-10` class so it appears above the canvas layer.

### Step 1.4: Add z-10 to time display (line 588)
Add `z-10` class so it appears above the canvas layer.

---

## Phase 2: Practice Session Coaching Info (Bug 2)

### Step 2.1: Add coaching summary card in sidebar
Insert BEFORE the "Detected Issues" heading (line ~857). Only renders for `session.type === 'practice' && sessionScoring`:
- **Header**: "Practice Session Summary" with pose coverage %
- **Band distribution bar**: Green/Yellow/Red horizontal stacked bar showing frame quality
- **Persistent issues**: Yellow warning card listing `sessionScoring.persistentIssues`
- **Quick stats grid**: 3 cells - Avg Confidence, Valid Frames, Green Ratio

### Step 2.2: Improve empty-state messages for practice sessions
- "Great form!" -> "Excellent Practice Session!" with green frame % stat
- "Form Analysis Complete" -> "Practice Session Analysis" with contextual green frame insight

### Step 2.3: Add hint to Current Frame Metrics heading
Add "(Scrub timeline to see per-frame analysis)" subtitle for practice sessions.

---

## Verification
1. Open a Practice Session from history -> skeleton overlays on video, coaching summary card visible in sidebar
2. Open a Strategy Analysis from history -> skeleton overlays on video, no coaching card (strategy shows coaching_points instead)
3. Toggle "Show Skeleton" checkbox -> canvas hides/shows correctly
4. Banded score badge and time display visible above canvas
5. Scrub timeline -> skeleton updates per-frame, metrics card updates
