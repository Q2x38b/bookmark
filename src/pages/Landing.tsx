import { Link } from "react-router-dom"
import { motion, useInView } from "framer-motion"
import { useState, useRef } from "react"
import { Plus, Link as LinkIcon, FileText, Folder, Search, Share2, Lock, Zap, Globe, ChevronDown, Bookmark, Palette, Image, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"

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

const features = [
  {
    icon: Folder,
    title: "Organized Groups",
    description: "Keep your bookmarks sorted in custom groups. Work, personal, projects — however you think.",
  },
  {
    icon: Search,
    title: "Instant Search",
    description: "Find anything in milliseconds. Search across all your bookmarks, notes, and files.",
  },
  {
    icon: Share2,
    title: "Shareable Links",
    description: "Share any bookmark with a beautiful link. Password protect or set expiration dates.",
  },
  {
    icon: Lock,
    title: "Private & Secure",
    description: "Your data stays yours. End-to-end encryption for sensitive content.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed. Everything syncs instantly across all your devices.",
  },
  {
    icon: Globe,
    title: "Access Anywhere",
    description: "Web, mobile, desktop. Your bookmarks follow you everywhere.",
  },
]

const faqs = [
  {
    question: "What is Noira?",
    answer: "Noira is a modern bookmark manager where you can save links, notes, colors, images, and files all in one place. It's designed to be fast, beautiful, and clutter-free.",
  },
  {
    question: "Is Noira free to use?",
    answer: "Yes! Noira is completely free to use. We believe in providing a great experience without paywalls or hidden fees.",
  },
  {
    question: "What can I save in Noira?",
    answer: "You can save links, text notes, hex color codes, images, and files. Everything is organized in groups and searchable instantly.",
  },
  {
    question: "Can I share my bookmarks?",
    answer: "Absolutely! You can create shareable links for any bookmark. Add password protection, set expiration dates, or make them public for anyone to view.",
  },
]

// Animated section wrapper - using transform string for hardware acceleration
function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, transform: "translateY(40px)" }}
      animate={isInView ? { opacity: 1, transform: "translateY(0)" } : { opacity: 0, transform: "translateY(40px)" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      className={cn(
        "rounded-xl border transition-colors",
        isOpen ? "border-[#333] bg-[#1a1a1a]" : "border-[#262626] bg-[#141414]"
      )}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-xs font-medium",
            isOpen ? "bg-[#8B5CF6] text-white" : "bg-[#262626] text-muted-foreground"
          )}>
            {isOpen ? "−" : "+"}
          </span>
          <span className="font-medium">{question}</span>
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-4 pl-14 text-sm text-muted-foreground">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  )
}

