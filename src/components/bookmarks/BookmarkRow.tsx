import { useState, useRef, useEffect, forwardRef, useCallback, memo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id, Doc } from "../../../convex/_generated/dataModel"
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion"
import { toast } from "sonner"
import {
  Link as LinkIcon,
  FileText,
  Image,
  File,
  Pencil,
  Trash2,
  Copy,
  FolderInput,
  Check,
  ListChecks,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { SharePopover } from "./SharePopover"
import { ShareModal } from "@/components/modals/ShareModal"
import { MobileActionSheet } from "./MobileActionSheet"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDate, getFaviconUrl } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

interface BookmarkRowProps {
  bookmark: Doc<"bookmarks">
  isSelected: boolean
  isFocused: boolean
  onSelect: (selected: boolean) => void
  onFocus: () => void
  groups: Doc<"groups">[]
  isSelectMode: boolean
  onEnterSelectMode: () => void
  onOpenFile?: (bookmark: Doc<"bookmarks">, fileUrl: string) => void
}

// Detect if device supports touch or is in mobile viewport
const isTouchDevice = () => {
  if (typeof window === "undefined") return false
  // Check for actual touch support
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  // Also check for narrow viewport (for DevTools mobile emulation)
  const isNarrowViewport = window.innerWidth < 768
  return hasTouch || isNarrowViewport
}

// Swipe action width - now contains two buttons
const ACTION_WIDTH = 100
const SNAP_THRESHOLD = 55 // Higher = harder to trigger, easier to snap back

