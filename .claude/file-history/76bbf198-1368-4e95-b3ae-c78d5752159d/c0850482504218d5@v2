/**
 * Ghost Rival Overlay Module
 *
 * Provides "My Best Rep" ghost skeleton overlay functionality:
 * 1. Finds the highest-quality segment from the same video
 * 2. Extracts pose frames for ghost rendering
 * 3. Syncs ghost playback with user video time
 */

import type {
  PoseLandmark,
  PoseMetrics,
  GhostRivalData,
  GhostPoseFrame,
  MistakeEvent
} from './types';
import { POSE_LANDMARKS, calculateAngle, calculateDistance } from './pose-utils';

// Minimum window size for a valid "rep"
const MIN_REP_DURATION_SEC = 0.8;
const MAX_REP_DURATION_SEC = 3.0;
const GHOST_FPS = 15; // Downsample to 15fps for rendering

/**
 * Shot event detected in video
 */
interface ShotEvent {
  frameIndex: number;
  timestamp: number;
  shotType: 'overhead' | 'drive' | 'netshot' | 'footwork' | 'unknown';
  confidence: number;
}

/**
 * Calculate form quality score for a segment of pose frames
 * Higher score = better form
 */
export function calculateSegmentFormScore(
  poseFrames: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[]
): number {
  let totalScore = 0;
  let validFrames = 0;

  for (let i = 0; i < poseFrames.length; i++) {
    const landmarks = poseFrames[i];
    const metrics = metricsHistory[i];

    if (!landmarks || !metrics) continue;

    // Calculate average visibility
    const avgVisibility = landmarks.reduce((sum, lm) => sum + (lm.visibility ?? 0), 0) / landmarks.length;
    if (avgVisibility < 0.5) continue;

    let frameScore = avgVisibility * 20; // Base score from visibility

    // Elbow angle scoring (ideal: 90-130 for most shots)
    const elbowScore = scoreInRange(metrics.elbow_angle, 80, 140, 60, 160);
    frameScore += elbowScore * 25;

    // Knee angle scoring (ideal: 110-160)
    const kneeScore = scoreInRange(metrics.knee_angle, 110, 160, 80, 175);
    frameScore += kneeScore * 25;

    // Stance width scoring (ideal: 0.6-1.4 normalized)
    const stanceScore = scoreInRange(metrics.stance_width_norm, 0.6, 1.4, 0.3, 2.0);
    frameScore += stanceScore * 15;

    // Rotation scoring (ideal: 0.1-0.4)
    const rotationScore = scoreInRange(metrics.shoulder_hip_rotation_proxy, 0.1, 0.4, 0, 0.6);
    frameScore += rotationScore * 15;

    totalScore += frameScore;
    validFrames++;
  }

  return validFrames > 0 ? totalScore / validFrames : 0;
}

/**
 * Score a value within ideal and acceptable ranges
 */
function scoreInRange(
  value: number,
  idealMin: number,
  idealMax: number,
  acceptMin: number,
  acceptMax: number
): number {
  if (value >= idealMin && value <= idealMax) {
    return 1.0; // Perfect
  }
  if (value < acceptMin || value > acceptMax) {
    return 0.2; // Poor
  }
  // In acceptable but not ideal range
  if (value < idealMin) {
    return 0.5 + 0.5 * ((value - acceptMin) / (idealMin - acceptMin));
  }
  return 0.5 + 0.5 * ((acceptMax - value) / (acceptMax - idealMax));
}

/**
 * Detect shot events in the video based on pose patterns
 */
export function detectShotEvents(
  poseData: (PoseLandmark[] | null)[],
  fps: number = 10
): ShotEvent[] {
  const events: ShotEvent[] = [];
  const minFramesBetweenShots = Math.floor(fps * 0.5); // At least 0.5s between shots

  for (let i = 5; i < poseData.length - 5; i++) {
    const landmarks = poseData[i];
    if (!landmarks) continue;

    // Check for overhead shot (wrist above shoulder)
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];

    if (!rightWrist || !rightShoulder || !rightElbow) continue;
    if ((rightWrist.visibility ?? 0) < 0.5) continue;

    // Detect overhead position
    if (rightWrist.y < rightShoulder.y - 0.05) {
      // Check if this is a new shot (not too close to previous)
      const lastEvent = events[events.length - 1];
      if (!lastEvent || i - lastEvent.frameIndex >= minFramesBetweenShots) {
        // Calculate elbow extension for overhead
        const elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

        events.push({
          frameIndex: i,
          timestamp: i / fps,
          shotType: elbowAngle > 140 ? 'overhead' : 'drive',
          confidence: (rightWrist.visibility ?? 0.5) * (rightShoulder.visibility ?? 0.5),
        });
      }
    }

    // Detect lunge/netshot (deep knee bend with forward reach)
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (rightHip && rightKnee && rightAnkle) {
      const kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      if (kneeAngle < 100) {
        const lastEvent = events[events.length - 1];
        if (!lastEvent || i - lastEvent.frameIndex >= minFramesBetweenShots) {
          events.push({
            frameIndex: i,
            timestamp: i / fps,
            shotType: 'netshot',
            confidence: Math.min(rightKnee.visibility ?? 0.5, rightAnkle.visibility ?? 0.5),
          });
        }
      }
    }
  }

  return events;
}

