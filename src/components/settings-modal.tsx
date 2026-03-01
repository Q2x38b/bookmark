import { useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, Download, Upload, Globe } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [displayName, setDisplayName] = useState(user?.fullName || '')

  const handleSignOut = () => {
    signOut()
    onClose()
  }

  const handleSave = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Manage your account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-auto">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="profile">Public Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              {/* Profile Picture */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {user?.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <Button variant="outline" size="sm" className="text-sm">
                    Upload a photo
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  value={user?.primaryEmailAddress?.emailAddress || ''}
                  disabled
                  className="h-10 bg-muted/50 text-muted-foreground"
                />
              </div>

              {/* Chrome Extension */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chrome Extension</Label>
                <Button variant="outline" className="w-full justify-start gap-3 h-10">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Get the Chrome Extension</span>
                </Button>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 h-10">
                    <Upload className="h-4 w-4" />
                    Export Bookmarks
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 h-10">
                    <Download className="h-4 w-4" />
                    Import Browser Bookmarks
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Public profile settings coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
