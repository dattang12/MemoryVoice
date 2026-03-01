import { useId, useEffect, useRef } from 'react'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { sendPhotoContext, getConfiguredAgentId } from '@/services/elevenlabs'
import type { Memory, PhotoMeta, VoiceAgentStatus } from '@/types'

// ============================================================
// VoiceWidget — ElevenLabs Conversational AI (editorial style)
// ============================================================

interface VoiceWidgetProps {
  agentId?: string
  memoryId?: string
  personName?: string
  photos?: PhotoMeta[]
  activeMemory?: Memory | null
  className?: string
}

// ---------------------------------------------------------------------------
// MicButton — newspaper "broadcast" style microphone button
// ---------------------------------------------------------------------------

function MicButton({
  status,
  isSpeaking,
  isListening,
  onClick,
}: {
  status: VoiceAgentStatus
  isSpeaking: boolean
  isListening: boolean
  onClick: () => void
}) {
  const isConnecting = status === 'connecting'
  const isError = status === 'error'
  const isActive = isSpeaking || isListening

  const ariaLabel =
    status === 'connected' ? 'Voice agent ready — click to speak' :
    status === 'speaking' ? 'Agent is speaking' :
    status === 'listening' ? 'Listening to you' :
    status === 'connecting' ? 'Connecting…' :
    status === 'error' ? 'Voice agent error — click to retry' :
    'Activate voice companion'

  let bg = 'bg-memory-text'
  let border = 'border-memory-text'
  if (isError) { bg = 'bg-memory-accent'; border = 'border-memory-accent' }
  else if (isSpeaking) { bg = 'bg-memory-purple'; border = 'border-memory-purple' }
  else if (isListening) { bg = 'bg-emerald-700'; border = 'border-emerald-700' }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative flex items-center justify-center w-14 h-14 border-2 ${border} ${bg}
        transition-all duration-300 hover:scale-105 active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-memory-accent focus-visible:ring-offset-2
        ${isActive ? 'shadow-lg' : ''}`}
      style={{ borderRadius: '2px' }}
    >
      {/* Connecting spinner */}
      {isConnecting && (
        <span
          aria-hidden="true"
          className="absolute inset-0 border-2 border-t-white border-white/10 animate-spin"
          style={{ borderRadius: '2px' }}
        />
      )}
      {/* Active ping */}
      {isActive && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-ping opacity-20 ${isSpeaking ? 'bg-memory-purple' : 'bg-emerald-500'}`}
          style={{ borderRadius: '2px' }}
        />
      )}
      {/* Mic icon */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Status line — editorial caption style
// ---------------------------------------------------------------------------

function StatusLine({ status }: { status: VoiceAgentStatus }) {
  const config: Record<VoiceAgentStatus, { label: string; color: string }> = {
    disconnected: { label: 'Tap to connect', color: 'text-memory-text-muted' },
    connecting: { label: 'Connecting…', color: 'text-amber-600' },
    connected: { label: 'Ready to listen', color: 'text-emerald-600' },
    speaking: { label: 'Speaking…', color: 'text-memory-purple' },
    listening: { label: 'Listening…', color: 'text-emerald-600' },
    error: { label: 'Connection error', color: 'text-memory-accent' },
  }
  const { label, color } = config[status]
  const isActive = status === 'speaking' || status === 'listening'

  return (
    <span className={`flex items-center gap-1.5 text-xs font-body font-bold uppercase tracking-wider ${color}`}>
      {isActive && (
        <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'speaking' ? 'bg-memory-purple' : 'bg-emerald-500'}`} />
      )}
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Active photo context — newspaper caption style
// ---------------------------------------------------------------------------

function PhotoContextBar({ memory }: { memory: Memory }) {
  return (
    <div
      className="w-full flex items-start gap-3 p-3 bg-memory-bg border border-[rgba(0,0,0,0.1)] border-l-4 border-l-memory-accent"
      role="status"
      aria-live="polite"
    >
      {memory.photoUrl && (
        <img
          src={memory.photoUrl}
          alt=""
          aria-hidden="true"
          className="w-10 h-10 object-cover flex-shrink-0 border border-[rgba(0,0,0,0.1)]"
          style={{ borderRadius: '2px' }}
        />
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-memory-text-muted font-body mb-0.5">
          Asking about
        </p>
        <p className="text-xs font-heading font-bold text-memory-text truncate">
          {memory.caption}
        </p>
        {memory.date && (
          <p className="text-[10px] text-memory-text-muted font-body italic">{memory.date}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// No agent ID placeholder
// ---------------------------------------------------------------------------

function ConfigPlaceholder() {
  return (
    <div className="w-full flex flex-col items-center gap-4 p-6 border-2 border-dashed border-[rgba(0,0,0,0.15)] text-center">
      <div className="w-14 h-14 flex items-center justify-center border-2 border-dashed border-[rgba(0,0,0,0.15)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-memory-text-muted/50">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
      <div>
        <p className="text-memory-text-muted text-sm font-body font-semibold mb-1">
          Voice agent unavailable
        </p>
        <p className="text-memory-text-muted text-xs leading-relaxed max-w-[220px] font-body">
          Set{' '}
          <code className="font-mono bg-memory-bg-secondary px-1 text-memory-text">
            VITE_ELEVENLABS_AGENT_ID
          </code>{' '}
          in your <code className="font-mono bg-memory-bg-secondary px-1 text-memory-text">.env</code> file.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main VoiceWidget
// ---------------------------------------------------------------------------

export function VoiceWidget({
  agentId: agentIdProp,
  memoryId,
  personName = 'your loved one',
  photos = [],
  activeMemory,
  className = '',
}: VoiceWidgetProps) {
  const containerId = useId()
  const sentMemoryIdRef = useRef<string | null>(null)

  const resolvedAgentId = agentIdProp ?? getConfiguredAgentId() ?? undefined

  const { agentState, initAgent, destroyAgent, isReady, isActive, hasError } =
    useVoiceAgent({
      agentId: resolvedAgentId,
      memoryId,
      personName,
      photos,
      autoInit: false,
    })

  useEffect(() => {
    if (activeMemory && isReady && activeMemory.id !== sentMemoryIdRef.current) {
      sentMemoryIdRef.current = activeMemory.id
      void sendPhotoContext(activeMemory)
    }
  }, [activeMemory, isReady])

  useEffect(() => { return () => { destroyAgent() } }, [destroyAgent])

  if (!resolvedAgentId) {
    return (
      <div id={containerId} className={['w-full', className].filter(Boolean).join(' ')}>
        <ConfigPlaceholder />
      </div>
    )
  }

  const handleClick = (): void => {
    if (hasError || agentState.status === 'disconnected') void initAgent()
  }

  return (
    <div
      id={containerId}
      className={['glass-card overflow-hidden w-full border-t-4 border-t-memory-purple select-none', className]
        .filter(Boolean).join(' ')}
    >
      {/* Header strip */}
      <div className="bg-memory-purple px-3 py-1.5 flex items-center justify-between">
        <span className="text-white text-xs font-bold uppercase tracking-widest font-body">
          Voice
        </span>
        <span className="text-white/60 text-xs font-body italic truncate ml-1">{personName}</span>
      </div>

      <div className="p-3 flex flex-col items-center gap-3">
        {/* Mic button */}
        <MicButton
          status={agentState.status}
          isSpeaking={agentState.isSpeaking}
          isListening={agentState.isListening}
          onClick={handleClick}
        />

        {/* Status */}
        <StatusLine status={agentState.status} />

        {/* Active photo context */}
        {activeMemory && isReady && <PhotoContextBar memory={activeMemory} />}

        {/* Error */}
        {hasError && agentState.error && (
          <p role="alert" className="text-xs text-memory-accent text-center max-w-[240px] leading-relaxed font-body border-l-4 border-l-memory-accent pl-3">
            {agentState.error}
          </p>
        )}

        {/* Disconnected hint */}
        {agentState.status === 'disconnected' && (
          <p className="text-[9px] text-memory-text-muted text-center font-body">
            Tap to connect
          </p>
        )}

        {/* Hidden ElevenLabs anchor */}
        <div data-elevenlabs-anchor="true" aria-hidden="true" className="hidden" />
      </div>
    </div>
  )
}

export default VoiceWidget
