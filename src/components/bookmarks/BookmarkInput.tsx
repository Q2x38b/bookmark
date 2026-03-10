import { useState, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { Plus, Search } from "lucide-react"
import { isValidUrl, isValidHexColor, getFaviconUrl, normalizeUrl } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

interface BookmarkInputProps {
  userId: Id<"users">
  groupId: Id<"groups">
  searchQuery: string
  onSearchChange: (query: string) => void
  inputRef: React.RefObject<HTMLInputElement>
  onOpenCreateModal?: () => void
}

export function BookmarkInput({
  userId,
  groupId,
  searchQuery,
  onSearchChange,
  inputRef,
  onOpenCreateModal,
}: BookmarkInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const createBookmark = useMutation(api.bookmarks.createBookmark)
  const generateUploadUrl = useMutation(api.bookmarks.generateUploadUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const haptics = useHaptics()

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return

    const trimmedValue = value.trim()
    haptics.success()

    // Detect bookmark type
    if (isValidUrl(trimmedValue)) {
      // It's a link - normalize URL to ensure it has https://
      const normalizedUrl = normalizeUrl(trimmedValue)
      await createBookmark({
        userId,
        groupId,
        type: "link",
        title: trimmedValue, // Keep original as title
        content: normalizedUrl,
        favicon: getFaviconUrl(normalizedUrl),
      })
    } else if (isValidHexColor(trimmedValue)) {
      // It's a color
      await createBookmark({
        userId,
        groupId,
        type: "color",
        title: trimmedValue.toUpperCase(),
        content: trimmedValue.toUpperCase(),
      })
    } else {
      // It's a note
      await createBookmark({
        userId,
        groupId,
        type: "note",
        title: trimmedValue.slice(0, 100),
        content: trimmedValue,
      })
    }

    onSearchChange("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && searchQuery.trim()) {
      e.preventDefault()
      handleSubmit(searchQuery)
    }
  }

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      haptics.soft()
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
          title: file.name,
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
    },
    [userId, groupId, createBookmark, generateUploadUrl, haptics]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div
      className={`relative rounded-md border bg-card transition-colors cursor-text ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleContainerClick}
    >
      {/* Left icon - absolutely positioned */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {searchQuery ? (
          <Search className="h-4 w-4 text-muted-foreground" />
        ) : null}
      </div>

      {/* Plus button - absolutely positioned but interactive */}
      {!searchQuery && (
        <button
          type="button"
          aria-label="Create new bookmark"
          onClick={(e) => {
            e.stopPropagation()
            haptics.soft()
            onOpenCreateModal?.()
          }}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors z-10"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <input
        ref={inputRef}
        type="text"
        placeholder="Insert a link, color, text, or drop a file..."
        className="w-full bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground py-2 pl-9 pr-16"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
      />

      {/* Right suffix - absolutely positioned */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
        <kbd className="rounded bg-muted px-1.5 py-0.5">⌘</kbd>
        <kbd className="rounded bg-muted px-1.5 py-0.5">F</kbd>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
    </div>
  )
}
