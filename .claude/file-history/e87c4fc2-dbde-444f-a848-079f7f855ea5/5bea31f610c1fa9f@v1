import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const FLASH_MODEL = 'gemini-2.0-flash';

// Schema for auto-level response
const autoLevelSchema = {
  type: Type.OBJECT,
  properties: {
    level: {
      type: Type.STRING,
      description: 'Detected skill level: beginner, intermediate, or advanced',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score from 0 to 1',
    },
    rationaleBullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Array of 2-4 bullet points explaining the assessment',
    },
  },
  required: ['level', 'confidence', 'rationaleBullets'],
};

interface AutoLevelRequest {
  metrics: {
    avgElbowAngle: number;
    avgKneeAngle: number;
    avgStanceWidth: number;
    movementIntensity: number;
    frameCount: number;
    consistencyScore: number;
  };
  issues: Array<{
    code: string;
    severity: string;
    count: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: AutoLevelRequest = await request.json();
    const { metrics, issues } = body;

    if (!metrics) {
      return NextResponse.json(
        { error: 'metrics object is required' },
        { status: 400 }
      );
    }

    // Build the prompt for Gemini
    const prompt = `You are an expert badminton coach assessing a player's skill level from pose analysis data.

POSE METRICS FROM VIDEO:
- Average elbow angle: ${metrics.avgElbowAngle.toFixed(1)}° (ideal for clears: 90-120°)
- Average knee angle: ${metrics.avgKneeAngle.toFixed(1)}° (ideal ready position: 120-150°)
- Average stance width (normalized): ${metrics.avgStanceWidth.toFixed(3)} (ideal: 0.3-0.5)
- Movement intensity: ${metrics.movementIntensity.toFixed(2)} (higher = more dynamic movement)
- Frames analyzed: ${metrics.frameCount}
- Consistency score: ${(metrics.consistencyScore * 100).toFixed(0)}% (how stable form is across frames)

DETECTED ISSUES:
${issues.length > 0
  ? issues.map(i => `- ${i.code} (${i.severity}): occurred ${i.count}x`).join('\n')
  : '- No significant issues detected'}

SKILL LEVEL CRITERIA:
- BEGINNER: Inconsistent form, multiple high-severity issues, limited movement, elbow/knee angles far from ideal
- INTERMEDIATE: Some consistency, mostly medium-severity issues, decent movement patterns, angles approaching ideal ranges
- ADVANCED: High consistency (>80%), few low-severity issues, dynamic movement, angles within ideal ranges

Based on this data, determine the player's skill level.`;

    try {
      const response = await genAI.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: autoLevelSchema,
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      });

      const result = JSON.parse(response.text || '{}');

      // Validate and normalize the response
      const level = ['beginner', 'intermediate', 'advanced'].includes(result.level?.toLowerCase())
        ? result.level.toLowerCase()
        : determineRuleBasedLevel(metrics, issues);

      const confidence = typeof result.confidence === 'number'
        ? Math.max(0, Math.min(1, result.confidence))
        : 0.7;

      const rationaleBullets = Array.isArray(result.rationaleBullets) && result.rationaleBullets.length > 0
        ? result.rationaleBullets.slice(0, 4)
        : getRuleBasedRationale(metrics, issues, level);

      return NextResponse.json({
        level,
        confidence,
        rationaleBullets,
      });
    } catch (geminiError) {
      console.error('Gemini auto-level error:', geminiError);

      // Fallback to rule-based detection
      const level = determineRuleBasedLevel(metrics, issues);
      const rationale = getRuleBasedRationale(metrics, issues, level);

      return NextResponse.json({
        level,
        confidence: 0.6,
        rationaleBullets: rationale,
      });
    }
  } catch (error) {
    console.error('Auto-level API error:', error);
    return NextResponse.json(
      { error: 'Failed to determine skill level' },
      { status: 500 }
    );
  }
}

// Rule-based fallback for skill level detection
function determineRuleBasedLevel(
  metrics: AutoLevelRequest['metrics'],
  issues: AutoLevelRequest['issues']
): string {
  let score = 0;

  // Consistency score (0-30 points)
  score += metrics.consistencyScore * 30;

  // Elbow angle (0-20 points) - ideal is 90-120
  const elbowDiff = Math.min(
    Math.abs(metrics.avgElbowAngle - 90),
    Math.abs(metrics.avgElbowAngle - 120)
  );
  score += Math.max(0, 20 - elbowDiff);

  // Knee angle (0-20 points) - ideal is 120-150
  const kneeDiff = Math.min(
    Math.abs(metrics.avgKneeAngle - 120),
    Math.abs(metrics.avgKneeAngle - 150)
  );
  score += Math.max(0, 20 - kneeDiff);

  // Movement intensity (0-15 points)
  score += Math.min(15, metrics.movementIntensity * 30);

  // Issue penalty (subtract points based on severity)
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  score -= highIssues * 10;
  score -= mediumIssues * 5;

  // Normalize to 0-100
  score = Math.max(0, Math.min(100, score));

  if (score >= 70) return 'advanced';
  if (score >= 40) return 'intermediate';
  return 'beginner';
}

// Generate rationale bullets based on rules
function getRuleBasedRationale(
  metrics: AutoLevelRequest['metrics'],
  issues: AutoLevelRequest['issues'],
  level: string
): string[] {
  const bullets: string[] = [];

  // Consistency assessment
  if (metrics.consistencyScore >= 0.8) {
    bullets.push(`High form consistency (${(metrics.consistencyScore * 100).toFixed(0)}%) indicates practiced technique`);
  } else if (metrics.consistencyScore >= 0.5) {
    bullets.push(`Moderate form consistency (${(metrics.consistencyScore * 100).toFixed(0)}%) shows developing technique`);
  } else {
    bullets.push(`Low form consistency (${(metrics.consistencyScore * 100).toFixed(0)}%) suggests need for fundamental work`);
  }

  // Elbow angle assessment
  if (metrics.avgElbowAngle >= 90 && metrics.avgElbowAngle <= 120) {
    bullets.push(`Good elbow positioning (${metrics.avgElbowAngle.toFixed(0)}°) for power shots`);
  } else if (metrics.avgElbowAngle < 90) {
    bullets.push(`Elbow angle too tight (${metrics.avgElbowAngle.toFixed(0)}°) - limits power generation`);
  } else {
    bullets.push(`Elbow angle too open (${metrics.avgElbowAngle.toFixed(0)}°) - affects control`);
  }

  // Issue summary
  const highCount = issues.filter(i => i.severity === 'high').length;
  const totalIssues = issues.length;

  if (totalIssues === 0) {
    bullets.push('No significant form issues detected');
  } else if (highCount > 0) {
    bullets.push(`${highCount} high-priority issue${highCount > 1 ? 's' : ''} requiring attention`);
  } else {
    bullets.push(`${totalIssues} minor issue${totalIssues > 1 ? 's' : ''} to refine`);
  }

  // Movement assessment
  if (metrics.movementIntensity > 0.5) {
    bullets.push('Dynamic movement patterns show athletic foundation');
  } else if (metrics.movementIntensity > 0.2) {
    bullets.push('Moderate movement - work on explosive transitions');
  }

  return bullets.slice(0, 4);
}
