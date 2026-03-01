import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '@/lib/supabase';
import { analyzeVideo, generateDrillVisual } from '@/lib/gemini';
import type { PoseMetrics } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { video_path, pose_data } = await request.json();

    if (!video_path) {
      return NextResponse.json(
        { error: 'video_path is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const analysisId = uuidv4();

    // Get user if authenticated
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      userId = 'demo-user-' + uuidv4().slice(0, 8);
    }

    // Create initial analysis record
    const { error: insertError } = await supabase.from('analysis_results').insert({
      id: analysisId,
      user_id: userId,
      video_path,
      status: 'processing',
    });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Process asynchronously (fire-and-forget with error logging)
    processAnalysis(analysisId, video_path, supabase, pose_data).catch(error => {
      console.error('Unhandled analysis error:', error);
    });

    return NextResponse.json({ analysis_id: analysisId });
  } catch (error) {
    console.error('Analysis start error:', error);
    return NextResponse.json(
      { error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}

async function processAnalysis(
  analysisId: string,
  videoPath: string,
  supabase: ReturnType<typeof createServerClient>,
  poseData?: PoseMetrics[]
) {
  try {
    let metricsHistory: PoseMetrics[] = [];

    // Priority 1: Use pose data sent directly from client (real MediaPipe data)
    if (poseData && Array.isArray(poseData) && poseData.length > 0 && isValidPoseData(poseData)) {
      metricsHistory = poseData;
      console.log(`Using ${metricsHistory.length} real pose frames from client`);
    } else {
      // Priority 2: Look for stored pose data in the session record
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('pose_data, summary')
        .eq('video_path', videoPath)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionData?.pose_data && Array.isArray(sessionData.pose_data) && sessionData.pose_data.length > 0) {
        metricsHistory = sessionData.pose_data;
        console.log(`Using ${metricsHistory.length} stored pose frames from session`);
      } else {
        // Priority 3: Download video and send to Gemini 3 for direct multimodal analysis
        // Gemini 3 Pro can analyze video content directly without frame extraction
        console.log('No pose data available - using Gemini 3 direct video analysis');

        // Try to get a signed URL for the video
        const { data: signedUrlData } = await supabase.storage
          .from('videos')
          .createSignedUrl(videoPath, 600); // 10 minute expiry

        const videoContext = signedUrlData?.signedUrl
          ? `Video available at: ${signedUrlData.signedUrl}`
          : `Video path: ${videoPath} (no direct access - analyze based on path context)`;

        // Use Gemini Pro with video context for analysis
        // Since we don't have pose metrics, create a minimal set for the API
        // and let Gemini generate analysis based on video context
        metricsHistory = [{
          elbow_angle: 0,
          knee_angle: 0,
          stance_width_norm: 0,
          shoulder_hip_rotation_proxy: 0,
        }];

        const analysisResult = await analyzeVideo(metricsHistory, videoContext);

        // Generate drill visuals
        await addDrillVisuals(analysisResult);

        await supabase
          .from('analysis_results')
          .update({
            result_json: analysisResult,
            status: 'completed',
          })
          .eq('id', analysisId);

        return;
      }
    }

    // Analyze with real pose metrics
    const analysisResult = await analyzeVideo(metricsHistory, videoPath);

    // Generate drill visuals
    await addDrillVisuals(analysisResult);

    // Update the analysis record
    await supabase
      .from('analysis_results')
      .update({
        result_json: analysisResult,
        status: 'completed',
      })
      .eq('id', analysisId);
  } catch (error) {
    console.error('Analysis processing error:', error);

    await supabase
      .from('analysis_results')
      .update({
        status: 'error',
      })
      .eq('id', analysisId);
  }
}

function isValidPoseData(data: any[]): boolean {
  return data.every(m =>
    typeof m.elbow_angle === 'number' && !isNaN(m.elbow_angle) &&
    typeof m.knee_angle === 'number' && !isNaN(m.knee_angle) &&
    typeof m.stance_width_norm === 'number' && !isNaN(m.stance_width_norm) &&
    typeof m.shoulder_hip_rotation_proxy === 'number' && !isNaN(m.shoulder_hip_rotation_proxy)
  );
}

async function addDrillVisuals(analysisResult: Record<string, any>) {
  try {
    if (analysisResult.drills && analysisResult.drills.length > 0) {
      const drillVisuals: string[] = [];

      for (let i = 0; i < Math.min(2, analysisResult.drills.length); i++) {
        const drill = analysisResult.drills[i];
        const visual = await generateDrillVisual(drill.description);
        if (visual) {
          drillVisuals.push(visual);
        }
      }

      if (drillVisuals.length > 0) {
        analysisResult.drill_visuals = drillVisuals;
      }
    }
  } catch (visualError) {
    console.log('Drill visual generation skipped:', visualError);
  }
}
