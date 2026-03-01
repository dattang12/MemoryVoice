import type { Era } from '@/types'
import { ERA_CONFIGS } from '@/types'

// ============================================================
// EraSection — Era divider label component
//
// Rendered above or alongside each era group of panels.
// Shows the era name, year range, and a styled accent line.
// Works in both spatial mode and CSS 3D fallback.
// ============================================================

interface EraSectionProps {
  era: Era
  photoCount: number
  /** Optional inline style overrides (e.g. translateZ positioning in fallback) */
  style?: React.CSSProperties
  className?: string
}

const ERA_YEAR_RANGES: Record<Era, string> = {
  childhood:    '0 – 18 years',
  'young-adult':'18 – 35 years',
  family:       '35 – 60 years',
  recent:       '60+ years',
}

export default function EraSection({
  era,
  photoCount,
  style,
  className = '',
}: EraSectionProps) {
  const config = ERA_CONFIGS[era]

  return (
    <div
      className={`flex items-center gap-4 select-none ${className}`}
      style={style}
      role="separator"
      aria-label={`${config.label} — ${ERA_YEAR_RANGES[era]}`}
    >
      {/* Left accent line */}
      <div
        className="h-px flex-1 opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.color})`,
        }}
        aria-hidden="true"
      />

      {/* Era label block */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span
          className={`text-xs font-bold uppercase tracking-[0.2em] ${config.textColor}`}
        >
          {config.icon} {config.label}
        </span>
        <span className="text-[10px] text-memory-text-muted tracking-widest">
          {ERA_YEAR_RANGES[era]}
        </span>
        {photoCount > 0 && (
          <span
            className={`mt-1 text-[9px] font-semibold px-2 py-0.5 rounded-full
                        ${config.bgColor} ${config.borderColor} border
                        ${config.textColor} opacity-80`}
          >
            {photoCount} {photoCount === 1 ? 'memory' : 'memories'}
          </span>
        )}
      </div>

      {/* Right accent line */}
      <div
        className="h-px flex-1 opacity-40"
        style={{
          background: `linear-gradient(90deg, ${config.color}, transparent)`,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
