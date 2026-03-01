/**
 * Shot Segmentation Module
 *
 * Detects decision points (shots/exchanges) in trajectory data.
 * Uses velocity direction changes, speed peaks, and net crossings
 * to identify when a new shot begins.
 */

import type { TrajectoryPoint } from '../types';
import type { ShotSegment, ShotType } from './types';
import {
  DEBUG_FLAG,
  MIN_TRAJECTORY_POINTS,
  SPEED_THRESHOLD,
  HIGH_SPEED_THRESHOLD,
  DIRECTION_CHANGE_THRESHOLD,
  NET_Y,
  EPSILON,
} from './constants';

/**
 * Debug logger that only logs when DEBUG_FLAG is true
 */
function logDebug(message: string, data?: unknown): void {
  if (DEBUG_FLAG) {
    console.log(`[ShotSegmentation] ${message}`, data ?? '');
  }
}

/**
 * Compute 2D velocity vector between two points
 */
function computeVelocity(
  p1: TrajectoryPoint,
  p2: TrajectoryPoint
): { vx: number; vy: number; magnitude: number } {
  const dt = Math.max(p2.timestamp - p1.timestamp, 1); // Avoid division by zero
  const vx = (p2.x - p1.x) / dt * 1000; // Normalize to per-second
  const vy = (p2.y - p1.y) / dt * 1000;
  const magnitude = Math.sqrt(vx * vx + vy * vy);
  return { vx, vy, magnitude };
}

/**
 * Compute angle between two velocity vectors (in radians)
 */
function computeDirectionChange(
  v1: { vx: number; vy: number; magnitude: number },
  v2: { vx: number; vy: number; magnitude: number }
): number {
  const denominator = v1.magnitude * v2.magnitude + EPSILON;
  const dotProduct = v1.vx * v2.vx + v1.vy * v2.vy;
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / denominator));
  return Math.acos(cosAngle);
}

/**
 * Estimate shot type based on trajectory characteristics
 */
function classifyShotType(slice: TrajectoryPoint[]): ShotType {
  if (slice.length < 2) return 'unknown';

  const start = slice[0];
  const end = slice[slice.length - 1];
  const deltaY = end.y - start.y;
  const deltaX = Math.abs(end.x - start.x);
  const distance = Math.sqrt(deltaY * deltaY + deltaX * deltaX);

  // Compute average speed
  let totalSpeed = 0;
  for (let i = 1; i < slice.length; i++) {
    const vel = computeVelocity(slice[i - 1], slice[i]);
    totalSpeed += vel.magnitude;
  }
  const avgSpeed = totalSpeed / (slice.length - 1);

  // Direction: positive deltaY means shuttle moving toward far baseline (opponent)
  const movingTowardOpponent = deltaY > 0;

  // Classification heuristics based on trajectory shape
  // Clear: Long shot going deep to opponent's back court
  if (Math.abs(deltaY) > 0.4 && end.y > 0.8 && movingTowardOpponent) {
    return 'clear';
  }

  // Smash: Fast shot with steep downward angle toward opponent
  if (avgSpeed > HIGH_SPEED_THRESHOLD && distance > 0.3 && movingTowardOpponent) {
    return 'smash';
  }

  // Drop: Shot landing just over the net (front court)
  if (end.y > 0.5 && end.y < 0.7 && movingTowardOpponent && avgSpeed < SPEED_THRESHOLD * 3) {
    return 'drop';
  }

  // Net shot: Played from near net, stays near net
  if (start.y > 0.4 && start.y < 0.6 && end.y > 0.4 && end.y < 0.6) {
    return 'net';
  }

  // Lift: Defensive shot from low position going high
  if (start.y < 0.4 && deltaY > 0.3 && movingTowardOpponent) {
    return 'lift';
  }

  // Drive: Flat shot with minimal vertical movement
  if (Math.abs(deltaY) < 0.3 && distance > 0.2) {
    return 'drive';
  }

  // Push: Soft shot to mid-court
  if (distance < 0.3 && end.y > 0.4 && end.y < 0.8) {
    return 'push';
  }

  return 'unknown';
}

