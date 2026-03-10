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
      {/* Back bookmark - subtle offset */}
      <path
        d="M8 3.5C8 2.94772 8.44772 2.5 9 2.5H18C18.5523 2.5 19 2.94772 19 3.5V19.882C19 20.4314 18.3761 20.7515 17.9254 20.4254L13.5 17.25L9.07459 20.4254C8.62392 20.7515 8 20.4314 8 19.882V3.5Z"
        fill="#fafafa"
        fillOpacity="0.3"
      />
      {/* Front bookmark */}
      <path
        d="M5 4C5 3.44772 5.44772 3 6 3H15C15.5523 3 16 3.44772 16 4V21.382C16 21.9314 15.3761 22.2515 14.9254 21.9254L10.5 18.25L6.07459 21.9254C5.62392 22.2515 5 21.9314 5 21.382V4Z"
        fill="#fafafa"
      />
    </svg>
  )
}
