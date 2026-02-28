import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Header } from '@/components/layout/header'
import { BookmarkBar } from '@/components/bookmark/bookmark-bar'
import { BookmarkList } from '@/components/bookmark/bookmark-list'
import { BookmarkModal } from '@/components/bookmark/bookmark-modal'
import { MultiSelectBar } from '@/components/bookmark/multi-select-bar'
import { SettingsModal } from '@/components/settings-modal'

export type BookmarkType = 'link' | 'text' | 'image' | 'color'

export interface Bookmark {
  _id: Id<"bookmarks">
  type: BookmarkType
  title: string
  url?: string
  favicon?: string
  content?: string
  color?: string
  imageUrl?: string
  createdAt: number
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [currentGroupId, setCurrentGroupId] = useState<Id<"groups"> | null>(null)
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<Id<"bookmarks">>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [renamingBookmarkId, setRenamingBookmarkId] = useState<Id<"bookmarks"> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Get or create user
  const getOrCreateUser = useMutation(api.users.getOrCreateUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  )

  // Initialize user in Convex
  useEffect(() => {
    if (user && isLoaded) {
      getOrCreateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      })
    }
  }, [user, isLoaded, getOrCreateUser])

  // Get groups for current user
  const groups = useQuery(
    api.groups.getGroups,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  )

  // Set initial group
  useEffect(() => {
    if (groups && groups.length > 0 && !currentGroupId) {
      setCurrentGroupId(groups[0]._id)
    }
  }, [groups, currentGroupId])

  // Get bookmarks for current group
  const bookmarks = useQuery(
    api.bookmarks.getBookmarks,
    currentUser?._id && currentGroupId
      ? { userId: currentUser._id, groupId: currentGroupId }
      : "skip"
  )

  // Search bookmarks
  const searchResults = useQuery(
    api.bookmarks.searchBookmarks,
    currentUser?._id && currentGroupId && searchQuery
      ? { userId: currentUser._id, groupId: currentGroupId, searchTerm: searchQuery }
      : "skip"
  )

  const displayedBookmarks = searchQuery ? searchResults : bookmarks

  const toggleBookmarkSelection = useCallback((id: Id<"bookmarks">) => {
    setSelectedBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      if (next.size === 0) {
        setIsSelectionMode(false)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedBookmarks(new Set())
    setIsSelectionMode(false)
  }, [])

  const handleSelectAll = useCallback(() => {
    if (displayedBookmarks) {
      setSelectedBookmarks(new Set(displayedBookmarks.map(b => b._id)))
    }
  }, [displayedBookmarks])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        groups={groups || []}
        currentGroupId={currentGroupId}
        onGroupChange={setCurrentGroupId}
        userId={currentUser?._id}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <BookmarkBar
          userId={currentUser?._id}
          groupId={currentGroupId}
          onSearch={setSearchQuery}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />

        <BookmarkList
          bookmarks={displayedBookmarks || []}
          selectedBookmarks={selectedBookmarks}
          isSelectionMode={isSelectionMode}
          renamingBookmarkId={renamingBookmarkId}
          onToggleSelection={toggleBookmarkSelection}
          onStartSelection={(id) => {
            setIsSelectionMode(true)
            setSelectedBookmarks(new Set([id]))
          }}
          onEdit={setEditingBookmark}
          onRename={setRenamingBookmarkId}
          onRenameComplete={() => setRenamingBookmarkId(null)}
          groups={groups || []}
        />
      </main>

      {isSelectionMode && selectedBookmarks.size > 0 && (
        <MultiSelectBar
          selectedCount={selectedBookmarks.size}
          selectedIds={Array.from(selectedBookmarks)}
          groups={groups || []}
          currentGroupId={currentGroupId}
          onSelectAll={handleSelectAll}
          onClearSelection={clearSelection}
        />
      )}

      <BookmarkModal
        isOpen={isCreateModalOpen || !!editingBookmark}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingBookmark(null)
        }}
        bookmark={editingBookmark}
        userId={currentUser?._id}
        groupId={currentGroupId}
        groups={groups || []}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
