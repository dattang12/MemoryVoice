/**
 * Strategy Engine Constants
 *
 * Contains court zone definitions, scoring weights, detection thresholds,
 * and other configuration values for the strategy engine.
 */

import type { CourtZone, CourtDepthZone, CourtWidthZone, ScoringWeights, ShotType } from './types';

// ============================================
// Debug Flag
// ============================================

/**
 * Enable debug logging when NEXT_PUBLIC_STRATEGY_DEBUG=true
 */
export const DEBUG_FLAG = process.env.NEXT_PUBLIC_STRATEGY_DEBUG === 'true';

// ============================================
// Court Zone System (3x3 Grid)
// ============================================

/**
 * Zone boundaries in normalized coordinates (0-1)
 *
 * Y-axis: 0 = near baseline (our side), 1 = far baseline (opponent side)
 * X-axis: 0 = left, 1 = right
 *
 * For each half-court (0-0.5 and 0.5-1.0):
 * - front: 0-0.167 (near net)
 * - mid: 0.167-0.333
 * - back: 0.333-0.5 (near baseline)
 */
export const ZONE_DEPTH_BOUNDARIES = {
  near: {
    front: { min: 0.333, max: 0.5 },    // Near net on our side
    mid: { min: 0.167, max: 0.333 },    // Mid court on our side
    back: { min: 0, max: 0.167 },       // Near our baseline
  },
  far: {
    front: { min: 0.5, max: 0.667 },    // Near net on opponent side
    mid: { min: 0.667, max: 0.833 },    // Mid court on opponent side
    back: { min: 0.833, max: 1.0 },     // Near opponent baseline
  },
};

export const ZONE_WIDTH_BOUNDARIES = {
  left: { min: 0, max: 0.333 },
  center: { min: 0.333, max: 0.667 },
  right: { min: 0.667, max: 1.0 },
};

/**
 * 9-zone grid definition
 *
 * Layout (looking at court from near side):
 * ```
 * Far side (opponent):
 *   6 | 7 | 8  (back-left, back-center, back-right)
 *   3 | 4 | 5  (mid-left, mid-center, mid-right)
 *   0 | 1 | 2  (front-left, front-center, front-right)
 * ---- NET ----
 * ```
 */
export const ZONE_GRID: CourtZone[] = [
  { id: 0, depth: 'front', width: 'left' },
  { id: 1, depth: 'front', width: 'center' },
  { id: 2, depth: 'front', width: 'right' },
  { id: 3, depth: 'mid', width: 'left' },
  { id: 4, depth: 'mid', width: 'center' },
  { id: 5, depth: 'mid', width: 'right' },
  { id: 6, depth: 'back', width: 'left' },
  { id: 7, depth: 'back', width: 'center' },
  { id: 8, depth: 'back', width: 'right' },
];

/**
 * Zone adjacency map: which zones are adjacent to each zone
 * Used for determining open court zones
 */
export const ZONE_ADJACENCY: Record<number, number[]> = {
  0: [1, 3, 4],           // front-left: front-center, mid-left, mid-center
  1: [0, 2, 3, 4, 5],     // front-center: all adjacent
  2: [1, 4, 5],           // front-right: front-center, mid-center, mid-right
  3: [0, 1, 4, 6, 7],     // mid-left: adjacent zones
  4: [0, 1, 2, 3, 5, 6, 7, 8], // mid-center: all surrounding
  5: [1, 2, 4, 7, 8],     // mid-right: adjacent zones
  6: [3, 4, 7],           // back-left: mid-left, mid-center, back-center
  7: [3, 4, 5, 6, 8],     // back-center: all adjacent
  8: [4, 5, 7],           // back-right: mid-center, mid-right, back-center
};

/**
 * Zone center positions in normalized coordinates
 * Used for path generation
 */
