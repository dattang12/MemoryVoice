// Database types - supports both old and new schema
export interface Session {
  id: string;
  user_id: string;
  // Old schema
  mode?: string;
  started_at?: string;
  ended_at?: string | null;
  score_summary?: ScoreSummary;
  // New schema (from supabase-migration-v2)
  type?: 'analytics' | 'practice' | 'strategy';
  created_at: string;
  video_path?: string;
  video_url?: string;
  filename?: string;
  duration_seconds?: number;
  overall_score?: number;
  summary?: ScoreSummary;
  pose_data?: any[];
  frame_count?: number;
  // v3 enhanced schema
  status?: 'processing' | 'ready' | 'error';
  match_format?: 'singles' | 'doubles';
  event_type?: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
  selected_tracks?: number[];
  summary_score?: number;
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  rules_version?: string;
  tracks_data?: PlayerTrackData[];
  // Practice recording fields (v4)
  practice_video_path?: string;
  practice_video_mime?: string;
  practice_video_duration_sec?: number;
  practice_video_size_bytes?: number;
}

export interface ScoreSummary {
  green_count?: number;
  green_frames?: number;
  red_count?: number;
  red_frames?: number;
  total_frames: number;
  average_score?: number;
  green_ratio?: number;
  drill_id?: string;
  drill_type?: string;
  metrics_avg?: PoseMetrics;
  shot_count?: number;
  error_count?: number;
  feedback?: any;
}

export interface AnalysisResult {
  id: string;
  user_id: string;
  video_path: string;
  result_json: AnalysisResultJson | null;
  status: 'processing' | 'completed' | 'error';
  created_at: string;
}

export interface AnalysisResultJson {
  top_issues: Issue[];
  drills: Drill[];
  technique_summary: string;
  strategy_summary: string;
  training_plan: TrainingPlanItem[];
  drill_visuals?: string[]; // URLs to generated drill images
}

export interface Issue {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  affected_metrics: string[];
}

export interface Drill {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  target_metrics: string[];
  instructions: string[];
}

export interface TrainingPlanItem {
  day: number;
  focus: string;
  drills: string[];
  duration_minutes: number;
}

export interface RacketFavorite {
  id: string;
  user_id: string;
  racket_id: string;
  created_at: string;
}

