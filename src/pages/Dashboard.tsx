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
import { Loader2 } from "lucide-react"

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

  if (!isLoaded || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!groups) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentGroupId = selectedGroupId || groups[0]?._id

  if (!currentGroupId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex h-12 items-center justify-center bg-background px-4 sm:px-6">
        <div className="w-full max-w-xl flex items-center justify-between">
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
        </div>
      </header>

      {/* Main Content - scrollable area */}
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
