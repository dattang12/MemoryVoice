/**
 * Strategy Engine Type Definitions
 *
 * This module contains all type definitions for the rally analysis
 * and recommendation system.
 */

import type { TrajectoryPoint } from '../types';

// ============================================
// Court Zone System (3x3 grid)
// ============================================

/**
 * Court depth zones (relative to player's baseline)
 * - front: Near net (0 - 1/3 of half-court)
 * - mid: Middle court (1/3 - 2/3 of half-court)
 * - back: Near baseline (2/3 - 1 of half-court)
 */
export type CourtDepthZone = 'front' | 'mid' | 'back';

/**
 * Court width zones (looking at court)
 * - left: Left third
 * - center: Center third
 * - right: Right third
 */
export type CourtWidthZone = 'left' | 'center' | 'right';

/**
 * Court zone representation
 *
 * Zone IDs (0-8) layout:
 * ```
 * Far side (opponent):
 *   6 | 7 | 8  (back)
 *   3 | 4 | 5  (mid)
 *   0 | 1 | 2  (front/net)
 * ---- NET ----
 *   0 | 1 | 2  (front/net)
 *   3 | 4 | 5  (mid)
 *   6 | 7 | 8  (back)
 * Near side (player):
 * ```
 */
export interface CourtZone {
  depth: CourtDepthZone;
  width: CourtWidthZone;
  /** Zone ID 0-8: front-left=0, front-center=1, ... back-right=8 */
  id: number;
}

// ============================================
// Rally State Model
// ============================================

/**
 * Rally phase indicates the tactical situation
 * - attack: Player has initiative, can apply pressure
 * - neutral: Neither player has clear advantage
 * - defense: Player is under pressure, needs to reset
 */
export type RallyPhase = 'attack' | 'neutral' | 'defense';

/**
 * Initiative indicates who is controlling the rally
 * - us: Player has initiative (attacking/pressing)
 * - them: Opponent has initiative (player defending)
 * - unknown: Cannot determine from available data
 */
export type Initiative = 'us' | 'them' | 'unknown';

/**
 * Rally state at a specific point in time
 * This captures the tactical situation for decision-making
 */
export interface RallyState {
  /** Current tactical phase */
  phase: RallyPhase;
  /** Who has initiative/control */
  initiative: Initiative;
  /** Pressure level 0..1 (0 = no pressure, 1 = maximum pressure) */
  pressure: number;
  /** Open court zones available for attack (list of zone IDs 0-8) */
  openCourtZones: number[];
  /** Timestamp when state was computed (ms) */
  timestamp: number;
}

// ============================================
// Shot Types and Segments
// ============================================

/**
 * Badminton shot types
 */
export type ShotType =
  | 'clear'   // High deep shot to opponent's back court
  | 'drop'    // Soft shot that falls just over the net
  | 'smash'   // Fast downward attacking shot
  | 'drive'   // Fast flat shot parallel to ground
  | 'net'     // Shot played from near the net
  | 'lift'    // Defensive high shot from low position
  | 'serve'   // Service shot
  | 'push'    // Soft push to mid-court
  | 'unknown'; // Cannot classify

/**
 * A segment of the rally representing one shot/exchange
 */
export interface ShotSegment {
  /** Unique shot index within the rally (0-based) */
  shotIndex: number;
  /** Classified shot type */
  type: ShotType;
  /** Start timestamp in milliseconds from video/rally start */
  startTime: number;
  /** End timestamp in milliseconds */
  endTime: number;
  /** Trajectory points for this shot segment */
  trajectorySlice: TrajectoryPoint[];
  /** Corresponding pose timestamp if available (for fusion) */
  poseTimestamp?: number;
  /** Which player hit this shot: 'near' (us) or 'far' (opponent) */
  player?: 'near' | 'far';
}

// ============================================
// Shot Features
// ============================================

/**
 * Extracted features for a single shot
 * These are used for recommendation scoring
 */
export interface ShotFeatures {
  /** Zone where shuttle was contacted (0-8) */
  contactZone: number;
  /** Zone where shuttle landed (0-8) */
  landingZone: number;
  /** Proxy for shuttle speed (normalized 0-1, based on trajectory length/time) */
  shuttleSpeedProxy: number;
  /** Proxy for shuttle height at apex (normalized 0-1) */
  shuttleHeightProxy: number;
  /** Distance opponent moved during this shot (normalized 0-1) */
  opponentMovementDistance: number;
  /** Direction change in opponent movement (radians, 0 = same direction) */
  opponentDirectionChange: number;
  /** Recovery quality: distance to base position after hit (normalized, lower = better) */
  recoveryQuality: number;
  /** Rally state at time of this shot */
  rallyState: RallyState;
}

// ============================================
// Recommendations
// ============================================

/**
 * A point in a recommended shot path
 */
