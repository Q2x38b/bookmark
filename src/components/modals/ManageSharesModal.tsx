import { useState, useMemo, useRef, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import {
  Copy,
  Check,
  Trash2,
  Eye,
  ExternalLink,
  Link2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  Pencil,
} from "lucide-react"
import { RoundedQRCode } from "@/components/ui/rounded-qrcode"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Doc } from "../../../convex/_generated/dataModel"

interface ManageSharesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
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

export function ManageSharesModal({
  open,
  onOpenChange,
  userId,
}: ManageSharesModalProps) {
  const shares = useQuery(api.sharing.getUserShares, { userId })
  const deleteShare = useMutation(api.sharing.deleteShare)
  const [deletingId, setDeletingId] = useState<Id<"bookmarks"> | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")
  const [pageSize, setPageSize] = useState(5)
  const [pageIndex, setPageIndex] = useState(0)
  const [qrColor, setQrColor] = useState("#000000")
  const [qrShareUrl, setQrShareUrl] = useState<string | null>(null)
  const [editingBookmark, setEditingBookmark] = useState<Doc<"bookmarks"> | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const filteredShares = useMemo(() => {
    if (!shares) return []
    if (!globalFilter) return shares
    return shares.filter((share) =>
      share.title.toLowerCase().includes(globalFilter.toLowerCase())
    )
  }, [shares, globalFilter])

  const paginatedShares = useMemo(() => {
    const start = pageIndex * pageSize
    return filteredShares.slice(start, start + pageSize)
  }, [filteredShares, pageIndex, pageSize])

  const pageCount = Math.ceil(filteredShares.length / pageSize)

  const handleCopy = async (shareUrl: string, shareId: string) => {
    const fullUrl = `${window.location.origin}${shareUrl}`
    await navigator.clipboard.writeText(fullUrl)
    setCopiedId(shareId)
    setTimeout(() => setCopiedId(null), 1500)
    toast.success("Link copied!")
  }

  const handleDelete = async (bookmarkId: Id<"bookmarks">) => {
    setDeletingId(bookmarkId)
    try {
      await deleteShare({ bookmarkId })
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Shared Links</DialogTitle>
          <p className="text-pretty text-sm text-muted-foreground">
            Manage all your publicly shared bookmarks in one place.
          </p>
        </DialogHeader>

        <div className="py-2">
          {!shares || shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Link2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No shared links yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Right-click a bookmark and select Share to create a public link
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPageIndex(0)
                    }}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>
                <Input
                  placeholder="Search..."
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value)
                    setPageIndex(0)
                  }}
                  className="h-8 w-full sm:w-64"
                />
              </div>

              {/* Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedShares.length ? (
                      paginatedShares.map((share) => (
                        <TableRow key={share._id}>
                          <TableCell>
                            <span className="font-medium truncate max-w-[200px] block">
                              {share.title}
                            </span>
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={share.type} />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-3.5 w-3.5" />
                              {share.viewCount ?? 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
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
                                  onClick={() => setEditingBookmark(share as Doc<"bookmarks">)}
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
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pageIndex * pageSize + 1} to{" "}
                  {Math.min((pageIndex + 1) * pageSize, filteredShares.length)} of{" "}
                  {filteredShares.length} entries
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    disabled={pageIndex === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: pageCount }, (_, i) => i).map((page) => (
                    <Button
                      key={page}
                      variant={pageIndex === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPageIndex(page)}
                      aria-label={`Go to page ${page + 1}`}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={pageIndex >= pageCount - 1}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrShareUrl} onOpenChange={(open) => !open && setQrShareUrl(null)}>
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
        onOpenChange={(open) => !open && setEditingBookmark(null)}
        bookmark={editingBookmark}
      />
    </>
  )
}
