import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Link2, FileText, Palette, Image, Check, FolderOpen } from 'lucide-react'

type BookmarkType = 'link' | 'text' | 'image' | 'color'

interface Bookmark {
  _id: Id<"bookmarks">
  type: BookmarkType
  title: string
  url?: string
  favicon?: string
  content?: string
  color?: string
  imageUrl?: string
  groupId?: Id<"groups">
}

interface Group {
  _id: Id<"groups">
  name: string
  color?: string
}

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  bookmark: Bookmark | null
  userId?: Id<"users">
  groupId: Id<"groups"> | null
  groups: Group[]
}

const typeOptions = [
  { value: 'link' as const, label: 'Link', icon: Link2, description: 'Save a URL' },
  { value: 'text' as const, label: 'Note', icon: FileText, description: 'Save text' },
  { value: 'color' as const, label: 'Color', icon: Palette, description: 'Save a color' },
  { value: 'image' as const, label: 'Image', icon: Image, description: 'Save an image' },
]

const colors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
]

export function BookmarkModal({
  isOpen,
  onClose,
  bookmark,
  userId,
  groupId,
  groups,
}: BookmarkModalProps) {
  const [type, setType] = useState<BookmarkType>('link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  const createBookmark = useMutation(api.bookmarks.createBookmark)
  const updateBookmark = useMutation(api.bookmarks.updateBookmark)

  const isEditing = !!bookmark

  useEffect(() => {
    if (bookmark) {
      setType(bookmark.type)
      setTitle(bookmark.title)
      setUrl(bookmark.url || '')
      setContent(bookmark.content || '')
      setColor(bookmark.color || '#6366f1')
      setImageUrl(bookmark.imageUrl || '')
      setSelectedGroupId(bookmark.groupId || groupId || '')
    } else {
      setType('link')
      setTitle('')
      setUrl('')
      setContent('')
      setColor('#6366f1')
      setImageUrl('')
      setSelectedGroupId(groupId || '')
    }
  }, [bookmark, groupId, isOpen])

  const handleSubmit = async () => {
    if (!userId || !selectedGroupId) return

    try {
      if (isEditing && bookmark) {
        await updateBookmark({
          bookmarkId: bookmark._id,
          title,
          url: type === 'link' ? url : undefined,
          content: type === 'text' ? content : undefined,
          color: type === 'color' ? color : undefined,
          imageUrl: type === 'image' ? imageUrl : undefined,
          groupId: selectedGroupId as Id<"groups">,
        })
        toast.success('Bookmark updated')
      } else {
        await createBookmark({
          userId,
          groupId: selectedGroupId as Id<"groups">,
          type,
          title,
          url: type === 'link' ? url : undefined,
          content: type === 'text' ? content : undefined,
          color: type === 'color' ? color : undefined,
          imageUrl: type === 'image' ? imageUrl : undefined,
        })
        toast.success('Bookmark created')
      }
      onClose()
    } catch {
      toast.error(isEditing ? 'Failed to update bookmark' : 'Failed to create bookmark')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit Bookmark' : 'New Bookmark'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Type Selection */}
          {!isEditing && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {typeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setType(value)}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200
                      ${type === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {type === value && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-1.5 w-1.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Type-specific fields */}
          {type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium">URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          )}

          {type === 'color' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shadow-sm flex-shrink-0 transition-all duration-200"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  className="h-10 font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`
                      aspect-square rounded-md transition-all duration-200
                      ${color === c
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                        : 'hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {type === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="h-10"
              />
              {imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border bg-muted/30">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-32 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Group Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              Group
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color || '#6366f1' }}
                      />
                      <span>{group.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end border-t px-6 py-4 gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
