import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from '@/lib/supabase';
import { analyzeVideo, generateDrillVisual } from '@/lib/gemini';
import { generateMockMetrics } from '@/lib/pose-utils';
import type { PoseMetrics } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { video_path } = await request.json();

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

    // For demo, use a placeholder user ID if not authenticated
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
      // Continue anyway for demo
    }

    // Process asynchronously (in a real app, this would be a background job)
    processAnalysis(analysisId, video_path, supabase);

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
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    // Simulate video processing by generating mock metrics
    // In a real implementation, you would:
    // 1. Download the video from Supabase storage
    // 2. Process each frame with MediaPipe/MoveNet
    // 3. Extract pose metrics from each frame
    const metricsHistory: PoseMetrics[] = [];

    // Generate 30-60 seconds worth of mock data (30 fps = 900-1800 frames)
    // We'll sample at 1 fps for the summary
    for (let i = 0; i < 60; i++) {
      metricsHistory.push(generateMockMetrics());
    }

    // Add some variation to make it realistic
    // Simulate some "bad frames" at certain points
    for (let i = 0; i < 60; i += 10) {
      metricsHistory[i] = {
        ...metricsHistory[i],
        elbow_angle: 70 + Math.random() * 20, // Too bent
      };
    }

    // Call Gemini Pro for analysis
    const analysisResult = await analyzeVideo(metricsHistory, videoPath);

    // Optionally generate drill visuals (this may fail, so we wrap in try-catch)
    try {
      if (analysisResult.drills.length > 0) {
        const drillVisuals: string[] = [];

        // Try to generate 1-2 visuals (limit to avoid rate limits)
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
      // Continue without visuals - this is optional
    }

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

    // Mark as error
    await supabase
      .from('analysis_results')
      .update({
        status: 'error',
      })
      .eq('id', analysisId);
  }
}
