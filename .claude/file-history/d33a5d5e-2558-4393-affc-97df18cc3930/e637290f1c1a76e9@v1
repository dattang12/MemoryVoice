'use client';

import { useState } from 'react';
import type { ComputedSkillScore } from '@/lib/types';

interface SkillMeterProps {
  skillData: ComputedSkillScore;
  compact?: boolean;
}

export default function SkillMeter({ skillData, compact = false }: SkillMeterProps) {
  const [showDetails, setShowDetails] = useState(false);

  const {
    skillScore,
    levelLabel,
    confidencePercent,
    confidenceReasons,
    metrics,
  } = skillData;

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced':
        return { bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-500', bar: 'bg-green-500' };
      case 'Intermediate':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-500', bar: 'bg-yellow-500' };
      case 'Beginner':
        return { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-500', bar: 'bg-blue-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', ring: 'ring-gray-500', bar: 'bg-gray-500' };
    }
  };

  const colors = getLevelColor(levelLabel);

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Skill Badge */}
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
          {levelLabel}
        </div>

        {/* Score */}
        <div className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">{skillScore}</span>/100
        </div>

        {/* Confidence indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getConfidenceColor(confidencePercent)}`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{confidencePercent}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header with skill badge */}
      <div className={`p-4 ${colors.bg} border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Skill Level Badge */}
            <div className={`px-4 py-2 rounded-full font-bold text-lg ${colors.bg} ${colors.text} ring-2 ${colors.ring}`}>
              {levelLabel}
            </div>

            {/* Score */}
            <div>
              <div className="text-3xl font-bold text-gray-900">{skillScore}</div>
              <div className="text-sm text-gray-600">Skill Score</div>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Detection Confidence</div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getConfidenceColor(confidencePercent)}`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
              <span className="font-semibold text-gray-700">{confidencePercent}%</span>
            </div>
          </div>
        </div>

        {/* Low confidence warning */}
        {confidencePercent < 60 && confidenceReasons.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-xs text-yellow-800">
                <span className="font-medium">Lower confidence:</span> {confidenceReasons[0]}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div className="p-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <span>Score Breakdown</span>
          <svg
            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-3">
            {/* Form Quality */}
            <MetricBar
              label="Form Quality"
              value={metrics.formQuality * 100}
              description="How well your body positions match ideal form"
            />

            {/* Consistency */}
            <MetricBar
              label="Consistency"
              value={metrics.consistencyScore * 100}
              description="How stable your form is across frames"
            />

            {/* Recovery Speed */}
            <MetricBar
              label="Recovery Speed"
              value={metrics.recoverySpeed * 100}
              description="How quickly you recover after lunges"
            />

            {/* Visibility */}
            <MetricBar
              label="Detection Quality"
              value={metrics.visibilityAvg * 100}
              description="Clarity of pose detection in video"
            />

            {/* Dropout Rate (inverse) */}
            <MetricBar
              label="Frame Coverage"
              value={(1 - metrics.dropoutRate) * 100}
              description="Percentage of frames with valid pose data"
            />

            {/* Confidence reasons */}
            {confidenceReasons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Confidence Notes:</p>
                <ul className="space-y-1">
                  {confidenceReasons.map((reason, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* How score is calculated */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 italic">
          Score computed from pose metrics. Confidence from landmark visibility.
        </p>
      </div>
    </div>
  );
}

// Metric bar sub-component
function MetricBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description?: string;
}) {
  const getBarColor = (val: number) => {
    if (val >= 70) return 'bg-green-500';
    if (val >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getBarColor(value)}`}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
      {description && (
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      )}
    </div>
  );
}

// Inline badge version for video overlay
export function SkillBadgeInline({ skillData }: { skillData: ComputedSkillScore }) {
  const { skillScore, levelLabel, confidencePercent } = skillData;

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'Advanced':
        return 'bg-green-500';
      case 'Intermediate':
        return 'bg-yellow-500';
      case 'Beginner':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getLevelStyles(levelLabel)}`}>
        {levelLabel}
      </span>
      <span className="text-white text-sm font-medium">{skillScore}</span>
      <span className="text-white/60 text-xs">({confidencePercent}% conf)</span>
    </div>
  );
}
