# RallyCoach - AI-Powered Badminton Coach

An intelligent badminton coaching application that uses computer vision and AI to analyze technique, provide real-time feedback, generate tactical insights, and recommend equipment.

## Features

### Video Analytics
Upload badminton videos for comprehensive AI analysis:
- **Pose Detection**: MediaPipe extracts body landmarks from every frame
- **Shot Detection**: Automatically identifies shots based on wrist velocity patterns
- **Form Analysis**: Compares player form against ideal technique and identifies errors
- **AI Skill Assessment**: Gemini AI auto-detects skill level (Beginner/Intermediate/Advanced)
- **Multi-Player Support**: Detects multiple players in doubles matches with player selection
- **Skeleton Overlay**: Visual feedback with color-coded form quality (green/yellow/red)
- **Drill Recommendations**: Targeted drills for each detected issue

### Practice Mode
Real-time form coaching using your webcam:
- **Live Pose Tracking**: MediaPipe runs in-browser for instant feedback
- **Green/Red Skeleton**: Visual indicator of form quality
- **Coaching Cues**: Text feedback guiding your movements
- **Session Recording**: Optionally record practice sessions for later review
- **Metrics Display**: Real-time elbow angle, knee angle, stance width
- **Progress Tracking**: Green/red frame ratio tracks consistency

### Strategy Analysis
Analyze rally patterns and get tactical insights:
- **Trajectory Tracking**: Visualize shot placement patterns
- **2D/3D Court View**: Interactive court visualization with Three.js
- **Rally State Machine**: Tracks attack/defense/neutral phases
- **Shot Recommendations**: AI suggests optimal shot selections with rationale
- **Coaching Points**: Personalized tactical advice

### Racket Finder
Personalized equipment recommendations:
- **Profile-Based Matching**: Based on skill level, play style, and weaknesses
- **Detailed Specs**: Weight, balance, flexibility, price range
- **Match Scoring**: Percentage match for each recommendation
- **eBay Integration**: Direct links to purchase options
- **Favorites**: Save rackets for later reference

## Tech Stack

### Frontend (rallycoach/)
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **@mediapipe/tasks-vision** for in-browser pose detection
- **@react-three/fiber** + **Three.js** for 3D court visualization
- **Recharts** for analytics charts
- **@supabase/supabase-js** for auth and data

### Backend (backend/)
- **Python 3.11** with FastAPI
- **MediaPipe** for server-side pose estimation
- **OpenCV** for video processing and annotation
- **Google Gemini API** (gemini-2.0-flash-exp) for AI coaching feedback
- **Supabase** for authentication, database, and video storage

## Project Structure

```
RallyCoach/
├── backend/
│   ├── main.py              # FastAPI server with all endpoints
│   ├── analysis.py          # Video analysis pipeline
│   ├── pose_estimation.py   # MediaPipe pose detection
│   ├── gemini_client.py     # Gemini API integration
│   ├── video_annotator.py   # Skeleton overlay rendering
│   ├── video_processing.py  # Video frame utilities
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Backend environment variables
├── rallycoach/              # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── dashboard/         # User dashboard
│   │   │   ├── analytics/         # Video analysis page
│   │   │   ├── practice/          # Real-time practice mode
│   │   │   ├── strategy/          # Strategy analysis
│   │   │   ├── racket/            # Racket recommendations
│   │   │   ├── history/           # Session history
│   │   │   └── api/               # API routes
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and engines
│   │   │   ├── supabase.ts        # Supabase client
│   │   │   ├── pose-utils.ts      # Pose processing utilities
│   │   │   ├── rules-engine.ts    # Form evaluation rules
│   │   │   ├── scoring-rules.ts   # Banded scoring system
│   │   │   ├── strategy_engine/   # Rally analysis engine
│   │   │   └── courtSpec.ts       # BWF court specifications
│   │   └── data/            # Static data (rackets.json)
│   ├── package.json
│   └── .env.local           # Frontend environment variables
├── supabase-setup.sql       # Initial database schema
├── supabase-migration-v2.sql # Extended schema with sessions/issues
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Google AI Studio account (for Gemini API)

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)

2. Get your credentials from Settings > API:
   - Project URL
   - Anon Key (public)
   - Service Role Key (secret, for backend)

3. Run the database migrations in SQL Editor:
   - First run `supabase-setup.sql` for base tables
   - Then run `supabase-migration-v2.sql` for extended schema

4. Create a Storage bucket named `videos`:
   - Set to Private
   - Add policies for authenticated users

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy for later use

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables in backend/.env:
# GEMINI_API_KEY=your-gemini-key
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-role-key
```

