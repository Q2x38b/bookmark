import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      {/* Modern minimalist bookmark with subtle fold */}
      <path
        d="M5 3C5 2.44772 5.44772 2 6 2H18C18.5523 2 19 2.44772 19 3V21.382C19 21.9314 18.3761 22.2515 17.9254 21.9254L12 17.5L6.07459 21.9254C5.62392 22.2515 5 21.9314 5 21.382V3Z"
        fill="#fafafa"
      />
      {/* Corner fold accent */}
      <path
        d="M14 2H18C18.5523 2 19 2.44772 19 3V7L14 2Z"
        fill="#fafafa"
        fillOpacity="0.5"
      />
    </svg>
  )
}
