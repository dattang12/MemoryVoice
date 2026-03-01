import { GoogleGenAI, Type } from '@google/genai';
import type { PoseMetrics, AnalysisResultJson, RacketRecommendation, Racket } from './types';

// Initialize Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Model names - Updated to stable versions
const FLASH_MODEL = 'gemini-2.0-flash';
const PRO_MODEL = 'gemini-2.0-flash';  // Use flash as pro-exp is deprecated
const IMAGE_MODEL = 'gemini-2.0-flash';  // Use flash for image gen since exp model is deprecated

// Schema for practice tick response
const tickResponseSchema = {
  type: Type.OBJECT,
  properties: {
    cue: { type: Type.STRING, description: 'Short coaching cue (max 10 words)' },
    focus_metric: { type: Type.STRING, description: 'The metric to focus on' },
    is_green: { type: Type.BOOLEAN, description: 'Whether current form is good' },
  },
  required: ['cue', 'focus_metric', 'is_green'],
};

// Schema for analysis result
const analysisResultSchema = {
  type: Type.OBJECT,
  properties: {
    top_issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
          affected_metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'title', 'severity', 'description', 'affected_metrics'],
      },
    },
    drills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          duration_minutes: { type: Type.NUMBER },
          target_metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'name', 'description', 'duration_minutes', 'target_metrics', 'instructions'],
      },
    },
    technique_summary: { type: Type.STRING },
    strategy_summary: { type: Type.STRING },
    training_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          focus: { type: Type.STRING },
          drills: { type: Type.ARRAY, items: { type: Type.STRING } },
          duration_minutes: { type: Type.NUMBER },
        },
        required: ['day', 'focus', 'drills', 'duration_minutes'],
      },
    },
  },
  required: ['top_issues', 'drills', 'technique_summary', 'strategy_summary', 'training_plan'],
};

// Gemini Flash: Live micro-coaching for practice mode
export async function getCoachingCue(
  metrics: PoseMetrics,
  drillContext?: string
): Promise<{ cue: string; focus_metric: string; is_green: boolean }> {
  const prompt = `You are a badminton coach giving real-time feedback.

Current player metrics:
- Elbow angle: ${metrics.elbow_angle.toFixed(1)}° (ideal: 90-120°)
- Knee angle: ${metrics.knee_angle.toFixed(1)}° (ideal: 120-150°)
- Stance width (normalized): ${metrics.stance_width_norm.toFixed(2)} (ideal: 0.3-0.5)
- Shoulder-hip rotation: ${metrics.shoulder_hip_rotation_proxy.toFixed(2)} (ideal: 0.1-0.3)

${drillContext ? `Current drill: ${drillContext}` : ''}

Give ONE short coaching cue (max 10 words). Focus on the metric that needs most improvement.
Determine if overall form is acceptable (is_green).`;

  try {
    const response = await genAI.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: tickResponseSchema,
        temperature: 0.3,
        maxOutputTokens: 100,
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      cue: result.cue || 'Keep your form steady',
      focus_metric: result.focus_metric || 'elbow_angle',
      is_green: result.is_green ?? false,
    };
  } catch (error) {
    console.error('Gemini Flash error:', error);
    // Fallback response
    return {
      cue: 'Stay focused on your stance',
      focus_metric: 'stance_width_norm',
      is_green: metrics.knee_angle >= 120 && metrics.knee_angle <= 150,
    };
  }
}

