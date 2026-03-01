/**
 * Skill Scoring Module
 *
 * Computes skill score and confidence from REAL pose metrics.
 * This does NOT rely on Gemini for the numeric score.
 *
 * Confidence is derived from:
 * - MediaPipe landmark visibility (0-1 per landmark)
 * - Detection success rate across frames
 * - Dropout frequency (frames with missing landmarks)
 *
 * Skill Score is computed from:
 * - Consistency of key joint angles over shots
 * - Recovery speed after lunges
 * - Stance stability + split-step presence
 * - Overhead sequence quality
 */

import type {
  PoseLandmark,
  PoseMetrics,
  ComputedSkillScore,
  VisibilityMetrics,
  MistakeEvent
} from './types';
import { POSE_LANDMARKS, calculateAngle, calculateDistance } from './pose-utils';

// Key joints for confidence calculation (most important for badminton)
const KEY_JOINTS = [
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.RIGHT_SHOULDER,
  POSE_LANDMARKS.LEFT_ELBOW,
  POSE_LANDMARKS.RIGHT_ELBOW,
  POSE_LANDMARKS.LEFT_WRIST,
  POSE_LANDMARKS.RIGHT_WRIST,
  POSE_LANDMARKS.LEFT_HIP,
  POSE_LANDMARKS.RIGHT_HIP,
  POSE_LANDMARKS.LEFT_KNEE,
  POSE_LANDMARKS.RIGHT_KNEE,
  POSE_LANDMARKS.LEFT_ANKLE,
  POSE_LANDMARKS.RIGHT_ANKLE,
];

const VISIBILITY_THRESHOLD = 0.5;
const MIN_VALID_FRAME_RATIO = 0.7;

/**
 * Compute visibility metrics from pose data
 * This derives confidence from actual MediaPipe visibility values
 */
export function computeVisibilityMetrics(
  poseData: (PoseLandmark[] | null)[]
): VisibilityMetrics {
  let totalVisibility = 0;
  let validFrameCount = 0;
  let dropoutCount = 0;
  const jointVisibilitySum: Record<string, number> = {};
  const jointVisibilityCount: Record<string, number> = {};

  for (const landmarks of poseData) {
    if (!landmarks || landmarks.length === 0) {
      dropoutCount++;
      continue;
    }

    // Calculate average visibility for key joints in this frame
    let frameVisibilitySum = 0;
    let keyJointCount = 0;

    for (const jointIdx of KEY_JOINTS) {
      const landmark = landmarks[jointIdx];
      if (landmark) {
        const visibility = landmark.visibility ?? 0;
        frameVisibilitySum += visibility;
        keyJointCount++;

        // Track per-joint visibility
        const jointName = Object.entries(POSE_LANDMARKS).find(([_, v]) => v === jointIdx)?.[0] || String(jointIdx);
        jointVisibilitySum[jointName] = (jointVisibilitySum[jointName] || 0) + visibility;
        jointVisibilityCount[jointName] = (jointVisibilityCount[jointName] || 0) + 1;
      }
    }

    if (keyJointCount > 0) {
      const frameAvgVisibility = frameVisibilitySum / keyJointCount;
      totalVisibility += frameAvgVisibility;

      if (frameAvgVisibility >= VISIBILITY_THRESHOLD) {
        validFrameCount++;
      }
    } else {
      dropoutCount++;
    }
  }

  const totalFrames = poseData.length;
  const framesWithPose = totalFrames - dropoutCount;

  // Compute per-joint average visibility
  const keyJointVisibility: Record<string, number> = {};
  for (const [joint, sum] of Object.entries(jointVisibilitySum)) {
    const count = jointVisibilityCount[joint] || 1;
    keyJointVisibility[joint] = sum / count;
  }

  return {
    avgVisibility: framesWithPose > 0 ? totalVisibility / framesWithPose : 0,
    validFrameRatio: totalFrames > 0 ? validFrameCount / totalFrames : 0,
    dropoutRate: totalFrames > 0 ? dropoutCount / totalFrames : 1,
    keyJointVisibility,
  };
}

/**
 * Calculate consistency score from pose metrics over time
 * Higher consistency = more stable form across frames
 */
