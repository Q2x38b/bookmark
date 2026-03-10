import { Link } from "react-router-dom"
import { Logo } from "@/components/Logo"

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-lg border border-muted-foreground/30 flex items-center justify-center mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Unauthorized
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please sign in to continue.
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            Go home
          </Link>
        </div>

        {/* Logo footer */}
        <div className="mt-12 flex items-center gap-2 text-muted-foreground">
          <Logo size={20} />
          <span className="text-sm">Noira</span>
        </div>
      </div>
    </div>
  )
}
