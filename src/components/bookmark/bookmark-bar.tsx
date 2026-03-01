import { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Plus, Command, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface BookmarkBarProps {
  userId?: Id<"users">
  groupId: Id<"groups"> | null
  onSearch: (query: string) => void
  onCreateClick: () => void
}

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
// Color hex code regex
const COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
// Image URL regex
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i

function isUrl(text: string): boolean {
  return URL_REGEX.test(text) || text.startsWith('http://') || text.startsWith('https://')
}

function isColorCode(text: string): boolean {
  return COLOR_REGEX.test(text)
}

function isImageUrl(text: string): boolean {
  return IMAGE_URL_REGEX.test(text) && isUrl(text)
}

async function fetchMetadata(url: string): Promise<{ title: string; favicon: string }> {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(fullUrl)
    const domain = urlObj.hostname
    const title = domain.replace(/^www\./, '').split('.')[0]
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1)
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    return { title: capitalizedTitle, favicon }
  } catch {
    return { title: url, favicon: '' }
  }
}

export function BookmarkBar({
  userId,
  groupId,
  onSearch,
  onCreateClick,
}: BookmarkBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const createBookmark = useMutation(api.bookmarks.createBookmark)

  // Focus input on Cmd+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleInputChange = (value: string) => {
    setInputValue(value)
    onSearch(value)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text').trim()

    if (!userId || !groupId || !pastedText) return

    if (isUrl(pastedText) || isColorCode(pastedText)) {
      e.preventDefault()
      setIsProcessing(true)

      try {
        if (isColorCode(pastedText)) {
          await createBookmark({
            userId,
            groupId,
            type: 'color',
            title: pastedText,
            color: pastedText,
          })
          toast.success('Color saved')
        } else if (isImageUrl(pastedText)) {
          await createBookmark({
            userId,
            groupId,
            type: 'image',
            title: 'Image',
            imageUrl: pastedText.startsWith('http') ? pastedText : `https://${pastedText}`,
          })
          toast.success('Image saved')
        } else if (isUrl(pastedText)) {
          const { title, favicon } = await fetchMetadata(pastedText)
          await createBookmark({
            userId,
            groupId,
            type: 'link',
            title,
            url: pastedText.startsWith('http') ? pastedText : `https://${pastedText}`,
            favicon,
          })
          toast.success('Link saved')
        }

        setInputValue('')
        onSearch('')
      } catch (error) {
        console.error('Failed to create bookmark:', error)
        toast.error('Failed to save bookmark')
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim() && userId && groupId) {
      e.preventDefault()
      setIsProcessing(true)

      try {
        const text = inputValue.trim()

        if (isColorCode(text)) {
          await createBookmark({
            userId,
            groupId,
            type: 'color',
            title: text,
            color: text,
          })
          toast.success('Color saved')
        } else if (isImageUrl(text)) {
          await createBookmark({
            userId,
            groupId,
            type: 'image',
            title: 'Image',
            imageUrl: text.startsWith('http') ? text : `https://${text}`,
          })
          toast.success('Image saved')
        } else if (isUrl(text)) {
          const { title, favicon } = await fetchMetadata(text)
          await createBookmark({
            userId,
            groupId,
            type: 'link',
            title,
            url: text.startsWith('http') ? text : `https://${text}`,
            favicon,
          })
          toast.success('Link saved')
        } else {
          await createBookmark({
            userId,
            groupId,
            type: 'text',
            title: text.length > 50 ? text.slice(0, 50) + '...' : text,
            content: text,
          })
          toast.success('Note saved')
        }

        setInputValue('')
        onSearch('')
      } catch (error) {
        console.error('Failed to create bookmark:', error)
        toast.error('Failed to save bookmark')
      } finally {
        setIsProcessing(false)
      }
    }

    if (e.key === 'Escape') {
      setInputValue('')
      onSearch('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="mb-6">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg border bg-background transition-all duration-200",
          isFocused
            ? "border-ring ring-2 ring-ring/20 shadow-sm"
            : "border-border hover:border-muted-foreground/30"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onCreateClick}
              disabled={isProcessing || !userId || !groupId}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Create bookmark</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search or paste a link, color code, or text..."
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            disabled={isProcessing || !userId || !groupId}
          />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden sm:flex items-center gap-1 text-muted-foreground shrink-0">
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-muted border border-border font-mono text-[10px]">
                <Command className="h-3 w-3" />
              </kbd>
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-muted border border-border font-mono text-[10px]">
                F
              </kbd>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Focus search</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
