import { useWebHaptics } from "web-haptics/react"
import { useCallback, useMemo } from "react"

export function useHaptics() {
  const { trigger, isSupported } = useWebHaptics()

  // Success - satisfying double tap for completed actions
  const success = useCallback(() => {
    trigger([
      { duration: 30 },
      { delay: 60, duration: 40, intensity: 1 },
    ])
  }, [trigger])

  // Warning - attention-getting pulse
  const warning = useCallback(() => {
    trigger([
      { duration: 40, intensity: 0.8 },
      { delay: 100, duration: 40, intensity: 0.6 },
    ])
  }, [trigger])

  // Error - rapid triple buzz for failures
  const error = useCallback(() => {
    trigger([
      { duration: 40, intensity: 0.7 },
      { delay: 40, duration: 40, intensity: 0.7 },
      { delay: 40, duration: 40, intensity: 0.9 },
      { delay: 40, duration: 50, intensity: 0.6 },
    ])
  }, [trigger])

  // Soft - very light tap for subtle feedback (button taps, navigation)
  const soft = useCallback(() => {
    trigger([{ duration: 40 }])
  }, [trigger])

  // Rigid - firm single tap (opening menus, important actions)
  const rigid = useCallback(() => {
    trigger([{ duration: 10 }], { intensity: 1 })
  }, [trigger])

  // Selection - quick tick for selecting/deselecting items
  const selection = useCallback(() => {
    trigger([{ duration: 8 }], { intensity: 0.3 })
  }, [trigger])

  // Nudge - swipe threshold feedback
  const nudge = useCallback(() => {
    trigger([
      { duration: 80, intensity: 0.8 },
      { delay: 80, duration: 50, intensity: 0.3 },
    ])
  }, [trigger])

  // Buzz - longer vibration for long-press activation
  const buzz = useCallback(() => {
    trigger([{ duration: 1000 }], { intensity: 1 })
  }, [trigger])

  return useMemo(() => ({
    trigger,
    isSupported,
    success,
    error,
    warning,
    selection,
    nudge,
    soft,
    rigid,
    buzz,
  }), [trigger, isSupported, success, error, warning, selection, nudge, soft, rigid, buzz])
}
