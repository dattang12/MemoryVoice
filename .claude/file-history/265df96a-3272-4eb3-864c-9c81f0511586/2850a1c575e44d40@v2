## Inspiration

Every year, **hundreds of millions of people** pick up a badminton racket — making it the second most-played sport on Earth. Yet the vast majority never receive professional coaching. The rest rely on YouTube tutorials, mimicking friends, or simply hoping their form improves with time. We've all been there: recording a shaky phone video of our smash, squinting at it afterward, and thinking *"was my elbow too low… or was it my wrist?"*

The moment that sparked RallyCoach came during a casual doubles match. One of us shanked a clear so badly it hit the ceiling. A friend joked, *"You need a coach standing behind you telling you what's wrong in real time."* That sentence lodged in our brains — because with Gemini 3, that's no longer a joke. It's an engineering problem.

We asked ourselves: **What if every player — from a weekend warrior to a competitive junior — had an AI coach watching their every move, reacting in under 500 milliseconds, and *explaining* why each correction matters?**

No expensive sensors. No wearable hardware. Just a webcam, a browser, and an AI that thinks out loud.

---

## What it does

**RallyCoach** is a full-stack AI coaching platform that transforms any webcam into a personal badminton coach. It combines **real-time computer vision** (MediaPipe), **structured AI reasoning** (Google Gemini 3), and **interactive 3D visualization** (Three.js) to deliver five core experiences:

### 1. Real-Time Practice Mode — *Your AI Coach, Live*
Point your webcam and start swinging. RallyCoach tracks **33 body landmarks** at 30 FPS using MediaPipe Pose — entirely in-browser, zero server load. A color-coded skeleton overlay provides instant visual feedback: **green** means your form is correct, **red** means adjust.

Every 1–2 seconds, **Gemini 3 Flash** evaluates your pose against **5 research-backed biomechanical rules** (elbow angle, knee bend, stance width, body rotation) and delivers:

- A **coaching cue** (max 10 words): *"Drive through your hips on rotation"*
- **Live commentary** (conversational): *"Your elbow is dropping to 128° — you're losing 30% of your smash power!"*
- A **reasoning hint**: *"elbow\_angle=128° is below the 150° threshold for overhead shots, reducing kinetic chain efficiency"*
- **Measured latency**: typically 300–500ms per cue

This isn't post-hoc analysis. It's a coach reacting while you move.

### 2. Video Analytics — *Deep Dive Into Your Game*
Upload any badminton video — no special camera required. RallyCoach extracts pose data across every frame, then sends aggregated metrics to **Gemini 3 Pro** with an extended thinking budget of 1,000 tokens. The AI returns:

- **Top issues** ranked by severity (high/medium/low)
- **Targeted drills** with step-by-step instructions
- A **5-day personalized training plan**
- **Technique and strategy summaries**
- Automatic **skill-level detection** (beginner/intermediate/advanced)

When pose data isn't available, **Gemini 3 Pro's native multimodal vision** analyzes the video directly — understanding technique, court positioning, and shot selection without frame-by-frame extraction. This is where Gemini 3's enhanced multimodal reasoning truly shines.

### 3. 3D Strategy Board — *See the Court Like a Pro*
An interactive **Three.js** court renders shot trajectories in 3D with BWF-accurate dimensions. The deterministic strategy engine:

- Classifies shots (clear, drop, smash, drive, net, serve, lift)
- Scores recommendations by **movement pressure**, **open court exploitation**, and **shot risk**
- Visualizes original vs. recommended shots with animated shuttlecock paths
- Maps opponent weak zones via position heatmap analysis
- Tracks rally phase (neutral/attack/defense) through a state machine

### 4. AI Racket Finder — *Matched to Your Game*
Answer a few questions about your skill level, play style, and weaknesses. **Gemini 3 Flash** scores 15+ rackets (Yonex, Li-Ning, Victor) from 0–100 with per-racket reasoning: *"The Astrox 99 Pro's head-heavy balance compensates for your weak rear-court clears."*

### 5. Dashboard & Session History
Track progress over time with **Recharts** visualizations — form score trends, green-frame ratios, total practice minutes. Replay any session with skeleton overlay, metrics timeline, and the AI coaching cues you received.

---

## How we built it

RallyCoach is a **hybrid-AI architecture** — deliberately splitting work between local computation and cloud intelligence:

### Client-Side (Zero-Latency Layer)
- **MediaPipe Pose (WASM)** runs entirely in-browser, extracting 33 landmarks per frame at 30 FPS with no server round-trip
- A **local rules engine** evaluates 5 biomechanical rules instantly, providing the green/red skeleton overlay before Gemini even responds
- **MediaRecorder API** captures sessions at 2.5 Mbps (VP9/WebM) for later upload and review

### AI Layer (Gemini 3)
We use **three Gemini 3 models**, each tuned for its task:

| Use Case | Model | Thinking Budget | Max Output | Latency |
|---|---|---|---|---|
| Live coaching | `gemini-3-flash-preview` | 200 tokens | 2,000 | <500ms |
| Deep analysis | `gemini-3-pro-preview` | 1,000 tokens | 8,000 | 3–8s |
| Drill visuals | `gemini-3-pro-image-preview` | — | — | 5–10s |

**Gemini 3 Pro Image** generates visual drill instructions on demand — showing players exactly how to position their body for each exercise, bridging the gap between text instructions and physical execution.

Every Gemini call uses **`ResponseSchema` validation** — structured JSON output enforced at the model level. No regex parsing, no manual JSON extraction. The schema includes Gemini 3-exclusive fields: `commentary`, `reason`, and `latency_ms`.

### Backend
- **Next.js 14** (App Router) serves the frontend and API routes
- **Python FastAPI** handles server-side video processing (OpenCV + MediaPipe pipeline)
- **Supabase** provides PostgreSQL (sessions, analysis results, favorites), Auth (JWT), and Storage (resumable uploads for large video files)

### 3D Visualization
- **React Three Fiber + Drei** render the strategy court with orbital camera controls
- **PoseSandbox3D** shows side-by-side wrong-vs-correct pose comparison with animated transitions and joint deviation highlighting
- Shot trajectories use pseudo-3D height curves (clears arc to 3.5m, drops stay at 1m)

### The Math Behind the Coaching

Our biomechanical rules are grounded in sports science. We measure joint angles using vector dot products between adjacent limb segments, then compare against research-backed thresholds:

$$\theta_{\text{elbow}} = \arccos\left(\frac{\vec{u} \cdot \vec{v}}{|\vec{u}||\vec{v}|}\right), \quad \vec{u} = \text{shoulder} - \text{elbow}, \quad \vec{v} = \text{wrist} - \text{elbow}$$

For overhead shots (smash/clear), the ideal elbow angle is $\theta \in [150°, 180°]$. For drives, $\theta \in [90°, 120°]$. Stance width is normalized as:

$$w_{\text{stance}} = \frac{d(\text{left\_ankle}, \text{right\_ankle})}{d(\text{left\_shoulder}, \text{right\_shoulder})}$$

with the ideal range $w \in [0.8, 1.5]$. Body rotation is the hip-shoulder separation angle, targeting $\Delta\phi \in [10°, 45°]$ for optimal kinetic chain engagement.

Each frame is classified as green ($\text{pass}$) or red ($\text{fail}$) based on these thresholds, and the session's **form score** is the green-frame ratio:

$$\text{Score} = \frac{N_{\text{green}}}{N_{\text{green}} + N_{\text{red}}} \times 100$$

---

## Challenges we ran into

### 1. Gemini 3's Thinking Tokens — The Silent Token Thief
Our biggest "aha" moment: **Gemini 3's thinking tokens count against `maxOutputTokens`**. Early on, our practice cues would return empty or truncated JSON because the model spent ~700 tokens *thinking* and had nothing left for the actual response. The fix: set `maxOutputTokens >= 2000` for even simple responses, and explicitly cap thinking overhead with `thinkingConfig: { thinkingBudget: 200 }`. This single insight saved the entire real-time coaching feature.

### 2. Markdown-Wrapped JSON Responses
Gemini 3's thinking process sometimes wraps valid JSON inside ` ```json ``` ` markdown fences. A naive `JSON.parse()` fails silently. We built `safeParseJSON()` — a multi-strategy parser that tries raw parsing, fence extraction, and brace-matching as fallbacks. It sounds simple; it took hours of debugging production edge cases.

### 3. MediaPipe Timestamp Collisions
MediaPipe's WASM runtime crashes with *"Packet timestamp mismatch"* if two frames arrive with identical or non-monotonic timestamps. On low-end hardware, `requestAnimationFrame` can fire twice with the same `performance.now()`. Our fix: a monotonic timestamp guard that ensures strictly increasing values.

### 4. Canvas Z-Index Wars
MediaPipe's pose canvas renders at `zIndex: 2`. Our AI commentary overlay was invisible because it rendered *behind* the canvas. The fix was simple (`z-10` class) but the debugging wasn't — we spent an hour convinced the overlay text wasn't rendering at all.