export function computeConsistencyScore(
  metricsHistory: (PoseMetrics | null)[]
): number {
  const validMetrics = metricsHistory.filter(m => m !== null) as PoseMetrics[];
  if (validMetrics.length < 5) return 0.5; // Not enough data

  // Calculate standard deviation for each metric
  const elbowAngles = validMetrics.map(m => m.elbow_angle);
  const kneeAngles = validMetrics.map(m => m.knee_angle);
  const stanceWidths = validMetrics.map(m => m.stance_width_norm);

  const elbowStd = standardDeviation(elbowAngles);
  const kneeStd = standardDeviation(kneeAngles);
  const stanceStd = standardDeviation(stanceWidths);

  // Normalize standard deviations (lower is better)
  // Ideal: elbow std < 15deg, knee std < 20deg, stance std < 0.15
  const elbowConsistency = Math.max(0, 1 - elbowStd / 30);
  const kneeConsistency = Math.max(0, 1 - kneeStd / 40);
  const stanceConsistency = Math.max(0, 1 - stanceStd / 0.3);

  return (elbowConsistency + kneeConsistency + stanceConsistency) / 3;
}

/**
 * Detect split-step presence from pose data
 * Returns a score 0-1 based on how well split-steps are executed
 */
export function detectSplitStepQuality(
  poseData: (PoseLandmark[] | null)[]
): number {
  const validFrames = poseData.filter(p => p !== null) as PoseLandmark[][];
  if (validFrames.length < 10) return 0.5;

  let splitStepCount = 0;
  let potentialSplitSteps = 0;

  for (let i = 2; i < validFrames.length - 2; i++) {
    const prev = validFrames[i - 1];
    const curr = validFrames[i];
    const next = validFrames[i + 1];

    // Calculate stance width changes
    const prevStance = calculateStanceWidth(prev);
    const currStance = calculateStanceWidth(curr);
    const nextStance = calculateStanceWidth(next);

    // Split-step: quick widening then movement
    // Check for rapid stance change
    if (prevStance > 0 && currStance > 0) {
      const widthChange = Math.abs(currStance - prevStance) / prevStance;
      if (widthChange > 0.15) {
        potentialSplitSteps++;
        // Good split-step has controlled landing
        if (nextStance > 0) {
          const recovery = Math.abs(nextStance - currStance) / currStance;
          if (recovery < 0.2) {
            splitStepCount++;
          }
        }
      }
    }
  }

  if (potentialSplitSteps === 0) return 0.3; // No movement detected
  return Math.min(1, splitStepCount / Math.max(1, potentialSplitSteps / 3));
}

/**
 * Compute recovery speed from lunge positions
 */
export function computeRecoverySpeed(
  poseData: (PoseLandmark[] | null)[]
): number {
  const validFrames = poseData.filter(p => p !== null) as PoseLandmark[][];
  if (validFrames.length < 5) return 0.5;

  const kneeAngles: number[] = [];
  for (const landmarks of validFrames) {
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const knee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const ankle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    if (hip && knee && ankle) {
      kneeAngles.push(calculateAngle(hip, knee, ankle));
    }
  }

  if (kneeAngles.length < 5) return 0.5;

  // Find lunge moments (knee angle < 120)
  const lungeIndices: number[] = [];
  for (let i = 0; i < kneeAngles.length; i++) {
    if (kneeAngles[i] < 120) {
      lungeIndices.push(i);
    }
  }

  if (lungeIndices.length === 0) return 0.7; // No deep lunges, decent baseline

  // Calculate recovery time from each lunge
  let totalRecoveryFrames = 0;
  let recoveryCount = 0;

  for (const lungeIdx of lungeIndices) {
    // Find when knee angle returns to > 140
    for (let j = lungeIdx + 1; j < Math.min(lungeIdx + 20, kneeAngles.length); j++) {
      if (kneeAngles[j] > 140) {
        totalRecoveryFrames += (j - lungeIdx);
        recoveryCount++;
        break;
      }
    }
  }

  if (recoveryCount === 0) return 0.4; // Slow recovery

  const avgRecoveryFrames = totalRecoveryFrames / recoveryCount;
  // Ideal recovery: < 5 frames at 10fps = 0.5 seconds
  return Math.max(0, Math.min(1, 1 - (avgRecoveryFrames - 3) / 15));
}

/**
 * Compute form quality score from angle analysis
 */
export function computeFormQuality(
  metricsHistory: (PoseMetrics | null)[],
  poseData: (PoseLandmark[] | null)[]
): number {
  const validMetrics = metricsHistory.filter(m => m !== null) as PoseMetrics[];
  if (validMetrics.length < 3) return 0.5;

  let totalScore = 0;
  let frameCount = 0;

  for (const metrics of validMetrics) {
    let frameScore = 0;
    let checks = 0;

    // Elbow angle check (90-130 ideal for most shots)
    if (metrics.elbow_angle >= 80 && metrics.elbow_angle <= 140) {
      frameScore += 1;
    } else if (metrics.elbow_angle >= 70 && metrics.elbow_angle <= 150) {
      frameScore += 0.7;
    } else {
      frameScore += 0.3;
    }
    checks++;

    // Knee angle check (110-160 ideal)
    if (metrics.knee_angle >= 110 && metrics.knee_angle <= 160) {
      frameScore += 1;
    } else if (metrics.knee_angle >= 90 && metrics.knee_angle <= 170) {
      frameScore += 0.7;
    } else {
      frameScore += 0.3;
    }
    checks++;

    // Stance width check (0.6-1.5 normalized)
    if (metrics.stance_width_norm >= 0.6 && metrics.stance_width_norm <= 1.5) {
      frameScore += 1;
    } else if (metrics.stance_width_norm >= 0.4 && metrics.stance_width_norm <= 1.8) {
      frameScore += 0.7;
    } else {
      frameScore += 0.3;
    }
    checks++;

    totalScore += frameScore / checks;
    frameCount++;
  }

  return totalScore / frameCount;
}

