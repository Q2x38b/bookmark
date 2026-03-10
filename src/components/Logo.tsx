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
      {/* Back bookmark - offset */}
      <path
        d="M7 4C7 3.44772 7.44772 3 8 3H18C18.5523 3 19 3.44772 19 4V20.382C19 20.9314 18.3761 21.2515 17.9254 20.9254L13 17.5L8.07459 20.9254C7.62392 21.2515 7 20.9314 7 20.382V4Z"
        fill="#fafafa"
        fillOpacity="0.35"
      />
      {/* Front bookmark */}
      <path
        d="M5 3C5 2.44772 5.44772 2 6 2H16C16.5523 2 17 2.44772 17 3V21.382C17 21.9314 16.3761 22.2515 15.9254 21.9254L11 17.5L6.07459 21.9254C5.62392 22.2515 5 21.9314 5 21.382V3Z"
        fill="#fafafa"
      />
    </svg>
  )
}