export default function Landing() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0a0a0a]/80 border-b border-transparent">
        <Logo size={28} />
        <div className="flex items-center gap-3">
          <Link to="/signin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
              Sign in
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-white text-black hover:bg-white/90">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2 rounded-full bg-[#1a1a1a] border border-[#262626] px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Now in public beta</span>
        </motion.div>

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
          className="flex items-center gap-4"
        >
          <Link to="/signup">
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

      {/* Bento Grid Features Section */}
      <section className="px-6 py-24 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif font-normal text-black leading-tight">
                  Everything you need,<br />nothing you don't.
                </h2>
              </div>
              <p className="max-w-md text-gray-600">
                Save anything, find it instantly, share it beautifully. No bloat, no learning curve, just your stuff — organized.
              </p>
            </div>
          </AnimatedSection>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Card - Save Everything */}
            <AnimatedSection className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-8 overflow-hidden" delay={0.1}>
              <div className="flex flex-col h-full">
                <h3 className="text-2xl font-semibold text-black mb-2">Save anything, instantly</h3>
                <p className="text-gray-600 mb-8">
                  Links, notes, colors, images, files — just paste or type and it's saved. Noira figures out the rest.
                </p>
                <div className="flex-1 flex items-end">
                  <div className="w-full space-y-2">
                    {[
                      { icon: <LinkIcon className="h-4 w-4" />, text: "https://figma.com/design/abc123", type: "Link" },
                      { icon: <div className="h-4 w-4 rounded bg-[#FF6B6B]" />, text: "#FF6B6B", type: "Color" },
                      { icon: <FileText className="h-4 w-4" />, text: "API key for production...", type: "Note" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <span className="text-gray-500">{item.icon}</span>
                        <span className="flex-1 text-sm text-gray-700 truncate">{item.text}</span>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Speed Card */}
            <AnimatedSection className="rounded-2xl border border-gray-200 bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] p-8 text-white" delay={0.2}>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="text-6xl font-bold mb-2">10x</div>
                  <div className="text-xl font-medium opacity-90">faster than traditional bookmarks</div>
                </div>
                <p className="text-white/70 mt-8">
                  Instant search. Zero load times. Your bookmarks, at the speed of thought.
                </p>
              </div>
            </AnimatedSection>

            {/* Organize Card */}
            <AnimatedSection className="rounded-2xl border border-gray-200 bg-white p-8" delay={0.3}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Folder className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">Smart Groups</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Create groups for work, personal, projects. Drag and drop to organize. Simple.
                </p>
                <div className="flex-1 flex items-end">
                  <div className="flex flex-wrap gap-2">
                    {["Design", "Development", "Research", "Personal"].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Share Card */}
            <AnimatedSection className="rounded-2xl border border-gray-200 bg-white p-8 relative overflow-hidden" delay={0.4}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">Beautiful Sharing</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Share any bookmark with a link. Add password protection or expiration dates.
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate">noira.im/share/abc123</span>
                </div>
              </div>
            </AnimatedSection>

            {/* Search Card */}
            <AnimatedSection className="rounded-2xl border border-gray-200 bg-black p-8 text-white" delay={0.5}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold">Instant Search</h3>
                </div>
                <p className="text-white/70 mb-6">
                  Find anything in milliseconds. Search across all your bookmarks, notes, and files.
                </p>
                <div className="flex-1 flex items-end">
                  <div className="w-full">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10">
                      <Search className="h-4 w-4 text-white/40" />
                      <span className="text-sm text-white/60">Search everything...</span>
                      <div className="ml-auto flex items-center gap-1">
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60">⌘</kbd>
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/60">K</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "10K+", label: "Bookmarks saved" },
                { value: "99.9%", label: "Uptime" },
                { value: "<50ms", label: "Search speed" },
                { value: "Free", label: "Forever" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-6 py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-normal mb-4">
              Built for how you actually work
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to save you time and keep you focused.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ transform: "translateY(-4px)" }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="group rounded-2xl border border-[#262626] bg-[#141414] p-6 transition-colors hover:border-[#333] hover:bg-[#1a1a1a]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#262626] mb-4 group-hover:bg-[#8B5CF6]/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-muted-foreground group-hover:text-[#8B5CF6] transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-[#141414] border border-[#262626] p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <AnimatedSection>
                <p className="text-xs font-medium tracking-widest text-[#8B5CF6] uppercase mb-4">
                  Frequently asked questions
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-normal mb-6">
                  We've got your questions covered
                </h2>
                <p className="text-muted-foreground">
                  If you don't find what you're looking for, reach out anytime. We respond fast. Email us at{" "}
                  <a href="mailto:support@noira.im" className="text-white hover:underline">
                    support@noira.im
                  </a>
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <FAQItem
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openFAQ === index}
                      onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    />
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl bg-white border border-gray-200 p-8 md:p-12 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection>
                <h2 className="text-3xl md:text-4xl font-serif font-normal text-black mb-4">
                  Start saving smarter today
                </h2>
                <p className="text-gray-600 mb-8">
                  Join thousands of users who've simplified their digital life. Free forever, no credit card required.
                </p>
                <Link to="/signup">
                  <Button size="lg" className="h-12 px-8 bg-black text-white hover:bg-black/90 gap-2">
                    Get started for free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="relative">
                  {/* Mock UI */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Logo size={20} />
                        <span className="text-xs text-gray-400">/</span>
                        <span className="text-sm font-medium text-gray-700">Design Assets</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                      </div>
                    </div>
                    {/* Search */}
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 mb-3">
                      <Search className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Search bookmarks...</span>
                    </div>
                    {/* Items */}
                    <div className="space-y-2">
                      {[
                        { icon: <Image className="h-3 w-3 text-gray-500" />, title: "Brand guidelines.pdf", meta: "File" },
                        { icon: <Palette className="h-3 w-3 text-gray-500" />, title: "#2563EB", meta: "Color" },
                        { icon: <LinkIcon className="h-3 w-3 text-gray-500" />, title: "Figma Design System", meta: "Link" },
                        { icon: <Bookmark className="h-3 w-3 text-gray-500" />, title: "Icon library reference", meta: "Note" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-white border border-gray-100 px-3 py-2">
                          {item.icon}
                          <span className="flex-1 text-xs text-gray-700 truncate">{item.title}</span>
                          <span className="text-[10px] text-gray-400">{item.meta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -z-10 -top-4 -right-4 h-32 w-32 rounded-full bg-[#8B5CF6]/10 blur-3xl" />
                  <div className="absolute -z-10 -bottom-4 -left-4 h-24 w-24 rounded-full bg-[#6366F1]/10 blur-2xl" />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Logo size={28} />
              <p className="mt-4 text-sm text-muted-foreground">
                Save your links, notes, and colors without the clutter.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Changelog"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                {["Privacy", "Terms", "Security"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Noira. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with care. Simple by design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
