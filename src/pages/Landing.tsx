import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/sign-in">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm" className="gap-2">
                Get Started
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Save anything.
              <br />
              <span className="text-muted-foreground">Find it instantly.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              A minimal bookmark manager for links, notes, colors, and images.
              Everything in one place.
            </p>

            {/* CTA */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <Link to="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base gap-2">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Preview mockup */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/10 overflow-hidden">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                  </div>
                  <div className="flex-1 mx-8">
                    <div className="h-6 bg-muted/50 rounded-md max-w-xs mx-auto" />
                  </div>
                </div>
                {/* Mock content */}
                <div className="p-4 space-y-2">
                  <div className="bg-background rounded-lg border border-border/50 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                      <div className="w-4 h-4 rounded bg-blue-500/40" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-32 mb-1.5" />
                      <div className="h-2 bg-muted/50 rounded w-48" />
                    </div>
                  </div>
                  <div className="bg-background rounded-lg border border-border/50 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-purple-500/30" />
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-24 mb-1.5" />
                      <div className="h-2 bg-muted/50 rounded w-16" />
                    </div>
                  </div>
                  <div className="bg-background rounded-lg border border-border/50 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-green-500/20 flex items-center justify-center text-xs">
                      <div className="w-4 h-4 rounded bg-green-500/40" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded w-40 mb-1.5" />
                      <div className="h-2 bg-muted/50 rounded w-56" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground/60">
          Simple by design
        </div>
      </footer>
    </div>
  )
}
