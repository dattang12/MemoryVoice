import { useState, useCallback, useRef, useEffect } from 'react'
import {
  initElevenLabsWidget,
  destroyElevenLabsWidget,
  onAgentStatusChange,
  attachWidgetListeners,
  buildMemoryContext,
  sendAgentContext,
} from '@/services/elevenlabs'
import type { VoiceAgentState, VoiceAgentStatus, PhotoMeta } from '@/types'

// ============================================================
// useVoiceAgent — ElevenLabs agent state management hook
// ============================================================

interface UseVoiceAgentOptions {
  agentId: string | undefined
  memoryId: string | undefined
  personName: string
  photos: PhotoMeta[]
  autoInit?: boolean
}

interface UseVoiceAgentReturn {
  agentState: VoiceAgentState
  initAgent: () => Promise<void>
  destroyAgent: () => void
  isReady: boolean
  isActive: boolean
  hasError: boolean
}

const INITIAL_AGENT_STATE: VoiceAgentState = {
  status: 'disconnected',
  isSpeaking: false,
  isListening: false,
  agentId: undefined,
  conversationId: undefined,
  lastTranscript: undefined,
  error: undefined,
}

function deriveActiveFlags(status: VoiceAgentStatus): {
  isSpeaking: boolean
  isListening: boolean
} {
  return {
    isSpeaking: status === 'speaking',
    isListening: status === 'listening',
  }
}

/**
 * Manages ElevenLabs Conversational AI agent lifecycle.
 * Handles widget init, status events, and cleanup.
 */
export function useVoiceAgent({
  agentId,
  memoryId,
  personName,
  photos,
  autoInit = false,
}: UseVoiceAgentOptions): UseVoiceAgentReturn {
  const [agentState, setAgentState] = useState<VoiceAgentState>({
    ...INITIAL_AGENT_STATE,
    agentId,
  })

  const isInitializedRef = useRef(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Handle agent status changes from ElevenLabs widget events
  const handleStatusChange = useCallback(
    (status: VoiceAgentStatus): void => {
      setAgentState((prev) => ({
        ...prev,
        status,
        ...deriveActiveFlags(status),
        error: status === 'error' ? 'Connection to voice agent failed' : undefined,
      }))
    },
    []
  )

  const initAgent = useCallback(async (): Promise<void> => {
    if (!agentId) {
      setAgentState((prev) => ({
        ...prev,
        error: 'No agent ID configured for this memory',
        status: 'error',
        isSpeaking: false,
        isListening: false,
      }))
      return
    }

    try {
      setAgentState((prev) => ({
        ...prev,
        status: 'connecting',
        error: undefined,
        isSpeaking: false,
        isListening: false,
      }))

      // Subscribe to status and attach listeners BEFORE widget init
      // to avoid missing the call_started event on fast connections.
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      unsubscribeRef.current = onAgentStatusChange(handleStatusChange)
      attachWidgetListeners()

      await initElevenLabsWidget({ agentId })

      // Prime the agent with memory context
      if (photos.length > 0) {
        const eras = [...new Set(photos.map((p) => p.era))]
        const sampleCaptions = photos.slice(0, 8).map((p) => p.caption).filter(Boolean)
        const context = buildMemoryContext({
          personName,
          photoCount: photos.length,
          eras,
          sampleCaptions,
        })
        // Delay to let widget fully initialize and WebRTC handshake complete
        setTimeout(() => sendAgentContext(context), 3000)
      }

      isInitializedRef.current = true

      setAgentState((prev) => ({
        ...prev,
        status: 'connected',
        agentId,
        conversationId: `${agentId}-${memoryId ?? 'unknown'}-${Date.now()}`,
      }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize voice agent'
      setAgentState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
        isSpeaking: false,
        isListening: false,
      }))
    }
  }, [agentId, memoryId, personName, photos, handleStatusChange])

  const destroyAgent = useCallback((): void => {
    destroyElevenLabsWidget()

    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    isInitializedRef.current = false

    setAgentState({
      ...INITIAL_AGENT_STATE,
      agentId,
    })
  }, [agentId])

  // Auto-initialize when agentId becomes available
  useEffect(() => {
    if (autoInit && agentId && !isInitializedRef.current) {
      void initAgent()
    }
  }, [autoInit, agentId, initAgent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  const isReady =
    agentState.status === 'connected' ||
    agentState.status === 'speaking' ||
    agentState.status === 'listening'

  const isActive =
    agentState.status === 'speaking' || agentState.status === 'listening'

  const hasError = agentState.status === 'error'

  return {
    agentState,
    initAgent,
    destroyAgent,
    isReady,
    isActive,
    hasError,
  }
}
