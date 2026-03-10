import { useState } from "react"
import { Doc, Id } from "../../../convex/_generated/dataModel"
import {
  Copy,
  Pencil,
  Trash2,
  FolderInput,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  ListChecks,
  Check,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetItem,
  BottomSheetSeparator,
  BottomSheetGroup,
} from "@/components/ui/bottom-sheet"
import { useHaptics } from "@/hooks/useHaptics"

interface MobileActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: Doc<"bookmarks">
  groups: Doc<"groups">[]
  onCopy: () => void
  onRename: () => void
  onDelete: () => void
  onMove: (groupId: Id<"groups">) => void
  onRefetch?: () => void
  onTogglePublic: () => void
  onSelectMultiple: () => void
  onShare?: () => void
}

export function MobileActionSheet({
  open,
  onOpenChange,
  bookmark,
  groups,
  onCopy,
  onRename,
  onDelete,
  onMove,
  onRefetch,
  onTogglePublic,
  onSelectMultiple,
  onShare,
}: MobileActionSheetProps) {
  const [view, setView] = useState<"main" | "move">("main")
  const haptics = useHaptics()

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset view when closing
      setTimeout(() => setView("main"), 200)
    }
    onOpenChange(isOpen)
  }

  const handleAction = (action: () => void) => {
    haptics.soft()
    action()
    handleOpenChange(false)
  }

  const handleMoveClick = () => {
    haptics.soft()
    setView("move")
  }

  const handleBackClick = () => {
    haptics.soft()
    setView("main")
  }

  const handleMoveToGroup = (groupId: Id<"groups">) => {
    haptics.success()
    onMove(groupId)
    handleOpenChange(false)
  }

  return (
    <BottomSheet open={open} onOpenChange={handleOpenChange}>
      {view === "main" ? (
        <>
          <BottomSheetHeader>
            <BottomSheetTitle>{bookmark.title}</BottomSheetTitle>
          </BottomSheetHeader>

          <BottomSheetContent>
            <BottomSheetGroup>
              <BottomSheetItem onClick={() => handleAction(onCopy)}>
                <Copy className="h-5 w-5 text-muted-foreground" />
                Copy
              </BottomSheetItem>

              <BottomSheetSeparator />

              <BottomSheetItem onClick={() => handleAction(onRename)}>
                <Pencil className="h-5 w-5 text-muted-foreground" />
                Rename
              </BottomSheetItem>

              {bookmark.type === "link" && onRefetch && (
                <>
                  <BottomSheetSeparator />
                  <BottomSheetItem onClick={() => handleAction(onRefetch)}>
                    <RefreshCw className="h-5 w-5 text-muted-foreground" />
                    Refresh Favicon
                  </BottomSheetItem>
                </>
              )}
            </BottomSheetGroup>

            <div className="h-2" />

            <BottomSheetGroup>
              <BottomSheetItem
                onClick={() => {
                  if (onShare) {
                    haptics.soft()
                    handleOpenChange(false)
                    // Small delay to let sheet close before opening modal
                    setTimeout(() => onShare(), 150)
                  }
                }}
              >
                <Globe className="h-5 w-5 text-muted-foreground" />
                Share
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </BottomSheetItem>

              <BottomSheetSeparator />

              <BottomSheetItem onClick={() => handleAction(onTogglePublic)}>
                {bookmark.isPublic ? (
                  <>
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                    Remove from Public Profile
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    Add to Public Profile
                  </>
                )}
              </BottomSheetItem>
            </BottomSheetGroup>

            <div className="h-2" />

            <BottomSheetGroup>
              <BottomSheetItem onClick={handleMoveClick}>
                <FolderInput className="h-5 w-5 text-muted-foreground" />
                Move to...
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </BottomSheetItem>

              <BottomSheetSeparator />

              <BottomSheetItem onClick={() => handleAction(onSelectMultiple)}>
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                Select Multiple
              </BottomSheetItem>
            </BottomSheetGroup>

            <div className="h-2" />

            <BottomSheetGroup>
              <BottomSheetItem
                variant="destructive"
                onClick={() => {
                  haptics.warning()
                  onDelete()
                  handleOpenChange(false)
                }}
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </BottomSheetItem>
            </BottomSheetGroup>
          </BottomSheetContent>
        </>
      ) : (
        <>
          <BottomSheetHeader>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackClick}
                className="p-1.5 -ml-1.5 rounded-lg active:bg-accent/50"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <BottomSheetTitle className="flex-1">Move to...</BottomSheetTitle>
            </div>
          </BottomSheetHeader>

          <BottomSheetContent>
            <BottomSheetGroup>
              {groups.map((group, index) => (
                <div key={group._id}>
                  {index > 0 && <BottomSheetSeparator />}
                  <BottomSheetItem onClick={() => handleMoveToGroup(group._id)}>
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="flex-1">{group.name}</span>
                    {group._id === bookmark.groupId && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </BottomSheetItem>
                </div>
              ))}
            </BottomSheetGroup>
          </BottomSheetContent>
        </>
      )}
    </BottomSheet>
  )
}
