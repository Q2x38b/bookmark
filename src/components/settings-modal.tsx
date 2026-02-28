import { useClerk, useUser } from '@clerk/clerk-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/components/theme-provider'
import { LogOut, Moon, Sun, Monitor, Check } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()

  const handleSignOut = () => {
    signOut()
    onClose()
  }

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="text-lg">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Account Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage your account settings
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'User'}
                  className="w-12 h-12 rounded-full ring-2 ring-background"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Appearance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize how Pocket looks
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200
                    ${theme === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {theme === value && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sign Out */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Session</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign out of your account
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full justify-center gap-2 h-10 text-muted-foreground hover:text-destructive hover:border-destructive/50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end border-t px-6 py-4">
          <Button onClick={onClose} size="sm">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
