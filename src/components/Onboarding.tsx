import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRight, Plus, Link, FileText, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"

const ONBOARDING_KEY = "noira_onboarding_completed"

// Mockup illustrations matching actual UI
const LinksMockup = () => (
  <div className="relative w-full h-36 bg-background rounded-lg overflow-hidden border border-border">
    {/* Input field mockup */}
    <div className="absolute top-2 left-2 right-2 flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
      <Plus className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">Paste a link...</span>
    </div>
    {/* Bookmark rows */}
    <div className="absolute bottom-2 left-2 right-2 space-y-1">
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">G</span>
        </div>
        <span className="text-[10px] text-foreground truncate flex-1">GitHub - Build software</span>
        <span className="text-[8px] text-muted-foreground">2m ago</span>
      </div>
      <div className="flex items-center gap-2 rounded-md hover:bg-muted/40 px-2 py-1.5">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-[6px] text-white font-bold">T</span>
        </div>
        <span className="text-[10px] text-foreground truncate flex-1">Twitter / X</span>
        <span className="text-[8px] text-muted-foreground">5m ago</span>
      </div>
    </div>
  </div>
)

const ColorsMockup = () => (
  <div className="relative w-full h-36 bg-background rounded-lg overflow-hidden border border-border">
    {/* Input field mockup */}
    <div className="absolute top-2 left-2 right-2 flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
      <Palette className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground font-mono">#FF5733</span>
      <div className="ml-auto w-3 h-3 rounded border border-border/50" style={{ backgroundColor: '#FF5733' }} />
    </div>
    {/* Color bookmark rows */}
    <div className="absolute bottom-2 left-2 right-2 space-y-1">
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
        <div className="w-4 h-4 rounded border border-border/50" style={{ backgroundColor: '#FF5733' }} />
        <span className="text-[10px] text-foreground font-mono">#FF5733</span>
        <span className="text-[8px] text-muted-foreground ml-auto">Coral</span>
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <div className="w-4 h-4 rounded border border-border/50" style={{ backgroundColor: '#3498DB' }} />
        <span className="text-[10px] text-foreground font-mono">#3498DB</span>
        <span className="text-[8px] text-muted-foreground ml-auto">Blue</span>
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <div className="w-4 h-4 rounded border border-border/50" style={{ backgroundColor: '#2ECC71' }} />
        <span className="text-[10px] text-foreground font-mono">#2ECC71</span>
        <span className="text-[8px] text-muted-foreground ml-auto">Green</span>
      </div>
    </div>
  </div>
)

const NotesMockup = () => (
  <div className="relative w-full h-36 bg-background rounded-lg overflow-hidden border border-border">
    {/* Input field mockup */}
    <div className="absolute top-2 left-2 right-2 flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
      <Plus className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">Remember to update docs...</span>
    </div>
    {/* Note bookmark rows */}
    <div className="absolute bottom-2 left-2 right-2 space-y-1">
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] text-foreground truncate flex-1">Meeting notes from standup</span>
        <span className="text-[8px] text-muted-foreground">1h ago</span>
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] text-foreground truncate flex-1">API endpoint ideas</span>
        <span className="text-[8px] text-muted-foreground">2h ago</span>
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] text-foreground truncate flex-1">Bug fix checklist</span>
        <span className="text-[8px] text-muted-foreground">1d ago</span>
      </div>
    </div>
  </div>
)

const ContextMenuMockup = () => (
  <div className="relative w-full h-36 bg-background rounded-lg overflow-hidden border border-border">
    {/* Background bookmark row */}
    <div className="absolute top-2 left-2 right-2 flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 opacity-60">
      <Link className="w-4 h-4 text-muted-foreground" />
      <span className="text-[10px] text-foreground truncate">Selected bookmark</span>
    </div>
    {/* Context menu */}
    <div className="absolute top-7 left-4 right-4 rounded-md border border-border bg-popover p-1 shadow-lg">
      <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-[10px]">
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <span className="text-popover-foreground">Copy</span>
        <span className="ml-auto text-[8px] text-muted-foreground">⌘C</span>
      </div>
      <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-[10px]">
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <span className="text-popover-foreground">Rename</span>
        <span className="ml-auto text-[8px] text-muted-foreground">⌘E</span>
      </div>
      <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] bg-accent">
        <div className="w-3 h-3 rounded-sm bg-primary/20" />
        <span className="text-accent-foreground">Share</span>
        <span className="ml-auto text-[8px] text-muted-foreground">⌘S</span>
      </div>
      <div className="-mx-1 my-1 h-px bg-border" />
      <div className="flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] text-destructive">
        <div className="w-3 h-3 rounded-sm bg-destructive/20" />
        <span>Delete</span>
        <span className="ml-auto text-[8px]">⌘⌫</span>
      </div>
    </div>
  </div>
)

