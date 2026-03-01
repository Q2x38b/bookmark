import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { format } from 'date-fns'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank')
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
    switch (bookmark.type) {
      case 'link':
        if (bookmark.favicon) {
          return (
            <img
              src={bookmark.favicon}
              alt=""
              className="w-5 h-5 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )
        }
        return <Link2 className="w-5 h-5 text-muted-foreground" />
      case 'text':
        return <FileText className="w-5 h-5 text-muted-foreground" />
      case 'image':
        return <Image className="w-5 h-5 text-muted-foreground" />
      case 'color':
        return (
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: bookmark.color }}
          />
        )
      default:
        return <Link2 className="w-5 h-5 text-muted-foreground" />
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

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No bookmarks yet</p>
        <p className="text-sm mt-1 text-muted-foreground/70">Paste a link or type something to get started</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground border-b border-border">
        <span>Title</span>
        <span>Created At</span>
      </div>

      {/* Bookmarks */}
      <div className="divide-y divide-border">
        {bookmarks.map((bookmark) => {
          const isRenaming = renamingBookmarkId === bookmark._id
          const isSelected = selectedBookmarks.has(bookmark._id)
          const isDimmed = renamingBookmarkId && !isRenaming

          return (
            <ContextMenu key={bookmark._id}>
              <ContextMenuTrigger>
                <div
                  className={cn(
                    "group flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors duration-150 cursor-pointer",
                    isSelected && "bg-muted",
                    isDimmed && "opacity-30",
                    isRenaming && "bg-muted"
                  )}
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
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-medium truncate">{bookmark.title}</span>
                          {getSubtitle(bookmark) && (
                            <span className="text-sm text-muted-foreground truncate">
                              {getSubtitle(bookmark)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isRenaming ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-muted font-mono text-[11px]">Enter</kbd>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(bookmark.createdAt), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>

            <ContextMenuContent className="w-48">
              {bookmark.type === 'link' && bookmark.url && (
                <>
                  <ContextMenuItem onClick={() => handleOpenLink(bookmark.url!)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Link
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleCopyUrl(bookmark.url!)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}

              {bookmark.type === 'color' && bookmark.color && (
                <>
                  <ContextMenuItem onClick={() => handleCopyColor(bookmark.color!)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Color
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                </>
              )}

              <ContextMenuItem onClick={() => handleRenameStart(bookmark)}>
                <Pencil className="mr-2 h-4 w-4" />
                Quick Rename
              </ContextMenuItem>

              <ContextMenuItem onClick={() => onEdit(bookmark)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>

              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Move to
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {groups.map(group => (
                    <ContextMenuItem
                      key={group._id}
                      onClick={() => handleMove(bookmark._id, group._id)}
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: group.color || '#6366f1' }}
                      />
                      {group.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuItem onClick={() => onStartSelection(bookmark._id)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Select
              </ContextMenuItem>

              <ContextMenuSeparator />

              <ContextMenuItem
                onClick={() => handleDelete(bookmark._id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
        })}
      </div>
    </div>
  )
}
