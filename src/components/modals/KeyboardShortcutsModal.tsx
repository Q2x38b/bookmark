import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { Keyboard, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

interface KeyboardShortcut {
  key: string
  label: string
  shortcut: string
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: "focusSearch", label: "Focus search", shortcut: "⌘F" },
  { key: "copyBookmark", label: "Copy bookmark", shortcut: "⌘C" },
  { key: "renameBookmark", label: "Rename bookmark", shortcut: "⌘E" },
  { key: "deleteBookmark", label: "Delete bookmark", shortcut: "⌘⌫" },
  { key: "selectAll", label: "Select all", shortcut: "⌘A" },
  { key: "toggleSelect", label: "Toggle select", shortcut: "Space" },
  { key: "navigateUp", label: "Navigate up", shortcut: "↑" },
  { key: "navigateDown", label: "Navigate down", shortcut: "↓" },
  { key: "exitSelection", label: "Exit selection", shortcut: "Esc" },
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: Id<"users">
  currentShortcuts?: {
    focusSearch?: string
    copyBookmark?: string
    renameBookmark?: string
    deleteBookmark?: string
    selectAll?: string
    toggleSelect?: string
    navigateUp?: string
    navigateDown?: string
    exitSelection?: string
  }
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
  userId,
  currentShortcuts,
}: KeyboardShortcutsModalProps) {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  const updateShortcuts = useMutation(api.users.updateKeyboardShortcuts)

  useEffect(() => {
    const initialShortcuts: Record<string, string> = {}
    DEFAULT_SHORTCUTS.forEach((s) => {
      initialShortcuts[s.key] = currentShortcuts?.[s.key as keyof typeof currentShortcuts] || s.shortcut
    })
    setShortcuts(initialShortcuts)
  }, [currentShortcuts, open])

  useEffect(() => {
    if (!editingKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      if (e.metaKey) keys.push("⌘")
      if (e.ctrlKey) keys.push("Ctrl")
      if (e.altKey) keys.push("⌥")
      if (e.shiftKey) keys.push("⇧")

      const keyMap: Record<string, string> = {
        ArrowUp: "↑",
        ArrowDown: "↓",
        ArrowLeft: "←",
        ArrowRight: "→",
        Backspace: "⌫",
        Delete: "Del",
        Enter: "↵",
        Escape: "Esc",
        " ": "Space",
        Tab: "Tab",
      }

      const displayKey = keyMap[e.key] || e.key.toUpperCase()

      if (!["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
        keys.push(displayKey)
      }

      if (keys.length > 0 && !["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
        const shortcut = keys.join("")
        setShortcuts((prev) => ({ ...prev, [editingKey]: shortcut }))
        setEditingKey(null)
        setRecordedKeys([])
      } else {
        setRecordedKeys(keys)
      }
    }

    const handleKeyUp = () => {
      setRecordedKeys([])
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [editingKey])

  const handleSave = async () => {
    await updateShortcuts({
      userId,
      keyboardShortcuts: shortcuts,
    })
    toast.success("Keyboard shortcuts saved")
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultShortcuts: Record<string, string> = {}
    DEFAULT_SHORTCUTS.forEach((s) => {
      defaultShortcuts[s.key] = s.shortcut
    })
    setShortcuts(defaultShortcuts)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <p className="text-pretty text-sm text-muted-foreground">
            Customize keyboard shortcuts to match your workflow.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" />
              Shortcuts
            </div>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleReset}
                    tabIndex={-1}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-xs">
                  Reset to defaults
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="rounded-lg border border-border">
            {DEFAULT_SHORTCUTS.map((shortcut, index) => (
              <div
                key={shortcut.key}
                className={`flex items-center justify-between px-3 py-2.5 ${
                  index !== DEFAULT_SHORTCUTS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm">{shortcut.label}</span>
                <button
                  onClick={() => setEditingKey(shortcut.key)}
                  className={`min-w-[72px] text-center font-mono text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    editingKey === shortcut.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {editingKey === shortcut.key
                    ? recordedKeys.length > 0
                      ? recordedKeys.join("")
                      : "..."
                    : shortcuts[shortcut.key] || shortcut.shortcut}
                </button>
              </div>
            ))}
          </div>

          <div className="flex space-x-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
