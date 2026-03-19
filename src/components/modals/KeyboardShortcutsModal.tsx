import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { RotateCcw, Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-sm p-0 gap-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-foreground/[0.06]">
              <Keyboard className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">Keyboard Shortcuts</DialogTitle>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Click to customize</p>
            </div>
          </div>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                  tabIndex={-1}
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                Reset to defaults
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="py-2">
          {DEFAULT_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <span className="text-[13px] text-muted-foreground/80">{shortcut.label}</span>
              <button
                onClick={() => setEditingKey(shortcut.key)}
                className={`min-w-[60px] text-center font-mono text-[11px] px-2 py-1 rounded-md transition-all duration-150 ${
                  editingKey === shortcut.key
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50"
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

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border/50">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-8 px-4" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
