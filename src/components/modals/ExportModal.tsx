import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id, Doc } from "../../../convex/_generated/dataModel"
import { Download, FileJson, FileSpreadsheet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  groups: Doc<"groups">[]
  selectedBookmarkIds?: Id<"bookmarks">[]
}

export function ExportModal({
  open,
  onOpenChange,
  userId,
  groups,
  selectedBookmarkIds,
}: ExportModalProps) {
  const [format, setFormat] = useState<"json" | "csv">("json")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")
  const [includeColors, setIncludeColors] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)

  const allBookmarks = useQuery(api.bookmarks.getBookmarks, { userId })

  const handleExport = () => {
    if (!allBookmarks) return

    let bookmarksToExport = allBookmarks

    // Filter by selected bookmarks if provided
    if (selectedBookmarkIds && selectedBookmarkIds.length > 0) {
      bookmarksToExport = allBookmarks.filter((b) =>
        selectedBookmarkIds.includes(b._id)
      )
    }
    // Filter by group if selected
    else if (selectedGroupId !== "all") {
      bookmarksToExport = allBookmarks.filter(
        (b) => b.groupId === selectedGroupId
      )
    }

    // Filter by type options
    if (!includeColors) {
      bookmarksToExport = bookmarksToExport.filter((b) => b.type !== "color")
    }
    if (!includeNotes) {
      bookmarksToExport = bookmarksToExport.filter((b) => b.type !== "note")
    }

    if (format === "json") {
      exportAsJson(bookmarksToExport)
    } else {
      exportAsCsv(bookmarksToExport)
    }

    onOpenChange(false)
  }

  const exportAsJson = (bookmarks: Doc<"bookmarks">[]) => {
    const data = bookmarks.map((b) => ({
      type: b.type,
      title: b.title,
      content: b.content,
      createdAt: new Date(b.createdAt).toISOString(),
      group: groups.find((g) => g._id === b.groupId)?.name || "Unknown",
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    downloadBlob(blob, "pocket-bookmarks.json")
  }

  const exportAsCsv = (bookmarks: Doc<"bookmarks">[]) => {
    const headers = ["Type", "Title", "Content", "Created At", "Group"]
    const rows = bookmarks.map((b) => [
      b.type,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${(b.content || b.url || "").replace(/"/g, '""')}"`,
      new Date(b.createdAt ?? 0).toISOString(),
      groups.find((g) => g._id === b.groupId)?.name || "Unknown",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    downloadBlob(blob, "pocket-bookmarks.csv")
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Bookmarks</DialogTitle>
          <p className="text-pretty text-sm text-muted-foreground">
            {selectedBookmarkIds?.length
              ? `Export ${selectedBookmarkIds.length} selected bookmark${selectedBookmarkIds.length !== 1 ? "s" : ""} to a file.`
              : "Export your bookmarks to a file for backup or migration."}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex space-x-2">
              <Button
                variant={format === "json" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setFormat("json")}
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={format === "csv" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setFormat("csv")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Group Filter */}
          {!selectedBookmarkIds?.length && (
            <div className="space-y-2">
              <Label>Filter by Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group._id} value={group._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type Filters */}
          <div className="space-y-3">
            <Label>Include Types</Label>
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
                  <span className="text-sm">Colors</span>
                </div>
                <Switch
                  id="includeColors"
                  checked={includeColors}
                  onCheckedChange={setIncludeColors}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded bg-muted" />
                  <span className="text-sm">Text/Notes</span>
                </div>
                <Switch
                  id="includeNotes"
                  checked={includeNotes}
                  onCheckedChange={setIncludeNotes}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
