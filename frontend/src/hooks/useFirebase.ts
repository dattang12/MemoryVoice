import { useState, useEffect, useCallback } from 'react'
import { db } from '@/services/firebase'
import type { FirebaseState } from '@/types'

// ============================================================
// useFirebase — Firebase connection state hook
// ============================================================

/**
 * Monitors Firebase/Firestore connection status.
 * Returns connection state and a manual re-check trigger.
 */
export function useFirebase(): FirebaseState & { retry: () => void } {
  const [state, setState] = useState<FirebaseState>({
    isConnected: false,
    isInitialized: false,
    error: undefined,
  })

  const checkConnection = useCallback(async (): Promise<void> => {
    try {
      // Firestore initializes lazily — verify by checking if db object exists
      if (!db) {
        setState({
          isConnected: false,
          isInitialized: false,
          error: 'Firestore not initialized',
        })
        return
      }

      // Check if required env vars are present
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
      ]

      const missingVars = requiredVars.filter(
        (v) => !import.meta.env[v]
      )

      if (missingVars.length > 0) {
        setState({
          isConnected: false,
          isInitialized: false,
          error: `Missing Firebase config: ${missingVars.join(', ')}`,
        })
        return
      }

      setState({
        isConnected: true,
        isInitialized: true,
        error: undefined,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Firebase connection failed'
      setState({
        isConnected: false,
        isInitialized: false,
        error: message,
      })
    }
  }, [])

  useEffect(() => {
    void checkConnection()
  }, [checkConnection])

  return {
    ...state,
    retry: () => void checkConnection(),
  }
}
