import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { LogoIcon } from '@/components/logo'
import { ArrowRight, Link2, FileText, Palette, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Link2,
    title: 'Links',
    description: 'Save and organize your favorite websites with auto-fetched favicons.',
  },
  {
    icon: FileText,
    title: 'Notes',
    description: 'Quick text snippets and ideas captured in seconds.',
  },
  {
    icon: Palette,
    title: 'Colors',
    description: 'Store hex codes from your design projects.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-6 w-6" />
            <span className="font-semibold text-lg">Pocket</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">
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

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-subtle" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }} />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 gap-1.5">
                <Sparkles className="h-3 w-3" />
                Now with URL schema support
              </Badge>

              {/* Main heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] animate-slide-up-fade">
                Save anything.
                <br />
                <span className="text-muted-foreground">Find it instantly.</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                A minimal bookmark manager for links, notes, colors, and images.
                Everything in one place.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                <Link to="/sign-up">
                  <Button size="lg" className="h-12 px-8 text-base gap-2 w-full sm:w-auto">
                    Start for Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Preview mockup */}
              <div className="relative max-w-xl mx-auto animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
                <Card className="overflow-hidden shadow-2xl shadow-black/10 border-border/60">
                  {/* Mock browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    </div>
                    <div className="flex-1 mx-8">
                      <div className="h-6 bg-muted rounded-md max-w-xs mx-auto flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">pocket.app</span>
                      </div>
                    </div>
                  </div>
                  {/* Mock content */}
                  <div className="p-4 space-y-2 bg-card">
                    <div className="bg-background rounded-lg border border-border p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">GitHub Repository</div>
                        <div className="text-xs text-muted-foreground">github.com</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-md bg-purple-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">#8B5CF6</div>
                        <div className="text-xs text-muted-foreground">Brand purple</div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-md bg-green-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Meeting notes</div>
                        <div className="text-xs text-muted-foreground">Review Q4 goals and...</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Simple, fast, and focused. No bloat, just the features you need.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 border-t border-border">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of users who organize their digital life with Pocket.
            </p>
            <Link to="/sign-up">
              <Button size="lg" className="h-12 px-8 text-base gap-2">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">Pocket</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Simple by design
          </p>
        </div>
      </footer>
    </div>
  )
}
