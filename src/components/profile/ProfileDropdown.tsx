import { useState, useEffect } from "react"
import { useClerk, useUser } from "@clerk/clerk-react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { ChevronsUpDown, Settings, LogOut, Moon, Sun, Monitor, Shield, Keyboard, Link, History } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SettingsModal } from "@/components/modals/SettingsModal"
import { ManageSharesModal } from "@/components/modals/ManageSharesModal"
import { EditHistoryModal } from "@/components/modals/EditHistoryModal"

type Theme = "light" | "dark" | "system"

interface ProfileDropdownProps {
  userId: Id<"users">
  userTheme?: Theme
  onOpenShortcuts?: () => void
}

export function ProfileDropdown({ userId, userTheme, onOpenShortcuts }: ProfileDropdownProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSharesOpen, setIsSharesOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(userTheme || "dark")

  const updateTheme = useMutation(api.users.updateTheme)

  useEffect(() => {
    if (userTheme) {
      setTheme(userTheme)
    }
  }, [userTheme])

  useEffect(() => {
    const root = document.documentElement

    // Disable transitions during theme switch to prevent animation flicker
    root.classList.add("theme-transition-disabled")

    // Remove both classes first to ensure clean state
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.add(systemDark ? "dark" : "light")
    } else {
      root.classList.add(theme)
    }

    // Re-enable transitions after styles have settled
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transition-disabled")
    }, 50)

    return () => clearTimeout(timeout)
  }, [theme])

  const handleSignOut = () => {
    signOut()
  }

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme)
    await updateTheme({ userId, theme: newTheme })
  }

  if (!user) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2 h-8 rounded-xl focus-visible:shadow-none active:scale-100 hover:bg-transparent data-[state=open]:bg-accent [&:hover:not([data-state=open])]:bg-accent !transition-none">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
              <AvatarFallback className="text-xs">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium hidden sm:inline">
              {user.fullName || user.firstName || "User"}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1 origin-top-right">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
              <AvatarFallback className="text-xs">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium leading-tight no-underline decoration-transparent truncate">
                {user.fullName || user.firstName || "User"}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight truncate">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={onOpenShortcuts}
          >
            <Keyboard className="h-4 w-4" />
            Keyboard shortcuts
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsSharesOpen(true)}
          >
            <Link className="h-4 w-4" />
            Shared Links
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            Edit History
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <div className="px-1 py-1">
            <div className="flex rounded-md bg-secondary dark:bg-white/[0.06] p-0.5 gap-0.5">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex flex-1 items-center justify-center rounded px-1.5 py-1 text-xs font-medium transition-all ${
                  theme === "light"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Sun className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={`flex flex-1 items-center justify-center rounded px-1.5 py-1 text-xs font-medium transition-all ${
                  theme === "system"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Monitor className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-1 items-center justify-center rounded px-1.5 py-1 text-xs font-medium transition-all ${
                  theme === "dark"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Moon className="h-3 w-3" />
              </button>
            </div>
          </div>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => window.open("/privacy", "_blank")}
          >
            <Shield className="h-4 w-4" />
            Privacy Policy
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} userId={userId} />
      <ManageSharesModal
        open={isSharesOpen}
        onOpenChange={setIsSharesOpen}
        userId={userId}
      />
      <EditHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        userId={userId}
      />
    </>
  )
}