### 4. Frontend Setup

```bash
cd rallycoach

# Install dependencies
npm install

# Configure environment variables in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# GEMINI_API_KEY=your-gemini-key (for API routes)
```

### 5. Run the Application

**Start Backend:**
```bash
cd backend
# Ensure venv is activated
python main.py
```
Backend runs on `http://localhost:8000`

**Start Frontend:**
```bash
cd rallycoach
npm run dev
```
Frontend runs on `http://localhost:3000`

## Usage

1. **Sign Up / Sign In** - Create an account at the landing page

2. **Video Analytics** - Upload a badminton video to get:
   - Pose skeleton overlay
   - Shot-by-shot analysis
   - Form error detection
   - AI skill level assessment
   - Recommended drills

3. **Practice Mode** - Use your webcam for real-time coaching:
   - Stand 6-8 feet from camera
   - Ensure good lighting
   - Follow the skeleton overlay colors

4. **Strategy Analysis** - Upload match footage to:
   - Visualize rally patterns
   - Get tactical recommendations
   - Review coaching points

5. **Racket Finder** - Get equipment recommendations:
   - Select skill level and play style
   - Choose areas to improve
   - Browse matched rackets

## API Endpoints

### Backend API (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Service status |
| `/api/analyze` | POST | Analyze uploaded video |
| `/api/sessions` | GET | List user sessions |
| `/api/sessions/{id}` | GET | Get session details |
| `/api/practice` | POST | Save practice session |
| `/api/stats/dashboard` | GET | Dashboard statistics |
| `/temp/{filename}` | GET | Serve annotated videos |

### Frontend API Routes (Next.js)

| Route | Description |
|-------|-------------|
| `/api/analysis/start` | Start video analysis |
| `/api/analysis/auto-level` | Gemini skill level detection |
| `/api/practice/tick` | Practice mode tick feedback |
| `/api/strategy/recommend` | Strategy recommendations |
| `/api/racket/recommend` | Racket recommendations |

## How It Works

### Video Analysis Pipeline

1. **Upload** - Video uploaded via TUS resumable protocol to Supabase Storage
2. **Pose Extraction** - MediaPipe extracts 33 body landmarks per frame
3. **Shot Detection** - Wrist velocity spikes identify shot events
4. **Shot Classification** - Heuristics classify shots (Smash, Clear, Net Shot, etc.)
5. **Form Evaluation** - Rules engine compares poses to ideal form
6. **Skill Assessment** - Gemini AI analyzes metrics to determine skill level
7. **Feedback Generation** - Gemini provides coaching feedback and training plans
8. **Annotation** - Skeleton overlay rendered on video with color-coded quality
9. **Storage** - Results saved to Supabase (sessions, issues tables)

### Real-Time Practice

1. **Webcam Capture** - Browser MediaDevices API
2. **In-Browser Pose** - MediaPipe Tasks Vision runs client-side
3. **Rule Evaluation** - Form rules evaluated every frame
4. **Visual Feedback** - Canvas overlay shows skeleton in green/red
5. **Coaching Cues** - Text feedback guides corrections
6. **Session Tracking** - Metrics aggregated and saved

## Troubleshooting

### Video Upload Issues
- Check file size (max 100MB)
- Verify Supabase storage bucket exists and has correct policies
- Check browser console for CORS errors

### Pose Detection Issues
- Ensure good lighting and camera angle
- Keep full body visible in frame
- Try the demo mode if camera fails

### Gemini API Errors
- Verify API key is valid
- Check quota limits in Google AI Studio
- Ensure network connectivity

### Database Errors
- Run both SQL migration files in order
- Check RLS policies are configured
- Verify service role key for backend writes

## License

MIT License - Feel free to use and modify for your projects.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for pose estimation
- [Google Gemini](https://ai.google.dev/) for AI coaching
- [Supabase](https://supabase.com/) for backend services
- [Next.js](https://nextjs.org/) and [React](https://react.dev/) for the frontend
#   R a l l y C o a c h  
 