/**
 * Find the best rep window from the video
 * This is the highest-quality segment that can be used as ghost overlay
 */
export function findBestRepWindow(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  shotEvents: ShotEvent[],
  fps: number = 10
): GhostRivalData['bestRepWindow'] | null {
  if (shotEvents.length === 0) {
    // No shots detected, find best continuous segment
    return findBestContinuousSegment(poseData, metricsHistory, fps);
  }

  let bestWindow: GhostRivalData['bestRepWindow'] | null = null;
  let bestScore = 0;

  for (const shot of shotEvents) {
    // Define window around shot: 0.8s before to 0.6s after
    const windowStartFrame = Math.max(0, shot.frameIndex - Math.floor(fps * 0.8));
    const windowEndFrame = Math.min(poseData.length - 1, shot.frameIndex + Math.floor(fps * 0.6));

    // Extract segment
    const segmentPoses = poseData.slice(windowStartFrame, windowEndFrame + 1);
    const segmentMetrics = metricsHistory.slice(windowStartFrame, windowEndFrame + 1);

    // Calculate form quality score
    const score = calculateSegmentFormScore(segmentPoses, segmentMetrics);

    if (score > bestScore) {
      bestScore = score;
      bestWindow = {
        startTime: windowStartFrame / fps,
        endTime: windowEndFrame / fps,
        score,
        shotType: shot.shotType,
      };
    }
  }

  return bestWindow;
}

/**
 * Find best continuous segment when no shots are detected
 */
function findBestContinuousSegment(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  fps: number
): GhostRivalData['bestRepWindow'] | null {
  const windowSize = Math.floor(fps * 1.5); // 1.5 second windows
  const step = Math.floor(fps * 0.5); // 0.5 second steps

  let bestWindow: GhostRivalData['bestRepWindow'] | null = null;
  let bestScore = 0;

  for (let start = 0; start + windowSize < poseData.length; start += step) {
    const segmentPoses = poseData.slice(start, start + windowSize);
    const segmentMetrics = metricsHistory.slice(start, start + windowSize);

    const score = calculateSegmentFormScore(segmentPoses, segmentMetrics);

    if (score > bestScore) {
      bestScore = score;
      bestWindow = {
        startTime: start / fps,
        endTime: (start + windowSize) / fps,
        score,
        shotType: 'footwork',
      };
    }
  }

  return bestWindow;
}

/**
 * Extract ghost pose sequence from best rep window
 * Downsamples to GHOST_FPS for efficient rendering
 */
export function extractGhostPoseSequence(
  poseData: (PoseLandmark[] | null)[],
  bestRepWindow: GhostRivalData['bestRepWindow'],
  sourceFps: number = 10
): GhostPoseFrame[] {
  if (!bestRepWindow) return [];

  const startFrame = Math.floor(bestRepWindow.startTime * sourceFps);
  const endFrame = Math.floor(bestRepWindow.endTime * sourceFps);
  const windowDuration = bestRepWindow.endTime - bestRepWindow.startTime;

  const ghostFrames: GhostPoseFrame[] = [];

  // Calculate frame step for downsampling to GHOST_FPS
  const frameStep = Math.max(1, Math.floor(sourceFps / GHOST_FPS));

  for (let i = startFrame; i <= endFrame; i += frameStep) {
    const landmarks = poseData[i];
    if (!landmarks) continue;

    const timestamp = i / sourceFps;
    const normalizedTime = (timestamp - bestRepWindow.startTime) / windowDuration;

    ghostFrames.push({
      timestamp,
      normalizedTime: Math.max(0, Math.min(1, normalizedTime)),
      landmarks,
    });
  }

  return ghostFrames;
}

/**
 * Get ghost pose for current video time
 * Handles sync between user video time and ghost animation
 */