// Pose estimation types
export interface PoseMetrics {
  elbow_angle: number;
  knee_angle: number;
  stance_width_norm: number;
  shoulder_hip_rotation_proxy: number;
  timestamp?: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// API types
export interface TickRequest {
  metrics_snapshot: PoseMetrics;
  drill_id?: string;
  session_id?: string;
}

export interface TickResponse {
  cue: string;
  focus_metric: string;
  green_thresholds: {
    [key: string]: { min: number; max: number };
  };
  is_green: boolean;
}

export interface RacketRecommendRequest {
  level: 'beginner' | 'intermediate' | 'advanced';
  weaknesses: string[];
  style_pref?: 'power' | 'control' | 'all-round';
}

export interface Racket {
  id: string;
  name: string;
  brand: string;
  price_band: 'budget' | 'mid-range' | 'premium';
  price_range: string;
  play_style: string[];
  skill_level: string[];
  weight: string;
  balance: string;
  flexibility: string;
  description: string;
  image_url: string;
  ebay_search_query: string;
}

export interface RacketRecommendation extends Racket {
  match_score: number;
  match_reason: string;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  score: number;
  greenRatio?: number;
  checkIns?: number;
}

// User profile
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

// ============================================
// V3 Enhanced Types
// ============================================

// Session assets for persistent storage
export interface SessionAsset {
  id: string;
  session_id: string;
  kind: 'video' | 'analysis_json' | 'pose_json' | 'keyframe1' | 'keyframe2' | 'keyframe3' | 'trajectory_json' | 'trajectory_video' | 'tracks_thumbnail';
  storage_path: string;
  storage_bucket: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Player track data for multi-person tracking
export interface PlayerTrackData {
  track_id: number;
  thumbnail_url?: string;
  bbox_samples: BoundingBoxSample[];
  side?: 'near' | 'far';
  is_selected: boolean;
  confidence_avg: number;
  frame_count: number;
}

export interface BoundingBoxSample {
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  confidence?: number;
}

// Strategy mode types
export interface StrategyResult {
  id: string;
  session_id: string;
  original_trajectory: TrajectoryPoint[];
  refined_trajectory: TrajectoryPoint[];
  coaching_points: string[];
  court_homography?: number[][];
  shuttle_detections?: ShuttleDetection[];
  created_at: string;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  court_x?: number; // Court-mapped x coordinate (0-1)
  court_y?: number; // Court-mapped y coordinate (0-1)
}

export interface ShuttleDetection {
  frame: number;
  x: number;
  y: number;
  confidence: number;
}

// Banded scoring types
export type ScoreBand = 'green' | 'yellow' | 'red' | 'unknown';

export interface BandedScore {
  band: ScoreBand;
  value: number;
  confidence: number;
  feedback?: string;
}

export interface ScoringRulesConfig {
  version: string;
  skill_bands: {
    beginner: SkillBandConfig;
    intermediate: SkillBandConfig;
    advanced: SkillBandConfig;
  };
  confidence_threshold: number;
  phase_rules: Record<string, PhaseRule>;
}

export interface SkillBandConfig {
  green_tolerance: number; // Percentage wider than ideal
  yellow_tolerance: number; // Percentage wider than green
}

export interface PhaseRule {
  name: string;
  applicable_metrics: string[];
  thresholds: Record<string, { min: number; max: number }>;
}

// Multi-pose detection result
export interface MultiPoseResult {
  poses: DetectedPose[];
  timestamp: number;
}

export interface DetectedPose {
  track_id: number;
  landmarks: PoseLandmark[];
  bbox: { x: number; y: number; w: number; h: number };
  confidence: number;
}

// Event type labels
export const EVENT_TYPE_LABELS: Record<string, string> = {
  MS: "Men's Singles",
  WS: "Women's Singles",
  MD: "Men's Doubles",
  WD: "Women's Doubles",
  XD: 'Mixed Doubles',
};

// 3D Skeleton animation types
export interface SkeletonKeyframe {
  label: string;
  landmarks: { x: number; y: number; z: number }[];
  timestamp: number;
}

export interface AnimatedDrill {
  id: string;
  name: string;
  phases: DrillPhase[];
  loop: boolean;
  duration_ms: number;
}

export interface DrillPhase {
  name: string;
  keyframes: SkeletonKeyframe[];
  duration_ms: number;
}

// ============================================
// V4 Feature Types: Ghost, Timeline, Skill Score
// ============================================

// Auto Skill Score (computed from pose metrics, not Gemini)
export interface ComputedSkillScore {
  skillScore: number; // 0-100
  levelLabel: 'Beginner' | 'Intermediate' | 'Advanced';
  confidencePercent: number; // 0-100, derived from landmark visibility
  confidenceReasons: string[]; // Reasons if confidence is low
  metrics: {
    consistencyScore: number; // How stable form is across frames
    recoverySpeed: number; // Speed of recovery after lunges
    formQuality: number; // Average form score
    visibilityAvg: number; // Average landmark visibility
    dropoutRate: number; // % frames with missing/low visibility
  };
}

// Ghost Rival Overlay
export interface GhostRivalData {
  source: 'my-best-rep' | 'pro-template';
  enabled: boolean;
  poseSequence: GhostPoseFrame[];
  bestRepWindow?: {
    startTime: number;
    endTime: number;
    score: number;
    shotType?: string;
  };
}

export interface GhostPoseFrame {
  timestamp: number; // Absolute time in seconds
  normalizedTime?: number; // 0-1 within window
  landmarks: PoseLandmark[];
}

// Mistake Timeline
export interface MistakeEvent {
  id: string;
  type: string; // e.g., 'OVERHEAD_CONTACT_LOW', 'LATE_SPLIT_STEP', 'POOR_LUNGE_RECOVERY'
  startTimeSec: number;
  endTimeSec: number;
  severity: number; // 0-1
  confidence: number; // 0-1, derived from pose visibility
  joints: number[]; // Landmark indices affected
  summaryTitle: string;
  description?: string;
  fixKeyframes?: FixKeyframe[];
}

export interface FixKeyframe {
  phase: 'setup' | 'contact' | 'recover';
  landmarks: PoseLandmark[];
  label: string;
  correction?: string;
}

// Timeline segment for rendering
export interface TimelineSegment {
  id: string;
  startPercent: number; // 0-100
  widthPercent: number; // Width as percentage of timeline
  color: string; // Severity color
  event: MistakeEvent;
}

// Confidence calculation from visibility
export interface VisibilityMetrics {
  avgVisibility: number; // 0-1, mean across key joints
  validFrameRatio: number; // % frames above threshold
  dropoutRate: number; // % frames with missing landmarks
  keyJointVisibility: Record<string, number>; // Per-joint visibility
}

// ============================================
// V5 Feature Types: YOLO+ByteTrack Tracking Pipeline
// ============================================

// Backend tracking response for a single frame
export interface TrackingFrame {
  frame_idx: number;
  timestamp_sec: number;
  tracks: TrackedPerson[];
}

// Individual tracked person in a frame
export interface TrackedPerson {
  track_id: number;
  bbox: BoundingBox;
  confidence: number;
  landmarks?: PoseLandmark[]; // MediaPipe landmarks (cropped and remapped)
  pose_confidence?: number;
}

// Bounding box with normalized coordinates
export interface BoundingBox {
  x: number; // Top-left x (normalized 0-1)
  y: number; // Top-left y (normalized 0-1)
  w: number; // Width (normalized 0-1)
  h: number; // Height (normalized 0-1)
}

// Full tracking result for entire video
export interface TrackingResult {
  video_id: string;
  frame_count: number;
  fps: number;
  duration_sec: number;
  frames: TrackingFrame[];
  track_summaries: TrackSummary[];
}

// Summary info for each unique track_id
export interface TrackSummary {
  track_id: number;
  first_frame: number;
  last_frame: number;
  frame_count: number;
  avg_confidence: number;
  thumbnail_base64?: string;
  side?: 'near' | 'far';
}

// Compare Mode types
export interface CompareModeState {
  enabled: boolean;
  selectedMistakeId: string | null;
  ghostSource: 'my-best-rep' | 'pro-template' | 'corrected';
  playbackSync: boolean;
  playbackSpeed: number;
}

export interface CompareFramePair {
  timestamp: number;
  userLandmarks: PoseLandmark[];
  ghostLandmarks: PoseLandmark[];
  deviations: JointDeviation[];
}

export interface JointDeviation {
  jointIndex: number;
  jointName: string;
  deviationDeg: number; // Angular deviation from ideal
  severity: 'ok' | 'warning' | 'error'; // green/yellow/red
}

// 3D Pose Sandbox types
export interface PoseSandbox3DState {
  enabled: boolean;
  mistakeId: string | null;
  viewAngle: { azimuth: number; elevation: number };
  showDeviations: boolean;
  highlightedJoints: number[];
  animationProgress: number; // 0-1 for wrong->correct animation
}

export interface Joint3D {
  position: [number, number, number];
  color: string;
  size: number;
  highlighted: boolean;
  label?: string;
}

export interface Bone3D {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  thickness: number;
}

// Movement Guidance Phase types
export type MovementPhase = 'ready' | 'split' | 'push' | 'strike' | 'recover';

export interface PhaseSequence {
  phases: PhaseInfo[];
  currentPhase: MovementPhase;
  phaseProgress: number; // 0-1 within current phase
}

export interface PhaseInfo {
  phase: MovementPhase;
  label: string;
  startTimeSec: number;
  endTimeSec: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  errorType?: string;
}

// When/Why Cause-Effect Cards
export interface CauseEffectCard {
  mistakeType: string;
  when: string; // "When you drop your elbow below shoulder level..."
  why: string; // "...power generation decreases by 40%"
  visualCue?: string;
  fixKeyframes?: FixKeyframe[];
}

// Stance Width Bracket types
export interface StanceWidthData {
  currentWidth: number; // Normalized stance width
  idealWidth: number;
  tolerance: number;
  status: 'ok' | 'too-narrow' | 'too-wide';
  leftAnklePos: { x: number; y: number };
  rightAnklePos: { x: number; y: number };
}

// Locked player context for filtering
export interface LockedPlayerContext {
  trackId: number;
  lockTime: number;
  thumbnailUrl?: string;
  side?: 'near' | 'far';
}
