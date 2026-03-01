import { NextResponse } from 'next/server';
import { getCoachingCue } from '@/lib/gemini';
import { evaluateMetrics, DEFAULT_THRESHOLDS } from '@/lib/pose-utils';
import type { TickRequest, TickResponse, PoseMetrics } from '@/lib/types';

// Cache for rate limiting Gemini calls
let lastGeminiCall = 0;
const GEMINI_CALL_INTERVAL = 2000; // Minimum 2 seconds between Gemini calls
let cachedResponse: { cue: string; focus_metric: string; commentary?: string; reason?: string; latency_ms?: number } | null = null;

export async function POST(request: Request) {
  try {
    const body: TickRequest = await request.json();
    const { metrics_snapshot, drill_id } = body;

    if (!metrics_snapshot) {
      return NextResponse.json(
        { error: 'metrics_snapshot is required' },
        { status: 400 }
      );
    }

    const metrics: PoseMetrics = metrics_snapshot;

    // Evaluate metrics locally first
    const { isGreen, feedback } = evaluateMetrics(metrics);

    // Determine if we should call Gemini (rate limited)
    const now = Date.now();
    const shouldCallGemini = now - lastGeminiCall > GEMINI_CALL_INTERVAL;

    let cue = feedback[0];
    let focusMetric = determineFocusMetric(metrics);
    let commentary = '';
    let reason = '';
    let latency_ms: number | undefined;

    if (shouldCallGemini && process.env.GEMINI_API_KEY) {
      try {
        lastGeminiCall = now;

        // Sanitize drill_id to prevent prompt injection
        const safeDrillId = drill_id && typeof drill_id === 'string'
          ? drill_id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
          : null;
        const drillContext = safeDrillId
          ? `Practicing drill: ${safeDrillId}`
          : undefined;

        const geminiResult = await getCoachingCue(metrics, drillContext);
        cue = geminiResult.cue;
        focusMetric = geminiResult.focus_metric;
        commentary = geminiResult.commentary;
        reason = geminiResult.reason;
        latency_ms = geminiResult.latency_ms;

        // Cache the response
        cachedResponse = { cue, focus_metric: focusMetric, commentary, reason, latency_ms };
      } catch (error) {
        console.error('Gemini error, using fallback:', error);
        if (cachedResponse) {
          cue = cachedResponse.cue;
          focusMetric = cachedResponse.focus_metric;
          commentary = cachedResponse.commentary || '';
          reason = cachedResponse.reason || '';
          latency_ms = cachedResponse.latency_ms;
        }
      }
    } else if (cachedResponse && !shouldCallGemini) {
      cue = cachedResponse.cue;
      focusMetric = cachedResponse.focus_metric;
      commentary = cachedResponse.commentary || '';
      reason = cachedResponse.reason || '';
      latency_ms = cachedResponse.latency_ms;
    }

    const response: TickResponse = {
      cue,
      focus_metric: focusMetric,
      green_thresholds: DEFAULT_THRESHOLDS,
      is_green: isGreen,
      commentary,
      reason,
      latency_ms,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Practice tick error:', error);
    return NextResponse.json(
      { error: 'Failed to process tick' },
      { status: 500 }
    );
  }
}

function determineFocusMetric(metrics: PoseMetrics): string {
  const issues: { metric: string; deviation: number }[] = [];

  // Check elbow angle (ideal: 90-120)
  if (metrics.elbow_angle < 90) {
    issues.push({
      metric: 'elbow_angle',
      deviation: 90 - metrics.elbow_angle,
    });
  } else if (metrics.elbow_angle > 120) {
    issues.push({
      metric: 'elbow_angle',
      deviation: metrics.elbow_angle - 120,
    });
  }

  // Check knee angle (ideal: 120-150)
  if (metrics.knee_angle < 120) {
    issues.push({
      metric: 'knee_angle',
      deviation: 120 - metrics.knee_angle,
    });
  } else if (metrics.knee_angle > 150) {
    issues.push({
      metric: 'knee_angle',
      deviation: metrics.knee_angle - 150,
    });
  }

  // Check stance width (ideal: 0.3-0.5)
  if (metrics.stance_width_norm < 0.3) {
    issues.push({
      metric: 'stance_width_norm',
      deviation: (0.3 - metrics.stance_width_norm) * 100, // Scale up for comparison
    });
  } else if (metrics.stance_width_norm > 0.5) {
    issues.push({
      metric: 'stance_width_norm',
      deviation: (metrics.stance_width_norm - 0.5) * 100,
    });
  }

  // Check rotation (ideal: 0.1-0.3)
  if (metrics.shoulder_hip_rotation_proxy < 0.1) {
    issues.push({
      metric: 'shoulder_hip_rotation_proxy',
      deviation: (0.1 - metrics.shoulder_hip_rotation_proxy) * 100,
    });
  } else if (metrics.shoulder_hip_rotation_proxy > 0.3) {
    issues.push({
      metric: 'shoulder_hip_rotation_proxy',
      deviation: (metrics.shoulder_hip_rotation_proxy - 0.3) * 100,
    });
  }

  // Return the metric with the largest deviation, or a default
  if (issues.length === 0) {
    return 'general_form';
  }

  issues.sort((a, b) => b.deviation - a.deviation);
  return issues[0].metric;
}