export function getGhostPoseAtTime(
  ghostData: GhostRivalData,
  currentTime: number
): PoseLandmark[] | null {
  if (!ghostData.enabled || ghostData.poseSequence.length === 0) {
    return null;
  }

  const { poseSequence, bestRepWindow } = ghostData;

  if (!bestRepWindow) {
    // Fallback: use absolute time
    let closestFrame = poseSequence[0];
    let minDiff = Infinity;

    for (const frame of poseSequence) {
      const diff = Math.abs(frame.timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    }

    return closestFrame?.landmarks ?? null;
  }

  // Use absolute time matching if within window
  if (currentTime >= bestRepWindow.startTime && currentTime <= bestRepWindow.endTime) {
    let closestFrame = poseSequence[0];
    let minDiff = Infinity;

    for (const frame of poseSequence) {
      const diff = Math.abs(frame.timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    }

    return closestFrame?.landmarks ?? null;
  }

  // Loop the ghost animation when outside window
  const windowDuration = bestRepWindow.endTime - bestRepWindow.startTime;
  const loopTime = ((currentTime - bestRepWindow.startTime) % windowDuration + windowDuration) % windowDuration;
  const targetTime = bestRepWindow.startTime + loopTime;

  let closestFrame = poseSequence[0];
  let minDiff = Infinity;

  for (const frame of poseSequence) {
    const diff = Math.abs(frame.timestamp - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestFrame = frame;
    }
  }

  return closestFrame?.landmarks ?? null;
}

/**
 * Initialize ghost rival data from analysis
 */
export function initializeGhostRival(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  fps: number = 10
): GhostRivalData {
  // Detect shot events
  const shotEvents = detectShotEvents(poseData, fps);

  // Find best rep window
  const bestRepWindow = findBestRepWindow(poseData, metricsHistory, shotEvents, fps);

  // Extract ghost pose sequence
  const poseSequence = bestRepWindow
    ? extractGhostPoseSequence(poseData, bestRepWindow, fps)
    : [];

  return {
    source: 'my-best-rep',
    enabled: false, // User must enable
    poseSequence,
    bestRepWindow: bestRepWindow ?? undefined,
  };
}

// ============================================
// TASK 2: Context-Aware Ghost - Mistake-Specific Best Reps
// ============================================

/**
 * Mapping of mistake types to the shot/form pattern that should be shown as correct
 */
const MISTAKE_TO_CORRECT_PATTERN: Record<string, {
  shotTypes: ('overhead' | 'drive' | 'netshot' | 'footwork')[];
  focusMetric: string;
  idealRange: { min: number; max: number };
}> = {
  OVERHEAD_CONTACT_LOW: {
    shotTypes: ['overhead'],
    focusMetric: 'wrist_height',
    idealRange: { min: 0.15, max: 0.35 }, // Wrist above shoulder height
  },
  ELBOW_TOO_BENT: {
    shotTypes: ['overhead', 'drive'],
    focusMetric: 'elbow_angle',
    idealRange: { min: 140, max: 175 }, // Extended elbow
  },
  INSUFFICIENT_ROTATION: {
    shotTypes: ['overhead', 'drive'],
    focusMetric: 'rotation',
    idealRange: { min: 15, max: 45 }, // Good shoulder-hip rotation
  },
  LATE_SPLIT_STEP: {
    shotTypes: ['footwork'],
    focusMetric: 'stance_width',
    idealRange: { min: 0.8, max: 1.5 }, // Wide stance during split
  },
  POOR_LUNGE_RECOVERY: {
    shotTypes: ['netshot', 'footwork'],
    focusMetric: 'knee_angle',
    idealRange: { min: 130, max: 170 }, // Quick recovery = straighter knee
  },
  STANCE_TOO_NARROW: {
    shotTypes: ['footwork'],
    focusMetric: 'stance_width',
    idealRange: { min: 0.8, max: 1.4 },
  },
  STANCE_TOO_WIDE: {
    shotTypes: ['footwork'],
    focusMetric: 'stance_width',
    idealRange: { min: 0.5, max: 1.2 },
  },
};

/**
 * Find the best segment that demonstrates CORRECT form for a specific mistake type
 * This is used when user selects a mistake to show the ideal form
 */
export function findBestRepForMistakeType(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  mistakeType: string,
  fps: number = 10
): GhostRivalData['bestRepWindow'] | null {
  const pattern = MISTAKE_TO_CORRECT_PATTERN[mistakeType];
  if (!pattern) {
    // Fallback to generic best rep
    const shotEvents = detectShotEvents(poseData, fps);
    return findBestRepWindow(poseData, metricsHistory, shotEvents, fps);
  }

  // Find segments that match the shot type AND have good form for the focus metric
  const shotEvents = detectShotEvents(poseData, fps);
  // Filter out 'unknown' shot types before checking against pattern
  const relevantShots = shotEvents.filter(shot =>
    shot.shotType !== 'unknown' && pattern.shotTypes.includes(shot.shotType as 'footwork' | 'drive' | 'overhead' | 'netshot')
  );

  if (relevantShots.length === 0) {
    // No shots of the right type, find best general segment with good focus metric
    return findBestSegmentForMetric(poseData, metricsHistory, pattern.focusMetric, pattern.idealRange, fps);
  }

  let bestWindow: GhostRivalData['bestRepWindow'] | null = null;
  let bestScore = -Infinity;

  for (const shot of relevantShots) {
    const windowStartFrame = Math.max(0, shot.frameIndex - Math.floor(fps * 0.8));
    const windowEndFrame = Math.min(poseData.length - 1, shot.frameIndex + Math.floor(fps * 0.6));

    // Score this window based on focus metric quality
    let metricScore = 0;
    let validFrames = 0;

    for (let i = windowStartFrame; i <= windowEndFrame; i++) {
      const landmarks = poseData[i];
      const metrics = metricsHistory[i];
      if (!landmarks || !metrics) continue;

      const metricValue = extractFocusMetric(landmarks, metrics, pattern.focusMetric);
      if (metricValue === null) continue;

      // Score how close to ideal range
      const { min, max } = pattern.idealRange;
      if (metricValue >= min && metricValue <= max) {
        metricScore += 1.0;
      } else if (metricValue < min) {
        metricScore += 0.5 * (metricValue / min);
      } else {
        metricScore += 0.5 * (max / metricValue);
      }
      validFrames++;
    }

    const avgScore = validFrames > 0 ? metricScore / validFrames : 0;

    // Also factor in general form quality
    const segmentPoses = poseData.slice(windowStartFrame, windowEndFrame + 1);
    const segmentMetrics = metricsHistory.slice(windowStartFrame, windowEndFrame + 1);
    const formScore = calculateSegmentFormScore(segmentPoses, segmentMetrics);

    const totalScore = avgScore * 0.6 + (formScore / 100) * 0.4;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestWindow = {
        startTime: windowStartFrame / fps,
        endTime: windowEndFrame / fps,
        score: totalScore * 100,
        shotType: shot.shotType,
      };
    }
  }

  return bestWindow;
}

/**
 * Find best segment based on a specific metric being in ideal range
 */
function findBestSegmentForMetric(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  focusMetric: string,
  idealRange: { min: number; max: number },
  fps: number
): GhostRivalData['bestRepWindow'] | null {
  const windowSize = Math.floor(fps * 1.5);
  const step = Math.floor(fps * 0.3);

  let bestWindow: GhostRivalData['bestRepWindow'] | null = null;
  let bestScore = -Infinity;

  for (let start = 0; start + windowSize < poseData.length; start += step) {
    let metricScore = 0;
    let validFrames = 0;

    for (let i = start; i < start + windowSize; i++) {
      const landmarks = poseData[i];
      const metrics = metricsHistory[i];
      if (!landmarks || !metrics) continue;

      const metricValue = extractFocusMetric(landmarks, metrics, focusMetric);
      if (metricValue === null) continue;

      const { min, max } = idealRange;
      if (metricValue >= min && metricValue <= max) {
        metricScore += 1.0;
      } else {
        metricScore += 0.3;
      }
      validFrames++;
    }

    const avgScore = validFrames > 0 ? metricScore / validFrames : 0;

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestWindow = {
        startTime: start / fps,
        endTime: (start + windowSize) / fps,
        score: avgScore * 100,
        shotType: 'footwork',
      };
    }
  }

  return bestWindow;
}

