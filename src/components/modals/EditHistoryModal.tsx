import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  History,
  RotateCcw,
  Loader2,
  Clock,
  Pencil,
  FolderInput,
  Plus,
  Trash2,
  ArrowRight,
  Link as LinkIcon,
  FileText,
  X,
  Undo2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useHaptics } from "@/hooks/useHaptics"

interface EditHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
}

type TabType = "activity" | "deleted"

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMins < 1) {
    return "Just now"
  } else if (diffInMins < 60) {
    return `${diffInMins}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }
}

export function EditHistoryModal({
  open,
  onOpenChange,
  userId,
}: EditHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("activity")
  const [restoringId, setRestoringId] = useState<Id<"bookmarkHistory"> | null>(null)
  const [restoringVersionId, setRestoringVersionId] = useState<Id<"bookmarkHistory"> | null>(null)
  const [clearingId, setClearingId] = useState<Id<"bookmarkHistory"> | null>(null)

  const history = useQuery(
    api.history.getUserHistory,
    open ? { userId, limit: 50 } : "skip"
  )

  const deletedBookmarks = useQuery(
    api.history.getDeletedBookmarks,
    open ? { userId } : "skip"
  )

  const restoreDeleted = useMutation(api.history.restoreDeletedBookmark)
  const restoreVersion = useMutation(api.history.restoreBookmarkVersion)
  const clearDeleted = useMutation(api.history.clearDeletedHistory)
  const haptics = useHaptics()

  const handleRestoreDeleted = async (historyId: Id<"bookmarkHistory">) => {
    setRestoringId(historyId)
    try {
      await restoreDeleted({ historyId })
      haptics.success()
      toast.success("Bookmark restored")
    } catch (error) {
      haptics.error()
      toast.error("Failed to restore bookmark")
    } finally {
      setRestoringId(null)
    }
  }

  const handleClearDeleted = async (historyId: Id<"bookmarkHistory">) => {
    setClearingId(historyId)
    try {
      await clearDeleted({ historyId })
      haptics.warning()
      toast.success("Permanently deleted")
    } catch (error) {
      haptics.error()
      toast.error("Failed to clear history")
    } finally {
      setClearingId(null)
    }
  }

  const handleRestoreVersion = async (historyId: Id<"bookmarkHistory">, bookmarkId: Id<"bookmarks">) => {
    setRestoringVersionId(historyId)
    try {
      await restoreVersion({ historyId, bookmarkId })
      haptics.success()
      toast.success("Bookmark restored to this version")
    } catch (error) {
      haptics.error()
      toast.error("Failed to restore version")
    } finally {
      setRestoringVersionId(null)
    }
  }

  const getActionIcon = (action: "created" | "updated" | "moved" | "deleted") => {
    switch (action) {
      case "created":
        return <Plus className="h-3 w-3" />
      case "updated":
        return <Pencil className="h-3 w-3" />
      case "moved":
        return <FolderInput className="h-3 w-3" />
      case "deleted":
        return <Trash2 className="h-3 w-3" />
    }
  }

  const getActionColor = (action: "created" | "updated" | "moved" | "deleted") => {
    switch (action) {
      case "created":
        return "bg-emerald-500/20 text-emerald-400"
      case "updated":
        return "bg-blue-500/20 text-blue-400"
      case "moved":
        return "bg-amber-500/20 text-amber-400"
      case "deleted":
        return "bg-red-500/20 text-red-400"
    }
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "link":
        return <LinkIcon className="h-3.5 w-3.5" />
      case "note":
        return <FileText className="h-3.5 w-3.5" />
      case "color":
        return <div className="h-3.5 w-3.5 rounded-sm bg-gradient-to-br from-pink-500 to-violet-500" />
      default:
        return <FileText className="h-3.5 w-3.5" />
    }
  }

  const isLoading = activeTab === "activity" ? history === undefined : deletedBookmarks === undefined
  const activityCount = history?.filter(h => h.action !== "deleted").length || 0
  const deletedCount = deletedBookmarks?.length || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Edit History
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              View recent changes and restore previous versions.
            </p>
          </DialogHeader>
        </div>

        <Separator />

        {/* Tabs */}
        <div className="px-4 sm:px-5 pt-3 sm:pt-4">
          <div className="flex rounded-lg bg-muted/50 p-1 gap-1">
            <button
              onClick={() => setActiveTab("activity")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                activeTab === "activity"
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Activity
              {activityCount > 0 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {activityCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("deleted")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                activeTab === "deleted"
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Deleted
              {deletedCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                  {deletedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto px-4 sm:px-5 py-3 sm:py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === "activity" ? (
            /* Activity Tab */
            history && history.filter(h => h.action !== "deleted").length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {history.filter(h => h.action !== "deleted").map((entry, index) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className={cn(
                        "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                        getActionColor(entry.action)
                      )}>
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {entry.bookmarkTitle}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTimestamp(entry.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {entry.action === "created" ? (
                            <span className="flex items-center gap-1">
                              Created in {entry.snapshotGroupName || "Unknown"}
                            </span>
                          ) : entry.action === "moved" ? (
                            <span className="flex items-center gap-1">
                              {entry.fromGroupName || "Unknown"}
                              <ArrowRight className="h-3 w-3" />
                              {entry.toGroupName || "Unknown"}
                            </span>
                          ) : entry.changes.title ? (
                            <span className="flex items-center gap-1 flex-wrap">
                              <span className="line-through text-red-400/70 truncate max-w-[100px]">
                                {entry.changes.title.from}
                              </span>
                              <ArrowRight className="h-3 w-3 shrink-0" />
                              <span className="text-emerald-400/90 truncate max-w-[100px]">
                                {entry.changes.title.to}
                              </span>
                            </span>
                          ) : entry.changes.content ? (
                            <span>Content updated</span>
                          ) : (
                            <span>Updated</span>
                          )}
                        </div>
                      </div>
                      {/* Restore button for updated/moved items when bookmark still exists */}
                      {entry.bookmarkExists && entry.bookmarkId && entry.action !== "created" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-7 px-2 gap-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                          onClick={() => handleRestoreVersion(entry._id, entry.bookmarkId!)}
                          disabled={restoringVersionId !== null}
                          title="Restore to this version"
                        >
                          {restoringVersionId === entry._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Undo2 className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">Restore</span>
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your bookmark changes will appear here
                </p>
              </div>
            )
          ) : (
            /* Deleted Tab */
            deletedBookmarks && deletedBookmarks.length > 0 ? (
              <div className="space-y-2">
                <AnimatePresence>
                  {deletedBookmarks.map((entry, index) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="shrink-0 h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        {getTypeIcon(entry.snapshot.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {entry.snapshot.title}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{formatTimestamp(entry.createdAt)}</span>
                          {entry.snapshotGroupName && (
                            <>
                              <span className="text-muted-foreground/50">·</span>
                              <span className={!entry.groupExists ? "line-through text-muted-foreground/50" : ""}>
                                {entry.snapshotGroupName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleRestoreDeleted(entry._id)}
                          disabled={restoringId !== null || clearingId !== null}
                        >
                          {restoringId === entry._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleClearDeleted(entry._id)}
                          disabled={restoringId !== null || clearingId !== null}
                          title="Delete permanently"
                        >
                          {clearingId === entry._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Trash2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No deleted bookmarks</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deleted bookmarks can be restored here
                </p>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
