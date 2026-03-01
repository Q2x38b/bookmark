export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon className="h-6 w-6" />
    </div>
  )
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" className="fill-foreground" />
      <rect x="5" y="5" width="5" height="5" rx="1" className="fill-background" fillOpacity="0.95" />
      <rect x="14" y="5" width="5" height="5" rx="1" className="fill-background" fillOpacity="0.65" />
      <rect x="5" y="14" width="5" height="5" rx="1" className="fill-background" fillOpacity="0.45" />
      <rect x="14" y="14" width="5" height="5" rx="1" className="fill-background" fillOpacity="0.75" />
    </svg>
  )
}
