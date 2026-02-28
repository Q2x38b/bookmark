import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <LogoIcon className="h-16 w-16 text-muted-foreground/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-foreground">404</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
