import { useRef, useState } from "react"
import { Doc } from "../../../convex/_generated/dataModel"
import { Download, ExternalLink, FileIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatFileSize, getFileType } from "@/lib/utils"
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
  const [isLoading, setIsLoading] = useState(true)
  // Keep track of last valid values to allow exit animation
  const lastDataRef = useRef<{ bookmark: Doc<"bookmarks">; fileUrl: string } | null>(null)
  if (bookmark && fileUrl) {
    lastDataRef.current = { bookmark, fileUrl }
  }
  const displayData = (bookmark && fileUrl) ? { bookmark, fileUrl } : lastDataRef.current

  if (!displayData) return null

  const fileName = displayData.bookmark.metadata?.fileName || displayData.bookmark.title
  const fileSize = displayData.bookmark.metadata?.fileSize
  const fileType = displayData.bookmark.type === "image" ? "image" : getFileType(fileName)
  const fileExtension = fileName.split(".").pop()?.toUpperCase() || "FILE"

  const handleDownload = async () => {
    try {
      const response = await fetch(displayData.fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      // Fallback to direct download
      const link = document.createElement("a")
      link.href = displayData.fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleOpenInNewTab = () => {
    window.open(displayData.fileUrl, "_blank")
  }

  const renderPreview = () => {
    switch (fileType) {
      case "image":
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <img
              src={displayData.fileUrl}
              alt={fileName}
              className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-sm"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </>
        )

      case "pdf":
        return (
          <div className="w-full h-[60vh] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <iframe
              src={`${displayData.fileUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full rounded-lg border border-border"
              title={fileName}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )

      case "video":
        return (
          <video
            src={displayData.fileUrl}
            controls
            className="max-w-full max-h-[55vh] rounded-lg shadow-sm"
            onLoadedData={() => setIsLoading(false)}
          >
            Your browser does not support video playback.
          </video>
        )

      case "audio":
        return (
          <div className="flex flex-col items-center gap-6 py-8 w-full max-w-md">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
              <FileIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
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
            <audio
              src={displayData.fileUrl}
              controls
              className="w-full"
              onLoadedData={() => setIsLoading(false)}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        )

      default:
        return (
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
            <p className="text-xs text-muted-foreground max-w-xs">
              Preview not available for this file type. Download to view.
            </p>
            <Button onClick={handleDownload} className="gap-2 mt-2">
              <Download className="h-4 w-4" />
              Download File
            </Button>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-2xl p-0 gap-0 overflow-hidden ${fileType === "pdf" ? "sm:max-w-4xl" : ""}`}>
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

        <div className={`flex items-center justify-center p-4 sm:p-6 bg-muted/30 ${fileType === "pdf" ? "p-2 sm:p-2" : "min-h-[200px] sm:min-h-[300px]"} relative`}>
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
