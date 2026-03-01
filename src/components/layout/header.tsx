import { useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronDown, Plus, Settings, Moon, Sun, LogOut, Check } from 'lucide-react'
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
  const { signOut } = useClerk()
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
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo + Group Selector */}
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center">
                <LogoIcon className="h-6 w-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Pocket</p>
            </TooltipContent>
          </Tooltip>

          <span className="text-border">/</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2.5 font-normal">
                {currentGroup && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: currentGroup.color || '#22c55e' }}
                  />
                )}
                <span className="text-sm font-medium">{currentGroup?.name || 'Select Group'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 animate-slide-up-fade">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Groups
              </DropdownMenuLabel>
              {groups.map(group => (
                <DropdownMenuItem
                  key={group._id}
                  onClick={() => onGroupChange(group._id)}
                  className="gap-2.5 cursor-pointer"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: group.color || '#22c55e' }}
                  />
                  <span className="truncate flex-1">{group.name}</span>
                  {group._id === currentGroupId && (
                    <Check className="h-4 w-4 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="gap-2.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create new group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Theme Toggle + User Menu */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.imageUrl} alt={displayName} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:inline max-w-[100px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-slide-up-fade">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsOpen} className="gap-2.5 cursor-pointer">
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="gap-2.5 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[425px] gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Create new group</DialogTitle>
            <DialogDescription>
              Organize your bookmarks into groups for easy access.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
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
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <Tooltip key={color}>
                    <TooltipTrigger asChild>
                      <button
                        className={`w-8 h-8 rounded-full transition-all duration-200 ring-1 ring-inset ring-black/10 ${
                          newGroupColor === color
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/50 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewGroupColor(color)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{color}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end border-t px-6 py-4 gap-3 bg-muted/30">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              Create group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