/**
 * Main function: Compute complete skill score from pose data
 */
export function computeSkillScore(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  issues: MistakeEvent[] = []
): ComputedSkillScore {
  // 1. Calculate visibility metrics for confidence
  const visibility = computeVisibilityMetrics(poseData);

  // 2. Calculate component scores
  const consistencyScore = computeConsistencyScore(metricsHistory);
  const recoverySpeed = computeRecoverySpeed(poseData);
  const formQuality = computeFormQuality(metricsHistory, poseData);
  const splitStepQuality = detectSplitStepQuality(poseData);

  // 3. Compute weighted skill score (0-100)
  const rawScore = (
    consistencyScore * 30 +  // Consistency is important
    formQuality * 35 +       // Form quality matters most
    recoverySpeed * 20 +     // Recovery speed
    splitStepQuality * 15    // Split-step presence
  );

  // 4. Apply issue penalty
  const highSeverityIssues = issues.filter(i => i.severity > 0.7).length;
  const mediumSeverityIssues = issues.filter(i => i.severity > 0.4 && i.severity <= 0.7).length;
  const issuePenalty = highSeverityIssues * 5 + mediumSeverityIssues * 2;

  const skillScore = Math.max(0, Math.min(100, rawScore - issuePenalty));

  // 5. Determine level label
  let levelLabel: 'Beginner' | 'Intermediate' | 'Advanced';
  if (skillScore >= 70) {
    levelLabel = 'Advanced';
  } else if (skillScore >= 40) {
    levelLabel = 'Intermediate';
  } else {
    levelLabel = 'Beginner';
  }

  // 6. Calculate confidence from visibility
  const confidencePercent = Math.round(
    (visibility.avgVisibility * 0.4 +
     visibility.validFrameRatio * 0.4 +
     (1 - visibility.dropoutRate) * 0.2) * 100
  );

  // 7. Generate confidence reasons if low
  const confidenceReasons: string[] = [];
  if (visibility.avgVisibility < 0.6) {
    confidenceReasons.push(`Low landmark visibility (${Math.round(visibility.avgVisibility * 100)}%)`);
  }
  if (visibility.validFrameRatio < MIN_VALID_FRAME_RATIO) {
    confidenceReasons.push(`Only ${Math.round(visibility.validFrameRatio * 100)}% frames had clear pose detection`);
  }
  if (visibility.dropoutRate > 0.3) {
    confidenceReasons.push(`${Math.round(visibility.dropoutRate * 100)}% of frames had missing landmarks`);
  }

  // Check specific joint visibility
  const poorVisibilityJoints: string[] = [];
  for (const [joint, vis] of Object.entries(visibility.keyJointVisibility)) {
    if (vis < 0.5) {
      poorVisibilityJoints.push(joint.replace(/_/g, ' ').toLowerCase());
    }
  }
  if (poorVisibilityJoints.length > 0) {
    confidenceReasons.push(`Poor visibility for: ${poorVisibilityJoints.slice(0, 3).join(', ')}`);
  }

  return {
    skillScore: Math.round(skillScore),
    levelLabel,
    confidencePercent,
    confidenceReasons,
    metrics: {
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      recoverySpeed: Math.round(recoverySpeed * 100) / 100,
      formQuality: Math.round(formQuality * 100) / 100,
      visibilityAvg: Math.round(visibility.avgVisibility * 100) / 100,
      dropoutRate: Math.round(visibility.dropoutRate * 100) / 100,
    },
  };
}

// ============================================
// Helper Functions
// ============================================

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

function calculateStanceWidth(landmarks: PoseLandmark[]): number {
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  if (!leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) return 0;
  if ((leftAnkle.visibility ?? 0) < 0.5 || (rightAnkle.visibility ?? 0) < 0.5) return 0;

  const shoulderWidth = calculateDistance(leftShoulder, rightShoulder);
  const ankleWidth = calculateDistance(leftAnkle, rightAnkle);

  return shoulderWidth > 0 ? ankleWidth / shoulderWidth : 0;
}
