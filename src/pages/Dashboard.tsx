import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Logo } from "@/components/Logo"
import { GroupDropdown } from "@/components/groups/GroupDropdown"
import { ProfileDropdown } from "@/components/profile/ProfileDropdown"
import { BookmarkList } from "@/components/bookmarks/BookmarkList"
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcutsModal"
import { Onboarding } from "@/components/Onboarding"
import { useUser } from "@/hooks/useUser"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header skeleton */}
      <header className="shrink-0 flex h-10 items-center justify-between bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[22px] w-[22px] rounded" />
          <span className="text-muted-foreground/60">/</span>
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-32 rounded-xl" />
      </header>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-hidden flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="pt-4 pb-2 space-y-2 px-3">
            {/* Search input skeleton */}
            <Skeleton className="h-9 w-full rounded-md" />
            {/* Column headers skeleton */}
            <div className="flex items-center gap-1.5 px-2 pb-1.5 border-b border-border">
              <Skeleton className="h-3 w-12" />
              <div className="flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          {/* Bookmark rows skeleton */}
          <div className="px-3 space-y-0.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-md">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

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

  if (!isLoaded || !userId || !groups) {
    return <DashboardSkeleton />
  }

  const currentGroupId = selectedGroupId || groups[0]?._id

  if (!currentGroupId) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header - full width with items on edges */}
      <header className="shrink-0 flex h-10 items-center justify-between bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-muted-foreground/60">/</span>
          <GroupDropdown
            userId={userId}
            selectedGroupId={currentGroupId}
            onSelectGroup={(id) => setSelectedGroupId(id)}
          />
        </div>
        <ProfileDropdown
          userId={userId}
          userTheme={user?.theme}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      </header>

      {/* Main Content - centered with max-width */}
      <main className="flex-1 overflow-hidden flex justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl">
          <BookmarkList
            userId={userId}
            groupId={currentGroupId}
            groups={groups}
          />
        </div>
      </main>

      <KeyboardShortcutsModal
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
        userId={userId}
        currentShortcuts={user?.keyboardShortcuts}
      />

      <Onboarding isNewUser />
    </div>
  )
}