export interface PathPoint {
  /** Normalized x coordinate (0-1, left to right) */
  x: number;
  /** Normalized y coordinate (0-1, near baseline to far baseline) */
  y: number;
  /** Optional height for 3D visualization (meters) */
  z?: number;
}

/**
 * Types of rationale for recommendations
 */
export type RationaleType =
  | 'movement_pressure'  // Forces opponent to move far/fast
  | 'open_court'         // Exploits undefended court area
  | 'risk_reduction'     // Reduces risk when under pressure
  | 'angle_denial'       // Limits opponent's attacking angles
  | 'recovery_time';     // Gives player time to recover position

/**
 * Individual rationale explaining a recommendation
 */
export interface RecommendationRationale {
  /** Type of tactical reasoning */
  type: RationaleType;
  /** Human-readable description */
  description: string;
  /** Impact score for this rationale (-1 to 1, negative = disadvantage) */
  impact: number;
}

/**
 * A single shot recommendation
 */
export interface ShotRecommendation {
  /** Unique recommendation ID */
  id: string;
  /** Recommended shot type to play */
  shotType: ShotType;
  /** Target zone to aim for (0-8) */
  targetZone: number;
  /** Path polyline for visualization */
  pathPolyline: PathPoint[];
  /** Overall score (0-100, higher = better recommendation) */
  score: number;
  /** List of rationales explaining this recommendation */
  rationale: RecommendationRationale[];
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Complete analysis for a single shot with features and recommendations
 */
export interface PerShotAnalysis {
  /** The shot segment */
  shot: ShotSegment;
  /** Extracted features */
  features: ShotFeatures;
  /** TOP-3 recommendations for this decision point */
  recommendations: ShotRecommendation[];
}

// ============================================
// Rally Analysis Result
// ============================================

/**
 * Summary statistics for a rally
 */
export interface RallySummary {
  /** Total number of shots in the rally */
  totalShots: number;
  /** Most common phase during the rally */
  dominantPhase: RallyPhase;
  /** Average pressure across all shots (0-1) */
  averagePressure: number;
  /** Shot indices of critical decision points (high pressure moments) */
  keyMoments: number[];
  /** Who won the rally (if determinable) */
  winner?: 'us' | 'them' | 'unknown';
}

/**
 * Metadata about the analysis processing
 */
export interface AnalysisMetadata {
  /** ISO timestamp when analysis was processed */
  processedAt: string;
  /** Version of the strategy engine */
  engineVersion: string;
  /** Processing time in milliseconds */
  processingTimeMs?: number;
  /** Debug logs if DEBUG flag is enabled */
  debugLogs?: string[];
}

/**
 * Complete rally analysis result
 */
export interface RallyAnalysisResult {
  /** Session ID this rally belongs to */
  sessionId: string;
  /** Unique rally ID */
  rallyId: string;
  /** Per-shot analysis with features and recommendations */
  shots: PerShotAnalysis[];
  /** Overall rally summary */
  summary: RallySummary;
  /** Processing metadata */
  metadata: AnalysisMetadata;
}

// ============================================
// Engine Configuration
// ============================================

/**
 * Configuration options for the strategy engine
 */
export interface StrategyEngineConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Minimum trajectory points to process */
  minTrajectoryPoints?: number;
  /** Speed threshold for shot detection (normalized) */
  speedThreshold?: number;
  /** Direction change threshold for shot detection (radians) */
  directionChangeThreshold?: number;
  /** Custom scoring weights */
  scoringWeights?: Partial<ScoringWeights>;
}

/**
 * Weights for the recommendation scoring system
 */
export interface ScoringWeights {
  /** Weight for movement pressure factor (default: 20) */
  movementPressure: number;
  /** Weight for open court exploitation (default: 25) */
  openCourt: number;
  /** Weight for risk penalty under pressure (default: 15) */
  riskUnderPressure: number;
  /** Weight for angle exposure penalty (default: 10) */
  angleExposure: number;
}

// ============================================
// Database Types (for Supabase persistence)
// ============================================

/**
 * Rally record for database storage
 */
export interface RallyRecord {
  id: string;
  session_id: string;
  rally_index: number;
  start_time_ms: number;
  end_time_ms: number;
  total_shots: number;
  dominant_phase: RallyPhase;
  average_pressure: number;
  winner?: string;
  created_at: string;
}

/**
 * Shot record for database storage
 */
export interface ShotRecord {
  id: string;
  rally_id: string;
  shot_index: number;
  shot_type: ShotType;
  start_time_ms: number;
  end_time_ms: number;
  features: ShotFeatures;
  rally_state: RallyState;
  trajectory_slice: TrajectoryPoint[];
  created_at: string;
}

/**
 * Recommendation record for database storage
 */
export interface RecommendationRecord {
  id: string;
  shot_id: string;
  rec_index: number;
  shot_type: ShotType;
  target_zone: number;
  score: number;
  confidence: number;
  path_polyline: PathPoint[];
  rationale: RecommendationRationale[];
  created_at: string;
}
