import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  const clipId = `bookmark-clip-${Math.random().toString(36).substr(2, 9)}`

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
        <clipPath id={clipId}>
          <path d="M4 3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21.5C20 21.8466 19.7934 22.1598 19.4743 22.2966C19.1552 22.4334 18.7843 22.3683 18.5303 22.1303L12 16.0607L5.46967 22.1303C5.21575 22.3683 4.84479 22.4334 4.52567 22.2966C4.20656 22.1598 4 21.8466 4 21.5V3Z" />
        </clipPath>
      </defs>
      {/* 4-box grid pattern clipped to bookmark shape */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="4" y="2" width="7.5" height="9" fill="#fafafa" fillOpacity="0.9" />
        <rect x="12.5" y="2" width="7.5" height="9" fill="#fafafa" fillOpacity="0.6" />
        <rect x="4" y="12" width="7.5" height="11" fill="#fafafa" fillOpacity="0.4" />
        <rect x="12.5" y="12" width="7.5" height="11" fill="#fafafa" fillOpacity="0.7" />
      </g>
    </svg>
  )
}
