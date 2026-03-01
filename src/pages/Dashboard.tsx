import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Header } from '@/components/layout/header'
import { BookmarkBar } from '@/components/bookmark/bookmark-bar'
import { BookmarkList, BookmarkListSkeleton } from '@/components/bookmark/bookmark-list'
import { BookmarkModal } from '@/components/bookmark/bookmark-modal'
import { MultiSelectBar } from '@/components/bookmark/multi-select-bar'
import { SettingsModal } from '@/components/settings-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { LogoIcon } from '@/components/logo'

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

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <LogoIcon className="h-10 w-10 animate-pulse-subtle" />
      <p className="text-sm text-muted-foreground">Loading your bookmarks...</p>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-4 w-px" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Search bar skeleton */}
        <div className="mb-6">
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>

        {/* Bookmark list skeleton */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <BookmarkListSkeleton />
        </div>
      </main>
    </div>
  )
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
  const isLoadingBookmarks = displayedBookmarks === undefined && currentGroupId !== null

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

  // Show loading screen while Clerk is loading
  if (!isLoaded) {
    return <LoadingScreen />
  }

  // Show skeleton while initial data is loading
  if (!currentUser || groups === undefined) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        groups={groups || []}
        currentGroupId={currentGroupId}
        onGroupChange={(groupId) => {
          setCurrentGroupId(groupId)
          setSearchQuery('')
        }}
        userId={currentUser?._id}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl animate-fade-in">
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
          isLoading={isLoadingBookmarks}
        />

        {searchQuery && displayedBookmarks && displayedBookmarks.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Found {displayedBookmarks.length} result{displayedBookmarks.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}
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