/**
 * Extract specific metric value from landmarks/metrics
 */
function extractFocusMetric(
  landmarks: PoseLandmark[],
  metrics: PoseMetrics,
  focusMetric: string
): number | null {
  switch (focusMetric) {
    case 'wrist_height': {
      const wrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];
      const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      if (!wrist || !shoulder) return null;
      return shoulder.y - wrist.y; // Positive = wrist above shoulder
    }
    case 'elbow_angle':
      return metrics.elbow_angle;
    case 'knee_angle':
      return metrics.knee_angle;
    case 'stance_width':
      return metrics.stance_width_norm;
    case 'rotation':
      return metrics.shoulder_hip_rotation_proxy * 100; // Convert to degrees approximation
    default:
      return null;
  }
}

/**
 * Create context-aware ghost data for a specific mistake
 * Returns new ghost data with pose sequence showing CORRECT form
 */
export function createContextAwareGhost(
  poseData: (PoseLandmark[] | null)[],
  metricsHistory: (PoseMetrics | null)[],
  mistakeType: string,
  fps: number = 10
): GhostRivalData {
  const bestRepWindow = findBestRepForMistakeType(poseData, metricsHistory, mistakeType, fps);

  if (!bestRepWindow) {
    return {
      source: 'my-best-rep',
      enabled: true,
      poseSequence: [],
      bestRepWindow: undefined,
    };
  }

  const poseSequence = extractGhostPoseSequence(poseData, bestRepWindow, fps);

  return {
    source: 'my-best-rep',
    enabled: true,
    poseSequence,
    bestRepWindow,
  };
}