### 5. Real-Time Rate Limiting
Gemini 3 Flash is fast, but calling it 30 times per second would burn through quotas instantly. We implemented a 2-second minimum interval between AI calls, with the local rules engine providing instant feedback in between. The challenge was making this feel seamless — users shouldn't notice the handoff between local evaluation and cloud intelligence.

---

## Accomplishments that we're proud of

- **Sub-500ms AI coaching loop**: From pose capture to Gemini 3 Flash response to on-screen cue — the full round-trip consistently completes in under half a second. This makes RallyCoach feel like a real coach, not a chatbot.

- **Zero-hardware requirement**: Everything runs in a browser. MediaPipe Pose detection is client-side WASM. No depth cameras, no IMUs, no wearables. Any player with a laptop and a webcam can train like a pro.

- **Transparent AI reasoning**: Every coaching cue comes with a `reason` field. Players don't just hear "bend your knees" — they learn *why* their knee angle of 165° exceeds the 160° threshold, reducing their push-off power. This is coaching, not autocorrect.

- **Real data, no mocks**: Our analysis pipeline uses actual pose data from MediaPipe — real elbow angles, real knee bends, real stance widths. When pose data isn't available, Gemini 3 Pro analyzes the video directly. Every coaching recommendation is grounded in what the player actually did.

- **Hybrid architecture that scales**: Local rules provide instant green/red feedback; Gemini 3 adds nuanced, contextual coaching. If the API is slow or unavailable, the app gracefully degrades — cached responses fill the gap, and the local engine never stops evaluating.

- **Production-grade structured output**: Using Gemini 3's `ResponseSchema`, every AI response is validated JSON. No string parsing hacks. The schema includes commentary, reasoning, and latency tracking — fields that only Gemini 3's thinking architecture makes possible.

- **Full-stack 3D strategy engine**: A deterministic 9-module strategy pipeline that classifies shots, tracks rally state, scores recommendations by movement pressure and open-court exploitation, and renders everything in an interactive Three.js court — all without any AI calls.

---

## What we learned

1. **Gemini 3's thinking tokens are a feature, not a bug** — but you have to budget for them. The `thinkingBudget` parameter is the difference between a 340ms response and a 2-second one. Treating thinking as a tunable knob (200 tokens for real-time, 1,000 for deep analysis) unlocked our entire latency architecture.

2. **Structured output changes everything**. `ResponseSchema` validation eliminated an entire class of bugs — malformed JSON, missing fields, hallucinated keys. It turns Gemini from a text generator into a typed API endpoint.

3. **Client-side ML is production-ready**. MediaPipe Pose running as WASM in the browser delivers 33-landmark tracking at 30 FPS with zero server cost. The "AI at the edge" future isn't coming — it's here.

4. **Hybrid architectures beat pure-cloud approaches**. By splitting work between local rules (instant, deterministic) and cloud AI (nuanced, contextual), we achieved both speed and intelligence. Neither layer alone would be sufficient.

5. **Sports biomechanics is surprisingly tractable**. Five rules — elbow angle, knee bend, stance width, body rotation, and their drill-specific variants — cover the majority of common form mistakes. Research papers gave us the thresholds; Gemini 3 gave us the coaching voice.

6. **Latency is a UX feature, not a metric**. Displaying `latency_ms: 340` next to each coaching cue builds trust. Users can *see* the AI responding in real time. Transparency about speed is as important as speed itself.

---

## What's next for RallyCoach

- **Multi-camera fusion**: Combine front and side camera angles for true 3D pose reconstruction, eliminating depth ambiguity from single-view analysis
- **Live multiplayer coaching**: Real-time doubles analysis where Gemini coaches both players simultaneously, analyzing court positioning and partner coordination
- **Wearable integration**: Connect to smartwatch accelerometers for wrist-snap detection and racket-head speed — metrics that pure vision can't capture
- **Community drill library**: Let coaches publish custom drills with ideal pose keyframes; Gemini 3 evaluates player attempts against coach-defined standards
- **Tournament mode**: Record and analyze competitive matches with rally-by-rally breakdowns, win-probability graphs, and opponent tendency reports
- **Mobile-native app**: Port MediaPipe to on-device ML (TensorFlow Lite) for court-side coaching without WiFi dependency
- **Gemini 3 Pro Video**: When Gemini 3's native video understanding reaches production, replace frame-by-frame extraction with single-pass video analysis for 10x faster deep analytics
