import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id, Doc } from "../../../convex/_generated/dataModel"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { toast } from "sonner"
import { Trash2, FolderInput, Copy, Download, X, ListChecks, Globe, Link2, User, MoreHorizontal } from "lucide-react"
import { BookmarkInput } from "./BookmarkInput"
import { BookmarkRow } from "./BookmarkRow"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ExportModal } from "@/components/modals/ExportModal"
import { FilePreviewModal } from "@/components/modals/FilePreviewModal"
import { CreateBookmarkModal } from "@/components/modals/CreateBookmarkModal"
import { BulkShareModal } from "@/components/modals/BulkShareModal"
import { useHaptics } from "@/hooks/useHaptics"

interface BookmarkListProps {
  userId: Id<"users">
  groupId: Id<"groups">
  groups: Doc<"groups">[]
}

export function BookmarkList({ userId, groupId, groups }: BookmarkListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<Id<"bookmarks">>>(new Set())
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [filePreview, setFilePreview] = useState<{ bookmark: Doc<"bookmarks">; fileUrl: string } | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkShareOpen, setIsBulkShareOpen] = useState(false)
  const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const previousBookmarksRef = useRef<Doc<"bookmarks">[]>([])

  const haptics = useHaptics()

  const bookmarksQuery = useQuery(
    searchQuery
      ? api.bookmarks.searchBookmarks
      : api.bookmarks.getBookmarks,
    searchQuery
      ? { userId, searchQuery }
      : { userId, groupId }
  )

  // Keep previous results while loading to prevent blinking
  const bookmarks = bookmarksQuery ?? previousBookmarksRef.current

  // Update ref when we get new results
  useEffect(() => {
    if (bookmarksQuery) {
      previousBookmarksRef.current = bookmarksQuery
    }
  }, [bookmarksQuery])

  const deleteMultiple = useMutation(api.bookmarks.deleteMultipleBookmarks)
  const moveBookmarks = useMutation(api.bookmarks.moveBookmarks)
  const setMultiplePublic = useMutation(api.bookmarks.setMultipleBookmarksPublic)

  // Clear selection when group changes
  useEffect(() => {
    setSelectedIds(new Set())
    setFocusedIndex(-1)
    setIsSelectMode(false)
  }, [groupId])

  // Exit select mode when no items are selected
  useEffect(() => {
    if (selectedIds.size === 0 && isSelectMode) {
      setIsSelectMode(false)
    }
  }, [selectedIds.size, isSelectMode])

  // Clear focus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setFocusedIndex(-1)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === "INPUT" || target.tagName === "TEXTAREA"

      // ⌘F - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // Esc - Clear selection and exit select mode
      if (e.key === "Escape") {
        setSelectedIds(new Set())
        setFocusedIndex(-1)
        setIsSelectMode(false)
        inputRef.current?.blur()
        return
      }

      if (isInputFocused && inputRef.current === document.activeElement) {
        return
      }

      if (!bookmarks || bookmarks.length === 0) return

      // ↑/↓ - Navigate
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, bookmarks.length - 1))
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      // Space - Toggle select
      if (e.key === " " && focusedIndex >= 0) {
        e.preventDefault()
        const bookmark = bookmarks[focusedIndex]
        if (!isSelectMode) {
          setIsSelectMode(true)
        }
        setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(bookmark._id)) {
            next.delete(bookmark._id)
          } else {
            next.add(bookmark._id)
          }
          return next
        })
        return
      }

      // ⌘A - Select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault()
        setIsSelectMode(true)
        setSelectedIds(new Set(bookmarks.map((b) => b._id)))
        return
      }

      // ⌘C - Copy focused/selected
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault()
        handleCopySelected()
        return
      }

      // ⌘⌫ - Delete focused/selected
      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault()
        handleDeleteSelected()
        return
      }

      // ⌘Enter - Open focused bookmark
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault()
        const bookmark = bookmarks[focusedIndex]
        if (bookmark.type === "link" && bookmark.content) {
          window.open(bookmark.content, "_blank")
        } else if (bookmark.type === "color" && bookmark.content) {
          navigator.clipboard.writeText(bookmark.content)
          toast.success("Copied color to clipboard")
        }
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [bookmarks, focusedIndex, selectedIds, isSelectMode])

  const handleCopySelected = useCallback(async () => {
    if (!bookmarks) return

    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : focusedIndex >= 0
        ? [bookmarks[focusedIndex]._id]
        : []

    if (ids.length === 0) return

    const selected = bookmarks.filter((b) => ids.includes(b._id))
    const text = selected.map((b) => b.content).join("\n")
    await navigator.clipboard.writeText(text)
    haptics.success()
    toast.success(`Copied ${ids.length} item${ids.length > 1 ? "s" : ""}`)
    setIsCopyPopoverOpen(false)
  }, [bookmarks, selectedIds, focusedIndex, haptics])

  const handleCopyUrlsOnly = useCallback(async () => {
    if (!bookmarks) return

    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : focusedIndex >= 0
        ? [bookmarks[focusedIndex]._id]
        : []

    if (ids.length === 0) return

    const selected = bookmarks.filter((b) => ids.includes(b._id) && b.type === "link" && b.content)
    if (selected.length === 0) {
      haptics.error()
      toast.error("No URLs found in selection")
      return
    }
    const text = selected.map((b) => b.content).join("\n")
    await navigator.clipboard.writeText(text)
    haptics.success()
    toast.success(`Copied ${selected.length} URL${selected.length > 1 ? "s" : ""}`)
    setIsCopyPopoverOpen(false)
  }, [bookmarks, selectedIds, focusedIndex, haptics])

  const handleDeleteSelected = useCallback(async () => {
    if (!bookmarks) return

    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : focusedIndex >= 0
        ? [bookmarks[focusedIndex]._id]
        : []

    if (ids.length === 0) return

    haptics.warning()
    await deleteMultiple({ bookmarkIds: ids })
    toast.success(`Deleted ${ids.length} bookmark${ids.length > 1 ? "s" : ""}`)
    setSelectedIds(new Set())
    setFocusedIndex(-1)
    setIsSelectMode(false)
  }, [bookmarks, selectedIds, focusedIndex, deleteMultiple, haptics])

  const handleMoveSelected = useCallback(
    async (targetGroupId: Id<"groups">) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      const group = groups.find(g => g._id === targetGroupId)
      await moveBookmarks({ bookmarkIds: ids, groupId: targetGroupId })
      haptics.success()
      toast.success(`Moved ${ids.length} bookmark${ids.length > 1 ? "s" : ""} to ${group?.name || "group"}`)
      setSelectedIds(new Set())
      setIsSelectMode(false)
    },
    [selectedIds, moveBookmarks, groups, haptics]
  )

  const handleAddToPublic = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    await setMultiplePublic({ bookmarkIds: ids, isPublic: true })
    haptics.success()
    toast.success(`Added ${ids.length} bookmark${ids.length > 1 ? "s" : ""} to public profile`)
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }, [selectedIds, setMultiplePublic, haptics])

  const handleSelectAll = () => {
    if (!bookmarks) return
    haptics.selection()
    setSelectedIds(new Set(bookmarks.map((b) => b._id)))
  }

  const handleExitSelectMode = () => {
    haptics.soft()
    setSelectedIds(new Set())
    // isSelectMode will be set to false by the effect after a delay for smooth animation
  }

  const handleEnterSelectMode = () => {
    haptics.selection()
    setIsSelectMode(true)
  }

  return (
    <div className="flex flex-col gap-2 pb-16 pt-4">
      <BookmarkInput
        userId={userId}
        groupId={groupId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        inputRef={inputRef as React.RefObject<HTMLInputElement>}
        onOpenCreateModal={() => setIsCreateOpen(true)}
      />

      {/* Column Headers */}
      <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground border-b border-border pb-1.5 mt-1">
        <div className="flex-1 min-w-0">Title</div>
        <div className="w-16 text-right shrink-0">Created</div>
      </div>

      {/* Bookmark List */}
      <LayoutGroup>
        <div ref={listRef} className="space-y-0.5">
          {bookmarks?.map((bookmark, index) => (
            <BookmarkRow
              key={bookmark._id}
              bookmark={bookmark}
              isSelected={selectedIds.has(bookmark._id)}
              isFocused={focusedIndex === index}
              onSelect={(selected) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  if (selected) {
                    next.add(bookmark._id)
                  } else {
                    next.delete(bookmark._id)
                  }
                  return next
                })
              }}
              onFocus={() => setFocusedIndex(index)}
              groups={groups}
              isSelectMode={isSelectMode}
              onEnterSelectMode={handleEnterSelectMode}
              onOpenFile={(bookmark, fileUrl) => setFilePreview({ bookmark, fileUrl })}
            />
          ))}
        </div>
      </LayoutGroup>

      {bookmarks?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/30 border border-border/30 mb-3">
            {searchQuery ? (
              <svg
                className="h-4 w-4 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            {searchQuery ? "No bookmarks found" : "No bookmarks yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {searchQuery
              ? "Try a different search term"
              : "Add a link, note, or color to get started"}
          </p>
        </div>
      )}

      {/* Bottom Selection Bar - Mobile-friendly with horizontal scroll */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:flex sm:justify-center sm:pointer-events-none safe-bottom"
          >
            <div className="sm:pointer-events-auto">
            {/* Selection count badge - mobile only */}
            <div className="sm:hidden flex items-center justify-center py-1.5 bg-popover border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">
                {selectedIds.size} selected
              </span>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-evenly sm:justify-center gap-0 sm:gap-1 rounded-none sm:rounded-lg border-t sm:border border-border bg-popover px-1 sm:px-1.5 py-2 sm:py-1 shadow-xl sm:overflow-x-auto sm:scrollbar-hide">
              <Button
                variant="ghost"
                size="sm"
                className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 rounded-md text-[11px] sm:text-xs h-auto sm:h-7 py-1.5 sm:py-0 px-2 sm:px-2 shrink-0 active:bg-muted"
                onClick={handleSelectAll}
              >
                <ListChecks className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                <span className="hidden sm:inline">Select All</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Popover open={isCopyPopoverOpen} onOpenChange={setIsCopyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 rounded-md text-[11px] sm:text-xs h-auto sm:h-7 py-1.5 sm:py-0 px-2 sm:px-2 shrink-0 active:bg-muted"
                    disabled={selectedIds.size === 0}
                  >
                    <Copy className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
                    Copy
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1.5" align="center" side="top" sideOffset={8}>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm sm:text-xs text-foreground hover:bg-muted active:bg-muted transition-colors"
                    onClick={handleCopySelected}
                  >
                    <Copy className="h-4 sm:h-3.5 w-4 sm:w-3.5 text-muted-foreground" />
                    Copy All
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm sm:text-xs text-foreground hover:bg-muted active:bg-muted transition-colors"
                    onClick={handleCopyUrlsOnly}
                  >
                    <Link2 className="h-4 sm:h-3.5 w-4 sm:w-3.5 text-muted-foreground" />
                    Copy URLs Only
                  </button>
                </PopoverContent>
              </Popover>

              {/* More actions dropdown for mobile - combines Share, Public, Move, Export */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-col gap-0.5 rounded-md text-[11px] h-auto py-1.5 px-2 shrink-0 active:bg-muted"
                      disabled={selectedIds.size === 0}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-40 p-1">
                    <DropdownMenuItem
                      className="gap-2 text-[13px] h-7 px-2"
                      onClick={() => setIsBulkShareOpen(true)}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-[13px] h-7 px-2"
                      onClick={handleAddToPublic}
                    >
                      <User className="h-3.5 w-3.5" />
                      Add to Public
                    </DropdownMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-muted active:bg-muted">
                          <FolderInput className="h-3.5 w-3.5" />
                          Move To...
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" className="p-1">
                        {groups.map((group) => (
                          <DropdownMenuItem
                            key={group._id}
                            className="gap-2 text-[13px] h-7 px-2"
                            onClick={() => handleMoveSelected(group._id)}
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            {group.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenuItem
                      className="gap-2 text-[13px] h-7 px-2"
                      onClick={() => setIsExportOpen(true)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop-only buttons */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 rounded-md text-xs h-7 px-2 shrink-0 hidden sm:flex"
                onClick={() => setIsBulkShareOpen(true)}
                disabled={selectedIds.size === 0}
              >
                <Globe className="h-3.5 w-3.5" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 rounded-md text-xs h-7 px-2 shrink-0 hidden sm:flex"
                onClick={handleAddToPublic}
                disabled={selectedIds.size === 0}
              >
                <User className="h-3.5 w-3.5" />
                Public
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 rounded-md text-xs h-7 px-2 shrink-0 hidden sm:flex"
                    disabled={selectedIds.size === 0}
                  >
                    <FolderInput className="h-3.5 w-3.5" />
                    Move
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-1">
                  {groups.map((group) => (
                    <DropdownMenuItem
                      key={group._id}
                      className="gap-2 cursor-pointer text-[13px] h-7 px-2"
                      onClick={() => handleMoveSelected(group._id)}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 rounded-md text-xs h-7 px-2 shrink-0 hidden sm:flex"
                onClick={() => setIsExportOpen(true)}
                disabled={selectedIds.size === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>

              {/* Delete - always visible */}
              <Button
                variant="ghost"
                size="sm"
                className="flex-col sm:flex-row gap-0.5 sm:gap-1.5 rounded-md text-[11px] sm:text-xs h-auto sm:h-7 py-1.5 sm:py-0 px-2 sm:px-2 text-destructive hover:text-destructive active:bg-destructive/20 shrink-0"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
              </Button>

              <div className="hidden sm:block w-px h-4 bg-muted mx-0.5 shrink-0" />

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="flex-col gap-0.5 h-auto sm:h-7 w-auto sm:w-7 py-1.5 sm:py-0 px-2 sm:px-0 rounded-md shrink-0 active:bg-muted"
                onClick={handleExitSelectMode}
              >
                <X className="h-4 sm:h-3.5 w-4 sm:w-3.5" />
              </Button>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExportModal
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        userId={userId}
        groups={groups}
        selectedBookmarkIds={Array.from(selectedIds)}
      />

      <FilePreviewModal
        open={!!filePreview}
        onOpenChange={(open) => !open && setFilePreview(null)}
        bookmark={filePreview?.bookmark || null}
        fileUrl={filePreview?.fileUrl || null}
      />

      <CreateBookmarkModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        userId={userId}
        groupId={groupId}
      />

      <BulkShareModal
        open={isBulkShareOpen}
        onOpenChange={setIsBulkShareOpen}
        bookmarks={bookmarks?.filter((b) => selectedIds.has(b._id)) || []}
        onComplete={() => {
          setSelectedIds(new Set())
          setIsSelectMode(false)
        }}
      />
    </div>
  )
}
