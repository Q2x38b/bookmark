import { useState, useEffect, Suspense, lazy, memo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Logo } from "@/components/Logo"
import { GroupDropdown } from "@/components/groups/GroupDropdown"
import { ProfileDropdown } from "@/components/profile/ProfileDropdown"
import { BookmarkList } from "@/components/bookmarks/BookmarkList"
import { Onboarding } from "@/components/Onboarding"
import { useUser } from "@/hooks/useUser"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load heavy modals
const KeyboardShortcutsModal = lazy(() => import("@/components/modals/KeyboardShortcutsModal").then(m => ({ default: m.KeyboardShortcutsModal })))

// Bookmark list skeleton - reusable component
export const BookmarkListSkeleton = memo(function BookmarkListSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 bg-background pt-8 pb-2 space-y-2 px-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex items-center gap-1.5 px-2 pb-2 border-b border-border/50">
          <Skeleton className="h-2.5 w-10" />
          <div className="flex-1" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      </div>
      <div className="px-3 space-y-0.5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-md" style={{ opacity: 1 - i * 0.08 }}>
            <Skeleton className="h-4 w-4 rounded-sm shrink-0" />
            <Skeleton className="h-3.5 flex-1 max-w-[200px]" />
            <div className="flex-1" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
})

export default function Dashboard() {
  const { userId, isLoaded } = useUser()
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  const groups = useQuery(
    api.groups.getGroups,
    userId ? { userId } : "skip"
  )

  const user = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip"
  )

  // Set default group when groups load
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0]._id)
    }
  }, [groups, selectedGroupId])

  const currentGroupId = selectedGroupId || groups?.[0]?._id
  const isLoading = !isLoaded || !userId || !groups

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header - show real header with logo immediately, skeleton only for data-dependent parts */}
      <header className="shrink-0 flex h-12 items-center justify-between bg-background px-4 sm:px-6 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-border">/</span>
          {isLoading || !currentGroupId ? (
            <Skeleton className="h-7 w-24 rounded-lg" />
          ) : (
            <GroupDropdown
              userId={userId}
              selectedGroupId={currentGroupId}
              onSelectGroup={(id) => setSelectedGroupId(id)}
            />
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-28 rounded-lg" />
        ) : (
          <ProfileDropdown
            userId={userId}
            userTheme={user?.theme}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        )}
      </header>

      {/* Main Content - centered with max-width */}
      <main className="flex-1 overflow-hidden flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl">
          {isLoading || !currentGroupId ? (
            <BookmarkListSkeleton />
          ) : (
            <BookmarkList
              userId={userId}
              groupId={currentGroupId}
              groups={groups}
            />
          )}
        </div>
      </main>

      {/* Lazy load modal only when needed */}
      {isShortcutsOpen && userId && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            open={isShortcutsOpen}
            onOpenChange={setIsShortcutsOpen}
            userId={userId}
            currentShortcuts={user?.keyboardShortcuts}
          />
        </Suspense>
      )}

      <Onboarding isNewUser />
    </div>
  )
}
