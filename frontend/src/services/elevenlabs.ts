import type {
  ElevenLabsWidgetConfig,
  VoiceAgentStatus,
  Memory,
} from '@/types'

// ============================================================
// ElevenLabs Conversational AI — Widget Service
// ============================================================

declare global {
  interface Window {
    ElevenLabsConvai?: {
      init: (config: { agentId: string }) => void
    }
  }

  // Custom HTML element type for the ElevenLabs widget
  interface HTMLElementTagNameMap {
    'elevenlabs-convai': ElevenLabsConvaiElement
  }
}

interface ElevenLabsConvaiElement extends HTMLElement {
  setAttribute(name: string, value: string): void
  getAttribute(name: string): string | null
}

type WidgetEventCallback = (event: CustomEvent) => void

interface WidgetEventMap {
  'elevenlabs-convai:call_started': WidgetEventCallback
  'elevenlabs-convai:call_ended': WidgetEventCallback
  'elevenlabs-convai:agent_speaking': WidgetEventCallback
  'elevenlabs-convai:user_speaking': WidgetEventCallback
}

// ============================================================
// Script Loading
// ============================================================

// Official ElevenLabs Conversational AI Web Component script.
// The widget registers the <elevenlabs-convai> custom element and
// dispatches custom events for call lifecycle management.
const ELEVENLABS_WIDGET_SRC =
  'https://elevenlabs.io/convai-widget/index.js'

let scriptLoaded = false
let scriptLoading: Promise<void> | null = null

/**
 * Inject the ElevenLabs widget script into <head> exactly once.
 * Subsequent calls return the same cached promise.
 */
export function loadElevenLabsWidget(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()

  if (scriptLoading) return scriptLoading

  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${ELEVENLABS_WIDGET_SRC}"]`
    )

    if (existing) {
      scriptLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = ELEVENLABS_WIDGET_SRC
    script.async = true
    script.type = 'text/javascript'

    script.addEventListener('load', () => {
      scriptLoaded = true
      resolve()
    })

    script.addEventListener('error', () => {
      scriptLoading = null
      reject(new Error('Failed to load ElevenLabs widget script'))
    })

    document.head.appendChild(script)
  })

  return scriptLoading
}

// ============================================================
// Widget Initialization
// ============================================================

let activeWidget: ElevenLabsConvaiElement | null = null

/**
 * Initialize the ElevenLabs Conversational AI widget.
 *
 * Creates an <elevenlabs-convai> custom element, appends it to
 * document.body, and configures it with the supplied agentId.
 * Any previously mounted widget is removed first.
 *
 * @param config - Agent ID and optional TTS / prompt overrides.
 * @returns The mounted custom element reference.
 */
export async function initElevenLabsWidget(
  config: ElevenLabsWidgetConfig
): Promise<ElevenLabsConvaiElement> {
  await loadElevenLabsWidget()

  // Remove existing widget if present
  destroyElevenLabsWidget()

  const widget = document.createElement(
    'elevenlabs-convai'
  ) as ElevenLabsConvaiElement
  widget.setAttribute('agent-id', config.agentId)

  if (config.overrides) {
    widget.setAttribute('override', JSON.stringify(config.overrides))
  }

  document.body.appendChild(widget)
  activeWidget = widget

  return widget
}

/**
 * Alias matching the interface contract required by useVoiceAgent and VoiceWidget.
 *
 * Calls initElevenLabsWidget with the agentId bound to the given DOM container.
 * The <elevenlabs-convai> element is appended to document.body (ElevenLabs
 * positions it as a fixed overlay), but the container element is used as the
 * logical anchor for React component lifecycle management.
 *
 * @param agentId - ElevenLabs agent_id from VITE_ELEVENLABS_AGENT_ID.
 * @param containerId - ID of the host container element (used for bookkeeping).
 */
export async function initializeVoiceWidget(
  agentId: string,
  _containerId: string
): Promise<void> {
  await initElevenLabsWidget({ agentId })
}

