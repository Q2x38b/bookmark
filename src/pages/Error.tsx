import { Logo } from "@/components/Logo"

interface ErrorPageProps {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
}

export default function ErrorPage({
  title = "Something went wrong",
  message = "There was an issue displaying the content.",
  showRetry = true,
  onRetry,
}: ErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Error icon */}
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
            <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          {message}
          {" "}
          <a
            href="mailto:support@noira.app"
            className="text-blue-500 hover:underline"
          >
            Contact us
          </a>
          {" "}if the error persists.
        </p>

        {/* Retry button */}
        {showRetry && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Retry
          </button>
        )}

        {/* Logo footer */}
        <div className="mt-12 flex items-center gap-2 text-muted-foreground">
          <Logo size={20} />
          <span className="text-sm">Noira</span>
        </div>
      </div>
    </div>
  )
}

// Connection error variant
export function ConnectionError() {
  return (
    <ErrorPage
      title="Connection lost"
      message="Unable to connect to the server. Please check your internet connection."
    />
  )
}

// Generic error boundary fallback
export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary?: () => void }) {
  return (
    <ErrorPage
      title="Something went wrong"
      message={error.message || "An unexpected error occurred."}
      showRetry={!!resetErrorBoundary}
      onRetry={resetErrorBoundary}
    />
  )
}
