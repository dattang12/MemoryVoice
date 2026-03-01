# MemoryVoice — Screenshot Guide for Devpost

6 screenshots required. Take all 6 before 8:00 AM March 1.
Upload in this order on Devpost — the sequence tells the product story.

General rules:
- Resolution: 1920x1080 minimum. Retina (2x) preferred if on Mac.
- Browser: Chrome or Safari. Remove all browser extensions that add UI chrome.
- Zoom: 100% browser zoom. Do not zoom in or out.
- Dark mode: enable on OS and browser if available — the app is designed dark.
- No personal data in screenshots: use the demo account "Robert" only.
- No Slack, Discord, or notification popups visible.
- Full-screen the browser. Hide the address bar if possible (F11 on Chrome).
- File format: PNG. Name files: mb-screenshot-1.png through mb-screenshot-6.png.

---

## SCREENSHOT 1: HOMEPAGE — DRAMATIC REVEAL

**What to show:**
The MemoryVoice homepage at full impact. Dark purple/black background. The tagline
"Giving dementia patients their own voice back" centered and large. The MemoryVoice
logo or wordmark. A single call-to-action button. No photos, no navigation noise.

**How to stage it:**
1. Open https://memoryvoice-h4h-2026.web.app in Chrome, full screen.
2. Do NOT log in. The homepage is the pre-auth landing page.
3. Confirm the tagline is fully visible and not cut off.
4. Wait for any animations to complete — screenshot the final settled state.
5. If the hero has a subtle background animation (floating particles, gradient pulse),
   screenshot mid-animation for visual interest.

**What makes this screenshot win:**
The emotional weight of the tagline in the first second. A judge scrolling 200
Devpost submissions stops on dark + large typography + human subject matter.
This screenshot is a billboard. It must stop the scroll.

**Caption for Devpost:**
"MemoryVoice homepage — the entry point for a family beginning to preserve their
loved one's voice and memories."

---

## SCREENSHOT 2: UPLOAD UI — PHOTOS BEING DRAGGED

**What to show:**
The upload page mid-interaction. Photos visibly mid-drag into the drop zone.
The drop zone highlighted (blue or purple border glow). A VoiceRecorder component
visible on the same screen. Photo thumbnails appearing in the upload queue as
they land.

**How to stage it:**
1. Navigate to the Upload page (log in as demo account first).
2. Open the demo photos folder alongside the browser window.
3. Select 5-8 demo photos and begin dragging them over the drop zone.
4. The drop zone should highlight on hover — this is the moment to screenshot.
   Use a second person to trigger the screenshot while you hold the drag.
   OR: use a screenshot delay tool — set 5-second delay, start the drag, wait.
5. If you cannot capture the drag state, take the screenshot immediately after
   dropping — show the upload progress bars animating on the photos.
6. Ensure the VoiceRecorder component is visible in the same frame.

**What makes this screenshot win:**
Shows the product in active use, not idle. A drag-and-drop screenshot communicates
"easy" instantly — this is a 5-minute family workflow, not a clinical tool requiring
training. The VoiceRecorder visible in the same frame proves the two-step upload
(photos + voice) is unified in one screen.

**Caption for Devpost:**
"Family members drag in 25 photos and record a 90-second voice sample. The entire
upload flow takes under 5 minutes."

---

## SCREENSHOT 3: PROCESSING SCREEN — "BUILDING YOUR MEMORY..."

**What to show:**
The processing / loading screen shown while the AMD embedding pipeline runs and
the memory graph is built. The exact text "Building your memory..." should be
visible. A progress indicator (spinner, dots, or progress bar). Ideally a count
of photos processed ("Embedding photo 18 of 25..."). The MemoryVoice brand
treatment visible.

**How to stage it:**
1. Trigger a real upload with the demo photos (or re-upload to a new demo session).
2. The processing screen appears immediately after photos are submitted.
3. Screenshot during the processing — before it completes.
4. If processing is too fast (AMD endpoint is fast), add a simulated delay for demo
   purposes in a dev build only, or screenshot from a screen recording of the process.
5. If you have an AMD activity indicator or GPU badge on screen, ensure it is visible
   and legible.

**What makes this screenshot win:**
Shows that real computation is happening. Judges evaluating AMD prize use need to see
evidence of processing. The phrase "Building your memory..." is emotionally resonant —
it frames computation as a human act, not a technical one.

**Caption for Devpost:**
"AMD MI300X generates semantic embeddings for each photo, building an emotionally
connected memory graph. Processing 25 photos takes under 400ms on GPU."

---

## SCREENSHOT 4: SPATIAL MEMORY ROOM — FLOATING PANELS

**What to show:**
The spatial memory room as seen on Apple Vision Pro (or browser CSS 3D mode if Vision
Pro is unavailable). Multiple floating photo panels visible at different depths. Era
labels visible: "Childhood," "Family Years," "Recent Memories." The depth gradient
clear: distant photos smaller/hazier, near photos sharp. At least one photo panel
should be the wedding photo (1974) or a recognizable family moment.

