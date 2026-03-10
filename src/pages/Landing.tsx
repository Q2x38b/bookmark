import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Plus, Link as LinkIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"

const demoBookmarks = [
  {
    type: "link",
    icon: <LinkIcon className="h-4 w-4 text-muted-foreground" />,
    title: "GitHub Repository",
    meta: "github.com",
  },
  {
    type: "color",
    icon: (
      <div
        className="h-4 w-4 rounded"
        style={{ backgroundColor: "#8B5CF6" }}
      />
    ),
    title: "#8B5CF6",
    meta: "Color",
  },
  {
    type: "note",
    icon: <FileText className="h-4 w-4 text-muted-foreground" />,
    title: "Meeting notes from today...",
    meta: "Note",
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Logo size={28} />
        <Link to="/sign-in">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-center font-serif text-5xl font-normal leading-tight tracking-tight md:text-6xl"
        >
          Save your links, notes, and colors without the clutter.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-xl text-center text-lg text-muted-foreground"
        >
          One place for everything you want to remember. Links, text snippets, hex codes, and more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link to="/sign-up">
            <Button
              size="lg"
              className="mt-10 h-12 px-8 text-base bg-white text-black hover:bg-white/90"
            >
              Get started for free
            </Button>
          </Link>
        </motion.div>

        {/* Demo Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 w-full max-w-xl"
        >
          {/* Input */}
          <div className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#141414] px-4 py-3">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Insert a link, color, or just plain text...
            </span>
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="rounded bg-[#262626] px-1.5 py-0.5">⌘</kbd>
              <kbd className="rounded bg-[#262626] px-1.5 py-0.5">F</kbd>
            </div>
          </div>

          {/* Demo Bookmarks */}
          <div className="mt-3 space-y-1">
            {demoBookmarks.map((bookmark, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 rounded-lg border border-[#262626] bg-[#141414] px-4 py-3"
              >
                {bookmark.icon}
                <span className="flex-1 text-sm">{bookmark.title}</span>
                <span className="text-xs text-muted-foreground">
                  {bookmark.meta}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-6 text-center text-sm text-muted-foreground">
        <p>Built with care. Simple by design.</p>
      </footer>
    </div>
  )
}
