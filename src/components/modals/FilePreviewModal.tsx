import { useRef } from "react"
import { Doc } from "../../../convex/_generated/dataModel"
import { Download, ExternalLink, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatFileSize, isImageFile } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FilePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Doc<"bookmarks"> | null
  fileUrl: string | null
}

export function FilePreviewModal({
  open,
  onOpenChange,
  bookmark,
  fileUrl,
}: FilePreviewModalProps) {
  // Keep track of last valid values to allow exit animation
  const lastDataRef = useRef<{ bookmark: Doc<"bookmarks">; fileUrl: string } | null>(null)
  if (bookmark && fileUrl) {
    lastDataRef.current = { bookmark, fileUrl }
  }
  const displayData = (bookmark && fileUrl) ? { bookmark, fileUrl } : lastDataRef.current

  if (!displayData) return null

  const fileName = displayData.bookmark.metadata?.fileName || displayData.bookmark.title
  const fileSize = displayData.bookmark.metadata?.fileSize
  const isImage = displayData.bookmark.type === "image" || isImageFile(fileName)
  const fileExtension = fileName.split(".").pop()?.toUpperCase() || "FILE"

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = displayData.fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(displayData.fileUrl, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-medium truncate">
                {fileName}
              </DialogTitle>
              {fileSize && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(fileSize)}
                </p>
              )}
            </div>
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleOpenInNewTab}
                      tabIndex={-1}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="px-2 py-1 text-xs">
                    Open in new tab
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDownload}
                      tabIndex={-1}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="px-2 py-1 text-xs">
                    Download
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center p-4 sm:p-6 bg-muted/30 min-h-[200px] sm:min-h-[300px] max-h-[50vh] sm:max-h-[60vh]">
          {isImage ? (
            <img
              src={displayData.fileUrl}
              alt={fileName}
              className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                <FileIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {fileExtension}
                  </span>
                  {fileSize && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={handleDownload} className="gap-2 mt-2">
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
