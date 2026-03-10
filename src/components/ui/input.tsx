import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, spellCheck = false, autoComplete = "off", ...props }, ref) => {
    return (
      <input
        type={type}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        className={cn(
          "flex h-9 w-full rounded-lg border border-border bg-input px-3 py-1 text-base sm:text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground outline-none focus:border-ring/50 focus:ring-1 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
