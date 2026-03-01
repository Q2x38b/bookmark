import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { LogoIcon } from '@/components/logo'
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
import { ChevronDown, Plus, Settings, Moon, Sun } from 'lucide-react'
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
  const { user } = useUser()
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

  const displayName = user?.fullName || user?.firstName || 'User'
  const shortName = displayName.length > 15 ? displayName.slice(0, 15) + '...' : displayName

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo + Group Selector */}
        <div className="flex items-center gap-3">
          <LogoIcon className="h-6 w-6" />
          <span className="text-muted-foreground/50">/</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 font-normal">
                {currentGroup && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentGroup.color || '#22c55e' }}
                  />
                )}
                <span className="text-sm">{currentGroup?.name || 'Select Group'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {groups.map(group => (
                <DropdownMenuItem
                  key={group._id}
                  onClick={() => onGroupChange(group._id)}
                  className="gap-2.5"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color || '#22c55e' }}
                  />
                  <span className="truncate">{group.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="gap-2.5">
                <Plus className="h-4 w-4" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                )}
                <span className="text-sm hidden sm:inline">{shortName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onSettingsOpen} className="gap-2.5">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2.5"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[400px] gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-sm font-medium">Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Work, Personal, Research"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup()
                }}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 ${
                      newGroupColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/30 scale-110'
                        : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-background hover:ring-foreground/20'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroupColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end border-t px-6 py-4 gap-2 bg-muted/30">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} size="sm">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
