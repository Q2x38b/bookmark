import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { ChevronsUpDown, Plus, Pencil, Trash2, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const GROUP_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#0ea5e9", // Sky
  "#6b7280", // Gray
]

interface GroupDropdownProps {
  userId: Id<"users">
  selectedGroupId: Id<"groups"> | null
  onSelectGroup: (groupId: Id<"groups"> | null) => void
}

export function GroupDropdown({ userId, selectedGroupId, onSelectGroup }: GroupDropdownProps) {
  const groups = useQuery(api.groups.getGroups, { userId })
  const createGroup = useMutation(api.groups.createGroup)
  const updateGroup = useMutation(api.groups.updateGroup)
  const deleteGroup = useMutation(api.groups.deleteGroup)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<{ id: Id<"groups">; name: string; color: string } | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0])

  const selectedGroup = groups?.find(g => g._id === selectedGroupId) || groups?.[0]

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    await createGroup({
      userId,
      name: newGroupName.trim(),
      color: newGroupColor,
    })
    setNewGroupName("")
    setNewGroupColor(GROUP_COLORS[0])
    setIsCreateOpen(false)
  }

  const handleEditGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim()) return
    await updateGroup({
      groupId: editingGroup.id,
      name: editingGroup.name.trim(),
      color: editingGroup.color,
    })
    setEditingGroup(null)
    setIsEditOpen(false)
  }

  const handleDeleteGroup = async (groupId: Id<"groups">) => {
    if (groups && groups.length <= 1) {
      alert("You must have at least one group")
      return
    }
    await deleteGroup({ groupId })
    if (selectedGroupId === groupId) {
      onSelectGroup(null)
    }
  }

  if (!groups) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2.5 h-8 rounded-xl focus-visible:shadow-none active:scale-100 hover:bg-transparent data-[state=open]:bg-accent [&:hover:not([data-state=open])]:bg-accent !transition-none">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: selectedGroup?.color || GROUP_COLORS[0] }}
            />
            <span className="font-medium">{selectedGroup?.name || "General"}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 p-1 origin-top-left">
          {groups.map((group) => (
            <DropdownMenuItem
              key={group._id}
              className="gap-2 cursor-pointer text-[13px] h-7 px-2"
              onClick={() => onSelectGroup(group._id)}
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span className="flex-1 truncate">{group.name}</span>
              {selectedGroupId === group._id && (
                <Check className="h-3 w-3 ml-auto shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-[13px] h-7 px-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New group
          </DropdownMenuItem>
          {selectedGroup && (
            <>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-[13px] h-7 px-2"
                onClick={() => {
                  setEditingGroup({
                    id: selectedGroup._id,
                    name: selectedGroup.name,
                    color: selectedGroup.color,
                  })
                  setIsEditOpen(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit group
              </DropdownMenuItem>
              {groups.length > 1 && (
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2 cursor-pointer text-[13px] h-7 px-2"
                  onClick={() => handleDeleteGroup(selectedGroup._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete group
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Create group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b]">Name</Label>
              <Input
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b]">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-full rounded-lg transition-all",
                      newGroupColor === color
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#252525]"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroupColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Edit group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b]">Name</Label>
              <Input
                placeholder="Group name"
                value={editingGroup?.name || ""}
                onChange={(e) =>
                  setEditingGroup((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                onKeyDown={(e) => e.key === "Enter" && handleEditGroup()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#9b9b9b]">Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-full rounded-lg transition-all",
                      editingGroup?.color === color
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#252525]"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setEditingGroup((prev) =>
                        prev ? { ...prev, color } : null
                      )
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleEditGroup} disabled={!editingGroup?.name.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
