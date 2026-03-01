import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Link2,
  FileText,
  Image,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  FolderOpen,
  CheckSquare,
  Palette,
  BookmarkX,
} from 'lucide-react'

interface Bookmark {
  _id: Id<"bookmarks">
  type: 'link' | 'text' | 'image' | 'color'
  title: string
  url?: string
  favicon?: string
  content?: string
  color?: string
  imageUrl?: string
  createdAt: number
}

interface Group {
  _id: Id<"groups">
  name: string
  color?: string
}

interface BookmarkListProps {
  bookmarks: Bookmark[]
  selectedBookmarks: Set<Id<"bookmarks">>
  isSelectionMode: boolean
  renamingBookmarkId: Id<"bookmarks"> | null
  onToggleSelection: (id: Id<"bookmarks">) => void
  onStartSelection: (id: Id<"bookmarks">) => void
  onEdit: (bookmark: Bookmark) => void
  onRename: (id: Id<"bookmarks">) => void
  onRenameComplete: () => void
  groups: Group[]
  isLoading?: boolean
}

export function BookmarkListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <Skeleton className="h-4 w-[60px]" />
        </div>
      ))}
    </div>
  )
}

export function BookmarkList({
  bookmarks,
  selectedBookmarks,
  isSelectionMode,
  renamingBookmarkId,
  onToggleSelection,
  onStartSelection,
  onEdit,
  onRename,
  onRenameComplete,
  groups,
  isLoading,
}: BookmarkListProps) {
  const [renameValue, setRenameValue] = useState('')

  const deleteBookmark = useMutation(api.bookmarks.deleteBookmark)
  const updateBookmark = useMutation(api.bookmarks.updateBookmark)
  const moveBookmarks = useMutation(api.bookmarks.moveBookmarks)

  const handleDelete = async (id: Id<"bookmarks">) => {
    try {
      await deleteBookmark({ bookmarkId: id })
      toast.success('Bookmark deleted')
    } catch {
      toast.error('Failed to delete bookmark')
    }
  }

  const handleRenameStart = (bookmark: Bookmark) => {
    setRenameValue(bookmark.title)
    onRename(bookmark._id)
  }

  const handleRenameSubmit = async (id: Id<"bookmarks">) => {
    if (!renameValue.trim()) {
      onRenameComplete()
      return
    }

    try {
      await updateBookmark({
        bookmarkId: id,
        title: renameValue.trim(),
      })
      toast.success('Bookmark renamed')
    } catch {
      toast.error('Failed to rename bookmark')
    }
    onRenameComplete()
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    toast.success('Color copied to clipboard')
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Text copied to clipboard')
  }

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleMove = async (bookmarkId: Id<"bookmarks">, groupId: Id<"groups">) => {
    try {
      await moveBookmarks({
        bookmarkIds: [bookmarkId],
        targetGroupId: groupId,
      })
      toast.success('Bookmark moved')
    } catch {
      toast.error('Failed to move bookmark')
    }
  }

  const getBookmarkIcon = (bookmark: Bookmark) => {
    const iconClass = "w-4 h-4 text-muted-foreground"

    switch (bookmark.type) {
      case 'link':
        if (bookmark.favicon) {
          return (
            <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
              <img
                src={bookmark.favicon}
                alt=""
                className="w-5 h-5 rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML = '<svg class="w-4 h-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
                }}
              />
            </div>
          )
        }
        return (
          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
            <Link2 className={iconClass} />
          </div>
        )
      case 'text':
        return (
          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
            <FileText className={iconClass} />
          </div>
        )
      case 'image':
        return (
          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
            <Image className={iconClass} />
          </div>
        )
      case 'color':
        return (
          <div
            className="w-8 h-8 rounded-md ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: bookmark.color }}
          />
        )
      default:
        return (
          <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
            <Link2 className={iconClass} />
          </div>
        )
    }
  }

  const getSubtitle = (bookmark: Bookmark) => {
    switch (bookmark.type) {
      case 'link':
        try {
          const url = new URL(bookmark.url || '')
          return url.hostname.replace('www.', '')
        } catch {
          return bookmark.url
        }
      case 'color':
        return bookmark.color
      case 'text':
        return bookmark.content?.slice(0, 50)
      default:
        return null
    }
  }

  const getTypeBadge = (type: Bookmark['type']) => {
    switch (type) {
      case 'link':
        return null
      case 'text':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Note</Badge>
      case 'image':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Image</Badge>
      case 'color':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Color</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return <BookmarkListSkeleton />
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <BookmarkX className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">No bookmarks yet</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Paste a link, type some text, or add a color to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">
        <span>Title</span>
        <span>Created</span>
      </div>

      {/* Bookmarks */}
      <div className="divide-y divide-border">
        {bookmarks.map((bookmark, index) => {
          const isRenaming = renamingBookmarkId === bookmark._id
          const isSelected = selectedBookmarks.has(bookmark._id)
          const isDimmed = renamingBookmarkId && !isRenaming

          return (
            <ContextMenu key={bookmark._id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 transition-all duration-200 cursor-pointer",
                    "hover:bg-muted/50",
                    isSelected && "bg-primary/5 hover:bg-primary/10",
                    isDimmed && "opacity-40",
                    isRenaming && "bg-muted",
                    index === 0 && "animate-slide-up-fade"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => {
                    if (isSelectionMode) {
                      onToggleSelection(bookmark._id)
                    } else if (bookmark.type === 'link' && bookmark.url) {
                      handleOpenLink(bookmark.url)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isSelectionMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(bookmark._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}

                    {getBookmarkIcon(bookmark)}

                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <Input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRenameSubmit(bookmark._id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSubmit(bookmark._id)
                            }
                            if (e.key === 'Escape') {
                              onRenameComplete()
                            }
                          }}
                          className="h-7 py-0 px-2 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{bookmark.title}</span>
                          {getTypeBadge(bookmark.type)}
                          {getSubtitle(bookmark) && (
                            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                              {getSubtitle(bookmark)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {isRenaming ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-muted border border-border font-mono text-[10px]">Enter</kbd>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(bookmark.createdAt), 'MMM d')}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>{formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-52 animate-scale-in">
                {bookmark.type === 'link' && bookmark.url && (
                  <>
                    <ContextMenuItem onClick={() => handleOpenLink(bookmark.url!)} className="gap-2 cursor-pointer">
                      <ExternalLink className="h-4 w-4" />
                      Open link
                      <ContextMenuShortcut>↵</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleCopyUrl(bookmark.url!)} className="gap-2 cursor-pointer">
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}

                {bookmark.type === 'color' && bookmark.color && (
                  <>
                    <ContextMenuItem onClick={() => handleCopyColor(bookmark.color!)} className="gap-2 cursor-pointer">
                      <Palette className="h-4 w-4" />
                      Copy color
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}

                {bookmark.type === 'text' && bookmark.content && (
                  <>
                    <ContextMenuItem onClick={() => handleCopyText(bookmark.content!)} className="gap-2 cursor-pointer">
                      <Copy className="h-4 w-4" />
                      Copy text
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                  </>
                )}

                <ContextMenuItem onClick={() => handleRenameStart(bookmark)} className="gap-2 cursor-pointer">
                  <Pencil className="h-4 w-4" />
                  Rename
                  <ContextMenuShortcut>R</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={() => onEdit(bookmark)} className="gap-2 cursor-pointer">
                  <Pencil className="h-4 w-4" />
                  Edit details
                </ContextMenuItem>

                <ContextMenuSub>
                  <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                    <FolderOpen className="h-4 w-4" />
                    Move to
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    {groups.map(group => (
                      <ContextMenuItem
                        key={group._id}
                        onClick={() => handleMove(bookmark._id, group._id)}
                        className="gap-2 cursor-pointer"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full ring-1 ring-inset ring-black/10"
                          style={{ backgroundColor: group.color || '#6366f1' }}
                        />
                        {group.name}
                      </ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuItem onClick={() => onStartSelection(bookmark._id)} className="gap-2 cursor-pointer">
                  <CheckSquare className="h-4 w-4" />
                  Select
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  onClick={() => handleDelete(bookmark._id)}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                  <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
