'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MistakeEvent, FixKeyframe, PoseLandmark } from '@/lib/types';
import { POSE_CONNECTIONS } from '@/lib/pose-utils';

interface FixItCardProps {
  mistake: MistakeEvent;
  fixKeyframes?: FixKeyframe[];
  onClose?: () => void;
}

// Skeleton connections for drawing
const SKELETON_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 23], [12, 24], // shoulders to hips
  [23, 24], // hips
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

export default function FixItCard({
  mistake,
  fixKeyframes,
  onClose,
}: FixItCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePhase, setActivePhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const phaseTimeRef = useRef<number>(0);

  const phases = fixKeyframes?.length ? fixKeyframes : getDefaultPhases(mistake.type);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || phases.length === 0) return;

    let lastTime = performance.now();
    const phaseDuration = 3500; // 3.5 seconds per phase (was 1.5s) - slower for clearer learning

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      phaseTimeRef.current += deltaTime;

      if (phaseTimeRef.current >= phaseDuration) {
        phaseTimeRef.current = 0;
        setActivePhase(prev => (prev + 1) % phases.length);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, phases.length]);

  // Draw skeleton
  const drawSkeleton = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: PoseLandmark[],
    width: number,
    height: number,
    color: string,
    alpha: number = 1
  ) => {
    const padding = 20;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    ctx.globalAlpha = alpha;

    // Draw connections - THICKER for better visibility
    ctx.strokeStyle = color;
    ctx.lineWidth = 5; // Increased from 3 to 5
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (!start || !end) continue;
      if ((start.visibility ?? 0) < 0.3 || (end.visibility ?? 0) < 0.3) continue;

      // Check if this is an arm connection (for elbow emphasis)
      const isArmConnection = [13, 14, 15, 16].includes(startIdx) || [13, 14, 15, 16].includes(endIdx);

      ctx.beginPath();
      ctx.moveTo(padding + start.x * drawWidth, padding + start.y * drawHeight);
      ctx.lineTo(padding + end.x * drawWidth, padding + end.y * drawHeight);

      // Thicker line for arm connections
      if (isArmConnection) {
        ctx.lineWidth = 7;
      }
      ctx.stroke();
      ctx.lineWidth = 5; // Reset
    }

    // Draw joints - ENLARGED for better visibility
    ctx.fillStyle = color;
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      if (!landmark || (landmark.visibility ?? 0) < 0.3) continue;

      const isKeyJoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(i);
      const isElbow = i === 13 || i === 14; // Special highlight for elbows
      const isAffected = mistake.joints.includes(i);

      // Larger radius for better visibility (increased from 6/5/3 to 10/8/5)
      const radius = isAffected ? 12 : isElbow ? 10 : isKeyJoint ? 8 : 5;

      ctx.beginPath();
      ctx.arc(
        padding + landmark.x * drawWidth,
        padding + landmark.y * drawHeight,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Highlight affected joints with glow effect
      if (isAffected) {
        // Outer glow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pulsing indicator for elbow
        if (isElbow) {
          ctx.beginPath();
          ctx.arc(
            padding + landmark.x * drawWidth,
            padding + landmark.y * drawHeight,
            radius + 6,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [mistake.joints]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phases.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw current phase
    const currentPhase = phases[activePhase];
    if (currentPhase?.landmarks) {
      // Draw main skeleton in green (correct form)
      drawSkeleton(ctx, currentPhase.landmarks, width, height, '#22c55e', 1);

      // Draw arrows for affected joints if correction exists
      if (currentPhase.correction) {
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';

        // Draw correction indicator
        const padding = 20;
        const drawWidth = width - padding * 2;
        const drawHeight = height - padding * 2;

        for (const jointIdx of mistake.joints.slice(0, 2)) {
          const landmark = currentPhase.landmarks[jointIdx];
          if (landmark && (landmark.visibility ?? 0) > 0.3) {
            const x = padding + landmark.x * drawWidth;
            const y = padding + landmark.y * drawHeight;

            // Draw pulsing circle
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // Draw phase label
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(currentPhase?.label || `Phase ${activePhase + 1}`, width / 2, height - 10);

  }, [activePhase, phases, drawSkeleton, mistake.joints]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{mistake.summaryTitle}</h3>
            <p className="text-xs text-gray-500">
              {Math.round(mistake.confidence * 100)}% confidence
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Animation Canvas - ENLARGED for better visibility */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={320}
          height={400}
          className="w-full"
        />

        {/* Play/Pause button */}
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="absolute bottom-14 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition"
        >
          {isAnimating ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
          )}
        </button>
      </div>

      {/* Phase selector */}
      <div className="flex justify-center gap-2 py-2 bg-gray-50">
        {phases.map((phase, idx) => (
          <button
            key={idx}
            onClick={() => {
              setActivePhase(idx);
              phaseTimeRef.current = 0;
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              activePhase === idx
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {/* Correction text */}
      {phases[activePhase]?.correction && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              {phases[activePhase].correction}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">{mistake.description}</p>
      </div>
    </div>
  );
}

/**
 * TASK 3: Generate DRAMATIC default phases for mistake types when no keyframes provided
 * Enhanced with exaggerated correct poses to clearly show the fix
 */
function getDefaultPhases(mistakeType: string): FixKeyframe[] {
  // Default pose landmarks for each phase
  const defaultPose: PoseLandmark[] = Array(33).fill(null).map((_, i) => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0,
  }));

  // Set visible landmarks for a basic stick figure
  const setLandmark = (pose: PoseLandmark[], idx: number, x: number, y: number) => {
    pose[idx] = { x, y, z: 0, visibility: 1 };
  };

  // TASK 3: Create mistake-specific exaggerated poses
  switch (mistakeType) {
    case 'OVERHEAD_CONTACT_LOW': {
      // Wrong: wrist at shoulder level
      const wrongPose = [...defaultPose];
      setLandmark(wrongPose, 0, 0.5, 0.15);
      setLandmark(wrongPose, 11, 0.4, 0.28); setLandmark(wrongPose, 12, 0.6, 0.28);
      setLandmark(wrongPose, 13, 0.35, 0.35); setLandmark(wrongPose, 14, 0.68, 0.22); // elbow raised
      setLandmark(wrongPose, 15, 0.3, 0.48); setLandmark(wrongPose, 16, 0.72, 0.20); // wrist only at head level
      setLandmark(wrongPose, 23, 0.44, 0.55); setLandmark(wrongPose, 24, 0.56, 0.55);
      setLandmark(wrongPose, 25, 0.42, 0.75); setLandmark(wrongPose, 26, 0.58, 0.75);
      setLandmark(wrongPose, 27, 0.4, 0.95); setLandmark(wrongPose, 28, 0.6, 0.95);

      // Correct: wrist DRAMATICALLY high
      const correctPose = [...defaultPose];
      setLandmark(correctPose, 0, 0.5, 0.15);
      setLandmark(correctPose, 11, 0.38, 0.25); setLandmark(correctPose, 12, 0.62, 0.22);
      setLandmark(correctPose, 13, 0.32, 0.32); setLandmark(correctPose, 14, 0.72, 0.08); // elbow HIGH
      setLandmark(correctPose, 15, 0.28, 0.45); setLandmark(correctPose, 16, 0.78, 0.02); // wrist VERY HIGH
      setLandmark(correctPose, 23, 0.42, 0.52); setLandmark(correctPose, 24, 0.58, 0.52);
      setLandmark(correctPose, 25, 0.4, 0.72); setLandmark(correctPose, 26, 0.6, 0.72);
      setLandmark(correctPose, 27, 0.38, 0.92); setLandmark(correctPose, 28, 0.62, 0.92);

      return [
        { phase: 'setup', landmarks: wrongPose, label: '✗ Too Low', correction: 'Contact point is too low - losing power' },
        { phase: 'contact', landmarks: correctPose, label: '✓ HIGH Contact', correction: 'Hit at the HIGHEST point above your head!' },
        { phase: 'recover', landmarks: correctPose, label: 'Full Extension', correction: 'Arm should be almost straight above' },
      ];
    }

    case 'ELBOW_TOO_BENT': {
      // Wrong: VERY bent elbow at contact (exaggerated for visibility)
      const wrongPose = [...defaultPose];
      setLandmark(wrongPose, 0, 0.5, 0.12);
      setLandmark(wrongPose, 11, 0.38, 0.25); setLandmark(wrongPose, 12, 0.62, 0.22);
      // Elbow position - bent at 90 degrees (very visible)
      setLandmark(wrongPose, 13, 0.30, 0.32); setLandmark(wrongPose, 14, 0.72, 0.15);
      // Wrist VERY close to elbow = extremely bent (exaggerated)
      setLandmark(wrongPose, 15, 0.22, 0.42); setLandmark(wrongPose, 16, 0.62, 0.08);
      setLandmark(wrongPose, 23, 0.42, 0.52); setLandmark(wrongPose, 24, 0.58, 0.52);
      setLandmark(wrongPose, 25, 0.40, 0.72); setLandmark(wrongPose, 26, 0.60, 0.72);
      setLandmark(wrongPose, 27, 0.38, 0.92); setLandmark(wrongPose, 28, 0.62, 0.92);

      // Transition: Elbow starting to extend
      const transitionPose = [...defaultPose];
      setLandmark(transitionPose, 0, 0.5, 0.12);
      setLandmark(transitionPose, 11, 0.38, 0.24); setLandmark(transitionPose, 12, 0.62, 0.20);
      setLandmark(transitionPose, 13, 0.30, 0.30); setLandmark(transitionPose, 14, 0.75, 0.10);
      setLandmark(transitionPose, 15, 0.22, 0.40); setLandmark(transitionPose, 16, 0.82, 0.04);
      setLandmark(transitionPose, 23, 0.42, 0.52); setLandmark(transitionPose, 24, 0.58, 0.52);
      setLandmark(transitionPose, 25, 0.40, 0.72); setLandmark(transitionPose, 26, 0.60, 0.72);
      setLandmark(transitionPose, 27, 0.38, 0.92); setLandmark(transitionPose, 28, 0.62, 0.92);

      // Correct: FULLY extended elbow (dramatic extension)
      const correctPose = [...defaultPose];
      setLandmark(correctPose, 0, 0.5, 0.10);
      setLandmark(correctPose, 11, 0.36, 0.22); setLandmark(correctPose, 12, 0.64, 0.18);
      // Elbow almost straight line with shoulder
      setLandmark(correctPose, 13, 0.28, 0.28); setLandmark(correctPose, 14, 0.78, 0.06);
      // Wrist VERY FAR from elbow = fully extended arm (dramatic)
      setLandmark(correctPose, 15, 0.20, 0.38); setLandmark(correctPose, 16, 0.92, -0.02);
      setLandmark(correctPose, 23, 0.42, 0.50); setLandmark(correctPose, 24, 0.58, 0.50);
      setLandmark(correctPose, 25, 0.40, 0.70); setLandmark(correctPose, 26, 0.60, 0.70);
      setLandmark(correctPose, 27, 0.38, 0.90); setLandmark(correctPose, 28, 0.62, 0.90);

      return [
        { phase: 'setup', landmarks: wrongPose, label: '✗ Bent Elbow', correction: 'Elbow bent at 90° - losing reach and power!' },
        { phase: 'contact', landmarks: transitionPose, label: '→ Extending...', correction: 'Start straightening your arm NOW' },
        { phase: 'recover', landmarks: correctPose, label: '✓ FULL Extension', correction: 'Arm almost straight = MAXIMUM reach and power!' },
      ];
    }

    case 'INSUFFICIENT_ROTATION': {
      // Wrong: facing forward (no rotation)
      const wrongPose = [...defaultPose];
      setLandmark(wrongPose, 0, 0.5, 0.15);
      setLandmark(wrongPose, 11, 0.42, 0.28); setLandmark(wrongPose, 12, 0.58, 0.28); // shoulders square
      setLandmark(wrongPose, 13, 0.38, 0.38); setLandmark(wrongPose, 14, 0.62, 0.38);
      setLandmark(wrongPose, 15, 0.35, 0.48); setLandmark(wrongPose, 16, 0.65, 0.48);
      setLandmark(wrongPose, 23, 0.45, 0.55); setLandmark(wrongPose, 24, 0.55, 0.55); // hips square
      setLandmark(wrongPose, 25, 0.43, 0.75); setLandmark(wrongPose, 26, 0.57, 0.75);
      setLandmark(wrongPose, 27, 0.42, 0.95); setLandmark(wrongPose, 28, 0.58, 0.95);

      // Correct: DRAMATIC rotation
      const correctPose = [...defaultPose];
      setLandmark(correctPose, 0, 0.5, 0.15);
      setLandmark(correctPose, 11, 0.32, 0.30); setLandmark(correctPose, 12, 0.68, 0.22); // shoulders rotated!
      setLandmark(correctPose, 13, 0.25, 0.40); setLandmark(correctPose, 14, 0.75, 0.15);
      setLandmark(correctPose, 15, 0.22, 0.50); setLandmark(correctPose, 16, 0.80, 0.08);
      setLandmark(correctPose, 23, 0.38, 0.55); setLandmark(correctPose, 24, 0.62, 0.52); // hips rotated!
      setLandmark(correctPose, 25, 0.36, 0.75); setLandmark(correctPose, 26, 0.64, 0.72);
      setLandmark(correctPose, 27, 0.35, 0.95); setLandmark(correctPose, 28, 0.65, 0.92);

      return [
        { phase: 'setup', landmarks: wrongPose, label: '✗ No Rotation', correction: 'Facing forward - no power generation' },
        { phase: 'contact', landmarks: correctPose, label: '✓ ROTATE!', correction: 'Turn your WHOLE body through the shot!' },
        { phase: 'recover', landmarks: correctPose, label: 'Hips → Shoulders', correction: 'Hips lead, then shoulders follow' },
      ];
    }

    case 'STANCE_TOO_NARROW': {
      // Wrong: feet close together
      const wrongPose = [...defaultPose];
      setLandmark(wrongPose, 0, 0.5, 0.15);
      setLandmark(wrongPose, 11, 0.42, 0.28); setLandmark(wrongPose, 12, 0.58, 0.28);
      setLandmark(wrongPose, 13, 0.38, 0.38); setLandmark(wrongPose, 14, 0.62, 0.38);
      setLandmark(wrongPose, 15, 0.35, 0.48); setLandmark(wrongPose, 16, 0.65, 0.48);
      setLandmark(wrongPose, 23, 0.46, 0.55); setLandmark(wrongPose, 24, 0.54, 0.55);
      setLandmark(wrongPose, 25, 0.47, 0.75); setLandmark(wrongPose, 26, 0.53, 0.75); // knees close
      setLandmark(wrongPose, 27, 0.48, 0.95); setLandmark(wrongPose, 28, 0.52, 0.95); // feet very close

      // Correct: WIDE athletic stance
      const correctPose = [...defaultPose];
      setLandmark(correctPose, 0, 0.5, 0.15);
      setLandmark(correctPose, 11, 0.40, 0.28); setLandmark(correctPose, 12, 0.60, 0.28);
      setLandmark(correctPose, 13, 0.36, 0.38); setLandmark(correctPose, 14, 0.64, 0.38);
      setLandmark(correctPose, 15, 0.33, 0.48); setLandmark(correctPose, 16, 0.67, 0.48);
      setLandmark(correctPose, 23, 0.42, 0.55); setLandmark(correctPose, 24, 0.58, 0.55);
      setLandmark(correctPose, 25, 0.35, 0.76); setLandmark(correctPose, 26, 0.65, 0.76); // knees wide
      setLandmark(correctPose, 27, 0.28, 0.95); setLandmark(correctPose, 28, 0.72, 0.95); // feet WIDE

      return [
        { phase: 'setup', landmarks: wrongPose, label: '✗ Too Narrow', correction: 'Feet too close - unstable position' },
        { phase: 'contact', landmarks: correctPose, label: '✓ WIDEN!', correction: 'Shoulder-width or wider!' },
        { phase: 'recover', landmarks: correctPose, label: 'Athletic Base', correction: 'Wide = stable = powerful' },
      ];
    }

    case 'POOR_LUNGE_RECOVERY': {
      // Wrong: stuck in lunge
      const wrongPose = [...defaultPose];
      setLandmark(wrongPose, 0, 0.5, 0.18);
      setLandmark(wrongPose, 11, 0.42, 0.32); setLandmark(wrongPose, 12, 0.58, 0.32);
      setLandmark(wrongPose, 13, 0.38, 0.42); setLandmark(wrongPose, 14, 0.62, 0.42);
      setLandmark(wrongPose, 15, 0.35, 0.52); setLandmark(wrongPose, 16, 0.65, 0.52);
      setLandmark(wrongPose, 23, 0.44, 0.58); setLandmark(wrongPose, 24, 0.56, 0.58);
      setLandmark(wrongPose, 25, 0.35, 0.75); setLandmark(wrongPose, 26, 0.72, 0.82); // deep lunge
      setLandmark(wrongPose, 27, 0.32, 0.95); setLandmark(wrongPose, 28, 0.78, 0.95);

      // Correct: explosive recovery
      const correctPose = [...defaultPose];
      setLandmark(correctPose, 0, 0.5, 0.15);
      setLandmark(correctPose, 11, 0.42, 0.28); setLandmark(correctPose, 12, 0.58, 0.28);
      setLandmark(correctPose, 13, 0.38, 0.38); setLandmark(correctPose, 14, 0.62, 0.38);
      setLandmark(correctPose, 15, 0.35, 0.48); setLandmark(correctPose, 16, 0.65, 0.48);
      setLandmark(correctPose, 23, 0.44, 0.55); setLandmark(correctPose, 24, 0.56, 0.55);
      setLandmark(correctPose, 25, 0.42, 0.72); setLandmark(correctPose, 26, 0.58, 0.72); // recovered!
      setLandmark(correctPose, 27, 0.40, 0.92); setLandmark(correctPose, 28, 0.60, 0.92);

      return [
        { phase: 'setup', landmarks: wrongPose, label: '✗ Stuck in Lunge', correction: 'Slow recovery - opponent has time' },
        { phase: 'contact', landmarks: correctPose, label: '✓ PUSH OFF!', correction: 'Explode back from front foot!' },
        { phase: 'recover', landmarks: correctPose, label: 'Back to Center', correction: 'Spring back to ready position' },
      ];
    }

    default: {
      // Generic setup/contact/recover
      const setupPose = [...defaultPose];
      setLandmark(setupPose, 0, 0.5, 0.15);
      setLandmark(setupPose, 11, 0.42, 0.28); setLandmark(setupPose, 12, 0.58, 0.28);
      setLandmark(setupPose, 13, 0.38, 0.4); setLandmark(setupPose, 14, 0.62, 0.4);
      setLandmark(setupPose, 15, 0.35, 0.52); setLandmark(setupPose, 16, 0.65, 0.52);
      setLandmark(setupPose, 23, 0.44, 0.55); setLandmark(setupPose, 24, 0.56, 0.55);
      setLandmark(setupPose, 25, 0.42, 0.75); setLandmark(setupPose, 26, 0.58, 0.75);
      setLandmark(setupPose, 27, 0.4, 0.95); setLandmark(setupPose, 28, 0.6, 0.95);

      const contactPose = [...defaultPose];
      setLandmark(contactPose, 0, 0.5, 0.12);
      setLandmark(contactPose, 11, 0.4, 0.25); setLandmark(contactPose, 12, 0.6, 0.25);
      setLandmark(contactPose, 13, 0.35, 0.35); setLandmark(contactPose, 14, 0.7, 0.15);
      setLandmark(contactPose, 15, 0.3, 0.45); setLandmark(contactPose, 16, 0.75, 0.08);
      setLandmark(contactPose, 23, 0.42, 0.52); setLandmark(contactPose, 24, 0.58, 0.52);
      setLandmark(contactPose, 25, 0.4, 0.72); setLandmark(contactPose, 26, 0.6, 0.72);
      setLandmark(contactPose, 27, 0.38, 0.92); setLandmark(contactPose, 28, 0.62, 0.92);

      return [
        { phase: 'setup', landmarks: setupPose, label: 'Setup', correction: 'Ready position' },
        { phase: 'contact', landmarks: contactPose, label: 'Contact', correction: 'Execute the movement' },
        { phase: 'recover', landmarks: setupPose, label: 'Recovery', correction: 'Return to ready' },
      ];
    }
  }
}