/**
 * Remove the ElevenLabs widget from the DOM and clear cached reference.
 */
export function destroyElevenLabsWidget(): void {
  if (activeWidget) {
    activeWidget.remove()
    activeWidget = null
  }

  // Belt-and-suspenders: remove any orphaned widget element
  const existing = document.querySelector('elevenlabs-convai')
  if (existing) existing.remove()
}

/**
 * Alias used by useVoiceAgent for cleanup on unmount.
 */
export function destroyVoiceWidget(): void {
  destroyElevenLabsWidget()
  _responseListeners.clear()
}

/**
 * Get a reference to the active widget element, or null if unmounted.
 */
export function getActiveWidget(): ElevenLabsConvaiElement | null {
  return activeWidget
}

// ============================================================
// Widget Event Listeners — Status Tracking
// ============================================================

type StatusChangeCallback = (status: VoiceAgentStatus) => void

const statusListeners: Set<StatusChangeCallback> = new Set()

function dispatchStatus(status: VoiceAgentStatus): void {
  statusListeners.forEach((cb) => cb(status))
}

/**
 * Attach status-tracking event listeners to the ElevenLabs widget.
 *
 * Call this once after initElevenLabsWidget resolves. The listeners
 * translate ElevenLabs CustomEvents into VoiceAgentStatus values and
 * broadcast them to all subscribers registered via onAgentStatusChange.
 */
export function attachWidgetListeners(): void {
  const handlers: Record<string, () => void> = {
    'elevenlabs-convai:call_started': () => dispatchStatus('connected'),
    'elevenlabs-convai:call_ended': () => dispatchStatus('disconnected'),
    'elevenlabs-convai:agent_speaking': () => dispatchStatus('speaking'),
    'elevenlabs-convai:user_speaking': () => dispatchStatus('listening'),
  }

  const events = Object.keys(handlers) as Array<keyof WidgetEventMap>
  events.forEach((event) => {
    const handler = handlers[event]
    if (handler) {
      window.addEventListener(event, handler as EventListener)
    }
  })
}

/**
 * Subscribe to agent status changes.
 *
 * @param callback - Called each time VoiceAgentStatus changes.
 * @returns Unsubscribe function — call in useEffect cleanup.
 */
export function onAgentStatusChange(
  callback: StatusChangeCallback
): () => void {
  statusListeners.add(callback)
  return () => {
    statusListeners.delete(callback)
  }
}

// ============================================================
// Agent Response Listeners
// ============================================================

/** Listeners notified when the agent produces response text. */
const _responseListeners = new Set<(text: string) => void>()

/**
 * Subscribe to agent text response events.
 *
 * ElevenLabs dispatches agent utterances via the
 * 'elevenlabs-convai:agent_response' custom event. This helper wires
 * listeners to that event and also exposes a clean pub/sub API.
 *
 * @param callback - Receives the agent's response text string.
 * @returns Unsubscribe function.
 */
export function onAgentResponse(
  callback: (text: string) => void
): () => void {
  _responseListeners.add(callback)

  // Also subscribe to the DOM event in case the widget fires it
  const domHandler = (event: Event): void => {
    const detail = (event as CustomEvent<{ text?: string; message?: string }>).detail
    const text = detail?.text ?? detail?.message ?? ''
    if (text) callback(text)
  }
  window.addEventListener('elevenlabs-convai:agent_response', domHandler)

  return () => {
    _responseListeners.delete(callback)
    window.removeEventListener('elevenlabs-convai:agent_response', domHandler)
  }
}

// ============================================================
// Agent Messaging — Photo Context
// ============================================================

/**
 * Send a photo memory as contextual grounding to the agent session.
 *
 * The ElevenLabs web widget does not support arbitrary mid-session context
 * injection via custom events. The correct approach is to reinitialize the
 * widget with the photo context embedded in the agent's opening `firstMessage`
 * override. This starts a fresh session focused on the selected photo.
 *
 * @param photoMemory - The Memory currently selected by the user.
 */