// Gemini Pro: Detailed video analysis
export async function analyzeVideo(
  metricsHistory: PoseMetrics[],
  videoContext?: string
): Promise<AnalysisResultJson> {
  // Calculate average metrics
  const avgMetrics = metricsHistory.reduce(
    (acc, m) => ({
      elbow_angle: acc.elbow_angle + m.elbow_angle / metricsHistory.length,
      knee_angle: acc.knee_angle + m.knee_angle / metricsHistory.length,
      stance_width_norm: acc.stance_width_norm + m.stance_width_norm / metricsHistory.length,
      shoulder_hip_rotation_proxy:
        acc.shoulder_hip_rotation_proxy + m.shoulder_hip_rotation_proxy / metricsHistory.length,
    }),
    { elbow_angle: 0, knee_angle: 0, stance_width_norm: 0, shoulder_hip_rotation_proxy: 0 }
  );

  const prompt = `You are an expert badminton coach analyzing a player's form from video metrics.

Aggregated metrics from the video analysis:
- Average elbow angle: ${avgMetrics.elbow_angle.toFixed(1)}° (ideal: 90-120° for clear shots)
- Average knee angle: ${avgMetrics.knee_angle.toFixed(1)}° (ideal: 120-150° for ready position)
- Average stance width: ${avgMetrics.stance_width_norm.toFixed(2)} (ideal: 0.3-0.5 shoulder widths)
- Average rotation proxy: ${avgMetrics.shoulder_hip_rotation_proxy.toFixed(2)} (ideal: 0.1-0.3)
- Total frames analyzed: ${metricsHistory.length}

${videoContext ? `Video context: ${videoContext}` : ''}

Provide a comprehensive analysis including:
1. Top 2-3 issues to address (with severity: high/medium/low)
2. 2-3 specific drills to improve these issues
3. A technique summary paragraph
4. A strategy summary paragraph
5. A 5-day training plan

Be specific, actionable, and encouraging.`;

  try {
    const response = await genAI.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisResultSchema,
        temperature: 0.4,
        maxOutputTokens: 2000,
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResultJson;
  } catch (error) {
    console.error('Gemini Pro error:', error);
    // Return fallback analysis
    return getFallbackAnalysis(avgMetrics);
  }
}

