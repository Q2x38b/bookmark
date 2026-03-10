import { useCallback, useRef, useEffect } from "react"

interface Point {
  x: number
  y: number
}

interface SafeTriangleOptions {
  /** Delay in ms before checking if mouse left safe zone */
  delay?: number
  /** Extra padding around the popover for the safe zone */
  buffer?: number
}

/**
 * Hook that implements a "safe triangle" pattern for submenus/popovers.
 * This allows diagonal mouse movement from a trigger to a popover without
 * the popover closing prematurely.
 *
 * Based on the Amazon mega menu / Notion submenu pattern.
 */
export function useSafeTriangle(
  isOpen: boolean,
  onClose: () => void,
  options: SafeTriangleOptions = {}
) {
  const { delay = 100, buffer = 20 } = options

  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLElement | null>(null)
  const mousePositionRef = useRef<Point>({ x: 0, y: 0 })
  const entryPointRef = useRef<Point | null>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInsideRef = useRef(false)

  // Track mouse position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    if (isOpen) {
      document.addEventListener("mousemove", handleMouseMove)
      return () => document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isOpen])

  // Check if a point is inside a triangle defined by three points
  const isPointInTriangle = useCallback((p: Point, v1: Point, v2: Point, v3: Point): boolean => {
    const sign = (p1: Point, p2: Point, p3: Point) => {
      return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
    }

    const d1 = sign(p, v1, v2)
    const d2 = sign(p, v2, v3)
    const d3 = sign(p, v3, v1)

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0)
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0)

    return !(hasNeg && hasPos)
  }, [])

  // Check if mouse is in the safe zone (triangle from entry point to popover)
  const isInSafeZone = useCallback((): boolean => {
    if (!entryPointRef.current || !contentRef.current) return false

    const mousePos = mousePositionRef.current
    const contentRect = contentRef.current.getBoundingClientRect()

    // Create triangle vertices: entry point and two corners of the popover
    // We use the corners closest to creating a good "corridor"
    const entryPoint = entryPointRef.current

    // Determine which side the popover is on relative to the entry point
    const popoverCenterX = contentRect.left + contentRect.width / 2

    let corner1: Point, corner2: Point

    // If popover is to the right of entry point
    if (popoverCenterX > entryPoint.x) {
      corner1 = { x: contentRect.left - buffer, y: contentRect.top - buffer }
      corner2 = { x: contentRect.left - buffer, y: contentRect.bottom + buffer }
    } else {
      // Popover is to the left
      corner1 = { x: contentRect.right + buffer, y: contentRect.top - buffer }
      corner2 = { x: contentRect.right + buffer, y: contentRect.bottom + buffer }
    }

    // Also check if mouse is inside the popover itself
    const isInsidePopover =
      mousePos.x >= contentRect.left - buffer &&
      mousePos.x <= contentRect.right + buffer &&
      mousePos.y >= contentRect.top - buffer &&
      mousePos.y <= contentRect.bottom + buffer

    if (isInsidePopover) return true

    // Check if in the safe triangle
    return isPointInTriangle(mousePos, entryPoint, corner1, corner2)
  }, [buffer, isPointInTriangle])

  // Handle mouse leaving the trigger
  const handleTriggerMouseLeave = useCallback(() => {
    // Record entry point when leaving trigger
    entryPointRef.current = { ...mousePositionRef.current }
    isInsideRef.current = false

    // Start a delayed check
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    const checkAndClose = () => {
      if (!isInsideRef.current && !isInSafeZone()) {
        onClose()
      } else if (!isInsideRef.current) {
        // Still in safe zone, check again
        closeTimeoutRef.current = setTimeout(checkAndClose, delay)
      }
    }

    closeTimeoutRef.current = setTimeout(checkAndClose, delay)
  }, [delay, isInSafeZone, onClose])

  // Handle mouse entering the content
  const handleContentMouseEnter = useCallback(() => {
    isInsideRef.current = true
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  // Handle mouse leaving the content
  const handleContentMouseLeave = useCallback(() => {
    isInsideRef.current = false
    entryPointRef.current = { ...mousePositionRef.current }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    const checkAndClose = () => {
      if (!isInsideRef.current && !isInSafeZone()) {
        onClose()
      } else if (!isInsideRef.current) {
        closeTimeoutRef.current = setTimeout(checkAndClose, delay)
      }
    }

    closeTimeoutRef.current = setTimeout(checkAndClose, delay)
  }, [delay, isInSafeZone, onClose])

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      entryPointRef.current = null
      isInsideRef.current = false
    }
  }, [isOpen])

  // Set refs for trigger and content
  const setTriggerRef = useCallback((el: HTMLElement | null) => {
    triggerRef.current = el
  }, [])

  const setContentRef = useCallback((el: HTMLElement | null) => {
    contentRef.current = el
  }, [])

  return {
    triggerRef: setTriggerRef,
    contentRef: setContentRef,
    triggerProps: {
      onMouseLeave: handleTriggerMouseLeave,
    },
    contentProps: {
      onMouseEnter: handleContentMouseEnter,
      onMouseLeave: handleContentMouseLeave,
    },
  }
}
