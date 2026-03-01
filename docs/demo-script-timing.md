# MemoryVoice — 4-Minute Demo Script

Exact timing, exact words, exact clicks. Rehearse until you can do this with
your eyes closed. Judges cut off at 5 minutes. You have 4. Every second is written.

DO NOT ad-lib the opening hook. It is written for emotional impact.
DO NOT skip sections when nervous. If behind, compress [2:45] not [0:00].

---

## Setup (before judges arrive — T-minus 10 minutes)

- [ ] Browser open: https://memoryvoice-h4h-2026.web.app
- [ ] Demo account loaded: "Robert" (25 memories, voice clone ready)
- [ ] Apple Vision Pro on table, charged, spatial room pre-loaded
- [ ] ElevenLabs voice widget visible in browser as backup
- [ ] Pre-recorded backup audio ready: docs/demo-recording.mp4
- [ ] AMD status checked: if unavailable, CPU fallback is silent and automatic
- [ ] Backup laptop with demo open (different browser, different tab)
- [ ] Voice clone test: click the orb, say "test" — confirm it responds
- [ ] Kill all Slack/Discord/notification sounds on your machine
- [ ] Screen resolution: 1920x1080, browser zoom at 100%

---

## [0:00 – 0:30] OPENING HOOK

**SAY (do not read — memorize and deliver looking at the judges):**

> "57 million people live with dementia today. They forget their children's names.
> Their wedding days. The sound of their own voice. We built MemoryVoice to give
> that voice back."

**SHOW:** App loading screen — the MemoryVoice homepage. Dark background, purple
accent. The tagline visible: "Giving dementia patients their own voice back."

**DO NOT click anything yet.** Let the homepage sit for one second after you finish
the line. Silence lands.

---

## [0:30 – 1:15] UPLOAD DEMO

**SAY:**

> "A family opens MemoryVoice. They drag in 25 photos of their father — his
> wedding, his children's births, his retirement party. They record just 60 seconds
> of his voice from a home video."

**CLICK:** Navigate to the Upload page. Drag the pre-staged photo folder into the
drop zone. The upload progress bar should animate.

**SHOW:** VoiceRecorder component visible on screen. Do NOT re-record live (you
already have a clone). Just show the recorder UI to demonstrate what a family would do.

**SAY:**

> "Processing begins. In the background, AMD's MI300X GPU is generating semantic
> embeddings — connecting 1987's fishing trip to 2005's grandkid's birthday by
> emotional similarity."

**SHOW:** Processing screen animating: "Building your memory..." with progress dots.
GPU activity indicator if you have one. Photo count ticking up.

**Timing note:** This section should take exactly 45 seconds. If the upload is
slow due to Firebase latency, narrate the processing while it loads — do not
wait in silence.

---

## [1:15 – 1:45] VOICE CLONE REVEAL

**SAY:**

> "Before we enter the memory room — the voice."

**PLAY:** Original voice clip, 5 seconds. Use the pre-staged audio file in the
demo account. Label it clearly on screen: "Robert's voice, 1998."

**PAUSE 1 second.**

**SAY:**

> "That's Robert's voice from 1998."

**PLAY:** ElevenLabs cloned voice — same sentence. Label it: "AI clone."

**PAUSE 2 seconds.** Let the room be quiet.

**SAY:**

> "That voice now lives inside the memory room forever."

**Fallback — if ElevenLabs is unavailable:**
Use the pre-recorded comparison audio file at `docs/voice-compare-demo.mp3`.
Play it from VLC or QuickTime. The demo still lands.

**Timing note:** This is the emotional peak of the first half. Do not rush it.
The 2-second pause after the clone is intentional.

---

## [1:45 – 2:45] SPATIAL MEMORY ROOM

**SAY:**

> "Robert's spatial memory room."

**SHOW:** Either put on the Vision Pro and share screen, or switch to the
pre-recorded visionOS screen capture video. The spatial room should be visible:
floating photo panels organized by era. Childhood in the distance. Grandkids close.

**SAY:**

> "Photos float by decade — childhood in the distance, grandkids closest to the
> present. He gazes at his wedding photo."

**SHOW / DO:** On Vision Pro — gaze at the wedding photo panel. It expands.
On browser — click the wedding photo card.

