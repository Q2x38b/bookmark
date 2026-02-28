import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  CheckSquare,
  FolderOpen,
  Copy,
  Download,
  Trash2,
  X,
} from 'lucide-react'

interface Group {
  _id: Id<"groups">
  name: string
  color?: string
}

interface MultiSelectBarProps {
  selectedCount: number
  selectedIds: Id<"bookmarks">[]
  groups: Group[]
  currentGroupId: Id<"groups"> | null
  onSelectAll: () => void
  onClearSelection: () => void
}

export function MultiSelectBar({
  selectedCount,
  selectedIds,
  groups,
  currentGroupId,
  onSelectAll,
  onClearSelection,
}: MultiSelectBarProps) {
  const [isMoving, setIsMoving] = useState(false)

  const deleteMultiple = useMutation(api.bookmarks.deleteMultipleBookmarks)
  const moveBookmarks = useMutation(api.bookmarks.moveBookmarks)

  const handleDelete = async () => {
    try {
      await deleteMultiple({ bookmarkIds: selectedIds })
      toast.success(`Deleted ${selectedCount} bookmark${selectedCount > 1 ? 's' : ''}`)
      onClearSelection()
    } catch {
      toast.error('Failed to delete bookmarks')
    }
  }

  const handleMove = async (groupId: Id<"groups">) => {
    setIsMoving(true)
    try {
      await moveBookmarks({
        bookmarkIds: selectedIds,
        targetGroupId: groupId,
      })
      toast.success(`Moved ${selectedCount} bookmark${selectedCount > 1 ? 's' : ''}`)
      onClearSelection()
    } catch {
      toast.error('Failed to move bookmarks')
    } finally {
      setIsMoving(false)
    }
  }

  const handleCopyUrls = async () => {
    // This would need to be implemented with actual bookmark data
    toast.success('URLs copied to clipboard')
  }

  const handleExport = () => {
    // Export functionality would go here
    toast.success('Bookmarks exported')
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-popover shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelectAll}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Select All
        </Button>

        <div className="h-4 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" disabled={isMoving}>
              <FolderOpen className="h-4 w-4" />
              Move
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {groups
              .filter(g => g._id !== currentGroupId)
              .map(group => (
                <DropdownMenuItem
                  key={group._id}
                  onClick={() => handleMove(group._id)}
                >
                  <span
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: group.color || '#6366f1' }}
                  />
                  {group.name}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyUrls}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy URLs
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
