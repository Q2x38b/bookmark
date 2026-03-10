import { useState, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Link,
  Palette,
  FileText,
  Upload,
  Loader2,
  File,
  HelpCircle,
  Pipette,
} from "lucide-react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { isValidUrl, isValidHexColor, getFaviconUrl, normalizeUrl, cn } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

interface CreateBookmarkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  groupId: Id<"groups">
}

type BookmarkType = "link" | "color" | "note" | "file"

export function CreateBookmarkModal({
  open,
  onOpenChange,
  userId,
  groupId,
}: CreateBookmarkModalProps) {
  const [type, setType] = useState<BookmarkType>("link")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [color, setColor] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createBookmark = useMutation(api.bookmarks.createBookmark)
  const generateUploadUrl = useMutation(api.bookmarks.generateUploadUrl)
  const haptics = useHaptics()

  const resetForm = () => {
    setType("link")
    setTitle("")
    setUrl("")
    setColor("")
    setNote("")
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (type === "link") {
        if (!url.trim()) return
        const normalizedUrl = normalizeUrl(url.trim())
        await createBookmark({
          userId,
          groupId,
          type: "link",
          title: title.trim() || url.trim(),
          content: normalizedUrl,
          favicon: getFaviconUrl(normalizedUrl),
        })
      } else if (type === "color") {
        if (!color.trim()) return
        const colorValue = color.trim().startsWith("#") ? color.trim() : `#${color.trim()}`
        await createBookmark({
          userId,
          groupId,
          type: "color",
          title: title.trim() || colorValue.toUpperCase(),
          content: colorValue.toUpperCase(),
        })
      } else if (type === "note") {
        if (!note.trim()) return
        await createBookmark({
          userId,
          groupId,
          type: "note",
          title: title.trim() || note.trim().slice(0, 50),
          content: note.trim(),
        })
      }

      haptics.success()
      toast.success("Bookmark created")
      handleClose()
    } catch {
      haptics.error()
      toast.error("Failed to create bookmark")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true)
      try {
        for (const file of Array.from(files)) {
          const isImage = file.type.startsWith("image/")
          const uploadUrl = await generateUploadUrl()

          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          })

          const { storageId } = await result.json()

          await createBookmark({
            userId,
            groupId,
            type: isImage ? "image" : "file",
            title: title.trim() || file.name,
            content: storageId,
            fileId: storageId,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            },
          })
        }
        haptics.success()
        toast.success("File uploaded")
        handleClose()
      } catch {
        haptics.error()
        toast.error("Failed to upload file")
      } finally {
        setIsUploading(false)
      }
    },
    [userId, groupId, title, createBookmark, generateUploadUrl]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const isValid = () => {
    if (type === "link") {
      return url.trim() && (isValidUrl(url.trim()) || isValidUrl(`https://${url.trim()}`))
    }
    if (type === "color") {
      return color.trim() && (isValidHexColor(color.trim()) || isValidHexColor(`#${color.trim()}`))
    }
    if (type === "note") {
      return note.trim().length > 0
    }
    return false
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4">
          <h2 className="text-lg font-medium text-foreground">
            New Bookmark
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new bookmark to your collection.
          </p>
        </div>

        {/* Form */}
        <form id="createBookmarkForm" onSubmit={(e) => { e.preventDefault(); if (isValid() && type !== "file") handleSubmit(); }}>
        <div className="px-4 sm:px-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Name Field */}
            <div>
              <Label htmlFor="bookmarkName" className="mb-2">
                Name
              </Label>
              <Input
                id="bookmarkName"
                type="text"
                placeholder="Custom name (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {/* Type Dropdown */}
            <div>
              <Label htmlFor="bookmarkType" className="mb-2">
                Type
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as BookmarkType)}>
                <SelectTrigger id="bookmarkType" className="ps-2">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">
                    <Link className="h-4 w-4" />
                    <span>Link</span>
                  </SelectItem>
                  <SelectItem value="color">
                    <Palette className="h-4 w-4" />
                    <span>Color</span>
                  </SelectItem>
                  <SelectItem value="note">
                    <FileText className="h-4 w-4" />
                    <span>Note</span>
                  </SelectItem>
                  <SelectItem value="file">
                    <File className="h-4 w-4" />
                    <span>File</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Type-specific Content */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
          {type === "link" && (
            <div className="space-y-2">
              <Label htmlFor="urlInput">URL</Label>
              <Input
                id="urlInput"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
            </div>
          )}

          {type === "color" && (
            <div className="space-y-3">
              <Label>Color</Label>
              <div className="flex gap-3">
                {/* Color Input with Preview */}
                <div className="flex-1 relative">
                  <Input
                    placeholder="#FF5733"
                    value={color}
                    onChange={(e) => {
                      const value = e.target.value
                      // Add # if user starts typing without it
                      if (value && !value.startsWith("#")) {
                        setColor(`#${value}`)
                      } else {
                        setColor(value)
                      }
                    }}
                    className="pr-12 font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {color && isValidHexColor(color.startsWith("#") ? color : `#${color}`) && (
                    <div
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded border border-border/50"
                      style={{ backgroundColor: color.startsWith("#") ? color : `#${color}` }}
                    />
                  )}
                </div>

                {/* Color Picker Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                    >
                      <Pipette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="space-y-3">
                      <HexColorPicker
                        color={color || "#000000"}
                        onChange={setColor}
                        style={{ width: "200px" }}
                      />
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded border border-border shrink-0"
                          style={{ backgroundColor: color || "#000000" }}
                        />
                        <HexColorInput
                          color={color || "#000000"}
                          onChange={setColor}
                          prefixed
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono uppercase"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Live Color Preview */}
              {color && isValidHexColor(color.startsWith("#") ? color : `#${color}`) && (
                <div
                  className="h-16 w-full rounded-lg border border-border/50 transition-colors"
                  style={{ backgroundColor: color.startsWith("#") ? color : `#${color}` }}
                />
              )}
            </div>
          )}

          {type === "note" && (
            <div className="space-y-2">
              <Label htmlFor="noteContent">Content</Label>
              <textarea
                id="noteContent"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write your note here..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
          )}

          {type === "file" && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="mb-2 bg-muted rounded-full p-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Upload a file
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or,{" "}
                    <label
                      htmlFor="fileUpload"
                      className="text-primary hover:text-primary/90 font-medium cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      click to browse
                    </label>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-border bg-muted rounded-b-lg flex justify-between items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Need help?
                </Button>
              </TooltipTrigger>
              <TooltipContent className="py-3 bg-background text-foreground border">
                <div className="space-y-1">
                  <p className="text-[13px] font-medium">Bookmark types</p>
                  <p className="text-muted-foreground text-xs max-w-[200px]">
                    Links save URLs, colors save hex codes, notes save text, and files upload to storage.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex gap-2 flex-1 sm:flex-none justify-end">
            <Button
              variant="outline"
              className="h-9 px-4 text-sm font-medium flex-1 sm:flex-none"
              onClick={handleClose}
            >
              Cancel
            </Button>
            {type !== "file" && (
              <Button
                type="submit"
                form="createBookmarkForm"
                className="h-9 px-4 text-sm font-medium flex-1 sm:flex-none"
                onClick={handleSubmit}
                disabled={isSubmitting || !isValid()}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="fileUpload"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        />
      </DialogContent>
    </Dialog>
  )
}