/**
 * Create a ShotSegment from trajectory slice
 */
function createShotSegment(
  shotIndex: number,
  trajectorySlice: TrajectoryPoint[],
  type: ShotType,
  poseTimestamps?: number[]
): ShotSegment {
  const startTime = trajectorySlice[0]?.timestamp ?? 0;
  const endTime = trajectorySlice[trajectorySlice.length - 1]?.timestamp ?? startTime;

  // Find closest pose timestamp if available
  let poseTimestamp: number | undefined;
  if (poseTimestamps && poseTimestamps.length > 0) {
    const midTime = (startTime + endTime) / 2;
    poseTimestamp = poseTimestamps.reduce((closest, ts) =>
      Math.abs(ts - midTime) < Math.abs(closest - midTime) ? ts : closest
    );
  }

  // Determine which player hit the shot based on Y position at start
  const startY = trajectorySlice[0]?.y ?? 0.5;
  const player: 'near' | 'far' = startY < 0.5 ? 'near' : 'far';

  return {
    shotIndex,
    type,
    startTime,
    endTime,
    trajectorySlice,
    poseTimestamp,
    player,
  };
}

/**
 * Check if trajectory point crosses the net
 */
function crossesNet(prev: TrajectoryPoint, curr: TrajectoryPoint): boolean {
  return (prev.y < NET_Y && curr.y >= NET_Y) || (prev.y >= NET_Y && curr.y < NET_Y);
}

/**
 * Main function: Segment trajectory into individual shots
 *
 * Detection criteria:
 * 1. Significant direction change (> 45 degrees)
 * 2. Speed peak (local maximum)
 * 3. Net crossing (shuttle crosses y = 0.5)
 *
 * @param trajectory Array of trajectory points
 * @param poseTimestamps Optional array of pose timestamps for fusion
 * @returns Array of shot segments
 */
export function segmentShots(
  trajectory: TrajectoryPoint[],
  poseTimestamps?: number[]
): ShotSegment[] {
  logDebug('Starting shot segmentation', { pointCount: trajectory.length });

  // Handle edge cases
  if (!trajectory || trajectory.length < MIN_TRAJECTORY_POINTS) {
    logDebug('Insufficient trajectory points', { count: trajectory?.length ?? 0 });
    return [];
  }

  const shots: ShotSegment[] = [];
  const decisionPoints: number[] = [0]; // Start with first point

  // Scan trajectory for decision points
  for (let i = 1; i < trajectory.length - 1; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];
    const next = trajectory[i + 1];

    // Compute velocity vectors
    const vel1 = computeVelocity(prev, curr);
    const vel2 = computeVelocity(curr, next);

    // Check criteria for decision point
    const directionChange = computeDirectionChange(vel1, vel2);
    const isDirectionChange = directionChange > DIRECTION_CHANGE_THRESHOLD;

    // Speed peak: current segment faster than next by significant margin
    const isSpeedPeak = vel1.magnitude > vel2.magnitude * 1.3 &&
                        vel1.magnitude > SPEED_THRESHOLD;

    // Net crossing
    const isNetCrossing = crossesNet(prev, curr);

    // Mark as decision point if any criterion is met
    if (isDirectionChange || isSpeedPeak || isNetCrossing) {
      decisionPoints.push(i);
      logDebug(`Decision point found at index ${i}`, {
        directionChange: isDirectionChange,
        speedPeak: isSpeedPeak,
        netCrossing: isNetCrossing,
        angle: (directionChange * 180 / Math.PI).toFixed(1) + '°',
        speed: vel1.magnitude.toFixed(4),
      });
    }
  }

  // Add final point if not already included
  if (decisionPoints[decisionPoints.length - 1] !== trajectory.length - 1) {
    decisionPoints.push(trajectory.length - 1);
  }

  // Create shot segments from decision points
  for (let i = 0; i < decisionPoints.length - 1; i++) {
    const startIdx = decisionPoints[i];
    const endIdx = decisionPoints[i + 1];

    // Skip very short segments (noise)
    if (endIdx - startIdx < 2) continue;

    const trajectorySlice = trajectory.slice(startIdx, endIdx + 1);
    const shotType = classifyShotType(trajectorySlice);

    const shot = createShotSegment(
      shots.length,
      trajectorySlice,
      shotType,
      poseTimestamps
    );

    shots.push(shot);
  }

  logDebug('Shot segmentation complete', { shotCount: shots.length });
  return shots;
}

