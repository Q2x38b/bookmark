import { useCallback, useMemo } from "react"

// Check if vibration is supported (only on mobile devices typically)
const isVibrationSupported = typeof navigator !== "undefined" && "vibrate" in navigator

// Haptic feedback patterns using native Vibration API
// Pattern format: [vibrate, pause, vibrate, pause, ...] in milliseconds
export const hapticPatterns = {
  // Success - satisfying double tap for completed actions
  success: [12, 60, 25],

  // Warning - attention-getting pulse
  warning: [35, 100, 35],

  // Error - rapid triple buzz for failures
  error: [25, 40, 25, 40, 35],

  // Soft - very light tap for subtle feedback (button taps, navigation)
  soft: [8],

  // Rigid - firm single tap (opening menus, important actions)
  rigid: [18],

  // Selection - quick tick for selecting/deselecting items
  selection: [10],

  // Nudge - swipe threshold feedback
  nudge: [18, 40, 12],

  // Buzz - longer vibration for long-press activation
  buzz: [60],
} as const

export type HapticPattern = keyof typeof hapticPatterns

export function useHaptics() {
  const isSupported = isVibrationSupported

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!isSupported) return false
    try {
      return navigator.vibrate(pattern)
    } catch {
      return false
    }
  }, [isSupported])

  const haptic = useCallback((pattern: HapticPattern) => {
    return vibrate([...hapticPatterns[pattern]])
  }, [vibrate])

  // Convenience methods for common actions
  const success = useCallback(() => haptic("success"), [haptic])
  const error = useCallback(() => haptic("error"), [haptic])
  const warning = useCallback(() => haptic("warning"), [haptic])
  const selection = useCallback(() => haptic("selection"), [haptic])
  const nudge = useCallback(() => haptic("nudge"), [haptic])
  const soft = useCallback(() => haptic("soft"), [haptic])
  const rigid = useCallback(() => haptic("rigid"), [haptic])
  const buzz = useCallback(() => haptic("buzz"), [haptic])

  return useMemo(() => ({
    vibrate,
    haptic,
    isSupported,
    // Convenience methods
    success,
    error,
    warning,
    selection,
    nudge,
    soft,
    rigid,
    buzz,
  }), [vibrate, haptic, isSupported, success, error, warning, selection, nudge, soft, rigid, buzz])
}
