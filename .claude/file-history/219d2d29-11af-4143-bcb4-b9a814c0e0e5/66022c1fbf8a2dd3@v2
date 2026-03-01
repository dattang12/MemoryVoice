# RallyCoach Frontend — Next.js 14

> The client-side brain of RallyCoach: real-time pose detection, Gemini 3 integration, and a premium coaching UI — all running in the browser.

## How It Works

```
Webcam → MediaPipe WASM (client) → 33 landmarks → Rules Engine → Gemini 3 Flash → Coaching Cue (<500ms)
```

1. **MediaPipe Tasks Vision** runs entirely client-side as a WASM module — zero server load for pose extraction
2. **Rules Engine** evaluates 5 biomechanical rules locally every frame (instant green/red skeleton)
3. **Gemini 3 Flash** receives pose metrics every 1-2 seconds and returns structured coaching with reasoning
4. **Canvas overlay** renders the skeleton in real time, color-coded by form quality

---

## Gemini 3 Integration

### Three Models, Three Purposes

| Model | Route | Purpose | Response Time |
|-------|-------|---------|--------------|
| `gemini-3-flash-preview` | `/api/practice/tick` | Live coaching cues with commentary + reasoning | <500ms |
| `gemini-3-pro-preview` | `/api/analysis/start` | Deep video analysis, training plans, issue detection | 3-8s |
| `gemini-3-pro-image-preview` | `/api/analysis/start` | AI-generated drill instruction images | 5-10s |

### Structured Output with Thinking Tokens

Every Gemini call uses `ResponseSchema` validation for guaranteed JSON structure. Thinking tokens are configured per use case:

```typescript
// Live coaching — minimal thinking for speed
generationConfig: {
  responseMimeType: "application/json",
  responseSchema: practiceTickSchema,
  maxOutputTokens: 2000,
  thinkingConfig: { thinkingBudget: 200 }
}

// Deep analysis — extended reasoning for accuracy
generationConfig: {
  responseMimeType: "application/json",
  responseSchema: analysisSchema,
  maxOutputTokens: 8000,
  thinkingConfig: { thinkingBudget: 1000 }
}
```

### Live Coaching Response Shape

```json
{
  "cue": "Drive through your legs!",
  "focus_metric": "knee_angle",
  "is_green": false,
  "commentary": "Your knees are locked at 172° — bend to 140° to load your legs for explosive push-off",
  "reason": "knee_angle=172° exceeds the 160° threshold, indicating insufficient knee flexion for power generation",
  "latency_ms": 287
}
```

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| **Landing** | `/` | Dark-themed hero with feature showcase and scroll navigation |
| **Login/Signup** | `/login`, `/signup` | Supabase auth with glassmorphism dark UI |
| **Dashboard** | `/dashboard` | Progress charts, session stats, improvement trends |
| **Practice** | `/practice` | Real-time webcam coaching with Gemini 3 Flash |
| **Analytics** | `/analytics` | Video upload → Gemini 3 Pro analysis → training plan |
| **Strategy** | `/strategy` | Court visualization, shot classification, tactical AI |
| **Racket Finder** | `/racket` | AI-powered equipment recommendations |
| **History** | `/history` | Session browsing with detailed replay |

---

## Key Modules

### `lib/gemini.ts` — Gemini 3 Client
- `getPracticeFeedback()` — Flash model, live coaching schema
- `analyzeWithGemini()` — Pro model, deep analysis schema
- `generateDrillImage()` — Pro Image model
- `safeParseJSON()` — Robust JSON extraction from markdown-wrapped responses
- Rate limiting (2s minimum between calls)

### `lib/rules-engine.ts` — Biomechanical Form Rules
Five research-backed rules evaluated every frame:
- `ELBOW_ANGLE_OVERHEAD` (150°-180°) — smash/clear power
- `ELBOW_ANGLE_DRIVE` (90°-120°) — drive control
- `STANCE_WIDTH` (0.8x-1.5x shoulders) — stability
- `KNEE_BEND` (100°-160°) — footwork readiness
- `BODY_ROTATION` (10°-45°) — rotational power

### `lib/pose-utils.ts` — Pose Math
- Joint angle calculation from 3D landmarks
- Stance width normalization (shoulder-relative)
- Visibility confidence filtering
- Frame-by-frame metric aggregation

### `lib/strategy_engine/` — Tactical Analysis
- Court homography (video → BWF court coordinates)
- Shot segmentation and classification
- Position heatmap generation
- Deterministic recommendation engine with confidence scoring

### `components/PoseSandbox3D.tsx` — 3D Skeleton Viewer
- Three.js skeleton rendered from MediaPipe landmarks
- Interactive orbit controls
- Real-time update from pose stream

---

## API Routes

### `POST /api/practice/tick`
**Model**: Gemini 3 Flash (`gemini-3-flash-preview`)

Receives current pose metrics, returns structured coaching cue with live commentary and transparent reasoning. Latency measured and returned per response.

### `POST /api/analysis/start`
**Model**: Gemini 3 Pro (`gemini-3-pro-preview`)

Processes stored pose data for a session. Returns:
- Top 2-3 issues ranked by severity (high/medium/low)
- 2-3 targeted drills with step-by-step instructions
- 5-day personalized training plan
- Technique summary + strategy summary

### `POST /api/racket/recommend`
**Model**: Gemini 3 Flash (`gemini-3-flash-preview`)

Takes player profile (skill level + weaknesses) and returns top 5 rackets with match scores (0-100) and reasoning. Falls back to deterministic scoring if AI is unavailable.

### `POST /api/racket/image`
**Model**: Gemini 3 Pro Image (`gemini-3-pro-image-preview`)

Generates visual drill instruction images on demand.

---

## Design System

| Element | Light Theme (App Pages) | Dark Theme (Auth/Landing) |
|---------|------------------------|--------------------------|
| Background | `app-page` class (white) | `bg-dark-950` + `hero-grid` |
| Cards | `stat-card-premium` (white, subtle shadow) | `bg-dark-800/80 backdrop-blur-xl` |
| Navigation | `nav-dark` sidebar | — |
| Header cards | `bg-gradient-to-r from-dark-900 to-dark-800` | — |
| Inputs | Standard Tailwind | `bg-dark-900/50 border-white/10` |

Custom Tailwind tokens: `dark-50` through `dark-950`, `primary-*`, `accent-green`, `accent-red`

---

## Setup

```bash
npm install

# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key

npm run dev  # → http://localhost:3000
```

Requires Gemini 3 model access (Flash, Pro, Pro Image preview).

---

## Tech Stack

- **Next.js 14** (App Router, Server Components, Route Handlers)
- **React 18** with TypeScript
- **Tailwind CSS** with custom design tokens
- **MediaPipe Tasks Vision** (WASM, client-side)
- **Three.js** + React Three Fiber (3D visualization)
- **Recharts** (analytics dashboards)
- **Supabase** (Auth, PostgreSQL, Storage)
- **Google Gemini 3** (Flash + Pro + Pro Image)

---

## License

MIT
