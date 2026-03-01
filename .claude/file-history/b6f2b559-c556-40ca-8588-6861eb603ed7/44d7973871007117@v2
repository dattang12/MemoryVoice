/**
 * Feature Extraction Module
 *
 * Extracts per-shot features used for recommendation scoring,
 * including contact zone, landing zone, speed/height proxies,
 * and recovery quality.
 */

import type { ShotSegment, ShotFeatures, RallyState } from './types';
import { positionToZone, computeRallyState } from './rally-state-machine';
import { estimateShuttleSpeed, estimateShuttleHeight } from './shot-segmentation';
import { DEBUG_FLAG, ZONE_DISTANCES } from './constants';

/**
 * Debug logger
 */
function logDebug(message: string, data?: unknown): void {
  if (DEBUG_FLAG) {
    console.log(`[FeatureExtraction] ${message}`, data ?? '');
  }
}

/**
 * Base position (center of our half-court) for recovery calculation
 */
const BASE_POSITION = { x: 0.5, y: 0.25 };

/**
 * Calculate Euclidean distance between two points
 */
function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Calculate direction angle of a vector (radians from positive x-axis)
 */
function vectorAngle(dx: number, dy: number): number {
  return Math.atan2(dy, dx);
}

/**
 * Calculate angular difference between two angles (in radians)
 */
function angleDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) {
    diff = 2 * Math.PI - diff;
  }
  return diff;
}

/**
 * Extract contact zone from shot trajectory
 * Contact point is where the player hits the shuttle (start of trajectory)
 */
export function extractContactZone(shot: ShotSegment): number {
  const startPoint = shot.trajectorySlice[0];
  if (!startPoint) return 4; // Default to center-mid

  return positionToZone(startPoint.x, startPoint.y);
}

/**
 * Extract landing zone from shot trajectory
 * Landing point is where the shuttle lands (end of trajectory)
 */
export function extractLandingZone(shot: ShotSegment): number {
  const endPoint = shot.trajectorySlice[shot.trajectorySlice.length - 1];
  if (!endPoint) return 4; // Default to center-mid

  return positionToZone(endPoint.x, endPoint.y);
}

/**
 * Estimate opponent movement distance during a shot
 * If we have opponent positions, calculate actual movement
 * Otherwise, estimate based on zone change
 */
export function estimateOpponentMovement(
  shot: ShotSegment,
  previousShot?: ShotSegment,
  opponentPositions?: Array<{ x: number; y: number; timestamp: number }>
): number {
  // If we have actual opponent position data
  if (opponentPositions && opponentPositions.length >= 2) {
    // Find positions during this shot
    const startTime = shot.startTime;
    const endTime = shot.endTime;

    const relevantPositions = opponentPositions.filter(
      p => p.timestamp >= startTime && p.timestamp <= endTime
    );

    if (relevantPositions.length >= 2) {
      let totalMovement = 0;
      for (let i = 1; i < relevantPositions.length; i++) {
        totalMovement += distance(relevantPositions[i - 1], relevantPositions[i]);
      }
      // Normalize to 0-1 (max expected movement is ~1.0 diagonal)
      return Math.min(1, totalMovement);
    }
  }

  // Estimate based on landing zones
  if (previousShot) {
    const prevLanding = extractLandingZone(previousShot);
    const currLanding = extractLandingZone(shot);

    // Use zone distance matrix
    return ZONE_DISTANCES[prevLanding]?.[currLanding] ?? 0.5;
  }

  // Default moderate movement
  return 0.5;
}

/**
 * Estimate opponent direction change during a shot
 * Returns radians (0 = same direction, PI = complete reversal)
 */
export function estimateOpponentDirectionChange(
  shot: ShotSegment,
  previousShot?: ShotSegment,
  opponentPositions?: Array<{ x: number; y: number; timestamp: number }>
): number {
  // If we have actual opponent position data
  if (opponentPositions && opponentPositions.length >= 3) {
    const startTime = shot.startTime;
    const midTime = (shot.startTime + shot.endTime) / 2;
    const endTime = shot.endTime;

    // Find positions at start, middle, and end
    const sortedPositions = [...opponentPositions].sort(
      (a, b) => Math.abs(a.timestamp - midTime) - Math.abs(b.timestamp - midTime)
    );

    if (sortedPositions.length >= 3) {
      const p1 = sortedPositions[0];
      const p2 = sortedPositions[1];
      const p3 = sortedPositions[2];

      const angle1 = vectorAngle(p2.x - p1.x, p2.y - p1.y);
      const angle2 = vectorAngle(p3.x - p2.x, p3.y - p2.y);

      return angleDifference(angle1, angle2);
    }
  }

  // Estimate based on shot trajectory changes
  if (previousShot && shot.trajectorySlice.length > 0) {
    const prevEnd = previousShot.trajectorySlice[previousShot.trajectorySlice.length - 1];
    const currEnd = shot.trajectorySlice[shot.trajectorySlice.length - 1];

    if (prevEnd && currEnd) {
      // If shot direction changed significantly, opponent likely changed direction
      const prevDir = vectorAngle(
        prevEnd.x - (previousShot.trajectorySlice[0]?.x ?? 0.5),
        prevEnd.y - (previousShot.trajectorySlice[0]?.y ?? 0.5)
      );
      const currDir = vectorAngle(
        currEnd.x - (shot.trajectorySlice[0]?.x ?? 0.5),
        currEnd.y - (shot.trajectorySlice[0]?.y ?? 0.5)
      );

      return angleDifference(prevDir, currDir);
    }
  }

  // Default moderate direction change
  return Math.PI / 4; // 45 degrees
}

/**
 * Calculate recovery quality (how close player is to base after shot)
 * Lower value = better recovery (0 = perfect, 1 = maximum distance from base)
 */
