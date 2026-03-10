import { useState, useEffect, useRef, useCallback, cloneElement, isValidElement } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Doc } from "../../../convex/_generated/dataModel"
import { useSafeTriangle } from "@/hooks/useSafeTriangle"
import { useHaptics } from "@/hooks/useHaptics"
import {
  Copy,
  Check,
  Globe,
  Loader2,
  Link,
  ExternalLink,
  QrCode,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Lock,
  Download,
  LinkIcon,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SharePopoverProps {
  bookmark: Doc<"bookmarks">
  children: React.ReactNode
}

export function SharePopover({ bookmark, children }: SharePopoverProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [qrColor, setQrColor] = useState("#000000")
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const haptics = useHaptics()

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
    open ? { bookmarkId: bookmark._id } : "skip"
  )

  // Track initial load to prevent flashing create form
  useEffect(() => {
    if (!open) {
      setHasInitiallyLoaded(false)
    } else if (share !== undefined) {
      setHasInitiallyLoaded(true)
    }
  }, [open, share])

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

  // Reset state when popover closes
  useEffect(() => {
    if (!open) {
      setShowQr(false)
      setShowSettings(false)
      setSlugError("")
      // Reset form if no share exists
      if (!share) {
        setSlug("")
        setPassword("")
        setExpiresAt(undefined)
        setIsUnsafe(false)
      }
    }
  }, [open, share])

  const handleCreateShare = async () => {
    if (slug && slugError) return

    setIsCreating(true)
    try {
      await createShare({
        bookmarkId: bookmark._id,
        slug: slug || undefined,
        password: password || undefined,
        expiresAt: expiresAt?.getTime(),
        isUnsafe: isUnsafe || undefined,
      })
      haptics.success()
      toast.success("Share link created")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!share) return
    if (slug && slugError) return

    setIsSaving(true)
    try {
      await updateShare({
        bookmarkId: bookmark._id,
        slug: slug || undefined,
        password: password || undefined,
        expiresAt: expiresAt?.getTime(),
        isUnsafe: isUnsafe || undefined,
      })
      haptics.success()
      toast.success("Settings saved")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    haptics.success()
    setCopied(true)
    toast.success("Link copied")
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
    return /^[a-zA-Z0-9-_]*$/.test(value)
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    if (validateSlug(value)) {
      setSlug(value)
    }
  }

  const isLoading = open && !hasInitiallyLoaded

  // Safe triangle for diagonal mouse movement
  const { triggerRef, contentRef, triggerProps, contentProps } = useSafeTriangle(
    open,
    () => setOpen(false),
    { delay: 80, buffer: 15 }
  )

  // Clone children to add ref and mouse handlers
  const triggerElement = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement>; onMouseLeave?: () => void }>, {
        ref: triggerRef,
        onMouseLeave: triggerProps.onMouseLeave,
      })
    : children

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerElement}
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        onMouseEnter={contentProps.onMouseEnter}
        onMouseLeave={contentProps.onMouseLeave}
        className="w-72 p-0"
        align="start"
        side="right"
        sideOffset={8}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#6b6b6b]" />
          </div>
        ) : shareUrl ? (
          <div className="p-1">
            {/* Share URL Row */}
            <div
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer hover:bg-white/[0.08] transition-colors"
              onClick={handleCopy}
            >
              <Globe className="h-4 w-4 text-[#9b9b9b]" />
              <span className="flex-1 text-[#ebebeb] truncate text-[13px]">
                {shareUrl.replace(/^https?:\/\//, "")}
              </span>
              <div className="shrink-0">
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[#6b6b6b]" />
                )}
              </div>
            </div>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* Copy Link */}
            <button
              className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#ebebeb] hover:bg-white/[0.08] transition-colors text-[13px]"
              onClick={handleCopy}
            >
              <Link className="h-4 w-4 text-[#9b9b9b]" />
              <span className="flex-1 text-left">Copy link</span>
            </button>

            {/* Open in new tab */}
            <button
              className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#ebebeb] hover:bg-white/[0.08] transition-colors text-[13px]"
              onClick={() => window.open(shareUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 text-[#9b9b9b]" />
              <span className="flex-1 text-left">Open link</span>
            </button>

            {/* QR Code */}
            <Popover open={showQr} onOpenChange={setShowQr}>
              <PopoverTrigger asChild>
                <button
                  className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#ebebeb] hover:bg-white/[0.08] transition-colors text-[13px]"
                >
                  <QrCode className="h-4 w-4 text-[#9b9b9b]" />
                  <span className="flex-1 text-left">QR code</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#6b6b6b]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start" side="right">
                <div className="flex flex-col items-center gap-3">
                  <div
                    ref={qrRef}
                    className="bg-white rounded-xl p-3 inline-flex"
                  >
                    <RoundedQRCode
                      value={shareUrl}
                      size={160}
                      level="M"
                      fgColor={qrColor}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="h-7 w-7 rounded-full border-2 border-white/[0.12] shrink-0 transition-transform hover:scale-105"
                          style={{ backgroundColor: qrColor }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={qrColor}
                          onChange={setQrColor}
                          style={{ width: "160px" }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 h-7 text-xs"
                      onClick={handleDownloadQr}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-px bg-white/[0.08] my-1" />

            {/* Link Settings */}
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <button
                  className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[#ebebeb] hover:bg-white/[0.08] transition-colors text-[13px]"
                >
                  <LinkIcon className="h-4 w-4 text-[#9b9b9b]" />
                  <span className="flex-1 text-left">Link settings</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#6b6b6b]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start" side="right">
                <div className="space-y-3">
                  {/* Slug */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#9b9b9b]">Custom Slug</Label>
                    <div className="relative">
                      <Input
                        placeholder="my-custom-link"
                        value={slug}
                        onChange={handleSlugChange}
                        className={cn("h-8 text-xs", slugError && "border-destructive")}
                      />
                      {slug && !slugError && slugAvailable && (
                        <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    {slugError && (
                      <p className="text-[10px] text-destructive">{slugError}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                      <Lock className="h-3 w-3" />
                      Password
                    </Label>
                    <Input
                      type="text"
                      placeholder="Leave empty to disable"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Expiration */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" />
                      Expiration
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left font-normal h-8 text-xs",
                            !expiresAt && "text-[#6b6b6b]"
                          )}
                        >
                          {expiresAt ? format(expiresAt, "PPP") : "No expiration"}
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
                          <div className="p-2 border-t border-white/[0.08]">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-7 text-xs"
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
                    <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      Mark as unsafe
                    </Label>
                    <Switch
                      checked={isUnsafe}
                      onCheckedChange={setIsUnsafe}
                    />
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={handleSaveSettings}
                    disabled={isSaving || !!slugError}
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                    Save settings
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#9b9b9b]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#ebebeb]">Share bookmark</p>
                <p className="text-xs text-[#6b6b6b]">
                  Create a public link to share
                </p>
              </div>
            </div>

            {/* Custom Slug */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b]">Custom Slug</Label>
              <div className="relative">
                <Input
                  placeholder="my-custom-link (optional)"
                  value={slug}
                  onChange={handleSlugChange}
                  className={cn("h-8 text-xs", slugError && "border-destructive")}
                />
                {slug && !slugError && slugAvailable && (
                  <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
                )}
              </div>
              {slugError && (
                <p className="text-[10px] text-destructive">{slugError}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Password Protection
              </Label>
              <Input
                type="text"
                placeholder="Leave empty to disable"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Expiration */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" />
                Expiration
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs",
                      !expiresAt && "text-[#6b6b6b]"
                    )}
                  >
                    {expiresAt ? format(expiresAt, "PPP") : "No expiration"}
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
                    <div className="p-2 border-t border-white/[0.08]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
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
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs text-[#9b9b9b] flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Mark as unsafe
              </Label>
              <Switch
                checked={isUnsafe}
                onCheckedChange={setIsUnsafe}
              />
            </div>

            <Button
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={handleCreateShare}
              disabled={isCreating || !!slugError}
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Link className="h-3 w-3" />
              )}
              Create share link
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
