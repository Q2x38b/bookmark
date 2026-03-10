import { useState, useRef, useCallback, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Doc, Id } from "../../../convex/_generated/dataModel"
import {
  Copy,
  Check,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  QrCode,
  Download,
  Pencil,
  Loader2,
  FileDown,
  Link2,
} from "lucide-react"
import { RoundedQRCode } from "@/components/ui/rounded-qrcode"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShareModal } from "./ShareModal"
import { useHaptics } from "@/hooks/useHaptics"

interface BulkShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarks: Doc<"bookmarks">[]
  onComplete?: () => void
}

const typeConfig: Record<string, { label: string; className: string }> = {
  link: {
    label: "Link",
    className:
      "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  color: {
    label: "Color",
    className:
      "bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  note: {
    label: "Note",
    className:
      "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  image: {
    label: "Image",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  file: {
    label: "File",
    className:
      "bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
}

function TypeBadge({ type }: { type: string }) {
  const config = typeConfig[type] || typeConfig.link
  return (
    <Badge variant="outline" className={cn("border-0", config.className)}>
      {config.label}
    </Badge>
  )
}

export function BulkShareModal({
  open,
  onOpenChange,
  bookmarks,
  onComplete,
}: BulkShareModalProps) {
  const createBulkShares = useMutation(api.sharing.createBulkShares)
  const deleteShare = useMutation(api.sharing.deleteShare)
  const haptics = useHaptics()

  const [isCreating, setIsCreating] = useState(false)
  const [sharesCreated, setSharesCreated] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<Id<"bookmarks"> | null>(null)
  const [qrColor, setQrColor] = useState("#000000")
  const [qrShareUrl, setQrShareUrl] = useState<string | null>(null)
  const [editingBookmark, setEditingBookmark] = useState<Doc<"bookmarks"> | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Query existing shares for the selected bookmarks
  const existingSharesRaw = useQuery(
    api.sharing.getSharesForBookmarks,
    bookmarks.length > 0 ? { bookmarkIds: bookmarks.map((b) => b._id) } : "skip"
  )

  // Filter out null values from the query result
  const existingShares = existingSharesRaw?.filter((s): s is NonNullable<typeof s> => s !== null) ?? []

  // Check if all selected bookmarks already have shares
  const allAlreadyShared = existingShares.length === bookmarks.length && bookmarks.length > 0

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSharesCreated(false)
      setIsCreating(false)
    }
  }, [open])

  const handleCreateShares = async () => {
    if (bookmarks.length === 0) return

    // If all already shared, just show the shares
    if (allAlreadyShared) {
      setSharesCreated(true)
      return
    }

    setIsCreating(true)
    try {
      const results = await createBulkShares({
        bookmarkIds: bookmarks.map((b) => b._id),
      })

      const newlyCreated = results.filter((r) => !r.alreadyShared).length
      const alreadyShared = results.filter((r) => r.alreadyShared).length

      setSharesCreated(true)

      haptics.success()
      if (newlyCreated > 0 && alreadyShared > 0) {
        toast.success(`Created ${newlyCreated} share link${newlyCreated > 1 ? "s" : ""}, ${alreadyShared} already shared`)
      } else if (newlyCreated > 0) {
        toast.success(`Created ${newlyCreated} share link${newlyCreated > 1 ? "s" : ""}`)
      } else {
        toast.info(`All ${alreadyShared} bookmark${alreadyShared > 1 ? "s" : ""} already have share links`)
      }
    } catch (error) {
      haptics.error()
      toast.error("Failed to create share links")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopy = async (shareUrl: string, shareId: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`
    await navigator.clipboard.writeText(fullUrl)
    haptics.success()
    setCopiedId(shareId)
    setTimeout(() => setCopiedId(null), 1500)
    toast.success("Link copied!")
  }

  const handleCopyAll = async () => {
    if (existingShares.length === 0) return
    const urls = existingShares.map((s) => `${window.location.origin}${s.shareUrl}`).join("\n")
    await navigator.clipboard.writeText(urls)
    haptics.success()
    toast.success(`Copied ${existingShares.length} share link${existingShares.length > 1 ? "s" : ""}`)
  }

  const handleExportCsv = () => {
    if (existingShares.length === 0) return

    const headers = ["Title", "Type", "Share URL", "Views"]
    const rows = existingShares.map((s) => [
      s.title,
      s.type,
      `${window.location.origin}${s.shareUrl}`,
      s.viewCount.toString(),
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "share-links.csv"
    a.click()
    URL.revokeObjectURL(url)
    haptics.success()
    toast.success("Exported to CSV")
  }

  const handleDelete = async (bookmarkId: Id<"bookmarks">) => {
    setDeletingId(bookmarkId)
    try {
      await deleteShare({ bookmarkId })
      haptics.warning()
      toast.success("Share link deleted")
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpen = (shareUrl: string) => {
    window.open(shareUrl, "_blank")
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
        downloadLink.download = `qrcode-share.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }, [])

  const handleClose = (openState: boolean) => {
    onOpenChange(openState)
    if (!openState && sharesCreated) {
      onComplete?.()
    }
  }

  // Show the shares list view after creating or if all already shared
  const showSharesList = sharesCreated || allAlreadyShared

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showSharesList ? "Created Share Links" : "Create Share Links"}
            </DialogTitle>
            <p className="text-pretty text-sm text-muted-foreground">
              {showSharesList
                ? "Manage your share links for the selected bookmarks."
                : `Create public share links for ${bookmarks.length} selected bookmark${bookmarks.length > 1 ? "s" : ""}.`}
            </p>
          </DialogHeader>

          <div className="py-2">
            {!showSharesList ? (
              // Initial view - show selected bookmarks and create button
              <div className="space-y-4">
                <div className="rounded-lg border max-h-64 overflow-y-auto">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark._id}
                      className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bookmark.title}</p>
                      </div>
                      <TypeBadge type={bookmark.type} />
                      {bookmark.shareId && (
                        <Badge variant="secondary" className="text-xs">
                          Already shared
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleCreateShares}
                  disabled={isCreating}
                  className="w-full gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {allAlreadyShared
                    ? "View Share Links"
                    : `Create Share Link${bookmarks.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            ) : (
              // Shares list view
              <div className="space-y-4">
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyAll}
                  >
                    <Copy className="h-4 w-4" />
                    Copy All Links
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleExportCsv}
                  >
                    <FileDown className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                {/* Shares list */}
                <div className="rounded-lg border max-h-80 overflow-y-auto">
                  {existingShares.map((share) => (
                    <div
                      key={share._id}
                      className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{share.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {window.location.origin}{share.shareUrl}
                        </p>
                      </div>
                      <TypeBadge type={share.type} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 p-1">
                          <DropdownMenuItem
                            className="gap-2 text-[13px] h-7 px-2"
                            onClick={() => setEditingBookmark(share as unknown as Doc<"bookmarks">)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-[13px] h-7 px-2"
                            onClick={() => handleOpen(share.shareUrl)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-[13px] h-7 px-2"
                            onClick={() => handleCopy(share.shareUrl, share._id)}
                            disabled={copiedId === share._id}
                          >
                            {copiedId === share._id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-primary" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                Copy link
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-[13px] h-7 px-2"
                            onClick={() => setQrShareUrl(`${window.location.origin}${share.shareUrl}`)}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem
                            className="gap-2 text-[13px] h-7 px-2 text-destructive focus:text-destructive"
                            onClick={() => handleDelete(share._id)}
                            disabled={deletingId === share._id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrShareUrl} onOpenChange={(openState) => !openState && setQrShareUrl(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              ref={qrRef}
              className="bg-white rounded-xl p-4 inline-flex"
            >
              {qrShareUrl && (
                <RoundedQRCode
                  value={qrShareUrl}
                  size={200}
                  level="M"
                  fgColor={qrColor}
                />
              )}
            </div>
            <div className="flex items-center gap-3 w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="h-8 w-8 rounded-full border-2 border-border shrink-0 transition-transform hover:scale-105"
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
        </DialogContent>
      </Dialog>

      {/* Share Modal for editing */}
      <ShareModal
        open={!!editingBookmark}
        onOpenChange={(openState) => !openState && setEditingBookmark(null)}
        bookmark={editingBookmark}
      />
    </>
  )
}
