import { useWebHaptics } from "web-haptics/react"
import { useCallback } from "react"

// Haptic feedback presets for mobile interactions
export const hapticPatterns: Record<string, { duration: number; delay?: number; intensity?: number }[]> = {
  // Success - used for completed actions (copy, save, delete)
  success: [
    { duration: 30 },
    { delay: 60, duration: 40, intensity: 1 },
  ],

  // Warning - used for important notices
  warning: [
    { duration: 40, intensity: 0.8 },
    { delay: 100, duration: 40, intensity: 0.6 },
  ],

  // Error - used for failed actions
  error: [
    { duration: 40, intensity: 0.7 },
    { delay: 40, duration: 40, intensity: 0.7 },
    { delay: 40, duration: 40, intensity: 0.9 },
    { delay: 40, duration: 50, intensity: 0.6 },
  ],

  // Soft - used for subtle feedback (hover alternatives)
  soft: [
    { duration: 40 },
  ],

  // Rigid - used for firm tap feedback
  rigid: [
    { duration: 10 },
  ],

  // Selection - used when selecting/deselecting items
  selection: [
    { duration: 8 },
  ],

  // Nudge - used for swipe thresholds, drag feedback
  nudge: [
    { duration: 80, intensity: 0.8 },
    { delay: 80, duration: 50, intensity: 0.3 },
  ],

  // Buzz - used for long-press activation
  buzz: [
    { duration: 1000 },
  ],
}

export type HapticPattern = keyof typeof hapticPatterns

export function useHaptics() {
  const { trigger, isSupported } = useWebHaptics()

  const haptic = useCallback((pattern: HapticPattern) => {
    if (!isSupported) return

    const vibration = hapticPatterns[pattern]

    // Handle patterns that need intensity option
    if (pattern === "rigid") {
      trigger(vibration, { intensity: 1 })
    } else if (pattern === "selection") {
      trigger(vibration, { intensity: 0.3 })
    } else if (pattern === "buzz") {
      trigger(vibration, { intensity: 1 })
    } else {
      trigger(vibration)
    }
  }, [trigger, isSupported])

  // Convenience methods for common actions
  const success = useCallback(() => haptic("success"), [haptic])
  const error = useCallback(() => haptic("error"), [haptic])
  const warning = useCallback(() => haptic("warning"), [haptic])
  const selection = useCallback(() => haptic("selection"), [haptic])
  const nudge = useCallback(() => haptic("nudge"), [haptic])
  const soft = useCallback(() => haptic("soft"), [haptic])
  const rigid = useCallback(() => haptic("rigid"), [haptic])

  return {
    trigger,
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
  }
}
