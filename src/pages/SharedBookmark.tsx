import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { motion } from "framer-motion"
import {
  Link as LinkIcon,
  FileText,
  Image,
  File,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Clock,
  Lock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export default function SharedBookmark() {
  const { shareId } = useParams<{ shareId: string }>()
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [enteredPassword, setEnteredPassword] = useState<string | null>(null)
  const [confirmedUnsafe, setConfirmedUnsafe] = useState(false)
  const viewCounted = useRef(false)

  // First query to check share status
  const bookmarkData = useQuery(
    api.sharing.getSharedBookmark,
    shareId ? { shareId } : "skip"
  )

  // Query for password-protected content
  const protectedBookmark = useQuery(
    api.sharing.getSharedBookmarkWithPassword,
    shareId && enteredPassword ? { shareId, password: enteredPassword } : "skip"
  )

  const incrementView = useMutation(api.sharing.incrementViewCount)

  // Determine the actual bookmark data to display
  const bookmark = enteredPassword ? protectedBookmark : bookmarkData

  // Increment view count when bookmark loads successfully
  useEffect(() => {
    if (shareId && bookmark && !viewCounted.current && !('requiresPassword' in bookmark) && !('expired' in bookmark) && !('isUnsafe' in bookmark && bookmark.isUnsafe && !confirmedUnsafe)) {
      viewCounted.current = true
      incrementView({ shareId })
    }
  }, [shareId, bookmark, confirmedUnsafe, incrementView])

  const handleCopy = async () => {
    const bm = enteredPassword ? protectedBookmark : bookmarkData
    if (!bm) return
    if ('requiresPassword' in bm || 'expired' in bm || 'invalidPassword' in bm) return

    let textToCopy = bm.content || bm.url || ""
    if (bm.fileUrl) {
      textToCopy = bm.fileUrl
    }

    if (!textToCopy) return
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpen = () => {
    const bm = enteredPassword ? protectedBookmark : bookmarkData
    if (!bm) return
    if ('requiresPassword' in bm || 'expired' in bm || 'invalidPassword' in bm) return

    const content = bm.content || bm.url
    if (bm.type === "link" && content) {
      window.open(content, "_blank")
    } else if (bm.fileUrl) {
      window.open(bm.fileUrl, "_blank")
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsSubmittingPassword(true)
    setPasswordError(false)
    setEnteredPassword(password)
  }

  // Check for invalid password
  useEffect(() => {
    if (protectedBookmark && 'invalidPassword' in protectedBookmark) {
      setPasswordError(true)
      setIsSubmittingPassword(false)
      setEnteredPassword(null)
    } else if (protectedBookmark && !('invalidPassword' in protectedBookmark)) {
      setIsSubmittingPassword(false)
    }
  }, [protectedBookmark])

  // Loading state
  if (bookmarkData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not found state
  if (bookmarkData === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a]">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-medium text-white">
            Bookmark not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This bookmark may have been deleted or the link is invalid.
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              Go to Noira
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Expired state
  if ('expired' in bookmarkData && bookmarkData.expired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-medium text-white">
            Link Expired
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This shared link has expired and is no longer accessible.
          </p>
          <Link to="/" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              Go to Noira
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Unsafe warning state
  if ('isUnsafe' in bookmarkData && bookmarkData.isUnsafe && !confirmedUnsafe && !('requiresPassword' in bookmarkData)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-medium text-white">
            Warning: Potentially Unsafe Content
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link has been marked as potentially unsafe by the person who shared it.
            Please proceed with caution.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go Back
              </Button>
            </Link>
            <Button
              onClick={() => setConfirmedUnsafe(true)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              I Understand, Continue
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Password required state
  if ('requiresPassword' in bookmarkData && bookmarkData.requiresPassword && !enteredPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-lg font-medium text-white">
                Password Protected
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the password to view this bookmark.
              </p>
              {bookmarkData.title && (
                <p className="mt-2 text-xs text-muted-foreground truncate">
                  "{bookmarkData.title}"
                </p>
              )}
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(false)
                  }}
                  className={cn(
                    "bg-[#0a0a0a] border-[#262626]",
                    passwordError && "border-red-500"
                  )}
                />
                {passwordError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Incorrect password
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmittingPassword || !password.trim()}
              >
                {isSubmittingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unlock"
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <span>Shared via</span>
              <Logo size={14} />
              <span>Noira</span>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading protected content
  if (enteredPassword && protectedBookmark === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Invalid password
  if (protectedBookmark && 'invalidPassword' in protectedBookmark) {
    // This is handled by the effect above, but return password form again
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-lg font-medium text-white">
                Password Protected
              </h1>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(false)
                  }}
                  className={cn(
                    "bg-[#0a0a0a] border-[#262626]",
                    passwordError && "border-red-500"
                  )}
                />
                {passwordError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Incorrect password
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={!password.trim()}>
                Unlock
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  // Show unsafe warning for protected content
  if (protectedBookmark && 'isUnsafe' in protectedBookmark && protectedBookmark.isUnsafe && !confirmedUnsafe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-medium text-white">
            Warning: Potentially Unsafe Content
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link has been marked as potentially unsafe. Please proceed with caution.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go Back
              </Button>
            </Link>
            <Button
              onClick={() => setConfirmedUnsafe(true)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              I Understand, Continue
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Get the final bookmark data
  const finalBookmark = enteredPassword ? protectedBookmark : bookmarkData

  if (!finalBookmark || 'requiresPassword' in finalBookmark || 'expired' in finalBookmark || 'invalidPassword' in finalBookmark) {
    return null
  }

  const getIcon = () => {
    const iconClass = "h-6 w-6 text-muted-foreground"
    switch (finalBookmark.type) {
      case "link":
        return finalBookmark.favicon ? (
          <img src={finalBookmark.favicon} alt="" className="h-6 w-6 rounded" />
        ) : (
          <LinkIcon className={iconClass} />
        )
      case "color":
        return (
          <div
            className="h-6 w-6 rounded-lg"
            style={{ backgroundColor: finalBookmark.content }}
          />
        )
      case "note":
        return <FileText className={iconClass} />
      case "image":
        return <Image className={iconClass} />
      case "file":
        return <File className={iconClass} />
      default:
        return <FileText className={iconClass} />
    }
  }

  const renderContent = () => {
    switch (finalBookmark.type) {
      case "link":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground break-all">
              {finalBookmark.content}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleOpen} className="flex-1 gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Link
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <div
                  className={cn(
                    "transition-[transform,opacity] duration-200 ease-out",
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  )}
                >
                  <Check className="h-4 w-4" />
                </div>
                <div
                  className={cn(
                    "absolute transition-[transform,opacity] duration-200 ease-out",
                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  )}
                >
                  <Copy className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </div>
        )

      case "color":
        return (
          <div className="space-y-4">
            <div
              className="h-32 w-full rounded-xl"
              style={{ backgroundColor: finalBookmark.content }}
            />
            <div className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] p-3">
              <code className="text-sm font-mono">{finalBookmark.content}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-2 h-8">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case "note":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{finalBookmark.content}</p>
            </div>
            <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Text
                </>
              )}
            </Button>
          </div>
        )

      case "image":
        return (
          <div className="space-y-4">
            {finalBookmark.fileUrl && (
              <div className="rounded-xl overflow-hidden border border-[#262626]">
                <img
                  src={finalBookmark.fileUrl}
                  alt={finalBookmark.title}
                  className="max-h-80 w-full object-contain bg-[#0a0a0a]"
                />
              </div>
            )}
            <div className="flex gap-2">
              {finalBookmark.fileUrl && (
                <Button onClick={handleOpen} className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Full Size
                </Button>
              )}
              <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      case "file":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1a1a1a]">
                <File className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {finalBookmark.metadata?.fileName || "File"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click to download
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {finalBookmark.fileUrl && (
                <Button onClick={handleOpen} className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button variant="outline" onClick={handleCopy} className="flex-1 gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy URL
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a1a1a]">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-medium text-white truncate">
                {finalBookmark.title}
              </h1>
              <p className="text-xs text-muted-foreground capitalize">
                {finalBookmark.type}
              </p>
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <span>Shared via</span>
            <Logo size={14} />
            <span>Noira</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