// Gemini Pro Image: Generate drill visuals (optional)
export async function generateDrillVisual(
  drillDescription: string
): Promise<string | null> {
  try {
    const response = await genAI.models.generateContent({
      model: IMAGE_MODEL,
      contents: `Generate a simple, clear illustration showing a badminton player performing: ${drillDescription}.
      Style: Clean line art, instructional diagram, showing proper form and movement arrows.`,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    // Check if image was generated
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Gemini Image error:', error);
    return null;
  }
}

// Racket recommendation with Gemini
export async function getRacketRecommendations(
  rackets: Racket[],
  level: string,
  weaknesses: string[],
  stylePref?: string
): Promise<RacketRecommendation[]> {
  const prompt = `You are a badminton equipment expert helping select rackets.

Player profile:
- Skill level: ${level}
- Areas to improve: ${weaknesses.join(', ')}
- Playing style preference: ${stylePref || 'not specified'}

Available rackets:
${rackets.map((r, i) => `${i + 1}. ${r.name} (id: "${r.id}") by ${r.brand}
   - Price: ${r.price_range} (${r.price_band})
   - For: ${r.skill_level.join(', ')} players
   - Style: ${r.play_style.join(', ')}
   - Weight: ${r.weight}, Balance: ${r.balance}, Flex: ${r.flexibility}
`).join('\n')}

Rank the top 5 rackets for this player. For each, provide the racket "id" exactly as shown, a match_score (0-100), and a brief match_reason (1-2 sentences).
Return as JSON array: [{"id": "racket-id-here", "match_score": 85, "match_reason": "explanation"}]`;

  try {
    const response = await genAI.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    const rankings = JSON.parse(response.text || '[]');

    // Merge rankings with racket data
    return rankings.slice(0, 5).map((rank: { id: string; match_score: number; match_reason: string }) => {
      const racket = rackets.find((r) => r.id === rank.id) || rackets[0];
      return {
        ...racket,
        match_score: rank.match_score || 75,
        match_reason: rank.match_reason || 'Good all-around choice for your level.',
      };
    });
  } catch (error) {
    console.error('Gemini ranking error:', error);
    // Fallback: deterministic ranking
    return getFallbackRacketRecommendations(rackets, level, stylePref);
  }
}

// Fallback analysis when Gemini fails
function getFallbackAnalysis(avgMetrics: PoseMetrics): AnalysisResultJson {
  const issues = [];
  const drills = [];

  if (avgMetrics.elbow_angle < 90 || avgMetrics.elbow_angle > 130) {
    issues.push({
      id: 'elbow-1',
      title: 'Elbow Position Needs Work',
      severity: 'high' as const,
      description: 'Your elbow angle during shots is outside the optimal range. This affects power transfer and shot accuracy.',
      affected_metrics: ['elbow_angle'],
    });
    drills.push({
      id: 'drill-shadow',
      name: 'Shadow Swing Practice',
      description: 'Practice your swing motion without a shuttle, focusing on elbow position.',
      duration_minutes: 10,
      target_metrics: ['elbow_angle'],
      instructions: [
        'Stand in ready position',
        'Slowly perform overhead clear motion',
        'Pause at the contact point - check elbow angle',
        'Repeat 20 times per set',
      ],
    });
  }

  if (avgMetrics.knee_angle < 110 || avgMetrics.knee_angle > 160) {
    issues.push({
      id: 'knee-1',
      title: 'Stance Too Stiff or Too Low',
      severity: 'medium' as const,
      description: 'Your knee bend is not optimal for quick movement and explosive shots.',
      affected_metrics: ['knee_angle'],
    });
    drills.push({
      id: 'drill-footwork',
      name: 'Ready Position Drill',
      description: 'Practice maintaining athletic ready position.',
      duration_minutes: 8,
      target_metrics: ['knee_angle', 'stance_width_norm'],
      instructions: [
        'Start in ready position with slight knee bend',
        'Partner calls direction, you shuffle',
        'Return to ready position',
        'Focus on consistent knee angle',
      ],
    });
  }

  if (issues.length === 0) {
    issues.push({
      id: 'general-1',
      title: 'General Form Refinement',
      severity: 'low' as const,
      description: 'Your form is generally good. Focus on consistency and timing.',
      affected_metrics: ['elbow_angle', 'knee_angle'],
    });
  }

  if (drills.length === 0) {
    drills.push({
      id: 'drill-rally',
      name: 'Controlled Rally',
      description: 'Practice consistent rallies focusing on form.',
      duration_minutes: 15,
      target_metrics: ['elbow_angle', 'knee_angle'],
      instructions: [
        'Rally with partner using only clears',
        'Focus on consistent contact point',
        'Maintain ready position between shots',
      ],
    });
  }

  return {
    top_issues: issues,
    drills: drills,
    technique_summary: 'Based on the video analysis, your overall technique shows room for improvement in body positioning and shot preparation. Focus on maintaining consistent angles throughout your movements.',
    strategy_summary: 'Work on building a solid foundation before advancing to more complex shots. Consistency should be your primary goal at this stage.',
    training_plan: [
      { day: 1, focus: 'Footwork Basics', drills: [drills[0]?.id || 'drill-footwork'], duration_minutes: 30 },
      { day: 2, focus: 'Swing Mechanics', drills: ['drill-shadow'], duration_minutes: 25 },
      { day: 3, focus: 'Combined Practice', drills: drills.map((d) => d.id), duration_minutes: 40 },
      { day: 4, focus: 'Rest & Review', drills: [], duration_minutes: 0 },
      { day: 5, focus: 'Match Play', drills: ['drill-rally'], duration_minutes: 45 },
    ],
  };
}

// Fallback racket recommendations
function getFallbackRacketRecommendations(
  rackets: Racket[],
  level: string,
  stylePref?: string
): RacketRecommendation[] {
  // Simple scoring based on matching criteria
  const scored = rackets.map((racket) => {
    let score = 50;

    // Level match
    if (racket.skill_level.includes(level)) score += 20;

    // Style match
    if (stylePref && racket.play_style.includes(stylePref)) score += 15;

    // Beginner-friendly adjustments
    if (level === 'beginner') {
      if (racket.flexibility === 'Flexible') score += 10;
      if (racket.price_band === 'budget') score += 5;
    }

    // Advanced adjustments
    if (level === 'advanced') {
      if (racket.flexibility === 'Stiff') score += 10;
      if (racket.price_band === 'premium') score += 5;
    }

    return {
      ...racket,
      match_score: Math.min(score, 100),
      match_reason: `Good match for ${level} players seeking ${stylePref || 'versatile'} play.`,
    };
  });

  return scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
}