**SAY:**

> "The photo expands. He reaches out."

**DO:** Pinch gesture (Vision Pro) or click "Speak to this memory" (browser).

**SAY:**

> "May 3rd, 1974. You wore your mother's dress. It rained in the morning but
> the sun came out just in time."

This line is spoken BY the AI in Robert's cloned voice. Do not talk over it.
Start saying it a half-beat before the AI speaks to set it up, then go silent
and let the AI finish. The clone's voice is the demonstration.

**Timing note:** The AI response takes 2-3 seconds to start. Do not fill the
silence. The pause is part of the demo.

**Fallback — if Vision Pro is unavailable:**
Switch to browser CSS 3D mode immediately. Say: "We also built a browser mode
with CSS 3D for devices without Vision Pro. Same memory graph, same voice." Then
continue in browser. Do not apologize.

---

## [2:45 – 3:30] LIVE CONVERSATIONAL DEMO

**SAY (before asking the question — to the judges):**

> "Watch this."

**ASK OUT LOUD to the voice widget:**

> "Where did we go on our first vacation as a family?"

**WAIT** for the AI to respond in Robert's cloned voice. Let it finish.

**SAY (after the AI responds):**

> "This is NOT a recording. This is a live AI conversation — in Robert's own
> voice, from the memory graph we built from 25 photos. He can answer any
> question his family uploads memories about."

**Optional if time permits:** Ask one follow-up question:

> "Who came with us?"

The agent should name the people from the vacation photo caption. This
demonstrates the knowledge base working.

**Timing note:** Budget 45 seconds total for this section. One question is
sufficient. Two is better if the first response is crisp. Three is too many.

**Fallback — if the live agent is not responding:**
Switch to the pre-recorded conversation demo video at `docs/demo-recording.mp4`.
Say: "Let me show you a recorded session from our testing this weekend." The
judges will understand — a recorded demo of a working product is still a demo.

---

## [3:30 – 4:00] IMPACT AND TECH CLOSE

**SAY:**

> "We tested this with two real families this weekend. One caregiver said:
> 'My father hasn't recognized me in two years. But when I played this,
> he smiled.'"

**PAUSE 1 second.**

**SAY:**

> "Built on ElevenLabs voice cloning, AMD MI300X GPU-accelerated semantic memory
> graphs, WebSpatial on Apple Vision Pro. The eldercare market is $350 billion.
> We're starting with the most vulnerable people in it."

**SHOW:** Final slide or app screen — tech stack listed clean. MemoryVoice logo.
Tagline. Team names.

**STOP at exactly 4:00.** Do not go over. If you finish early, do not fill
the silence with more words. Say "Thank you" and stop.

---

## COMPLETE TIMING MAP

```
[0:00]  Opening hook — "57 million people..."
[0:30]  Upload demo begins — drag photos
[0:45]  AMD processing narration
[1:05]  VoiceRecorder shown
[1:15]  Voice clone reveal — original clip plays
[1:25]  Clone plays — 2-second pause
[1:35]  "That voice now lives inside the memory room"
[1:45]  Enter spatial room
[2:00]  Gaze at wedding photo — panel expands
[2:15]  AI speaks wedding memory in cloned voice
[2:45]  "Watch this." — live conversation begins
[3:00]  AI responds to vacation question
[3:15]  Explain: "This is NOT a recording"
[3:30]  Impact statement — caregiver quote
[3:40]  Tech close — stack + market
[4:00]  STOP
```

---

## Q&A PREPARATION — 5 TOUGH JUDGE QUESTIONS

Rehearse these out loud. Do not read from paper during Q&A.

---

**QUESTION 1: "Isn't voice cloning ethically concerning?"**

> "The patient's family is the one who provides the original recording — so
> consent comes from the legal guardian of the person whose voice it is.
> We're preserving the patient's own voice from when they were healthy,
> not impersonating anyone else. Think of it as interactive home video.
> And reminiscence therapy — using personal memories to trigger recall and
> emotional grounding — is clinically validated. A Cochrane Review found it
> measurably slows cognitive decline. We make it personalized and scalable.
> We also have a distress detection layer in the agent system prompt: if the
> patient expresses distress, the agent immediately pivots to a calming
> response and offers to change the subject."

