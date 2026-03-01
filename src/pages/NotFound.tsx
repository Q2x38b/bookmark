import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <LogoIcon className="h-10 w-10 opacity-50" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
