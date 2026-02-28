import { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Plus, Command } from 'lucide-react'
import { toast } from 'sonner'

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
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(fullUrl)
    const domain = urlObj.hostname

    // Use a simple title extraction - just use the domain for now
    // In production, you'd want a server-side metadata fetcher
    const title = domain.replace(/^www\./, '').split('.')[0]
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1)

    // Get favicon
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
    // Only search if there are bookmarks to search through
    onSearch(value)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text').trim()

    if (!userId || !groupId || !pastedText) return

    // Check if it's a quick-create scenario
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
          // Plain text
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
    <div className="mb-8">
      <div className="relative flex items-center">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:border-border/80 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-colors">
          <button
            onClick={onCreateClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isProcessing}
          >
            <Plus className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="Insert a link, color, or just plain text..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            disabled={isProcessing || !userId || !groupId}
          />
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">
              <Command className="h-3 w-3 inline" />
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">F</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