export const ZONE_CENTERS: Record<number, { x: number; y: number }> = {
  0: { x: 0.167, y: 0.583 },  // front-left
  1: { x: 0.5, y: 0.583 },    // front-center
  2: { x: 0.833, y: 0.583 },  // front-right
  3: { x: 0.167, y: 0.75 },   // mid-left
  4: { x: 0.5, y: 0.75 },     // mid-center
  5: { x: 0.833, y: 0.75 },   // mid-right
  6: { x: 0.167, y: 0.917 },  // back-left
  7: { x: 0.5, y: 0.917 },    // back-center
  8: { x: 0.833, y: 0.917 },  // back-right
};

// ============================================
// Shot Detection Thresholds
// ============================================

/**
 * Minimum number of trajectory points required for analysis
 */
export const MIN_TRAJECTORY_POINTS = 3;

/**
 * Speed threshold for detecting shot events (normalized velocity)
 */
export const SPEED_THRESHOLD = 0.02;

/**
 * High speed threshold for smash detection
 */
export const HIGH_SPEED_THRESHOLD = 0.08;

/**
 * Direction change threshold in radians (45 degrees)
 */
export const DIRECTION_CHANGE_THRESHOLD = Math.PI / 4;

/**
 * Net Y position in normalized coordinates
 */
export const NET_Y = 0.5;

/**
 * Small epsilon to avoid division by zero
 */
export const EPSILON = 1e-6;

// ============================================
// Scoring Weights
// ============================================

/**
 * Default weights for recommendation scoring
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  movementPressure: 20,    // +20 max for forcing opponent movement
  openCourt: 25,           // +25 max for exploiting open court
  riskUnderPressure: 15,   // -15 max penalty for risky shots when pressured
  angleExposure: 10,       // -10 max penalty for exposing court angles
};

/**
 * Base score for all recommendations
 */
export const BASE_SCORE = 50;

/**
 * Minimum and maximum allowed scores
 */
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

// ============================================
// Phase Detection Thresholds
// ============================================

/**
 * Pressure thresholds for phase determination
 */
export const PRESSURE_THRESHOLDS = {
  /** Pressure above this = defense */
  defense: 0.6,
  /** Pressure below this = attack */
  attack: 0.4,
};

/**
 * Shot types that indicate defensive play
 */
export const DEFENSIVE_SHOT_TYPES: ShotType[] = ['lift', 'clear'];

/**
 * Shot types that indicate attacking play
 */
export const ATTACKING_SHOT_TYPES: ShotType[] = ['smash', 'drop', 'net'];

/**
 * Shot types viable in each phase
 */
export const VIABLE_SHOTS_BY_PHASE: Record<string, ShotType[]> = {
  attack: ['smash', 'drop', 'net', 'drive', 'clear'],
  neutral: ['drop', 'net', 'drive', 'clear', 'lift'],
  defense: ['clear', 'lift', 'drive', 'net'],
};

// ============================================
// Risk Assessment
// ============================================

/**
 * Shot type risk levels (0-1, higher = riskier)
 */
export const SHOT_RISK_LEVELS: Record<ShotType, number> = {
  smash: 0.8,    // High risk - can be countered if not executed well
  drop: 0.5,     // Medium risk - deceptive but risky at net
  net: 0.6,      // Medium-high risk - tight margins
  drive: 0.3,    // Low-medium risk - fast but flat
  clear: 0.2,    // Low risk - buys time
  lift: 0.1,     // Very low risk - defensive reset
  serve: 0.2,    // Low risk
  push: 0.4,     // Medium risk
  unknown: 0.5,  // Default medium
};

/**
 * Shot type height proxy (0-1, higher = taller arc)
 */
export const SHOT_HEIGHT_PROXY: Record<ShotType, number> = {
  clear: 0.9,    // High arc
  lift: 0.85,    // High defensive arc
  drop: 0.4,     // Medium height, drops at net
  smash: 0.3,    // Low, steep angle
  drive: 0.2,    // Flat trajectory
  net: 0.1,      // Very low, just over net
  serve: 0.5,    // Medium
  push: 0.3,     // Low-medium
  unknown: 0.5,  // Default
};

// ============================================
// Movement Pressure Calculation
// ============================================

