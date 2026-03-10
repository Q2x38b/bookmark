import * as React from "react"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onOpenChange, children, className }: BottomSheetProps) {
  const haptics = useHaptics()
  const prevOpen = React.useRef(open)

  // Trigger haptic when sheet opens
  React.useEffect(() => {
    if (open && !prevOpen.current) {
      haptics.rigid()
    }
    prevOpen.current = open
  }, [open, haptics])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if: fast flick down (velocity > 300) OR dragged more than 70px down
    // Otherwise snaps back to center
    if (info.velocity.y > 300 || info.offset.y > 70) {
      haptics.soft()
      onOpenChange(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-popover shadow-md ring-1 ring-foreground/10 safe-bottom",
              className
            )}
          >
            {/* Drag handle - larger touch target */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

interface BottomSheetHeaderProps {
  children: React.ReactNode
  className?: string
}

export function BottomSheetHeader({ children, className }: BottomSheetHeaderProps) {
  return (
    <div className={cn("px-4 pb-1.5", className)}>
      {children}
    </div>
  )
}

interface BottomSheetTitleProps {
  children: React.ReactNode
  className?: string
}

export function BottomSheetTitle({ children, className }: BottomSheetTitleProps) {
  return (
    <h3 className={cn("text-sm font-medium text-foreground text-center", className)}>
      {children}
    </h3>
  )
}

interface BottomSheetContentProps {
  children: React.ReactNode
  className?: string
}

export function BottomSheetContent({ children, className }: BottomSheetContentProps) {
  return (
    <div className={cn("px-2 pb-3", className)}>
      {children}
    </div>
  )
}

interface BottomSheetItemProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
  className?: string
}

export function BottomSheetItem({
  children,
  onClick,
  variant = "default",
  disabled = false,
  className
}: BottomSheetItemProps) {
  const haptics = useHaptics()

  const handleClick = () => {
    if (variant === "destructive") {
      haptics.warning()
    } else {
      haptics.soft()
    }
    onClick?.()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors active:bg-accent/50 touch-target no-select",
        variant === "destructive"
          ? "text-destructive active:bg-destructive/10"
          : "text-foreground",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  )
}

interface BottomSheetSeparatorProps {
  className?: string
}

export function BottomSheetSeparator({ className }: BottomSheetSeparatorProps) {
  return (
    <div className={cn("h-px bg-border mx-2 my-1", className)} />
  )
}

interface BottomSheetGroupProps {
  children: React.ReactNode
  className?: string
  label?: string
}

export function BottomSheetGroup({ children, className, label }: BottomSheetGroupProps) {
  return (
    <div className={cn("rounded-xl bg-muted dark:bg-white/[0.08] overflow-hidden", className)}>
      {label && (
        <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
      )}
      {children}
    </div>
  )
}
