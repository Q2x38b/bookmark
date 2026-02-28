import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

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

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEditing ? 'Edit Bookmark' : 'Create Bookmark'}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as BookmarkType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="text">Note</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          {type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                placeholder="Enter your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {type === 'color' && (
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-md border border-border"
                  style={{ backgroundColor: color }}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-md transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-white/50' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {type === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden border border-border">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-40 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Group</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group._id} value={group._id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.color || '#6366f1' }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end border-t px-6 py-4 gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
