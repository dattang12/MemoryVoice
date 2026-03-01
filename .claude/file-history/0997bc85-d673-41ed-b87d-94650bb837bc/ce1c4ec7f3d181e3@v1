'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardNav from '@/components/DashboardNav';
import DrillCard from '@/components/DrillCard';
import { TabbedDrillAnimation } from '@/components/Skeleton3D';
import { EventTypeBadge, MatchFormatBadge } from '@/components/PlayerSelectionModal';
import { supabase, getVideoUrl, getSignedVideoUrl, videoExists, getPracticeRecordingUrl } from '@/lib/supabase';
import {
  drawSkeleton,
  extractMetrics,
} from '@/lib/pose-utils';
import {
  DRILLS,
  evaluateForm,
  type EvaluationResult
} from '@/lib/rules-engine';
import {
  evaluateWithBands,
  evaluateSessionWithValidation,
  SCORING_LEGEND,
  type SessionScoringResult,
} from '@/lib/scoring-rules';
import type { Session, PoseLandmark, PoseMetrics, StrategyResult } from '@/lib/types';

// ============================================
// View Details Page - Replay Stored Results
// ============================================

interface StoredIssue {
  id: string;
  code: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
  timestamps?: number[];
  drill?: any;
}

interface FrameAnalysis {
  timestamp: number;
  landmarks: PoseLandmark[] | null;
  evaluation: EvaluationResult | null;
  metrics: PoseMetrics | null;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Session data
  const [session, setSession] = useState<Session | null>(null);
  const [issues, setIssues] = useState<StoredIssue[]>([]);
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video playback state
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [poseData, setPoseData] = useState<Array<PoseLandmark[] | null>>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<StoredIssue | null>(null);
  // PHASE 3: Session validation state
  const [sessionScoring, setSessionScoring] = useState<SessionScoringResult | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Banded scoring display
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [currentBandedScore, setCurrentBandedScore] = useState<any>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Load session data
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const loadSession = async (id: string) => {
    setLoading(true);
    setError(null);
    setVideoError(null);
    setVideoLoading(true);

    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (sessionError) throw sessionError;

      setSession(sessionData);
      setSkillLevel(sessionData.skill_level || 'intermediate');

      // Handle video URL - try multiple approaches
      await loadVideoUrl(sessionData);

      // Load pose data if available
      let poseDataToUse = sessionData.pose_data;

      // For strategy sessions without pose_data, try to find pose data from related sessions
      if (!poseDataToUse && sessionData.type === 'strategy') {
        console.log('Strategy session has no pose_data, looking for related session...');

        // Try to find another session with the same video that has pose_data
        // First try by video_path, then by video_url
        let relatedSession = null;

        if (sessionData.video_path) {
          const { data } = await supabase
            .from('sessions')
            .select('pose_data')
            .eq('video_path', sessionData.video_path)
            .not('pose_data', 'is', null)
            .neq('id', sessionData.id)
            .limit(1);

          if (data && data.length > 0) {
            relatedSession = data[0];
            console.log('Found pose_data from related session by video_path');
          }
        }

        if (!relatedSession && sessionData.video_url) {
          const { data } = await supabase
            .from('sessions')
            .select('pose_data')
            .eq('video_url', sessionData.video_url)
            .not('pose_data', 'is', null)
            .neq('id', sessionData.id)
            .limit(1);

          if (data && data.length > 0) {
            relatedSession = data[0];
            console.log('Found pose_data from related session by video_url');
          }
        }

        if (relatedSession?.pose_data) {
          poseDataToUse = relatedSession.pose_data;
        } else {
          console.log('No related session with pose_data found');
        }
      }

      if (poseDataToUse) {
        setPoseData(poseDataToUse);

        // PHASE 3: Validate session pose data and compute scoring
        const scoring = evaluateSessionWithValidation(
          poseDataToUse,
          sessionData.skill_level || 'intermediate'
        );
        setSessionScoring(scoring);
        console.log('Session scoring:', scoring);
      }

      // Load issues
      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .eq('session_id', id)
        .order('severity', { ascending: false });

      if (!issuesError && issuesData) {
        const mappedIssues = issuesData.map((issue: any) => ({
          id: issue.id,
          code: issue.code,
          title: issue.title,
          severity: issue.severity,
          description: issue.description,
          timestamps: issue.timestamps || [],
          drill: issue.drill || DRILLS[issue.code?.toLowerCase().replace(/_/g, '-')],
        }));
        setIssues(mappedIssues);
        if (mappedIssues.length > 0) {
          setSelectedIssue(mappedIssues[0]);
        }
      }

      // Load strategy results if strategy session
      if (sessionData.type === 'strategy') {
        const { data: strategyData } = await supabase
          .from('strategy_results')
          .select('*')
          .eq('session_id', id)
          .single();

        if (strategyData) {
          setStrategyResult(strategyData);
        }
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session. It may have been deleted.');
    } finally {
      setLoading(false);
      setVideoLoading(false);
    }
  };

