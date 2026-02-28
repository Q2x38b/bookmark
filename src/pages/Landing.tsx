import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your bookmarks,
            <br />
            <span className="text-muted-foreground">beautifully organized</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            A minimal bookmark manager for the modern web. Save links, colors, images, and notes in one place.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/sign-up">
              <Button size="lg" className="px-8">
                Start for Free
              </Button>
            </Link>
          </div>

          {/* Preview */}
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-8">
              <div className="bg-background rounded-md border border-border shadow-sm p-4 flex items-center gap-3">
                <span className="text-muted-foreground">+</span>
                <span className="text-muted-foreground">Insert a link, color, or just plain text...</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with care. Simple by design.
        </div>
      </footer>
    </div>
  )
}