/**
 * Re-classify shot type using additional context
 * Can be called after initial segmentation with more information
 */
export function reclassifyShot(
  shot: ShotSegment,
  previousShot?: ShotSegment,
  opponentPosition?: { x: number; y: number }
): ShotType {
  // If we have opponent position, use it for better classification
  if (opponentPosition) {
    const endPoint = shot.trajectorySlice[shot.trajectorySlice.length - 1];
    const distanceToOpponent = Math.sqrt(
      Math.pow(endPoint.x - opponentPosition.x, 2) +
      Math.pow(endPoint.y - opponentPosition.y, 2)
    );

    // If shot lands far from opponent and near net, likely a good drop
    if (distanceToOpponent > 0.5 && endPoint.y > 0.5 && endPoint.y < 0.7) {
      return 'drop';
    }

    // If shot lands far from opponent and deep, likely a clear
    if (distanceToOpponent > 0.5 && endPoint.y > 0.8) {
      return 'clear';
    }
  }

  // If previous shot was a smash and this is from low position, likely a lift
  if (previousShot?.type === 'smash' && shot.trajectorySlice[0]?.y < 0.3) {
    return 'lift';
  }

  // Fall back to original classification
  return shot.type;
}

/**
 * Merge very short consecutive segments that might be noise
 */
export function mergeShortSegments(
  shots: ShotSegment[],
  minDurationMs: number = 200
): ShotSegment[] {
  if (shots.length < 2) return shots;

  const merged: ShotSegment[] = [];
  let current = shots[0];

  for (let i = 1; i < shots.length; i++) {
    const next = shots[i];
    const currentDuration = current.endTime - current.startTime;

    if (currentDuration < minDurationMs) {
      // Merge with next segment
      current = {
        ...current,
        endTime: next.endTime,
        trajectorySlice: [...current.trajectorySlice, ...next.trajectorySlice],
        type: classifyShotType([...current.trajectorySlice, ...next.trajectorySlice]),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  // Don't forget the last segment
  merged.push(current);

  // Re-index shots
  return merged.map((shot, index) => ({ ...shot, shotIndex: index }));
}

/**
 * Utility: Estimate shuttle speed from trajectory
 * Returns normalized speed value (0-1)
 */
export function estimateShuttleSpeed(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 2) return 0;

  let totalSpeed = 0;
  for (let i = 1; i < trajectory.length; i++) {
    const vel = computeVelocity(trajectory[i - 1], trajectory[i]);
    totalSpeed += vel.magnitude;
  }

  const avgSpeed = totalSpeed / (trajectory.length - 1);

  // Normalize to 0-1 range (assuming max speed is around 0.2 in normalized coords)
  return Math.min(1, avgSpeed / 0.2);
}

/**
 * Utility: Estimate shuttle height proxy from trajectory shape
 * Higher value = higher arc
 */
export function estimateShuttleHeight(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 3) return 0.5;

  // Find the point furthest from the straight line connecting start and end
  const start = trajectory[0];
  const end = trajectory[trajectory.length - 1];

  let maxDeviation = 0;
  for (const point of trajectory) {
    // Distance from point to line
    const deviation = pointToLineDistance(point, start, end);
    maxDeviation = Math.max(maxDeviation, deviation);
  }

  // Normalize to 0-1 (assuming max deviation of 0.5 in normalized coords)
  return Math.min(1, maxDeviation * 2);
}

/**
 * Calculate perpendicular distance from point to line defined by two points
 */
function pointToLineDistance(
  point: TrajectoryPoint,
  lineStart: TrajectoryPoint,
  lineEnd: TrajectoryPoint
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;

  if (lineLengthSq === 0) return 0;

  // Calculate perpendicular distance using cross product
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq;
  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  return Math.sqrt(
    Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2)
  );
}
