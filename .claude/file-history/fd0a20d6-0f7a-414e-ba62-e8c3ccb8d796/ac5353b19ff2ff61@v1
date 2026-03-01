# RallyCoach - AI-Powered Badminton Training

A modern web application that provides AI-powered badminton coaching using pose estimation and Google's Gemini AI models.

## Features

- **Landing Page**: Beautiful hero section with scroll-to navigation
- **Authentication**: Supabase-powered login/signup
- **Dashboard**: Track your progress with interactive charts
- **Analytics**: Upload videos for AI analysis and personalized training plans
- **Practice Mode**: Real-time pose detection with live coaching cues
- **Racket Recommendations**: AI-powered equipment suggestions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Pose Detection**: MediaPipe Pose (browser-based)
- **Backend**: Next.js Route Handlers
- **Database/Auth/Storage**: Supabase
- **AI**: Google Gemini 2.0 (Flash for live coaching, Pro for analytics)

## Setup Instructions

### 1. Clone and Install

```bash
cd rallycoach
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` in the Supabase SQL Editor
3. Create a storage bucket named `videos` (public)
4. Copy your project URL and anon key

### 3. Configure Gemini API

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Ensure you have access to Gemini 2.0 Flash and Pro models

### 4. Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses 3 main tables:

- `sessions`: Practice session records with scores
- `analysis_results`: Video analysis results from Gemini Pro
- `racket_favorites`: User's favorited racket recommendations

See `supabase/schema.sql` for the complete schema.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analysis/start` | POST | Start video analysis |
| `/api/analysis/[id]` | GET | Get analysis results |
| `/api/practice/tick` | POST | Get live coaching cue |
| `/api/racket/recommend` | POST | Get racket recommendations |

## Gemini Models Used

- **Gemini 2.0 Flash**: Fast, lightweight model for real-time practice coaching
- **Gemini 2.0 Pro**: Detailed video analysis and training plan generation
- **Gemini 2.0 Pro (Image)**: Optional drill visualization generation

## Notes

- Pose detection runs entirely in the browser using MediaPipe
- If pose detection fails, the app provides mock data for demo purposes
- Video analysis is simulated (extracts pose metrics summary from video)
- Racket recommendations use a local catalog with AI-powered ranking

## License

MIT
