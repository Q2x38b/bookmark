import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

// Provider with skipDelayDuration for instant subsequent tooltips
const TooltipProvider = ({ children, ...props }: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider skipDelayDuration={300} delayDuration={400} {...props}>
    {children}
  </TooltipPrimitive.Provider>
)

const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Hide on touch devices (mobile)
        "hidden sm:block pointer-coarse:hidden",
        // Emil Kowalski style - scale from 0.97, not 0.95, with origin from trigger
        "z-[100] overflow-hidden rounded-lg bg-popover ring-1 ring-foreground/10 px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-md",
        "origin-[var(--radix-tooltip-content-transform-origin)]",
        "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
        "data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=delayed-open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]",
        // Instant animation for subsequent tooltips (data-[state=instant-open])
        "data-[state=instant-open]:animate-none data-[state=instant-open]:opacity-100",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