export const BookmarkRow = memo(forwardRef<HTMLDivElement, BookmarkRowProps>(function BookmarkRow({
  bookmark,
  isSelected,
  isFocused,
  onSelect,
  onFocus,
  groups,
  isSelectMode,
  onEnterSelectMode,
  onOpenFile,
}, ref) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(bookmark.title)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isSwiped, setIsSwiped] = useState<"left" | "right" | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const haptics = useHaptics()
  const controls = useAnimation()
  const x = useMotionValue(0)

  // Check for mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(isTouchDevice())
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Close swipe when clicking outside
  useEffect(() => {
    if (!isSwiped) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        controls.start({ x: 0 })
        setIsSwiped(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isSwiped, controls])

  const updateBookmark = useMutation(api.bookmarks.updateBookmark)
  const deleteBookmark = useMutation(api.bookmarks.deleteBookmark)
  const moveBookmarks = useMutation(api.bookmarks.moveBookmarks)
  const updateFavicon = useMutation(api.bookmarks.updateFavicon)
  const togglePublic = useMutation(api.bookmarks.toggleBookmarkPublic)

  const fileUrl = useQuery(
    api.bookmarks.getFileUrl,
    bookmark.fileId ? { fileId: bookmark.fileId } : "skip"
  )

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      })
    }
  }, [isRenaming])

  const getIcon = () => {
    switch (bookmark.type) {
      case "link":
        return bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="h-4 w-4 rounded" />
        ) : (
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        )
      case "color":
        return (
          <div
            className="h-4 w-4 rounded border border-border/50"
            style={{ backgroundColor: bookmark.content }}
          />
        )
      case "note":
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case "image":
        return <Image className="h-4 w-4 text-muted-foreground" />
      case "file":
        return <File className="h-4 w-4 text-muted-foreground" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getContent = () => {
    return bookmark.content || bookmark.url || ""
  }

  const getMeta = () => {
    const content = getContent()
    switch (bookmark.type) {
      case "link":
        try {
          return content ? new URL(content).hostname : "Link"
        } catch {
          return "Link"
        }
      case "color":
        return content
      case "note":
        return "Note"
      case "image":
        return bookmark.metadata?.fileName || "Image"
      case "file":
        return bookmark.metadata?.fileName || "File"
      default:
        return ""
    }
  }

  const handleClick = () => {
    if (isRenaming) return

    // If swiped, close it first
    if (isSwiped) {
      controls.start({ x: 0 })
      setIsSwiped(null)
      return
    }

    if (isSelectMode) {
      haptics.selection()
      onSelect(!isSelected)
      return
    }

    haptics.soft()
    onFocus()
    const content = getContent()
    if (bookmark.type === "link" && content) {
      window.open(content, "_blank")
    } else if (bookmark.type === "color") {
      handleCopy()
    } else if ((bookmark.type === "image" || bookmark.type === "file") && fileUrl) {
      if (onOpenFile) {
        onOpenFile(bookmark, fileUrl)
      } else {
        window.open(fileUrl, "_blank")
      }
    }
  }

  const handleCopy = async () => {
    let textToCopy = getContent()
    if ((bookmark.type === "image" || bookmark.type === "file") && fileUrl) {
      textToCopy = fileUrl
    }
    if (!textToCopy) return
    await navigator.clipboard.writeText(textToCopy)
    haptics.success()
    toast.success("Copied to clipboard")
    // Close swipe after action
    controls.start({ x: 0 })
    setIsSwiped(null)
  }

  const handleRename = async () => {
    if (newTitle.trim() && newTitle !== bookmark.title) {
      await updateBookmark({
        bookmarkId: bookmark._id,
        title: newTitle.trim(),
      })
      haptics.success()
      toast.success("Bookmark renamed")
    }
    setIsRenaming(false)
  }

  const handleDelete = async () => {
    haptics.warning()
    await deleteBookmark({ bookmarkId: bookmark._id })
    toast.success("Bookmark deleted")
  }

  const handleMove = async (groupId: Id<"groups">) => {
    const group = groups.find(g => g._id === groupId)
    await moveBookmarks({ bookmarkIds: [bookmark._id], groupId })
    haptics.success()
    toast.success(`Moved to ${group?.name || "group"}`)
  }

  const handleRefetch = async () => {
    if (bookmark.type !== "link") return
    const content = getContent()
    if (!content) return
    const newFavicon = getFaviconUrl(content)
    await updateFavicon({ bookmarkId: bookmark._id, favicon: newFavicon })
    haptics.success()
    toast.success("Favicon refreshed")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename()
    } else if (e.key === "Escape") {
      setNewTitle(bookmark.title)
      setIsRenaming(false)
    }
  }

  const handleSelectMultiple = () => {
    haptics.selection()
    onEnterSelectMode()
    onSelect(true)
  }

  const handleTogglePublic = async () => {
    await togglePublic({ bookmarkId: bookmark._id })
    haptics.success()
    toast.success(bookmark.isPublic ? "Removed from public profile" : "Added to public profile")
  }

  // Handle drag end
  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const { offset, velocity } = info
    const swipeThreshold = SNAP_THRESHOLD

    // Require higher velocity (700) to trigger swipe, making it easier to snap back
    if (offset.x < -swipeThreshold || velocity.x < -700) {
      // Swiped left - show right action (delete)
      controls.start({ x: -ACTION_WIDTH })
      setIsSwiped("left")
      haptics.nudge()
    } else if (offset.x > swipeThreshold || velocity.x > 700) {
      // Swiped right - show left action (copy)
      controls.start({ x: ACTION_WIDTH })
      setIsSwiped("right")
      haptics.nudge()
    } else {
      // Snap back
      controls.start({ x: 0 })
      setIsSwiped(null)
    }
  }, [controls, haptics])

  const meta = getMeta()

  // Transform for action button opacity
  const leftActionOpacity = useTransform(x, [0, ACTION_WIDTH], [0, 1])
  const rightActionOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0])

  const rowContent = (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-md"
    >
      {/* Left action (shown when swiping right) - Copy + More */}
      {isMobile && (
        <motion.div
          className={`absolute inset-y-0 left-0 flex items-center justify-center gap-2 px-2 ${isSwiped !== "right" ? "pointer-events-none" : ""}`}
          style={{ opacity: leftActionOpacity, width: ACTION_WIDTH }}
        >
          <button
            onClick={handleCopy}
            aria-label="Copy to clipboard"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-md"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              haptics.soft()
              controls.start({ x: 0 })
              setIsSwiped(null)
              setIsMenuOpen(true)
            }}
            aria-label="More options"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-muted-foreground text-white shadow-md"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Right action (shown when swiping left) - Delete */}
      {isMobile && (
        <motion.div
          className={`absolute inset-y-0 right-0 flex items-center justify-center ${isSwiped !== "left" ? "pointer-events-none" : ""}`}
          style={{ opacity: rightActionOpacity, width: ACTION_WIDTH }}
        >
          <button
            onClick={handleDelete}
            aria-label="Delete bookmark"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-destructive text-white shadow-md"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Main row content */}
      <motion.div
        drag={isMobile && !isSelectMode ? "x" : false}
        dragDirectionLock
        dragElastic={0.05}
        dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className={`group flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-md transition-colors duration-75 bg-background ${
          isFocused
            ? "bg-white/[0.08]"
            : isSelected
            ? "bg-white/[0.04]"
            : ""
        }`}
        onClick={handleClick}
        onMouseEnter={onFocus}
      >
        <motion.div
          initial={false}
          animate={{
            transform: isSelectMode
              ? "translateX(0) scaleX(1)"
              : "translateX(-10px) scaleX(0)",
            opacity: isSelectMode ? 1 : 0
          }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: "left center", width: 20 }}
          className="shrink-0 flex items-center justify-center overflow-hidden"
          onClick={(e) => {
            if (!isSelectMode) return
            e.stopPropagation()
            haptics.selection()
            onSelect(!isSelected)
          }}
        >
          <Checkbox checked={isSelected} className="h-4 w-4" />
        </motion.div>

        <div className="w-5 shrink-0 flex items-center justify-center">{getIcon()}</div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="h-auto py-0 px-0 text-sm bg-transparent border-none outline-none ring-0 focus:ring-0 w-full caret-primary"
            />
          ) : (
            <>
              <span className="text-sm truncate">{bookmark.title}</span>
              {meta && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  {meta}
                </span>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <AnimatePresence mode="wait">
            {isFocused && !isSelectMode ? (
              <motion.div
                key="kbd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="hidden sm:flex items-center gap-1"
              >
                <kbd className="inline-flex items-center justify-center h-5 min-w-5 px-1 text-[11px] font-medium rounded border border-white/[0.08] bg-white/[0.04] text-[#9b9b9b]">
                  ⌘
                </kbd>
                <kbd className="inline-flex items-center justify-center h-5 px-1.5 text-[11px] font-medium rounded border border-white/[0.08] bg-white/[0.04] text-[#9b9b9b]">
                  Enter
                </kbd>
              </motion.div>
            ) : (
              <motion.span
                key="date"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="text-xs text-[#6b6b6b] tabular-nums"
              >
                {formatDate(bookmark.createdAt)}
              </motion.span>
            )}
          </AnimatePresence>

                  </div>
      </motion.div>

      {/* Mobile action sheet (triggered by swipe action) */}
      <MobileActionSheet
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        bookmark={bookmark}
        groups={groups}
        onCopy={handleCopy}
        onRename={() => {
          setNewTitle(bookmark.title)
          setIsRenaming(true)
        }}
        onDelete={handleDelete}
        onMove={handleMove}
        onRefetch={bookmark.type === "link" ? handleRefetch : undefined}
        onTogglePublic={handleTogglePublic}
        onSelectMultiple={handleSelectMultiple}
        onShare={() => setIsShareOpen(true)}
      />

      {/* Share Modal for mobile */}
      <ShareModal
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        bookmark={bookmark}
      />
    </div>
  )

  // On desktop, wrap with context menu
  if (!isMobile) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div ref={ref}>
            {rowContent}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-44 p-1">
          <ContextMenuItem
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={() => {
              setNewTitle(bookmark.title)
              setIsRenaming(true)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Rename
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>

          {bookmark.type === "link" && (
            <ContextMenuItem
              className="gap-2 cursor-pointer text-[13px] h-7 px-2"
              onClick={handleRefetch}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refetch
            </ContextMenuItem>
          )}

          <SharePopover bookmark={bookmark}>
            <button
              className="relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2 py-2 text-[13px] h-7 outline-none transition-colors hover:bg-white/[0.08] w-full"
            >
              <Globe className="h-3.5 w-3.5" />
              Share
            </button>
          </SharePopover>

          <ContextMenuItem
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={handleTogglePublic}
          >
            {bookmark.isPublic ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Make Private
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Make Public
              </>
            )}
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2 cursor-pointer text-[13px] h-7 px-2 whitespace-nowrap">
              <FolderInput className="h-3.5 w-3.5" />
              <span className="flex-1">Move To...</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-36 p-1">
              {groups.map((group) => (
                <ContextMenuItem
                  key={group._id}
                  className="gap-2 cursor-pointer text-[13px] h-7 px-2"
                  onClick={() => handleMove(group._id)}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                  {group._id === bookmark.groupId && (
                    <Check className="h-3 w-3 ml-auto" />
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={handleSelectMultiple}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Select Multiple
          </ContextMenuItem>

          <ContextMenuSeparator className="my-1" />

          <ContextMenuItem
            variant="destructive"
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
            <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // On mobile, just return the row content with swipe
  return <div ref={ref}>{rowContent}</div>
}))
