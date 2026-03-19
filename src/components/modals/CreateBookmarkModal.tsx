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
  Pipette,
  Sparkles,
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
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-foreground/[0.06]">
              <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                New Bookmark
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Save a link, color, note, or file
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form id="createBookmarkForm" onSubmit={(e) => { e.preventDefault(); if (isValid() && type !== "file") handleSubmit(); }}>
        <div className="px-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <Link className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span>Link</span>
                  </SelectItem>
                  <SelectItem value="color">
                    <Palette className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span>Color</span>
                  </SelectItem>
                  <SelectItem value="note">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span>Note</span>
                  </SelectItem>
                  <SelectItem value="file">
                    <File className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span>File</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Type-specific Content */}
        <div className="px-4 pb-3">
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
                "border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150",
                isDragging
                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                  : "border-border/60 hover:border-border hover:bg-muted/30"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/70" />
              ) : (
                <>
                  <div className="mb-3 p-3 rounded-xl bg-foreground/[0.06]">
                    <Upload className="h-5 w-5 text-muted-foreground/70" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Drop file here
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    or{" "}
                    <span className="text-foreground/80 font-medium">
                      browse
                    </span>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/50 flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-muted-foreground"
            onClick={handleClose}
          >
            Cancel
          </Button>
          {type !== "file" && (
            <Button
              type="submit"
              form="createBookmarkForm"
              size="sm"
              className="h-8 px-4"
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid()}
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
              Create
            </Button>
          )}
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