**How to stage it — Vision Pro (preferred):**
1. Enter the spatial room on Vision Pro with the demo account loaded.
2. Use screen mirroring to cast to Mac or use the Vision Pro's built-in screenshot:
   press the crown button + top button simultaneously.
3. Position yourself so 3-4 photo panels are visible at different depths.
4. Ensure at least one panel is sharp/close (recent memory) and one is visibly
   further away (childhood).
5. Screenshot in the settled state — not mid-transition.

**How to stage it — Browser CSS 3D fallback:**
1. Open the browser memory room view.
2. Use the era-organized grid or 3D perspective view.
3. Take a full-screen screenshot.
4. Label it honestly on Devpost as "browser 3D view" — do not imply it is Vision Pro
   if it is not.

**What makes this screenshot win:**
This is the WebSpatial prize screenshot. No other hack at this hackathon has a spatial
memory room. The floating panels at different depths communicate the depth-as-time UX
instantly. A judge for the WebSpatial prize will stop here and read every word of your
Devpost after seeing this screenshot.

**Caption for Devpost:**
"Robert's spatial memory room on Apple Vision Pro, built with WebSpatial SDK.
Photos float by decade — childhood in the distance, grandkids closest to the present."

---

## SCREENSHOT 5: VOICE WIDGET — LIVE CONVERSATION

**What to show:**
The VoiceWidget component mid-conversation. The user's spoken question visible
(transcribed text). The AI agent response visible in Robert's cloned voice (text
transcript or audio waveform). The voice orb active/pulsing. A clear indication
that this is a live two-way conversation, not audio playback. Ideally: a question
about a specific memory ("Where did we go on our first vacation?") with a specific
personal response from the agent.

**How to stage it:**
1. Open the memory room with the demo account.
2. Click a photo / start a conversation.
3. Ask: "Where did we go on our first vacation as a family?"
4. Wait for the agent to respond.
5. Screenshot immediately after the response appears — while the transcript is visible
   and the audio waveform or "Speaking..." indicator is active.
6. The screenshot must show BOTH the user question and the agent response.
   If the UI only shows one at a time, screenshot the agent response with the question
   visible in a transcript thread above it.

**What makes this screenshot win:**
This is the ElevenLabs prize screenshot. The conversation transcript proves this is
a live AI interaction, not recorded audio. The specificity of the response ("First
vacation as a family — we drove to Monterey in 1978...") proves the knowledge base
is working. The voice orb pulsing proves ElevenLabs TTS is running in real time.

**Caption for Devpost:**
"Live AI conversation in Robert's cloned voice, powered by ElevenLabs Conversational
AI. This is not a recording — the agent retrieves memories from the semantic graph
and responds in real time."

---

## SCREENSHOT 6: MEMORY TIMELINE — ERA VIEW

**What to show:**
The timeline or era-organized view of all 25 memories. Photos grouped visually by
decade: 1950s-1960s, 1970s-1980s, 1990s-2000s, 2010s-present. Each photo card
showing the caption excerpt and date. The visual progression from left (past) to
right (present) or top (past) to bottom (present). A clean, organized view that
communicates "this is a full life preserved."

**How to stage it:**
1. Navigate to the Timeline or Gallery view in the demo account.
2. Ensure all 25 demo photos are loaded and organized by era.
3. Scroll to a position that shows at least 3 different era groups visible.
4. Screenshot the full-width view.
5. If photo captions are visible on hover, hover over one meaningful photo
   (the wedding photo) to show its caption in the screenshot.

**What makes this screenshot win:**
Shows the completeness of the memory graph — this is not a single photo viewer, it
is a full life archived. The timeline view communicates "decades of memories organized
automatically" which validates both the AMD embedding work and the product's emotional
proposition. Judges evaluating Grand Prize need to see that the product handles real
data at real scale.

**Caption for Devpost:**
"The memory timeline — 25 photos across four decades, automatically organized by era.
Each photo is embedded in the semantic memory graph and accessible to the AI agent."

---

## SCREENSHOT STAGING ORDER

Take screenshots in this order to minimize demo account disruption:

1. Screenshot 6 (timeline) — just navigation, no interaction needed
2. Screenshot 1 (homepage) — log out first, then screenshot, then log back in
3. Screenshot 3 (processing) — trigger a fresh upload, screenshot during processing
4. Screenshot 2 (upload) — stage the drag interaction after processing completes
5. Screenshot 5 (voice widget) — start a conversation, screenshot during response
6. Screenshot 4 (spatial room) — enter Vision Pro or CSS 3D mode last

---

## UPLOAD TO DEVPOST

On the Devpost submission page:
- Upload screenshots in order 1-6.
- Add captions from this file to each screenshot.
- Devpost shows screenshots in a carousel — judges see Screenshot 1 first.
  Screenshot 1 (homepage) is your first impression. Make it count.
- File size limit: typically 10MB per image. PNG at 1920x1080 is usually 1-3MB.
  If a screenshot is too large, export as JPEG at 90% quality.

Deadline: All screenshots uploaded before 8:00 AM March 1.
