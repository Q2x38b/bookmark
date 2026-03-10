import { useState, useEffect, useRef, useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Doc } from "../../../convex/_generated/dataModel"
import {
  Copy,
  Check,
  Globe,
  Loader2,
  Link,
  ExternalLink,
  QrCode,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  AlertTriangle,
  Lock,
  Download,
} from "lucide-react"
import { RoundedQRCode } from "@/components/ui/rounded-qrcode"
import { HexColorPicker } from "react-colorful"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Doc<"bookmarks"> | null
}

export function ShareModal({ open, onOpenChange, bookmark }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQrPopover, setShowQrPopover] = useState(false)
  const [qrColor, setQrColor] = useState("#000000")
  const inputRef = useRef<HTMLInputElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Keep track of last valid bookmark to allow exit animation
  const lastBookmarkRef = useRef<Doc<"bookmarks"> | null>(null)
  if (bookmark) {
    lastBookmarkRef.current = bookmark
  }
  const displayBookmark = bookmark || lastBookmarkRef.current

  // Form state
  const [slug, setSlug] = useState("")
  const [password, setPassword] = useState("")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>()
  const [isUnsafe, setIsUnsafe] = useState(false)
  const [slugError, setSlugError] = useState("")

  const createShare = useMutation(api.sharing.createShare)
  const updateShare = useMutation(api.sharing.updateShare)
  const share = useQuery(
    api.sharing.getShareByBookmark,
    displayBookmark ? { bookmarkId: displayBookmark._id } : "skip"
  )

  const slugAvailable = useQuery(
    api.sharing.checkSlugAvailability,
    slug && slug !== share?.slug ? { slug } : "skip"
  )

  // Populate form when share data loads
  useEffect(() => {
    if (share) {
      setSlug(share.slug || "")
      setPassword(share.password || "")
      setExpiresAt(share.expiresAt ? new Date(share.expiresAt) : undefined)
      setIsUnsafe(share.isUnsafe || false)
    }
  }, [share])

  // Check slug availability
  useEffect(() => {
    if (slug && slugAvailable === false && slug !== share?.slug) {
      setSlugError("This slug is already taken")
    } else {
      setSlugError("")
    }
  }, [slugAvailable, slug, share?.slug])

  const shareUrl = share?.effectiveShareId
    ? `${window.location.origin}/share/${share.effectiveShareId}`
    : null

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 1500)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowSettings(false)
      setShowQrPopover(false)
      setSlugError("")
    }
  }, [open])

  const handleCreateShare = async () => {
    if (!displayBookmark) return

    if (slug && slugError) return

    setIsCreating(true)
    try {
      await createShare({
        bookmarkId: displayBookmark._id,
        slug: slug || undefined,
        password: password || undefined,
        expiresAt: expiresAt?.getTime(),
        isUnsafe: isUnsafe || undefined,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!displayBookmark || !share) return

    if (slug && slugError) return

    setIsSaving(true)
    try {
      await updateShare({
        bookmarkId: displayBookmark._id,
        slug: slug || undefined,
        password: password || undefined,
        expiresAt: expiresAt?.getTime(),
        isUnsafe: isUnsafe || undefined,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
  }

  const handlePreview = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  const handleDownloadQr = useCallback(() => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector("svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = 512
      canvas.height = 512
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `qrcode-${share?.effectiveShareId || "share"}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }, [share?.effectiveShareId])

  const validateSlug = (value: string) => {
    // Only allow alphanumeric, hyphens, and underscores
    return /^[a-zA-Z0-9-_]*$/.test(value)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    if (validateSlug(value)) {
      setSlug(value)
    }
  }

  if (!displayBookmark) return null

  // share is undefined while loading, null if no share exists
  const isLoading = share === undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Collaborate</DialogTitle>
          {!isLoading && (
            <p className="text-pretty text-sm text-[#6b6b6b]">
              {shareUrl
                ? "Share this bookmark with anyone using the link below."
                : "Create a public link to share this bookmark with others."}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#6b6b6b]" />
            </div>
          ) : shareUrl ? (
            <>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-[#6b6b6b]" />
                  <span className="text-sm text-[#ebebeb]">Anyone with the link can view</span>
                </div>
                <Switch id="public-access" defaultChecked disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="share-link" className="sr-only">
                  Share Link
                </Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="share-link"
                    readOnly
                    value={shareUrl}
                    className="pe-9"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleCopy}
                          className="text-[#6b6b6b] hover:text-[#ebebeb] absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
                          aria-label={copied ? "Copied" : "Copy to clipboard"}
                          disabled={copied}
                          tabIndex={-1}
                        >
                          <div
                            className={cn(
                              "transition-[transform,opacity] duration-200 ease-out",
                              copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )}
                          >
                            <Check
                              className="text-emerald-400"
                              size={16}
                              aria-hidden="true"
                            />
                          </div>
                          <div
                            className={cn(
                              "absolute transition-[transform,opacity] duration-200 ease-out",
                              copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                            )}
                          >
                            <Copy size={16} aria-hidden="true" />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="px-2 py-1 text-xs">
                        {copied ? "Copied!" : "Copy to clipboard"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1 gap-2" onClick={handleCopy}>
                  <Link className="h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePreview}>
                  <ExternalLink className="h-4 w-4" />
                  Preview
                </Button>
                <Popover open={showQrPopover} onOpenChange={setShowQrPopover}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        ref={qrRef}
                        className="bg-white rounded-xl p-3 inline-flex"
                      >
                        <RoundedQRCode
                          value={shareUrl}
                          size={180}
                          level="M"
                          fgColor={qrColor}
                        />
                      </div>
                      <div className="flex items-center gap-3 w-full">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className="h-8 w-8 rounded-full border-2 border-white/[0.12] shrink-0 transition-transform hover:scale-105"
                              style={{ backgroundColor: qrColor }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <HexColorPicker
                              color={qrColor}
                              onChange={setQrColor}
                              style={{ width: "180px" }}
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={handleDownloadQr}
                        >
                          <Download className="h-4 w-4" />
                          Download QR Code
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Link Settings */}
              <div className="border border-white/[0.08] rounded-lg">
                <button
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-[#ebebeb] hover:bg-white/[0.04] transition-colors rounded-lg"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <span>Link Settings</span>
                  {showSettings ? (
                    <ChevronUp className="h-4 w-4 text-[#6b6b6b]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#6b6b6b]" />
                  )}
                </button>

                {showSettings && (
                  <div className="px-3 pb-3 space-y-4 border-t border-white/[0.08] pt-3">
                    {/* Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-sm font-medium">
                        Custom Slug
                      </Label>
                      <p className="text-xs text-[#6b6b6b]">
                        Set a custom URL ending for your shared link.
                      </p>
                      <div className="relative">
                        <Input
                          id="slug"
                          placeholder="my-custom-link"
                          value={slug}
                          onChange={handleSlugChange}
                          className={cn(slugError && "border-destructive")}
                        />
                        {slug && !slugError && slugAvailable && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {slugError && (
                        <p className="text-xs text-destructive">{slugError}</p>
                      )}
                    </div>

                    {/* Password Protection */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[#9b9b9b]" />
                        Password Protection
                      </Label>
                      <p className="text-xs text-[#6b6b6b]">
                        Require a password to access this short link.
                      </p>
                      <Input
                        id="password"
                        type="text"
                        placeholder="Leave empty to disable"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    {/* Expiration */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-[#9b9b9b]" />
                        Expiration
                      </Label>
                      <p className="text-xs text-[#6b6b6b]">
                        Set an expiration date for this link.
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !expiresAt && "text-[#6b6b6b]"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiresAt ? format(expiresAt, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={expiresAt}
                            onSelect={setExpiresAt}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            captionLayout="dropdown"
                            fromYear={new Date().getFullYear()}
                            toYear={new Date().getFullYear() + 5}
                          />
                          {expiresAt && (
                            <div className="p-3 border-t border-white/[0.08]">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => setExpiresAt(undefined)}
                              >
                                Clear date
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Mark as Unsafe */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#9b9b9b]" />
                          Mark as Unsafe
                        </Label>
                        <p className="text-xs text-[#6b6b6b]">
                          Show a warning page before redirecting. Visitors must confirm to continue.
                        </p>
                      </div>
                      <Switch
                        checked={isUnsafe}
                        onCheckedChange={setIsUnsafe}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSaveSettings}
                      disabled={isSaving || !!slugError}
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Settings
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                <Globe className="h-5 w-5 text-[#6b6b6b]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#ebebeb]">Public Link</p>
                  <p className="text-xs text-[#6b6b6b]">
                    Anyone with the link can view this bookmark
                  </p>
                </div>
              </div>

              {/* Settings for new share */}
              <div className="space-y-4">
                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="new-slug" className="text-sm font-medium">
                    Custom Slug (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-slug"
                      placeholder="my-custom-link"
                      value={slug}
                      onChange={handleSlugChange}
                      className={cn(slugError && "border-destructive")}
                    />
                    {slug && !slugError && slugAvailable && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {slugError && (
                    <p className="text-xs text-destructive">{slugError}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#9b9b9b]" />
                    Password Protection (Optional)
                  </Label>
                  <Input
                    id="new-password"
                    type="text"
                    placeholder="Leave empty to disable"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#9b9b9b]" />
                    Expiration (Optional)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expiresAt && "text-[#6b6b6b]"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiresAt ? format(expiresAt, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiresAt}
                        onSelect={setExpiresAt}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 5}
                      />
                      {expiresAt && (
                        <div className="p-3 border-t border-white/[0.08]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setExpiresAt(undefined)}
                          >
                            Clear date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Mark as Unsafe */}
                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[#9b9b9b]" />
                      Mark as Unsafe
                    </Label>
                    <p className="text-xs text-[#6b6b6b]">
                      Show a warning page before redirecting.
                    </p>
                  </div>
                  <Switch
                    checked={isUnsafe}
                    onCheckedChange={setIsUnsafe}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={isCreating || !!slugError}
                className="w-full gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                Create Share Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
