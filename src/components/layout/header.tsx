import { useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, Plus, Settings, FolderOpen } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

interface Group {
  _id: Id<"groups">
  name: string
  color?: string
}

interface HeaderProps {
  groups: Group[]
  currentGroupId: Id<"groups"> | null
  onGroupChange: (groupId: Id<"groups">) => void
  userId?: Id<"users">
  onSettingsOpen: () => void
}

export function Header({
  groups,
  currentGroupId,
  onGroupChange,
  userId,
  onSettingsOpen,
}: HeaderProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#6366f1')
  const { theme, setTheme } = useTheme()

  const createGroup = useMutation(api.groups.createGroup)

  const currentGroup = groups.find(g => g._id === currentGroupId)

  const handleCreateGroup = async () => {
    if (!userId || !newGroupName.trim()) return

    const groupId = await createGroup({
      userId,
      name: newGroupName.trim(),
      color: newGroupColor,
    })

    onGroupChange(groupId)
    setNewGroupName('')
    setIsCreateGroupOpen(false)
  }

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
  ]

  return (
    <header className="border-b border-border/40">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Group Selector */}
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-muted-foreground">/</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {currentGroup && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentGroup.color || '#6366f1' }}
                  />
                )}
                <span>{currentGroup?.name || 'Select Group'}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {groups.map(group => (
                <DropdownMenuItem
                  key={group._id}
                  onClick={() => onGroupChange(group._id)}
                  className="gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color || '#6366f1' }}
                  />
                  {group.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    }
                  }}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSettingsOpen} className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Work, Personal, Research"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup()
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newGroupColor === color ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-white/50' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroupColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end border-t px-6 py-4 gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
