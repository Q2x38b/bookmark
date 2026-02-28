export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        <path
          d="M4 4h6v6H4V4Z"
          fill="currentColor"
          fillOpacity="0.8"
        />
        <path
          d="M14 4h6v6h-6V4Z"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          d="M4 14h6v6H4v-6Z"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path
          d="M14 14h6v6h-6v-6Z"
          fill="currentColor"
          fillOpacity="0.6"
        />
      </svg>
      <span className="font-semibold text-lg tracking-tight">Stash</span>
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
      className={`text-foreground ${className}`}
    >
      <path
        d="M4 4h6v6H4V4Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M14 4h6v6h-6V4Z"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <path
        d="M4 14h6v6H4v-6Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M14 14h6v6h-6v-6Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  )
}