/**
 * Distance matrix between zones (normalized, 0-1)
 * Higher values = more movement required
 */
export const ZONE_DISTANCES: number[][] = [
  //  0     1     2     3     4     5     6     7     8
  [0.0,  0.33, 0.67, 0.33, 0.47, 0.75, 0.67, 0.75, 0.95], // Zone 0
  [0.33, 0.0,  0.33, 0.47, 0.33, 0.47, 0.75, 0.67, 0.75], // Zone 1
  [0.67, 0.33, 0.0,  0.75, 0.47, 0.33, 0.95, 0.75, 0.67], // Zone 2
  [0.33, 0.47, 0.75, 0.0,  0.33, 0.67, 0.33, 0.47, 0.75], // Zone 3
  [0.47, 0.33, 0.47, 0.33, 0.0,  0.33, 0.47, 0.33, 0.47], // Zone 4
  [0.75, 0.47, 0.33, 0.67, 0.33, 0.0,  0.75, 0.47, 0.33], // Zone 5
  [0.67, 0.75, 0.95, 0.33, 0.47, 0.75, 0.0,  0.33, 0.67], // Zone 6
  [0.75, 0.67, 0.75, 0.47, 0.33, 0.47, 0.33, 0.0,  0.33], // Zone 7
  [0.95, 0.75, 0.67, 0.75, 0.47, 0.33, 0.67, 0.33, 0.0],  // Zone 8
];

// ============================================
// Angle Risk Calculation
// ============================================

/**
 * Zones that expose strong counter-attack angles
 * Key: target zone, Value: risk level (0-1)
 */
export const ANGLE_RISK_BY_ZONE: Record<number, number> = {
  0: 0.3,   // front-left: some angle exposure
  1: 0.5,   // front-center: high exposure (center shots are risky)
  2: 0.3,   // front-right: some angle exposure
  3: 0.4,   // mid-left: moderate exposure
  4: 0.6,   // mid-center: highest exposure (opponent has all angles)
  5: 0.4,   // mid-right: moderate exposure
  6: 0.2,   // back-left: low exposure (pushes opponent back)
  7: 0.3,   // back-center: low-moderate exposure
  8: 0.2,   // back-right: low exposure
};

// ============================================
// Engine Defaults
// ============================================

/**
 * Default configuration for the strategy engine
 */
export const DEFAULT_ENGINE_CONFIG = {
  debug: DEBUG_FLAG,
  minTrajectoryPoints: MIN_TRAJECTORY_POINTS,
  speedThreshold: SPEED_THRESHOLD,
  directionChangeThreshold: DIRECTION_CHANGE_THRESHOLD,
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
};

/**
 * Engine version string
 */
export const ENGINE_VERSION = 'v1.0.0';

// ============================================
// UI Constants
// ============================================

/**
 * Colors for recommendation paths
 */
export const RECOMMENDATION_COLORS = {
  original: '#ef4444',    // Red - original trajectory
  rec1: '#22c55e',        // Green - primary recommendation
  rec2: '#3b82f6',        // Blue - secondary recommendation
  rec3: '#f97316',        // Orange - tertiary recommendation
};

/**
 * Line styles for recommendations
 */
export const RECOMMENDATION_LINE_STYLES = [
  { color: '#22c55e', dash: [], width: 3 },       // Solid green
  { color: '#3b82f6', dash: [10, 5], width: 2 },  // Dashed blue
  { color: '#f97316', dash: [5, 5], width: 2 },   // Dotted orange
];

/**
 * Phase colors for UI chips
 */
export const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  attack: { bg: 'bg-green-100', text: 'text-green-800' },
  neutral: { bg: 'bg-gray-100', text: 'text-gray-800' },
  defense: { bg: 'bg-red-100', text: 'text-red-800' },
};

/**
 * Next action labels based on phase
 */
export const PHASE_NEXT_ACTION: Record<string, string> = {
  attack: 'Finish',
  neutral: 'Build',
  defense: 'Reset',
};