  // Load video URL with fallback approaches
  const loadVideoUrl = async (sessionData: Session) => {
    // First, check for practice recording (for practice sessions)
    if (sessionData.type === 'practice' && sessionData.practice_video_path) {
      try {
        const signedUrl = await getPracticeRecordingUrl(sessionData.practice_video_path, 3600);
        if (signedUrl) {
          setVideoUrl(signedUrl);
          setVideoLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to get practice recording URL:', e);
      }
    }

    // If no video path or URL stored, video wasn't uploaded
    if (!sessionData.video_path && !sessionData.video_url && !sessionData.practice_video_path) {
      setVideoError('No video was stored for this session (upload may have failed).');
      setVideoLoading(false);
      return;
    }

    // Try the stored public URL first
    if (sessionData.video_url) {
      try {
        // Test if URL is accessible
        const response = await fetch(sessionData.video_url, { method: 'HEAD' });
        if (response.ok) {
          setVideoUrl(sessionData.video_url);
          setVideoLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Public URL not accessible, trying signed URL...');
      }
    }

    // Try to get a signed URL if we have the path
    if (sessionData.video_path) {
      try {
        const signedUrl = await getSignedVideoUrl(sessionData.video_path, 3600);
        if (signedUrl) {
          setVideoUrl(signedUrl);
          setVideoLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to get signed URL:', e);
      }
    }

    // If we get here, video is unavailable
    setVideoError('Video unavailable. The file may have been deleted or the upload failed.');
    setVideoLoading(false);
  };

  // Handle video load error
  const handleVideoError = useCallback(() => {
    console.error('Video element error: Failed to load video');
    setVideoError('Failed to load video. The format may not be supported or the file is corrupted.');
  }, []);

  // Render skeleton overlay
  const renderFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showSkeleton || poseData.length === 0) return;

    // Find closest frame
    const frameIndex = Math.floor(video.currentTime * 10); // Assuming 10fps sample rate
    const landmarks = poseData[Math.min(frameIndex, poseData.length - 1)];

    if (landmarks) {
      // Use banded scoring
      const bandedResult = evaluateWithBands(landmarks, skillLevel);
      setCurrentBandedScore(bandedResult);

      // Choose color based on band
      const isGreen = bandedResult.overall_band === 'green';
      const isYellow = bandedResult.overall_band === 'yellow';

      // Draw with appropriate color
      const color = isGreen ? '#22c55e' : isYellow ? '#eab308' : '#ef4444';

      // Custom draw with banded color
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.fillStyle = color;

      // Draw skeleton connections
      const POSE_CONNECTIONS = [
        [7, 2], [2, 0], [0, 5], [5, 8],
        [11, 12], [11, 23], [12, 24], [23, 24],
        [11, 13], [13, 15],
        [12, 14], [14, 16],
        [23, 25], [25, 27],
        [24, 26], [26, 28],
      ];

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (start && end && start.visibility > 0.5 && end.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
        }
      }

      // Draw joints
      for (const landmark of landmarks) {
        if (landmark.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }
      }
    }

    if (!video.paused) {
      animationRef.current = requestAnimationFrame(renderFrame);
    }
  }, [poseData, showSkeleton, skillLevel]);

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      renderFrame();
    }
  }, [renderFrame]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(renderFrame);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    }
  }, [renderFrame]);

  // Jump to timestamp
  const jumpToTimestamp = useCallback((timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(timestamp);
      setTimeout(renderFrame, 50);
    }
  }, [renderFrame]);

  // Go to next mistake
  const goToNextMistake = useCallback(() => {
    const allTimestamps = issues
      .flatMap((i) => i.timestamps || [])
      .sort((a, b) => a - b);

    const nextTimestamp = allTimestamps.find((t) => t > currentTime + 0.5);
    if (nextTimestamp !== undefined) {
      jumpToTimestamp(nextTimestamp);
    } else if (allTimestamps.length > 0) {
      jumpToTimestamp(allTimestamps[0]);
    }
  }, [issues, currentTime, jumpToTimestamp]);

  // Handle video loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTimeout(renderFrame, 100);
    }
  }, [renderFrame]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen app-page">
        <DashboardNav />
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-96 bg-gray-200 rounded-xl" />
                <div className="h-96 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen app-page">
        <DashboardNav />
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
              <p className="text-gray-500 mb-6">{error || 'This session could not be loaded.'}</p>
              <Link
                href="/history"
                className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
              >
                Back to History
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-page">
      <DashboardNav />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/history" className="hover:text-primary-600">
                History
              </Link>
              <span>/</span>
              <span className="text-gray-900">Session Details</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {session.type === 'strategy' ? 'Strategy Analysis' :
                   session.type === 'practice' ? 'Practice Session' : 'Video Analysis'}
                  {session.match_format && (
                    <MatchFormatBadge format={session.match_format} />
                  )}
                  {session.event_type && (
                    <EventTypeBadge eventType={session.event_type} />
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {session.filename && <span className="mr-2">{session.filename}</span>}
                  {formatDate(session.created_at)}
                </p>
              </div>

              {/* Score badge */}
              {session.overall_score !== undefined && session.overall_score > 0 && (
                <div className="text-right">
                  <p className={`text-4xl font-bold ${
                    session.overall_score >= 80 ? 'text-green-600' :
                    session.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(session.overall_score)}%
                  </p>
                  <p className="text-sm text-gray-500">Overall Score</p>
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {videoUrl && !videoError ? (
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="relative aspect-video">
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      onError={handleVideoError}
                      playsInline
                    >
                      <source src={videoUrl} type="video/mp4" />
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/quicktime" />
                      Your browser does not support the video tag.
                    </video>
                    <canvas
                      ref={canvasRef}
                      className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
                        showSkeleton ? '' : 'hidden'
                      }`}
                    />

                    {/* Banded score indicator */}
                    {currentBandedScore && (
                      <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium ${
                        currentBandedScore.overall_band === 'green' ? 'bg-green-500 text-white' :
                        currentBandedScore.overall_band === 'yellow' ? 'bg-yellow-500 text-white' :
                        currentBandedScore.overall_band === 'red' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {SCORING_LEGEND[currentBandedScore.overall_band as keyof typeof SCORING_LEGEND]?.label || 'Unknown'}
                        <span className="ml-2 opacity-75">
                          {Math.round(currentBandedScore.overall_score)}%
                        </span>
                      </div>
                    )}

                    {/* Time display */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={goToNextMistake}
                        disabled={issues.length === 0}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium disabled:opacity-50"
                      >
                        Next Mistake
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Skill level selector */}
                      <select
                        value={skillLevel}
                        onChange={(e) => setSkillLevel(e.target.value as any)}
                        className="text-sm bg-gray-800 text-white border-gray-700 rounded-lg px-2 py-1"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>

                      <label className="flex items-center gap-2 text-white text-sm">
                        <input
                          type="checkbox"
                          checked={showSkeleton}
                          onChange={(e) => {
                            setShowSkeleton(e.target.checked);
                            if (e.target.checked) {
                              setTimeout(renderFrame, 50);
                            }
                          }}
                          className="rounded"
                        />
                        Show Skeleton
                      </label>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="px-4 pb-4">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        if (videoRef.current) {
                          videoRef.current.currentTime = time;
                          setCurrentTime(time);
                          setTimeout(renderFrame, 50);
                        }
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center p-8">
                  {videoLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500 mb-4" />
                      <p className="text-gray-500">Loading video...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Video Unavailable</p>
                      <p className="text-gray-500 text-sm text-center max-w-md">
                        {videoError || 'No video was stored for this session. The upload may have failed or the video was deleted.'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Scoring Legend */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Scoring Legend</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(SCORING_LEGEND).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: value.bgColor, borderColor: value.color, borderWidth: 2 }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: value.color }}>
                          {value.label}
                        </p>
                        <p className="text-xs text-gray-500">{value.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PHASE 3: Debug Panel (dev-only) */}
              {sessionScoring && (
                <div className="bg-gray-800 rounded-xl p-4 shadow-sm text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-100 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Analysis Debug
                    </h3>
                    <button
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {showDebugPanel ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className={`p-2 rounded ${sessionScoring.validation.isValid ? 'bg-green-900' : 'bg-red-900'}`}>
                      <p className="text-xs text-gray-400">Coverage</p>
                      <p className="text-lg font-bold">
                        {(sessionScoring.validation.validPoseRatio * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className={`p-2 rounded ${sessionScoring.validation.avgConfidence >= 0.5 ? 'bg-green-900' : 'bg-yellow-900'}`}>
                      <p className="text-xs text-gray-400">Avg Confidence</p>
                      <p className="text-lg font-bold">
                        {(sessionScoring.validation.avgConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-gray-700">
                      <p className="text-xs text-gray-400">Green Frames</p>
                      <p className="text-lg font-bold text-green-400">
                        {(sessionScoring.greenFrameRatio * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {showDebugPanel && (
                    <div className="mt-4 space-y-3 text-sm">
                      {/* Frame Breakdown */}
                      <div className="bg-gray-700 rounded p-3">
                        <p className="text-xs text-gray-400 mb-2">Frame Breakdown</p>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <p className="text-gray-400">Total</p>
                            <p className="font-medium">{sessionScoring.validation.totalFrames}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Valid</p>
                            <p className="font-medium text-green-400">{sessionScoring.validation.validPoseFrames}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Low Conf</p>
                            <p className="font-medium text-yellow-400">{sessionScoring.validation.lowConfidenceFrames}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">No Pose</p>
                            <p className="font-medium text-red-400">{sessionScoring.validation.noPoseFrames}</p>
                          </div>
                        </div>
                      </div>

                      {/* Band Distribution */}
                      <div className="bg-gray-700 rounded p-3">
                        <p className="text-xs text-gray-400 mb-2">Band Distribution</p>
                        <div className="flex gap-1 h-4 rounded overflow-hidden">
                          <div
                            className="bg-green-500"
                            style={{ width: `${sessionScoring.greenFrameRatio * 100}%` }}
                            title={`Green: ${(sessionScoring.greenFrameRatio * 100).toFixed(1)}%`}
                          />
                          <div
                            className="bg-yellow-500"
                            style={{ width: `${sessionScoring.yellowFrameRatio * 100}%` }}
                            title={`Yellow: ${(sessionScoring.yellowFrameRatio * 100).toFixed(1)}%`}
                          />
                          <div
                            className="bg-red-500"
                            style={{ width: `${sessionScoring.redFrameRatio * 100}%` }}
                            title={`Red: ${(sessionScoring.redFrameRatio * 100).toFixed(1)}%`}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Green {(sessionScoring.greenFrameRatio * 100).toFixed(0)}%</span>
                          <span>Yellow {(sessionScoring.yellowFrameRatio * 100).toFixed(0)}%</span>
                          <span>Red {(sessionScoring.redFrameRatio * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Persistent Issues */}
                      {sessionScoring.persistentIssues.length > 0 && (
                        <div className="bg-gray-700 rounded p-3">
                          <p className="text-xs text-gray-400 mb-2">Persistent Issues</p>
                          <ul className="text-xs space-y-1">
                            {sessionScoring.persistentIssues.map((issue, i) => (
                              <li key={i} className="text-yellow-400">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Validation Status */}
                      <div className={`rounded p-3 text-xs ${sessionScoring.canShowGreatForm ? 'bg-green-900' : 'bg-yellow-900'}`}>
                        <p className="font-medium">
                          {sessionScoring.canShowGreatForm ? '✓ Can show "Great form!"' : '⚠ Cannot show "Great form!"'}
                        </p>
                        <p className="text-gray-300 mt-1">{sessionScoring.displayMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Current metrics display */}
              {currentBandedScore && currentBandedScore.metrics && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Frame Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(currentBandedScore.metrics).map(([key, score]: [string, any]) => (
                      <div key={key} className={`p-3 rounded-lg ${
                        SCORING_LEGEND[score.band as keyof typeof SCORING_LEGEND]?.bgColor || 'bg-gray-100'
                      }`}>
                        <p className="text-xs text-gray-600 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-semibold" style={{
                          color: SCORING_LEGEND[score.band as keyof typeof SCORING_LEGEND]?.color
                        }}>
                          {typeof score.value === 'number' ? score.value.toFixed(1) : score.value}
                        </p>
                        {score.feedback && (
                          <p className="text-xs text-gray-500 mt-1">{score.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Issues Panel */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Detected Issues ({issues.length})
              </h3>

              {issues.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {issues.map((issue, index) => (
                    <div key={issue.id || index}>
                      <DrillCard
                        issue={issue}
                        onTimestampClick={jumpToTimestamp}
                        currentTime={currentTime}
                      />
                    </div>
                  ))}
                </div>
              ) : sessionScoring?.canShowGreatForm ? (
                /* PHASE 3: Only show "Great form!" if session validation passed */
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
                  <p className="font-medium">Great form!</p>
                  <p className="text-sm">No major issues detected in this session.</p>
                </div>
              ) : sessionScoring && !sessionScoring.validation.isValid ? (
                /* PHASE 3: Low confidence / coverage warning */
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                  <p className="font-medium">Insufficient Pose Data</p>
                  <p className="text-sm">{sessionScoring.displayMessage}</p>
                  <p className="text-xs mt-2 text-yellow-600">
                    Coverage: {(sessionScoring.validation.validPoseRatio * 100).toFixed(0)}% |
                    Confidence: {(sessionScoring.validation.avgConfidence * 100).toFixed(0)}%
                  </p>
                </div>
              ) : (
                /* PHASE 3: Neutral state - good coverage but minor issues */
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700">
                  <p className="font-medium">Form Analysis Complete</p>
                  <p className="text-sm">{sessionScoring?.displayMessage || 'Minor adjustments may help improve your form.'}</p>
                </div>
              )}

              {/* 3D Animation for selected issue */}
              {selectedIssue?.drill?.keyframeType && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Correct Form</h4>
                  <TabbedDrillAnimation
                    drillType={selectedIssue.drill.keyframeType}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Strategy Results (if applicable) */}
          {strategyResult && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Strategy Analysis Results</h2>

              {/* Coaching Points */}
              {strategyResult.coaching_points && strategyResult.coaching_points.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Key Tactical Insights</h3>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-4">
                      {strategyResult.coaching_points.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                            {index + 1}
                          </span>
                          <p className="text-gray-700">{point}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
