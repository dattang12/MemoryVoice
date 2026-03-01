// ============================================================
// MemoryOrb — Central pulsing orb representing the person
//
// In spatial mode (is-spatial class on <html>) this element is
// spatialized via enable-xr and elevated with --xr-back so it
// floats at the center of the memory room.
//
// In browser fallback mode it renders as a glowing CSS orb.
// ============================================================

interface MemoryOrbProps {
  personName: string
  isSpeaking: boolean
  isSpatialMode: boolean
}

export default function MemoryOrb({
  personName,
  isSpeaking,
  isSpatialMode,
}: MemoryOrbProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      role="img"
      aria-label={`${personName}'s Memory Room — center orb`}
    >
      {/*
        Outer ping ring: only active when voice agent is speaking.
        In spatial mode this gives a visible feedback cue.
      */}
      {isSpeaking && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      )}

      {/*
        Secondary ambient glow — always visible
      */}
      <span
        className="absolute inset-[-24px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 72%)',
          filter: 'blur(12px)',
        }}
        aria-hidden="true"
      />

      {/*
        Main orb sphere
        enable-xr: tells WebSpatial to lift this element into 3D space
        --xr-background-material: gives it a frosted glass material in visionOS
        --xr-back: how far back (in pt) the element extrudes into space
      */}
      <div
        // WebSpatial spatial attribute — ignored gracefully in browser mode
        {...(isSpatialMode ? { 'enable-xr': true } : {})}
        className={[
          'relative z-10',
          'w-28 h-28 rounded-full',
          'flex items-center justify-center',
          // Pulsing animation — faster when speaking
          isSpeaking ? 'animate-ping' : 'animate-pulse',
        ].join(' ')}
        style={{
          background:
            'radial-gradient(circle at 35% 35%, #a78bfa, #6d28d9 50%, #3b0764)',
          boxShadow: isSpeaking
            ? '0 0 48px rgba(109,40,217,0.7), 0 0 100px rgba(109,40,217,0.3), inset 0 0 24px rgba(255,255,255,0.1)'
            : '0 0 32px rgba(109,40,217,0.5), 0 0 64px rgba(109,40,217,0.2), inset 0 0 16px rgba(255,255,255,0.08)',
          // WebSpatial CSS custom properties — active in visionOS, ignored in browser
          ...(isSpatialMode
            ? ({
                '--xr-background-material': 'thick',
                '--xr-back': '40',
              } as React.CSSProperties)
            : {}),
        }}
      >
        {/* Inner highlight specular */}
        <div
          className="absolute top-3 left-4 w-8 h-5 rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.8), transparent)',
            filter: 'blur(4px)',
          }}
          aria-hidden="true"
        />

        {/* Person initial */}
        <span className="text-3xl font-bold text-white/90 select-none z-10 drop-shadow-lg">
          {personName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Tooltip label below orb */}
      <div
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap
                   text-xs text-memory-text-muted text-center pointer-events-none select-none"
      >
        <span className="font-semibold text-memory-purple-light">{personName}</span>
        <span className="text-memory-text-muted">'s Memory Room</span>
      </div>
    </div>
  )
}
