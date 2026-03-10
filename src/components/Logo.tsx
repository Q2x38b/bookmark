import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  const id = `logo-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d="M4 3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21.5C20 21.8466 19.7934 22.1598 19.4743 22.2966C19.1552 22.4334 18.7843 22.3683 18.5303 22.1303L12 16.0607L5.46967 22.1303C5.21575 22.3683 4.84479 22.4334 4.52567 22.2966C4.20656 22.1598 4 21.8466 4 21.5V3Z" />
        </clipPath>
        {/* Horizontal gradient - top row */}
        <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fafafa" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fafafa" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fafafa" stopOpacity="0.6" />
        </linearGradient>
        {/* Horizontal gradient - bottom row */}
        <linearGradient id={`${id}-bottom`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fafafa" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#fafafa" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fafafa" stopOpacity="0.7" />
        </linearGradient>
        {/* Vertical gradient to blend top and bottom */}
        <linearGradient id={`${id}-vertical`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fafafa" stopOpacity="0" />
          <stop offset="40%" stopColor="#fafafa" stopOpacity="0" />
          <stop offset="60%" stopColor="#fafafa" stopOpacity="0" />
          <stop offset="100%" stopColor="#fafafa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {/* Top half with horizontal gradient */}
        <rect x="4" y="2" width="16" height="10" fill={`url(#${id}-top)`} />
        {/* Bottom half with horizontal gradient */}
        <rect x="4" y="12" width="16" height="12" fill={`url(#${id}-bottom)`} />
        {/* Soft blend in the middle */}
        <rect x="4" y="9" width="16" height="6" fill={`url(#${id}-top)`} opacity="0.3" />
        <rect x="4" y="9" width="16" height="6" fill={`url(#${id}-bottom)`} opacity="0.3" />
      </g>
    </svg>
  )
}