const ShortcutsMockup = () => (
  <div className="relative w-full h-36 bg-background rounded-lg overflow-hidden border border-border p-3">
    {/* Keyboard shortcuts list */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">⌘</kbd>
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">K</kbd>
        </div>
        <span className="text-[10px] text-muted-foreground">Command bar</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">⌘</kbd>
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">C</kbd>
        </div>
        <span className="text-[10px] text-muted-foreground">Copy item</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">⌘</kbd>
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">E</kbd>
        </div>
        <span className="text-[10px] text-muted-foreground">Rename</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">⌘</kbd>
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-medium rounded border border-border bg-muted/50 text-muted-foreground">⌫</kbd>
        </div>
        <span className="text-[10px] text-muted-foreground">Delete</span>
      </div>
    </div>
  </div>
)

interface OnboardingTip {
  title: string
  description: string
  mockup: React.ReactNode
}

const tips: OnboardingTip[] = [
  {
    title: "Save any link instantly",
    description: "Paste a URL to create a bookmark with auto-fetched title and favicon.",
    mockup: <LinksMockup />,
  },
  {
    title: "Build your color palette",
    description: "Paste hex codes like #FF5733 to save colors for your projects.",
    mockup: <ColorsMockup />,
  },
  {
    title: "Capture quick thoughts",
    description: "Type anything else to create a note for ideas and reminders.",
    mockup: <NotesMockup />,
  },
  {
    title: "Right-click for actions",
    description: "Copy, rename, share publicly, or move items between groups.",
    mockup: <ContextMenuMockup />,
  },
  {
    title: "Keyboard shortcuts",
    description: "Use ⌘K for command bar, ⌘C copy, ⌘E rename, ⌘⌫ delete.",
    mockup: <ShortcutsMockup />,
  },
]

interface OnboardingProps {
  isNewUser?: boolean
}

// Global function to show onboarding
declare global {
  interface Window {
    showOnboarding: () => void
  }
}

export function Onboarding({ isNewUser = false }: OnboardingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [direction, setDirection] = useState(0)

  const showOnboarding = useCallback(() => {
    setCurrentTip(0)
    setDirection(0)
    setIsVisible(true)
  }, [])

  useEffect(() => {
    // Register global console command
    window.showOnboarding = showOnboarding
    console.log(
      "%c🚀 Noira",
      "font-size: 14px; font-weight: bold; color: #3b82f6;"
    )
    console.log(
      "%cRun %cshowOnboarding()%c to see the onboarding cards again.",
      "color: #a1a1aa;",
      "color: #22c55e; font-family: monospace; background: #1a1a1a; padding: 2px 6px; border-radius: 4px;",
      "color: #a1a1aa;"
    )

    return () => {
      delete (window as Partial<typeof window>).showOnboarding
    }
  }, [showOnboarding])

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed && isNewUser) {
      // Small delay before showing onboarding
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isNewUser])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(ONBOARDING_KEY, "true")
  }

  const handleNext = () => {
    if (currentTip < tips.length - 1) {
      setDirection(1)
      setCurrentTip(currentTip + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrevious = () => {
    if (currentTip > 0) {
      setDirection(-1)
      setCurrentTip(currentTip - 1)
    }
  }

  const handleDotClick = (index: number) => {
    setDirection(index > currentTip ? 1 : -1)
    setCurrentTip(index)
  }

  if (!isVisible) return null

  const tip = tips[currentTip]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 40 : -40,
      opacity: 0,
    }),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-4 left-4 z-50"
    >
      <div className="relative w-64 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Content with slide animation */}
        <div className="p-3 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentTip}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 35 },
                opacity: { duration: 0.15 },
              }}
            >
              {/* Mockup illustration */}
              <div className="relative mb-3">
                {tip.mockup}
                {/* Close button - top right of mockup */}
                <button
                  onClick={handleDismiss}
                  className="absolute -top-1 -right-1 z-10 p-1 rounded-full text-muted-foreground/40 hover:text-foreground transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Text content */}
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {tip.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tip.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Progress dots with morph animation */}
          <div className="flex items-center gap-1">
            {tips.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => handleDotClick(index)}
                className="relative h-1.5 rounded-full overflow-hidden"
                initial={false}
                animate={{
                  width: index === currentTip ? 20 : 6,
                  backgroundColor: index === currentTip ? "hsl(var(--foreground))" : "hsl(var(--muted))",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
                whileHover={{
                  backgroundColor: index === currentTip ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {index === currentTip && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5">
            {currentTip > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handlePrevious}
                >
                  Back
                </Button>
              </motion.div>
            )}
            <Button
              size="sm"
              className="h-7 px-3 text-xs gap-1"
              onClick={handleNext}
            >
              {currentTip < tips.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-3 w-3" />
                </>
              ) : (
                "Done"
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
