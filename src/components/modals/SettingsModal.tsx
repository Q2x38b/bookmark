import { useState, useEffect, useRef } from "react"
import { useUser, useClerk } from "@clerk/clerk-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Download,
  Upload,
  Check,
  X,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  User,
  Globe,
  Database,
  AlertTriangle,
  Mail,
  Key,
  Shield,
  Trash2,
  ChevronRight,
  Camera,
  Lock,
  Smartphone,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useHaptics } from "@/hooks/useHaptics"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: Id<"users">
}

type TabType = "account" | "security" | "profile" | "data"

export function SettingsModal({ open, onOpenChange, userId }: SettingsModalProps) {
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Account tab state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSavingAccount, setIsSavingAccount] = useState(false)

  // Security state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Delete account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Public profile tab state
  const [publicProfile, setPublicProfile] = useState(false)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [githubUsername, setGithubUsername] = useState("")
  const [twitterUsername, setTwitterUsername] = useState("")
  const [website, setWebsite] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean
    available: boolean | null
    reason: string | null
  }>({ checking: false, available: null, reason: null })

  const convexUser = useQuery(
    api.users.getCurrentUser,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  )

  const usernameCheck = useQuery(
    api.users.checkUsernameAvailable,
    username.trim().length >= 3 && userId
      ? { username: username.trim(), currentUserId: userId }
      : "skip"
  )

  const updatePublicProfile = useMutation(api.users.updatePublicProfile)
  const deleteUser = useMutation(api.users.deleteUser)
  const haptics = useHaptics()

  // Initialize form values when user data loads
  useEffect(() => {
    if (clerkUser) {
      setFirstName(clerkUser.firstName || "")
      setLastName(clerkUser.lastName || "")
    }
    if (convexUser) {
      setPublicProfile(convexUser.publicProfile || false)
      setUsername(convexUser.username || "")
      setBio(convexUser.bio || "")
      setGithubUsername(convexUser.githubUsername || "")
      setTwitterUsername(convexUser.twitterUsername || "")
      setWebsite(convexUser.website || "")
    }
  }, [clerkUser, convexUser])

  // Update username status when check completes
  useEffect(() => {
    if (usernameCheck !== undefined) {
      setUsernameStatus({
        checking: false,
        available: usernameCheck.available,
        reason: usernameCheck.reason,
      })
    }
  }, [usernameCheck])

  // Set checking state when username changes
  useEffect(() => {
    if (username.trim().length >= 3) {
      setUsernameStatus((prev) => ({ ...prev, checking: true }))
    } else {
      setUsernameStatus({ checking: false, available: null, reason: null })
    }
  }, [username])

  const handleSaveAccount = async () => {
    if (!clerkUser) return

    setIsSavingAccount(true)
    try {
      await clerkUser.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      haptics.success()
      toast.success("Account updated")
    } catch {
      haptics.error()
      toast.error("Failed to save")
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleChangePassword = async () => {
    if (!clerkUser) return

    if (newPassword !== confirmPassword) {
      haptics.error()
      toast.error("Passwords don't match")
      return
    }

    if (newPassword.length < 8) {
      haptics.error()
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsChangingPassword(true)
    try {
      await clerkUser.updatePassword({
        currentPassword,
        newPassword,
      })
      haptics.success()
      toast.success("Password updated")
      setIsChangePasswordOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      haptics.error()
      const clerkError = err as { errors?: Array<{ message: string }> }
      toast.error(clerkError.errors?.[0]?.message || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return

    if (username.trim().length > 0 && username.trim().length < 3) {
      haptics.error()
      toast.error("Username must be at least 3 characters")
      return
    }

    if (usernameStatus.available === false && username.trim().length >= 3) {
      haptics.error()
      toast.error(usernameStatus.reason || "Username is not available")
      return
    }

    setIsSavingProfile(true)
    try {
      await updatePublicProfile({
        userId,
        publicProfile,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        githubUsername: githubUsername.trim() || undefined,
        twitterUsername: twitterUsername.trim() || undefined,
        website: website.trim() || undefined,
      })
      haptics.success()
      toast.success("Profile saved")
    } catch (error) {
      haptics.error()
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCopyProfileLink = () => {
    if (username) {
      navigator.clipboard.writeText(`${window.location.origin}/u/${username}`)
      haptics.success()
      toast.success("Profile link copied")
    }
  }

  const handleSignOut = () => {
    signOut()
    onOpenChange(false)
  }

  const handleUploadPhoto = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clerkUser) return

    try {
      await clerkUser.setProfileImage({ file })
      haptics.success()
      toast.success("Photo updated")
    } catch {
      haptics.error()
      toast.error("Failed to upload photo")
    }
  }

  const handleDeleteAccount = async () => {
    if (!clerkUser || !userId) return
    if (deleteConfirmation !== "delete my account") return

    setIsDeleting(true)
    try {
      await deleteUser({ userId })
      await clerkUser.delete()
      haptics.success()
      toast.success("Account deleted")
      onOpenChange(false)
    } catch {
      haptics.error()
      toast.error("Failed to delete account")
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (!clerkUser) return null

  const hasUnsavedAccount =
    firstName !== (clerkUser.firstName || "") ||
    lastName !== (clerkUser.lastName || "")

  const hasUnsavedProfile =
    publicProfile !== (convexUser?.publicProfile || false) ||
    username !== (convexUser?.username || "") ||
    bio !== (convexUser?.bio || "") ||
    githubUsername !== (convexUser?.githubUsername || "") ||
    twitterUsername !== (convexUser?.twitterUsername || "") ||
    website !== (convexUser?.website || "")

  const connectedAccounts = clerkUser.externalAccounts || []
  const hasPassword = clerkUser.passwordEnabled
  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "account", label: "Account", icon: <User className="h-4 w-4" /> },
    { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    { id: "profile", label: "Profile", icon: <Globe className="h-4 w-4" /> },
    { id: "data", label: "Data", icon: <Database className="h-4 w-4" /> },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden max-h-[80vh] sm:max-h-[85vh]" hideCloseButton>
          <div className="flex flex-col sm:flex-row sm:h-[520px] h-full max-h-[80vh] sm:max-h-[85vh]">
            {/* Mobile Tab Bar */}
            <div className="sm:hidden border-b border-border dark:bg-white/[0.02] bg-black/[0.02] shrink-0">
              <div className="flex items-center gap-0">
                {/* Scrollable tabs */}
                <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide flex-1 px-1 py-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] transition-colors shrink-0 ${
                        activeTab === tab.id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground active:bg-muted/50"
                      }`}
                    >
                      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  ))}
                </div>
                {/* Fixed close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center rounded-md p-1.5 mr-1 text-muted-foreground active:bg-muted/50 transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden sm:flex w-[160px] border-r border-border p-2 flex-col shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-muted-foreground">Settings</span>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                      activeTab === tab.id
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-2 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Account</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your account settings</p>
                  </div>

                  {/* Profile Picture */}
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage src={clerkUser.imageUrl} alt={clerkUser.fullName || "User"} />
                        <AvatarFallback className="text-base bg-muted">
                          {clerkUser.firstName?.[0] || primaryEmail?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        onClick={handleUploadPhoto}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="h-4 w-4 text-white" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {clerkUser.fullName || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{primaryEmail}</p>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">First name</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Last name</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email address</Label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground flex-1 min-w-0 truncate">{primaryEmail}</span>
                      {clerkUser.primaryEmailAddress?.verification?.status === "verified" && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connected Accounts */}
                  {connectedAccounts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Connected accounts</Label>
                      {connectedAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {account.provider === "google" ? (
                              <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            ) : (
                              <Globe className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground capitalize truncate">{account.provider}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {account.emailAddress || account.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save Button */}
                  {hasUnsavedAccount && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveAccount}
                        disabled={isSavingAccount}
                      >
                        {isSavingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        Save changes
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Security</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your security settings</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Password</Label>
                    <button
                      onClick={() => hasPassword && setIsChangePasswordOpen(true)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Key className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">Password</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {hasPassword ? "Change password" : "Set up a password"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs ${hasPassword ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {hasPassword ? "On" : "Off"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  </div>

                  {/* Two-Factor Auth */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Two-factor authentication</Label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">Two-factor auth</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Extra layer of security
                        </p>
                      </div>
                      <span className={`text-xs shrink-0 ${clerkUser.twoFactorEnabled ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {clerkUser.twoFactorEnabled ? "On" : "Off"}
                      </span>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Active sessions</Label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">Current session</p>
                        <p className="text-xs text-muted-foreground truncate">
                          This device • Active now
                        </p>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-3 border-t border-border space-y-2">
                    <Label className="text-xs text-red-400">Danger zone</Label>
                    <button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-red-400 truncate">Delete account</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Permanently delete account and data
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-400 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Public Profile</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Share your bookmarks publicly</p>
                  </div>

                  {/* Public Profile Toggle */}
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">Public profile</p>
                      <p className="text-xs text-muted-foreground truncate">Allow others to view bookmarks</p>
                    </div>
                    <Switch
                      checked={publicProfile}
                      onCheckedChange={setPublicProfile}
                      className="shrink-0"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Username</Label>
                    <div className="relative">
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="username"
                        maxLength={20}
                      />
                      {username.length >= 3 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameStatus.checking ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : usernameStatus.available === true ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : usernameStatus.available === false ? (
                            <X className="h-4 w-4 text-red-400" />
                          ) : null}
                        </div>
                      )}
                    </div>
                    {username && publicProfile && (
                      <p className="text-xs text-muted-foreground">
                        Your profile: {window.location.origin}/u/{username}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bio</Label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A short bio about yourself..."
                      className="flex min-h-[80px] w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border focus:bg-muted resize-none transition-colors"
                      maxLength={160}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">GitHub</Label>
                      <Input
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">X (Twitter)</Label>
                      <Input
                        value={twitterUsername}
                        onChange={(e) => setTwitterUsername(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value.replace(/^https?:\/\//, ""))}
                      placeholder="example.com"
                    />
                  </div>

                  {/* Profile Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {username && publicProfile && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyProfileLink}
                          className="gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/u/${username}`, "_blank")}
                          className="gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      </>
                    )}
                    {hasUnsavedProfile && (
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={handleSaveProfile}
                        disabled={
                          isSavingProfile ||
                          (username.length >= 3 && usernameStatus.available === false)
                        }
                      >
                        {isSavingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                        Save changes
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === "data" && (
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Data</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Export and import your bookmarks</p>
                  </div>

                  {/* Export */}
                  <button className="flex w-full items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-muted/50 border border-border hover:bg-muted active:bg-muted transition-colors text-left">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm text-foreground truncate">Export</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Download JSON</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>

                  {/* Import */}
                  <button className="flex w-full items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-muted/50 border border-border hover:bg-muted active:bg-muted transition-colors text-left">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm text-foreground truncate">Import</p>
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">From browser</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>

                  {/* Chrome Extension */}
                  <div className="pt-2 sm:pt-3 border-t border-border">
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-muted/50 border border-border">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] sm:text-sm text-foreground truncate">Extension</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Save from browser</p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs px-2">
                        Get
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Change password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="flex flex-col items-center text-center pt-2">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle>Delete account</DialogTitle>
              <DialogDescription className="text-center">
                This action cannot be undone. All your bookmarks, groups, and data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }}>
            <div className="space-y-3 py-4">
              <Label htmlFor="deleteConfirmation" className="text-xs text-muted-foreground">
                Type "delete my account" to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete my account"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting || deleteConfirmation !== "delete my account"}
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Delete account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