export function calculateRecoveryQuality(
  shot: ShotSegment,
  playerPosition?: { x: number; y: number }
): number {
  // If we have actual player position after the shot
  if (playerPosition) {
    const distFromBase = distance(playerPosition, BASE_POSITION);
    // Normalize: max expected distance from base is ~0.7 (diagonal)
    return Math.min(1, distFromBase / 0.7);
  }

  // Estimate based on shot characteristics
  const startPoint = shot.trajectorySlice[0];
  if (!startPoint) return 0.5;

  // If player hit from a position far from base, recovery is harder
  const distFromBase = distance(startPoint, BASE_POSITION);

  // Factor in shot type - some shots require more movement
  const shotTypeRecoveryPenalty: Record<string, number> = {
    smash: 0.1,     // Already in good position for smash
    drop: 0.2,      // Net approach needed
    net: 0.3,       // Front court position
    drive: 0.1,     // Mid-court shot
    clear: 0.15,    // Rear court position
    lift: 0.25,     // Likely stretched to retrieve
    push: 0.15,     // Mid-court
    serve: 0,       // Starting position
    unknown: 0.2,
  };

  const penalty = shotTypeRecoveryPenalty[shot.type] ?? 0.2;
  const baseRecovery = Math.min(1, distFromBase / 0.7);

  return Math.min(1, baseRecovery + penalty);
}

/**
 * Extract all features for a single shot
 */
export function extractShotFeatures(
  shot: ShotSegment,
  rallyState: RallyState,
  previousShot?: ShotSegment,
  opponentPositions?: Array<{ x: number; y: number; timestamp: number }>,
  playerPosition?: { x: number; y: number }
): ShotFeatures {
  const contactZone = extractContactZone(shot);
  const landingZone = extractLandingZone(shot);
  const shuttleSpeedProxy = estimateShuttleSpeed(shot.trajectorySlice);
  const shuttleHeightProxy = estimateShuttleHeight(shot.trajectorySlice);
  const opponentMovementDistance = estimateOpponentMovement(
    shot,
    previousShot,
    opponentPositions
  );
  const opponentDirectionChange = estimateOpponentDirectionChange(
    shot,
    previousShot,
    opponentPositions
  );
  const recoveryQuality = calculateRecoveryQuality(shot, playerPosition);

  const features: ShotFeatures = {
    contactZone,
    landingZone,
    shuttleSpeedProxy,
    shuttleHeightProxy,
    opponentMovementDistance,
    opponentDirectionChange,
    recoveryQuality,
    rallyState,
  };

  logDebug(`Extracted features for shot ${shot.shotIndex}`, {
    contactZone,
    landingZone,
    speed: shuttleSpeedProxy.toFixed(2),
    height: shuttleHeightProxy.toFixed(2),
    oppMovement: opponentMovementDistance.toFixed(2),
    recovery: recoveryQuality.toFixed(2),
  });

  return features;
}

/**
 * Extract features for all shots in a rally
 */
export function extractAllShotFeatures(
  shots: ShotSegment[],
  rallyStates: RallyState[],
  opponentPositions?: Array<{ x: number; y: number; timestamp: number }>,
  playerPositions?: Array<{ x: number; y: number; timestamp: number }>
): ShotFeatures[] {
  return shots.map((shot, index) => {
    const previousShot = index > 0 ? shots[index - 1] : undefined;
    const rallyState = rallyStates[index] ?? computeRallyState(shots, index);

    // Find player position closest to end of shot
    let playerPos: { x: number; y: number } | undefined;
    if (playerPositions && playerPositions.length > 0) {
      const closest = playerPositions.reduce((prev, curr) =>
        Math.abs(curr.timestamp - shot.endTime) < Math.abs(prev.timestamp - shot.endTime)
          ? curr
          : prev
      );
      playerPos = { x: closest.x, y: closest.y };
    }

    return extractShotFeatures(
      shot,
      rallyState,
      previousShot,
      opponentPositions,
      playerPos
    );
  });
}

/**
 * Calculate movement pressure score based on features
 * Higher value = more movement pressure on opponent
 */
export function calculateMovementPressure(
  targetZone: number,
  features: ShotFeatures
): number {
  // Base movement from landing zone change
  const zoneDistance = ZONE_DISTANCES[features.landingZone]?.[targetZone] ?? 0.5;

  // Factor in direction change
  const directionFactor = features.opponentDirectionChange / Math.PI; // 0-1

  // Combined pressure score
  const pressure = (zoneDistance * 0.7) + (directionFactor * 0.3);

  return Math.min(1, Math.max(0, pressure));
}

/**
 * Analyze shot placement patterns across multiple shots
 * Useful for identifying tendencies
 */
export function analyzePatterns(features: ShotFeatures[]): {
  preferredZones: number[];
  averageSpeed: number;
  averageRecovery: number;
} {
  if (features.length === 0) {
    return {
      preferredZones: [4],
      averageSpeed: 0.5,
      averageRecovery: 0.5,
    };
  }

  // Count zone frequency
  const zoneCounts: Record<number, number> = {};
  for (const f of features) {
    zoneCounts[f.landingZone] = (zoneCounts[f.landingZone] ?? 0) + 1;
  }

  // Find top 3 preferred zones
  const sortedZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([zone]) => parseInt(zone));

  // Calculate averages
  const totalSpeed = features.reduce((sum, f) => sum + f.shuttleSpeedProxy, 0);
  const totalRecovery = features.reduce((sum, f) => sum + f.recoveryQuality, 0);

  return {
    preferredZones: sortedZones,
    averageSpeed: totalSpeed / features.length,
    averageRecovery: totalRecovery / features.length,
  };
}