export async function sendPhotoContext(photoMemory: Memory): Promise<void> {
  const agentId = activeWidget?.getAttribute('agent-id')
  if (!agentId) {
    console.warn('[MemoryBridge] sendPhotoContext: no active widget or agent-id missing')
    return
  }

  const firstMessage = buildPhotoContextMessage(photoMemory)

  // Reinitialize the widget with the photo context as the agent's opening message.
  // This creates a fresh session where the agent opens with awareness of the photo.
  await initElevenLabsWidget({
    agentId,
    overrides: {
      agent: {
        firstMessage,
      },
    },
  })
}

/**
 * Send a generic context string to the ElevenLabs agent by priming the
 * agent's opening message override.
 *
 * Context is injected at session start via the `override.agent.firstMessage`
 * attribute — the ElevenLabs widget does not support mid-session context
 * injection via custom events.
 *
 * @param context - Raw context string to embed in the agent's first message.
 */
export function sendAgentContext(context: string): void {
  if (!activeWidget) {
    console.warn('[ElevenLabs] No active widget to send context to')
    return
  }

  // Set the override attribute so the NEXT session starts with this context.
  // This is a best-effort primer; it does not interrupt an active call.
  const currentOverride = activeWidget.getAttribute('override')
  let overrideObj: Record<string, unknown> = {}
  try {
    if (currentOverride) overrideObj = JSON.parse(currentOverride) as Record<string, unknown>
  } catch {
    // ignore malformed override
  }

  const agentOverride = (overrideObj.agent as Record<string, unknown> | undefined) ?? {}
  overrideObj.agent = { ...agentOverride, firstMessage: context }
  activeWidget.setAttribute('override', JSON.stringify(overrideObj))
}

// ============================================================
// Context Message Builders
// ============================================================

/**
 * Format a Memory object into a natural-language context string.
 *
 * The agent's system prompt instructs it to respond in first-person, so
 * the context message primes it with the specific photo being viewed.
 */
export function buildPhotoContextMessage(memory: Memory): string {
  const parts: string[] = [
    `[Photo context: The user is looking at a photo from ${memory.date}.`,
    `Caption: "${memory.caption}".`,
    `Era: ${memory.era}.`,
  ]

  parts.push(
    'Please respond in first person as if recalling this memory warmly and personally.]'
  )

  return parts.join(' ')
}

/**
 * Build a session-level context string from photo collection metadata.
 *
 * Used to prime the agent at session start with an overview of all
 * available memories before the user begins speaking.
 *
 * @param params - Person name, photo count, era list, and sample captions.
 * @returns Formatted context string for the agent.
 */
export function buildMemoryContext(params: {
  personName: string
  photoCount: number
  eras: string[]
  sampleCaptions: string[]
}): string {
  const { personName, photoCount, eras, sampleCaptions } = params

  const erasText = eras.join(', ')
  const captionsText = sampleCaptions
    .slice(0, 5)
    .map((c, i) => `${i + 1}. "${c}"`)
    .join('\n')

  return `
You are a compassionate memory companion for ${personName}.
You have access to ${photoCount} cherished photos spanning: ${erasText}.

Some of the memories include:
${captionsText}

Your role is to gently help ${personName} reminisce about these moments.
Speak warmly, use their name, and ask open-ended questions about specific photos.
If they seem confused, gently redirect with a comforting memory cue.
  `.trim()
}

// ============================================================
// Configuration Helpers
// ============================================================

/**
 * Read the agent ID from the Vite environment variable.
 *
 * Returns null if VITE_ELEVENLABS_AGENT_ID is unset or empty.
 * Components should call this to decide whether to render the widget
 * or show a configuration placeholder.
 */
export function getConfiguredAgentId(): string | null {
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID as
    | string
    | undefined
  return agentId && agentId.trim().length > 0 ? agentId.trim() : null
}