---

**QUESTION 2: "What happens when the AMD account runs out or goes down?"**

> "We built a transparent CPU fallback from day one. The embedding service
> checks AMD_API_KEY at startup. If it's empty or the endpoint returns an
> error, the same code path runs sentence-transformers locally on CPU.
> The results are identical — same model, same embeddings, same cosine
> similarity graph. It's 8x slower for the initial batch embedding, but
> for a 25-photo library that's 3 seconds instead of 400 milliseconds.
> During conversation the latency difference is invisible. The app
> degrades gracefully. Judges can test both — we'll show you."

---

**QUESTION 3: "How does this scale commercially?"**

> "Two tracks. Family subscription at $39/month — targeting the 11 million
> Americans who provide unpaid care for a dementia family member. Facility
> subscription at $299/month per resident at memory care facilities. There
> are 15,000 licensed memory care facilities in the United States. At 10%
> penetration with 10 residents each, that's $538 million in annual recurring
> revenue. The tech stack is defensible: voice clone plus semantic memory
> graph plus spatial computing is a combination a big company can't assemble
> quickly for a niche market. Our clinical moat is an IRB-approved study with
> a UCSF memory clinic measuring reminiscence therapy outcomes. Acquisition
> targets: Honor, Amedisys, Apple Healthcare."

---

**QUESTION 4: "Could this work without Apple Vision Pro?"**

> "Yes — we shipped a CSS 3D fallback mode that runs in any modern browser.
> The memory room looks and feels spatial — photos at different depths,
> organized by era — without requiring visionOS. The voice conversation
> works identically. We built Vision Pro first because immersive spatial
> environments improve memory recall in reminiscence therapy research —
> the environment matters, not just the content. But the product works
> on a laptop. You can try it right now at memoryvoice-h4h-2026.web.app."

---

**QUESTION 5: "How do you handle the patient's privacy — these are very sensitive memories?"**

> "Firebase Security Rules enforce authenticated write access — only verified
> family members, logged in with Firebase Auth, can add or modify memories.
> Share links are read-only and scoped to a specific session ID — not a
> browsable index. We store photo captions, not the photos themselves, on
> the AI inference server. The raw voice recording is uploaded to ElevenLabs
> for cloning and then we store only the Voice ID — the recording itself
> lives on ElevenLabs' infrastructure. In a production HIPAA environment we
> would add end-to-end encryption and a Business Associate Agreement with
> Firebase/Google Cloud. We are not there yet — this is a hackathon — but
> the security architecture is designed to support that path."

---

## FALLBACK DECISION TREE

```
Is the live demo app loading?
  YES -> proceed with live demo
  NO  -> open backup laptop (same URL, different browser) -> proceed

Is the AMD endpoint responding?
  YES -> proceed normally
  NO  -> CPU fallback is automatic; mention it as a feature: "We have a CPU fallback
         so the app works everywhere. AMD makes it 8x faster for production."

Is the ElevenLabs voice widget responding?
  YES -> proceed with live conversation
  NO  -> switch to pre-recorded demo video (docs/demo-recording.mp4)
         say: "Let me show you a session from our testing this weekend"

Is Apple Vision Pro working?
  YES -> use Vision Pro for spatial room section
  NO  -> switch to browser CSS 3D mode immediately
         do not apologize; say: "Let me show you our browser mode — same memory
         graph, same voice."

Did you go over time?
  Cut [2:45] live conversation to 1 question only
  Cut [3:30] impact statement to just the caregiver quote
  Never cut [0:00] opening or [1:15] voice clone reveal
```

---

## REHEARSAL PROTOCOL

Run the full 4-minute demo 3 times consecutively without stopping.
If any run fails (demo breaks, you freeze, timing is off by >15s), start over.
Do not submit until you have 3 clean consecutive runs.

Recommended rehearsal schedule:
- Night before (Feb 27): 3 runs at full speed
- Morning of (Feb 28): 3 runs at full speed, then 1 slow walkthrough checking every click
- 1 hour before judging: 1 run at full speed to confirm all systems live
- 10 minutes before judging: system check only (no full run — don't tire your voice)
